import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";
import "dotenv/config";

const isLocal = process.env.DB_MODE === "local";
const client = createClient(
  isLocal
    ? { url: process.env.LOCAL_DATABASE_URL }
    : { url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
);

// Enable foreign key enforcement so ON DELETE CASCADE works in SQLite/libSQL
await client.execute("PRAGMA foreign_keys = ON");

if (isLocal) console.log("🗄️  Using local SQLite database");

const db = drizzle(client, { schema });

export default db;
