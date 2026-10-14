"""
main.py — FastAPI application entry point.

Initializes the pipeline, RAG system, and serves the API.
On startup, runs the full pipeline and RAG justification pass.
"""

import sys
import os
from pathlib import Path

# Ensure the project root is in the Python path
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
import json

from backend.config import API_HOST, API_PORT, LLM_BACKEND
from backend.analytics.pipeline import (
    run_pipeline,
    load_context_notes,
    get_pipeline_summary,
)
from backend.rag.embeddings import initialize_vector_store
from backend.rag.reasoner import reason_about_anomaly, reset_cost_log
from backend.output.formatter import format_output, save_output
from backend.eval.harness import run_eval_harness
from backend.eval.cost_logger import save_cost_log
from backend.api.routes import router, set_state


# ─── Global state ────────────────────────────────────────────────────────────
pipeline_results = None
vector_collection = None
notes_df = None


def run_full_pipeline():
    """Run the complete pipeline: analytics + RAG + output."""
    global pipeline_results, vector_collection, notes_df

    print("\n" + "=" * 70)
    print("  FREIGHTTIGER SMART SHIPPING COST ASSISTANT")
    print("  Running full pipeline...")
    print("=" * 70)

    # Reset cost tracking
    reset_cost_log()

    # Step 1: Run analytics pipeline
    print("\n[1/5] Running analytics pipeline...")
    pipeline_results = run_pipeline()

    # Step 2: Initialize vector store
    print("\n[2/5] Initializing vector store (ChromaDB + sentence-transformers)...")
    vector_collection = initialize_vector_store()
    notes_df_local = load_context_notes()
    notes_df = notes_df_local

    # Step 3: Process RAG justifications for flagged anomalies
    print("\n[3/5] Processing RAG justifications for flagged anomalies...")
    pipeline_results = process_rag_justifications(pipeline_results, vector_collection)

    # Step 4: Generate and save output
    print("\n[4/5] Generating output CSV...")
    output_df = format_output(pipeline_results)
    save_output(output_df)

    # Step 5: Run eval harness
    print("\n[5/5] Running evaluation harness...")
    eval_results = run_eval_harness(pipeline_results)
    cost_log = save_cost_log()

    # Print summary
    summary = get_pipeline_summary(pipeline_results)
    print("\n" + "=" * 70)
    print("  PIPELINE COMPLETE")
    print("=" * 70)
    print(f"  Total route-weeks:   {summary['total_route_weeks']}")
    print(f"  Total anomalies:     {summary['total_anomalies']}")
    print(f"  Anomaly rate:        {summary['anomaly_rate']}%")
    justified = len(pipeline_results[pipeline_results["flagged"] == "No (justified)"])
    unexplained = len(pipeline_results[pipeline_results["flagged"] == "Yes"])
    print(f"  Justified:           {justified}")
    print(f"  Unexplained:         {unexplained}")
    print(f"  Eval pass rate:      {eval_results['pass_rate']}%")
    print(f"  LLM backend:         {LLM_BACKEND}")
    print("=" * 70)

    # Set API state
    set_state(
        results_df=pipeline_results,
        collection=vector_collection,
        notes_df=notes_df,
        eval_results=eval_results,
        cost_log=cost_log,
    )

    return pipeline_results


def process_rag_justifications(results: pd.DataFrame, collection) -> pd.DataFrame:
    """Process RAG justifications for all flagged anomalies."""
    from backend.analytics.flags import update_flag_with_justification

    anomalies = results[results["is_anomaly"]].copy()
    print(f"  Processing {len(anomalies)} flagged anomalies...")

    for idx, row in anomalies.iterrows():
        route = row["route"]
        week_of = str(row["week_of"])
        cost = row["cost_per_tonne_km"]
        pct_history = row["pct_vs_own_history"] if pd.notna(row["pct_vs_own_history"]) else 0
        pct_peers = row["pct_vs_similar_routes"] if pd.notna(row["pct_vs_similar_routes"]) else 0
        route_type = row["route_type"]

        # Run RAG reasoning
        rag_result = reason_about_anomaly(
            collection=collection,
            route=route,
            week_of=week_of,
            cost_per_tonne_km=cost,
            pct_vs_history=pct_history,
            pct_vs_peers=pct_peers,
            route_type=route_type,
        )

        # Update the results
        results = update_flag_with_justification(
            df=results,
            route=route,
            week_of=week_of,
            note_id=rag_result["matched_note_id"],
            reason=rag_result["reason"],
            is_justified=rag_result["is_justified"],
        )

    justified = len(results[results["flagged"] == "No (justified)"])
    unexplained = len(results[results["flagged"] == "Yes"])
    print(f"  Results: {justified} justified, {unexplained} unexplained")

    return results


# ─── FastAPI App ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run pipeline on startup."""
    print("[Startup] Running pipeline on server start...")
    run_full_pipeline()
    yield
    print("[Shutdown] Server shutting down.")


app = FastAPI(
    title="FreightTiger Smart Shipping Cost Assistant",
    description="AI-powered freight cost anomaly detection with RAG-based justification",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Mount built frontend if available (Production / Cloud deployment mode)
frontend_dist = PROJECT_ROOT / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes and OpenAPI docs to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        """Health check."""
        return {
            "status": "running",
            "service": "FreightTiger Smart Shipping Cost Assistant",
            "version": "1.0.0",
        }


if __name__ == "__main__":
    import uvicorn
    # Support cloud port assignment (e.g. Render, Railway, Fly.io, Heroku)
    port = int(os.environ.get("PORT", API_PORT))
    uvicorn.run(app, host="0.0.0.0", port=port)
