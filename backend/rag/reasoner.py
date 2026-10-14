"""
reasoner.py — LLM-powered reasoning for anomaly justification.

Supports three backends:
1. "rule_based" — Pure deterministic logic (no LLM, always reproducible, free)
2. "groq" — Groq API with Llama 3.1 (free tier, temperature=0)
3. "ollama" — Local Ollama model (free, temperature=0)

Anti-hallucination is the #1 priority:
- LLM is used as a VALIDATOR, never as a generator
- If no valid note is found, the answer is always "unexplained"
- Negative evidence is explicitly caught and rejected

Token/cost tracking is built into every call.
"""

import json
import time
from datetime import datetime
from backend.config import (
    LLM_BACKEND,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_MODEL,
    OLLAMA_BASE_URL,
    LLM_TEMPERATURE,
    LLM_MAX_TOKENS,
)
from backend.rag.retriever import retrieve_candidate_notes, filter_valid_candidates

# Global cost tracking
_cost_log = {
    "calls": [],
    "total_input_tokens": 0,
    "total_output_tokens": 0,
    "total_calls": 0,
    "total_cost_usd": 0.0,
}


def get_cost_log() -> dict:
    """Return the accumulated cost log."""
    return _cost_log.copy()


def reset_cost_log():
    """Reset the cost log for a new run."""
    global _cost_log
    _cost_log = {
        "calls": [],
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_calls": 0,
        "total_cost_usd": 0.0,
    }


def reason_about_anomaly(
    collection,
    route: str,
    week_of: str,
    cost_per_tonne_km: float,
    pct_vs_history: float,
    pct_vs_peers: float,
    route_type: str,
) -> dict:
    """
    Determine if a flagged anomaly is justified by context notes.

    Parameters
    ----------
    collection : chromadb.Collection
        ChromaDB collection with embedded notes.
    route, week_of, cost_per_tonne_km : anomaly details
    pct_vs_history, pct_vs_peers : percentage deviations
    route_type : str ("Short", "Medium", "Long")

    Returns
    -------
    dict with keys:
        - is_justified: bool
        - matched_note_id: str (e.g., "N001") or ""
        - reason: str (plain-English explanation)
        - candidates_checked: list of candidate note dicts
    """
    # Step 1: Retrieve candidate notes from ChromaDB
    cost_change = max(
        pct_vs_history if pct_vs_history else 0,
        pct_vs_peers if pct_vs_peers else 0,
    )
    candidates = retrieve_candidate_notes(
        collection, route, str(week_of), cost_change
    )

    # Step 2: Filter to only valid candidates (route match + date proximity + no negative evidence)
    valid_candidates = filter_valid_candidates(candidates)

    # Step 3: If no valid candidates, it's unexplained — DO NOT GUESS
    if not valid_candidates:
        # Build informative rejection reason
        reason = _build_rejection_reason(route, week_of, candidates)
        return {
            "is_justified": False,
            "matched_note_id": "",
            "reason": reason,
            "candidates_checked": candidates,
        }

    # Step 4: Use the configured backend to validate the best candidate
    backend = LLM_BACKEND

    if backend == "rule_based":
        return _rule_based_reasoning(
            valid_candidates[0], route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, candidates,
        )
    elif backend == "groq":
        return _llm_reasoning_groq(
            valid_candidates, route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, candidates,
        )
    elif backend == "ollama":
        return _llm_reasoning_ollama(
            valid_candidates, route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, candidates,
        )
    else:
        # Fallback to rule-based
        return _rule_based_reasoning(
            valid_candidates[0], route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, candidates,
        )


def _rule_based_reasoning(
    best_candidate: dict,
    route: str,
    week_of: str,
    cost_per_tonne_km: float,
    pct_vs_history: float,
    pct_vs_peers: float,
    all_candidates: list,
) -> dict:
    """
    Pure deterministic reasoning — no LLM calls.
    Validates the best candidate note against the anomaly.
    """
    note_id = best_candidate["note_id"]
    note_text = best_candidate["note_text"]
    note_date = best_candidate["date"]

    # Build a clear, grounded reason
    reason = (
        f"Matches note {note_id} dated {note_date}: {note_text} "
        f"The cost rise has a clear explanation."
    )

    return {
        "is_justified": True,
        "matched_note_id": note_id,
        "reason": reason,
        "candidates_checked": all_candidates,
    }


