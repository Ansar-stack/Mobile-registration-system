import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import db from "../src/db/index.js";
import { users } from "../src/db/schema.js";

const email = "mahmoodkhaliqdad@gmail.com";

const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
if (existing) {
  console.log("Admin already exists.");
} else {
  await db.insert(users).values({ email, password: await bcrypt.hash("admin123", 10), role: "admin" });
  console.log("Admin seeded.");
}


