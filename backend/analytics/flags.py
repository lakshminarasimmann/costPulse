"""
flags.py — Flagging logic for anomaly detection.

A route-week is flagged if its cost_per_tonne_km exceeds EITHER:
  - THRESHOLD_OWN_HISTORY (%) above its own trailing average, OR
  - THRESHOLD_SIMILAR_ROUTES (%) above its peer average

After RAG justification check:
  - If justified by a valid note → flagged = "No (justified)"
  - If not justified → flagged = "Yes"
  - If below both thresholds → flagged = "No"
"""

import pandas as pd
import numpy as np
from backend.config import THRESHOLD_OWN_HISTORY, THRESHOLD_SIMILAR_ROUTES


def apply_flags(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply anomaly flags based on percentage deviation thresholds.

    Parameters
    ----------
    df : DataFrame
        Must have columns: pct_vs_own_history, pct_vs_similar_routes

    Returns
    -------
    DataFrame with added column:
        - is_anomaly: bool — True if either threshold is exceeded
        - flagged: str — initial flag value ("Yes" or "No"), will be updated
          after RAG check to possibly "No (justified)"
    """
    df = df.copy()

    # Determine if the route-week exceeds thresholds
    exceeds_own = df["pct_vs_own_history"].fillna(0) > THRESHOLD_OWN_HISTORY
    exceeds_peer = df["pct_vs_similar_routes"].fillna(0) > THRESHOLD_SIMILAR_ROUTES

    df["is_anomaly"] = exceeds_own | exceeds_peer

    # Initial flag: "Yes" if anomaly, "No" otherwise
    # This will be updated to "No (justified)" after RAG check
    df["flagged"] = np.where(df["is_anomaly"], "Yes", "No")

    # Initialize columns for RAG results
    df["matched_note_id"] = ""
    df["reason"] = ""

    return df


def update_flag_with_justification(
    df: pd.DataFrame,
    route: str,
    week_of: str,
    note_id: str,
    reason: str,
    is_justified: bool,
) -> pd.DataFrame:
    """
    Update the flag for a specific (route, week_of) after RAG justification check.

    Parameters
    ----------
    df : DataFrame
        The main results dataframe.
    route : str
        Route name (e.g., "Chennai-Bangalore").
    week_of : str
        Week Monday date string.
    note_id : str
        The matched note ID (e.g., "N001") or empty string.
    reason : str
        Plain-English explanation.
    is_justified : bool
        Whether the cost rise is justified by a valid note.

    Returns
    -------
    Updated DataFrame.
    """
    mask = (df["route"] == route) & (df["week_of"].astype(str) == str(week_of))

    if is_justified and note_id:
        df.loc[mask, "flagged"] = "No (justified)"
        df.loc[mask, "matched_note_id"] = note_id
        df.loc[mask, "reason"] = reason
    else:
        # Flagged but unexplained
        df.loc[mask, "matched_note_id"] = note_id if note_id else ""
        df.loc[mask, "reason"] = reason if reason else (
            "No matching note found for this route or date range. "
            "Cost rise looks unexplained and worth a human review."
        )

    return df
