import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
for (const [n, r] of [["dashboard","/dashboard"],["sales","/dashboard/sales"],["finance","/dashboard/finance"]]) {
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.goto("http://localhost:3123" + r, { waitUntil: "networkidle0", timeout: 120000 });
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await new Promise(r => setTimeout(r, 2500));
  await p.screenshot({ path: `shots/${n}.png` });
  await p.screenshot({ path: `shots/${n}-full.png`, fullPage: true });
}
await b.close();
