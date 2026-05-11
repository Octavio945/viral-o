import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;

// On extrait le nom de la BDD pour la créer si elle n'existe pas
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1); // retire le "/"
url.pathname = "/postgres"; // se connecter à la BDD par défaut

async function setup() {
  console.log("🔧 Configuration de la base de données Viraleo...\n");

  // 1. Créer la base si elle n'existe pas
  const adminPool = new Pool({ connectionString: url.toString() });
  try {
    const exists = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (exists.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de données "${dbName}" créée.`);
    } else {
      console.log(`ℹ️  Base de données "${dbName}" déjà existante.`);
    }
  } finally {
    await adminPool.end();
  }

  // 2. Appliquer le schéma
  const appPool = new Pool({ connectionString: DATABASE_URL });
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf-8"
    );
    await appPool.query(schema);
    console.log("✅ Schéma SQL appliqué avec succès.");
    console.log("\n🎉 Base de données prête !\n");
  } finally {
    await appPool.end();
  }
}

setup().catch((err) => {
  console.error("\n❌ Erreur lors de la configuration :\n", err.message);
  console.error(
    "\n👉 Vérifie que PostgreSQL tourne et que DATABASE_URL est correct dans apps/api/.env"
  );
  process.exit(1);
});
