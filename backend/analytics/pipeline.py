"""
pipeline.py — Main analytics computation pipeline.

This is the core engine that:
1. Loads shipment records
2. Computes cost_per_tonne_km per shipment
3. Assigns each shipment to its ISO week (Monday-start)
4. Aggregates weekly averages per route
5. Computes both baselines (own history + peer average)
6. Applies flagging logic

All computation is deterministic — no randomness, no LLM calls.
"""

import pandas as pd
import numpy as np
from backend.config import SHIPMENT_FILE, CONTEXT_NOTES_FILE
from backend.analytics.baselines import compute_trailing_average, compute_peer_average
from backend.analytics.flags import apply_flags


def load_shipment_data(filepath=None) -> pd.DataFrame:
    """Load and validate shipment records from CSV."""
    filepath = filepath or SHIPMENT_FILE
    df = pd.read_csv(filepath)

    # Parse date
    df["shipment_date"] = pd.to_datetime(df["shipment_date"])

    # Compute route identifier
    df["route"] = df["origin"] + "-" + df["destination"]

    # Compute cost per tonne-km for each individual shipment
    df["cost_per_tonne_km"] = df["freight_cost_inr"] / (
        df["quantity_tonnes"] * df["distance_km"]
    )

    return df


def load_context_notes(filepath=None) -> pd.DataFrame:
    """Load context notes from CSV."""
    filepath = filepath or CONTEXT_NOTES_FILE
    df = pd.read_csv(filepath)
    df["date"] = pd.to_datetime(df["date"])
    return df


def assign_week_monday(df: pd.DataFrame) -> pd.DataFrame:
    """
    Assign each shipment to its ISO week's Monday date.
    Weeks run Monday to Sunday; week_of is that week's Monday.
    """
    df = df.copy()
    # Get the Monday of the week for each shipment date
    # weekday(): Monday=0, Sunday=6
    df["week_of"] = df["shipment_date"] - pd.to_timedelta(
        df["shipment_date"].dt.weekday, unit="D"
    )
    # Format as ISO date string (YYYY-MM-DD)
    df["week_of"] = df["week_of"].dt.strftime("%Y-%m-%d")
    return df


def compute_weekly_route_costs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate shipments into weekly route-level cost_per_tonne_km.

    For each (route, week_of), we compute the weighted average cost_per_tonne_km:
    - Total freight cost for the week / (total tonnes * weighted avg distance)

    But actually, the simpler and more standard approach is to take the
    mean of individual shipment cost_per_tonne_km values for that route-week.
    This treats each shipment equally.

    We also track total quantity and shipment count for context.
    """
    weekly = df.groupby(["route", "route_type", "week_of"]).agg(
        cost_per_tonne_km=("cost_per_tonne_km", "mean"),
        total_freight_cost=("freight_cost_inr", "sum"),
        total_quantity_tonnes=("quantity_tonnes", "sum"),
        avg_distance_km=("distance_km", "mean"),
        shipment_count=("shipment_id", "count"),
    ).reset_index()

    # Sort by route and week for proper rolling computation
    weekly = weekly.sort_values(["route", "week_of"]).reset_index(drop=True)

    # Round cost_per_tonne_km to 2 decimal places
    weekly["cost_per_tonne_km"] = weekly["cost_per_tonne_km"].round(2)

    return weekly


def build_route_type_mapping(df: pd.DataFrame) -> pd.DataFrame:
    """Extract unique route -> route_type mapping."""
    return df[["route", "route_type"]].drop_duplicates().reset_index(drop=True)


def run_pipeline(shipment_file=None) -> pd.DataFrame:
    """
    Execute the full analytics pipeline and return the results DataFrame.

    Returns
    -------
    DataFrame with columns:
        route, week_of, route_type, cost_per_tonne_km,
        trailing_avg, pct_vs_own_history, vs_own_history_str,
        peer_avg, pct_vs_similar_routes, vs_similar_routes_str,
        is_anomaly, flagged, matched_note_id, reason,
        + context columns (shipment_count, total_freight_cost, etc.)
    """
    # Step 1: Load data
    print("[Pipeline] Loading shipment data...")
    shipments = load_shipment_data(shipment_file)
    print(f"[Pipeline] Loaded {len(shipments)} shipment records")
    print(f"[Pipeline] Routes: {sorted(shipments['route'].unique())}")
    print(f"[Pipeline] Date range: {shipments['shipment_date'].min().date()} to {shipments['shipment_date'].max().date()}")

    # Step 2: Assign week Mondays
    print("[Pipeline] Assigning week Mondays...")
    shipments = assign_week_monday(shipments)

    # Step 3: Compute weekly costs per route
    print("[Pipeline] Computing weekly route costs...")
    weekly = compute_weekly_route_costs(shipments)
    print(f"[Pipeline] Created {len(weekly)} route-week records")

    # Step 4: Compute trailing average (vs own history)
    print("[Pipeline] Computing trailing averages...")
    route_types = build_route_type_mapping(weekly)
    weekly = compute_trailing_average(weekly)

    # Step 5: Compute peer average (vs similar routes)
    print("[Pipeline] Computing peer averages...")
    weekly = compute_peer_average(weekly, route_types)

    # Step 6: Apply flags
    print("[Pipeline] Applying anomaly flags...")
    weekly = apply_flags(weekly)

    anomaly_count = weekly["is_anomaly"].sum()
    total = len(weekly)
    print(f"[Pipeline] Flagged {anomaly_count} / {total} route-weeks as anomalies")

    return weekly


def get_pipeline_summary(results: pd.DataFrame) -> dict:
    """Generate summary statistics from pipeline results."""
    total_weeks = len(results)
    total_anomalies = int(results["is_anomaly"].sum())
    routes = sorted(results["route"].unique().tolist())

    # Per-route anomaly counts
    route_anomalies = (
        results[results["is_anomaly"]]
        .groupby("route")
        .size()
        .to_dict()
    )

    # Per-route-type anomaly counts
    type_anomalies = (
        results[results["is_anomaly"]]
        .groupby("route_type")
        .size()
        .to_dict()
    )

    return {
        "total_route_weeks": total_weeks,
        "total_anomalies": total_anomalies,
        "anomaly_rate": round(total_anomalies / total_weeks * 100, 1) if total_weeks > 0 else 0,
        "routes": routes,
        "route_count": len(routes),
        "route_anomalies": route_anomalies,
        "route_type_anomalies": type_anomalies,
        "date_range": {
            "start": str(results["week_of"].min()),
            "end": str(results["week_of"].max()),
        },
    }
