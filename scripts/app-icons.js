import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const publicDir = new URL("../public/", import.meta.url);
await mkdir(new URL("icons/", publicDir), { recursive: true });

// Original vector mark: the two artists' green and pink crayons on warm paper.
// Maskable artwork stays inside the central circle of radius 40% (204.8px).
function icon(scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#fff9e9"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)"
     stroke="#234d59" stroke-width="12" stroke-linejoin="round">
    <g transform="rotate(-32 256 256)">
      <path d="M224 164 256 108 288 164V372Q288 388 272 388H240Q224 388 224 372Z" fill="#45954f"/>
      <path d="M224 186H288V334H224Z" fill="#b9dca7"/>
      <path d="M224 211H288M224 309H288" fill="none"/>
    </g>
    <g transform="rotate(32 256 256)">
      <path d="M224 164 256 108 288 164V372Q288 388 272 388H240Q224 388 224 372Z" fill="#e26487"/>
      <path d="M224 186H288V334H224Z" fill="#f6c5d4"/>
      <path d="M224 211H288M224 309H288" fill="none"/>
    </g>
  </g>
</svg>
`;
}

const regular = Buffer.from(icon(1.35));
const maskable = Buffer.from(icon());
await writeFile(new URL("favicon.svg", publicDir), regular);
for (const size of [192, 512]) {
  await sharp(regular)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`icons/icon-${size}.png`, publicDir)));
  await sharp(maskable)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`icons/maskable-${size}.png`, publicDir)));
}
await sharp(regular)
  .resize(180, 180)
  .png()
  .toFile(fileURLToPath(new URL("apple-touch-icon.png", publicDir)));

// ICO directory containing PNG frames, supported by modern browsers and Windows.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((size) => sharp(regular).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
for (let i = 0; i < frames.length; i++) {
  const entry = 6 + 16 * i;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frames[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frames[i].length;
}
await writeFile(new URL("favicon.ico", publicDir), Buffer.concat([header, ...frames]));
console.log("Generated favicon, touch icon, and regular/maskable PWA icons.");
