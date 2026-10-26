// Single source for subtitles and pre-generated speech. Keep wording here so
// editing a line cannot accidentally play an older recording with different text.
import { readingLines } from "./puzzles/reading.js";

export const DIALOGUE = {
  endingGo: [["Bounka", "Come outside! Let's finish our tree house together."]],
  endingWelcome: [
    [
      "Bounka",
      "I started a place for all our friends. But the pool is dry, the houses are in pieces, and there's no way up.",
    ],
    ["Keila", "We know how to fix those! Let's start with the pool."],
  ],
  endingPipes: [[
    "Olivia",
    "Tap the dry pool. Turn the pipes until every piece connects to the blue spring. Our swimming friends are coming!",
  ]],
  endingHouse: [[
    "Bounka",
    "Tap a pale house in the tree. Fit the big picture pieces together. I'll finish the door!",
  ]],
  endingDoor: [["Bounka", "There! The door is finished. I'm staying to finish the rest with you."]],
  endingRoute: [[
    "Keila",
    "Tap the pale path on the right. Draw it up to the branches and all the way across. Then we can walk on it!",
  ]],
  endingClimbed: [["Olivia", "We're walking on our drawing! Now everyone can get up here."]],
  endingFinished: [[
    "Bounka",
    "There's room for everyone. Let's decorate! Ring the golden bell when you're ready for our party.",
  ]],
  endingDecorate: [[
    "Keila",
    "Tap the flower bouquet to decorate. Put things wherever you like! We can move them again, too.",
  ]],
  endingPumpkin: [["Olivia", "Hello, pumpkin cat! You picked a lovely spot."]],
  endingParty: [
    ["Olivia", "Look! Our friends are all here!"],
    ["Bounka", "We finished it. Together. Thank you for staying."],
  ],
  endingGoodbye: [
    ["Bounka", "I made you a picture of our tree house. Look, we're all in it!"],
    ["Olivia", "But what if we miss everyone?"],
    ["Bounka", "Then you'll know where to find us."],
    ["Keila", "We should put this picture in our room!"],
    ["Olivia", "Let's draw a big heart. Together, all the way home."],
  ],
  endingHeart: [[
    "Keila",
    "Draw around the big heart. You can lift your finger, or tap the dots instead. Our amulet will do the magic.",
  ]],
  endingPortal: [
    ["Keila", "Our heart made a doorway!"],
    ["Olivia", "Goodbye, friends. We'll come and visit!"],
    ["Bounka", "We'll keep your place."],
  ],
  studioPictureHelp: [[
    "Keila",
    "Bounka scribbled over our picture! Rub the scribbles away, then fit the big pieces back into their spaces. We can finish it.",
  ]],
  studioPictureThanks: [[
    "Olivia",
    "There's our house, all together again. Let's try the door on the right.",
  ]],
  studioDarkHelp: [[
    "Olivia",
    "It's dark in here! Rub the darkness away. Look, those are our drawings! When the room is bright, tap the pale steps on the right to draw them.",
  ]],
  studioStairsReady: [["Keila", "Our steps are real! Tap the upstairs floor on the right. Let's climb!"]],
  studioGapHelp: [[
    "Olivia",
    "There's a gap upstairs. Walk up our steps, then tap the pale line across the gap to draw a bridge.",
  ]],
  studioBridgeReady: [[
    "Keila",
    "We made a way across! Walk over our bridge to the purple door on the left.",
  ]],
  studioMeet: [
    [
      "Bounka",
      "You caught up! I wanted every picture to be perfect. I kept starting over, and left everyone waiting. I'm sorry.",
    ],
    ["Bounka", "I found your little heart gem on the path. Here, it's yours!"],
  ],
  studioAmuletWonder: [
    ["Olivia", "Look! Every color is back. We found them all!"],
    ["Keila", "I wonder if we can go back home now."],
  ],
  studioTreehouseInvite: [
    [
      "Bounka",
      "Before you go... would you help me finish the tree house? I want all our friends to fit inside.",
    ],
    ["Olivia", "Together this time?"],
    ["Bounka", "Together. And I'll finish what we start."],
    ["Keila", "One more thing to make before we go home!"],
  ],
  studioGemMissingRings: [["Olivia", "Our little heart gem! Let's find the other heart rings, too."]],
  studioAfterClimax: [[
    "Bounka",
    "Our next big project is the tree house. And if you'd like to make something little first, this mouse still needs a door.",
  ]],
  studioHomeHelp: [[
    "Bounka",
    "Tap the little house on my bench. Draw over the pale doorway, so our mouse can get inside. I'll hold the paper!",
  ]],
  studioHomeThanks: [[
    "Bounka",
    "A little wonky, and finished! Our mouse has a home. Thank you for making it with me.",
  ]],
  forestBearHelp: [[
    "Ballerina bear",
    "One, two... oh! Bounka left my dancing trail unfinished. Tap the pale line and draw it with me. Then I can do my twirl!",
  ]],
  forestBearThanks: [[
    "Ballerina bear",
    "Step, step, twirl... and a bow! Thank you, artists. Follow our trail to my little woodland friend.",
  ]],
  forestDrawReady: [["Olivia", "Our trail is ready! Let's watch her dance."]],
  forestDrawHint: [[
    "A little idea",
    "Draw over the pale trail. You can lift your finger and keep going, or tap the dots from one to six.",
  ]],
  forestFriendHelp: [[
    "Woodland friend",
    "Bounka numbered my stepping stones, then hurried off! Start at one, visit every square, and reach the numbers in order. Tap a stone to help.",
  ]],
  forestFriendThanks: [[
    "Woodland friend",
    "Every stone has a place! Now we can walk to Bounka's studio. It's just through those trees.",
  ]],
  forestArrival: [["Keila", "There it is! We followed our own drawings all the way here."]],
  forestBounkaArrival: [
    ["Bounka", "Oh! Hello! I'm Bounka. I'd love to stop, but the treehouse still isn't finished!"],
    ["Bounka", "My tools! I left them inside. Come through the orange door. You can help me!"],
  ],
  forestFollowBounka: [["Olivia", "There they go! Let's follow Bounka through the orange door."]],
  houseStairsHelp: [[
    "Blue cat",
    "Bounka left my stairs unfinished! Can you rub away their scribbles and put the steps together?",
  ]],
  houseStairsThanks: [["Blue cat", "Lovely! Now we can go upstairs. Come and see my picture box!"]],
  houseEraseHint: [["A little idea", "Rub across all the scribbles to uncover the steps."]],
  houseBuildHint: [[
    "A little idea",
    "Fit each step into its outline. You can drag, or tap a piece and then its space.",
  ]],
  innGardenHelp: [[
    "Innkeeper",
    "Oh, our bee needs a path to her flowers! Tap her to help. Then I'll welcome you inside.",
  ]],
  innGardenThanks: [["Innkeeper", "There she goes! Thank you. Come on into the butterfly inn!"]],
  innGuestsHelp: [[
    "Innkeeper",
    "Bounka promised perfect rooms, but kept changing their plans! Our guests are still waiting. Tap the mice in the bedroom, one floor up. Help them line up from smallest to biggest.",
  ]],
  innPictureHelp: [[
    "Innkeeper",
    "Everyone has a place! Bounka took our room picture apart to improve it, then left. Tap the picture one floor above the bedroom. Let's put it back together.",
  ]],
  birthdayFlagsHelp: [[
    "Birthday friend",
    "Bounka promised the perfect party. They kept starting the decorations over, and now my friends are waiting! Tap the flags above us and finish their color patterns.",
  ]],
  birthdayCakeHelp: [[
    "Birthday friend",
    "Those flags are lovely! Bounka said the candles were too wobbly and rubbed them out. Tap my cake to draw them back. I like wobbly candles!",
  ]],
  birthdayMusicHelp: [[
    "Birthday friend",
    "Now we need our song! Bounka wanted another rehearsal, but we're ready to celebrate. Tap me to help us keep the beat and start the party!",
  ]],
  snowArrival: [["Penguin", "Let's make a snow friend! Slide with me to gather twigs, a carrot, and rocks."]],
  snowReady: [["Penguin", "Everything's here! Tap the snow pile. You can build whenever you like."]],
  snowSlideHelp: [["A little idea", "Hold, then let go when the marker reaches the green patch."]],
  snowBuildHelp: [["A little idea", "Drag a piece, or tap a piece then tap the snow."]],
  villageHelp: [
    ["A little idea", "Draw along the path to visit every flower."],
    ["A little idea", "Put the visitors in order, smallest to biggest."],
    ["A little idea", "Drag all 25 pieces into the picture."],
    ["A little idea", "Tap a color, then fill the empty flags. Follow each pattern."],
    ["A little idea", "Draw the missing candles. You can keep drawing when it's ready!"],
    ["A little idea", "Tap or press space when the note reaches the green patch."],
    ["A little idea", "Rub the panel to uncover a plan for the stairs."],
    ["A little idea", "Drag the blocks onto their matching spaces."],
    ["A little idea", "Tap a picture piece beside the empty space to slide it."],
    ["A little idea", "Turn over two pictures. Can you find their twins?"],
    ["A little idea", "Tap Jump or press space as the rope comes down."],
  ],
  villageFinds: [
    ["Olivia", "A heart! It was behind the room picture."],
    ["Keila", "Another heart! It was hiding in the picture box."],
    ["Olivia", "Now everyone can enjoy the party!"],
    [
      "A little idea",
      "A little visitor brings some news. The last heart is at Bounka's workshop, through the forest!",
    ],
  ],
  underwaterArrival: [
    ["Olivia", "We can breathe down here!"],
    ["Little mermaid", "Of course! It's your painting."],
    [
      "Big mermaid",
      "Bounka left the spring's pipes unfinished! Pop the bubbles so we can reach them, then help me bring the current back.",
    ],
  ],
  pondThanks: [
    ["Big mermaid", "You brought the current back! Follow our friends. Your boat can reach the village now!"],
    ["Olivia", "Is that where our little hearts landed?"],
    ["Big mermaid", "I saw two shining in the village. Ask around when you get there."],
  ],
  waterHint: [[
    "A little idea",
    "Join every pipe to the blue spring. Match the loose ends. Only the spring inlet and village outlet go outside the board.",
  ]],
  bubbleHint: [["A little idea", "Tap the bubbles to pop them. Look in the water and down on the sand."]],
  surfaceHint: [["A little idea", "Go back up to the pond. Your boat can take you to the village port."]],
  portRouteHint: [["A little idea", "The channel is open. Tap Village port to sail to the far shore."]],
  portArrival: [
    ["Keila", "A rainbow bridge! Oh. The middle is missing."],
  ],
  bridgeDrawHint: [[
    "A little idea",
    "Draw along the pale arch from one end to the other. You can lift your crayon, or use Tap dots instead.",
  ]],
  bridgeComplete: [["Keila", "It reaches! Can we go across now?"]],
  villageRouteHint: [[
    "A little idea",
    "Tap Cross into the village to walk over your finished rainbow bridge.",
  ]],
  villageArrival: [
    ["Keila", "Look, Olivia! Our drawings are everywhere!"],
    ["Olivia", "Come on, Keila. Let's find those hearts."],
  ],
  sea: [["Keila", "I know those swirly waves!"]],
  arrival: [
    ["Keila", "We fell right into our drawing!"],
    ["Olivia", "The heart came apart. Three pieces flew away… but we still have the frame."],
  ],
  sailIntro: [["Olivia", "The sail is missing. We can draw its shape."]],
  patchIntro: [["Olivia", "Let's color a patch over it."]],
  boatReady: [["Keila", "It works! Let's follow the water."]],
  sailPayoff: [["Keila", "Look at our sail! It's catching the breeze."], [
    "Olivia",
    "Now we can patch that little hole.",
  ]],
  patchPayoff: [["Olivia", "No more water coming in."], ["Keila", "We finished a real boat! Ready to go?"]],
  sticker: [["Keila", "A tiny fish sticker!"]],
  harborSailHint: [[
    "A little idea",
    "Tap the boat. Trace around the sail's three sides. You can lift your finger whenever you like.",
  ]],
  harborPatchHint: [["A little idea", "Tap the boat again. Color over its dark hole until the patch holds."]],
  harborReadyHint: [[
    "A little idea",
    "Your boat is ready! Tap it to sail to the pond. The sticker can wait.",
  ]],
  pondArrival: [[
    "Keila",
    "Someone's waving! I know that little crown.",
  ]],
  mermaid: [
    ["Little mermaid", "Hello, boat-makers! Did you really fall out of the sky?"],
    ["Olivia", "We did. Now we're looking for three little hearts."],
    [
      "Little mermaid",
      "I saw them fly toward the far shore. Come meet my big mermaid friend. She needs a little help!",
    ],
  ],
  pondHint: [[
    "A little idea",
    "The little mermaid is waving from the water. Tap her to say hello. The boat can take you back to the harbor.",
  ]],
  keilaGreeting: [["Keila", "We can make this together."]],
  oliviaGreeting: [["Olivia", "We can make this together."]],
  sailComplete: [["Olivia", "Our sail is ready!"]],
  patchComplete: [["Olivia", "Our patch holds!"]],
  sailHint: [[
    "A little idea",
    "Draw on the pale path around all three sides of the sail. You can draw one side at a time, or choose Tap corners instead.",
  ]],
  patchHint: [[
    "A little idea",
    "Rub your crayon across the dark hole. Color its middle and around the edges. No need to stay exactly inside.",
  ]],
};

export const dialogueKey = (speaker, text) => JSON.stringify([speaker, text]);
export const dialogueVoice = (speaker) =>
  ["A little idea", "Cloud friend"].includes(speaker) ? "Narrator" : speaker;
export const spokenLines = () => [...new Map(
  [...Object.values(DIALOGUE).flat().map(([speaker, text]) => ({ speaker, text })), ...readingLines()]
    .map((line) => [dialogueKey(line.speaker, line.text), line]),
).values()];
