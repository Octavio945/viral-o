import path from "path";
import fs from "fs";
import { db } from "../db";
import { generateImage } from "./imageGen";
import { generateVoiceover, VoiceKey } from "./elevenlabs";
import { assembleVideo, generateSubtitleFile } from "./ffmpeg";
import { mixMusicOnVideo } from "./music";

const OUTPUT_DIR = path.join(process.cwd(), "output");
const TEMP_DIR = path.join(process.cwd(), "temp");

export interface VideoJobParams {
  videoId: string;
  scriptContent: string;
  profile: {
    company_name: string;
    sector: string;
    communication_style: string;
    logo_url?: string;
  };
  network: string;
  voiceKey?: VoiceKey;
}

export async function runVideoJob(params: VideoJobParams): Promise<void> {
  const { videoId, scriptContent, profile, network, voiceKey } = params;

  await setStatus(videoId, "processing");

  const base = `video_${videoId}`;
  const tempFiles: string[] = [];

  try {
    // Préparer les dossiers
    [OUTPUT_DIR, TEMP_DIR].forEach((d) => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    // Nettoyer le script (retirer indications visuelles + numéros)
    const cleanScript = scriptContent
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/^\d+\.\s*/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const lines = cleanScript.split("\n").map((l) => l.trim()).filter(Boolean);

    // ── Étape 1 : Image ─────────────────────────────────────────────────────
    console.log(`[Video ${videoId}] 1/5 Génération de l'image...`);
    const imagePrompt = `Illustration publicitaire verticale professionnelle pour ${profile.company_name} dans le secteur ${profile.sector}, style moderne épuré, sans texte, palette de couleurs vives`;
    const imagePath = await generateImage(imagePrompt, `${base}_img.png`);
    tempFiles.push(imagePath);

    // ── Étape 2 : Voix off ───────────────────────────────────────────────────
    console.log(`[Video ${videoId}] 2/5 Génération de la voix off...`);
    const resolvedVoice: VoiceKey = voiceKey ?? (
      profile.communication_style === "humoristique" ? "feminine_young"
      : profile.communication_style === "inspirant"  ? "feminine_warm"
      : profile.communication_style === "brut"       ? "masculine_serious"
      : "masculine_warm"
    );
    const audioPath = path.join(TEMP_DIR, `${base}_audio.mp3`);
    await generateVoiceover(cleanScript, resolvedVoice, audioPath);
    tempFiles.push(audioPath);

    // ── Étape 3 : Sous-titres ────────────────────────────────────────────────
    console.log(`[Video ${videoId}] 3/5 Génération des sous-titres...`);
    const srtPath = path.join(TEMP_DIR, `${base}.srt`);
    await generateSubtitleFile(lines, audioPath, srtPath);
    tempFiles.push(srtPath);

    // ── Étape 4 : Assemblage vidéo de base ───────────────────────────────────
    console.log(`[Video ${videoId}] 4/5 Assemblage vidéo...`);
    const rawVideoPath = await assembleVideo({
      imagePath,
      audioPath,
      subtitles: srtPath,
      outputFileName: `${base}_raw.mp4`,
    });
    tempFiles.push(rawVideoPath);

    // ── Étape 5 : Mixage musique de fond ─────────────────────────────────────
    console.log(`[Video ${videoId}] 5/5 Ajout de la musique de fond...`);
    const finalVideoPath = path.join(OUTPUT_DIR, `${base}.mp4`);
    await mixMusicOnVideo(rawVideoPath, profile.communication_style, finalVideoPath);

    // ── Mise à jour BDD ──────────────────────────────────────────────────────
    await db.query(
      `UPDATE videos SET status = 'ready', file_url = $1, updated_at = NOW() WHERE id = $2`,
      [`/output/${base}.mp4`, videoId]
    );

    console.log(`[Video ${videoId}] ✅ Vidéo finale prête !`);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Video ${videoId}] ❌`, message);
    await db.query(
      `UPDATE videos SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
      [message, videoId]
    );
  } finally {
    // Nettoyage des fichiers temporaires (toujours)
    tempFiles.forEach((f) => {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch { /* ignore */ }
      }
    });
  }
}

async function setStatus(videoId: string, status: string) {
  await db.query(
    "UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2",
    [status, videoId]
  );
}
