import { accessToken, parseOptions } from "./voice-audition.js";
import { dialogueKey, dialogueVoice, spokenLines } from "../src/dialogue.js";
import { OLIVIA_RECAST, speechFingerprint, speechRequest } from "../src/voices.js";

const root = new URL("../assets/audio/", import.meta.url);
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
// Configure a separate project and budget before generating new recordings.
const project = "YOUR_GOOGLE_CLOUD_PROJECT";
const cap = 5;
export const reservation = .35;
export const canReserve = (entries) =>
  entries.reduce((sum, entry) => sum + entry.usd, 0) + reservation <= cap;

async function saveJSON(name, value) {
  const target = new URL(name, root);
  const temporary = new URL(`${name}.tmp`, root);
  await Deno.writeTextFile(temporary, JSON.stringify(value, null, 2) + "\n");
  await Deno.rename(temporary, target);
}

async function duration(path) {
  const result = await new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path.pathname,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const seconds = Number(new TextDecoder().decode(result.stdout).trim());
  if (!result.success || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("Audio duration could not be verified.");
  }
  return seconds;
}

async function main() {
  const recast = Deno.args.includes("--recast-olivia");
  const options = parseOptions(Deno.args.filter((arg) => arg !== "--recast-olivia"));
  const jobs = await Promise.all(
    (recast ? OLIVIA_RECAST : spokenLines()).map(async (line) => {
      const request = line.request ?? speechRequest(dialogueVoice(line.speaker), line.text);
      return { ...line, request, fingerprint: await speechFingerprint(request) };
    }),
  );
  if (!options.generate) {
    console.log(`Dry run: ${jobs.length} dialogue lines; no requests or charges.`);
    return;
  }
  if (options.project !== project) throw new Error(`This budget is authorized only for ${project}.`);
  await Deno.mkdir(new URL("dialogue/", root), { recursive: true });
  const lockPath = new URL("generation.lock", root);
  const lock = await Deno.open(lockPath, { createNew: true, write: true });
  try {
    let ledger;
    try {
      ledger = JSON.parse(await Deno.readTextFile(new URL("budget.json", root)));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      ledger = {
        project,
        capUSD: cap,
        entries: [{ id: "approved-auditions", usd: .02, status: "conservative-estimate" }],
      };
    }
    if (
      ledger.project !== project || ledger.capUSD !== cap || !Array.isArray(ledger.entries) ||
      ledger.entries.some((e) => !Number.isFinite(e.usd) || e.usd < 0)
    ) {
      throw new Error("Invalid budget ledger; inspect before making requests.");
    }
    const cached = new Map();
    for (const folder of ["auditions", "dialogue"]) {
      for await (const entry of Deno.readDir(new URL(`${folder}/`, root))) {
        if (!entry.name.endsWith(".mp3.json")) continue;
        const metadata = JSON.parse(await Deno.readTextFile(new URL(`${folder}/${entry.name}`, root)));
        const path = `${folder}/${entry.name.slice(0, -5)}`;
        if ((await Deno.stat(new URL(path, root))).size < 32) {
          throw new Error(`Invalid cached audio: ${path}`);
        }
        cached.set(metadata.fingerprint, path);
      }
    }
    const manifest = {};
    let token;
    for (const job of jobs) {
      let file = cached.get(job.fingerprint);
      if (!file) {
        if (!canReserve(ledger.entries)) {
          throw new Error(`Stopping before exceeding the $${cap} budget. No request sent.`);
        }
        token ??= await accessToken(options.auth);
        const entry = {
          id: job.fingerprint,
          usd: reservation,
          status: "reserved",
          at: new Date().toISOString(),
        };
        ledger.entries.push(entry);
        // Persist BEFORE the paid call. An interruption or unknown outcome keeps
        // its worst-case reservation; never refund a timeout automatically.
        await saveJSON("budget.json", ledger);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-goog-user-project": project,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(job.request),
          signal: AbortSignal.timeout(90000),
        });
        if (!response.ok) {
          throw new Error(
            `Google TTS HTTP ${response.status}; no automatic retry. Budget reservation retained.`,
          );
        }
        const data = await response.json();
        if (!data.audioContent) throw new Error("No audio returned; reservation retained.");
        const bytes = Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0));
        file = `dialogue/${job.fingerprint}.mp3`;
        const audioPath = new URL(file, root);
        await Deno.writeFile(audioPath, bytes, { createNew: true });
        const seconds = await duration(audioPath);
        const metadata = {
          aiGenerated: true,
          provider: "Google Cloud Text-to-Speech",
          generatedAt: new Date().toISOString(),
          speaker: job.speaker,
          fingerprint: job.fingerprint,
          request: job.request,
          seconds,
        };
        await Deno.writeTextFile(new URL(`${file}.json`, root), JSON.stringify(metadata, null, 2) + "\n", {
          createNew: true,
        });
        // Published rate: 25 audio tokens/sec at $20/M. Allow the full
        // 8192 input-token limit plus margin, instead of guessing text tokens.
        entry.usd = Math.min(reservation, Math.ceil((seconds * .0005 + .009) * 1.1 * 10000) / 10000);
        entry.status = "conservative-estimate";
        entry.seconds = seconds;
        await saveJSON("budget.json", ledger);
        console.log(`Generated ${job.speaker}: ${seconds.toFixed(2)}s`);
      } else console.log(`Reused ${job.speaker}: ${job.text}`);
      manifest[dialogueKey(job.speaker, job.text)] = file;
    }
    await saveJSON(recast ? "olivia-recast.json" : "manifest.json", manifest);
    console.log(
      `Ready: ${jobs.length} lines. Budget ledger estimate/reservations: $${
        ledger.entries.reduce((n, e) => n + e.usd, 0).toFixed(4)
      } / $${cap}.`,
    );
  } finally {
    lock.close();
    await Deno.remove(lockPath);
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Dialogue generation failed.");
    Deno.exitCode = 1;
  }
}
