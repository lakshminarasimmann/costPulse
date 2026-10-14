"""
reproducibility.py — 3-run reproducibility checker.

Runs the pipeline 3 times and verifies:
1. Flag columns are identical across all runs
2. Numeric columns are identical across all runs
3. Note citations are identical across all runs
4. Only explanation wording may vary (if LLM is used)
"""

import pandas as pd
from pathlib import Path
from backend.config import OUTPUT_DIR
from backend.output.formatter import format_output, save_output


def run_reproducibility_check(run_pipeline_fn, rag_process_fn=None, num_runs: int = 3) -> dict:
    """
    Run the pipeline multiple times and compare outputs.

    Parameters
    ----------
    run_pipeline_fn : callable
        Function that returns the full pipeline results DataFrame.
    rag_process_fn : callable, optional
        Function that processes RAG justifications on the results.
    num_runs : int
        Number of runs to compare (default 3).

    Returns
    -------
    dict with:
        - identical: bool — whether all runs are identical on graded columns
        - diffs: list of any differences found
        - run_files: list of output file paths
    """
    run_outputs = []
    run_files = []

    for i in range(1, num_runs + 1):
        print(f"\n{'='*60}")
        print(f"  REPRODUCIBILITY RUN {i}/{num_runs}")
        print(f"{'='*60}")

        # Run pipeline
        results = run_pipeline_fn()

        # Apply RAG if available
        if rag_process_fn is not None:
            results = rag_process_fn(results)

        # Format output
        output = format_output(results)

        # Save
        filename = f"run_{i}.csv"
        save_output(output, filename)
        run_files.append(str(OUTPUT_DIR / filename))

        run_outputs.append(output)

    # Compare runs
    diffs = _compare_runs(run_outputs)

    identical = len(diffs) == 0

    if identical:
        print(f"\n[OK] All {num_runs} runs produced IDENTICAL outputs on graded columns.")
    else:
        print(f"\n[FAIL] Found {len(diffs)} differences across runs!")
        for diff in diffs[:10]:  # Show first 10
            print(f"  - {diff}")

    return {
        "identical": identical,
        "num_runs": num_runs,
        "diffs": diffs,
        "run_files": run_files,
        "rows_per_run": len(run_outputs[0]) if run_outputs else 0,
    }


def _compare_runs(outputs: list[pd.DataFrame]) -> list[str]:
    """Compare multiple output DataFrames and return differences."""
    if len(outputs) < 2:
        return []

    diffs = []
    # Graded columns — these MUST be identical
    graded_cols = [
        "route", "week_of", "cost_per_tonne_km",
        "vs_own_history", "vs_similar_routes",
        "flagged", "matched_note_id",
    ]

    reference = outputs[0]

    for run_idx, other in enumerate(outputs[1:], start=2):
        # Check row count
        if len(reference) != len(other):
            diffs.append(
                f"Run 1 has {len(reference)} rows, Run {run_idx} has {len(other)} rows"
            )
            continue

        for col in graded_cols:
            if col not in reference.columns or col not in other.columns:
                diffs.append(f"Column '{col}' missing in Run {run_idx}")
                continue

            ref_col = reference[col].fillna("").astype(str).str.strip()
            other_col = other[col].fillna("").astype(str).str.strip()
            mismatches = ref_col != other_col
            if mismatches.any():
                mismatch_count = mismatches.sum()
                first_mismatch_idx = mismatches.idxmax()
                diffs.append(
                    f"Column '{col}': {mismatch_count} mismatches between Run 1 and Run {run_idx}. "
                    f"First at row {first_mismatch_idx}: "
                    f"'{reference.loc[first_mismatch_idx, col]}' vs '{other.loc[first_mismatch_idx, col]}'"
                )

    return diffs
