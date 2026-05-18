import { expect, test } from "@playwright/test";

test("home page renders canvas UI and switches core modes", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Pi preset" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Draw" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(page.locator(".zoom-value")).toHaveText("100%");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator(".zoom-value")).toHaveText("115%");
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(page.locator(".zoom-value")).toHaveText("100%");
  await expect(page.getByText("Math fact")).toBeVisible();
  const factBox = await page.locator(".fact-box").boundingBox();
  expect(factBox?.height).toBeGreaterThan(90);
  await expect(page.getByRole("link", { name: "Made with heart by PUNEET DIXIT" })).toHaveAttribute(
    "href",
    "https://github.com/puneetdixit200",
  );
  await expect(page.locator(".corner-brand")).toContainText("Made with ❤️ by");
  await expect(page.locator(".corner-brand")).not.toContainText("GitHub");
  await expect(page.getByText("Webcam trace")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Battle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Two Together" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Teach" })).toHaveClass(/is-on/);
  await expect(page.getByText("What the circles mean")).toBeVisible();
  await expect(page.getByText("Visible epicycles")).toBeVisible();
  await expect(page.getByLabel("Visible epicycles metric").locator("b")).toHaveText("180");
  await page.locator(".range-field").filter({ hasText: "Epicycles" }).locator("input").fill("96");
  await expect(page.getByLabel("Visible epicycles metric").locator("b")).toHaveText("96");
  await expect(page.getByLabel("Visible epicycles metric")).toContainText("19% of available detail");
  await page.locator(".range-field").filter({ hasText: "Epicycles" }).locator("input").fill("32");
  await expect(page.getByLabel("Visible epicycles metric").locator("b")).toHaveText("32");

  const panelBefore = await page.locator(".control-panel").boundingBox();
  expect(panelBefore?.height).toBeGreaterThan(680);
  const handle = await page.locator(".panel-grab-zone").boundingBox();
  expect(panelBefore).not.toBeNull();
  expect(handle).not.toBeNull();
  if (panelBefore && handle) {
    await page.mouse.move(handle.x + 40, handle.y + 20);
    await page.mouse.down();
    await page.mouse.move(690, 86, { steps: 8 });
    await page.mouse.up();
    const panelAfter = await page.locator(".control-panel").boundingBox();
    expect(panelAfter?.x).toBeGreaterThan(panelBefore.x + 80);
  }

  const panelBeforeResize = await page.locator(".control-panel").boundingBox();
  const resizeHandle = await page.getByLabel("Resize dashboard").boundingBox();
  expect(panelBeforeResize).not.toBeNull();
  expect(resizeHandle).not.toBeNull();
  if (panelBeforeResize && resizeHandle) {
    await page.mouse.move(resizeHandle.x + resizeHandle.width / 2, resizeHandle.y + resizeHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizeHandle.x + 130, resizeHandle.y - 90, { steps: 8 });
    await page.mouse.up();
    const panelAfterResize = await page.locator(".control-panel").boundingBox();
    expect(panelAfterResize?.width).toBeGreaterThan(panelBeforeResize.width + 60);
    expect(panelAfterResize?.height).toBeLessThan(panelBeforeResize.height - 40);
  }

  await page.getByRole("button", { name: "Dual-axis" }).click();
  await expect(page.getByRole("button", { name: "Dual-axis" })).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "3D" }).click();
  await expect(page.locator(".three-stage canvas")).toBeVisible();
  await page.waitForTimeout(500);
  const readCanvasEnergy = async () =>
    page.locator(".three-stage canvas").evaluate((canvas) => {
    const target = canvas as HTMLCanvasElement;
    const gl = target.getContext("webgl2") ?? target.getContext("webgl");
    if (!gl) {
      return { lit: 0, weighted: 0 };
    }
    const width = target.width;
    const height = target.height;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let lit = 0;
    let weighted = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 10) {
        lit += 1;
        weighted += ((index / 4) % width) * (pixels[index] + pixels[index + 1] + pixels[index + 2]);
      }
    }
    return { lit, weighted };
  });
  const firstFrame = await readCanvasEnergy();
  await page.waitForTimeout(1200);
  const secondFrame = await readCanvasEnergy();
  expect(firstFrame.lit).toBeGreaterThan(100);
  expect(Math.abs(secondFrame.weighted - firstFrame.weighted)).toBeGreaterThan(200000);

  await page.getByRole("button", { name: "Epicycles" }).click();
  await page.getByRole("button", { name: "Sound" }).click();
  await expect(page.getByRole("button", { name: "Sound" })).toHaveClass(/is-on/);
  await expect
    .poll(async () =>
      page.evaluate(() => ({
        active: window.__FOURIER_SOUND_STATE__?.active ?? false,
        voices: window.__FOURIER_SOUND_STATE__?.voices ?? 0,
      })),
    )
    .toMatchObject({ active: true, voices: 24 });

  await page.getByLabel("Recording duration").fill("2");
  await expect(page.getByText("Duration").locator("..")).toContainText("2s");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "GIF" }).click();
  const gif = await download;
  expect(gif.suggestedFilename()).toBe("fourier-drawing-2s.gif");

  expect(messages).toEqual([]);
});
