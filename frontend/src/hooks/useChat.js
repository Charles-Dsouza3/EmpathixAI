import { useCallback, useEffect, useState } from "react";
import * as api from "../api/client";
import i18n from "../i18n";

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState(null);

  const refreshSessions = useCallback(async () => {
    try {
      const list = await api.listSessions();
      setSessions(list);
      return list;
    } catch (e) {
      setError(e.message);
      return [];
    }
  }, []);

  const selectSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setError(null);
    try {
      const session = await api.getSession(sessionId);
      setMessages(session.messages || []);
    } catch (e) {
      setError(e.message);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingSessions(true);
      const list = await refreshSessions();
      if (list.length > 0) await selectSession(list[0].id);
      setLoadingSessions(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewSession = useCallback(async () => {
    try {
      const session = await api.createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      return session;
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const removeSession = useCallback(
    async (sessionId) => {
      try {
        await api.deleteSession(sessionId);
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) await selectSession(remaining[0].id);
          else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
      } catch (e) {
        setError(e.message);
      }
    },
    [sessions, activeSessionId, selectSession]
  );

  const sendUserMessage = useCallback(
  async (text, file) => {
    if (!text.trim() && !file) return;
    let sessionId = activeSessionId;

    if (!sessionId) {
      const session = await startNewSession();
      sessionId = session?.id;
      if (!sessionId) return;
    }

    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text || (file ? `(Uploaded: ${file.name})` : ""),
      created_at: new Date().toISOString(),
      attachment_filename: file ? file.name : null,
      attachment_type: file
        ? file.type.startsWith("image/") ? "image" : "document"
        : null,
      attachment_path: null,
      _localFile: file || null,
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoadingReply(true);
    setError(null);

    try {
      const res = file
        ? await api.sendMessageWithAttachment(sessionId, text, file, i18n.language)
        : await api.sendMessage(sessionId, text, i18n.language);

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        sources: res.sources,
        urgency: res.urgency,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      refreshSessions();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingReply(false);
    }
  },
  [activeSessionId, startNewSession, refreshSessions]
);

  return {
    sessions,
    activeSessionId,
    messages,
    loadingReply,
    loadingSessions,
    error,
    selectSession,
    startNewSession,
    removeSession,
    sendUserMessage,
  };
}