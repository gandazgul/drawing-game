import { assertEquals, assertNotEquals, assertStringIncludes, assertThrows } from "@std/assert";
import { OLIVIA_RECAST, speechFingerprint, speechRequest, VOICE_AUDITIONS } from "../src/voices.js";
import { parseOptions } from "../scripts/voice-audition.js";

Deno.test("approved Gemini casting and MP3 format are explicit", () => {
  assertEquals(speechRequest("Keila", "Hello").voice, {
    languageCode: "en-US",
    name: "Autonoe",
    modelName: "gemini-3.1-flash-tts-preview",
  });
  assertEquals(speechRequest("Olivia", "Hello").voice.name, "Sulafat");
  assertEquals(speechRequest("Olivia", "Hello").audioConfig.audioEncoding, "MP3");
  assertEquals(speechRequest("Narrator", "Hello").voice.name, "Enceladus");
  assertEquals(VOICE_AUDITIONS.length, 3);
});

Deno.test("unapproved speakers and invalid dialogue cannot silently use another voice", () => {
  assertThrows(() => speechRequest("Uncast character", "Hello"));
  assertThrows(() => speechRequest("toString", "Hello"));
  assertThrows(() => speechRequest("Keila", " "));
  assertThrows(() => speechRequest("Keila", "a".repeat(1001)));
});

Deno.test("auditions default to a free dry run and require an explicit project to generate", () => {
  assertEquals(parseOptions([]), { generate: false, project: null, auth: "adc" });
  assertEquals(parseOptions(["--auth", "gcloud"]).auth, "gcloud");
  assertThrows(() => parseOptions(["--auth", "unknown"]));
  assertThrows(() => parseOptions(["--generate"]));
  assertThrows(() => parseOptions(["--project"]));
  assertThrows(() => parseOptions(["--project", "../../wrong"]));
  assertThrows(() => parseOptions(["--other"]));
  assertEquals(parseOptions(["--generate", "--project", "drawing-game-demo"]), {
    generate: true,
    project: "drawing-game-demo",
    auth: "adc",
  });
});

Deno.test("audio cache keys cover dialogue, speaker, direction and model", async () => {
  const original = speechRequest("Keila", "Hello");
  const key = await speechFingerprint(original);
  assertEquals(await speechFingerprint(speechRequest("Keila", "Hello")), key);
  assertNotEquals(await speechFingerprint(speechRequest("Keila", "Goodbye")), key);
  assertNotEquals(await speechFingerprint(speechRequest("Olivia", "Hello")), key);
  assertNotEquals(
    await speechFingerprint({ ...original, input: { ...original.input, prompt: "Quiet" } }),
    key,
  );
  assertNotEquals(
    await speechFingerprint({ ...original, voice: { ...original.voice, modelName: "other" } }),
    key,
  );
});

Deno.test("Olivia uses the selected Sulafat audition voice and delivery", () => {
  assertEquals(OLIVIA_RECAST.map((job) => job.request.voice.name), ["Sulafat", "Gacrux"]);
  assertEquals(speechRequest("Olivia", "Hello").voice.name, "Sulafat");
  assertEquals(
    speechRequest("Olivia", OLIVIA_RECAST[0].text).input.prompt,
    OLIVIA_RECAST[0].request.input.prompt,
  );
  assertEquals(OLIVIA_RECAST[0].text, OLIVIA_RECAST[1].text);
  for (const job of OLIVIA_RECAST) {
    assertEquals(job.request.input.text, job.text.replace("Keila", "Keh-ila"));
  }
});

Deno.test("Keila pronunciation changes speech only, for every speaker", async () => {
  const caption = "Keila, come look at Keila's sail!";
  for (const speaker of ["Keila", "Olivia", "Narrator", "Little mermaid"]) {
    const request = speechRequest(speaker, caption);
    assertEquals(request.input.text, "Keh-ila, come look at Keh-ila's sail!");
    assertStringIncludes(request.input.prompt, "keh-ee-lah");
    assertStringIncludes(request.input.prompt, "short eh in elephant");
    assertStringIncludes(request.input.prompt, "hyphen in Keh-ila matters");
    assertEquals(caption, "Keila, come look at Keila's sail!");
    assertNotEquals(
      await speechFingerprint(request),
      await speechFingerprint({ ...request, input: { ...request.input, text: caption } }),
    );
  }
  assertEquals(speechRequest("Olivia", "Keh-ila and Olivia").input.text, "Keh-ila and Olivia");
  assertEquals(speechRequest("Olivia", "keila, Keilani").input.text, "Keh-ila, Keilani");
  assertEquals(speechRequest("Olivia", "Our sail is ready!").input.text, "Our sail is ready!");
  assertEquals(
    speechRequest("Olivia", "Our sail is ready!").input.prompt.includes("Name pronunciation"),
    false,
  );
  assertStringIncludes(speechRequest("Olivia", "Keh-ila and Olivia").input.prompt, "keh-ee-lah");
});
