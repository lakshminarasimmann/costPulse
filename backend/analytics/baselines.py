"""
baselines.py — Baseline computation functions for cost comparisons.

Two baselines are computed per (route, week):
1. vs_own_history: trailing 8-week rolling average (strictly before current week)
2. vs_similar_routes: peer average of same route_type in same week, excluding self
"""

import pandas as pd
import numpy as np
from backend.config import TRAILING_WINDOW


def compute_trailing_average(
    route_weekly: pd.DataFrame,
    window: int = TRAILING_WINDOW,
) -> pd.DataFrame:
    """
    Compute trailing rolling average for each route's weekly cost.

    Parameters
    ----------
    route_weekly : DataFrame
        Must have columns: route, week_of, cost_per_tonne_km
        Sorted by (route, week_of).
    window : int
        Number of prior weeks to include in the trailing average.

    Returns
    -------
    DataFrame with added columns:
        - trailing_avg: the rolling average using up to `window` prior weeks
        - trailing_weeks_used: how many prior weeks were available
        - pct_vs_own_history: percentage change vs trailing average
        - vs_own_history_str: formatted string like "+35.5% vs this route's past average"
    """
    result_frames = []

    for route_name, group in route_weekly.groupby("route", sort=False):
        group = group.sort_values("week_of").reset_index(drop=True)

        trailing_avgs = []
        weeks_used = []

        for i in range(len(group)):
            # Use only weeks STRICTLY BEFORE the current week (no look-ahead)
            start_idx = max(0, i - window)
            prior_weeks = group.iloc[start_idx:i]

            if len(prior_weeks) == 0:
                trailing_avgs.append(np.nan)
                weeks_used.append(0)
            else:
                trailing_avgs.append(prior_weeks["cost_per_tonne_km"].mean())
                weeks_used.append(len(prior_weeks))

        group = group.copy()
        group["trailing_avg"] = trailing_avgs
        group["trailing_weeks_used"] = weeks_used

        # Compute percentage change
        group["pct_vs_own_history"] = np.where(
            group["trailing_avg"].notna() & (group["trailing_avg"] > 0),
            ((group["cost_per_tonne_km"] - group["trailing_avg"]) / group["trailing_avg"]) * 100,
            np.nan,
        )

        # Format the string
        group["vs_own_history_str"] = group["pct_vs_own_history"].apply(
            lambda x: _format_pct(x, "this route's past average") if pd.notna(x) else ""
        )

        result_frames.append(group)

    return pd.concat(result_frames, ignore_index=True)


def compute_peer_average(
    route_weekly: pd.DataFrame,
    route_types: pd.DataFrame,
) -> pd.DataFrame:
    """
    Compute peer average for each (route, week) across routes with the same route_type,
    excluding the route itself.

    Parameters
    ----------
    route_weekly : DataFrame
        Must have columns: route, week_of, cost_per_tonne_km
    route_types : DataFrame
        Must have columns: route, route_type

    Returns
    -------
    DataFrame with added columns:
        - peer_avg: average cost_per_tonne_km of same-type routes in same week (excl self)
        - peer_count: number of peer routes contributing to the average
        - pct_vs_similar_routes: percentage change vs peer average
        - vs_similar_routes_str: formatted string like "+21.0% vs similar-length routes this week"
    """
    # Merge route_type into the weekly data (only if not already present)
    if "route_type" in route_weekly.columns:
        merged = route_weekly.copy()
    else:
        merged = route_weekly.merge(route_types, on="route", how="left")

    peer_avgs = []
    peer_counts = []

    for idx, row in merged.iterrows():
        # Find all routes of the same type in the same week, excluding self
        same_type_same_week = merged[
            (merged["route_type"] == row["route_type"])
            & (merged["week_of"] == row["week_of"])
            & (merged["route"] != row["route"])
        ]

        if len(same_type_same_week) == 0:
            peer_avgs.append(np.nan)
            peer_counts.append(0)
        else:
            peer_avgs.append(same_type_same_week["cost_per_tonne_km"].mean())
            peer_counts.append(len(same_type_same_week))

    merged["peer_avg"] = peer_avgs
    merged["peer_count"] = peer_counts

    # Compute percentage change
    merged["pct_vs_similar_routes"] = np.where(
        merged["peer_avg"].notna() & (merged["peer_avg"] > 0),
        ((merged["cost_per_tonne_km"] - merged["peer_avg"]) / merged["peer_avg"]) * 100,
        np.nan,
    )

    # Format the string
    merged["vs_similar_routes_str"] = merged["pct_vs_similar_routes"].apply(
        lambda x: _format_pct(x, "similar-length routes this week") if pd.notna(x) else ""
    )

    return merged


def _format_pct(value: float, suffix: str) -> str:
    """Format a percentage change as '+35.5% vs <suffix>' or '-12.3% vs <suffix>'."""
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.1f}% vs {suffix}"
