"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { windowed, ASSEMBLY, balanceAngle, exploded, handAngles, layout, FOV_DEG } from "@vitra/domain";
import type { Data } from "../data";
import { base } from "../data";
import { live, set, state, useStore } from "../store";

const WIN = new Map(ASSEMBLY.map(([n, a, b]) => [n, [a, b] as const]));
const COMPS: Record<string, string> = { ComplicationDate: "date", ComplicationMoon: "moon", ComplicationPowerReserve: "power" };
const STRAPS: Record<string, string> = { StrapLeather: "leather", StrapRubber: "rubber", StrapBracelet: "bracelet" };
const HOUR_1010 = (10 * 3600 + 8 * 60);
export const engravingCanvas = typeof document !== "undefined" ? document.createElement("canvas") : (null as unknown as HTMLCanvasElement);

function drawEngraving(lines: string[]) {
  const c = engravingCanvas; c.width = c.height = 512; const g = c.getContext("2d")!; g.clearRect(0, 0, 512, 512);
  g.fillStyle = "rgba(20,20,22,0.92)"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "600 44px Georgia, serif";
  g.save(); g.translate(256, 256);
  const ls = lines.filter(Boolean); ls.forEach((l, i) => g.fillText(l, 0, (i - (ls.length - 1) / 2) * 62));
  g.strokeStyle = "rgba(20,20,22,.5)"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 238, 0, Math.PI * 2); g.stroke(); g.restore();
}

