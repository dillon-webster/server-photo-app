import assert from "node:assert/strict";
import test from "node:test";
import { savePhotoLocation } from "../src/components/photoLocation.ts";
import type { Photo } from "../src/types.ts";

test("saves picked coordinates immediately", async () => {
  const calls: unknown[] = [];
  const updatedPhoto = { id: "photo-1" } as Photo;

  const result = await savePhotoLocation(
    async (id, patch) => {
      calls.push({ id, patch });
      return updatedPhoto;
    },
    "photo-1",
    37.422,
    -122.084,
  );

  assert.deepEqual(calls, [{
    id: "photo-1",
    patch: { latitude: 37.422, longitude: -122.084 },
  }]);
  assert.equal(result, updatedPhoto);
});
