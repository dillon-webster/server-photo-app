import assert from "node:assert/strict";
import test from "node:test";
import { buildUploadFormData } from "../src/uploadFormData.ts";

test("appends the fallback date before upload files", () => {
  const files = [
    new File(["first"], "first.jpg", { type: "image/jpeg" }),
    new File(["second"], "second.jpg", { type: "image/jpeg" }),
  ];

  const formData = buildUploadFormData(files, { date: "2015-10-23" });
  const entries = Array.from(formData.entries());

  assert.equal(entries[0][0], "fallbackDate");
  assert.equal(entries[0][1], "2015-10-23");
  assert.deepEqual(
    entries.slice(1).map(([name, value]) => [
      name,
      value instanceof File ? value.name : value,
    ]),
    [
      ["files", "first.jpg"],
      ["files", "second.jpg"],
    ],
  );
});
