import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const MAX_HEIGHT_PX = 240;
const ALLOWED_TYPES = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".docx", ".txt"];

export default function InputBox({ onSend, disabled }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT_PX) + "px";
  }, [value]);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreviewUrl(null);
  }, [file]);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
    e.target.value = "";
  };

  const removeFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!value.trim() && !file) return;
    onSend(value, file);
    setValue("");
    removeFile();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-hairline bg-paper px-6 sm:px-10 py-4">
      {file && (
        <div className="mb-2 inline-flex items-center gap-2 border border-hairline rounded-sm bg-sage/5 px-2 py-1.5">
          {filePreviewUrl ? (
            <img src={filePreviewUrl} alt="Selected attachment" className="w-8 h-8 object-cover rounded-sm" />
          ) : (
            <span className="font-mono text-xs text-mist">📄</span>
          )}
          <span className="font-mono text-xs text-ink/70 max-w-[200px] truncate">{file.name}</span>
          <button
            type="button"
            onClick={removeFile}
            aria-label="Remove attachment"
            className="text-ink/40 hover:text-pulse font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 border border-hairline rounded-sm bg-white/60
                       focus-within:border-mist/60 transition-colors px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach a file or image"
          title="Attach an image or document"
          className="shrink-0 text-ink/40 hover:text-sage-dark transition-colors text-lg leading-none pb-0.5 disabled:opacity-30"
        >
          📎
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={t("inputPlaceholder")}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent outline-none text-[15px] leading-relaxed
                     placeholder:text-ink/30 overflow-y-auto"
          style={{ maxHeight: MAX_HEIGHT_PX }}
        />
        <button
          type="submit"
          disabled={disabled || (!value.trim() && !file)}
          className="shrink-0 stamp-btn font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-sm
                     bg-sage-dark text-paper hover:bg-ink transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {t("logEntry")}
        </button>
      </div>
      <p className="font-mono text-[10px] text-ink/30 mt-2">{t("inputHint")}</p>
    </form>
  );
}