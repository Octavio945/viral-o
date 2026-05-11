import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const MUSIC_DIR = path.join(process.cwd(), "assets", "music");

// Styles → fichier musique (à placer dans apps/api/assets/music/)
const MUSIC_MAP: Record<string, string> = {
  humoristique: "upbeat.mp3",
  inspirant:    "inspiring.mp3",
  pédagogique:  "calm.mp3",
  brut:         "energetic.mp3",
  default:      "inspiring.mp3",
};

export async function mixMusicOnVideo(
  videoPath: string,
  communicationStyle: string,
  outputPath: string
): Promise<string> {
  const musicFile = MUSIC_MAP[communicationStyle] ?? MUSIC_MAP.default;
  const musicPath = path.join(MUSIC_DIR, musicFile);

  // Si la musique n'existe pas, on retourne la vidéo sans modification
  if (!fs.existsSync(musicPath)) {
    console.warn(`[Music] Fichier introuvable : ${musicPath} — vidéo sans musique.`);
    fs.copyFileSync(videoPath, outputPath);
    return outputPath;
  }

  // Mélange : voix off (volume 100%) + musique de fond (volume 15%)
  const cmd = [
    "ffmpeg -y",
    `-i "${videoPath}"`,
    `-stream_loop -1 -i "${musicPath}"`,
    `-filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.15[music];[voice][music]amix=inputs=2:duration=first[aout]"`,
    `-map 0:v -map "[aout]"`,
    `-c:v copy -c:a aac -b:a 192k`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(" ");

  await execAsync(cmd);
  return outputPath;
}

export function getMusicDir(): string {
  return MUSIC_DIR;
}
