import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import ps from "./locales/ps/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ps: { translation: ps },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ps"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Keep <html dir> in sync whenever language changes
const applyDir = (lng) => {
  document.documentElement.dir = lng === "ps" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
};

applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;
