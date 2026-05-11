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

export interface VideoIdea {
  title: string;
  hook: string;
  hashtags: string[];
  estimated_duration: number;
}

// ── Mock pour développement sans crédits OpenAI ──────────────────────────────

function mockIdeas(theme: string, profile: Profile): VideoIdea[] {
  return [
    {
      title: `${profile.company_name} : ${theme} — ce que personne ne te dit`,
      hook: `Attends, tu savais vraiment pas ça sur ${theme.toLowerCase()} ? 😱`,
      hashtags: [`#${profile.sector.replace(/\s/g, "")}`, "#astuce", "#conseil", "#viral"],
      estimated_duration: 60,
    },
    {
      title: `Top 3 conseils ${theme} pour ${profile.target_audience}`,
      hook: `Si t'es ${profile.target_audience}, ce conseil va changer ta vie.`,
      hashtags: ["#top3", "#conseils", `#${theme.replace(/\s/g, "").toLowerCase()}`, "#tipsandtricks"],
      estimated_duration: 75,
    },
    {
      title: `La vérité sur ${theme} chez ${profile.company_name}`,
      hook: `On m'a demandé de ne pas partager ça... mais je le fais quand même.`,
      hashtags: ["#vérité", "#transparent", "#behind", "#story"],
      estimated_duration: 90,
    },
    {
      title: `${theme} : l'erreur que tout le monde fait`,
      hook: `J'ai fait cette erreur pendant 2 ans. Ne fais pas comme moi.`,
      hashtags: ["#erreur", "#apprendre", "#leçon", "#business"],
      estimated_duration: 60,
    },
    {
      title: `Comment ${profile.company_name} aborde ${theme} différemment`,
      hook: `Voilà pourquoi on fait les choses autrement — et pourquoi ça marche.`,
      hashtags: ["#différent", "#innovation", "#méthode", "#résultats"],
      estimated_duration: 80,
    },
  ];
}

function mockScript(idea: VideoIdea, profile: Profile, network: string): string {
  const networkNote = {
    tiktok: "(rythme rapide, coupes fréquentes)",
    instagram: "(visuel soigné, ambiance chaleureuse)",
    linkedin: "(ton professionnel, posé)",
    youtube: "(intro forte, développement détaillé)",
  }[network.toLowerCase()] ?? "(dynamique)";

  return `[Script généré en mode développement — ${networkNote}]

1. ${idea.hook}

2. (regarder caméra) Chez ${profile.company_name}, on travaille pour ${profile.target_audience} tous les jours.

3. Et aujourd'hui je veux te parler de : ${idea.title}

4. (montrer le produit ou l'activité) Voici ce qu'on propose concrètement : ${profile.products_services}.

5. La plupart des gens ne savent pas ça — mais c'est exactement ce qui fait la différence.

6. (sourire caméra) Ce qu'on fait, on le fait avec passion et avec le style ${profile.communication_style}.

7. (geste vers caméra) Alors si tu es ${profile.target_audience} et que tu cherches ${profile.sector} de qualité...

8. Tu sais où nous trouver. Le lien est dans la bio ! 👇

${idea.hashtags.join(" ")}`;
}

// ── Génération réelle avec fallback mock ─────────────────────────────────────

export async function generateIdeas({
  theme,
  network,
  profile,
}: GenerateIdeasParams): Promise<VideoIdea[]> {
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
Réponds UNIQUEMENT avec un objet JSON : { "ideas": [ ... ] }
Chaque idée : { "title": "", "hook": "", "hashtags": [], "estimated_duration": 60 }
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    const ideas = Array.isArray(parsed) ? parsed : parsed.ideas || [];
    if (ideas.length > 0) return ideas;
    return mockIdeas(theme, profile);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("billing");

    if (isQuota) {
      console.warn("[OpenAI] Quota dépassé — utilisation du mode mock.");
      return mockIdeas(theme, profile);
    }
    throw err;
  }
}

interface GenerateScriptParams {
  idea: VideoIdea & { title: string; hook: string };
  profile: Profile;
  network: string;
}

export async function generateScript({
  idea,
  profile,
  network,
}: GenerateScriptParams): Promise<string> {
  const toneByNetwork: Record<string, string> = {
    tiktok: "rapide, dynamique, accroche forte dès la 1ère seconde, phrases courtes",
    instagram: "visuel, émotionnel, storytelling, CTA clair",
    linkedin: "professionnel, valeur ajoutée, posé, crédible",
    youtube: "structuré, intro forte, développement, rappel en fin de vidéo",
  };

  const tone = toneByNetwork[network.toLowerCase()] ?? "dynamique et engageant";

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

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content || mockScript(idea, profile, network);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("billing");

    if (isQuota) {
      console.warn("[OpenAI] Quota dépassé — utilisation du script mock.");
      return mockScript(idea, profile, network);
    }
    throw err;
  }
}
