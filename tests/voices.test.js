import { assert, test } from "vite-plus/test";
import { OLIVIA_RECAST, speechFingerprint, speechRequest, VOICE_AUDITIONS } from "../src/voices.js";
import { parseOptions } from "../scripts/voice-audition.js";

test("approved Gemini casting and MP3 format are explicit", () => {
  assert.deepEqual(speechRequest("Keila", "Hello").voice, {
    languageCode: "en-US",
    name: "Autonoe",
    modelName: "gemini-3.1-flash-tts-preview",
  });
  assert.deepEqual(speechRequest("Olivia", "Hello").voice.name, "Sulafat");
  assert.deepEqual(speechRequest("Olivia", "Hello").audioConfig.audioEncoding, "MP3");
  assert.deepEqual(speechRequest("Narrator", "Hello").voice.name, "Enceladus");
  assert.deepEqual(VOICE_AUDITIONS.length, 3);
});

test("unapproved speakers and invalid dialogue cannot silently use another voice", () => {
  assert.throws(() => speechRequest("Uncast character", "Hello"));
  assert.throws(() => speechRequest("toString", "Hello"));
  assert.throws(() => speechRequest("Keila", " "));
  assert.throws(() => speechRequest("Keila", "a".repeat(1001)));
});

test("auditions default to a free dry run and require an explicit project to generate", () => {
  assert.deepEqual(parseOptions([]), { generate: false, project: null, auth: "adc" });
  assert.deepEqual(parseOptions(["--auth", "gcloud"]).auth, "gcloud");
  assert.throws(() => parseOptions(["--auth", "unknown"]));
  assert.throws(() => parseOptions(["--generate"]));
  assert.throws(() => parseOptions(["--project"]));
  assert.throws(() => parseOptions(["--project", "../../wrong"]));
  assert.throws(() => parseOptions(["--other"]));
  assert.deepEqual(parseOptions(["--generate", "--project", "drawing-game-demo"]), {
    generate: true,
    project: "drawing-game-demo",
    auth: "adc",
  });
});

test("audio cache keys cover dialogue, speaker, direction and model", async () => {
  const original = speechRequest("Keila", "Hello");
  const key = await speechFingerprint(original);
  assert.deepEqual(await speechFingerprint(speechRequest("Keila", "Hello")), key);
  assert.notDeepEqual(await speechFingerprint(speechRequest("Keila", "Goodbye")), key);
  assert.notDeepEqual(await speechFingerprint(speechRequest("Olivia", "Hello")), key);
  assert.notDeepEqual(
    await speechFingerprint({ ...original, input: { ...original.input, prompt: "Quiet" } }),
    key,
  );
  assert.notDeepEqual(
    await speechFingerprint({ ...original, voice: { ...original.voice, modelName: "other" } }),
    key,
  );
});

test("Olivia uses the selected Sulafat audition voice and delivery", () => {
  assert.deepEqual(
    OLIVIA_RECAST.map((job) => job.request.voice.name),
    ["Sulafat", "Gacrux"],
  );
  assert.deepEqual(speechRequest("Olivia", "Hello").voice.name, "Sulafat");
  assert.deepEqual(
    speechRequest("Olivia", OLIVIA_RECAST[0].text).input.prompt,
    OLIVIA_RECAST[0].request.input.prompt,
  );
  assert.deepEqual(OLIVIA_RECAST[0].text, OLIVIA_RECAST[1].text);
  for (const job of OLIVIA_RECAST) {
    assert.deepEqual(job.request.input.text, job.text.replace("Keila", "Keh-ila"));
  }
});

test("Keila pronunciation changes speech only, for every speaker", async () => {
  const caption = "Keila, come look at Keila's sail!";
  for (const speaker of ["Keila", "Olivia", "Narrator", "Little mermaid"]) {
    const request = speechRequest(speaker, caption);
    assert.deepEqual(request.input.text, "Keh-ila, come look at Keh-ila's sail!");
    assert.include(request.input.prompt, "keh-ee-lah");
    assert.include(request.input.prompt, "short eh in elephant");
    assert.include(request.input.prompt, "hyphen in Keh-ila matters");
    assert.deepEqual(caption, "Keila, come look at Keila's sail!");
    assert.notDeepEqual(
      await speechFingerprint(request),
      await speechFingerprint({ ...request, input: { ...request.input, text: caption } }),
    );
  }
  assert.deepEqual(speechRequest("Olivia", "Keh-ila and Olivia").input.text, "Keh-ila and Olivia");
  assert.deepEqual(speechRequest("Olivia", "keila, Keilani").input.text, "Keh-ila, Keilani");
  assert.deepEqual(speechRequest("Olivia", "Our sail is ready!").input.text, "Our sail is ready!");
  assert.deepEqual(
    speechRequest("Olivia", "Our sail is ready!").input.prompt.includes("Name pronunciation"),
    false,
  );
  assert.include(speechRequest("Olivia", "Keh-ila and Olivia").input.prompt, "keh-ee-lah");
});
