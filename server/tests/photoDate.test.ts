import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhotoDate } from "../src/routes/photoDate.ts";

test("accepts a finite timestamp from the photo editor", () => {
  assert.deepEqual(normalizePhotoDate(1781244000000), {
    valid: true,
    value: 1781244000000,
  });
});

test("rejects an invalid date instead of clearing the saved date", () => {
  assert.deepEqual(normalizePhotoDate("not a date"), {
    valid: false,
  });
});
