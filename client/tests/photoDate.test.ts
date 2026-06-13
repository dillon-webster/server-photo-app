import assert from "node:assert/strict";
import test from "node:test";
import {
  dateInputToTimestamp,
  timestampToDateInput,
} from "../src/components/photoDate.ts";

test("converts a date input value to the same local calendar date", () => {
  const timestamp = dateInputToTimestamp("2026-06-12");
  const date = new Date(timestamp);

  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 5);
  assert.equal(date.getDate(), 12);
});

test("formats a timestamp for a date input without changing the local date", () => {
  const timestamp = new Date(2015, 9, 29, 14, 22).getTime();

  assert.equal(timestampToDateInput(timestamp), "2015-10-29");
});
