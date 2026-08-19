from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    title: str | None = None


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime
    attachment_filename: str | None = None
    attachment_type: str | None = None
    attachment_path: str | None = None

    class Config:
        from_attributes = True


class SessionWithMessages(SessionOut):
    messages: list[MessageOut] = []


class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str = "en"


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    sources: list[str] = []  # retrieved doc snippets/filenames used for RAG answer
    urgency: str = "routine"