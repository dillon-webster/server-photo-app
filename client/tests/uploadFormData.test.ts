import assert from "node:assert/strict";
import test from "node:test";
import { buildUploadFormData } from "../src/uploadFormData.ts";

test("appends fallback year and month before upload files", () => {
  const files = [
    new File(["first"], "first.jpg", { type: "image/jpeg" }),
    new File(["second"], "second.jpg", { type: "image/jpeg" }),
  ];

  const formData = buildUploadFormData(files, { year: 2015, month: 10 });
  const entries = Array.from(formData.entries());

  assert.equal(entries[0][0], "fallbackYear");
  assert.equal(entries[0][1], "2015");
  assert.equal(entries[1][0], "fallbackMonth");
  assert.equal(entries[1][1], "10");
  assert.deepEqual(
    entries.slice(2).map(([name, value]) => [
      name,
      value instanceof File ? value.name : value,
    ]),
    [
      ["files", "first.jpg"],
      ["files", "second.jpg"],
    ],
  );
});
