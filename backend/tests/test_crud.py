from app import crud


def test_create_session_default_title(db_session):
    session = crud.create_session(db_session)
    assert session.title == "New Chat"
    assert session.id is not None


def test_create_session_custom_title(db_session):
    session = crud.create_session(db_session, title="Custom Title")
    assert session.title == "Custom Title"


def test_get_session_found(db_session):
    created = crud.create_session(db_session)
    fetched = crud.get_session(db_session, created.id)
    assert fetched.id == created.id


def test_get_session_not_found(db_session):
    assert crud.get_session(db_session, "does-not-exist") is None


def test_list_sessions_most_recent_first(db_session):
    crud.create_session(db_session, title="First")
    second = crud.create_session(db_session, title="Second")
    sessions = crud.list_sessions(db_session)
    assert sessions[0].id == second.id


def test_delete_session(db_session):
    session = crud.create_session(db_session)
    assert crud.delete_session(db_session, session.id) is True
    assert crud.get_session(db_session, session.id) is None


def test_delete_nonexistent_session_returns_false(db_session):
    assert crud.delete_session(db_session, "does-not-exist") is False


def test_add_message_auto_titles_session(db_session):
    session = crud.create_session(db_session)
    crud.add_message(db_session, session.id, "user", "I have a headache and mild fever")
    updated = crud.get_session(db_session, session.id)
    assert updated.title.startswith("I have a headache")


def test_get_messages_preserves_order(db_session):
    session = crud.create_session(db_session)
    crud.add_message(db_session, session.id, "user", "first message")
    crud.add_message(db_session, session.id, "assistant", "second message")
    messages = crud.get_messages(db_session, session.id)
    assert [m.content for m in messages] == ["first message", "second message"]