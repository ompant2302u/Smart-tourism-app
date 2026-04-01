import { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS } from "./translations";

export const LANGUAGES = [
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export const LangContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("nw-lang") || "en");

  useEffect(() => {
    localStorage.setItem("nw-lang", lang);
  }, [lang]);

  const t = (key) => {
    const value = TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key];
    return value || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);