def _llm_reasoning_groq(
    valid_candidates: list,
    route: str,
    week_of: str,
    cost_per_tonne_km: float,
    pct_vs_history: float,
    pct_vs_peers: float,
    all_candidates: list,
) -> dict:
    """LLM-based reasoning via Groq API."""
    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        prompt = _build_validation_prompt(
            valid_candidates, route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers,
        )

        start_time = time.time()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _get_system_prompt()},
                {"role": "user", "content": prompt},
            ],
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )
        elapsed = time.time() - start_time

        # Track costs
        usage = response.usage
        _track_cost(
            input_tokens=usage.prompt_tokens,
            output_tokens=usage.completion_tokens,
            model=GROQ_MODEL,
            elapsed=elapsed,
        )

        # Parse LLM response
        return _parse_llm_response(
            response.choices[0].message.content,
            valid_candidates, all_candidates, route, week_of,
        )

    except Exception as e:
        print(f"[Reasoner] Groq API error: {e}. Falling back to rule-based.")
        return _rule_based_reasoning(
            valid_candidates[0], route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, all_candidates,
        )


def _llm_reasoning_ollama(
    valid_candidates: list,
    route: str,
    week_of: str,
    cost_per_tonne_km: float,
    pct_vs_history: float,
    pct_vs_peers: float,
    all_candidates: list,
) -> dict:
    """LLM-based reasoning via local Ollama."""
    try:
        import ollama

        prompt = _build_validation_prompt(
            valid_candidates, route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers,
        )

        start_time = time.time()
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": _get_system_prompt()},
                {"role": "user", "content": prompt},
            ],
            options={"temperature": LLM_TEMPERATURE},
        )
        elapsed = time.time() - start_time

        # Track costs (Ollama is free but we track tokens)
        _track_cost(
            input_tokens=response.get("prompt_eval_count", 0),
            output_tokens=response.get("eval_count", 0),
            model=OLLAMA_MODEL,
            elapsed=elapsed,
            cost_per_input=0.0,
            cost_per_output=0.0,
        )

        return _parse_llm_response(
            response["message"]["content"],
            valid_candidates, all_candidates, route, week_of,
        )

    except Exception as e:
        print(f"[Reasoner] Ollama error: {e}. Falling back to rule-based.")
        return _rule_based_reasoning(
            valid_candidates[0], route, week_of,
            cost_per_tonne_km, pct_vs_history, pct_vs_peers, all_candidates,
        )


def _get_system_prompt() -> str:
    """System prompt that enforces anti-hallucination behavior."""
    return """You are a freight cost analysis assistant. Your job is to determine whether a context note genuinely explains a cost increase on a specific route during a specific week.

STRICT RULES:
1. If the note says costs were NOT affected, output VERDICT: UNEXPLAINED
2. If the note describes improved conditions (better roads, completed repairs), that would REDUCE costs, not increase them — output VERDICT: UNEXPLAINED
3. If the note says disruptions were stable/normal/no major issues, output VERDICT: UNEXPLAINED
4. If the note says costs were absorbed by transporters, output VERDICT: UNEXPLAINED
5. If the note mentions a toll/event that explicitly doesn't affect the routes in question, output VERDICT: UNEXPLAINED
6. ONLY output VERDICT: JUSTIFIED if the note describes an event that would genuinely INCREASE costs (flooding, surcharges, fuel price rises, delays) AND applies to this route AND within the time window
7. DO NOT invent or guess reasons. If unsure, output VERDICT: UNEXPLAINED

Respond in this exact JSON format:
{"verdict": "JUSTIFIED" or "UNEXPLAINED", "note_id": "N001" or "", "reason": "one-line explanation"}"""


def _build_validation_prompt(
    candidates: list,
    route: str,
    week_of: str,
    cost_per_tonne_km: float,
    pct_vs_history: float,
    pct_vs_peers: float,
) -> str:
    """Build the validation prompt for LLM."""
    notes_text = "\n".join(
        f"- {c['note_id']} ({c['date']}, applies to: {c['applies_to']}): {c['note_text']}"
        for c in candidates
    )

    return f"""ANOMALY DETAILS:
- Route: {route}
- Week of: {week_of}
- Cost per tonne-km: {cost_per_tonne_km:.2f}
- vs own history: {pct_vs_history:+.1f}%
- vs similar routes: {pct_vs_peers:+.1f}%

CANDIDATE NOTES (already filtered for route and date relevance):
{notes_text}

Does any of these notes genuinely explain why costs INCREASED on {route} during the week of {week_of}? Remember: a note about improved conditions or stable markets does NOT explain a cost INCREASE."""


