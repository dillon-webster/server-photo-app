import { useRef, useState } from "react";
import { thumbnailUrl } from "../api";
import { videoSources } from "./videoSources";

interface VideoPhoto {
  id: string;
  filename: string;
  mimeType: string;
}

export function VideoPlayer({ photo }: { photo: VideoPhoto }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  async function play() {
    setError("");
    try {
      await videoRef.current?.play();
    } catch {
      setError("This video could not be played.");
    }
  }

  return (
    <div className="relative flex max-h-full max-w-full items-center justify-center">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        poster={thumbnailUrl(photo)}
        className="max-h-full max-w-full select-none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError("This video could not be played.")}
      >
        {videoSources(photo).map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>

      {!playing && !error && (
        <button
          type="button"
          onClick={play}
          className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-black/70 text-white shadow-2xl transition-colors hover:bg-black/85"
          aria-label="Play video"
        >
          <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {error && (
        <div className="absolute rounded-lg bg-red-950/90 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
