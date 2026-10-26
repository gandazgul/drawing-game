import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, stat, readFile } from "node:fs/promises";
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
  const args =
    auth === "adc"
      ? ["auth", "application-default", "print-access-token", "--quiet"]
      : ["auth", "print-access-token", "--quiet"];
  try {
    const { stdout } = await promisify(execFile)("gcloud", args, { timeout: 30000 });
    const token = stdout.trim();
    if (token) return token;
  } catch {
    // Never expose subprocess output: it may contain credentials.
  }
  throw new Error(
    `Google ${auth} credentials unavailable. Sign in locally with gcloud before generating audio.`,
  );
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const jobs = await Promise.all(
    VOICE_AUDITIONS.map(async (line) => {
      const request = speechRequest(line.speaker, line.text);
      const fingerprint = await speechFingerprint(request);
      return { ...line, request, fingerprint, file: `${line.id}-${fingerprint.slice(0, 16)}.mp3` };
    }),
  );
  console.log(
    options.generate
      ? `Paid audition: project ${options.project}`
      : "Dry run: no authentication, network calls, or charges.",
  );
  for (const job of jobs) console.log(`${job.speaker} / ${job.request.voice.name}: ${job.text}`);
  if (!options.generate) {
    console.log("To generate these THREE samples: pnpm voices:audition --generate --project YOUR_PROJECT_ID");
    return;
  }
  // Exactly three short samples at most; no automatic retries or model/voice fallback.
  // A timed-out request may still be billed by Google. Do not retry blindly.
  await mkdir(output, { recursive: true });
  let token;
  for (const job of jobs) {
    const audioPath = new URL(job.file, output);
    const metadataPath = new URL(`${job.file}.json`, output);
    if (await exists(audioPath)) {
      const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      if (metadata.fingerprint !== job.fingerprint || (await stat(audioPath)).size < 32) {
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
    await writeFile(audioPath, bytes, { flag: "wx" });
    await writeFile(
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
      { flag: "wx" },
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
    process.exitCode = 1;
  }
}
