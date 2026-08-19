def test_create_session_endpoint(client):
    res = client.post("/sessions", json={"title": "Test Chart"})
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Test Chart"
    assert "id" in body


def test_list_sessions_endpoint(client):
    client.post("/sessions", json={})
    res = client.get("/sessions")
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_get_session_not_found_returns_404(client):
    res = client.get("/sessions/does-not-exist")
    assert res.status_code == 404


def test_delete_session_endpoint(client):
    created = client.post("/sessions", json={}).json()
    res = client.delete(f"/sessions/{created['id']}")
    assert res.status_code == 200
    assert client.get(f"/sessions/{created['id']}").status_code == 404