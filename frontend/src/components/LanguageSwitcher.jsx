import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const setLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("empathixai-lang", lang);
  };

  return (
    <div className="flex items-center border border-hairline rounded-sm overflow-hidden font-mono text-[10px] uppercase">
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-1.5 transition-colors ${i18n.language === "en" ? "bg-sage/20 text-sage-dark" : "text-ink/40 hover:text-ink"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-2 py-1.5 transition-colors border-l border-hairline ${i18n.language === "hi" ? "bg-sage/20 text-sage-dark" : "text-ink/40 hover:text-ink"}`}
      >
        हि
      </button>
    </div>
  );
}