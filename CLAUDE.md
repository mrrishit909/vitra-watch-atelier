# VITRA

Watch configurator demo (blueprint 02, Advanced Engineering Build Book Vol. VII). Static site; the Blender watch is scripted. The brand, watch, prices and part counts are fictional.

- Build the asset: `npm run model` (Blender 4.5 at ~/Applications), then `node scripts/copy-assets.ts`. The part contract is `model/parts.json`, read by build.py, validate.py and the web app.
- Data/rules: `npm run seed`; rules live in `packages/domain/src/config.ts` (validation, price, movement stats). Tests: `npm test`, `npm run e2e` after `npm run build`.
- Glossary: glTF space is Y-up, 12 o'clock at -Z; hands rotate by -angle about Y; 1 unit = 1 cm.
- Multi-agent is the development process only (.claude/agents); the product contains no agents.
