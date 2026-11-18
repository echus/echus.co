// Makes the project screenshots in src/assets/projects/. An app with dark and light modes gets
// <slug>-dark.png and <slug>-light.png, and the page shows the one that matches its theme.
// Other apps get <slug>.png. Most apps follow the system theme. An app that takes its theme from the
// address has {theme} in its URL. The page crops each shot to 4:3 from the top left.
// Run it with `npm run screenshots`, or `npm run screenshots -- bindfit` for some apps only.
// It uses the installed Chrome, or the browser at CHROME.

import { chromium } from "playwright-core";

const APPS = [
  { slug: "dumb-tasks", url: "https://dumbtasks.app", themes: true },
  {
    slug: "wallpaper",
    url: "https://wallpaper.echus.co/?seed=570791&device=custom&w=1600&h=1200&colour=rhodamine&accents=99&glitch=0.5&mode={theme}",
    themes: true,
  },
  {
    slug: "datastudio",
    url: "https://app.datastudioapp.com/optimap-phase-explorer?analysis=aqrWz6qtQ3c",
    window: [1600, 990],
    themes: true,
    // Closes the alpha preview banner
    click: 'button:has-text("close")',
  },
  {
    slug: "bindfit",
    url: "https://app.supramolecular.org/bindfit/view/019a9490-9143-4776-9c7a-1a155ff0a602",
    window: [1440, 900],
  },
  // The video is paused on the 3D printer at 36s
  { slug: "makerspace", url: "https://canberramaker.space", window: [1710, 989], themes: true, video: 36 },
];

const only = process.argv.slice(2);
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : { channel: "chrome" },
);

async function shoot({ slug, url, window: [width, height] = [1200, 900], click, video }, theme) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme ?? "light" });
  await page.goto(url.replace("{theme}", theme));
  // Wait for apps that load their content after the page
  await page.waitForTimeout(5000);
  if (click) {
    await page.locator(click).first().click();
    await page.waitForTimeout(2000);
  }
  // The video server does not allow seeking, so the video plays from the start up to the frame.
  if (video) {
    await page.$eval("video", async (v, at) => {
      v.controls = false;
      v.muted = true;
      v.currentTime = 0;
      v.playbackRate = 2;
      await v.play();
      await new Promise((reached) => (v.ontimeupdate = () => v.currentTime >= at && reached()));
      v.pause();
    }, video);
  }
  const file = `src/assets/projects/${slug}${theme ? `-${theme}` : ""}.png`;
  await page.screenshot({ path: file, animations: "disabled" });
  await page.close();
  console.log("Wrote", file);
}

await Promise.all(
  APPS.filter((app) => !only.length || only.includes(app.slug)).flatMap((app) =>
    (app.themes ? ["dark", "light"] : [undefined]).map((theme) => shoot(app, theme)),
  ),
);
await browser.close();
