import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";
import "dotenv/config";

const isLocal = process.env.DB_MODE === "local";

let client;
try {
  client = createClient(
    isLocal
      ? { url: process.env.LOCAL_DATABASE_URL }
      : { url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
  );

  // PRAGMA foreign_keys only works on local SQLite, not on remote Turso
  if (isLocal) {
    await client.execute("PRAGMA foreign_keys = ON").catch(() => {});
    console.log("🗄️  Using local SQLite database");
  } else {
    console.log("🗄️  Using remote Turso database");
  }
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  process.exit(1);
}

const db = drizzle(client, { schema });

export default db;
