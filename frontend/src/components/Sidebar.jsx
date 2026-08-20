import { useTranslation } from "react-i18next";

const TAB_COLORS = ["bg-sage", "bg-mist", "bg-pulse/70", "bg-sage-dark", "bg-mist-light"];

function tabColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % TAB_COLORS.length;
  return TAB_COLORS[hash];
}

export default function Sidebar({
  sessions, activeSessionId, onSelect, onNew, onDelete, loading, open, onClose,
  user, onSignInClick, onSignOut,
}) {
  const { t } = useTranslation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/20 z-10 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed sm:static inset-y-0 left-0 z-20 w-72 shrink-0 border-r border-hairline
          binder-spine bg-paper flex flex-col h-full transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="px-5 pt-6 pb-4 border-b border-hairline">
          <p className="font-mono text-[11px] uppercase tracking-widest text-mist">
            {t("patientRecord")}
          </p>
          <h1 className="font-display text-xl font-semibold text-ink mt-1">
            EmpathixAI
          </h1>
        </div>

        <button
          onClick={onNew}
          className="mx-5 mt-4 mb-2 stamp-btn rounded-sm border border-sage-dark/40 bg-sage/10
                     hover:bg-sage/20 text-sage-dark font-mono text-xs tracking-wide
                     uppercase py-2 transition-colors"
        >
          {t("newChat")}
        </button>

        <div className="flex-1 overflow-y-auto px-3 pb-4 mt-2 space-y-1">
          {loading && (
            <p className="px-2 py-4 text-xs font-mono text-ink/40">{t("loadingChats")}</p>
          )}
          {!loading && sessions.length === 0 && (
            <p className="px-2 py-4 text-xs font-mono text-ink/40">{t("noChatsYet")}</p>
          )}
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                className={`group relative flex items-stretch rounded-sm cursor-pointer
                  overflow-hidden border ${
                    isActive
                      ? "border-sage-dark/50 bg-sage/10"
                      : "border-transparent hover:bg-ink/[0.03]"
                  }`}
                onClick={() => {
                  onSelect(s.id);
                  onClose?.();
                }}
              >
                <span className={`w-1 shrink-0 ${tabColor(s.id)}`} aria-hidden="true" />
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <p className="truncate text-sm text-ink font-medium">{s.title}</p>
                  <p className="font-mono text-[10px] text-ink/40 mt-0.5">
                    {new Date(s.updated_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  aria-label={`Delete chat: ${s.title}`}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                             px-2 text-ink/30 hover:text-pulse transition-opacity font-mono text-xs"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-hairline px-5 py-3">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-ink/40 truncate">
                  {user.email || user.phoneNumber || "Signed in"}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="font-mono text-[10px] uppercase text-mist hover:text-pulse shrink-0"
              >
                {t("signOut")}
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="w-full stamp-btn rounded-sm bg-mist/10 hover:bg-mist/20 text-mist font-mono text-xs uppercase tracking-wide py-2"
            >
              {t("signIn")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
