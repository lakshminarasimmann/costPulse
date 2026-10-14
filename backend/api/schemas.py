"""
schemas.py — Pydantic models for API request/response validation.
"""

from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""
    question: str


class ChatResponse(BaseModel):
    """Response body for the chat endpoint."""
    answer: str
    sources: list[dict]
    confidence: str


class NoteSearchRequest(BaseModel):
    """Request body for semantic note search."""
    query: str
    top_k: int = 3


class PipelineRunResponse(BaseModel):
    """Response after running the pipeline."""
    status: str
    total_rows: int
    total_anomalies: int
    output_file: str


class EvalResult(BaseModel):
    """Individual eval test result."""
    test_id: str
    description: str
    passed: bool
    expected: str
    actual: str
    route: Optional[str] = None
    week_range: Optional[str] = None


class EvalResponse(BaseModel):
    """Full eval harness response."""
    total_tests: int
    passed: int
    failed: int
    pass_rate: float
    results: list[dict]


class ReproducibilityResponse(BaseModel):
    """Reproducibility check response."""
    identical: bool
    num_runs: int
    diffs: list[str]
    run_files: list[str]
    rows_per_run: int


class CostLogResponse(BaseModel):
    """Cost/token log response."""
    total_calls: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost_usd: float
    calls: list[dict]
