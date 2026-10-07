// Pure animation maths for the movement, so it can be tested without a GPU.
/** Balance wheel angle in radians: sinusoidal oscillation of amplitude `ampDeg` at `hz`. 28,800 vph = 4 Hz. */
export const balanceAngle = (t: number, hz = 4, ampDeg = 290) => Math.sin(2 * Math.PI * hz * t) * (ampDeg * Math.PI) / 180;
/** Hand angles in radians (clockwise from 12) for a time of day in seconds; the seconds hand sweeps. */
export function handAngles(secOfDay: number) {
  const tau = 2 * Math.PI, s = ((secOfDay % 86400) + 86400) % 86400;
  return { hour: ((s / 43200) % 1) * tau, minute: ((s / 3600) % 1) * tau, second: ((s / 60) % 1) * tau };
}
/** Exploded position of a part: base + axis * dist * k. */
export const exploded = (base: [number, number, number], axis: [number, number, number], dist: number, k: number): [number, number, number] => [base[0] + axis[0] * dist * k, base[1] + axis[1] * dist * k, base[2] + axis[2] * dist * k];
/** Smoothstep progress of a part whose assembly window is [t0, t1] of the global intro progress u (0..1). */
export const windowed = (u: number, t0: number, t1: number) => { const c = Math.min(1, Math.max(0, (u - t0) / (t1 - t0))); return c * c * (3 - 2 * c); };
/** Assembly order and windows, inner movement first so it is visible before the dial covers it. */
export const ASSEMBLY: [string, number, number][] = [
  ["MainPlate", 0, 0.08], ["Barrel", 0.06, 0.16], ["GearCenter", 0.12, 0.22], ["GearThird", 0.17, 0.27], ["GearFourth", 0.21, 0.31], ["EscapeWheel", 0.26, 0.35], ["PalletFork", 0.3, 0.38], ["BalanceWheel", 0.34, 0.46],
  ["BridgeBarrel", 0.42, 0.52], ["BridgeTrain", 0.46, 0.56], ["BridgeBalance", 0.5, 0.6], ["Rotor", 0.56, 0.66], ["Dial", 0.64, 0.74], ["HourHand", 0.72, 0.78], ["MinuteHand", 0.75, 0.81], ["SecondsHand", 0.78, 0.84],
  ["Crown", 0.8, 0.86], ["Case", 0.84, 0.92], ["Bezel", 0.88, 0.94], ["Crystal", 0.92, 0.98], ["Caseback", 0.94, 1], ["StrapLeather", 0.94, 1], ["StrapRubber", 0.94, 1], ["StrapBracelet", 0.94, 1],
];
/** Which of 6 navigation stations (0..5, clockwise from 12) a screen angle is nearest to. */
export const stationAt = (angleRad: number, n = 6) => ((Math.round((((angleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / ((2 * Math.PI) / n)) % n) + n) % n;
