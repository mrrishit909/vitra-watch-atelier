import { expect, test, type Page } from "@playwright/test";
const open = async (page: Page, url: string) => { await page.goto(url); await expect(page.getByTestId("hud")).toBeVisible({ timeout: 30_000 }); await expect(page.locator(".app")).toHaveAttribute("data-intro", "done"); await page.waitForFunction(() => typeof (window as unknown as { __vitraStats?: unknown }).__vitraStats === "function", null, { timeout: 30_000 }); };
const num = async (page: Page, id: string) => Number((await page.getByTestId(id).textContent())!.replace(/[^0-9]/g, ""));

// Blueprint section 19, the demo script, step by step.
test("demo walk: intro, movement, materials, complications, engraving, commission", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  // 1. the intro assembles the movement; skip is there from the first frame and fast-forwards into the hand-off
  await expect(page.getByTestId("skip-intro")).toBeVisible(); await expect(page.getByTestId("intro")).toHaveAttribute("data-step", /[0-9]/);
  await page.getByTestId("skip-intro").click();
  await expect(page.getByTestId("intro")).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "VITRA V40 Automatic" })).toBeVisible();
  const ref0 = await page.getByTestId("ref").textContent(), p0 = await num(page, "price"); expect(p0).toBe(4800);
  // 2. movement: exploded view with labelled parts, transparent case
  await page.getByTestId("nav-movement").click(); await expect(page.getByRole("heading", { name: "Movement", level: 2 })).toBeVisible();
  await page.getByTestId("explode").fill("1"); await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByTestId("parts-list").locator("button")).toHaveCount(27);
  await page.getByTestId("part-BalanceWheel").hover(); await page.getByTestId("transparent").check();
  expect(await num(page, "parts-count")).toBe(112);
  // 3. materials: swap case and dial
  await page.getByTestId("nav-material").click(); await page.getByTestId("mat-titanium").check(); await page.getByTestId("mat-ivory-enamel").check();
  // 4. strap and complications (moon pulls the date module in)
  await page.getByTestId("strap-bracelet").check(); await page.getByTestId("nav-complications").click();
  await page.getByTestId("cx-moon").check(); await expect(page.getByTestId("cx-date")).toBeChecked();
  await expect(page.getByTestId("delta")).toContainText("167"); // 112 + date 21 + moon 34
  // 5. engraving
  await page.getByTestId("nav-engraving").click(); await page.getByTestId("engrave-0").fill("for anna"); await page.getByTestId("engrave-1").fill("2026");
  await expect(page.getByTestId("caseback")).toContainText("FOR ANNA"); await expect(page.getByTestId("engrave-price")).toContainText("11 characters");
  // 6. commission: bill, summary, save, quote
  await page.getByTestId("nav-commission").click();
  const total = 4800 + 600 + 150 + 520 + 450 + 1150 + 11 * 9; await expect(page.getByTestId("total")).toHaveText("$" + total.toLocaleString("en-US"));
  await expect(page.getByTestId("summary")).toContainText("Engraving: FOR ANNA / 2026");
  await page.getByTestId("save").click(); await expect(page.getByTestId("msg")).toContainText("Saved VT-");
  await expect(page.getByTestId("quote")).toBeDisabled(); await page.getByTestId("email").fill("buyer@example.com"); await expect(page.getByTestId("quote")).toBeEnabled();
  await page.getByTestId("quote").click(); await expect(page.getByTestId("msg")).toContainText("recorded in this browser");
  // the reference changed with the choices, and the saved config is really in storage
  await page.getByTestId("nav-atelier").click(); expect(await page.getByTestId("ref").textContent()).not.toBe(ref0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vitra:saved")!).sel.caseMetal)).toBe("titanium");
  expect(errors).toEqual([]);
});

test("a ceramic case with the bracelet is refused with the reason, and the quote is blocked", async ({ page }) => {
  await open(page, "/?skip=1&view=material"); await page.getByTestId("mat-ceramic").check(); await page.getByTestId("strap-bracelet").check();
  await expect(page.getByTestId("warn")).toContainText("ceramic case is not offered with the link bracelet");
  await page.getByTestId("nav-commission").click(); await expect(page.getByTestId("save")).toBeDisabled();
});
test("engraving rejects lowercase-only symbols it cannot cut", async ({ page }) => {
  await open(page, "/?skip=1&view=engraving"); await page.getByTestId("engrave-0").fill("HELLO!"); await expect(page.getByTestId("warn")).toContainText("cannot be engraved");
  await page.getByTestId("engrave-0").fill("A".repeat(20)); await expect(page.getByTestId("warn")).toContainText("over 18");
});
test("deep link restores a configuration", async ({ page }) => {
  await open(page, "/?view=commission&case=rose-alloy&dial=ruby-lacquer&strap=rubber&cx=date,power&engrave=ANNA");
  await expect(page.getByTestId("total")).toHaveText("$" + (4800 + 2400 + 300 + 80 + 450 + 780 + 4 * 9).toLocaleString("en-US"));
});
test("refresh mid-sequence restarts the intro cleanly", async ({ page }) => { await page.goto("/"); await page.waitForTimeout(1500); await page.reload(); await expect(page.getByTestId("intro")).toHaveAttribute("data-step", "0"); });
test("keyboard: arrow keys turn the dial clock-wise and the active station follows", async ({ page }) => {
  await open(page, "/?skip=1&view=atelier");
  await expect(async () => { await page.getByTestId("nav-atelier").focus(); await expect(page.getByTestId("nav-atelier")).toBeFocused({ timeout: 500 }); }).toPass({ timeout: 15_000 });
  await page.keyboard.press("ArrowRight"); await expect(page.getByRole("heading", { name: "Movement", level: 2 })).toBeVisible(); await expect(page.getByTestId("nav-movement")).toBeFocused();
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); await expect(page.getByTestId("nav-commission")).toHaveAttribute("aria-current", "page");
});
