import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setAudioCodec("aac");

// Remotion's Chrome download is geo-blocked here; render with the locally
// installed Chrome. Override with REMOTION_BROWSER.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
);
