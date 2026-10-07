# Blender asset contract

Source of truth: `model/build.py` (deterministic) and `model/parts.json`. `model/source.blend` is build output.

**watch.glb**: 187 KB, 7,992 triangles, 14 materials (case, dial, gold trim, steel, gilt, gunmetal, ruby, glass, leather, rubber, module faces, moon blue). An original 40 mm automatic with a 27-part contract (see parts.json). Repeated indices (12) and screws (10) are linked-mesh instances: `validate.py` reports instanced objects and unique meshes.

Orientation: Blender Z-up with 12 o'clock at +Y becomes glTF Y-up with 12 o'clock at -Z. Hands are authored with the origin on the rotation axis and rotated by the browser about Y (negative is clockwise seen from above). The balance wheel is an empty at its own pivot with its rim, arms and hairspring as children.

Browser-driven: exploded transforms (`position` along `axis * dist * k`), transparent case (opacity on the shared CaseMetal material), material swaps (CaseMetal, DialSurface, a cloned seconds-hand material), balance oscillation, hand angles, strap and complication visibility, a runtime engraving plane parented to Caseback.

**Validation** (`model/validate.py`): all contract names present, nothing unparented, hand origins on the rotation axis, under 60,000 triangles and 900 KB. Last run: VALIDATION OK.

**Known limits.** Primitive-built forms with flat colours: no UVs, so no baked textures (the engraving is a runtime plane, the dial finishes are PBR parameters, not brushed-metal textures). The date module is a plate without numerals. Lugs and bezel are simple. A real brand would model these in a CAD-to-Blender pipeline.
