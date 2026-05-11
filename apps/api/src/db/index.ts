import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

db.on("error", (err) => {
  console.error("[DB] Erreur inattendue :", err.message);
});

export async function testConnection() {
  const client = await db.connect();
  const result = await client.query("SELECT NOW() as now");
  client.release();
  return result.rows[0].now;
}
