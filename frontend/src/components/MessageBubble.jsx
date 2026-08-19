import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { getUploadUrl } from "../api/client";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

export default function MessageBubble({ message }) {
  const { t } = useTranslation();
  const isUser = message.role === "user";

  const imageUrl = message.attachment_type === "image"
    ? (message._localFile ? URL.createObjectURL(message._localFile) : getUploadUrl(message.attachment_path))
    : null;

  return (
    <div className="border-t border-hairline pt-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <p className={`font-mono text-[10px] uppercase tracking-widest ${isUser ? "text-sage-dark" : "text-mist"}`}>
          {isUser ? t("patient") : "EmpathixAI"}
        </p>
        <p className="font-mono text-[10px] text-ink/30">
          {formatTime(message.created_at)} IST
        </p>
      </div>

      {!isUser && message.urgency === "emergency" && (
        <div className="mb-2 border border-pulse/40 bg-pulse/10 text-pulse text-xs font-mono px-3 py-2 rounded-sm">
          ⚠ Flagged as urgent by the triage agent
        </div>
      )}

      {message.attachment_type === "image" && imageUrl && (
        <img
          src={imageUrl}
          alt={message.attachment_filename || "Uploaded image"}
          className="mb-2 max-w-xs max-h-64 rounded-sm border border-hairline object-cover"
        />
      )}
      {message.attachment_type === "document" && (
        <div className="mb-2 inline-flex items-center gap-2 border border-hairline rounded-sm bg-mist/5 px-2 py-1.5">
          <span className="font-mono text-xs">📄</span>
          <span className="font-mono text-xs text-ink/70">{message.attachment_filename}</span>
        </div>
      )}

      {isUser ? (
        <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{message.content}</p>
      ) : (
        <div className="text-[15px] leading-relaxed text-ink prose-chat">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}

      {!isUser && (
        <p className="mt-3 font-mono text-[10px] text-ink/30 italic">{t("notDiagnosis")}</p>
      )}
    </div>
  );
}