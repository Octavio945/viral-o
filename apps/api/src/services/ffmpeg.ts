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
  logoPath?: string;
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

  // Filtre de sous-titres optionnel
  const subtitleFilter = subtitles
    ? `,subtitles=${subtitles}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'`
    : "";

  // Commande FFmpeg : image fixe + audio + sous-titres → vidéo 9:16 (1080x1920)
  const command = [
    "ffmpeg -y",
    `-loop 1 -i "${imagePath}"`,
    `-i "${audioPath}"`,
    `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2${subtitleFilter}"`,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 192k`,
    `-shortest`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(" ");

  await execAsync(command);
  return outputPath;
}

export async function generateSubtitleFile(
  scriptLines: string[],
  audioPath: string,
  outputSrtPath: string
): Promise<string> {
  // Estimation simple : 1 ligne ≈ 2 secondes
  let srt = "";
  let currentTime = 0;

  scriptLines.forEach((line, index) => {
    const duration = Math.max(2, Math.ceil(line.split(" ").length / 3));
    const start = formatSrtTime(currentTime);
    const end = formatSrtTime(currentTime + duration);
    srt += `${index + 1}\n${start} --> ${end}\n${line}\n\n`;
    currentTime += duration;
  });

  fs.writeFileSync(outputSrtPath, srt);
  return outputSrtPath;
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}
