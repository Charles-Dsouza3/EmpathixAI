import uuid
from sqlalchemy.orm import Session as DBSession

from app.database import ChatSession, ChatMessage


def create_session(db: DBSession, title: str | None = None) -> ChatSession:
    session = ChatSession(
        id=uuid.uuid4().hex,
        title=title or "New Chat",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: DBSession, session_id: str) -> ChatSession | None:
    return db.query(ChatSession).filter(ChatSession.id == session_id).first()


def list_sessions(db: DBSession) -> list[ChatSession]:
    return db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()


def delete_session(db: DBSession, session_id: str) -> bool:
    session = get_session(db, session_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True


def add_message(db: DBSession, session_id: str, role: str, content: str) -> ChatMessage:
    message = ChatMessage(
        id=uuid.uuid4().hex,
        session_id=session_id,
        role=role,
        content=content,
    )
    db.add(message)

    # Auto-title the session from the first user message
    session = get_session(db, session_id)
    if session and session.title == "New Chat" and role == "user":
        session.title = content[:50] + ("..." if len(content) > 50 else "")

    db.commit()
    db.refresh(message)
    return message


def get_messages(db: DBSession, session_id: str) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )