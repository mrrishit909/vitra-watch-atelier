import { expect, test } from "@playwright/test";
test("reduced motion: static story keyframes, no timeline, no panel sweep, same navigation", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" }), page = await ctx.newPage(); await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Opening story" })).toContainText("28,800");
  await expect(page.getByTestId("pause-motion")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("skip-intro").click(); await expect(page.getByRole("heading", { name: "VITRA V40 Automatic" })).toBeVisible();
  await page.getByTestId("nav-movement").click(); await expect(page.getByRole("heading", { name: "Movement", level: 2 })).toBeVisible();
  expect(await page.locator(".panel").evaluate((el) => getComputedStyle(el).animationName)).toBe("none"); await ctx.close();
});
test("graphics failure: poster still, every section still works from the DOM", async ({ page }) => {
  await page.goto("/?gfx=off&skip=1&view=material"); await expect(page.getByTestId("poster")).toBeVisible(); await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByTestId("mat-rose-alloy").check(); await page.getByTestId("nav-commission").click(); await expect(page.getByTestId("total")).toHaveText("$7,200");
  await page.getByTestId("nav-movement").click(); await expect(page.getByTestId("parts-list")).toBeVisible();
});
test("WebGL context loss falls back to the poster", async ({ page }) => {
  await page.goto("/?skip=1&view=atelier"); await expect(page.locator("canvas")).toHaveCount(1, { timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as unknown as { __vitraStats?: unknown }).__vitraStats === "function");
  await page.evaluate(() => document.querySelector("canvas")!.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByTestId("poster")).toBeVisible(); await page.getByTestId("nav-engraving").click(); await expect(page.getByTestId("caseback")).toBeVisible();
});
test("phone width: the dial sits on top, the panel below, nothing scrolls sideways", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true }), page = await ctx.newPage(); await page.goto("/?skip=1&view=material&gfx=off");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const ring = await page.getByTestId("nav-atelier").boundingBox(), panel = await page.locator(".panel").boundingBox(); expect(ring!.y).toBeLessThan(panel!.y);
  await expect(page.getByTestId("mat-titanium")).toBeAttached(); await ctx.close();
});
test("pause motion stops the ambient drift", async ({ page }) => { await page.goto("/?skip=1&view=atelier"); await page.getByTestId("pause-motion").click(); await expect(page.getByTestId("pause-motion")).toHaveText("Resume motion"); });
