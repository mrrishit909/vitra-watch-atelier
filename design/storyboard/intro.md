# Intro storyboard (about 20 s, wall clock, skippable from the first frame)

| t (s) | Shot | What moves |
|---|---|---|
| 0.2 | Darkness; one ruby jewel (a faceted gem) hangs left of centre, lit from inside. | jewel opacity 0 to 1 |
| 1.6 | The movement assembles around it: plate, barrel, train, escapement, balance, bridges, rotor; then dial, hands, crown, case, bezel, crystal, strap. Each part flies in along its own exploded axis. | windows from `ASSEMBLY` in packages/domain/src/mechanics.ts; camera pulls back |
| 11.6 | The balance wheel starts to oscillate (4 Hz, 290 degrees). | `balanceK` 0 to 1 |
| 13.2 | The camera dives toward the dial through the sapphire; the seconds hand sweeps toward twelve. | camera distance and tilt; seconds angle to 0 |
| 17.0 | The seconds hand reaches twelve. The six hour stations appear on the dial and move outward to the ring. | `--r` and `--ringk` tween from the index radius to the ring radius |
| 18.4 | A conic sweep, like a seconds hand drawing a circle, reveals the panel. | `--sweep` 0 to 360 degrees on the panel mask |

Hand-off: the same watch, the same camera, the same dial. The markings the viewer was just looking at are the navigation. Reduced motion: four static keyframes and one "Enter the atelier" control.
