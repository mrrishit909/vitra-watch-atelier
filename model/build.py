"""VITRA: an original 40 mm automatic watch and movement. Deterministic. Run: Blender -b -P model/build.py
Units: 1 Blender unit = 1 cm. Z is up out of the dial; Y is 12 o'clock. glTF export turns that into Y-up, 12 o'clock at -Z.
Writes model/source.blend, model/exports/watch.glb, model/renders/poster.png. The part list lives in model/parts.json."""
import bpy, bmesh, math, os, json
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = json.load(open(os.path.join(HERE, "parts.json")))
os.makedirs(os.path.join(HERE, "exports"), exist_ok=True); os.makedirs(os.path.join(HERE, "renders"), exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def mat(name, color, metal=0.0, rough=0.4, emit=None, k=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Metallic"].default_value = metal; b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = k
    return m
M = {k: mat(k, *v) for k, v in {
    "CaseMetal": ((0.72, 0.75, 0.78), 1.0, 0.22), "DialSurface": ((0.02, 0.02, 0.02), 0.2, 0.5), "GoldTrim": ((0.84, 0.73, 0.46), 1.0, 0.25),
    "Steel": ((0.72, 0.75, 0.78), 1.0, 0.3), "Gilt": ((0.42, 0.32, 0.14), 1.0, 0.4), "Gunmetal": ((0.15, 0.155, 0.165), 0.9, 0.4),
    "Ruby": ((0.65, 0.07, 0.18), 0.0, 0.1), "Glass": ((0.8, 0.9, 1.0), 0.0, 0.03), "Leather": ((0.045, 0.02, 0.012), 0.0, 0.85), "Rubber": ((0.03, 0.03, 0.035), 0.0, 0.7),
    "ModuleFace": ((0.1, 0.1, 0.11), 0.4, 0.45), "MoonBlue": ((0.05, 0.1, 0.3), 0.2, 0.4)}.items()}
g = M["Glass"]; g.surface_render_method = "BLENDED"; g.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.1
M["Ruby"].node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.65, 0.07, 0.18, 1); M["Ruby"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.6

def link(o, material, parent=None, name=None):
    if name: o.name = name
    if material: o.data.materials.append(M[material])
    if parent: o.parent = parent
    return o
def mesh_obj(name, bm, material, parent=None, loc=(0, 0, 0), smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); o.location = loc
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return link(o, material, parent)
def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None); scene.collection.objects.link(e); e.location = loc
    if parent: e.parent = parent
    return e

def lathe(profile, seg=48):
    """Revolve a closed (r, z) polyline about Z."""
    bm = bmesh.new(); rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; c, s = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((r * c, r * s, z)) for r, z in profile])
    n = len(profile)
    for i in range(seg):
        for j in range(n):
            a, b = rings[i], rings[(i + 1) % seg]
            try: bm.faces.new((a[j], a[(j + 1) % n], b[(j + 1) % n], b[j]))
            except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    return bm
def poly_extrude(pts, z0, z1):
    bm = bmesh.new(); lo = [bm.verts.new((x, y, z0)) for x, y in pts]; hi = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(lo[::-1]); bm.faces.new(hi); n = len(pts)
    for i in range(n): bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    return bm
def gear_pts(teeth, r_out, r_in):
    pts = []
    for i in range(teeth):
        a = 2 * math.pi * i / teeth; w = 2 * math.pi / teeth
        for f, r in ((0.0, r_in), (0.28, r_out), (0.62, r_out), (0.88, r_in)):
            t = a + w * f; pts.append((r * math.cos(t), r * math.sin(t)))
    return pts
def disc_pts(r, n=32): return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]

W = empty("Watch")
# ---- case (authored at z=0 centred; caseback below, crystal above)
case = mesh_obj("Case", lathe([(1.55, -0.38), (2.0, -0.38), (2.02, 0.0), (2.0, 0.38), (1.62, 0.38), (1.62, 0.34), (1.55, 0.34)]), "CaseMetal", W)
for sx in (-1, 1):
    for sy in (-1, 1):
        lug = mesh_obj("Lug", poly_extrude([(-0.28, 0.0), (0.28, 0.0), (0.24, 0.55), (-0.24, 0.55)], -0.3, 0.12), "CaseMetal", case)
        lug.location = (sx * 0.95, sy * 1.78, 0); lug.scale = (1, sy, 1)
