import { useSyncExternalStore } from "react";
import { DEFAULT } from "@vitra/domain";
import type { Selections } from "@vitra/schemas";
export type View = "atelier" | "movement" | "material" | "complications" | "engraving" | "commission";
export const VIEWS: { id: View; label: string; hour: number; blurb: string }[] = [
  { id: "atelier", label: "Atelier", hour: 12, blurb: "The piece" },
  { id: "movement", label: "Movement", hour: 2, blurb: "Open it up" },
  { id: "material", label: "Material Lab", hour: 4, blurb: "Metal, dial, strap" },
  { id: "complications", label: "Complications", hour: 6, blurb: "Add modules" },
  { id: "engraving", label: "Engraving", hour: 8, blurb: "Caseback text" },
  { id: "commission", label: "Commission", hour: 10, blurb: "Save and ask" },
];
export type State = { view: View; prevView: View; sel: Selections; explode: number; transparent: boolean; hoverPart: string | null; timeMode: "1010" | "live"; introDone: boolean; introStep: number; reduced: boolean; pauseMotion: boolean; gfx: "webgl" | "poster"; saved: string | null; quote: string | null };
export const state: State = { view: "atelier", prevView: "atelier", sel: DEFAULT, explode: 0, transparent: false, hoverPart: null, timeMode: "1010", introDone: false, introStep: 0, reduced: false, pauseMotion: false, gfx: "webgl", saved: null, quote: null };
/** Per-frame values the intro drives and the canvas reads. */
export const live = { assembly: 1, camK: 1, tilt: 0.3, balanceK: 1, secAngle: null as number | null, jewel: 0, drag: 0 };
let snap = { ...state }; const subs = new Set<() => void>();
export function set(p: Partial<State>) { Object.assign(state, p); snap = { ...state }; subs.forEach((f) => f()); }
export const useStore = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => snap, () => snap);