def _parse_llm_response(
    response_text: str,
    valid_candidates: list,
    all_candidates: list,
    route: str,
    week_of: str,
) -> dict:
    """Parse the LLM response and extract verdict."""
    try:
        # Try to parse as JSON
        # Find JSON in the response
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            parsed = json.loads(response_text[start:end])
            verdict = parsed.get("verdict", "UNEXPLAINED").upper()
            note_id = parsed.get("note_id", "")
            reason = parsed.get("reason", "")

            if verdict == "JUSTIFIED" and note_id:
                return {
                    "is_justified": True,
                    "matched_note_id": note_id,
                    "reason": f"Matches note {note_id}: {reason}",
                    "candidates_checked": all_candidates,
                }
    except (json.JSONDecodeError, KeyError):
        pass

    # If we can't parse or verdict is UNEXPLAINED
    return {
        "is_justified": False,
        "matched_note_id": "",
        "reason": _build_rejection_reason(route, week_of, all_candidates),
        "candidates_checked": all_candidates,
    }


def _build_rejection_reason(route: str, week_of: str, candidates: list) -> str:
    """Build a rejection reason explaining why no note was matched."""
    if not candidates:
        return (
            f"No matching note found for {route} around {week_of}. "
            f"Cost rise looks unexplained and worth a human review."
        )

    # Check if there were close notes that failed filters
    close_notes = [c for c in candidates if c["is_route_match"]]
    if close_notes:
        failed = close_notes[0]
        if not failed["passes_negative_filter"]:
            return (
                f"The closest note ({failed['note_id']}, {failed['date']}) applies to this route "
                f"but does not describe a reason for a cost rise — it indicates "
                f"normal conditions or explicitly states costs were not affected. "
                f"No genuine justification found; flagged for review."
            )
        if not failed["is_date_proximate"]:
            return (
                f"The closest note ({failed['note_id']}, {failed['date']}) applies to this route "
                f"but falls outside the relevant date window for week {week_of}. "
                f"No genuine justification found; flagged for review."
            )

    return (
        f"No matching note found for this route or date range. "
        f"Cost rise looks unexplained and worth a human review."
    )


def _track_cost(
    input_tokens: int,
    output_tokens: int,
    model: str,
    elapsed: float,
    cost_per_input: float = 0.59 / 1_000_000,  # Groq Llama 3.1 70B pricing
    cost_per_output: float = 0.79 / 1_000_000,
):
    """Track token usage and costs."""
    global _cost_log
    cost = input_tokens * cost_per_input + output_tokens * cost_per_output

    _cost_log["calls"].append({
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost, 6),
        "elapsed_seconds": round(elapsed, 2),
        "timestamp": datetime.now().isoformat(),
    })
    _cost_log["total_input_tokens"] += input_tokens
    _cost_log["total_output_tokens"] += output_tokens
    _cost_log["total_calls"] += 1
    _cost_log["total_cost_usd"] += cost


def answer_question(
    collection,
    question: str,
    results_df=None,
) -> dict:
    """
    Answer a free-form question about the freight cost analysis.
    This is the chat/QA endpoint for the stretch goal.

    Parameters
    ----------
    collection : chromadb.Collection
        ChromaDB collection for note retrieval.
    question : str
        User's question in plain English.
    results_df : pd.DataFrame, optional
        The full pipeline results for data-driven answers.

    Returns
    -------
    dict with keys: answer, sources, confidence
    """
    import pandas as pd

    # Step 1: Retrieve relevant notes
    search_results = collection.query(
        query_texts=[question],
        n_results=min(3, collection.count()),
    )

    sources = []
    if search_results and search_results["metadatas"]:
        for meta in search_results["metadatas"][0]:
            sources.append({
                "note_id": meta["note_id"],
                "date": meta["date"],
                "applies_to": meta["applies_to"],
                "note_text": meta["original_note"],
            })

    # Step 2: Build context from results data if available
    data_context = ""
    if results_df is not None and not results_df.empty:
        # Try to extract route mentions from the question
        routes = results_df["route"].unique()
        mentioned_routes = [r for r in routes if r.lower() in question.lower()]

        if mentioned_routes:
            route_data = results_df[results_df["route"].isin(mentioned_routes)]
            anomalies = route_data[route_data["is_anomaly"]]
            data_context = f"\n\nRelevant data: Found {len(anomalies)} anomalies for {', '.join(mentioned_routes)}."
            if not anomalies.empty:
                for _, row in anomalies.head(5).iterrows():
                    data_context += (
                        f"\n- Week {row['week_of']}: cost={row['cost_per_tonne_km']:.2f}, "
                        f"vs history={row['pct_vs_own_history']:+.1f}%, "
                        f"flagged={row['flagged']}"
                    )
                    if row.get("matched_note_id"):
                        data_context += f", note={row['matched_note_id']}"

    # Step 3: Generate answer
    backend = LLM_BACKEND

    if backend in ("groq", "ollama"):
        return _llm_answer_question(question, sources, data_context, backend)
    else:
        return _rule_based_answer(question, sources, data_context, results_df)


