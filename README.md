# Viraleo

> De l'idée à la vidéo publiée — automatiquement.

Viraleo est un SaaS de création vidéo automatisée pour les entrepreneurs, auto-entrepreneurs et petites équipes marketing. L'application génère des idées de vidéos, écrit les scripts, monte les vidéos (voix off, sous-titres, musique) et les publie directement sur TikTok, Instagram, LinkedIn et YouTube Shorts — sans aucune compétence technique requise.

---

## Table des matières

- [Concept](#concept)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer le projet en développement](#lancer-le-projet-en-développement)
- [Base de données](#base-de-données)
- [Roadmap](#roadmap)
- [Contribuer](#contribuer)
- [Conventions de code](#conventions-de-code)

---

## Concept

### Le problème

Les petits business perdent 10 à 15h/semaine à :
- trouver des idées de contenu vidéo
- écrire des scripts adaptés à chaque réseau
- monter des vidéos (voix off, sous-titres, musique)
- adapter le format selon la plateforme (TikTok, Instagram, LinkedIn, YouTube Shorts)

### La solution

Viraleo automatise tout ce pipeline en 5 étapes :

```
Profil entreprise (1 seule fois)
         ↓
Choisir un thème (conseil, promo, FAQ…)
         ↓
L'IA propose 5 idées personnalisées
         ↓
L'IA génère le script complet
         ↓
L'IA monte et publie la vidéo
```

### Ce qui différencie Viraleo

| Fonctionnalité | Description |
|---|---|
| Profil mémorisé | L'IA connaît l'entreprise → idées toujours pertinentes |
| Adaptation par réseau | Même idée, ton différent selon TikTok / LinkedIn / YouTube |
| Voix off naturelle | ElevenLabs — qualité pro, sans micro |
| Montage automatique | FFmpeg assemble image + voix + sous-titres incrustés |
| Format 9:16 natif | Vertical par défaut pour Reels, Shorts, TikTok |

---

## Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.x |
| UI | Tailwind CSS | 4.x |
| Backend | Node.js + Express | 4.x |
| Langage | TypeScript | 5.x |
| Base de données | PostgreSQL | 15+ |
| Auth | Clerk | - |
| IA texte | OpenAI GPT-4o-mini | - |
| Voix off | ElevenLabs | v2 |
| Images | DALL·E 3 | - |
| Montage vidéo | FFmpeg | 6+ |
| Package manager | pnpm (workspaces) | 10.x |

---

## Structure du projet

```
viraleo/
├── apps/
│   ├── web/                        # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/                # Pages (App Router)
│   │   │   ├── components/         # Composants réutilisables
│   │   │   └── lib/                # Utilitaires / appels API
│   │   ├── public/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── api/                        # Backend Express
│       ├── src/
│       │   ├── routes/             # Endpoints REST
│       │   │   ├── auth.ts         # POST /api/auth/register|login
│       │   │   ├── profile.ts      # GET|POST /api/profile
│       │   │   ├── ideas.ts        # POST /api/ideas/generate
│       │   │   ├── scripts.ts      # POST /api/scripts/generate, PATCH /:id
│       │   │   └── videos.ts       # POST /api/videos/generate, GET /
│       │   ├── services/           # Intégrations externes
│       │   │   ├── openai.ts       # Génération idées + scripts
│       │   │   ├── elevenlabs.ts   # Voix off
│       │   │   ├── imageGen.ts     # Génération d'images DALL·E
│       │   │   └── ffmpeg.ts       # Assemblage vidéo
│       │   ├── middleware/
│       │   │   ├── auth.ts         # Vérification JWT
│       │   │   └── errorHandler.ts # Gestion centralisée des erreurs
│       │   └── db/
│       │       ├── index.ts        # Pool de connexions PostgreSQL
│       │       └── schema.sql      # Schéma de la base de données
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                     # Types TypeScript partagés
│       └── src/index.ts
│
├── pnpm-workspace.yaml
├── package.json                    # Scripts racine
├── .gitignore
└── README.md
```

### Routes API disponibles

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET | `/api/profile` | Récupérer le profil entreprise |
| POST | `/api/profile` | Créer / mettre à jour le profil |
| POST | `/api/ideas/generate` | Générer 5 idées via IA |
| GET | `/api/ideas` | Historique des idées |
| POST | `/api/scripts/generate` | Générer un script complet |
| PATCH | `/api/scripts/:id` | Modifier un script |
| POST | `/api/videos/generate` | Lancer la génération vidéo |
| GET | `/api/videos` | Liste des vidéos |
| GET | `/api/videos/:id` | Statut d'une vidéo |
| GET | `/health` | Vérification serveur |

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) **v20+**
- [pnpm](https://pnpm.io/) **v10+** — `npm install -g pnpm`
- [PostgreSQL](https://www.postgresql.org/) **v15+**
- [FFmpeg](https://ffmpeg.org/download.html) — accessible dans le PATH système
- Un compte [OpenAI](https://platform.openai.com/) avec une clé API
- Un compte [ElevenLabs](https://elevenlabs.io/) avec une clé API
- Un compte [Clerk](https://clerk.com/) pour l'authentification

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-org/viraleo.git
cd viraleo
```

### 2. Installer les dépendances

```bash
pnpm install
```

Cette commande installe les dépendances de tous les packages du monorepo en une seule fois.

### 3. Configurer les variables d'environnement

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

Remplissez ensuite les fichiers `.env` avec vos clés (voir section [Variables d'environnement](#variables-denvironnement)).

### 4. Initialiser la base de données

```bash
# Créer la base de données PostgreSQL
psql -U postgres -c "CREATE DATABASE viraleo;"

# Appliquer le schéma
psql -U postgres -d viraleo -f apps/api/src/db/schema.sql
```

---

## Variables d'environnement

### `apps/api/.env`

```env
# Serveur
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/viraleo

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=...

# Clerk
CLERK_SECRET_KEY=sk_test_...
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profile
```

> **Important** : Ne commitez jamais les fichiers `.env` ou `.env.local`. Ils sont dans `.gitignore`.

---

## Lancer le projet en développement

### Tout lancer en une commande (depuis la racine)

```bash
pnpm dev
```

Cela démarre en parallèle :
- Frontend Next.js → [http://localhost:3000](http://localhost:3000)
- Backend Express → [http://localhost:4000](http://localhost:4000)
- Vérification santé API → [http://localhost:4000/health](http://localhost:4000/health)

### Lancer séparément

```bash
# Frontend uniquement
cd apps/web && pnpm dev

# Backend uniquement
cd apps/api && pnpm dev
```

---

## Base de données

### Schéma

```
users          → comptes utilisateurs
  └── profiles → profil entreprise (1 par user)
       └── ideas   → idées de vidéos générées par l'IA
            └── scripts → scripts générés ou modifiés
                 └── videos → vidéos assemblées
```

### Modèle de données simplifié

```sql
users       (id, email, clerk_id, created_at)
profiles    (id, user_id, company_name, sector, target_audience,
             products_services, communication_style, social_networks[],
             brand_colors[], logo_url)
ideas       (id, user_id, theme, title, hook, hashtags[], estimated_duration, network)
scripts     (id, idea_id, user_id, content, network, status)
videos      (id, script_id, user_id, status, file_url, thumbnail_url, network, published_at)
```

Le fichier complet est dans [apps/api/src/db/schema.sql](apps/api/src/db/schema.sql).

---

## Roadmap

### V1 — Fondations texte (en cours)
- [x] Structure monorepo pnpm
- [x] Backend Express + PostgreSQL
- [x] Schéma de base de données
- [x] Service OpenAI (idées + scripts)
- [ ] Authentification Clerk
- [ ] Pages frontend : profil, dashboard, idées, scripts
- [ ] Aperçu texte du script

### V2 — Vidéo simple
- [ ] Génération d'image DALL·E 3 (format 9:16)
- [ ] Voix off ElevenLabs
- [ ] Assemblage FFmpeg (image + voix + sous-titres incrustés)
- [ ] Téléchargement MP4
- [ ] Stockage fichiers (S3 ou Cloudinary)

### V3 — Produit complet
- [ ] Plusieurs scènes / clips dans une vidéo
- [ ] Musique de fond libre de droits
- [ ] Publication directe TikTok / Instagram / LinkedIn
- [ ] Calendrier éditorial (4 vidéos/semaine auto)
- [ ] Analyse des tendances via APIs sociales

---

## Contribuer

### Workflow Git

Nous utilisons le workflow **feature branch** :

```bash
# Créer une branche depuis main
git checkout -b feature/nom-de-la-feature

# Travailler, commiter
git add .
git commit -m "feat: description courte de ce que ça fait"

# Pousser et ouvrir une Pull Request
git push origin feature/nom-de-la-feature
```

### Convention de nommage des branches

| Type | Exemple |
|---|---|
| Nouvelle feature | `feature/generation-script` |
| Correction de bug | `fix/erreur-ffmpeg-sous-titres` |
| Amélioration | `improve/ui-dashboard` |
| Documentation | `docs/readme-api` |

### Convention des messages de commit

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat:     nouvelle fonctionnalité
fix:      correction de bug
docs:     modification documentation
style:    formatage (pas de changement logique)
refactor: refactorisation sans ajout de feature
test:     ajout ou modification de tests
chore:    maintenance (deps, config…)
```

Exemples :
```bash
git commit -m "feat: ajouter génération de voix off ElevenLabs"
git commit -m "fix: corriger l'encodage des sous-titres UTF-8"
git commit -m "docs: documenter les routes API"
```

### Avant de soumettre une PR

- [ ] Le code compile sans erreur TypeScript (`pnpm type-check`)
- [ ] Le linter passe sans avertissement (`pnpm lint`)
- [ ] Les variables d'environnement nécessaires sont documentées dans `.env.example`
- [ ] Le schéma SQL est à jour si vous avez modifié la BDD

---

## Conventions de code

- **TypeScript strict** activé partout — pas de `any`
- **Pas de commentaires** sauf si le comportement est non-évident
- **Nommage** : `camelCase` pour les variables/fonctions, `PascalCase` pour les types/composants
- **Imports** : absolus avec `@/*` côté frontend (alias configuré)
- **Erreurs API** : toujours passer par `next(createError(...))` dans Express

---

## Licence

Projet privé — tous droits réservés.