bezel = mesh_obj("Bezel", lathe([(1.45, 0.34), (1.9, 0.34), (1.95, 0.42), (1.9, 0.5), (1.5, 0.5), (1.45, 0.44)]), "GoldTrim", W)
crystal = mesh_obj("Crystal", lathe([(0, 0.62), (0.7, 0.6), (1.2, 0.54), (1.5, 0.46), (1.5, 0.42), (0, 0.5)], 40), "Glass", W)
caseback = mesh_obj("Caseback", lathe([(0, -0.62), (1.4, -0.62), (1.6, -0.55), (1.6, -0.4), (1.2, -0.4), (0, -0.4)]), "CaseMetal", W)
glass_back = mesh_obj("CasebackCrystal", lathe([(0, -0.6), (1.0, -0.6), (1.0, -0.5), (0, -0.5)], 32), "Glass", caseback)
engr = mesh_obj("EngravingDisc", lathe([(0, -0.625), (1.35, -0.625), (1.35, -0.62), (0, -0.62)], 48), "Steel", caseback)
crown = empty("Crown", (2.0, 0.0, 0.0), W)
mesh_obj("CrownKnurl", lathe([(0, 0.0), (0.32, 0.0), (0.38, 0.1), (0.38, 0.5), (0.3, 0.55), (0, 0.55)], 20), "GoldTrim", crown).rotation_euler = (0, math.pi / 2, 0)

# ---- dial, indices (linked-mesh instances), hands
dial = mesh_obj("Dial", lathe([(0, 0.08), (1.55, 0.08), (1.55, 0.2), (1.5, 0.22), (0, 0.22)], 64), "DialSurface", W)
idx_mesh = None
for h in range(1, 13):
    a = math.radians(90 - h * 30); big = h % 3 == 0
    ln, wd = (0.34, 0.07) if big else (0.2, 0.045)
    bm = poly_extrude([(-wd, 0), (wd, 0), (wd, ln), (-wd, ln)], 0.22, 0.3)
    if idx_mesh is None:
        o = mesh_obj(f"Index_{h:02d}", bm, "GoldTrim", dial, smooth=False); idx_mesh = o.data
    else:
        bm.free(); o = bpy.data.objects.new(f"Index_{h:02d}", idx_mesh); scene.collection.objects.link(o); o.parent = dial
    o.location = (1.3 * math.cos(a), 1.3 * math.sin(a), 0); o.rotation_euler = (0, 0, a - math.pi / 2)
    if h == 12 or h % 3 != 0: pass
def hand(name, length, width, tail, z, material, parent):
    pts = [(0, -tail), (width, 0), (width * 0.5, length * 0.8), (0, length), (-width * 0.5, length * 0.8), (-width, 0)]
    return mesh_obj(name, poly_extrude(pts, z, z + 0.05), material, parent, smooth=False)
hour = hand("HourHand", 0.85, 0.09, 0.2, 0.34, "GoldTrim", W); minute = hand("MinuteHand", 1.3, 0.07, 0.25, 0.4, "GoldTrim", W)
sec = hand("SecondsHand", 1.4, 0.025, 0.4, 0.46, "Ruby", W)
hour.rotation_euler.z = math.radians(-305); minute.rotation_euler.z = math.radians(-60); sec.rotation_euler.z = 0
mesh_obj("HandCap", lathe([(0, 0.34), (0.1, 0.34), (0.1, 0.5), (0, 0.52)], 16), "GoldTrim", W)

