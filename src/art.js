import { scanArt } from "./scan-art.js";
import { villageArtAssets } from "./village-art.js";
export const art = {
  cloudFriend: new URL("../assets/game/cloud/friend-v1.webp", import.meta.url).href,
  cloudBackdrop: new URL("../assets/game/cloud/backdrop-v1.webp", import.meta.url).href,
  cloudVine: new URL("../assets/game/cloud/vine-v1.webp", import.meta.url).href,
  picnicSupplies: new URL("../assets/game/cloud/picnic-v1.webp", import.meta.url).href,
  tealButterfly: new URL("../assets/game/scans/teal-butterfly-v1.webp", import.meta.url).href,
  pinkFruit: new URL("../assets/game/scans/pink-fruit-v1.webp", import.meta.url).href,
  partyBell: new URL("../assets/game/finale/party-bell-v1.webp", import.meta.url).href,
  scarecrow: new URL("../assets/game/forest/scarecrow-v1.webp", import.meta.url).href,
  orangeHouse: new URL("../assets/game/finale/orange-house-v1.webp", import.meta.url).href,
  birthdayHouse: new URL("../assets/game/finale/birthday-house-v1.webp", import.meta.url).href,
  endingDry: new URL("../assets/game/finale/tree-dry-v1.webp", import.meta.url).href,
  endingWater: new URL("../assets/game/finale/tree-water-v1.webp", import.meta.url).href,
  studioGallery: new URL("../assets/game/workshop/gallery-v1.webp", import.meta.url).href,
  studioDark: new URL("../assets/game/workshop/dark-room-v1.webp", import.meta.url).href,
  studioWorkroom: new URL("../assets/game/workshop/workroom-v1.webp", import.meta.url).href,
  bounka: new URL("../assets/game/workshop/bounka-v1.png", import.meta.url).href,
  bounkaKind: new URL("../assets/game/workshop/bounka-kind-v1.png", import.meta.url).href,
  studioExterior: new URL("../assets/game/workshop/exterior-v1.webp", import.meta.url).href,
  grapevineTree: new URL("../assets/game/forest/grapevine-tree-v1.webp", import.meta.url).href,
  bearSheet: new URL("../assets/game/forest/bear-dance-v1.webp", import.meta.url).href,
  forestCreature: new URL("../assets/game/forest/creature-v1.png", import.meta.url).href,
  forestGrove: new URL("../assets/game/forest/grove-v1.webp", import.meta.url).href,
  forestWoodland: new URL("../assets/game/forest/woodland-v2.webp", import.meta.url).href,
  axolotlBlue: new URL("../assets/game/scans/axolotl-blue-v1.webp", import.meta.url).href,
  axolotlPink: new URL("../assets/game/scans/axolotl-pink-v1.webp", import.meta.url).href,
  seaCreature: new URL("../assets/game/scans/sea-creature-v1.webp", import.meta.url).href,
  penguin: new URL("../assets/game/penguin-v1.png", import.meta.url).href,
  frozenPond: new URL("../assets/game/frozen-pond-v1.png", import.meta.url).href,
  snowParts: new URL("../assets/game/snow-parts-v1.png", import.meta.url).href,
  snowPath: new URL("../assets/game/snow-path-v1.png", import.meta.url).href,
  ...scanArt,
  innPlayable: new URL("../assets/game/inn-playable-v2.webp", import.meta.url).href,
  flowerVase: new URL("../assets/game/flower-vase-v2.webp", import.meta.url).href,
  harbor: new URL("../assets/game/harbor-v2.webp", import.meta.url).href,
  pond: new URL("../assets/game/pond.webp", import.meta.url).href,
  portBackdrop: new URL("../assets/game/port-background-v2.webp", import.meta.url).href,
  villageBackdrop: new URL("../assets/game/village-background-v2.webp", import.meta.url).href,
  underwater: new URL("../assets/game/underwater.webp", import.meta.url).href,
  bigMermaid: new URL("../assets/game/big-mermaid.webp", import.meta.url).href,
  mermaid: new URL("../assets/game/mermaid.webp", import.meta.url).href,
  fish: new URL("../assets/game/fish.webp", import.meta.url).href,
  sisters: new URL("../assets/game/sisters-v4.webp", import.meta.url).href,
  boat: new URL("../assets/game/boat.webp", import.meta.url).href,
  ...villageArtAssets,
};
export const INK = 0x513272;
export const COLORS = [0xe26487, 0x45954f, 0x26798c, 0xe6ad24, 0x7250a0];
export const font = { fontFamily: "Schoolbell", color: "#292b4b", fontSize: "30px" };

export function drawHeart(g, x, y, size, color, filled = false) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64 * Math.PI * 2;
    points.push({
      x: x + size * Math.sin(t) ** 3,
      y: y - size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16,
    });
  }
  g.lineStyle(5, color, 1).strokePoints(points, true);
  if (filled) g.fillStyle(color).fillPoints(points, true);
  return g;
}

export function line(g, a, b, color, width = 8) {
  g.lineStyle(width, color, 1).lineBetween(a.x, a.y, b.x, b.y);
  g.fillStyle(color).fillCircle(a.x, a.y, width / 2).fillCircle(b.x, b.y, width / 2);
}
