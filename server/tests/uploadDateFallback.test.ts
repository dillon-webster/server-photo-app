import assert from "node:assert/strict";
import test from "node:test";
import {
  parseUploadDateFallback,
  resolveUploadDate,
} from "../src/services/uploadDateFallback.ts";

test("creates a fallback timestamp on the selected date", () => {
  const result = parseUploadDateFallback("2015-10-23");

  assert.equal(result.valid, true);
  if (!result.valid || result.value == null) return;

  const date = new Date(result.value);
  assert.equal(date.getFullYear(), 2015);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 23);
  assert.equal(date.getHours(), 12);
});

test("accepts a real leap day", () => {
  const result = parseUploadDateFallback("2024-02-29");

  assert.equal(result.valid, true);
  if (!result.valid || result.value == null) return;

  const date = new Date(result.value);
  assert.equal(date.getFullYear(), 2024);
  assert.equal(date.getMonth(), 1);
  assert.equal(date.getDate(), 29);
});

test("allows an upload without a fallback date", () => {
  assert.deepEqual(parseUploadDateFallback(undefined), {
    valid: true,
    value: null,
  });
});

test("rejects malformed fallback dates", () => {
  assert.deepEqual(parseUploadDateFallback("10/23/2015"), {
    valid: false,
  });
});

test("rejects impossible fallback dates", () => {
  assert.deepEqual(parseUploadDateFallback("2023-02-29"), {
    valid: false,
  });
  assert.deepEqual(parseUploadDateFallback("2015-13-01"), {
    valid: false,
  });
});

test("preserves an extracted date instead of replacing it", () => {
  assert.equal(resolveUploadDate(1234, 5678), 1234);
});

test("uses the fallback when the extracted date is missing", () => {
  assert.equal(resolveUploadDate(null, 5678), 5678);
});
