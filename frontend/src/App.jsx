import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AuthModal from "./components/AuthModal";
import { useChat } from "./hooks/useChat";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, signOut } = useAuth();

  const {
    sessions, activeSessionId, messages, loadingReply, loadingSessions, error,
    selectSession, startNewSession, removeSession, sendUserMessage,
  } = useChat();

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-paper">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={selectSession}
        onNew={startNewSession}
        onDelete={removeSession}
        loading={loadingSessions}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onSignInClick={() => setAuthModalOpen(true)}
        onSignOut={signOut}
      />
      <ChatWindow
        session={activeSession}
        messages={messages}
        loadingReply={loadingReply}
        onSend={sendUserMessage}
        error={error}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default App;