function Watch({ data }: { data: Data }) {
  const gltf = useLoader(GLTFLoader, `${base}/models/watch.glb`), gl = useThree((s) => s.gl), scene3 = useThree((s) => s.scene);
  const root = useRef<THREE.Group>(null), jewel = useRef<THREE.Mesh>(null);
  const model = useMemo(() => gltf.scene.clone(true), [gltf]);
  const rt = useMemo(() => {
    const byName = new Map<string, THREE.Object3D>(); model.traverse((o) => byName.set(o.name, o));
    const mats = new Map<string, THREE.MeshStandardMaterial>(); model.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m && m.name) mats.set(m.name, m); });
    const sec = byName.get("SecondsHand") as THREE.Mesh | undefined; if (sec) { sec.material = (sec.material as THREE.Material).clone(); sec.material.name = "SecondsMat"; mats.set("SecondsMat", sec.material as THREE.MeshStandardMaterial); }
    const parts = data.parts.map((p) => { const n = byName.get(p.name)!; return { ...p, node: n, base: n.position.clone() }; });
    return { byName, mats, parts, sec };
  }, [model, data]);
  const engr = useMemo(() => { const tex = new THREE.CanvasTexture(engravingCanvas); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.CircleGeometry(1.34, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.rotation.x = Math.PI / 2; m.position.y = -0.64; return m; }, []);
  useEffect(() => { rt.byName.get("Caseback")?.add(engr); return () => { rt.byName.get("Caseback")?.remove(engr); }; }, [rt, engr]);
  useEffect(() => { const pm = new THREE.PMREMGenerator(gl); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene3.environment = env; scene3.environmentIntensity = 0.75; return () => { scene3.environment = null; env.dispose(); pm.dispose(); }; }, [gl, scene3]);
  const tint = useRef({ case: new THREE.Color(), dial: new THREE.Color(), sec: new THREE.Color() }), expl = useRef(0), flip = useRef(0), lastLines = useRef("");
  const matOf = (id: string) => data.materials.find((m) => m.id === id)!;
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((st, dt) => {
    const s = state, tt = st.clock.elapsedTime, mats = rt.mats;
    const intro = !s.introDone;
    // --- materials: ease toward the selected finish (colour, metalness, roughness, reflection strength)
    const k = s.reduced ? 1 : 1 - Math.exp(-dt * 6);
    const ease = (m: THREE.MeshStandardMaterial | undefined, id: string) => { if (!m) return; const t = matOf(id); m.color.lerp(tmp.set(t.color), k); m.metalness += (t.metalness - m.metalness) * k; m.roughness += (t.roughness - m.roughness) * k; m.envMapIntensity += (t.envIntensity - m.envMapIntensity) * k; };
    ease(mats.get("CaseMetal"), s.sel.caseMetal); ease(mats.get("DialSurface"), s.sel.dial);
    const secM = mats.get("SecondsMat"); if (secM) secM.color.lerp(tmp.set(s.sel.dial === "ruby-lacquer" ? "#F2EBDD" : "#A6112D"), k);
    const cm = mats.get("CaseMetal"); if (cm) { const to = s.transparent ? 0.14 : 1; cm.transparent = true; cm.opacity += (to - cm.opacity) * k; cm.depthWrite = cm.opacity > 0.9; }
    for (const m of ["Leather", "Rubber"]) { const x = mats.get(m); if (x) x.envMapIntensity = 0.25; }
    for (const m of ["GoldTrim", "Steel", "Gilt", "Gunmetal", "Ruby"]) { const x = mats.get(m); if (x) x.envMapIntensity = 0.85; }
    // --- assembly (intro) and exploded view (product)
    expl.current += (s.explode - expl.current) * (s.reduced ? 1 : 1 - Math.exp(-dt * 5));
    for (const p of rt.parts) {
      const w = WIN.get(p.name) ?? [0, 1], pr = intro ? windowed(live.assembly, w[0], w[1]) : 1;
      const fly = (1 - pr) * (p.dist * 2 + 9), kk = expl.current + 0; // fly distance (cm) when not yet assembled
      const e = exploded([p.base.x, p.base.y, p.base.z], p.axis, p.dist, kk);
      p.node.position.set(e[0] + p.axis[0] * fly, e[1] + p.axis[1] * fly, e[2] + p.axis[2] * fly);
      const comp = COMPS[p.name], strap = STRAPS[p.name];
      p.node.visible = (!intro || pr > 0.002) && (comp ? s.sel.complications.includes(comp as never) : strap ? s.sel.strap === strap : true);
    }
    const plateIn = !intro || windowed(live.assembly, 0, 0.08) > 0.5; for (const o of rt.byName.get("Watch")?.children ?? []) if (/^(Screw_|RubyJewel_)/.test(o.name)) o.visible = plateIn;
    // --- balance wheel, hands, crown
    const bal = rt.byName.get("BalanceWheel"); if (bal) bal.rotation.y = s.pauseMotion && !intro ? 0 : balanceAngle(tt) * live.balanceK;
    const now = new Date(), real = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
    const base = s.timeMode === "live" ? real : HOUR_1010 + (real % 60), a = handAngles(base), h1010 = handAngles(HOUR_1010);
    const sa = live.secAngle ?? (s.pauseMotion ? 0 : a.second);
    const hh = s.timeMode === "live" ? a.hour : h1010.hour, mm = s.timeMode === "live" ? a.minute : h1010.minute;
    rt.byName.get("HourHand")!.rotation.y = -hh; rt.byName.get("MinuteHand")!.rotation.y = -mm; rt.byName.get("SecondsHand")!.rotation.y = -sa;
    const rotor = rt.byName.get("Rotor"); if (rotor && !s.pauseMotion) rotor.rotation.y = Math.sin(tt * 0.6) * 0.5;
    // --- engraving texture follows the text; the caseback shows only when the part is the open caseback
    const key = s.sel.engraving.join("|"); if (key !== lastLines.current) { lastLines.current = key; drawEngraving(s.sel.engraving); (engr.material as THREE.MeshBasicMaterial).map!.needsUpdate = true; }
    // --- group pose: flip for the caseback, drag yaw, slow drift
    const r = root.current!; flip.current += ((s.view === "engraving" && !intro ? Math.PI : 0) - flip.current) * (s.reduced ? 1 : 1 - Math.exp(-dt * 4));
    r.rotation.set(flip.current, live.drag + (s.pauseMotion || intro ? 0 : Math.sin(tt * 0.25) * 0.08), 0);
    if (jewel.current) { jewel.current.visible = intro && live.jewel > 0.01; const sc = (1 - THREE.MathUtils.smoothstep(live.assembly, 0.02, 0.2)) * 1.4 + 0.12; jewel.current.scale.setScalar(sc * live.jewel); jewel.current.rotation.y = tt * 0.7; jewel.current.rotation.x = 0.4; }
    // hover highlight
    for (const p of rt.parts) p.node.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m && "emissive" in m && o.name !== "Crystal" && m.name !== "Glass") { const on = s.hoverPart === p.name; m.emissive.setHex(on ? 0xd7ba75 : 0x000000); m.emissiveIntensity = on ? 0.5 : 0; } });
  });
  return (
    <group>
      <group ref={root}><primitive object={model} /></group>
      <mesh ref={jewel} position={[0, 0.2, 0]}><octahedronGeometry args={[0.6, 0]} /><meshStandardMaterial color="#A6112D" emissive="#A6112D" emissiveIntensity={1.4} roughness={0.1} metalness={0.2} /><pointLight color="#ff3355" intensity={30} distance={14} /></mesh>
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree(), cam = camera as THREE.PerspectiveCamera;
  const TILT: Record<string, [number, number]> = { atelier: [0.3, 1], movement: [0.5, 1.4], material: [0.95, 0.9], complications: [0.18, 0.95], engraving: [0.26, 1], commission: [0.6, 1.12] };
  const pos = useMemo(() => new THREE.Vector3(), []); const cur = useRef({ d: 20, tilt: 1.2, az: 0.1 });
  useFrame((st, dt) => {
    const s = state, L = layout(size.width, size.height); cam.fov = FOV_DEG; cam.near = 0.1; cam.far = 200;
    cam.setViewOffset(size.width, size.height, size.width / 2 - L.cx, size.height / 2 - L.cy, size.width, size.height);
    let d: number, tilt: number, az = 0.12;
    if (!s.introDone) { d = L.dist * live.camK; tilt = live.tilt; az = 0.12 * Math.min(1, live.camK); } else { const [t, f] = TILT[s.view]; d = L.dist * f; tilt = t; }
    const k = s.introDone ? (s.reduced ? 1 : 1 - Math.exp(-dt * 2.6)) : 1;
    cur.current.d += (d - cur.current.d) * k; cur.current.tilt += (tilt - cur.current.tilt) * k; cur.current.az += (az - cur.current.az) * k;
    const { d: dd, tilt: tl, az: a } = cur.current;
    pos.set(Math.sin(a) * Math.sin(tl) * dd, Math.cos(tl) * dd, Math.cos(a) * Math.sin(tl) * dd);
    cam.position.copy(pos); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  });
  return null;
}

