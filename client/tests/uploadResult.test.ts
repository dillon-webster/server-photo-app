import assert from "node:assert/strict";
import test from "node:test";
import {
  missingDatePhotoIds,
  uploadResultError,
} from "../src/uploadResult.ts";

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

test("returns only successful uploaded photos missing a date", () => {
  assert.deepEqual(
    missingDatePhotoIds([
      {
        filename: "dated.jpg",
        ok: true,
        photo: { id: "dated", dateTaken: 1234 },
      },
      {
        filename: "missing.jpg",
        ok: true,
        photo: { id: "missing", dateTaken: null },
      },
      {
        filename: "failed.jpg",
        ok: false,
      },
    ]),
    ["missing"],
  );
});
