# Performance report

Hardware: Apple M3 Pro, Chrome stable, **software WebGL (SwiftShader)**, 1280 x 800. No physical GPU was exercised: **no 60 fps claim is made.** Command: `node scripts/measure.mjs`, movement view fully exploded.

| Measure | Value | Budget |
|---|---|---|
| Transfer (18 requests, local, uncompressed) | 588 KB | n/a |
| JS gzipped | 565 KB | 750 KB |
| watch.glb | 187 KB | 900 KB |
| Draw calls / triangles / geometries / textures | 68 / 8,884 / 53 / 4 | 200 / 150,000 |
| LCP | 6.3 s (software rasteriser and PMREM environment build) | none set |
| CLS | 0 | 0.1 |
| Long tasks during load | 3.5 s | none set |
| Median / p95 frame | 50 / 66.7 ms (software) | none set |
| Slider to readout | 0.9 s under software rendering | 3 s |

Draw calls and triangles are renderer-reported and device independent; the rest are CPU-rasteriser bounds. The 68 draw calls are mostly one per part (27 named parts plus indices, screws, jewels): instancing them with a shared material would cut that, at the price of per-part highlighting. The environment map is generated on load (PMREM of a room); baking it to a small KTX2 would remove that cost and is the first thing to try if a GPU run shows a slow first frame.

Degradation: the frame loop stops on a hidden tab; `?gfx=off` and context loss show the poster; reduced motion removes ambient animation; dpr is capped at 1.75. There is no automatic quality ladder.
