import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import init_db
from app.logging_config import setup_logging, get_logger
from app.routers import sessions, chat

setup_logging(settings.log_level)
logger = get_logger("empathixai.request")

app = FastAPI(title="EmpathixAI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request_completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.on_event("startup")
def on_startup():
    init_db()
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info("startup_complete", extra={"upload_dir": settings.upload_dir})


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(sessions.router)
app.include_router(chat.router)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
