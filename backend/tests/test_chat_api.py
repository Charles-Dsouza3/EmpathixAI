from unittest.mock import patch


def test_chat_endpoint_with_mocked_agent(client):
    session = client.post("/sessions", json={}).json()

    with patch("app.routers.chat.run_triage") as mock_triage:
        mock_triage.return_value = {
            "reply": "This is a mocked reply.",
            "sources": [],
            "urgency": "routine",
        }
        res = client.post("/chat", json={"session_id": session["id"], "message": "test symptom question"})

    assert res.status_code == 200
    body = res.json()
    assert body["reply"] == "This is a mocked reply."
    assert body["urgency"] == "routine"


def test_chat_endpoint_session_not_found(client):
    res = client.post("/chat", json={"session_id": "nope", "message": "hi"})
    assert res.status_code == 404


def test_chat_endpoint_saves_message_history(client):
    session = client.post("/sessions", json={}).json()

    with patch("app.routers.chat.run_triage") as mock_triage:
        mock_triage.return_value = {"reply": "Mocked answer", "sources": [], "urgency": "routine"}
        client.post("/chat", json={"session_id": session["id"], "message": "hello"})

    history = client.get(f"/sessions/{session['id']}").json()
    assert len(history["messages"]) == 2
    assert history["messages"][0]["role"] == "user"
    assert history["messages"][1]["role"] == "assistant"