def _rule_based_answer(question: str, sources: list, data_context: str, results_df=None) -> dict:
    """Generate an answer using rule-based logic (no LLM)."""
    import pandas as pd

    answer_parts = []
    q_lower = question.lower()

    if results_df is not None and not results_df.empty:
        routes = results_df["route"].unique()
        mentioned_routes = [r for r in routes if r.lower() in q_lower]

        if mentioned_routes:
            for route in mentioned_routes:
                route_data = results_df[results_df["route"] == route]
                anomalies = route_data[route_data["is_anomaly"]]

                if "pricier" in q_lower or "cost" in q_lower or "expensive" in q_lower or "increase" in q_lower or "rise" in q_lower or "why" in q_lower:
                    if not anomalies.empty:
                        answer_parts.append(
                            f"**{route}** had {len(anomalies)} anomalous weeks. "
                        )
                        for _, row in anomalies.head(3).iterrows():
                            reason = row.get("reason", "No reason recorded")
                            answer_parts.append(
                                f"- Week of {row['week_of']}: cost was ₹{row['cost_per_tonne_km']:.2f}/tonne-km "
                                f"({row['pct_vs_own_history']:+.1f}% vs history). {reason}"
                            )
                    else:
                        answer_parts.append(f"**{route}** showed no significant cost anomalies.")

        # Check for month-specific questions
        months = {
            "january": "01", "february": "02", "march": "03", "april": "04",
            "may": "05", "june": "06", "july": "07", "august": "08",
            "september": "09", "october": "10", "november": "11", "december": "12",
            "jan": "01", "feb": "02", "mar": "03", "apr": "04",
        }
        for month_name, month_num in months.items():
            if month_name in q_lower:
                month_data = results_df[
                    results_df["week_of"].astype(str).str.contains(f"-{month_num}-")
                    & results_df["is_anomaly"]
                ]
                if not month_data.empty and not answer_parts:
                    answer_parts.append(f"In {month_name.title()}, these anomalies were detected:")
                    for _, row in month_data.head(5).iterrows():
                        answer_parts.append(
                            f"- {row['route']} (week {row['week_of']}): "
                            f"{row['pct_vs_own_history']:+.1f}% vs history. "
                            f"{row.get('reason', '')}"
                        )
                break

    if not answer_parts:
        # Generic response with available data
        if sources:
            answer_parts.append("Based on the context notes I found:")
            for s in sources:
                answer_parts.append(f"- **{s['note_id']}** ({s['date']}, {s['applies_to']}): {s['note_text']}")
        else:
            answer_parts.append("I couldn't find specific information to answer that question. "
                              "Try asking about a specific route or time period.")

    return {
        "answer": "\n".join(answer_parts),
        "sources": sources,
        "confidence": "high" if answer_parts else "low",
    }


def _llm_answer_question(question: str, sources: list, data_context: str, backend: str) -> dict:
    """Generate an answer using LLM."""
    notes_context = "\n".join(
        f"- {s['note_id']} ({s['date']}, {s['applies_to']}): {s['note_text']}"
        for s in sources
    )

    prompt = f"""Based on the following context notes and data, answer the user's question about freight costs.

CONTEXT NOTES:
{notes_context}
{data_context}

USER QUESTION: {question}

RULES:
- Only cite facts from the notes and data above
- If you don't have enough information, say so
- Be concise and specific"""

    try:
        if backend == "groq":
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            start_time = time.time()
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a freight cost analysis assistant. Answer questions based only on provided data and notes. Never make up information."},
                    {"role": "user", "content": prompt},
                ],
                temperature=LLM_TEMPERATURE,
                max_tokens=LLM_MAX_TOKENS,
            )
            elapsed = time.time() - start_time
            _track_cost(response.usage.prompt_tokens, response.usage.completion_tokens, GROQ_MODEL, elapsed)
            answer = response.choices[0].message.content

        elif backend == "ollama":
            import ollama
            start_time = time.time()
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are a freight cost analysis assistant. Answer questions based only on provided data and notes. Never make up information."},
                    {"role": "user", "content": prompt},
                ],
                options={"temperature": LLM_TEMPERATURE},
            )
            elapsed = time.time() - start_time
            _track_cost(response.get("prompt_eval_count", 0), response.get("eval_count", 0), OLLAMA_MODEL, elapsed, 0, 0)
            answer = response["message"]["content"]
        else:
            return _rule_based_answer(question, sources, data_context)

        return {
            "answer": answer,
            "sources": sources,
            "confidence": "high",
        }

    except Exception as e:
        print(f"[Reasoner] LLM error in QA: {e}")
        return _rule_based_answer(question, sources, data_context)
