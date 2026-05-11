import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TEMP_DIR = path.join(process.cwd(), "temp");

export async function generateImage(prompt: string, outputFileName: string): Promise<string> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: `Image publicitaire verticale (9:16) pour une vidéo de réseau social : ${prompt}. Style moderne, professionnel, sans texte superposé.`,
    n: 1,
    size: "1024x1792",
    quality: "standard",
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("Aucune image générée");

  const outputPath = path.join(TEMP_DIR, outputFileName);
  fs.writeFileSync(outputPath, Buffer.from(imageData, "base64"));

  return outputPath;
}
