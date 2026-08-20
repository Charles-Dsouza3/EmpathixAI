const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getAnonymousId() {
  let id = localStorage.getItem("empathixai-anon-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("empathixai-anon-id", id);
  }
  return id;
}

async function buildHeaders(idToken, extra = {}) {
  const headers = { "X-Anonymous-Id": getAnonymousId(), ...extra };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function createSession(title, idToken) {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: await buildHeaders(idToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ title: title || null }),
  });
  return handleResponse(res);
}

export async function listSessions(idToken) {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    headers: await buildHeaders(idToken),
  });
  return handleResponse(res);
}

export async function getSession(sessionId, idToken) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    headers: await buildHeaders(idToken),
  });
  return handleResponse(res);
}

export async function deleteSession(sessionId, idToken) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: await buildHeaders(idToken),
  });
  return handleResponse(res);
}

export async function sendMessage(sessionId, message, language = "en", idToken) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: await buildHeaders(idToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ session_id: sessionId, message, language }),
  });
  return handleResponse(res);
}

export async function sendMessageWithAttachment(sessionId, message, file, language = "en", idToken) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", message || "");
  formData.append("language", language);
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/chat/upload`, {
    method: "POST",
    headers: await buildHeaders(idToken),
    body: formData,
  });
  return handleResponse(res);
}

export function getUploadUrl(savedFilename) {
  return `${API_BASE_URL}/uploads/${savedFilename}`;
}
