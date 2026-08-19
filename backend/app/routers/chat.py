from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DBSession
from langchain_core.messages import HumanMessage, AIMessage

from app.database import get_db
from app import crud
from app.models import ChatRequest, ChatResponse
from app.llm import generate_vision_reply
from app.prompts import build_system_prompt
from app.attachments import save_upload, extract_document_text, image_to_data_url, get_full_path
from app.agent import run_triage

router = APIRouter(prefix="/chat", tags=["chat"])


def _build_history(db, session_id):
    history = crud.get_messages(db, session_id)
    lc_messages = []
    for m in history:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        else:
            lc_messages.append(AIMessage(content=m.content))
    return lc_messages


@router.post("", response_model=ChatResponse)
def send_message(payload: ChatRequest, db: DBSession = Depends(get_db)):
    session = crud.get_session(db, payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = _build_history(db, payload.session_id)
    crud.add_message(db, payload.session_id, "user", payload.message)

    try:
        result = run_triage(payload.session_id, payload.message, history, payload.language)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {str(e)}")

    crud.add_message(db, payload.session_id, "assistant", result["reply"])

    return ChatResponse(
        session_id=payload.session_id,
        reply=result["reply"],
        sources=result["sources"],
        urgency=result["urgency"],
    )


@router.post("/upload", response_model=ChatResponse)
async def send_message_with_attachment(
    session_id: str = Form(...),
    message: str = Form(""),
    language: str = Form("en"),
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
):
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    saved_filename, attachment_type, original_filename = await save_upload(file)
    full_path = get_full_path(saved_filename)

    if attachment_type == "image":
        system_prompt = build_system_prompt("", language)
        try:
            reply_text = generate_vision_reply(system_prompt, message, image_to_data_url(full_path))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Image analysis failed: {str(e)}")
        user_note = message or "(Uploaded an image for analysis)"
        urgency, sources = "routine", []

    else:
        try:
            extracted_text = extract_document_text(full_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read document: {str(e)}")

        truncated = extracted_text[:6000]
        combined_message = f"{message}\n\n[Attached document: {original_filename}]\n{truncated}"

        history = _build_history(db, session_id)
        try:
            result = run_triage(session_id, combined_message, history, language)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"LLM call failed: {str(e)}")

        reply_text, urgency, sources = result["reply"], result["urgency"], result["sources"]
        user_note = message or f"(Uploaded document: {original_filename})"

    user_msg = crud.add_message(db, session_id, "user", user_note)
    user_msg.attachment_filename = original_filename
    user_msg.attachment_type = attachment_type
    user_msg.attachment_path = saved_filename
    db.commit()

    crud.add_message(db, session_id, "assistant", reply_text)

    return ChatResponse(session_id=session_id, reply=reply_text, sources=sources, urgency=urgency)