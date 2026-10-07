# VITRA: a watch atelier built from a Blender asset

A configurator for a fictional watch. The page opens on one ruby jewel in the dark; a movement assembles around it, the balance wheel starts, the camera falls through the crystal, and when the seconds hand reaches twelve **the dial's hour markings become the navigation ring**. Then you open the movement, swap the case metal and dial, add complications, engrave the caseback and generate a commission summary.

Built from blueprint 02 of the *Advanced Engineering Build Book, Volume VII* as a **vertical slice**. **The brand, the watch, the prices, the part counts and the power-reserve effects are invented for the demo**; none is horology or commercial data.

- Live: https://mrrishit909.github.io/projects/vitra-watch-atelier/demo/
- Case study: https://mrrishit909.github.io/projects/vitra-watch-atelier/

## Run it
```bash
npm ci
npm run seed                      # product, materials, part contract
npm run model                     # Blender 4.5: build.py then validate.py (the GLB is committed, so optional)
npm test                          # 22 domain + API tests
npm run build && node scripts/serve.ts 8641   # static export at http://127.0.0.1:8641
npm run e2e                       # 20 Playwright tests (needs Google Chrome)
node apps/api/src/server.ts       # /v1 API on :8640, OpenAPI at /openapi.json
```
`?skip=1`, `?view=movement|material|complications|engraving|commission`, `&explode=1`, `&case=rose-alloy&dial=ruby-lacquer&strap=rubber&cx=date,moon&engrave=LINE1|LINE2`, `?gfx=off`, `?motion=reduced`.

## The pipeline
`model/parts.json` is the contract. `model/build.py` (Blender, headless) builds an original 40 mm automatic with 27 contract parts, instances the indices and screws, exports `watch.glb`, saves `source.blend` and renders a poster. `model/validate.py` re-imports the GLB into an empty scene and fails on any missing part, orphan, off-axis hand or budget breach. The browser then owns everything that moves: the exploded transforms, the balance oscillation, the hands, material swaps and the engraving.

See [docs/](docs/) (architecture, asset contract, QA report, performance report) and [design/](design/).

## Agent roles
`.claude/agents/` defines the twelve roles from the book, `.claude/skills/` the six project skills. **Honest note:** this repository was produced by one Claude Code session playing those roles in sequence on one working tree, not by parallel subagents in separate worktrees. The multi-agent workflow is the development process; the product contains no agents.

## Not built, and why
PostgreSQL (saved configurations live in localStorage; the API keeps them in memory), object storage, Stripe, e-mailed quotes (the static demo sends nothing), tablet and large-desktop checks, a touch test, a measurement on a physical GPU, and textures for the watch (forms and finishes are flat PBR).
