import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE || "http://localhost:4300";
const out = "C:\\Users\\fredr\\AppData\\Local\\Temp\\claude\\C--Users-fredr\\e4ee04a7-b387-425f-b3eb-62ff8681ccfd\\scratchpad";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });

async function shoot(name, w, h, opts = {}) {
  const page = await browser.newPage();
  if (!opts.motion) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(BASE + (opts.path || "/"), { waitUntil: "networkidle2", timeout: 40000 });
  await new Promise((r) => setTimeout(r, opts.motion ? 2600 : 900));
  if (opts.scrollSel) {
    await page.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.offsetTop + 10); }, opts.scrollSel);
    await new Promise((r) => setTimeout(r, 1400));
  }
  if (opts.selector) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), opts.selector);
    await new Promise((r) => setTimeout(r, 1200));
    const el = await page.$(opts.selector);
    await el.screenshot({ path: `${out}\\${name}.png` });
  } else {
    await page.screenshot({ path: `${out}\\${name}.png`, fullPage: !!opts.full });
  }
  console.log("shot:", name);
  await page.close();
}

await shoot("gallery-mob", 390, 844, { path: "/gallery.html", full: true });
await shoot("gallery-desk", 1280, 900, { path: "/gallery.html", full: true });
await shoot("story-desk", 1280, 800, { motion: true, scrollSel: "#story" });
await shoot("story-mob", 390, 800, { motion: true, scrollSel: "#story" });
await shoot("desk-motion-hero", 1280, 820, { motion: true });
await shoot("desk-products", 1280, 820, { path: "/products.html" });
await shoot("desk-intro", 1280, 820, { selector: "#intro" });
await shoot("mob-intro", 390, 844, { selector: "#intro" });
await shoot("desk-hero", 1280, 820, {});
await shoot("desk-lookbook", 1280, 820, { selector: "#lookbook" });
await shoot("desk-full", 1280, 820, { full: true });
await shoot("mob-full", 390, 844, { full: true });
await shoot("mob-hero", 390, 844, {});
await browser.close();
console.log("done");
