# Our Drawing World

A hand-drawn point-and-click adventure starring Keila and Olivia. Explore the
harbor, village, frozen pond, forest, workshop, tree-house finale, and cloud picnic.
Repair the world with drawing, picture assembly, reading, and other gentle puzzles.

Built with [Caper](https://www.npmjs.com/package/@gandazgul/caper-engine), Phaser, Node.js 26, and Vite+.

## Run locally

Install Node.js 26.12.1 and pnpm 12.6.0, then clone this repository. The published
Caper engine is installed from npm; no sibling checkout is needed.

```sh
git clone https://github.com/gandazgul/drawing-game.git drawing-game
cd drawing-game
nvm install # or select the pinned .node-version with your version manager
pnpm install --frozen-lockfile
pnpm dev
```

Vite+ provides linting with Oxlint, formatting with Oxfmt, and tests with Vitest.
Configuration lives in `vite.config.js`.

```sh
pnpm check
pnpm lint
pnpm fmt
pnpm test
pnpm test:watch
pnpm build
pnpm preview
```

`pnpm start` serves the production bundle on port 8080 (override with `PORT`).
The Containerfile packages a host-built `dist/` and runs the Node.js server as a
non-root user. Build locally with `pnpm build`, then `podman build -t drawing-game .`.

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
