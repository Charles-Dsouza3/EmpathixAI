from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app import crud
from app.models import SessionCreate, SessionOut, SessionWithMessages

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut)
def create_new_session(payload: SessionCreate, db: DBSession = Depends(get_db)):
    session = crud.create_session(db, title=payload.title)
    return session


@router.get("", response_model=list[SessionOut])
def list_all_sessions(db: DBSession = Depends(get_db)):
    return crud.list_sessions(db)


@router.get("/{session_id}", response_model=SessionWithMessages)
def get_session_with_history(session_id: str, db: DBSession = Depends(get_db)):
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
def remove_session(session_id: str, db: DBSession = Depends(get_db)):
    ok = crud.delete_session(db, session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}