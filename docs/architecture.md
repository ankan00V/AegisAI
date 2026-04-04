# AegisAI — Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│   Dashboard · AI Systems · Classification · Documents       │
│   [TODO: Guard Scanner page · RAG chat page]                │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST / JSON
┌───────────────────▼─────────────────────────────────────────┐
│              FastAPI Backend  /api/v1/                       │
│                                                              │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────────┐    │
│   │  Compliance  │  │  LLM Guard   │  │ RAG Intelligence│   │
│   │   Engine     │  │   Module     │  │    Module       │   │
│   │             │  │              │  │                 │    │
│   │ /ai-systems  │  │ /guard/scan  │  │ /rag/query      │   │
│   │ /classify    │  │              │  │ /rag/ingest[TODO]│  │
│   │ /documents   │  │ Regex filter │  │                 │    │
│   │             │  │ DeBERTa ML   │  │ FAISS vector DB │   │
│   │             │  │ Decision eng.│  │ LangChain chain │   │
│   │             │  │ Sanitizer    │  │ MLflow tracking │   │
│   └──────┬──────┘  └──────────────┘  └────────────────┘    │
│          │                                                   │
│   ┌──────▼──────────────────────────────────────────────┐   │
│   │         Core: JWT Auth · SQLAlchemy ORM · Config    │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │
              ┌────────────────▼──────────────┐
              │         PostgreSQL DB          │
              │  users · ai_systems · documents│
              │  risk_assessments             │
              └───────────────────────────────┘
```

## Module Breakdown

### Module 1 — Compliance Engine
- `backend/app/api/v1/ai_systems.py` — CRUD for registering AI systems
- `backend/app/api/v1/classification.py` — EU AI Act risk classification logic
- `backend/app/api/v1/documents.py` — Document generation from templates
- `backend/app/models/ai_system.py` — DB model (RiskLevel, ComplianceStatus enums)

### Module 2 — LLM Guard
- `backend/app/modules/guard/regex_rules.py` — Fast regex first-pass filter
- `backend/app/modules/guard/intent_classifier.py` — DeBERTa-v3 transformer classifier
- `backend/app/modules/guard/decision_engine.py` — Combines signals → allow/sanitize/block
- `backend/app/modules/guard/sanitizer.py` — Removes meta-instructions from flagged prompts
- `backend/app/modules/guard/llm_guard.py` — Orchestrates all 4 layers
- `backend/app/api/v1/guard.py` — REST endpoint wrapping the pipeline
- `notebooks/train_guard_classifier.ipynb` — Fine-tune on GPU (Colab-ready)

### Module 3 — RAG Intelligence
- `backend/app/modules/rag/document_loader.py` — Loads docs from S3 + splits into chunks
- `backend/app/modules/rag/vector_store.py` — Builds/loads FAISS index
- `backend/app/modules/rag/retrieval_chain.py` — LangChain RetrievalQA chain
- `backend/app/modules/rag/ml_flow.py` — MLflow query tracking
- `backend/app/api/v1/rag.py` — REST endpoint

## Data Flow — Guard Scan

```
User prompt
    │
    ▼
RegexFilter.check()          ← fast, no model needed
    │
    ▼
IntentClassifier.classify()  ← DeBERTa-v3 transformer
    │
    ▼
DecisionEngine.decide()      ← combines regex + ML scores
    │
    ├── ALLOW   → pass to LLM as-is
    ├── SANITIZE → PromptSanitizer.sanitize() → pass cleaned prompt
    └── BLOCK   → return safe error message, no LLM call
```

## Data Flow — RAG Query

```
User question
    │
    ▼
FAISS vector store (semantic search)
    │
    ▼
Top-K relevant document chunks
    │
    ▼
LangChain RetrievalQA (GPT-4 / OpenAI)
    │
    ▼
Answer + source citations
```
