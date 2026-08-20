import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, loadingReply }) {
  const { t } = useTranslation();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loadingReply]);

  if (messages.length === 0 && !loadingReply) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-sm text-center">
          <p className="font-display text-lg text-ink/70 mb-2">{t("chatEmpty")}</p>
          <p className="font-mono text-xs text-ink/40 leading-relaxed">{t("chatEmptyDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-5">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {loadingReply && (
        <div className="border-t border-hairline pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-mist mb-1.5">
            EmpathixAI
          </p>
          <p className="font-mono text-xs text-ink/40 animate-pulse">{t("reviewingChat")}</p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
