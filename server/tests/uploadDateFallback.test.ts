import assert from "node:assert/strict";
import test from "node:test";
import {
  parseUploadDateFallback,
  resolveUploadDate,
} from "../src/services/uploadDateFallback.ts";

test("creates a fallback timestamp on the first day of the selected month", () => {
  const result = parseUploadDateFallback("2015", "10");

  assert.equal(result.valid, true);
  if (!result.valid || result.value == null) return;

  const date = new Date(result.value);
  assert.equal(date.getFullYear(), 2015);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 1);
  assert.equal(date.getHours(), 12);
});

test("allows an upload without fallback fields", () => {
  assert.deepEqual(parseUploadDateFallback(undefined, undefined), {
    valid: true,
    value: null,
  });
});

test("rejects incomplete fallback fields", () => {
  assert.deepEqual(parseUploadDateFallback("2015", undefined), {
    valid: false,
  });
});

test("rejects out-of-range fallback fields", () => {
  assert.deepEqual(parseUploadDateFallback("2015", "13"), {
    valid: false,
  });
  assert.deepEqual(parseUploadDateFallback("999", "10"), {
    valid: false,
  });
});

test("preserves an extracted date instead of replacing it", () => {
  assert.equal(resolveUploadDate(1234, 5678), 1234);
});

test("uses the fallback when the extracted date is missing", () => {
  assert.equal(resolveUploadDate(null, 5678), 5678);
});
