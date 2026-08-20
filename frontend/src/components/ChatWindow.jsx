import { useTranslation } from "react-i18next";
import EcgTrace from "./EcgTrace";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import MessageList from "./MessageList";
import InputBox from "./InputBox";

export default function ChatWindow({ session, messages, loadingReply, onSend, error, onOpenSidebar }) {
  const { t } = useTranslation();

  return (
    <section className="flex-1 flex flex-col h-full min-w-0">
      <header className="border-b border-hairline px-4 sm:px-10 py-4 flex items-center justify-between gap-4">
        <button
          onClick={onOpenSidebar}
          aria-label="Open chat list"
          className="sm:hidden font-mono text-xs border border-hairline rounded-sm px-2 py-1"
        >
          ☰
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
            {session ? t("activeChat") : t("noChatSelected")}
          </p>
          <h2 className="font-display text-lg font-semibold text-ink truncate">
            {session ? session.title : t("startNewChat")}
          </h2>
        </div>
        <div className="hidden sm:block">
          <EcgTrace active={loadingReply} />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {error && (
        <div className="mx-4 sm:mx-10 mt-3 border border-pulse/30 bg-pulse/5 text-pulse text-xs font-mono px-3 py-2 rounded-sm">
          {error}
        </div>
      )}

      <MessageList messages={messages} loadingReply={loadingReply} />
      <InputBox onSend={onSend} disabled={loadingReply} />
    </section>
  );
}
