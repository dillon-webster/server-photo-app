import assert from "node:assert/strict";
import test from "node:test";
import { uploadErrorMessage } from "../src/routes/uploadError.ts";

test("returns the processing error message for a failed file", () => {
  assert.equal(
    uploadErrorMessage(new Error("ffmpeg could not decode the video")),
    "ffmpeg could not decode the video",
  );
});

test("returns a safe fallback for unknown errors", () => {
  assert.equal(uploadErrorMessage({}), "Video or photo processing failed");
});