# ---- complications (sub-dial modules on the dial, toggled by the browser)
cd = mesh_obj("ComplicationDate", poly_extrude([(-0.36, -0.2), (0.36, -0.2), (0.36, 0.2), (-0.36, 0.2)], 0.22, 0.27), "ModuleFace", W, (0.95, -0.2, 0), smooth=False)
cm = mesh_obj("ComplicationMoon", lathe([(0, 0.22), (0.45, 0.22), (0.45, 0.27), (0, 0.27)], 32), "MoonBlue", W, (0, -0.75, 0))
cp = mesh_obj("ComplicationPowerReserve", lathe([(0, 0.22), (0.4, 0.22), (0.4, 0.27), (0, 0.27)], 32), "ModuleFace", W, (-0.85, 0.15, 0))
mesh_obj("PowerReserveHand", poly_extrude([(-0.015, 0), (0.015, 0), (0.0, 0.34)], 0.27, 0.3), "Ruby", cp, smooth=False)
mesh_obj("MoonDisc", lathe([(0, 0.27), (0.18, 0.27), (0.18, 0.3), (0, 0.3)], 24), "GoldTrim", cm, (0.1, 0.1, 0))

# ---- movement (below the dial, z from -0.35 to 0.05)
plate = mesh_obj("MainPlate", lathe([(0, -0.34), (1.52, -0.34), (1.52, -0.28), (0, -0.28)], 64), "Gilt", W)
barrel = mesh_obj("Barrel", poly_extrude(gear_pts(36, 0.56, 0.5), -0.27, -0.12), "Steel", W, (-0.55, 0.45, 0)); mesh_obj("BarrelArbor", lathe([(0, -0.12), (0.12, -0.12), (0.12, -0.04), (0, -0.04)], 16), "Gunmetal", barrel)
gc = mesh_obj("GearCenter", poly_extrude(gear_pts(40, 0.5, 0.45), -0.19, -0.14), "Steel", W, (0.15, 0.0, 0))
g3 = mesh_obj("GearThird", poly_extrude(gear_pts(30, 0.32, 0.28), -0.17, -0.12), "Steel", W, (0.62, 0.3, 0))
g4 = mesh_obj("GearFourth", poly_extrude(gear_pts(28, 0.28, 0.24), -0.15, -0.1), "Steel", W, (0.35, -0.5, 0))
esc = mesh_obj("EscapeWheel", poly_extrude(gear_pts(15, 0.24, 0.17), -0.13, -0.09), "Steel", W, (0.0, -0.78, 0))
fork = mesh_obj("PalletFork", poly_extrude([(-0.1, 0.0), (0.1, 0.0), (0.4, -0.3), (0.34, -0.36), (0.0, -0.1), (-0.34, -0.36), (-0.4, -0.3)], -0.12, -0.08), "Steel", W, (-0.1, -1.0, 0))
bal = empty("BalanceWheel", (-0.65, -0.7, 0), W)
mesh_obj("BalanceRim", lathe([(0.38, -0.1), (0.46, -0.1), (0.46, -0.02), (0.38, -0.02)], 40), "GoldTrim", bal)
mesh_obj("BalanceArm", poly_extrude([(-0.42, -0.03), (0.42, -0.03), (0.42, 0.03), (-0.42, 0.03)], -0.08, -0.04), "GoldTrim", bal)
mesh_obj("BalanceArm2", poly_extrude([(-0.03, -0.42), (0.03, -0.42), (0.03, 0.42), (-0.03, 0.42)], -0.08, -0.04), "GoldTrim", bal)
mesh_obj("Hairspring", lathe([(0.1, -0.12), (0.2, -0.12), (0.2, -0.1), (0.1, -0.1)], 24), "Steel", bal)
for nm, pts, loc in (("BridgeBarrel", [(-1.3, 0.1), (-0.2, 0.9), (0.1, 0.5), (-0.8, -0.1), (-1.2, -0.2)], (0, 0, 0)),
                      ("BridgeTrain", [(0.0, 0.6), (1.1, 0.6), (1.2, -0.3), (0.55, -0.85), (0.1, -0.25)], (0, 0, 0)),
                      ("BridgeBalance", [(-1.2, -0.3), (-0.2, -0.45), (-0.2, -1.25), (-0.9, -1.35), (-1.25, -0.9)], (0, 0, 0))):
    mesh_obj(nm, poly_extrude(pts, -0.06, 0.0), "Gunmetal", W, loc, smooth=False)
