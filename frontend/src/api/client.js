const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export function getUploadUrl(path) {
  if (!path) return "";
  const normalized = String(path).replace(/^\/+/, "");
  return `${API_BASE_URL}/uploads/${normalized}`;
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new Error(detail);
  }
  return res.json();
}

/** Create a new chat session. Returns { id, title, created_at, updated_at } */
export async function createSession(title) {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title || null }),
  });
  return handleResponse(res);
}

/** List all sessions, most recently updated first. */
export async function listSessions() {
  const res = await fetch(`${API_BASE_URL}/sessions`);
  return handleResponse(res);
}

/** Get a single session including its full message history. */
export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  return handleResponse(res);
}

/** Delete a session and its messages. */
export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function sendMessage(sessionId, message, language = "en") {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, language }),
  });
  return handleResponse(res);
}

export async function sendMessageWithAttachment(sessionId, message, file, language = "en") {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", message || "");
  formData.append("file", file);
  formData.append("language", language);

  const res = await fetch(`${API_BASE_URL}/chat/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}