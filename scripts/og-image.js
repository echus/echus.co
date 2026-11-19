// Makes public/og.jpg, the 1200x630 preview that link previews show. It captures the top of the page
// in dark mode at 1.5x, so the text stays readable at preview size. Reduced motion skips the intro.
// Start the dev server first, then run `npm run og-image`. It uses the installed Chrome, or the
// browser at CHROME. Pass another address to capture a different server.

import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4321";
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : { channel: "chrome" },
);
const page = await browser.newPage({
  viewport: { width: 800, height: 420 },
  deviceScaleFactor: 1.5,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
await page.goto(url);
// Leaves the intro alone in the frame, without the dev toolbar or the start of the projects
await page.evaluate(async () => {
  document.querySelector("astro-dev-toolbar")?.remove();
  document.querySelector("#work").style.visibility = "hidden";
  await document.fonts.ready;
});
await page.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 85, animations: "disabled" });
await browser.close();
console.log("Wrote public/og.jpg");
