import assert from "node:assert/strict";
import test from "node:test";
import { createOpenClickRef } from "../src/pages/mapPopupClick.ts";

test("attaches the click listener when the popup preview mounts later", () => {
  const preview = new EventTarget();
  let openCount = 0;

  const previewRef = createOpenClickRef(() => {
    openCount += 1;
  });

  previewRef(null);
  preview.dispatchEvent(new Event("click"));
  assert.equal(openCount, 0);

  previewRef(preview);
  preview.dispatchEvent(new Event("click"));
  assert.equal(openCount, 1);

  previewRef(null);
  preview.dispatchEvent(new Event("click"));
  assert.equal(openCount, 1);
});
