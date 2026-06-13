import assert from "node:assert/strict";
import test from "node:test";
import { videoSources } from "../src/components/videoSources.ts";

test("tries the compatible MP4 before the uploaded original", () => {
  assert.deepEqual(
    videoSources({
      id: "video-1",
      filename: "video-1.mov",
      mimeType: "video/quicktime",
    }),
    [
      { src: "/uploads/playback/video-1.mp4", type: "video/mp4" },
      {
        src: "/uploads/originals/video-1.mov",
        type: "video/quicktime",
      },
    ],
  );
});
