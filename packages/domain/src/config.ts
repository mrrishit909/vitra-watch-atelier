// Demo configuration rules for a fictional brand. Prices, part counts and power-reserve effects are invented for the demo; they are not horology data.
import type { CaseMetal, Complication, DialFinish, Material, Selections, StrapKind } from "@vitra/schemas";

export const MATERIALS: Material[] = [
  { id: "steel", label: "Polished steel", kind: "case", color: "#B7C0C7", metalness: 1, roughness: 0.18, envIntensity: 1.0, price: 0, note: "904-style stainless, mirror polish." },
  { id: "titanium", label: "Brushed titanium", kind: "case", color: "#8b8f94", metalness: 1, roughness: 0.42, envIntensity: 0.9, price: 600, note: "Grade 5, a third lighter than steel." },
  { id: "rose-alloy", label: "Rose-gold-look alloy", kind: "case", color: "#c58f78", metalness: 1, roughness: 0.22, envIntensity: 1.0, price: 2400, note: "A rose-toned alloy; the demo does not claim a gold content." },
  { id: "ceramic", label: "Black ceramic", kind: "case", color: "#1a1b1d", metalness: 0.15, roughness: 0.12, envIntensity: 1.2, price: 1500, note: "Hardened ceramic, scratch resistant." },
  { id: "obsidian-sunburst", label: "Obsidian sunburst", kind: "dial", color: "#0b0b0c", metalness: 0.5, roughness: 0.32, envIntensity: 1.3, price: 0, note: "Radial brushing on black lacquer." },
  { id: "ivory-enamel", label: "Ivory enamel", kind: "dial", color: "#F2EBDD", metalness: 0.0, roughness: 0.28, envIntensity: 0.7, price: 150, note: "Fired enamel, slight depth." },
  { id: "gunmetal-matte", label: "Gunmetal matte", kind: "dial", color: "#25272A", metalness: 0.6, roughness: 0.7, envIntensity: 0.8, price: 0, note: "Sand-blasted, no glare." },
  { id: "ruby-lacquer", label: "Ruby lacquer", kind: "dial", color: "#7a0f23", metalness: 0.1, roughness: 0.16, envIntensity: 1.5, price: 300, note: "Deep layered lacquer; the seconds hand switches to ivory." },
];
export const BASE_PRICE = 4800;
export const STRAP_PRICE: Record<StrapKind, number> = { leather: 0, rubber: 80, bracelet: 520 };
export const COMPLICATION: Record<Complication, { label: string; price: number; parts: number; thicknessMm: number; reserveHours: number; note: string }> = {
  date: { label: "Date", price: 450, parts: 21, thicknessMm: 0.4, reserveHours: 0, note: "Date ring and window." },
  moon: { label: "Moon phase", price: 1150, parts: 34, thicknessMm: 0.9, reserveHours: -2, note: "Needs the date module's drive wheel." },
  power: { label: "Power reserve", price: 780, parts: 18, thicknessMm: 0.5, reserveHours: -3, note: "A differential reads barrel turns; it draws a little torque." },
};
export const ENGRAVE = { lines: 2, perLine: 18, perChar: 9, charset: /^[A-Z0-9 .,&'\-\/]*$/ };
export const DEFAULT: Selections = { caseMetal: "steel", dial: "obsidian-sunburst", strap: "leather", complications: [], engraving: ["", ""] };

export type Validation = { ok: boolean; errors: string[] };
export function validate(s: Selections): Validation {
  const errors: string[] = [];
  if (!MATERIALS.some((m) => m.kind === "case" && m.id === s.caseMetal)) errors.push(`unknown case metal "${s.caseMetal}"`);
  if (!MATERIALS.some((m) => m.kind === "dial" && m.id === s.dial)) errors.push(`unknown dial "${s.dial}"`);
  if (!(s.strap in STRAP_PRICE)) errors.push(`unknown strap "${s.strap}"`);
  for (const c of s.complications) if (!(c in COMPLICATION)) errors.push(`unknown complication "${c}"`);
  if (new Set(s.complications).size !== s.complications.length) errors.push("a complication is listed twice");
  if (s.complications.includes("moon") && !s.complications.includes("date")) errors.push("Moon phase needs the Date module");
  if (s.caseMetal === "ceramic" && s.strap === "bracelet") errors.push("A ceramic case is not offered with the link bracelet");
  if (s.engraving.length > ENGRAVE.lines) errors.push(`engraving is limited to ${ENGRAVE.lines} lines`);
  s.engraving.forEach((l, i) => {
    if (l.length > ENGRAVE.perLine) errors.push(`engraving line ${i + 1} is over ${ENGRAVE.perLine} characters`);
    if (!ENGRAVE.charset.test(l)) errors.push(`engraving line ${i + 1} has a character that cannot be engraved (use A-Z 0-9 . , & ' - /)`);
  });
  return { ok: errors.length === 0, errors };
}
export function price(s: Selections): { total: number; lines: [string, number][] } {
  const mat = (id: string) => MATERIALS.find((m) => m.id === id)!;
  const chars = s.engraving.join("").replace(/ /g, "").length;
  const lines: [string, number][] = [["Base watch", BASE_PRICE], [mat(s.caseMetal).label, mat(s.caseMetal).price], [mat(s.dial).label + " dial", mat(s.dial).price], [`${s.strap} strap`, STRAP_PRICE[s.strap]]];
  for (const c of s.complications) lines.push([COMPLICATION[c].label, COMPLICATION[c].price]);
  if (chars) lines.push([`Engraving, ${chars} characters`, chars * ENGRAVE.perChar]);
  return { total: lines.reduce((a, [, v]) => a + v, 0), lines: lines.filter(([, v], i) => i === 0 || v !== 0) };
}
export function movement(s: Selections) {
  const cs = s.complications.map((c) => COMPLICATION[c]);
  return { parts: 112 + cs.reduce((a, c) => a + c.parts, 0), thicknessMm: Math.round((8.4 + cs.reduce((a, c) => a + c.thicknessMm, 0)) * 10) / 10, powerReserveH: 70 + cs.reduce((a, c) => a + c.reserveHours, 0), beatsPerHour: 28800 };
}
/** Order-independent reference number: FNV-1a over a canonical string. */
export function refNumber(s: Selections): string {
  const canon = [s.caseMetal, s.dial, s.strap, [...s.complications].sort().join("+"), s.engraving.map((l) => l.trim()).join("|")].join("/");
  let h = 0x811c9dc5; for (const ch of canon) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return "VT-" + h.toString(16).toUpperCase().padStart(8, "0");
}
export function summary(s: Selections): string {
  const p = price(s), m = movement(s), mat = (id: string) => MATERIALS.find((x) => x.id === id)!.label;
  return [`${refNumber(s)}`, `Case: ${mat(s.caseMetal)}`, `Dial: ${mat(s.dial)}`, `Strap: ${s.strap}`, `Complications: ${s.complications.length ? s.complications.map((c) => COMPLICATION[c].label).join(", ") : "none"}`,
    `Engraving: ${s.engraving.filter(Boolean).join(" / ") || "none"}`, `Movement: ${m.parts} parts, ${m.thicknessMm} mm, ${m.powerReserveH} h reserve`, `Estimate: $${p.total.toLocaleString("en-US")}`].join("\n");
}
export function setComplication(s: Selections, c: Complication, on: boolean): Selections {
  let list = on ? [...new Set([...s.complications, c])] : s.complications.filter((x) => x !== c);
  if (on && c === "moon" && !list.includes("date")) list.push("date");        // moon needs date: add it
  if (!on && c === "date") list = list.filter((x) => x !== "moon");            // removing date drops moon
  return { ...s, complications: list };
}
