"use client";
import { useEffect, useState } from "react";
import { COMPLICATION, ENGRAVE, layout, movement, price, refNumber, setComplication, stationXY, summary, validate } from "@vitra/domain";
import type { Complication, Selections } from "@vitra/schemas";
import type { Data } from "../data";
import { set, state, useStore, VIEWS, type View } from "../store";

const usd = (n: number) => "$" + n.toLocaleString("en-US");
const go = (v: View) => { if (v !== state.view) { set({ prevView: state.view, view: v }); history.replaceState(null, "", `#${v}`); } };
const choose = (p: Partial<Selections>) => set({ sel: { ...state.sel, ...p } });

function Ring() {
  const s = useStore(); const [size, setSize] = useState({ w: 1280, h: 800 });
  useEffect(() => { const f = () => setSize({ w: innerWidth, h: innerHeight }); f(); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []);
  const L = layout(size.w, size.h), idx = VIEWS.findIndex((v) => v.id === s.view);
  const onKey = (e: React.KeyboardEvent) => { const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0; if (d) { e.preventDefault(); const n = (idx + d + VIEWS.length) % VIEWS.length; go(VIEWS[n].id); setTimeout(() => document.querySelector<HTMLElement>(`[data-testid=nav-${VIEWS[n].id}]`)?.focus(), 0); } };
  return (
    <nav className="ring" aria-label="Sections" style={{ ["--cx" as string]: `${L.cx}px`, ["--cy" as string]: `${L.cy}px` }} onKeyDown={onKey}>
      <svg className="hand" width="0" height="0" aria-hidden />
      <div className="needle" style={{ transform: `translate(${L.cx}px, ${L.cy}px) rotate(${idx * 60}deg)` }} aria-hidden><i /></div>
      {VIEWS.map((v, i) => { const a = (i * 60 * Math.PI) / 180; return (
        <button key={v.id} className={v.id === s.view ? "on" : ""} aria-current={v.id === s.view ? "page" : undefined} tabIndex={v.id === s.view ? 0 : -1} onClick={() => go(v.id)} data-testid={`nav-${v.id}`}
          style={{ left: `calc(var(--cx) + var(--r, 0px) * ${Math.sin(a).toFixed(4)})`, top: `calc(var(--cy) - var(--r, 0px) * ${Math.cos(a).toFixed(4)})`, ["--lab" as string]: i === 0 ? "top" : i === 3 ? "bottom" : i < 3 ? "right" : "left" }}>
          <i>{v.hour}</i><b>{v.label}</b></button>); })}
    </nav>
  );
}

function Atelier({ data }: { data: Data }) {
  const s = useStore(), p = price(s.sel);
  return (<section aria-labelledby="h-atelier"><h2 id="h-atelier">{data.product.name}</h2>
    <p className="lede">{data.product.brand}. A 40 mm automatic with a visible movement. Everything here is a demo: the brand, the watch, the prices and the part counts are invented.</p>
    <dl className="spec" data-testid="atelier-spec"><div><dt>Reference</dt><dd data-testid="ref">{refNumber(s.sel)}</dd></div><div><dt>Estimate</dt><dd data-testid="price">{usd(p.total)}</dd></div><div><dt>Beat rate</dt><dd>28,800 vph</dd></div><div><dt>Case</dt><dd>40 mm</dd></div></dl>
    <div className="row2"><label className="chk"><input type="checkbox" checked={s.timeMode === "live"} onChange={(e) => set({ timeMode: e.target.checked ? "live" : "1010" })} data-testid="live-time" /> Show the real time (otherwise 10:08)</label></div>
    <p className="faint">Drag the watch to turn it. Use the dial around it, or the arrow keys on it, to move between sections.</p></section>);
}
function Movement({ data }: { data: Data }) {
  const s = useStore(), m = movement(s.sel), groups = ["case", "display", "complication", "movement", "strap"];
  return (<section aria-labelledby="h-mv"><h2 id="h-mv">Movement</h2>
    <p className="lede">Slide to separate the watch. Parts move along the axes they would come apart on.</p>
    <label className="slider">Exploded <input type="range" min={0} max={1} step={0.01} value={s.explode} onChange={(e) => set({ explode: Number(e.target.value) })} aria-valuetext={`${Math.round(s.explode * 100)} percent`} data-testid="explode" /><output>{Math.round(s.explode * 100)}%</output></label>
    <label className="chk"><input type="checkbox" checked={s.transparent} onChange={(e) => set({ transparent: e.target.checked })} data-testid="transparent" /> Transparent case</label>
    <dl className="spec"><div><dt>Parts</dt><dd data-testid="parts-count">{m.parts}</dd></div><div><dt>Thickness</dt><dd>{m.thicknessMm} mm</dd></div><div><dt>Reserve</dt><dd>{m.powerReserveH} h</dd></div></dl>
    <div className="parts" data-testid="parts-list">{groups.map((g) => (<div key={g}><h3>{g}</h3><ul>{data.parts.filter((p) => p.group === g).map((p) => (<li key={p.name}><button className="part" onMouseEnter={() => set({ hoverPart: p.name })} onMouseLeave={() => set({ hoverPart: null })} onFocus={() => set({ hoverPart: p.name })} onBlur={() => set({ hoverPart: null })} data-testid={`part-${p.name}`}><b>{p.label}</b><span>{p.note}</span></button></li>))}</ul></div>))}</div></section>);
}
function Material({ data }: { data: Data }) {
  const s = useStore(); const grp = (kind: "case" | "dial", cur: string, key: "caseMetal" | "dial") => (
    <fieldset><legend>{kind === "case" ? "Case" : "Dial"}</legend>{data.materials.filter((m) => m.kind === kind).map((m) => (
      <label key={m.id} className={`swatch ${cur === m.id ? "on" : ""}`}><input type="radio" name={key} checked={cur === m.id} onChange={() => choose({ [key]: m.id } as Partial<Selections>)} data-testid={`mat-${m.id}`} /><i style={{ background: m.color }} /><b>{m.label}</b><span>{m.note}{m.price ? ` +${usd(m.price)}` : ""}</span></label>))}</fieldset>);
  return (<section aria-labelledby="h-mat"><h2 id="h-mat">Material Lab</h2><p className="lede">The metal's reflection strength and roughness change with the finish; the colour blends over about half a second.</p>
    {grp("case", s.sel.caseMetal, "caseMetal")}{grp("dial", s.sel.dial, "dial")}
    <fieldset><legend>Strap</legend>{(["leather", "rubber", "bracelet"] as const).map((k) => (<label key={k} className={`swatch ${s.sel.strap === k ? "on" : ""}`}><input type="radio" name="strap" checked={s.sel.strap === k} onChange={() => choose({ strap: k })} data-testid={`strap-${k}`} /><b>{k[0].toUpperCase() + k.slice(1)}</b></label>))}</fieldset>
    {!validate(s.sel).ok && <p className="warn" role="alert" data-testid="warn">{validate(s.sel).errors.join(". ")}.</p>}</section>);
}
function Complications() {
  const s = useStore(), m = movement(s.sel), base = movement({ ...s.sel, complications: [] });
  return (<section aria-labelledby="h-cx"><h2 id="h-cx">Complications</h2><p className="lede">Each module adds parts and thickness and takes a little power reserve. The moon phase needs the date module's drive wheel, so it brings the date with it.</p>
    {(Object.keys(COMPLICATION) as Complication[]).map((c) => (<label key={c} className="chk big"><input type="checkbox" checked={s.sel.complications.includes(c)} onChange={(e) => set({ sel: setComplication(state.sel, c, e.target.checked) })} data-testid={`cx-${c}`} /><b>{COMPLICATION[c].label}</b><span>{COMPLICATION[c].note} +{COMPLICATION[c].parts} parts, +{COMPLICATION[c].thicknessMm} mm{COMPLICATION[c].reserveHours ? `, ${COMPLICATION[c].reserveHours} h reserve` : ""}, +{usd(COMPLICATION[c].price)}</span></label>))}
    <table className="delta"><thead><tr><th></th><th>Plain</th><th>Now</th></tr></thead><tbody data-testid="delta"><tr><td>Parts</td><td>{base.parts}</td><td>{m.parts}</td></tr><tr><td>Thickness</td><td>{base.thicknessMm} mm</td><td>{m.thicknessMm} mm</td></tr><tr><td>Power reserve</td><td>{base.powerReserveH} h</td><td>{m.powerReserveH} h</td></tr></tbody></table></section>);
}
function Engraving() {
  const s = useStore(), v = validate(s.sel), lines = [s.sel.engraving[0] ?? "", s.sel.engraving[1] ?? ""], chars = lines.join("").replace(/ /g, "").length;
  const set1 = (i: number, t: string) => { const e = [...lines]; e[i] = t.toUpperCase(); choose({ engraving: e }); };
  return (<section aria-labelledby="h-en"><h2 id="h-en">Engraving studio</h2><p className="lede">The watch turns to its caseback and the text is projected onto the display back. Capitals, digits and . , &amp; ' - / only.</p>
    {[0, 1].map((i) => (<label key={i} className="field">Line {i + 1}<input value={lines[i]} onChange={(e) => set1(i, e.target.value)} maxLength={ENGRAVE.perLine + 6} aria-invalid={lines[i].length > ENGRAVE.perLine || !ENGRAVE.charset.test(lines[i])} data-testid={`engrave-${i}`} /><small>{lines[i].length}/{ENGRAVE.perLine}</small></label>))}
    <svg viewBox="0 0 200 200" className="caseback" role="img" aria-label={`Caseback preview: ${lines.filter(Boolean).join(", ") || "no engraving"}`} data-testid="caseback"><circle cx="100" cy="100" r="96" fill="#B7C0C7" /><circle cx="100" cy="100" r="86" fill="none" stroke="#25272A" strokeWidth="1" />{lines.filter(Boolean).map((l, i, a) => <text key={i} x="100" y={100 + (i - (a.length - 1) / 2) * 24 + 6} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="600" fontSize="17" fill="#25272A">{l}</text>)}</svg>
    <p className="faint" data-testid="engrave-price">{chars ? `${chars} characters, ${usd(chars * ENGRAVE.perChar)}` : "No engraving"}</p>
    {!v.ok && <p className="warn" role="alert" data-testid="warn">{v.errors.join(". ")}.</p>}</section>);
}
function Commission() {
  const s = useStore(), p = price(s.sel), v = validate(s.sel), m = movement(s.sel); const [email, setEmail] = useState(""), [notes, setNotes] = useState(""), [msg, setMsg] = useState("");
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (<section aria-labelledby="h-co"><h2 id="h-co">Commission</h2>
    <table className="delta"><tbody data-testid="bill">{p.lines.map(([k, val]) => <tr key={k}><td>{k}</td><td>{usd(val)}</td></tr>)}<tr className="tot"><td>Estimate</td><td data-testid="total">{usd(p.total)}</td></tr></tbody></table>
    <pre className="sum" data-testid="summary">{summary(s.sel)}</pre><p className="faint">{m.parts} parts, {m.thicknessMm} mm, {m.powerReserveH} h reserve.</p>
    {!v.ok && <p className="warn" role="alert" data-testid="warn">{v.errors.join(". ")}.</p>}
    <div className="row2"><button className="btn" disabled={!v.ok} onClick={() => { const r = refNumber(s.sel); try { localStorage.setItem("vitra:saved", JSON.stringify({ ref: r, sel: s.sel })); } catch {} set({ saved: r }); setMsg(`Saved ${r} in this browser.`); }} data-testid="save">Save configuration</button>
      <button className="btn" onClick={() => navigator.clipboard?.writeText(summary(s.sel)).then(() => setMsg("Summary copied."), () => setMsg("Copy is blocked here; select the text above."))} data-testid="copy">Copy summary</button></div>
    <label className="field">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="email" /></label>
    <label className="field">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} data-testid="notes" /></label>
    <button className="btn primary" disabled={!v.ok || !ok} onClick={() => { const r = refNumber(s.sel); try { localStorage.setItem("vitra:quote", JSON.stringify({ ref: r, email, notes })); } catch {} set({ quote: r }); setMsg(`Quote request ${r} recorded in this browser. In the static demo no email is sent; the API's POST /v1/commissions is the real route.`); }} data-testid="quote">Request a quote</button>
    <p className="faint" role="status" data-testid="msg">{msg}</p></section>);
}

export default function Panels({ data }: { data: Data }) {
  const s = useStore(), idx = VIEWS.findIndex((v) => v.id === s.view);
  const [layoutW, setW] = useState(1280); useEffect(() => { const f = () => setW(innerWidth); f(); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []);
  const V = s.view;
  return (
    <div className="ui" data-testid="hud">
      <header className="top"><span className="brand">VITRA</span><button className="btn ghost" aria-pressed={s.pauseMotion} onClick={() => set({ pauseMotion: !s.pauseMotion })} data-testid="pause-motion">{s.pauseMotion ? "Resume motion" : "Pause motion"}</button></header>
      <Ring />
      <main className={`panel ${s.reduced ? "" : "sweepin"}`} key={V} tabIndex={-1} data-idx={idx} data-w={layoutW}>
        {V === "atelier" && <Atelier data={data} />}{V === "movement" && <Movement data={data} />}{V === "material" && <Material data={data} />}{V === "complications" && <Complications />}{V === "engraving" && <Engraving />}{V === "commission" && <Commission />}
      </main>
    </div>
  );
}
