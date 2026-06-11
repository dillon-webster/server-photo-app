import assert from "node:assert/strict";
import test from "node:test";
import { mapPhotosForLightbox } from "../src/pages/mapPhotos.ts";
import type { MapPhoto } from "../src/types.ts";

test("preserves video metadata for map lightboxes", () => {
  const video: MapPhoto = {
    id: "video-1",
    filename: "video-1.mov",
    originalName: "clip.mov",
    mimeType: "video/quicktime",
    size: 100,
    width: 1920,
    height: 1080,
    duration: 5000,
    dateTaken: null,
    dateUploaded: 123,
    latitude: 10,
    longitude: 20,
    city: "Example",
    country: "USA",
  };

  assert.equal(mapPhotosForLightbox([video])[0].mimeType, "video/quicktime");
});
