import { expect, test } from "@playwright/test";
// Visual regression of the product surfaces with the canvas swapped for the poster (WebGL output is not bit-stable across GPUs).
for (const view of ["atelier", "movement", "material", "complications", "engraving", "commission"]) {
  test(`visual: ${view}`, async ({ page }) => {
    await page.goto(`/?gfx=off&skip=1&view=${view}&engrave=ANNA|2026&cx=date`); await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    await expect(page.getByTestId("hud")).toBeVisible(); await page.waitForTimeout(400); await expect(page).toHaveScreenshot(`${view}.png`);
  });
}
