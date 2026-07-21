import assert from "node:assert/strict";
import test from "node:test";
import {
  parseMaxUploadBytes,
  formatBytes,
  fileTooLargeMessage,
  isFileTooLargeError,
} from "../src/services/uploadLimit.ts";

test("defaults to 5 GB when MAX_UPLOAD_MB is unset or junk", () => {
  const fiveGb = 5120 * 1024 * 1024;
  assert.equal(parseMaxUploadBytes(undefined), fiveGb);
  assert.equal(parseMaxUploadBytes(""), fiveGb);
  assert.equal(parseMaxUploadBytes("lots"), fiveGb);
  assert.equal(parseMaxUploadBytes("0"), fiveGb);
  assert.equal(parseMaxUploadBytes("-100"), fiveGb);
});

test("reads MAX_UPLOAD_MB as megabytes", () => {
  assert.equal(parseMaxUploadBytes("2048"), 2048 * 1024 * 1024);
});

test("formats the limit the way a person would say it", () => {
  assert.equal(formatBytes(5120 * 1024 * 1024), "5 GB");
  assert.equal(formatBytes(1536 * 1024 * 1024), "1.5 GB");
  assert.equal(formatBytes(500 * 1024 * 1024), "500 MB");
});

test("the 413 message names the actual limit", () => {
  assert.match(fileTooLargeMessage(2048 * 1024 * 1024), /up to 2 GB per file/);
});

test("recognises the multipart size error and plain 413s", () => {
  assert.equal(isFileTooLargeError({ code: "FST_REQ_FILE_TOO_LARGE" }), true);
  assert.equal(isFileTooLargeError({ statusCode: 413 }), true);
  assert.equal(isFileTooLargeError(new Error("boom")), false);
  assert.equal(isFileTooLargeError(null), false);
});
