# EmpathixAI

A full-stack, RAG-powered medical chatbot with an agentic triage workflow, multimodal (image/document) analysis, evaluated retrieval quality, and multilingual support — built end-to-end with FastAPI, React, LangChain, and LangGraph.

*Live demo:* <https://empathix-ai.vercel.app/>
*Backend API docs:* <https://empathixai-1.onrender.com/docs>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [The Agentic Triage Workflow](#the-agentic-triage-workflow)
- [RAG Evaluation (RAGAS)](#rag-evaluation-ragas)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions Worth Knowing](#design-decisions-worth-knowing)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Overview

EmpathixAI is a friendly AI health assistant that answers medical questions grounded in a curated reference document set (via Retrieval-Augmented Generation), supports image and document upload for multimodal analysis, and routes every incoming message through an agentic safety-triage graph before generating a response — so genuine emergencies get a deterministic safety message instead of an improvised LLM answer, and off-topic queries get politely redirected rather than answered.

The project was built as a deliberate exercise in production-minded AI engineering: not just "call an LLM API," but retrieval quality measurement, safety-critical routing logic, observability, and automated testing — the parts of an AI product that don't show up in a five-minute demo but matter in a real system.

## Architecture

```
┌─────────────┐      HTTPS       ┌──────────────────┐
│   React     │ ───────────────► │     FastAPI       │
│  (Vite SPA) │ ◄─────────────── │     Backend        │
└─────────────┘                  └─────────┬─────────┘
      │                                     │
      │ Firebase Auth SDK                   ▼
      ▼                          ┌────────────────────┐
┌─────────────┐                  │  LangGraph Triage    │
│  Firebase    │                 │  Agent               │
│  Auth        │                 │  ┌─────────────────┐ │
└─────────────┘                  │  │ classify_urgency │ │
                                  │  └────────┬────────┘ │
                                  │           │           │
                                  │  ┌────────┼────────┐  │
                                  │  ▼        ▼        ▼  │
                                  │ emergency routine non_medical
                                  │  │        │        │  │
                                  │  │   ┌────▼────┐   │  │
                                  │  │   │ ChromaDB │   │  │
                                  │  │   │ Retriever│   │  │
                                  │  │   └────┬────┘   │  │
                                  │  │        │        │  │
                                  │  └────────┼────────┘  │
                                  │           ▼           │
                                  │   HF Inference API     │
                                  │  (Qwen2.5-7B-Instruct)  │
                                  └────────────────────────┘
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │  SQLite (sessions,   │
                                  │  message history)    │
                                  └────────────────────┘

Image uploads route separately to a vision model
(google/gemma-3-27b-it via HF Inference Providers)
```

## Key Features

- **Conversational chat interface** with support for multiple named, persistent chat sessions ("charts")
- **Retrieval-Augmented Generation** over a curated medical reference corpus using ChromaDB + sentence-transformer embeddings
- **Agentic triage workflow (LangGraph)** — every message is classified as `emergency`, `routine`, or `non_medical` before a response is generated, with the emergency path using a deterministic, non-LLM-generated safety message
- **Multimodal analysis** — upload an image (photo of a symptom, rash, etc.) for vision-model analysis, or a PDF/DOCX/TXT document for text-extraction-grounded Q&A
- **RAG evaluation pipeline** using RAGAS, scoring faithfulness, answer relevancy, context precision, and context recall against a labeled test set
- **Authentication** via Firebase — Google OAuth and email/password.
- **Multilingual support** — full UI and LLM response localization (English/Hindi), with the LLM instructed to respond in the selected language
- **Theme switcher** — three distinct visual themes (light clinical, dark "Midnight Ward", warm "Apothecary"), built on CSS custom properties for instant, zero-reload switching
- **Structured JSON logging** and **LangSmith tracing** for full request/LLM-call observability
- **Automated test suite** (pytest) covering CRUD logic and API endpoints, with LLM calls mocked to avoid burning API quota in CI
- **Live IST date/time injection** into every system prompt, so the assistant is always temporally grounded

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, react-i18next |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| LLM Orchestration | LangChain, LangGraph |
| LLM Inference | Hugging Face Inference Providers — Qwen2.5-7B-Instruct (text), google/gemma-3-27b-it (vision) |
| Vector Store | ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Database | SQLite |
| Auth | Firebase Authentication (Google, Email) |
| Evaluation | RAGAS |
| Observability | Structured JSON logging, LangSmith tracing |
| Testing | pytest, httpx |
| Deployment | Vercel (frontend), Render (backend) |

## The Agentic Triage Workflow

Rather than a flat retrieve-then-generate chain, every message passes through a LangGraph state machine:

1. **`classify_urgency`** — a fast deterministic keyword/pattern pre-filter catches unambiguous emergencies and first-person harm statements instantly; anything else is classified by the LLM into `emergency` / `routine` / `non_medical`, with strict output parsing to avoid substring-matching false positives (e.g. correctly parsing "this is *not* an emergency" rather than flagging on the word "emergency" alone)
2. **`emergency`** routes to a templated, human-reviewed safety response (Indian emergency numbers included) — deliberately **not** LLM-generated, since safety-critical instructions shouldn't be improvised
3. **`routine`** routes through ChromaDB retrieval, then generates a grounded answer
4. **`non_medical`** routes to a scoped, polite redirect — keeping the assistant from opining on unrelated topics (e.g. politics, current events) that have no place in a medical tool

Every node is instrumented with `@traceable`, so a full request's routing decision and generation steps are visible as a single trace tree in LangSmith.

## RAG Evaluation (RAGAS)

The retrieval/generation pipeline was evaluated against a labeled test set using [RAGAS](https://github.com/explodinggradients/ragas):

| Metric | Score |
|---|---|
| Faithfulness | 0.80 |
| Answer Relevancy | 0.92 |
| Context Precision | 1.00 |
| Context Recall | 0.90 |

Context precision of 1.00 indicates the retriever surfaces no irrelevant chunks; the sub-1.0 faithfulness score was traced to the system prompt's deliberate design choice to allow the model to supplement incomplete retrieved context with general medical knowledge rather than refuse to answer — a real, documented trade-off between strict grounding and helpfulness.

Run the evaluation yourself:
```bash
cd backend
python evaluate_rag.py
```

## Project Structure

```
friendly-medbot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, structured logging
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # SQLAlchemy models
│   │   ├── models.py            # Pydantic request/response schemas
│   │   ├── crud.py              # DB operations
│   │   ├── llm.py               # HF Inference client wrappers (text + vision)
│   │   ├── rag.py               # Document loading, chunking, ChromaDB
│   │   ├── agent.py             # LangGraph triage workflow
│   │   ├── attachments.py       # File upload handling, text extraction
│   │   ├── prompts.py           # System prompt construction, i18n
│   │   ├── logging_config.py    # Structured JSON logging
│   │   └── routers/
│   ├── data/medical_docs/       # RAG source documents
│   ├── evaluation/               # RAGAS test set + eval harness
│   ├── tests/                    # pytest suite
│   ├── ingest.py                 # Vector store build script
│   └── evaluate_rag.py
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Sidebar, ChatWindow, MessageBubble, etc.
│   │   ├── hooks/                # useChat, useTheme, useAuth
│   │   ├── api/client.js
│   │   ├── firebase.js
│   │   └── i18n.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── InputBox.jsx
│   │   │   ├── EcgTrace.jsx
│   │   │   ├── ThemeSwitcher.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   └── AuthModal.jsx
│   │   └── hooks/
│   │       ├── useChat.js
│   │       ├── useTheme.jsx
│   │       └── useAuth.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your real values
python ingest.py             # build the vector store
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         # fill in your real values
npm run dev
```

Visit `http://localhost:5173`.

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Notably:

- `HUGGINGFACEHUB_API_TOKEN` — Hugging Face access token (Inference Providers)
- `LANGCHAIN_API_KEY` — LangSmith tracing (optional but recommended)
- `VITE_FIREBASE_*` — Firebase project config (from Firebase Console)

## Testing

```bash
cd backend
pytest -v
pytest --cov=app --cov-report=term-missing   # with coverage
```

LLM calls are mocked in the test suite — tests validate application logic (routing, DB writes, error handling), not third-party API availability, and run in seconds with no network calls.

## Deployment

- *Frontend:* deployed on Vercel, auto-deploying from main
- *Backend:* deployed on Render as a free-tier web service

*Known free-tier behavior:* the Render backend spins down after 15 minutes of inactivity and takes 30–60 seconds to wake on the next request. In a production setting this would run on an always-on instance.

## Design Decisions Worth Knowing

- **Emergency and off-topic responses are template-based, not LLM-generated** — a deliberate safety choice; an LLM should not improvise instructions for a medical emergency.
- **The vision model (`google/gemma-3-27b-it`) was chosen over alternatives specifically for having multiple Inference Providers** (Featherless AI, DeepInfra), giving genuine failover redundancy against provider capacity limits — this was discovered empirically by hitting a single-provider model's capacity ceiling during development.
- **SQLite over Postgres** — a deliberate scope decision for a portfolio-scale project; the schema and CRUD layer are already ORM-based (SQLAlchemy), making a future Postgres migration straightforward.
- **Direct `huggingface_hub.InferenceClient` calls instead of LangChain's HF wrapper classes** — chosen after hitting version-compatibility issues with LangChain's abstraction layer; calling the provider API directly gave more reliable, debuggable control over routing and retries.

## Known Limitations

- SQLite and local file storage are not persistent across redeploys on free hosting tiers.
- Hugging Face's free inference quota is limited; heavy usage may hit rate limits.
- This is an informational tool, not a diagnostic one — it is not a substitute for professional medical care, and it says so throughout the interface.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
