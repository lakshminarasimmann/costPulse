"""
formatter.py — CSV output generation matching sample_output_format_v2.csv exactly.

Output columns (in order):
  route, week_of, cost_per_tonne_km, vs_own_history, vs_similar_routes,
  flagged, matched_note_id, reason
"""

import pandas as pd
from backend.config import OUTPUT_DIR


def format_output(results_df: pd.DataFrame) -> pd.DataFrame:
    """
    Format the pipeline results into the exact output format required.

    Parameters
    ----------
    results_df : DataFrame
        Full pipeline results with all computed columns.

    Returns
    -------
    DataFrame with exactly the columns in sample_output_format_v2.csv
    """
    output = pd.DataFrame()

    output["route"] = results_df["route"]
    output["week_of"] = results_df["week_of"].astype(str)
    output["cost_per_tonne_km"] = results_df["cost_per_tonne_km"].round(2)
    output["vs_own_history"] = results_df["vs_own_history_str"]
    output["vs_similar_routes"] = results_df["vs_similar_routes_str"]
    output["flagged"] = results_df["flagged"]
    output["matched_note_id"] = results_df["matched_note_id"].fillna("")
    output["reason"] = results_df["reason"].fillna("")

    # Sort by route and week for consistent output
    output = output.sort_values(["route", "week_of"]).reset_index(drop=True)

    return output


def save_output(output_df: pd.DataFrame, filename: str = "anomaly_report.csv"):
    """Save the formatted output to CSV."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    filepath = OUTPUT_DIR / filename
    output_df.to_csv(filepath, index=False)
    print(f"[Output] Saved {len(output_df)} rows to {filepath}")
    return filepath
