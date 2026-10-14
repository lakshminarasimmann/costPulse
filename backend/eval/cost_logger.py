"""
cost_logger.py — Token usage and cost tracking utilities.

Tracks all LLM calls, input/output tokens, and estimated costs.
Saves results as JSON for reproducibility reporting.
"""

import json
from pathlib import Path
from backend.config import OUTPUT_DIR
from backend.rag.reasoner import get_cost_log, reset_cost_log


def save_cost_log(filename: str = "cost_log.json") -> dict:
    """
    Save the accumulated cost log to JSON.

    Returns the cost log dict.
    """
    cost_log = get_cost_log()
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        filepath = OUTPUT_DIR / filename
        with open(filepath, "w") as f:
            json.dump(cost_log, f, indent=2)
        print(f"\n[Cost Log] Saved to {filepath}")
    except Exception as e:
        print(f"\n[Cost Log] Notice: Could not save to {OUTPUT_DIR}: {e}")
    print(f"  Total LLM calls: {cost_log['total_calls']}")
    print(f"  Total input tokens: {cost_log['total_input_tokens']}")
    print(f"  Total output tokens: {cost_log['total_output_tokens']}")
    print(f"  Estimated cost: ${cost_log['total_cost_usd']:.6f}")

    return cost_log


def print_cost_summary():
    """Print a summary of the cost log."""
    cost_log = get_cost_log()

    print("\n" + "="*50)
    print("  TOKEN / COST REPORT")
    print("="*50)
    print(f"  LLM Backend:        {cost_log.get('backend', 'rule_based')}")
    print(f"  Total LLM calls:    {cost_log['total_calls']}")
    print(f"  Total input tokens: {cost_log['total_input_tokens']:,}")
    print(f"  Total output tokens:{cost_log['total_output_tokens']:,}")
    print(f"  Estimated cost:     ${cost_log['total_cost_usd']:.6f}")

    if cost_log['total_calls'] == 0:
        print("  (Rule-based mode: no LLM calls, $0 cost)")
    print("="*50)

    return cost_log
