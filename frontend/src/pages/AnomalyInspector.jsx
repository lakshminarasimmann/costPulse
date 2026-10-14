import React, { useState, useEffect, useMemo } from 'react';
import { fetchAnomalies } from '../api/client';
import { Search, Download, ChevronDown, ChevronRight, SlidersHorizontal, Eye, ExternalLink, Filter } from 'lucide-react';

export default function AnomalyInspector({ routes, onSelectRoute, onInspectAnomaly }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('anomalies_only'); // 'all', 'anomalies_only', 'unexplained', 'justified'
  const [selectedRoute, setSelectedRoute] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchAnomalies({ limit: 1000 });
        if (isMounted) setData(res.rows || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return data.filter(row => {
      // Verdict filter
      if (filterType === 'anomalies_only' && !row.is_anomaly) return false;
      if (filterType === 'unexplained' && row.flagged !== 'Yes') return false;
      if (filterType === 'justified' && row.flagged !== 'No (justified)') return false;
      if (filterType === 'normal' && row.is_anomaly) return false;

      // Route filter
      if (selectedRoute && row.route !== selectedRoute) return false;

      // Text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesRoute = row.route?.toLowerCase().includes(q);
        const matchesDate = row.week_of?.toLowerCase().includes(q);
        const matchesReason = row.reason?.toLowerCase().includes(q);
        const matchesNote = row.matched_note_id?.toLowerCase().includes(q);
        if (!matchesRoute && !matchesDate && !matchesReason && !matchesNote) return false;
      }

      return true;
    });
  }, [data, filterType, selectedRoute, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Controls */}
      <div className="enterprise-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Anomaly Inspector & Audit Log</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Complete record matching output CSV format: unit cost, dual-baseline percentage deviations, and plain-English root causes.
            </p>
          </div>

          <a
            href="/api/export"
            download="anomaly_report.csv"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export CSV (728 Rows)</span>
          </a>
        </div>

        {/* Filter Pills & Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('anomalies_only')}
              className={`btn btn-sm ${filterType === 'anomalies_only' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Breaches ({data.filter(d => d.is_anomaly).length})
            </button>
            <button
              onClick={() => setFilterType('unexplained')}
              className={`btn btn-sm ${filterType === 'unexplained' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ color: filterType === 'unexplained' ? '#ffffff' : 'var(--critical-text)' }}
            >
              Unexplained Review ({data.filter(d => d.flagged === 'Yes').length})
            </button>
            <button
              onClick={() => setFilterType('justified')}
              className={`btn btn-sm ${filterType === 'justified' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ color: filterType === 'justified' ? '#ffffff' : 'var(--justified-text)' }}
            >
              Verified Justified ({data.filter(d => d.flagged === 'No (justified)').length})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All 728 Records
            </button>
          </div>

          {/* Search and Route Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search route, date, note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '30px', fontSize: '0.8rem', width: '220px' }}
              />
            </div>

            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="input-control"
              style={{ fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="">All 7 Corridors</option>
              {routes && routes.map(r => (
                <option key={r.route} value={r.route}>{r.route}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="enterprise-card data-table-wrapper" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredRows.length}</strong> matching corridor records • Click any row or "Inspect" to open full audit drawer
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Thresholds: &gt;10% Trailing | &gt;15% Peers
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '32px' }}></th>
              <th>Corridor</th>
              <th>Week Of</th>
              <th>Unit Rate</th>
              <th>vs Own 8-Wk</th>
              <th>vs Peer Group</th>
              <th>Flagged</th>
              <th>Note</th>
              <th>Root Cause Reasoning</th>
              <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading corridor records...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No records match current filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const isExpanded = expandedRow === idx;
                const isJustified = row.flagged === 'No (justified)';
                const isUnexplained = row.flagged === 'Yes';

                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      style={{ cursor: 'pointer', background: isExpanded ? 'var(--bg-surface-hover)' : 'transparent' }}
                      className="table-row-hover"
                    >
                      <td style={{ color: 'var(--text-dim)' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.route}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {row.week_of}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        ₹{row.cost_per_tonne_km?.toFixed(2)}
                      </td>
                      <td style={{
                        color: row.pct_vs_own_history > 10 ? 'var(--critical-text)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem'
                      }}>
                        {row.vs_own_history || '—'}
                      </td>
                      <td style={{
                        color: row.pct_vs_similar_routes > 15 ? 'var(--critical-text)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem'
                      }}>
                        {row.vs_similar_routes || '—'}
                      </td>
                      <td>
                        {isUnexplained ? (
                          <span className="badge badge-critical">Yes</span>
                        ) : isJustified ? (
                          <span className="badge badge-justified">No (justified)</span>
                        ) : (
                          <span className="badge badge-neutral">No</span>
                        )}
                      </td>
                      <td>
                        {row.matched_note_id ? (
                          <span className="badge badge-brand">{row.matched_note_id}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{
                        fontSize: '0.78rem',
                        color: isUnexplained ? 'var(--critical-text)' : isJustified ? 'var(--justified-text)' : 'var(--text-dim)',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {row.reason || 'Normal baseline'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onInspectAnomaly) {
                              onInspectAnomaly({
                                route: row.route,
                                route_type: row.route_type,
                                week_of: row.week_of,
                                actual_cost: row.cost_per_tonne_km,
                                trailing_avg: row.trailing_avg,
                                pct_change_vs_trailing: row.pct_vs_own_history,
                                peer_avg: row.peer_avg,
                                pct_change_vs_peers: row.pct_vs_similar_routes,
                                justification: row.reason,
                                flagged: row.flagged
                              });
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                          title="Open full interactive audit slip"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Detail View */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="10" style={{ background: 'var(--bg-app)', padding: '16px 20px', borderBottom: '1px solid var(--border-medium)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>BASELINE DRILLDOWN</div>
                              <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div>Trailing 8-Wk Mean: <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{row.trailing_avg?.toFixed(2) || 'N/A'}</strong></div>
                                <div>Variance vs History: <strong style={{ color: row.pct_vs_own_history > 10 ? 'var(--critical-text)' : 'var(--normal-text)', fontFamily: 'var(--font-mono)' }}>{row.pct_vs_own_history ? `${row.pct_vs_own_history > 0 ? '+' : ''}${row.pct_vs_own_history.toFixed(1)}%` : '—'}</strong></div>
                                <div>Peer Group Mean: <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{row.peer_avg?.toFixed(2) || 'N/A'}</strong></div>
                                <div>Variance vs Peers: <strong style={{ color: row.pct_vs_similar_routes > 15 ? 'var(--critical-text)' : 'var(--normal-text)', fontFamily: 'var(--font-mono)' }}>{row.pct_vs_similar_routes ? `${row.pct_vs_similar_routes > 0 ? '+' : ''}${row.pct_vs_similar_routes.toFixed(1)}%` : '—'}</strong></div>
                              </div>
                            </div>

                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>CORRIDOR LOAD STATS</div>
                              <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div>Haul Category: <strong>{row.route_type}</strong></div>
                                <div>Weekly Trip Count: <strong style={{ fontFamily: 'var(--font-mono)' }}>{row.shipment_count} shipments</strong></div>
                                <div>Flagged Anomaly: <strong style={{ color: row.is_anomaly ? 'var(--critical-text)' : 'var(--normal-text)' }}>{row.is_anomaly ? 'YES (Breached Threshold)' : 'NO'}</strong></div>
                              </div>
                            </div>

                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>EXPLANATION AUDIT</div>
                              <p style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                {row.reason || 'Cost is consistent with both historical corridor baselines and peer corridors.'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
