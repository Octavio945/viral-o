import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voix disponibles par défaut (IDs ElevenLabs)
export const VOICES = {
  feminine_warm: "EXAVITQu4vr4xnSDxMaL",
  masculine_serious: "VR6AewLTigWG4xSOukaG",
  feminine_young: "jsCqWAovK2LkecY7zXl4",
  masculine_warm: "pNInz6obpgDQGcFmaJgB",
} as const;

export type VoiceKey = keyof typeof VOICES;

export async function generateVoiceover(
  text: string,
  voiceKey: VoiceKey = "feminine_warm",
  outputPath: string
): Promise<string> {
  const voiceId = VOICES[voiceKey];

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
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
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${error}`);
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileStream = createWriteStream(outputPath);
  const buffer = await response.arrayBuffer();
  fileStream.write(Buffer.from(buffer));
  fileStream.end();

  return outputPath;
}
