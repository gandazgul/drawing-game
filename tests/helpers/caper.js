// Caper 0.5.1 publishes these pure modules but does not export subpaths yet.
// Resolve them from the installed npm package so Node tests avoid Phaser's DOM
// initialization. Gameplay imports only the package's public entry point.
const entry = import.meta.resolve("@gandazgul/caper-engine");
export const { findPath, findPathInWalkable, pointInPolygon, snapToPolygon } = await import(
  new URL("./src/movement/pathfinding.js", entry).href
);
export const { Store } = await import(new URL("./src/state/Store.js", entry).href);
