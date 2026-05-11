import fs from "fs";
import path from "path";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export const VOICES = {
  feminine_warm:    "EXAVITQu4vr4xnSDxMaL",
  masculine_serious:"VR6AewLTigWG4xSOukaG",
  feminine_young:   "jsCqWAovK2LkecY7zXl4",
  masculine_warm:   "pNInz6obpgDQGcFmaJgB",
} as const;

export type VoiceKey = keyof typeof VOICES;

export async function generateVoiceover(
  text: string,
  voiceKey: VoiceKey = "feminine_warm",
  outputPath: string
): Promise<string> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const apiKey = process.env.ELEVENLABS_API_KEY;

  // Mode mock si pas de clé ou clé placeholder
  if (!apiKey || apiKey === "REMPLACE_MOI") {
    console.warn("[ElevenLabs] Clé absente — génération d'un fichier audio silencieux mock.");
    return generateSilentMp3(outputPath, estimateDuration(text));
  }

  try {
    const voiceId = VOICES[voiceKey];
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.warn(`[ElevenLabs] Erreur API (${response.status}) — mode mock. ${err}`);
      return generateSilentMp3(outputPath, estimateDuration(text));
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return outputPath;
  } catch (err) {
    console.warn("[ElevenLabs] Erreur réseau — mode mock :", err);
    return generateSilentMp3(outputPath, estimateDuration(text));
  }
}

// Durée estimée en secondes selon le nombre de mots (~130 mots/min)
function estimateDuration(text: string): number {
  return Math.max(5, Math.ceil(text.split(/\s+/).length / 2.2));
}

// Génère un fichier MP3 silencieux valide via FFmpeg
async function generateSilentMp3(outputPath: string, durationSeconds: number): Promise<string> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    await execAsync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${durationSeconds} -c:a libmp3lame "${outputPath}"`
    );
  } catch {
    // FFmpeg pas encore dispo — créer un fichier MP3 minimal valide
    const silentMp3 = Buffer.from(
      "fffb9064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
    fs.writeFileSync(outputPath, silentMp3);
  }

  return outputPath;
}
