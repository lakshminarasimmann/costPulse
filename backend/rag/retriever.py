"""
retriever.py — Smart note retrieval for anomaly justification.

For each flagged anomaly, retrieves candidate notes from ChromaDB using:
1. Semantic similarity (via embeddings)
2. Metadata filtering (route applicability + date proximity)
3. Negative evidence rejection (anti-hallucination layer 1)
"""

import chromadb
import pandas as pd
from datetime import datetime, timedelta
from backend.config import RAG_TOP_K, NOTE_DATE_WINDOW_DAYS, NEGATIVE_EVIDENCE_PHRASES


def retrieve_candidate_notes(
    collection: chromadb.Collection,
    route: str,
    week_of: str,
    cost_change_pct: float,
    top_k: int = RAG_TOP_K,
) -> list[dict]:
    """
    Retrieve candidate context notes for a given anomaly.

    Parameters
    ----------
    collection : chromadb.Collection
        The ChromaDB collection with embedded notes.
    route : str
        Route name (e.g., "Chennai-Bangalore").
    week_of : str
        The anomaly week's Monday date (e.g., "2025-02-24").
    cost_change_pct : float
        The percentage change in cost vs history.
    top_k : int
        Number of candidates to retrieve.

    Returns
    -------
    list[dict]
        Each dict has: note_id, date, applies_to, note_text, distance,
        is_route_match, is_date_proximate, passes_negative_filter
    """
    # Build query text that captures the anomaly context
    query_text = (
        f"Cost increase on {route} route during week of {week_of}. "
        f"Freight cost rose by {cost_change_pct:.1f}%. "
        f"Looking for disruptions, price changes, or surcharges affecting {route}."
    )

    # Query ChromaDB for semantically similar notes
    results = collection.query(
        query_texts=[query_text],
        n_results=min(top_k, collection.count()),
    )

    if not results or not results["metadatas"] or not results["metadatas"][0]:
        return []

    candidates = []
    week_date = _parse_date(week_of)

    for i, metadata in enumerate(results["metadatas"][0]):
        note_id = metadata["note_id"]
        note_date = metadata["date"]
        applies_to = metadata["applies_to"]
        note_text = metadata["original_note"]
        distance = results["distances"][0][i] if results["distances"] else None

        # Check route applicability
        is_route_match = _check_route_match(applies_to, route)

        # Check date proximity
        is_date_proximate = _check_date_proximity(note_date, week_date)

        # Check negative evidence (anti-hallucination)
        passes_negative = _passes_negative_filter(note_text)

        candidates.append({
            "note_id": note_id,
            "date": note_date,
            "applies_to": applies_to,
            "note_text": note_text,
            "distance": round(distance, 4) if distance is not None else None,
            "is_route_match": is_route_match,
            "is_date_proximate": is_date_proximate,
            "passes_negative_filter": passes_negative,
        })

    return candidates


def filter_valid_candidates(candidates: list[dict]) -> list[dict]:
    """
    Filter candidates to only those that pass all three checks:
    1. Route match (applies_to matches or is "All Routes")
    2. Date proximity (within window)
    3. Passes negative evidence filter

    Returns candidates sorted by best match (shortest distance first).
    """
    valid = [
        c for c in candidates
        if c["is_route_match"]
        and c["is_date_proximate"]
        and c["passes_negative_filter"]
    ]

    # Sort by distance (lower = more similar)
    valid.sort(key=lambda x: x["distance"] if x["distance"] is not None else float("inf"))

    return valid


def _check_route_match(applies_to: str, route: str) -> bool:
    """Check if a note applies to the given route."""
    applies_to = applies_to.strip()

    # "All Routes" applies to every route
    if applies_to.lower() == "all routes":
        return True

    # Direct match
    if applies_to == route:
        return True

    # Check reverse route (e.g., "Mumbai-Delhi" should also match "Delhi-Mumbai")
    parts = route.split("-")
    if len(parts) == 2:
        reverse = f"{parts[1]}-{parts[0]}"
        if applies_to == reverse:
            return True

    return False


def _check_date_proximity(note_date_str: str, anomaly_date, window_days: int = NOTE_DATE_WINDOW_DAYS) -> bool:
    """
    Check if a note's date is within the proximity window of the anomaly week.
    A note is relevant if it falls within window_days before or after the anomaly week.
    """
    note_date = _parse_date(note_date_str)
    if note_date is None or anomaly_date is None:
        return False

    diff = abs((note_date - anomaly_date).days)
    return diff <= window_days


def _passes_negative_filter(note_text: str) -> bool:
    """
    Check if a note does NOT contain negative evidence phrases.
    Returns True if the note could potentially justify a cost rise.
    Returns False if the note explicitly says costs were not affected.
    """
    text_lower = note_text.lower()

    for phrase in NEGATIVE_EVIDENCE_PHRASES:
        if phrase.lower() in text_lower:
            return False

    return True


def _parse_date(date_str):
    """Parse a date string to a datetime object."""
    if isinstance(date_str, datetime):
        return date_str
    if hasattr(date_str, 'year'):  # datetime.date object
        return datetime(date_str.year, date_str.month, date_str.day)
    try:
        return datetime.strptime(str(date_str).strip(), "%Y-%m-%d")
    except (ValueError, TypeError):
        return None