function Lifecycle() {
  const { setFrameloop, gl } = useThree();
  useEffect(() => {
    const vis = () => setFrameloop(document.hidden ? "never" : "always"), lost = (e: Event) => { e.preventDefault(); set({ gfx: "poster" }); };
    document.addEventListener("visibilitychange", vis); gl.domElement.addEventListener("webglcontextlost", lost);
    return () => { document.removeEventListener("visibilitychange", vis); gl.domElement.removeEventListener("webglcontextlost", lost); };
  }, [setFrameloop, gl]);
  useEffect(() => { (window as unknown as { __vitraStats: () => unknown }).__vitraStats = () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures }); }, [gl]);
  return null;
}

export default function Scene({ data }: { data: Data }) {
  useStore();
  const drag = useRef<{ x: number; k: number } | null>(null);
  return (
    <Canvas className="stage" data-testid="stage" dpr={[1, 1.75]} camera={{ fov: FOV_DEG, position: [0, 17, 4] }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => { gl.setClearColor("#050505"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
      onPointerDown={(e) => { drag.current = { x: e.clientX, k: live.drag }; }} onPointerMove={(e) => { if (drag.current && state.introDone) live.drag = drag.current.k + (e.clientX - drag.current.x) * 0.008; }} onPointerUp={() => { drag.current = null; }}>
      <ambientLight intensity={0.25} color="#F2EBDD" /><spotLight position={[-14, 22, 8]} angle={0.5} penumbra={0.8} intensity={520} color="#F2EBDD" decay={1.6} distance={80} /><pointLight position={[10, 6, -8]} intensity={120} color="#D7BA75" />
      <Rig /><Watch data={data} /><Lifecycle />
    </Canvas>
  );
}
