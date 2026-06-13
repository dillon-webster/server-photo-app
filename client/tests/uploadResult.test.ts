import assert from "node:assert/strict";
import test from "node:test";
import { uploadResultError } from "../src/uploadResult.ts";

test("shows the server's per-file upload error", () => {
  assert.equal(
    uploadResultError({ filename: "clip.mov", ok: false, error: "Video decode failed" }),
    "Video decode failed",
  );
});

test("falls back when an older server omits the error", () => {
  assert.equal(
    uploadResultError({ filename: "clip.mov", ok: false }),
    "Upload failed",
  );
});
