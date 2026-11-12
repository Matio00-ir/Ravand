import { Config } from "@remotion/cli/config";

Config.setEntryPoint("remotion/index.ts");

// Remotion's bundled Chrome download is blocked from Iran; render with the
// locally installed browser instead. Override with REMOTION_BROWSER if needed.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ?? "C:/Program Files/Google/Chrome/Application/chrome.exe"
);

// Compositions reuse site components, which import through the "@/" alias.
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias ?? {}), "@": process.cwd() },
  },
}));
