# Architecture

```
model/parts.json  (the contract)  ──> model/build.py ──Blender──> source.blend, exports/watch.glb, renders/poster.png
                                  └─> model/validate.py (fresh-scene re-import; fails on any breach) ──> exports/validation.json
packages/domain: config rules (validate, price, movement stats, reference number), mechanics (balance, hands, assembly windows), layout (camera and ring geometry)
packages/schemas: shared types
data/simulators/generate.ts ──> product.json, materials.json, parts.json ──> apps/web/public/data
apps/web (Next.js 16 static export): App ─ store ─ Panels (DOM: ring nav + six sections) + Scene (R3F) + Intro (GSAP)
apps/api (node:http): the blueprint's section 12 contract over the same domain package
```

**One rules module, two consumers.** The browser and the API both call `packages/domain`; the API re-validates and re-prices every configuration, so a hand-edited request cannot get a price the UI would not show.

**Layout is shared too.** `layout(W, H)` returns where the watch should sit, the dial radius in pixels, the ring radius and the camera distance that makes the dial that size. The camera uses it (with `setViewOffset` to move the watch off-centre) and so does the DOM ring, so the 3D dial and the navigation circle stay concentric at any window size. A unit test checks that the camera distance projects the dial to the requested pixel radius.

**Part contract.** `model/parts.json` lists 27 named parts with label, group, exploded axis and distance. `validate.py` fails the build if the GLB lacks one; the web app reads the same list to build the exploded view, the labelled part table and the intro order.

**State.** An external store (`useSyncExternalStore`) holds selections, view, flags; per-frame animation values live in a mutable `live` object so the render loop never re-renders React.

**Not built.** PostgreSQL (the demo keeps saved configurations in localStorage; the schema in the book is the target), object storage, Stripe, Docker services beyond web and api, KTX2/Meshopt (the GLB is 187 KB), email delivery of quotes.
