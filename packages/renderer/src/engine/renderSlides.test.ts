import test from "node:test";
import assert from "node:assert/strict";
import { wrapForPlatform } from "../platforms/wrapForPlatform.js";
import {
  INSTAGRAM_FEED,
  INSTAGRAM_STORY,
  FACEBOOK_LINK,
  WHATSAPP_STICKER,
} from "../platforms/index.js";

const SAMPLE_HTML = `<!DOCTYPE html><html><head><style>.foo{color:red}</style></head><body style="background:#000"><div>hello</div></body></html>`;

test("wrapForPlatform passes through instagram-feed untouched", () => {
  const out = wrapForPlatform(SAMPLE_HTML, INSTAGRAM_FEED);
  assert.equal(out, SAMPLE_HTML);
});

test("wrapForPlatform rewraps for instagram-story (1080x1920)", () => {
  const out = wrapForPlatform(SAMPLE_HTML, INSTAGRAM_STORY);
  assert.match(out, /width:1080px;/);
  assert.match(out, /height:1920px;/);
  assert.match(out, /platform-stage/);
});

test("wrapForPlatform rewraps for facebook-link landscape", () => {
  const out = wrapForPlatform(SAMPLE_HTML, FACEBOOK_LINK);
  assert.match(out, /width:1200px;/);
  assert.match(out, /height:630px;/);
});

test("wrapForPlatform uses transparent bg on whatsapp-sticker", () => {
  const out = wrapForPlatform(SAMPLE_HTML, WHATSAPP_STICKER);
  assert.match(out, /background:transparent/);
  assert.match(out, /width:512px;/);
});
