"""
routes.py — FastAPI route definitions.

All API endpoints for the freight cost monitoring dashboard.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import pandas as pd
import json

from backend.api.schemas import (
    ChatRequest, ChatResponse,
    NoteSearchRequest,
)

router = APIRouter(prefix="/api", tags=["Freight Cost API"])

# ─── Module-level state (set by main.py after pipeline runs) ─────────────────
_results_df: Optional[pd.DataFrame] = None
_collection = None
_notes_df: Optional[pd.DataFrame] = None
_eval_results: Optional[dict] = None
_repro_results: Optional[dict] = None
_cost_log: Optional[dict] = None


def set_state(results_df, collection, notes_df, eval_results=None, repro_results=None, cost_log=None):
    """Set the module-level state after pipeline runs."""
    global _results_df, _collection, _notes_df, _eval_results, _repro_results, _cost_log
    _results_df = results_df
    _collection = collection
    _notes_df = notes_df
    _eval_results = eval_results
    _repro_results = repro_results
    _cost_log = cost_log


def _ensure_data():
    """Ensure pipeline data is loaded in memory; if not, run full pipeline automatically."""
    global _results_df, _collection, _notes_df, _eval_results, _repro_results, _cost_log
    if _results_df is None:
        from backend.main import run_full_pipeline
        run_full_pipeline()


# ─── Summary ─────────────────────────────────────────────────────────────────

@router.get("/summary")
def get_summary():
    """Get dashboard summary statistics."""
    _ensure_data()

    total = len(_results_df)
    anomalies = _results_df[_results_df["is_anomaly"]]
    justified = _results_df[_results_df["flagged"] == "No (justified)"]
    unexplained = _results_df[_results_df["flagged"] == "Yes"]

    # Per-route stats
    route_stats = []
    for route in sorted(_results_df["route"].unique()):
        route_data = _results_df[_results_df["route"] == route]
        route_anomalies = route_data[route_data["is_anomaly"]]
        avg_cost = float(route_data["cost_per_tonne_km"].mean())
        route_type = route_data["route_type"].iloc[0]

        # Determine health status
        anomaly_rate = len(route_anomalies) / len(route_data) * 100 if len(route_data) > 0 else 0
        if anomaly_rate > 20:
            health = "critical"
        elif anomaly_rate > 10:
            health = "warning"
        else:
            health = "healthy"

        route_stats.append({
            "route": route,
            "route_type": route_type,
            "total_weeks": len(route_data),
            "anomaly_count": len(route_anomalies),
            "anomaly_rate": round(anomaly_rate, 1),
            "avg_cost": round(avg_cost, 2),
            "health": health,
            "justified": len(route_data[route_data["flagged"] == "No (justified)"]),
            "unexplained": len(route_data[route_data["flagged"] == "Yes"]),
        })

    return {
        "total_route_weeks": total,
        "total_anomalies": len(anomalies),
        "justified_count": len(justified),
        "unexplained_count": len(unexplained),
        "anomaly_rate": round(len(anomalies) / total * 100, 1) if total > 0 else 0,
        "route_stats": route_stats,
        "date_range": {
            "start": str(_results_df["week_of"].min()),
            "end": str(_results_df["week_of"].max()),
        },
    }


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/routes")
def get_routes():
    """List all routes with their health status."""
    _ensure_data()
    summary = get_summary()
    return summary["route_stats"]


@router.get("/routes/{route}/trend")
def get_route_trend(route: str):
    """Get weekly cost trend for a specific route."""
    _ensure_data()

    route_data = _results_df[_results_df["route"] == route]
    if route_data.empty:
        raise HTTPException(status_code=404, detail=f"Route '{route}' not found")

    trend = []
    for _, row in route_data.iterrows():
        trend.append({
            "week_of": str(row["week_of"]),
            "cost_per_tonne_km": round(float(row["cost_per_tonne_km"]), 2),
            "trailing_avg": round(float(row["trailing_avg"]), 2) if pd.notna(row.get("trailing_avg")) else None,
            "peer_avg": round(float(row["peer_avg"]), 2) if pd.notna(row.get("peer_avg")) else None,
            "pct_vs_own_history": round(float(row["pct_vs_own_history"]), 1) if pd.notna(row.get("pct_vs_own_history")) else None,
            "pct_vs_similar_routes": round(float(row["pct_vs_similar_routes"]), 1) if pd.notna(row.get("pct_vs_similar_routes")) else None,
            "is_anomaly": bool(row.get("is_anomaly", False)),
            "flagged": str(row.get("flagged", "No")),
            "matched_note_id": str(row.get("matched_note_id", "")),
            "reason": str(row.get("reason", "")),
            "shipment_count": int(row.get("shipment_count", 0)),
            "total_quantity_tonnes": round(float(row.get("total_quantity_tonnes", 0)), 1),
            "total_freight_cost": round(float(row.get("total_freight_cost", 0)), 2),
        })

    route_type = route_data["route_type"].iloc[0]
    route_anomalies = route_data[route_data["is_anomaly"]]

    return {
        "route": route,
        "route_type": route_type,
        "total_weeks": len(route_data),
        "anomaly_count": len(route_anomalies),
        "justified_count": len(route_data[route_data["flagged"] == "No (justified)"]),
        "unexplained_count": len(route_data[route_data["flagged"] == "Yes"]),
        "avg_cost": round(float(route_data["cost_per_tonne_km"].mean()), 2),
        "trend": trend,
    }


# ─── Anomalies ───────────────────────────────────────────────────────────────

@router.get("/anomalies")
def get_anomalies(
    route: Optional[str] = Query(None),
    flagged: Optional[str] = Query(None),
    limit: int = Query(500),
):
    """Get all anomaly rows, optionally filtered."""
    _ensure_data()

    data = _results_df.copy()

    if route:
        data = data[data["route"] == route]
    if flagged:
        data = data[data["flagged"] == flagged]

    # Convert to list of dicts
    rows = []
    for _, row in data.head(limit).iterrows():
        rows.append({
            "route": str(row["route"]),
            "week_of": str(row["week_of"]),
            "route_type": str(row.get("route_type", "")),
            "cost_per_tonne_km": round(float(row["cost_per_tonne_km"]), 2),
            "vs_own_history": str(row.get("vs_own_history_str", "")),
            "vs_similar_routes": str(row.get("vs_similar_routes_str", "")),
            "pct_vs_own_history": round(float(row["pct_vs_own_history"]), 1) if pd.notna(row.get("pct_vs_own_history")) else None,
            "pct_vs_similar_routes": round(float(row["pct_vs_similar_routes"]), 1) if pd.notna(row.get("pct_vs_similar_routes")) else None,
            "is_anomaly": bool(row.get("is_anomaly", False)),
            "flagged": str(row.get("flagged", "No")),
            "matched_note_id": str(row.get("matched_note_id", "")),
            "reason": str(row.get("reason", "")),
            "trailing_avg": round(float(row["trailing_avg"]), 2) if pd.notna(row.get("trailing_avg")) else None,
            "peer_avg": round(float(row["peer_avg"]), 2) if pd.notna(row.get("peer_avg")) else None,
            "shipment_count": int(row.get("shipment_count", 0)),
        })

    return {
        "total": len(data),
        "showing": len(rows),
        "rows": rows,
    }


# ─── Notes ───────────────────────────────────────────────────────────────────

@router.get("/notes")
def get_notes():
    """Get all context notes."""
    global _notes_df
    _ensure_data()
    if _notes_df is None:
        from backend.analytics.pipeline import load_context_notes
        _notes_df = load_context_notes()

    notes = []
    for _, row in _notes_df.iterrows():
        if pd.isna(row.get("note_id")):
            continue
        notes.append({
            "note_id": str(row["note_id"]),
            "date": str(row["date"]).split(" ")[0],
            "applies_to": str(row["applies_to"]),
            "note": str(row["note"]),
        })
    return notes


@router.post("/search-notes")
def search_notes(request: NoteSearchRequest):
    """Semantic search over context notes."""
    global _collection
    _ensure_data()
    if _collection is None:
        from backend.rag.embeddings import initialize_vector_store
        _collection = initialize_vector_store()

    results = _collection.query(
        query_texts=[request.query],
        n_results=min(request.top_k, _collection.count()),
    )

    matches = []
    if results and results["metadatas"]:
        for i, meta in enumerate(results["metadatas"][0]):
            matches.append({
                "note_id": meta["note_id"],
                "date": meta["date"],
                "applies_to": meta["applies_to"],
                "note_text": meta["original_note"],
                "distance": round(results["distances"][0][i], 4) if results["distances"] else None,
            })

    return {"query": request.query, "matches": matches}


# ─── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/chat")
def chat(request: ChatRequest):
    """Chat with the freight cost assistant."""
    global _collection
    _ensure_data()
    if _collection is None:
        from backend.rag.embeddings import initialize_vector_store
        _collection = initialize_vector_store()

    from backend.rag.reasoner import answer_question
    result = answer_question(_collection, request.question, _results_df)

    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "confidence": result["confidence"],
    }


# ─── Eval & Reproducibility ───────────────────────────────────────────────────

@router.get("/eval/results")
def get_eval_results():
    """Get evaluation harness results."""
    global _eval_results
    _ensure_data()
    if _eval_results is None:
        from backend.eval.harness import run_eval_harness
        _eval_results = run_eval_harness(_results_df)
    return _eval_results


@router.get("/eval/reproducibility")
def get_reproducibility():
    """Get reproducibility check results."""
    global _repro_results
    if _repro_results is not None:
        return _repro_results

    from backend.config import OUTPUT_DIR
    run_files = [OUTPUT_DIR / f"run_{i}.csv" for i in range(1, 4)]
    if all(p.exists() for p in run_files):
        outputs = [pd.read_csv(p) for p in run_files]
        from backend.eval.reproducibility import _compare_runs
        diffs = _compare_runs(outputs)
        _repro_results = {
            "identical": len(diffs) == 0,
            "num_runs": 3,
            "diffs": diffs,
            "run_files": [str(p) for p in run_files],
            "rows_per_run": len(outputs[0]),
        }
        return _repro_results

    # If run files don't exist yet, run reproducibility check
    _ensure_data()
    from backend.analytics.pipeline import run_pipeline
    from backend.rag.embeddings import initialize_vector_store
    from backend.main import process_rag_justifications
    from backend.eval.reproducibility import run_reproducibility_check
    _collection_local = _collection or initialize_vector_store()
    _repro_results = run_reproducibility_check(
        run_pipeline_fn=run_pipeline,
        rag_process_fn=lambda df: process_rag_justifications(df, _collection_local),
        num_runs=3,
    )
    return _repro_results


@router.get("/eval/costs")
def get_costs():
    """Get token/cost log."""
    from backend.rag.reasoner import get_cost_log
    return get_cost_log()


# ─── Operations & Export ──────────────────────────────────────────────────────

@router.post("/run-pipeline")
def trigger_pipeline():
    """Trigger a full pipeline run."""
    from backend.main import run_full_pipeline
    results = run_full_pipeline()
    from backend.config import OUTPUT_FILE
    return {
        "status": "success",
        "total_rows": len(results),
        "total_anomalies": int(results["is_anomaly"].sum()),
        "output_file": str(OUTPUT_FILE),
    }


@router.get("/export")
def export_csv():
    """Download the generated anomaly_report.csv output."""
    from fastapi.responses import FileResponse
    from backend.config import OUTPUT_FILE
    _ensure_data()
    if not OUTPUT_FILE.exists():
        from backend.output.formatter import format_output, save_output
        save_output(format_output(_results_df))
    return FileResponse(
        path=str(OUTPUT_FILE),
        filename="anomaly_report.csv",
        media_type="text/csv",
    )

