import { describe, expect, it } from "vitest";
import { DEFAULT, ENGRAVE, MATERIALS, movement, price, refNumber, setComplication, summary, validate, balanceAngle, handAngles, exploded, windowed, ASSEMBLY, stationAt, layout, stationXY, FOV_DEG } from "../src/index.ts";
import type { Selections } from "@vitra/schemas";
const S = (o: Partial<Selections> = {}): Selections => ({ ...DEFAULT, ...o });

describe("validation", () => {
  it("accepts the default and rejects each rule break with a reason", () => {
    expect(validate(DEFAULT).ok).toBe(true);
    expect(validate(S({ complications: ["moon"] })).errors).toEqual(["Moon phase needs the Date module"]);
    expect(validate(S({ caseMetal: "ceramic", strap: "bracelet" })).errors[0]).toMatch(/ceramic/);
    expect(validate(S({ engraving: ["A", "B", "C"] })).errors[0]).toMatch(/2 lines/);
    expect(validate(S({ engraving: ["x".repeat(19), ""] })).errors.join()).toMatch(/over 18/);
    expect(validate(S({ engraving: ["lower", ""] })).errors.join()).toMatch(/cannot be engraved/);
    expect(validate(S({ complications: ["date", "date"] })).errors).toContain("a complication is listed twice");
    expect(validate({ ...DEFAULT, caseMetal: "gold" as never }).ok).toBe(false);
  });
  it("accepts every charset character at the limit", () => expect(validate(S({ engraving: ["A".repeat(ENGRAVE.perLine), "0-9 .,&'/"] })).ok).toBe(true));
});
describe("price and movement", () => {
  it("adds up line by line", () => {
    const s = S({ caseMetal: "rose-alloy", dial: "ruby-lacquer", strap: "bracelet", complications: ["date", "moon"], engraving: ["AB C", ""] });
    const p = price(s); expect(p.total).toBe(4800 + 2400 + 300 + 520 + 450 + 1150 + 3 * 9);
    expect(p.lines.reduce((a, [, v]) => a + v, 0)).toBe(p.total);
  });
  it("omits zero lines except the base", () => expect(price(DEFAULT).lines).toEqual([["Base watch", 4800]]));
  it("complications add parts and thickness and take reserve", () => {
    expect(movement(DEFAULT)).toEqual({ parts: 112, thicknessMm: 8.4, powerReserveH: 70, beatsPerHour: 28800 });
    expect(movement(S({ complications: ["date", "moon", "power"] }))).toMatchObject({ parts: 185, thicknessMm: 10.2, powerReserveH: 65 });
  });
  it("every material has a distinct id and a hex colour", () => { expect(new Set(MATERIALS.map((m) => m.id)).size).toBe(MATERIALS.length); for (const m of MATERIALS) expect(m.color).toMatch(/^#[0-9a-f]{6}$/i); });
});
describe("complication toggling", () => {
  it("turning moon on pulls date in, turning date off drops moon", () => {
    const a = setComplication(DEFAULT, "moon", true); expect(a.complications.sort()).toEqual(["date", "moon"]);
    expect(setComplication(a, "date", false).complications).toEqual([]);
    expect(setComplication(a, "moon", false).complications).toEqual(["date"]);
    expect(validate(a).ok).toBe(true);
  });
});
describe("reference number and summary", () => {
  it("is stable, order-independent for complications, and changes with any selection", () => {
    const a = S({ complications: ["date", "power"] }), b = S({ complications: ["power", "date"] });
    expect(refNumber(a)).toBe(refNumber(b)); expect(refNumber(a)).toMatch(/^VT-[0-9A-F]{8}$/);
    expect(refNumber(S({ dial: "ivory-enamel" }))).not.toBe(refNumber(DEFAULT)); expect(refNumber(S({ engraving: ["HI", ""] }))).not.toBe(refNumber(DEFAULT));
  });
  it("summary lists the choices and the estimate", () => expect(summary(S({ engraving: ["FOR A", "2026"] }))).toContain("Engraving: FOR A / 2026"));
});
describe("mechanics", () => {
  it("balance is 4 Hz, peaks at the amplitude and returns to zero", () => {
    expect(balanceAngle(0)).toBeCloseTo(0); expect(balanceAngle(1 / 16)).toBeCloseTo((290 * Math.PI) / 180); expect(balanceAngle(0.25)).toBeCloseTo(0, 5);
  });
  it("hands: 3:00:00 puts the hour at a quarter turn, minute and second at 12", () => {
    const h = handAngles(3 * 3600); expect(h.hour).toBeCloseTo(Math.PI / 2); expect(h.minute).toBeCloseTo(0); expect(h.second).toBeCloseTo(0);
    expect(handAngles(-60).second).toBeCloseTo(0); expect(handAngles(90000).hour).toBeCloseTo(handAngles(3600).hour);
  });
  it("exploded moves along the axis only", () => expect(exploded([1, 2, 3], [0, 1, 0], 4, 0.5)).toEqual([1, 4, 3]));
  it("assembly windows: nothing moves at u=0 (except the first), everything lands by u=1, movement before display before case", () => {
    expect(windowed(0, 0.3, 0.5)).toBe(0); expect(windowed(1, 0.3, 0.5)).toBe(1); expect(windowed(0.4, 0.3, 0.5)).toBeCloseTo(0.5);
    const start = (n: string) => ASSEMBLY.find((a) => a[0] === n)![1]; const end = (n: string) => ASSEMBLY.find((a) => a[0] === n)![2];
    expect(start("Dial")).toBeGreaterThan(end("MainPlate")); expect(start("Dial")).toBeGreaterThan(start("BridgeBalance")); expect(start("Case")).toBeGreaterThanOrEqual(end("SecondsHand")); expect(Math.max(...ASSEMBLY.map((a) => a[2]))).toBe(1);
    expect(ASSEMBLY.every(([, a, b]) => a < b)).toBe(true);
  });
  it("stations: 12 o clock is 0 and the opposite side is 3", () => {
    expect(stationAt(0)).toBe(0); expect(stationAt(2 * Math.PI)).toBe(0); expect(stationAt(Math.PI)).toBe(3); expect(stationAt(-0.1)).toBe(0);
  });
});

describe("layout", () => {
  it("desktop puts the watch left of centre with room for a panel; phone puts it on top", () => {
    const d = layout(1440, 900), p = layout(390, 780);
    expect(d.wide).toBe(true); expect(d.cx).toBeLessThan(1440 / 2); expect(d.cx + d.ringPx).toBeLessThan(1440 * 0.62);
    expect(p.wide).toBe(false); expect(p.cx).toBe(195); expect(p.cy).toBeLessThan(780 / 2); expect(p.cx - p.ringPx).toBeGreaterThan(0);
  });
  it("the camera distance projects the dial to the requested pixel radius", () => {
    const l = layout(1440, 900), px = (2.0 / (l.dist * Math.tan((FOV_DEG * Math.PI) / 360))) * (900 / 2);
    expect(px).toBeCloseTo(l.dialPx, 5);
  });
  it("stations sit on the ring: 12 o'clock above the centre, 6 below", () => {
    const l = layout(1440, 900), top = stationXY(l, 0, 6, l.ringPx), bottom = stationXY(l, 3, 6, l.ringPx);
    expect(top[0]).toBeCloseTo(l.cx); expect(top[1]).toBeCloseTo(l.cy - l.ringPx); expect(bottom[1]).toBeCloseTo(l.cy + l.ringPx);
  });
});
