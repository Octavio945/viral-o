import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Profile {
  company_name: string;
  sector: string;
  target_audience: string;
  products_services: string;
  communication_style: string;
}

interface GenerateIdeasParams {
  theme: string;
  network?: string;
  profile: Profile;
}

interface VideoIdea {
  title: string;
  hook: string;
  hashtags: string[];
  estimated_duration: number;
}

export async function generateIdeas({ theme, network, profile }: GenerateIdeasParams): Promise<VideoIdea[]> {
  const prompt = `
Tu es un expert en marketing vidéo court pour les réseaux sociaux.

Contexte de l'entreprise :
- Nom : ${profile.company_name}
- Secteur : ${profile.sector}
- Cible : ${profile.target_audience}
- Produits/services : ${profile.products_services}
- Style de communication : ${profile.communication_style}
${network ? `- Réseau cible : ${network}` : ""}

Thème demandé : "${theme}"

Génère exactement 5 idées de vidéos courtes (60-90 secondes) adaptées à ce contexte.
Chaque idée doit être pertinente pour la cible et le secteur.

Réponds UNIQUEMENT avec un tableau JSON valide de 5 objets ayant cette structure :
[
  {
    "title": "titre accrocheur",
    "hook": "les 3 premières secondes (phrase qui accroche)",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "estimated_duration": 60
  }
]
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const raw = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.ideas || [];
}

interface GenerateScriptParams {
  idea: VideoIdea & { title: string; hook: string };
  profile: Profile;
  network: string;
}

export async function generateScript({ idea, profile, network }: GenerateScriptParams): Promise<string> {
  const toneByNetwork: Record<string, string> = {
    tiktok: "rapide, dynamique, accroche forte dès la 1ère seconde, phrases courtes",
    instagram: "visuel, émotionnel, storytelling, CTA clair",
    linkedin: "professionnel, valeur ajoutée, posé, crédible",
    youtube: "structuré, intro forte, développement, rappel en fin de vidéo",
  };

  const tone = toneByNetwork[network.toLowerCase()] || "dynamique et engageant";

  const prompt = `
Tu es un scénariste expert en contenu vidéo court pour les réseaux sociaux.

Entreprise : ${profile.company_name} (${profile.sector})
Cible : ${profile.target_audience}
Style : ${profile.communication_style}
Réseau : ${network} → ton : ${tone}

Idée de vidéo :
- Titre : ${idea.title}
- Hook : ${idea.hook}

Écris un script complet de 60 à 90 secondes.
Format :
- Phrase par phrase, numérotées
- Entre parenthèses : indication visuelle (ex: "(montrer le produit)", "(sourire caméra)")
- Commence OBLIGATOIREMENT par le hook fourni
- Termine par un appel à l'action clair

Réponds uniquement avec le script, sans introduction ni explication.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}
