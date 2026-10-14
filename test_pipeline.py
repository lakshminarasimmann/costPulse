"""Quick test script to validate the pipeline runs correctly."""
import sys
from pathlib import Path
import pandas as pd

# Ensure imports work
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from backend.analytics.pipeline import run_pipeline, get_pipeline_summary
from backend.rag.embeddings import initialize_vector_store
from backend.analytics.pipeline import load_context_notes
from backend.output.formatter import format_output, save_output

print("Testing pipeline...")
results = run_pipeline()
print(f"\nPipeline returned {len(results)} rows")
print(f"Columns: {list(results.columns)}")

# Show a few anomalies
anomalies = results[results["is_anomaly"]]
print(f"\nAnomalies found: {len(anomalies)}")
print("\nSample anomalies:")
for _, row in anomalies.head(5).iterrows():
    print(f"  {row['route']} | {row['week_of']} | cost={row['cost_per_tonne_km']:.2f} | "
          f"vs_history={row['pct_vs_own_history']:+.1f}% | vs_peers={row['pct_vs_similar_routes']:+.1f}%")

# Test vector store
print("\nInitializing vector store...")
collection = initialize_vector_store()
print(f"Vector store has {collection.count()} notes")

# Test RAG on one anomaly
from backend.rag.reasoner import reason_about_anomaly
if len(anomalies) > 0:
    test_row = anomalies.iloc[0]
    print(f"\nTesting RAG on: {test_row['route']} week {test_row['week_of']}...")
    rag_result = reason_about_anomaly(
        collection=collection,
        route=test_row['route'],
        week_of=str(test_row['week_of']),
        cost_per_tonne_km=test_row['cost_per_tonne_km'],
        pct_vs_history=test_row['pct_vs_own_history'] if not pd.isna(test_row['pct_vs_own_history']) else 0,
        pct_vs_peers=test_row['pct_vs_similar_routes'] if not pd.isna(test_row['pct_vs_similar_routes']) else 0,
        route_type=test_row['route_type'],
    )
    print(f"  Justified: {rag_result['is_justified']}")
    print(f"  Note: {rag_result['matched_note_id']}")
    print(f"  Reason: {rag_result['reason'][:100]}...")

# Format and save
output = format_output(results)
save_output(output)
print(f"\nOutput saved. Columns: {list(output.columns)}")
print("\n[OK] Pipeline test PASSED!")

