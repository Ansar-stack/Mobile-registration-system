import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "../locales");

const locales = {
  en: JSON.parse(readFileSync(join(localesDir, "en.json"), "utf-8")),
  ps: JSON.parse(readFileSync(join(localesDir, "ps.json"), "utf-8")),
};

// Resolve dot-notation key e.g. "auth.emailExists"
const resolve = (obj, key) =>
  key.split(".").reduce((o, k) => o?.[k], obj) ?? key;

export const t = (lang, key) => resolve(locales[lang] ?? locales.en, key);