rotor = mesh_obj("Rotor", poly_extrude([(0, 0), (1.4, 0.0), (1.4, 0.7), (0.9, 1.15), (0.0, 1.0), (-0.3, 0.5)], -0.5, -0.42), "GoldTrim", W, (0, 0, 0), smooth=False)
jewels = [(-0.55, 0.45), (0.15, 0.0), (0.62, 0.3), (0.35, -0.5)]
for i, (x, y) in enumerate(jewels, 1): mesh_obj(f"RubyJewel_{i}", lathe([(0, -0.07), (0.07, -0.07), (0.07, -0.02), (0, 0.0)], 12), "Ruby", W, (x, y, 0), smooth=True)
screw_mesh = None
for i in range(1, 11):
    a = 2 * math.pi * (i - 1) / 10; r = 1.35
    if screw_mesh is None:
        o = mesh_obj("Screw_01", lathe([(0, -0.07), (0.08, -0.07), (0.08, 0.0), (0, 0.0)], 12), "Steel", W); screw_mesh = o.data
    else:
        o = bpy.data.objects.new(f"Screw_{i:02d}", screw_mesh); scene.collection.objects.link(o); o.parent = W
    o.location = (r * math.cos(a), r * math.sin(a), 0.0)

# ---- straps (three variants; the browser shows one)
def strap(name, mat_name, w=0.9, seg=7, link_style=False):
    bm = bmesh.new()
    for sy in (1, -1):
        for k in range(seg):
            y0, y1 = sy * (2.1 + k * 0.5), sy * (2.1 + (k + 1) * 0.5 - (0.05 if link_style else 0))
            x = w * (1 - 0.12 * k / seg)
            pts = [(-x, y0), (x, y0), (x, y1), (-x, y1)]
            lo = [bm.verts.new((px, py, -0.3 - 0.05 * k * 0.3)) for px, py in pts]; hi = [bm.verts.new((px, py, -0.1 - 0.05 * k * 0.3)) for px, py in pts]
            bm.faces.new(lo[::-1]); bm.faces.new(hi)
            for i in range(4): bm.faces.new((lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]))
    return mesh_obj(name, bm, mat_name, W, smooth=False)
strap("StrapLeather", "Leather"); strap("StrapRubber", "Rubber", 0.88); strap("StrapBracelet", "Steel", 0.9, 7, True)

# ---- poster still
for o in bpy.data.objects:
    if o.name in ("Rotor", "StrapRubber", "StrapBracelet"): o.hide_render = True
bpy.ops.object.camera_add(location=(6.0, -9.5, 9.0)); cam = bpy.context.active_object; scene.camera = cam; cam.data.lens = 60
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
for name, loc, e, col in (("Key", (-4, -3, 8), 1500, (1.0, 0.88, 0.62)), ("Rim", (6, 5, 4), 900, (0.7, 0.8, 1.0)), ("Fill", (4, -6, 2), 200, (1.0, 0.95, 0.85))):
    bpy.ops.object.light_add(type="POINT", location=loc); l = bpy.context.active_object; l.name = name; l.data.energy = e; l.data.color = col
world = bpy.data.worlds.new("Obsidian"); scene.world = world; world.use_nodes = True; world.node_tree.nodes["Background"].inputs[0].default_value = (0.01, 0.01, 0.012, 1)
scene.render.engine = "BLENDER_EEVEE_NEXT"; scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.filepath = os.path.join(HERE, "renders", "poster.png")

bpy.ops.object.select_all(action="DESELECT")
def pick(o):
    o.select_set(True)
    for c in o.children: pick(c)
pick(W)
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, "exports", "watch.glb"), export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "source.blend"))
try: bpy.ops.render.render(write_still=True)
except Exception as e: print("poster failed", e)
print("BUILD OK")
