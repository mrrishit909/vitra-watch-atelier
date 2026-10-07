# Motion spec

- The watch never leaves the screen. Camera presets per section: atelier 3/4 from above, movement farther back and steeper for the exploded stack, material low and near, complications nearly overhead, engraving flipped to the caseback, commission 3/4.
- Route changes are clock-like: the active station's needle rotates to the new hour (0.9 s ease-out) and the panel is revealed by a conic sweep from 12 o'clock clockwise (0.9 s).
- Exploded parts move only along their own axis (parts.json). Overshoot is none: the slider is eased with a critically damped lerp.
- Metal swaps ease colour, metalness, roughness and reflection together. Transparent case fades the case metal to 14 percent.
- Ambient: the balance wheel (4 Hz), a slow rotor swing, a 0.08 rad yaw drift. All stop under Pause Motion and reduced motion.
