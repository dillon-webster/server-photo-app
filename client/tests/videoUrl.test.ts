import assert from "node:assert/strict";
import test from "node:test";
import { playbackUrl } from "../src/api.ts";

test("builds the browser-compatible video playback URL", () => {
  assert.equal(
    playbackUrl({ id: "video-1" }),
    "/uploads/playback/video-1.mp4",
  );
});
