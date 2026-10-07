"use client";
import { useEffect, useState } from "react";
import { loadData, base, type Data } from "./data";
import { set, state, useStore, VIEWS } from "./store";
import { DEFAULT, validate } from "@vitra/domain";
import type { Selections } from "@vitra/schemas";
import Intro from "./ui/Intro";
import Panels from "./ui/Panels";
import Scene from "./scene/Scene";

const webglOk = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };
function fromQuery(q: URLSearchParams): Selections {
  const s = { ...DEFAULT, engraving: ["", ""] } as Selections;
  const pick = <K extends keyof Selections>(k: K, v: string | null) => { if (v) (s as Record<string, unknown>)[k] = v; };
  pick("caseMetal", q.get("case")); pick("dial", q.get("dial")); pick("strap", q.get("strap"));
  if (q.get("cx")) s.complications = q.get("cx")!.split(",").filter(Boolean) as Selections["complications"];
  if (q.get("engrave")) s.engraving = q.get("engrave")!.split("|").slice(0, 2);
  while (s.engraving.length < 2) s.engraving.push("");
  return validate(s).ok ? s : { ...DEFAULT, engraving: ["", ""] };
}
export default function App() {
  const s = useStore(); const [data, setData] = useState<Data | null>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search), rm = matchMedia("(prefers-reduced-motion: reduce)").matches || q.get("motion") === "reduced", view = VIEWS.find((v) => v.id === q.get("view"))?.id;
    const skip = q.get("skip") === "1" || !!view; const root = document.documentElement;
    set({ reduced: rm, pauseMotion: rm, gfx: q.get("gfx") === "off" || !webglOk() ? "poster" : "webgl", sel: fromQuery(q), ...(view ? { view } : {}), ...(q.get("explode") ? { explode: Number(q.get("explode")) } : {}), ...(skip ? { introDone: true, introStep: 99 } : {}) });
    if (skip) { root.style.setProperty("--r", "0px"); root.style.setProperty("--sweep", "360deg"); root.style.setProperty("--ui", "1"); }
    if (skip) { const w = innerWidth, h = innerHeight, wide = w > 900 && w >= h * 1.1, b = wide ? h : Math.min(h * 0.6, w * 1.05); root.style.setProperty("--r", `${b * 0.37}px`); }
    loadData().then(setData).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => { const f = () => { const v = VIEWS.find((x) => x.id === location.hash.slice(1)); if (v && v.id !== state.view) set({ prevView: state.view, view: v.id }); }; addEventListener("hashchange", f); f(); return () => removeEventListener("hashchange", f); }, []);
  useEffect(() => { if (s.introDone) { const w = innerWidth, h = innerHeight, wide = w > 900 && w >= h * 1.1, b = wide ? h : Math.min(h * 0.6, w * 1.05); const fit = () => document.documentElement.style.setProperty("--r", `${b * 0.37}px`); if (state.reduced) fit(); } }, [s.introDone]);
  if (err) return <div className="boot" role="alert">Could not load data: {err}</div>;
  if (!data) return <div className="boot" role="status">Winding the mainspring…</div>;
  return (
    <div className="app" data-view={s.view} data-intro={s.introDone ? "done" : "running"} data-gfx={s.gfx}>
      {s.gfx === "webgl" ? <Scene data={data} /> : <div className="poster" style={{ backgroundImage: `url(${base}/posters/watch.png)` }} role="img" aria-label="Still of the VITRA V40 watch on black" data-testid="poster" />}
      <div className="vignette" aria-hidden />
      <Panels data={data} />
      {!s.introDone && <Intro />}
    </div>
  );
}
