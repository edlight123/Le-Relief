import test from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_SPECS,
  getPlatformSpec,
  listPlatformIds,
} from "./index.js";
import type { PlatformId } from "@le-relief/types";

const ALL_IDS: PlatformId[] = [
  "instagram-feed",
  "instagram-story",
  "instagram-reel-cover",
  "facebook-feed",
  "facebook-link",
  "x-landscape",
  "x-portrait",
  "whatsapp-status",
  "whatsapp-sticker",
  "tiktok",
  "linkedin-feed",
  "linkedin-link",
  "threads",
  "youtube-short-cover",
];

test("every PlatformId has a spec", () => {
  const present = listPlatformIds().sort();
  assert.deepEqual(present, [...ALL_IDS].sort());
});

test("each PlatformSpec is internally consistent", () => {
  for (const id of ALL_IDS) {
    const spec = getPlatformSpec(id);

    // canvas
    assert.ok(spec.canvas.width > 0 && spec.canvas.height > 0, `${id} canvas > 0`);

    // safeArea must fit inside canvas
    const { top, right, bottom, left } = spec.safeArea;
    assert.ok(left + right < spec.canvas.width, `${id} safeArea horizontal fits`);
    assert.ok(top + bottom < spec.canvas.height, `${id} safeArea vertical fits`);

    // aspect string roughly matches canvas
    const [aw, ah] = spec.aspect.split(":").map(Number);
    if (aw && ah) {
      const expected = aw / ah;
      const actual = spec.canvas.width / spec.canvas.height;
      assert.ok(Math.abs(expected - actual) < 0.05, `${id} aspect ~${spec.aspect}`);
    }

    // sticker must be transparent
    if (id === "whatsapp-sticker") {
      assert.equal(spec.background, "transparent");
      assert.equal(spec.exportFormat, "webp");
    }
  }
});

test("PLATFORM_SPECS keys match PlatformId union", () => {
  const keys = Object.keys(PLATFORM_SPECS).sort();
  assert.deepEqual(keys, [...ALL_IDS].sort());
});
