import { playbackUrl } from "../api";

interface VideoPhoto {
  id: string;
  filename: string;
  mimeType: string;
}

export function videoSources(photo: VideoPhoto) {
  return [
    { src: playbackUrl(photo), type: "video/mp4" },
  ];
}
