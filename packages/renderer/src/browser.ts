/**
 * @le-relief/renderer – Shared Playwright browser instance
 *
 * Single Chromium binary reused across every slide/platform render.
 * Probes `PLAYWRIGHT_CHROMIUM_PATH` first, falls back to common system paths,
 * then to playwright-core's default launch.
 */

import { chromium, type Browser } from "playwright-core";

let _browser: Browser | null = null;

/** Return a connected, reusable Chromium browser instance. */
export async function getBrowserInstance(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;

  const executablePaths = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ].filter(Boolean) as string[];

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];

  for (const executablePath of executablePaths) {
    try {
      _browser = await chromium.launch({ executablePath, args: launchArgs });
      return _browser;
    } catch {
      // try next
    }
  }

  _browser = await chromium.launch({ args: launchArgs });
  return _browser;
}

/** Close the shared browser if one is running. */
export async function closeBrowserInstance(): Promise<void> {
  if (_browser?.isConnected()) {
    await _browser.close();
  }
  _browser = null;
}
