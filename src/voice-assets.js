import manifest from "../assets/audio/manifest.json";
import { dialogueKey } from "./dialogue.js";

// Vite emits local hashed asset URLs (including subdirectory deployments).
// These are files, never Google API requests or credentials.
const files = import.meta.glob("../assets/audio/**/*.mp3", { eager: true, query: "?url", import: "default" });
export function voiceURL(speaker, text) {
  const path = manifest[dialogueKey(speaker, text)];
  return path ? files[`../assets/audio/${path}`] : undefined;
}
