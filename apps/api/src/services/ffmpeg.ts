import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const OUTPUT_DIR = path.join(process.cwd(), "output");

export interface VideoAssemblyParams {
  imagePath: string;
  audioPath: string;
  subtitles?: string;
  outputFileName: string;
}

export async function assembleVideo({
  imagePath,
  audioPath,
  subtitles,
  outputFileName,
}: VideoAssemblyParams): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  // Sous-titres : on échappe le chemin pour Windows
  const subFilter = subtitles && fs.existsSync(subtitles)
    ? `,subtitles='${subtitles.replace(/\\/g, "/").replace(/:/g, "\\:")}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Shadow=1'`
    : "";

  const cmd = [
    "ffmpeg -y",
    `-loop 1 -i "${imagePath}"`,
    `-i "${audioPath}"`,
    `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black${subFilter}"`,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 192k`,
    `-shortest`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(" ");

  try {
    await execAsync(cmd);
    return outputPath;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found") || msg.includes("ENOENT")) {
      throw new Error(
        "FFmpeg n'est pas installé ou pas dans le PATH. " +
        "Installe-le avec : winget install Gyan.FFmpeg, puis redémarre le terminal."
      );
    }
    throw err;
  }
}

export async function generateSubtitleFile(
  lines: string[],
  _audioPath: string,
  outputSrtPath: string
): Promise<string> {
  let srt = "";
  let currentTime = 0;

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    // ~1 mot toutes les 0.35 secondes (débit de parole naturel)
    const duration = Math.max(1.5, line.split(" ").length * 0.35);
    const start = toSrtTime(currentTime);
    const end = toSrtTime(currentTime + duration);
    srt += `${index + 1}\n${start} --> ${end}\n${line}\n\n`;
    currentTime += duration + 0.1;
  });

  fs.writeFileSync(outputSrtPath, srt, "utf-8");
  return outputSrtPath;
}

function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}
