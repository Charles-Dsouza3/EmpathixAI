import json
import uuid
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Request

from app.config import settings

_firebase_app = None


def _init_firebase():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if settings.firebase_credentials_json:
        cred_dict = json.loads(settings.firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
    elif settings.firebase_credentials_path:
        cred = credentials.Certificate(settings.firebase_credentials_path)
    else:
        raise RuntimeError("No Firebase credentials configured.")

    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def get_current_identity(request: Request) -> str:
    """
    Returns a stable identity string for the caller:
    - "user:<firebase_uid>" if a valid Firebase ID token is present
    - "anon:<anonymous_id>" if only an anonymous device ID header is present
    - raises if neither is present
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
        try:
            _init_firebase()
            decoded = firebase_auth.verify_id_token(token)
            return f"user:{decoded['uid']}"
        except Exception:
            pass  # fall through to anonymous handling below

    anon_id = request.headers.get("X-Anonymous-Id", "").strip()
    if anon_id:
        # Basic sanity check — should be a uuid4 hex string from the frontend
        try:
            uuid.UUID(anon_id)
            return f"anon:{anon_id}"
        except ValueError:
            pass

    return "anon:unknown"
