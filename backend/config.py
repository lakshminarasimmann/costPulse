"""
Configuration module for the FreightTiger Smart Shipping Cost Assistant.
All tunable parameters and paths are centralized here for reproducibility.
"""

import os
from pathlib import Path

# ─── Project Paths ───────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
DATA_DIR = PROJECT_ROOT / "data"

# Serverless read-only filesystem handling (Vercel, AWS Lambda)
IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
if IS_SERVERLESS:
    OUTPUT_DIR = Path("/tmp/output")
    CHROMA_DIR = Path("/tmp/chroma_db")
    os.environ.setdefault("HF_HOME", "/tmp/huggingface")
else:
    OUTPUT_DIR = PROJECT_ROOT / "output"
    CHROMA_DIR = PROJECT_ROOT / "backend" / "chroma_db"

SHIPMENT_FILE = DATA_DIR / "shipment_records.csv"
CONTEXT_NOTES_FILE = DATA_DIR / "context_notes.csv"
SAMPLE_OUTPUT_FILE = DATA_DIR / "sample_output_format_v2.csv"
OUTPUT_FILE = OUTPUT_DIR / "anomaly_report.csv"

# ─── Analytics Parameters ────────────────────────────────────────────────────
# Rolling window size for trailing average (weeks strictly before current week)
TRAILING_WINDOW = 8

# Flagging thresholds (percentage above baseline to trigger a flag)
# A route-week is flagged if EITHER threshold is exceeded
THRESHOLD_OWN_HISTORY = 10.0    # % above own trailing average
THRESHOLD_SIMILAR_ROUTES = 15.0  # % above peer average in same week

# ─── RAG Parameters ──────────────────────────────────────────────────────────
# Embedding model (local, free, no API key needed)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# ChromaDB collection name
CHROMA_COLLECTION = "context_notes"

# Number of candidate notes to retrieve per query
RAG_TOP_K = 3

# Date proximity window: how many days before/after an anomaly week a note
# can be considered relevant (14 days = 2 weeks max)
NOTE_DATE_WINDOW_DAYS = 14

# ─── LLM Parameters ──────────────────────────────────────────────────────────
# We support two backends: "groq" (cloud, free tier) and "ollama" (local)
# Set via environment variable or default to rule-based (no LLM needed)
LLM_BACKEND = os.getenv("LLM_BACKEND", "rule_based")  # "groq", "ollama", or "rule_based"

# Groq settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.1-70b-versatile"

# Ollama settings
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# LLM generation parameters — temperature=0 for reproducibility
LLM_TEMPERATURE = 0.0
LLM_MAX_TOKENS = 300

# ─── Negative Evidence Phrases ───────────────────────────────────────────────
# Notes containing these phrases should NOT be used to justify a cost rise.
# This is our first line of anti-hallucination defense.
NEGATIVE_EVIDENCE_PHRASES = [
    "not significantly affected",
    "costs were not",
    "not part of this dataset",
    "no significant disruptions",
    "remained normal",
    "remained stable",
    "no major disruptions",
    "absorbed by transporters",
    "without a rate change",
    "costs were absorbed",
    "improved road conditions",  # Improved roads should REDUCE costs, not increase
    "returned to normal",        # Return to normal cannot justify a cost spike
]

# ─── Server Settings ─────────────────────────────────────────────────────────
API_HOST = "0.0.0.0"
API_PORT = 8000
