import React, { useState, useEffect } from 'react';
import { fetchRouteTrend } from '../api/client';
import CostTrendChart from '../components/Charts/CostTrendChart';
import WhatIfSimulator from '../components/Interactive/WhatIfSimulator';
import { MapPin, Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RouteDeepDive({ routes, selectedRoute, onSelectRoute }) {
  const [currentRoute, setCurrentRoute] = useState(selectedRoute || (routes && routes[0]?.route) || 'Ahmedabad-Mumbai');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRoute) {
      setCurrentRoute(selectedRoute);
    }
  }, [selectedRoute]);

  useEffect(() => {
    let isMounted = true;
    async function loadTrend() {
      if (!currentRoute) return;
      try {
        setLoading(true);
        const res = await fetchRouteTrend(currentRoute);
        if (isMounted) setTrendData(res);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTrend();
    return () => { isMounted = false; };
  }, [currentRoute]);

  const anomalies = trendData?.trend?.filter(t => t.is_anomaly) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Route Selector & Ribbon */}
      <div className="enterprise-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Corridor Focus
            </div>
            <select
              value={currentRoute}
              onChange={(e) => {
                setCurrentRoute(e.target.value);
                if (onSelectRoute) onSelectRoute(e.target.value);
              }}
              className="input-control"
              style={{ fontSize: '1.05rem', fontWeight: 700, padding: '6px 12px', marginTop: '2px', cursor: 'pointer' }}
            >
              {routes && routes.map(r => (
                <option key={r.route} value={r.route} style={{ background: '#141820', color: '#ffffff' }}>
                  {r.route} ({r.route_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Corridor Quick Metrics Ribbon */}
        {trendData && (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Haul Bucket</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{trendData.route_type} Haul</div>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Mean Unit Cost</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>₹{trendData.avg_cost?.toFixed(2)}/t-km</div>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Anomaly Breaches</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: trendData.anomaly_count > 0 ? 'var(--critical-text)' : 'var(--normal-text)', fontFamily: 'var(--font-mono)' }}>
                {trendData.anomaly_count} / {trendData.total_weeks} ({((trendData.anomaly_count / trendData.total_weeks) * 100).toFixed(1)}%)
              </div>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Verification Split</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--justified-text)', fontFamily: 'var(--font-mono)' }}>
                {trendData.justified_count} Justified | {trendData.unexplained_count} Review
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Area */}
      <div className="enterprise-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
          Corridor Rate Trajectory vs Dual Baselines
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Weekly unit cost (₹/tonne-km) evaluated against 8-week trailing rolling baselines (strictly prior) and same-haul peer averages.
        </p>

        {loading ? (
          <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading corridor telemetry...
          </div>
        ) : (
          trendData && <CostTrendChart data={trendData.trend} routeName={currentRoute} height={360} />
        )}
      </div>

      {/* Interactive What-If Scenario Simulator Component */}
      <WhatIfSimulator
        selectedRoute={currentRoute}
        routes={routes}
      />

      {/* Corridor Flagged Events Audit Log */}
      <div className="enterprise-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Corridor Breach Audit Log ({anomalies.length} Flagged Weeks)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Specific calendar weeks where this corridor breached own-history (&gt;10%) or peer-group (&gt;15%) thresholds.
            </p>
          </div>
        </div>

        {anomalies.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--normal-text)', background: 'var(--normal-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--normal-border)', fontSize: '0.82rem' }}>
            No cost anomalies recorded on this corridor. Rates remain within statistical threshold tolerances.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week Of (Monday)</th>
                  <th>Unit Rate</th>
                  <th>vs Own 8-Wk</th>
                  <th>vs Peer Routes</th>
                  <th>Audit Verdict</th>
                  <th>Note Citation</th>
                  <th>Root Cause Reason</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, idx) => {
                  const isJustified = a.flagged === 'No (justified)';
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {a.week_of}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        ₹{a.cost_per_tonne_km?.toFixed(2)}
                      </td>
                      <td style={{ color: a.pct_vs_own_history > 10 ? 'var(--critical-text)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {a.pct_vs_own_history ? `${a.pct_vs_own_history > 0 ? '+' : ''}${a.pct_vs_own_history.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ color: a.pct_vs_similar_routes > 15 ? 'var(--critical-text)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {a.pct_vs_similar_routes ? `${a.pct_vs_similar_routes > 0 ? '+' : ''}${a.pct_vs_similar_routes.toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isJustified ? 'badge-justified' : 'badge-critical'}`}>
                          {isJustified ? 'No (justified)' : 'Yes (Review)'}
                        </span>
                      </td>
                      <td>
                        {a.matched_note_id ? (
                          <span className="badge badge-brand">{a.matched_note_id}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                        {a.reason || 'No explanation recorded'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
