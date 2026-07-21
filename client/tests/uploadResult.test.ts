import assert from "node:assert/strict";
import test from "node:test";
import {
  uploadRequestError,
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

test("replaces Fastify's bare 413 body with actionable advice", () => {
  assert.equal(
    uploadRequestError(413, JSON.stringify({ error: "Payload Too Large" })),
    "File is too large for the server. Ask the admin to raise MAX_UPLOAD_MB.",
  );
});

test("keeps the server's 413 message when it names the limit", () => {
  assert.equal(
    uploadRequestError(
      413,
      JSON.stringify({ error: "File is too large — this server accepts up to 5 GB per file." }),
    ),
    "File is too large — this server accepts up to 5 GB per file.",
  );
});

test("handles a non-JSON 413 from a reverse proxy", () => {
  assert.equal(
    uploadRequestError(413, "<html>413 Request Entity Too Large</html>"),
    "File is too large for the server. Ask the admin to raise MAX_UPLOAD_MB.",
  );
});

test("falls back to the status code for other failures", () => {
  assert.equal(uploadRequestError(500, "not json"), "Upload failed: 500");
});
