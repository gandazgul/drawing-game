export const SAVE_KEY = "drawing-world-harbor-v1";

export function freshState() {
  return {
    values: {
      chapter: "chapter1",
      voicesOn: true,
      activeCharacter: "keila",
      arrived: false,
      sailDone: false,
      patchDone: false,
      metMermaid: false,
      waterwayDone: false,
      waterwayPuzzle: null,
      metBigMermaid: false,
      pondClue: false,
      bridgeDone: false,
      bridgeStrokes: [],
      bridgeBands: [],
      poppedBubbles: [],
      pipeTurns: [],
      bridgeColors: [],
      sailStrokes: [],
      patchStrokes: [],
      villageTasks: [],
      villageMessengerSeen: false,
      villageCloudMet: false,
      villagePicnicDone: false,
      villageReadingSet: 0,
      villagePicnicDecorations: [],
      snowMaterials: [],
      snowBuilderUnlocked: false,
      snowPieces: [],
      snowmanDone: false,
      forestDanceDone: false,
      forestTrailDone: false,
      forestBounkaMet: false,
      forestStrokes: [],
      forestBoard: null,
      studioPictureDone: false,
      studioStairsDone: false,
      studioDarkCleared: false,
      studioGapDone: false,
      studioGemFound: false,
      studioAmuletCelebrated: false,
      studioTreehouseInvited: false,
      studioKindEyes: false,
      studioHomeDone: false,
      endingWaterDone: false,
      endingHouseDone: false,
      endingRouteDone: false,
      endingClimbed: false,
      endingParty: false,
      endingGoodbyeSeen: false,
      endingPortalReady: false,
      endingDecorations: [],
      endingRouteStrokes: [],
      endingHeartStrokes: [],
    },
    collections: { stickers: new Set() },
    items: {},
  };
}

export function boatReady(values) {
  return values.sailDone === true && values.patchDone === true;
}
export function nextRepair(values) {
  return !values.sailDone ? "sail" : !values.patchDone ? "patch" : null;
}
export function resumeScene(values) {
  if (!boatReady(values)) return "Harbor";
  if (
    ["TreeClearing", "TreePipes", "TreeAssembly", "TreeRoute", "TreeDecorate", "TreePortal"].includes(
      values.currentScene,
    )
  ) {
    return values.studioTreehouseInvited ? "TreeClearing" : "StudioWorkroom";
  }
  if (
    ["StudioGallery", "WorkshopPicture", "StudioDark", "StudioWorkroom", "StudioHome"].includes(
      values.currentScene,
    ) && villageReady(values)
  ) {
    if (!values.forestDanceDone) return "ForestEdge";
    if (!values.forestTrailDone) return "ForestTrail";
    if (!values.studioPictureDone) return "StudioGallery";
    if (!values.studioStairsDone || !values.studioGapDone) return "StudioDark";
    return values.currentScene === "StudioHome"
      ? "StudioWorkroom"
      : values.currentScene === "WorkshopPicture"
      ? "StudioGallery"
      : values.currentScene;
  }
  if (
    ["ForestEdge", "ForestDraw", "ForestTrail", "ForestNumbers", "StudioApproach"].includes(
      values.currentScene,
    ) && villageReady(values)
  ) {
    if (!values.forestDanceDone) return "ForestEdge";
    if (values.currentScene === "ForestDraw") return "ForestEdge";
    if (values.currentScene === "StudioApproach" && !values.forestTrailDone) return "ForestTrail";
    return values.currentScene === "ForestNumbers" ? "ForestTrail" : values.currentScene;
  }
  if (["Underwater", "Waterway"].includes(values.currentScene)) {
    return values.metMermaid ? "Underwater" : "Pond";
  }
  if (values.currentScene === "VillagePuzzle" && villageReady(values)) return "Village";
  if (["CloudGarden", "CloudPicnic"].includes(values.currentScene) && villageReady(values)) {
    return "CloudGarden";
  }
  if (values.currentScene === "StairRepair" && villageReady(values)) return "House";
  if (
    values.currentScene === "VillageInterior" && villageReady(values) &&
    !(Array.isArray(values.villageTasks) && values.villageTasks.includes("garden"))
  ) return "InnGarden";
  if (
    ["FrozenPond", "PenguinSlide", "SnowmanBuilder"].includes(values.currentScene) && villageReady(values)
  ) {
    return "FrozenPond";
  }
  if (
    [
      "Village",
      "VillageInterior",
      "InnGarden",
      "BirthdayYard",
      "House",
      "HouseLoft",
      "JumpRope",
      "PictureMemory",
      "ForestEdge",
    ].includes(values.currentScene) && villageReady(values)
  ) {
    return values.currentScene;
  }
  if (["Port", "BridgeColors", "BridgeDraw", "Village"].includes(values.currentScene)) {
    return portReady(values) ? "Port" : "Pond";
  }
  return ["Pond", "Waterway"].includes(values.currentScene) ? "Pond" : "Harbor";
}

export const portReady = (values) =>
  boatReady(values) && values.waterwayDone === true && values.pondClue === true;
export const villageReady = (values) => portReady(values) && values.bridgeDone === true;

// Cap browser-save input before rendering it. Unknown/corrupt stroke data is ignored,
// without resetting or overwriting the player's story and collection progress.
export function validStrokes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 120).filter(Array.isArray).map((stroke) =>
    stroke.slice(0, 1600).filter((p) =>
      p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
      p.x >= 0 && p.x <= 1200 && p.y >= 0 && p.y <= 800
    )
  ).filter((stroke) => stroke.length);
}
