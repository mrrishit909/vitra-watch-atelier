import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
// Budgets. Frame times under SwiftShader (CPU rasteriser) are bounds, not GPU results.
const out = new URL("../../apps/web/out/", import.meta.url).pathname;
const size = (dir: string): number => readdirSync(dir).reduce((a, f) => { const p = join(dir, f), s = statSync(p); return a + (s.isDirectory() ? size(p) : f.endsWith(".js") ? gzipSync(readFileSync(p)).length : 0); }, 0);
test("download weight stays inside the budget", () => { expect(statSync(out + "models/watch.glb").size).toBeLessThan(900_000); expect(size(out + "_next/static/chunks")).toBeLessThan(750_000); });
test("scene cost: draw calls and triangles are bounded", async ({ page }) => {
  await page.goto("/?skip=1&view=movement&explode=1"); await page.waitForFunction(() => typeof (window as unknown as { __vitraStats?: unknown }).__vitraStats === "function", null, { timeout: 30_000 }); await page.waitForTimeout(2000);
  const st = await page.evaluate(() => (window as unknown as { __vitraStats: () => { calls: number; triangles: number } }).__vitraStats()); console.log("renderer", JSON.stringify(st));
  expect(st.calls).toBeLessThan(200); expect(st.triangles).toBeLessThan(150_000);
});
test("the exploded slider answers while the canvas renders", async ({ page }) => {
  await page.goto("/?skip=1&view=movement"); await expect(page.getByTestId("hud")).toBeVisible({ timeout: 30_000 }); await page.waitForTimeout(2000);
  const t0 = Date.now(); await page.getByTestId("explode").fill("0.6"); await expect(page.getByText("60%")).toBeVisible(); console.log("slider-to-readout ms", Date.now() - t0); expect(Date.now() - t0).toBeLessThan(3000);
});
