import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isLocal = process.env.DB_MODE === "local";

export default defineConfig(
  isLocal
    ? {
        dialect: "turso",
        schema:  "./src/db/schema.js",
        out:     "./drizzle",
        dbCredentials: { url: process.env.LOCAL_DATABASE_URL },
      }
    : {
        dialect: "turso",
        schema:  "./src/db/schema.js",
        out:     "./drizzle",
        dbCredentials: {
          url:       process.env.DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
);
