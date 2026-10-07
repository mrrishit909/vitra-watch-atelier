"""Fresh-scene re-import of exports/watch.glb checked against parts.json. Exit 1 on failure. Run: Blender -b -P model/validate.py"""
import bpy, os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); P = json.load(open(os.path.join(HERE, "parts.json")))
bpy.ops.wm.read_factory_settings(use_empty=True)
path = os.path.join(HERE, "exports", "watch.glb"); bpy.ops.import_scene.gltf(filepath=path)
objs = {o.name.split(".")[0]: o for o in bpy.data.objects}
req = [p["name"] for p in P["parts"]] + P["required_extra"]
missing = [r for r in req if r not in objs]
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
size = os.path.getsize(path); mats = sorted({m.name for m in bpy.data.materials})
orphans = [o.name for o in bpy.data.objects if o.parent is None and o.name.split(".")[0] != "Watch"]
# hands and the balance are rotated by the browser around their own origin: origin must sit on the rotation axis (x,y of the hands = 0; balance has its own pivot)
hands_ok = all(abs(objs[n].location.x) < 1e-4 and abs(objs[n].location.y) < 1e-4 for n in ("HourHand", "MinuteHand", "SecondsHand") if n in objs)
inst = sum(1 for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(("Index_", "Screw_")))
shared = len({o.data.name for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(("Index_", "Screw_"))})
rep = {"tris": tris, "bytes": size, "materials": mats, "missing": missing, "orphans": orphans, "hands_pivot_on_axis": hands_ok, "instanced_objects": inst, "unique_instance_meshes": shared}
json.dump(rep, open(os.path.join(HERE, "exports", "validation.json"), "w"), indent=1); print(json.dumps(rep, indent=1))
fail = []
if missing: fail.append(f"missing {missing}")
if orphans: fail.append(f"unparented {orphans}")
if tris > P["budget"]["tris"]: fail.append(f"{tris} tris over budget")
if size > P["budget"]["bytes"]: fail.append(f"{size} bytes over budget")
if not hands_ok: fail.append("a hand origin is off the rotation axis")
if fail: print("VALIDATION FAILED:", fail); sys.exit(1)
print("VALIDATION OK")
