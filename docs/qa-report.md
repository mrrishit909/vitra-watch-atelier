# QA report

Apple M3 Pro, Chrome stable, Playwright 1.63, WebGL through SwiftShader. Last full runs: 20 e2e tests passed three times in a row; 22 unit and API tests passed.

| Matrix row (blueprint 18) | Covered by | Result |
|---|---|---|
| Intro first load, skip, refresh mid-sequence | demo walk, refresh test | pass |
| Intro replay | reload is the replay (refresh test) | n/a |
| Input: click, keyboard, hover | demo walk (clicks, hover on a part), arrow keys on the dial | pass |
| Input: drag, touch | drag-to-turn is implemented with pointer events; not exercised by a test; no touch test | not tested |
| Scroll | this product has no scroll navigation; deep links restore a configuration | pass (deep link) |
| Responsive | phone 390 px: ring above, panel below, no sideways overflow | pass at one phone size; tablet and large desktop not tested |
| Motion: reduced | static keyframes, no sweep animation, same navigation | pass |
| Graphics: success, failure, context loss | all WebGL tests; `?gfx=off`; lost-context event | pass |
| Graphics: slow GPU | software rendering is the slow case: median frame 50 ms | pass as a bound |
| Lifecycle: tab hidden | frame loop pauses on visibilitychange | manual only |
| Business rules | ceramic + bracelet refused; moon pulls date in; engraving charset and length; commission needs email | pass |
| Visual regression | six product states against the poster fallback | pass |
| Performance | budgets in tests/e2e/performance.spec.ts | pass |

Defects found and fixed during the build: the navigation buttons ignored clicks over the canvas because `all: unset` reset `pointer-events` to inherit (found by Playwright's intercept report); the engraving texture rendered upside down on the flipped caseback; the dial hid the movement during the intro until the assembly order was windowed so the movement lands first.
