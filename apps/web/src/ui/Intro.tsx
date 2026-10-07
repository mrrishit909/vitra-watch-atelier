"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { layout } from "@vitra/domain";
import { live, set, state, useStore } from "../store";

// Steps (blueprint section 3): 0 ruby jewel, 1 the train and bridges assemble, 2 balance starts and hands engage, 3 travel through the crystal,
// 4 the seconds hand reaches twelve and the dial's indices become the navigation ring, 5 the clock sweep reveals the application.
const CAPTIONS = ["", "A movement assembles around a single jewel.", "The balance wheel starts. 28,800 beats an hour.", "Through the sapphire, toward the dial.", "Twelve. The markings become the way in.", ""];
export default function Intro() {
  const s = useStore(); const tl = useRef<gsap.core.Timeline | null>(null), [cap, setCap] = useState("");
  const root = document.documentElement;
  const ringR = (k: number) => { const L = layout(innerWidth, innerHeight); root.style.setProperty("--r", `${L.indexPx + (L.ringPx - L.indexPx) * k}px`); root.style.setProperty("--ringk", String(k)); };

  const finish = () => {
    tl.current?.kill(); Object.assign(live, { assembly: 1, camK: 1, tilt: 0.3, balanceK: 1, secAngle: null, jewel: 0 });
    ringR(1); root.style.setProperty("--sweep", "360deg"); root.style.setProperty("--ui", "1"); set({ introDone: true, introStep: 99 });
  };
  useEffect(() => {
    if (state.reduced) return;
    gsap.ticker.lagSmoothing(0);
    Object.assign(live, { assembly: 0, camK: 0.28, tilt: 1.15, balanceK: 0, secAngle: -Math.PI * 1.7, jewel: 0 }); ringR(0); root.style.setProperty("--sweep", "0deg"); root.style.setProperty("--ui", "0");
    const t = gsap.timeline({ defaults: { ease: "power1.inOut" }, onComplete: finish }); tl.current = t;
    const step = (n: number) => () => { set({ introStep: n }); setCap(CAPTIONS[n]); };
    t.call(step(0), [], 0).to(live, { jewel: 1, duration: 1.2 }, 0.2)
      .call(step(1), [], 1.6).to(live, { assembly: 1, duration: 10, ease: "power1.inOut" }, 1.6).to(live, { camK: 1, tilt: 0.42, duration: 10, ease: "power2.inOut" }, 1.6)
      .call(step(2), [], 11.6).to(live, { balanceK: 1, duration: 1.4 }, 11.6)
      .call(step(3), [], 13.2).to(live, { camK: 0.5, tilt: 0.05, duration: 2.2, ease: "power2.inOut" }, 13.2)
      .to(live, { secAngle: 0, duration: 3.8, ease: "none" }, 13.2)
      .call(step(4), [], 17).to({ k: 0 }, { k: 1, duration: 1.6, ease: "power2.inOut", onUpdate() { ringR((this.targets()[0] as { k: number }).k); } }, 17)
      .to(live, { camK: 1, tilt: 0.3, duration: 2, ease: "power2.inOut" }, 17)
      .call(step(5), [], 18.4).to({ v: 0 }, { v: 360, duration: 1.8, ease: "power2.inOut", onUpdate() { const v = (this.targets()[0] as { v: number }).v; root.style.setProperty("--sweep", `${v}deg`); root.style.setProperty("--ui", String(Math.min(1, v / 120))); } }, 18.4)
      .set(live, { secAngle: null }, 20.3);
    return () => { t.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = () => { const t = tl.current; if (t && t.time() < 17) { t.seek(17); } else finish(); };
  if (s.introDone) return null;
  if (s.reduced) {
    const frames = [["A ruby jewel", "Every movement starts with one."], ["The train", "Wheels and bridges close around it."], ["The balance", "It oscillates 28,800 times an hour."], ["Twelve", "The dial's markings become the way in."]];
    return (<div className="intro intro-static" role="dialog" aria-label="Opening story" data-testid="intro"><ol>{frames.map(([a, b], i) => <li key={i}><b>{a}</b> {b}</li>)}</ol><button className="btn primary" onClick={finish} data-testid="skip-intro">Enter the atelier</button></div>);
  }
  return (
    <div className="intro" data-testid="intro" data-step={s.introStep}>
      <p className="caption" role="status">{cap}</p>
      <button className="btn skip" onClick={skip} data-testid="skip-intro" autoFocus>Skip intro</button>
    </div>
  );
}
