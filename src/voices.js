// Creative casting is shared by the offline generator and future game playback.
// No credentials or network calls belong in this module.
export const TTS_MODEL = "gemini-3.1-flash-tts-preview";
export const TTS_LANGUAGE = "en-US";
const OLIVIA_DIRECTION =
  "Play Olivia, a gentle, confident young girl in a children's adventure. Use a noticeably lower, rounded, warm speaking register, relaxed pacing and grounded delivery, distinct from a bright high-pitched energetic sister. Keep youthful curiosity and clear natural American English. No squeakiness, baby talk, whispering, adult narrator delivery, music or sound effects. Speak only the supplied dialogue.";
export const VOICES = {
  Bounka: {
    name: "Fenrir",
    direction:
      "Play Bounka, a friendly orange crayon creature who is learning to finish things with friends. Warm, rounded middle-low register, a little sheepish at first then quietly delighted. Clear conversational American English. Never scary, villainous, growling, shouting or whispering. No music or sound effects. Speak only the supplied dialogue.",
  },
  "Ballerina bear": {
    name: "Leda",
    direction:
      "Play a warm, graceful ballerina bear in a child's hand-drawn adventure. Light lilting musical rhythm, poised and expressive, clear natural American English. Say dance counts with playful ballet-teacher phrasing, then conversationally. No imposed accent, no singing, whispering, baby talk, music or sound effects. Speak only the supplied dialogue.",
  },
  "Woodland friend": {
    name: "Iapetus",
    direction:
      "Play a small friendly woodland creature in a child's hand-drawn adventure. A relaxed, clear middle-low voice with gentle curiosity and a small smile. Conversational American English, distinct from the ballerina and young sisters. No growling, whispering, singing, music or sound effects. Speak only the supplied dialogue.",
  },
  "Birthday friend": {
    name: "Rasalgethi",
    direction:
      "Play a friendly birthday party host in a children's hand-drawn adventure. Cheerful, expressive, clear middle-register voice with a lightly theatrical bounce, natural conversational American English. A little disappointed at first but hopeful and welcoming, never angry or scary. Distinct from the young sisters and the mellow innkeeper. No singing, whispering, music or sound effects. Speak only the supplied dialogue.",
  },
  "Blue cat": {
    name: "Schedar",
    direction:
      "Play a friendly blue cat in a children's hand-drawn adventure. Clear, mellow middle-low voice with a lightly playful, hopeful delivery, natural conversational American English. Distinct from young girls and the warm innkeeper. No meowing, purring sounds, singing, music or sound effects. Speak only the supplied dialogue.",
  },
  Innkeeper: {
    name: "Algieba",
    direction:
      "Play a kindly little mouse who runs a butterfly inn in a children's painted adventure. Warm, gently bustling and hospitable, with a smooth middle-low register and clear conversational American English. Distinct from the two young sisters. No squeaking, whispering, singing, music or sound effects. Speak only the supplied dialogue.",
  },
  Penguin: {
    name: "Puck",
    direction:
      "Play a friendly, playful penguin in a children's painted adventure. A buoyant rounded middle register, clear conversational American English, distinct from both young sisters. Warm and eager to play. No shouting, squeaking, singing, music or sound effects. Speak only the supplied dialogue.",
  },
  Keila: {
    name: "Autonoe",
    direction:
      "Play a lively, curious young sister in a warm children's adventure. Bright, higher-pitched, nimble and eager, with clear natural American English. Sound conversational, not like a narrator. No exaggerated baby talk, shouting, music or sound effects. Speak only the supplied dialogue.",
  },
  Olivia: {
    name: "Sulafat",
    direction: OLIVIA_DIRECTION,
  },
  Narrator: {
    name: "Enceladus",
    direction:
      "Narrate a warm, welcoming children's story in clear natural American English. Gentle wonder, a relaxed conversational pace, and a little playful curiosity. Reassuring rather than dramatic or ominous. Speak clearly, not in a whisper. No music or sound effects. Speak only the supplied narration.",
  },
  "Little mermaid": {
    name: "Vindemiatrix",
    direction:
      "Play a friendly little mermaid welcoming two visitors in a children's painted adventure. Warm, curious, lightly lilting and playful, with clear natural American English. A distinct character voice, not a narrator. No singing, exaggerated baby talk, music or sound effects. Speak only the supplied dialogue.",
  },
  "Big mermaid": {
    name: "Achernar",
    direction:
      "Play a friendly, practical mermaid in a children's painted adventure. Warm, easygoing and lightly amused, with clear natural American English. Conversational and welcoming, distinct from the young sisters. No singing, whispering, music or sound effects. Speak only the supplied dialogue.",
  },
};

// Sister samples use existing dialogue; narrator sample is audition-only copy.
export const VOICE_AUDITIONS = [
  { id: "keila-harbor", speaker: "Keila", text: "Look! A boat. Let's finish it and go find them." },
  { id: "olivia-sail", speaker: "Olivia", text: "The sail is missing. We can draw its shape." },
  {
    id: "narrator-harbor",
    speaker: "Narrator",
    text: "The sisters landed beside a sea of swirling paint. Their adventure was only just beginning.",
  },
];

// TTS-only spelling: keh (e as in elephant) + ee + lah. Keep display text unchanged.
const speechText = (text) => text.replace(/\bKeila\b/gi, "Keh-ila");
const KEILA_PRONUNCIATION =
  "Name pronunciation: Keh-ila is pronounced keh-ee-lah, /kɛ.i.lɑ/. The first vowel is the short eh in elephant, followed by a separate ee vowel as in see, then lah. The hyphen in Keh-ila matters: preserve that vowel separation instead of collapsing the name into Kehila, Key-lah or Kay-lah. Say the name gently and clearly at a natural conversational pace. Do not say the hyphen, the phonetic instructions, or any extra words aloud.";
const speechDirection = (direction, text) =>
  /\b(?:Keila|Keh-ila)\b/i.test(text) ? `${direction} ${KEILA_PRONUNCIATION}` : direction;

// Audition templates. Original requests remain in the recordings' JSON sidecars.
// The family selected Sulafat on 2026-10-08.
export const OLIVIA_RECAST = ["Sulafat", "Gacrux"].map((name) => ({
  speaker: `Olivia audition / ${name}`,
  text: "The sail is missing. We can draw its shape. Come on, Keila. I'll hold this side.",
  request: {
    input: {
      text: speechText("The sail is missing. We can draw its shape. Come on, Keila. I'll hold this side."),
      prompt: speechDirection(OLIVIA_DIRECTION, "Keila"),
    },
    voice: { languageCode: TTS_LANGUAGE, name, modelName: TTS_MODEL },
    audioConfig: { audioEncoding: "MP3" },
  },
}));

export function speechRequest(speaker, text) {
  const voice = Object.hasOwn(VOICES, speaker) ? VOICES[speaker] : null;
  if (!voice) throw new Error(`No approved voice for ${speaker}.`);
  if (typeof text !== "string" || !text.trim() || text.length > 1000) {
    throw new Error("Dialogue must contain between 1 and 1000 characters.");
  }
  return {
    input: { text: speechText(text), prompt: speechDirection(voice.direction, text) },
    voice: { languageCode: TTS_LANGUAGE, name: voice.name, modelName: TTS_MODEL },
    audioConfig: { audioEncoding: "MP3" },
  };
}

export async function speechFingerprint(request) {
  const bytes = new TextEncoder().encode(JSON.stringify(request));
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
