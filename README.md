# Our Drawing World

A hand-drawn point-and-click adventure starring Keila and Olivia. Explore the
harbor, village, frozen pond, forest, workshop, tree-house finale, and cloud picnic.
Repair the world with drawing, picture assembly, reading, and other gentle puzzles.

Built with [Caper](https://github.com/gandazgul/caper), Phaser, Deno, and Vite.

## Run locally

Install Deno, then check out Caper beside this repository using the directory name
`Caper` (the capital C matters on case-sensitive filesystems):

```sh
git clone https://github.com/gandazgul/caper.git Caper
git clone https://github.com/gandazgul/drawing-game.git drawing-game
cd drawing-game
deno task dev
```

The game uses the sibling engine at `../Caper/mod.js`. Run these commands from the
game directory for checks and a static production bundle:

```sh
deno task check
deno task test
deno task build
deno task preview
```

Saves and player drawings are stored locally in each browser. Voice recordings
ship with the game; playback does not contact a TTS service or incur API charges.
The optional generation scripts require your own Google Cloud project and explicit
generation flags. Their project placeholder and budget must be configured before
generating new audio. The private production account and spending ledger are not
included.

## Public snapshot

This repository starts with a privacy-reviewed snapshot, not the private development
history. It includes playable assets and tests, but not original camera photos,
source-photo catalogs, private design conversations, generation metadata, account
configuration, deployment details, or editor settings. See `PRIVACY-REVIEW.md`.

## Licenses

- **Code:** [MIT](LICENSE), including tests and JavaScript utilities.
- **Project artwork and audio:** [CC BY-NC 4.0](ASSET-LICENSE.md), allowing
  noncommercial sharing and remixing with attribution.
- **Font and dependencies:** their own licenses remain in effect.

The artwork/audio license is separate from the code license: the entire game
asset collection is not MIT-licensed.
