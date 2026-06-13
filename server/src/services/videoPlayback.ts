import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function videoPlaybackArgs(inputPath: string, outputPath: string) {
  return [
    "-v",
    "error",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  ];
}

export async function createVideoPlayback(
  inputPath: string,
  outputPath: string,
) {
  await execFileAsync("ffmpeg", videoPlaybackArgs(inputPath, outputPath), {
    maxBuffer: 10 * 1024 * 1024,
  });
}
