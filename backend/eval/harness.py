"""
harness.py — Lightweight evaluation harness for validating the assistant's outputs.

Contains a set of manually labeled test cases derived from careful reading of context_notes.csv.
These test the system's ability to:
1. Correctly justify anomalies with valid notes
2. Correctly reject trap notes (negative evidence)
3. Produce consistent results across runs
"""

import pandas as pd
from datetime import datetime


# ─── Golden Test Cases ────────────────────────────────────────────────────────
# Each test case specifies what the system SHOULD do for a specific scenario.
# These are derived from careful analysis of context_notes.csv.

GOLDEN_TESTS = [
    # === SHOULD JUSTIFY ===
    {
        "test_id": "T001",
        "description": "N001: Chennai-Bangalore flooding Feb 24 - Mar 8 should justify cost rises",
        "route": "Chennai-Bangalore",
        "week_range": ("2025-02-24", "2025-03-03"),  # Weeks during flood period
        "expected_justified": True,
        "expected_note_id": "N001",
        "reason": "N001 describes flooding causing detours and higher costs from Feb 24 to Mar 8",
    },
    {
        "test_id": "T002",
        "description": "N002: Ahmedabad-Mumbai festival surcharge around Jan 20, 2025",
        "route": "Ahmedabad-Mumbai",
        "week_range": ("2025-01-20", "2025-01-26"),
        "expected_justified": True,
        "expected_note_id": "N002",
        "reason": "N002 describes a festival week surcharge on Ahmedabad-Mumbai",
    },
    {
        "test_id": "T003",
        "description": "N003: Diesel price rise from May 5, 2025 should justify All Routes",
        "route": "Mumbai-Delhi",  # Any route
        "week_range": ("2025-05-05", "2025-05-18"),
        "expected_justified": True,
        "expected_note_id": "N003",
        "reason": "N003 describes nationwide diesel price rise pushing up costs 5-7%",
    },

    # === SHOULD NOT JUSTIFY (TRAP NOTES) ===
    {
        "test_id": "T004",
        "description": "N004: Toll plaza commissioned but routes NOT in dataset — must reject",
        "route": "Mumbai-Pune",
        "week_range": ("2024-03-11", "2024-03-17"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N004 explicitly says 'affected routes are not part of this dataset'",
    },
    {
        "test_id": "T005",
        "description": "N005: Mumbai-Delhi highway maintenance, costs NOT significantly affected",
        "route": "Mumbai-Delhi",
        "week_range": ("2024-07-29", "2024-08-04"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N005 says 'costs were not significantly affected' — does not justify increase",
    },
    {
        "test_id": "T006",
        "description": "N006: Stable demand, no disruptions — must reject",
        "route": "Mumbai-Pune",
        "week_range": ("2025-09-22", "2025-09-28"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N006 says 'demand remained stable with no major disruptions' — does not justify",
    },
    {
        "test_id": "T007",
        "description": "N007: Improved road conditions on Delhi-Jaipur — should REDUCE, not increase costs",
        "route": "Delhi-Jaipur",
        "week_range": ("2024-05-20", "2024-05-26"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N007 describes improved roads — this would reduce costs, not increase them",
    },
    {
        "test_id": "T008",
        "description": "N008: No disruptions on Kolkata-Bhubaneswar — must reject",
        "route": "Kolkata-Bhubaneswar",
        "week_range": ("2025-06-09", "2025-06-15"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N008 says 'no significant disruptions' and 'remained normal'",
    },
    {
        "test_id": "T009",
        "description": "N010: Tracking mandate costs absorbed — must reject",
        "route": "Delhi-Chennai",
        "week_range": ("2025-10-27", "2025-11-02"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N010 says 'costs were absorbed by transporters without a rate change'",
    },
    {
        "test_id": "T010",
        "description": "N009: Chennai-Bangalore returned to normal after flood repairs — does not justify NEW increase",
        "route": "Chennai-Bangalore",
        "week_range": ("2025-03-17", "2025-03-23"),
        "expected_justified": False,
        "expected_note_id": "",
        "reason": "N009 says route returned to normal — does not explain new cost increase",
    },
]


def run_eval_harness(results_df: pd.DataFrame) -> dict:
    """
    Run the evaluation harness against the pipeline results.

    Parameters
    ----------
    results_df : DataFrame
        The full pipeline results with flagged, matched_note_id columns.

    Returns
    -------
    dict with:
        - total_tests: int
        - passed: int
        - failed: int
        - results: list of individual test results
        - pass_rate: float
    """
    test_results = []

    for test in GOLDEN_TESTS:
        result = _run_single_test(test, results_df)
        test_results.append(result)

    passed = sum(1 for r in test_results if r["passed"])
    total = len(test_results)

    return {
        "total_tests": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": round(passed / total * 100, 1) if total > 0 else 0,
        "results": test_results,
    }


def _run_single_test(test: dict, results_df: pd.DataFrame) -> dict:
    """Run a single test case against the results."""
    test_id = test["test_id"]
    route = test["route"]
    week_start, week_end = test["week_range"]
    expected_justified = test["expected_justified"]
    expected_note_id = test["expected_note_id"]

    # Find matching rows in results
    mask = (
        (results_df["route"] == route)
        & (results_df["week_of"].astype(str) >= week_start)
        & (results_df["week_of"].astype(str) <= week_end)
    )
    matching_rows = results_df[mask]

    if matching_rows.empty:
        return {
            "test_id": test_id,
            "description": test["description"],
            "passed": False,
            "error": f"No data found for {route} in week range {week_start} to {week_end}",
            "expected": f"justified={expected_justified}, note={expected_note_id}",
            "actual": "NO DATA",
        }

    if expected_justified:
        # Should be justified: look for any row in the range that was justified by this note
        justified_match = matching_rows[
            (matching_rows["flagged"] == "No (justified)")
            & (matching_rows["matched_note_id"] == expected_note_id)
        ]
        passed = len(justified_match) > 0
        actual = (
            f"flagged=No (justified), note={justified_match.iloc[0]['matched_note_id']}"
            if passed
            else f"flagged={matching_rows.iloc[0].get('flagged', 'No')}, note={matching_rows.iloc[0].get('matched_note_id', '')}"
        )
    else:
        # Should NOT be justified: verify no row in this range was mistakenly justified
        mistakes = matching_rows[matching_rows["flagged"] == "No (justified)"]
        passed = len(mistakes) == 0
        actual = (
            f"flagged={matching_rows.iloc[0].get('flagged', 'No')}, note={matching_rows.iloc[0].get('matched_note_id', '')}"
            if passed
            else f"mistakenly justified: {mistakes.iloc[0].get('matched_note_id', '')}"
        )

    has_anomaly = False
    if "is_anomaly" in matching_rows.columns:
        has_anomaly = bool(matching_rows["is_anomaly"].any())
    else:
        has_anomaly = bool(matching_rows["flagged"].isin(["Yes", "No (justified)"]).any())

    return {
        "test_id": test_id,
        "description": test["description"],
        "passed": passed,
        "expected": f"justified={expected_justified}, note={expected_note_id}",
        "actual": actual,
        "is_anomaly": has_anomaly,
        "route": route,
        "week_range": f"{week_start} to {week_end}",
    }
