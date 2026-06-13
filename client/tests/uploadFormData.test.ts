import assert from "node:assert/strict";
import test from "node:test";
import { buildUploadFormData } from "../src/uploadFormData.ts";

test("appends upload files without a fallback date", () => {
  const files = [
    new File(["first"], "first.jpg", { type: "image/jpeg" }),
    new File(["second"], "second.jpg", { type: "image/jpeg" }),
  ];

  const formData = buildUploadFormData(files);
  const entries = Array.from(formData.entries());

  assert.deepEqual(
    entries.map(([name, value]) => [
      name,
      value instanceof File ? value.name : value,
    ]),
    [
      ["files", "first.jpg"],
      ["files", "second.jpg"],
    ],
  );
});
