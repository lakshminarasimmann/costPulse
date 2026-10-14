/**
 * API client for FreightTiger CostPulse assistant backend.
 */

const API_BASE = '/api';

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
  return res.json();
}

export async function fetchRoutes() {
  const res = await fetch(`${API_BASE}/routes`);
  if (!res.ok) throw new Error(`Failed to fetch routes: ${res.statusText}`);
  return res.json();
}

export async function fetchRouteTrend(route) {
  const res = await fetch(`${API_BASE}/routes/${encodeURIComponent(route)}/trend`);
  if (!res.ok) throw new Error(`Failed to fetch trend for ${route}: ${res.statusText}`);
  return res.json();
}

export async function fetchAnomalies(filters = {}) {
  const query = new URLSearchParams();
  if (filters.route) query.append('route', filters.route);
  if (filters.flagged) query.append('flagged', filters.flagged);
  if (filters.limit) query.append('limit', filters.limit);

  const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch anomalies: ${res.statusText}`);
  return res.json();
}

export async function fetchNotes() {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.statusText}`);
  return res.json();
}

export async function searchNotes(query, topK = 3) {
  const res = await fetch(`${API_BASE}/search-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK }),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  return res.json();
}

export async function sendChatMessage(question) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Chat error: ${res.statusText}`);
  return res.json();
}

export async function fetchEvalResults() {
  const res = await fetch(`${API_BASE}/eval/results`);
  if (!res.ok) throw new Error(`Failed to fetch eval results: ${res.statusText}`);
  return res.json();
}

export async function fetchReproducibility() {
  const res = await fetch(`${API_BASE}/eval/reproducibility`);
  if (!res.ok) throw new Error(`Failed to fetch reproducibility: ${res.statusText}`);
  return res.json();
}

export async function fetchCosts() {
  const res = await fetch(`${API_BASE}/eval/costs`);
  if (!res.ok) throw new Error(`Failed to fetch costs: ${res.statusText}`);
  return res.json();
}

export async function triggerPipelineRun() {
  const res = await fetch(`${API_BASE}/run-pipeline`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Pipeline run failed: ${res.statusText}`);
  return res.json();
}
