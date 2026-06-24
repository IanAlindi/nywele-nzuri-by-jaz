import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE || "http://localhost:4300";
const pages = ["/", "/about.html", "/services.html", "/gallery.html", "/locations.html", "/products.html", "/contact.html"];
const viewports = [
  { name: "mobile-360", width: 360, height: 740 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
let problems = 0;

for (const vp of viewports) {
  for (const path of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
    const res = await page.evaluate(() => {
      const de = document.documentElement;
      const scrollW = de.scrollWidth;
      const clientW = de.clientWidth;
      const overflow = scrollW - clientW;
      let offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > clientW + 1 || r.left < -1) {
            offenders.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 2).join(".")} [right=${Math.round(r.right)} left=${Math.round(r.left)}]`);
          }
        }
      }
      return { scrollW, clientW, overflow, offenders: offenders.slice(0, 6) };
    });
    const tag = res.overflow > 1 ? "❌ OVERFLOW" : "✅ ok";
    if (res.overflow > 1) problems++;
    console.log(`${tag}  ${vp.name.padEnd(12)} ${path.padEnd(16)} scrollW=${res.scrollW} clientW=${res.clientW} (+${res.overflow})`);
    if (res.offenders.length) console.log("       offenders:", res.offenders.join(" | "));
    await page.close();
  }
}

await browser.close();
console.log(problems === 0 ? "\nALL CLEAR — no horizontal overflow on any page/viewport." : `\n${problems} page/viewport combos still overflow.`);
process.exit(problems === 0 ? 0 : 1);
