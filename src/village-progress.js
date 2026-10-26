export const BRANCHES = {
  inn: { name: "Butterfly inn", art: "innExterior", tasks: ["garden", "luggage", "rooms"] },
  birthday: { name: "Birthday party", art: "cake", tasks: ["bunting", "cake", "music"] },
  house: { name: "The house", art: "house", tasks: ["clue", "stairs", "box"] },
};
export const TASKS = {
  garden: {
    title: "A path for our bee",
    instruction: "Draw along the path to visit every flower.",
    home: "InnGarden",
    kind: "trace",
  },
  luggage: {
    title: "Room for everyone",
    instruction: "Put the visitors in order, smallest to biggest.",
    home: "VillageInterior",
    kind: "sort",
  },
  rooms: {
    title: "The inn's room picture",
    instruction: "Drag all 25 pieces into the picture.",
    home: "VillageInterior",
    kind: "jigsaw",
  },
  bunting: {
    title: "Birthday bunting",
    instruction: "Tap a color, then fill the empty flags. Follow each pattern.",
    home: "BirthdayYard",
    kind: "pattern",
  },
  cake: {
    title: "Candles for the cake",
    instruction: "Draw the missing candles. You can keep drawing when it's ready!",
    home: "BirthdayYard",
    kind: "trace",
  },
  music: {
    title: "Start the birthday song",
    instruction: "Tap or press space when the note reaches the green patch.",
    home: "BirthdayYard",
    kind: "timing",
  },
  clue: {
    title: "What's under the scribbles?",
    instruction: "Rub the panel to uncover a plan for the stairs.",
    home: "House",
    kind: "erase",
  },
  stairs: {
    title: "A way upstairs",
    instruction: "Drag the blocks onto their matching spaces.",
    home: "House",
    kind: "blocks",
  },
  box: {
    title: "The picture on the box",
    instruction: "Tap a picture piece beside the empty space to slide it.",
    home: "HouseLoft",
    kind: "slide",
  },
};
export const doneTasks = (raw) => (Array.isArray(raw) ? [...new Set(raw.filter((id) => TASKS[id]))] : []);
export const branchDone = (raw, branch) => BRANCHES[branch].tasks.every((id) => doneTasks(raw).includes(id));
export const villageDone = (raw) => Object.keys(BRANCHES).every((id) => branchDone(raw, id));
export const nextTask = (raw, branch) => BRANCHES[branch].tasks.find((id) => !doneTasks(raw).includes(id));
export const taskAvailable = (raw, task) =>
  Object.values(BRANCHES).some((b) => {
    const index = b.tasks.indexOf(task);
    return index >= 0 && b.tasks.slice(0, index).every((id) => doneTasks(raw).includes(id));
  });
export function finishTask(raw, id) {
  const done = doneTasks(raw);
  return TASKS[id] && taskAvailable(done, id) ? [...new Set([...done, id])] : done;
}
export const adjacent = (a, b, cols) =>
  Math.abs((a % cols) - (b % cols)) + Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) === 1;
export function slide(board, index, cols = 3) {
  const empty = board.indexOf(0);
  if (!adjacent(index, empty, cols)) return board;
  const next = [...board];
  [next[index], next[empty]] = [next[empty], next[index]];
  return next;
}
// A legal scramble, not a random permutation: every initial board is solvable.
export const BOX_START = [4, 1, 3, 2, 0, 5];
export const BOX_GOAL = [1, 2, 3, 4, 5, 0];
export const MEMORY_ART = [
  "fish",
  "bee",
  "mouse",
  "heartButterfly",
  "blueCat",
  "bird",
  "bug",
  "birthdayFriend",
];
