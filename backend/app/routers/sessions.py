from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app import crud
from app.models import SessionCreate, SessionOut, SessionWithMessages
from app.auth import get_current_identity

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut)
def create_new_session(payload: SessionCreate, request: Request, db: DBSession = Depends(get_db)):
    user_id = get_current_identity(request)
    session = crud.create_session(db, user_id, title=payload.title)
    return session


@router.get("", response_model=list[SessionOut])
def list_all_sessions(request: Request, db: DBSession = Depends(get_db)):
    user_id = get_current_identity(request)
    return crud.list_sessions(db, user_id)


@router.get("/{session_id}", response_model=SessionWithMessages)
def get_session_with_history(session_id: str, request: Request, db: DBSession = Depends(get_db)):
    user_id = get_current_identity(request)
    session = crud.get_session(db, session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
def remove_session(session_id: str, request: Request, db: DBSession = Depends(get_db)):
    user_id = get_current_identity(request)
    ok = crud.delete_session(db, session_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}
