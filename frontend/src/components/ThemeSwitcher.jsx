import { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/useTheme";

const THEME_META = {
  chart: { label: "Chart", desc: "Clinical daylight", swatch: "#6B9080" },
  midnight: { label: "Midnight Ward", desc: "Night-shift dark", swatch: "#D9A441" },
  apothecary: { label: "Apothecary", desc: "Vintage parchment", swatch: "#5C7A4F" },
};

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change theme"
        className="stamp-btn flex items-center gap-2 rounded-sm px-3 py-1.5 bg-sage/10 hover:bg-sage/20 transition-colors"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-ink/20"
          style={{ backgroundColor: THEME_META[theme].swatch }}
          aria-hidden="true"
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
          {THEME_META[theme].label}
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-52 border border-hairline bg-paper shadow-lg rounded-sm py-1.5 z-30">
          {themes.map((t) => (
            <button
              key={t}
              role="menuitem"
              onClick={() => { setTheme(t); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-ink/[0.04] transition-colors ${theme === t ? "bg-sage/10" : ""}`}
            >
              <span
                className="w-3 h-3 rounded-full border border-ink/20 shrink-0"
                style={{ backgroundColor: THEME_META[t].swatch }}
              />
              <span className="flex-1 min-w-0">
                <span className="block font-mono text-xs text-ink">{THEME_META[t].label}</span>
                <span className="block font-mono text-[10px] text-ink/40">{THEME_META[t].desc}</span>
              </span>
              {theme === t && <span className="text-sage-dark text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}