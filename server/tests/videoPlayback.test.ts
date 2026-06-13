import assert from "node:assert/strict";
import test from "node:test";
import { videoPlaybackArgs } from "../src/services/videoPlayback.ts";

test("transcodes uploaded videos to browser-compatible H.264 MP4", () => {
  const args = videoPlaybackArgs("input.mov", "output.mp4");

  assert.deepEqual(args.slice(0, 4), ["-v", "error", "-i", "input.mov"]);
  assert.ok(args.includes("libx264"));
  assert.ok(args.includes("yuv420p"));
  assert.ok(args.includes("aac"));
  assert.equal(args.at(-1), "output.mp4");
});
