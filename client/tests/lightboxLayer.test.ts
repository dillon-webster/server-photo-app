import assert from "node:assert/strict";
import test from "node:test";
import { LIGHTBOX_LAYER_CLASS } from "../src/components/lightboxLayer.ts";

test("renders the lightbox above Leaflet map panes and controls", () => {
  assert.equal(LIGHTBOX_LAYER_CLASS, "z-[1000]");
});
