import { speechFingerprint, speechRequest, VOICE_AUDITIONS } from "../src/voices.js";

const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const output = new URL("../assets/audio/auditions/", import.meta.url);

export function parseOptions(args) {
  const options = { generate: false, project: null, auth: "adc" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--generate") options.generate = true;
    else if (args[i] === "--auth") {
      const auth = args[++i];
      if (!["adc", "gcloud"].includes(auth)) throw new Error("--auth must be adc or gcloud.");
      options.auth = auth;
    } else if (args[i] === "--project") {
      const project = args[++i];
      if (!project || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)) {
        throw new Error("--project requires a Google Cloud project ID.");
      }
      options.project = project;
    } else throw new Error(`Unknown option: ${args[i]}`);
  }
  if (options.generate && !options.project) throw new Error("Paid generation requires --project PROJECT_ID.");
  return options;
}

export async function accessToken(auth) {
  const result = await new Deno.Command("gcloud", {
    args: auth === "adc"
      ? ["auth", "application-default", "print-access-token", "--quiet"]
      : ["auth", "print-access-token", "--quiet"],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();
  const token = new TextDecoder().decode(result.stdout).trim();
  if (!result.success || !token) {
    throw new Error(
      `Google ${auth} credentials unavailable. Sign in locally with gcloud before generating audio.`,
    );
  }
  return token;
}

async function exists(path) {
  try {
    return (await Deno.stat(path)).isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function main() {
  const options = parseOptions(Deno.args);
  const jobs = await Promise.all(VOICE_AUDITIONS.map(async (line) => {
    const request = speechRequest(line.speaker, line.text);
    const fingerprint = await speechFingerprint(request);
    return { ...line, request, fingerprint, file: `${line.id}-${fingerprint.slice(0, 16)}.mp3` };
  }));
  console.log(
    options.generate
      ? `Paid audition: project ${options.project}`
      : "Dry run: no authentication, network calls, or charges.",
  );
  for (const job of jobs) console.log(`${job.speaker} / ${job.request.voice.name}: ${job.text}`);
  if (!options.generate) {
    console.log(
      "To generate these THREE samples: deno task voices:audition --generate --project YOUR_PROJECT_ID",
    );
    return;
  }
  // Exactly three short samples at most; no automatic retries or model/voice fallback.
  // A timed-out request may still be billed by Google. Do not retry blindly.
  await Deno.mkdir(output, { recursive: true });
  let token;
  for (const job of jobs) {
    const audioPath = new URL(job.file, output);
    const metadataPath = new URL(`${job.file}.json`, output);
    if (await exists(audioPath)) {
      const metadata = JSON.parse(await Deno.readTextFile(metadataPath));
      if (metadata.fingerprint !== job.fingerprint || (await Deno.stat(audioPath)).size < 32) {
        throw new Error(`Inspect incomplete cached audio: ${audioPath.pathname}`);
      }
      console.log(`Cached: ${audioPath.pathname}`);
      continue;
    }
    if (await exists(metadataPath)) throw new Error(`Inspect orphaned metadata: ${metadataPath.pathname}`);
    token ??= await accessToken(options.auth);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": options.project,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job.request),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) {
      // Do not log raw responses, credentials, or request headers.
      throw new Error(
        `Google TTS HTTP ${response.status}. Check billing, Cloud Text-to-Speech API enablement, ADC permissions and model availability. No retry was made.`,
      );
    }
    const data = await response.json();
    if (typeof data.audioContent !== "string" || !data.audioContent) {
      throw new Error("Google returned no audio. No retry was made.");
    }
    const bytes = Uint8Array.from(atob(data.audioContent), (char) => char.charCodeAt(0));
    const mp3 = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    if (bytes.length < 32 || !(mp3 || id3)) throw new Error("Response is not recognizable MP3 audio.");
    await Deno.writeFile(audioPath, bytes, { createNew: true });
    await Deno.writeTextFile(
      metadataPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          provider: "Google Cloud Text-to-Speech",
          aiGenerated: true,
          speaker: job.speaker,
          fingerprint: job.fingerprint,
          request: job.request,
        },
        null,
        2,
      ) + "\n",
      { createNew: true },
    );
    console.log(`Saved AI-generated voice audition: ${audioPath.pathname}`);
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    // Fixed messages from this script are safe; never dump subprocess output.
    console.error(error instanceof Error ? error.message : "Voice audition failed.");
    Deno.exitCode = 1;
  }
}
