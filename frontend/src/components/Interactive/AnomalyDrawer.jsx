import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Copy, Check, FileText, ArrowRight, ShieldAlert, Truck } from 'lucide-react';
import TruckIcon from '../Layout/TruckIcon';

export default function AnomalyDrawer({ anomaly, onClose, onSelectRoute }) {
  const [copied, setCopied] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  if (!anomaly) return null;

  const isJustified = anomaly.justification && 
    !anomaly.justification.toLowerCase().includes('unexplained') && 
    !anomaly.justification.toLowerCase().includes('no valid context');

  const handleCopy = () => {
    const text = `Freight Corridor Anomaly Audit:
Route: ${anomaly.route} (${anomaly.route_type})
Week: ${anomaly.week_of}
Actual Rate: ₹${Number(anomaly.actual_cost).toFixed(2)} / tonne-km
Trailing Baseline: ₹${anomaly.trailing_avg ? Number(anomaly.trailing_avg).toFixed(2) : 'N/A'} (${anomaly.pct_change_vs_trailing ? (Number(anomaly.pct_change_vs_trailing) > 0 ? '+' : '') + Number(anomaly.pct_change_vs_trailing).toFixed(1) + '%' : 'N/A'})
Peer Baseline: ₹${anomaly.peer_avg ? Number(anomaly.peer_avg).toFixed(2) : 'N/A'} (${anomaly.pct_change_vs_peers ? (Number(anomaly.pct_change_vs_peers) > 0 ? '+' : '') + Number(anomaly.pct_change_vs_peers).toFixed(1) + '%' : 'N/A'})
Status: ${isJustified ? 'Verified Operational Disruption' : 'Unexplained Rate Creep'}
Explanation: ${anomaly.justification || 'Unexplained rate creep. No operational context note matches.'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '460px',
      maxWidth: '92vw',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-default)',
      boxShadow: '-10px 0 35px rgba(0,0,0,0.6)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TruckIcon size={30} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              Corridor Audit Slip
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Week of {anomaly.week_of}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          className="btn-icon-hover"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Route Card */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              {anomaly.route}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--brand)',
              border: '1px solid var(--border-default)',
              fontFamily: 'var(--font-mono)'
            }}>
              {anomaly.route_type} Haul
            </span>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            Unit cost calculation: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>freight_cost_inr / (tonnes × km)</code>
          </div>
        </div>

        {/* Rate Comparison Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{
            padding: '14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Actual Unit Rate
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff', marginTop: '4px' }}>
              ₹{Number(anomaly.actual_cost).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              INR per tonne-km
            </div>
          </div>

          <div style={{
            padding: '14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Audit Classification
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: isJustified ? 'var(--normal-bg)' : 'var(--critical-bg)',
              color: isJustified ? 'var(--normal-text)' : 'var(--critical-text)',
              border: `1px solid ${isJustified ? 'var(--normal-border)' : 'var(--critical-border)'}`
            }}>
              {isJustified ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {isJustified ? 'Verified Disruption' : 'Unexplained Creep'}
            </div>
          </div>
        </div>

        {/* Dual-Baseline Comparison Card */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Dual-Baseline Benchmark Analysis
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>Trailing 8-Week Baseline</span>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Historical corridor baseline (strictly prior)</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand)' }}>
                  ₹{anomaly.trailing_avg ? Number(anomaly.trailing_avg).toFixed(2) : 'N/A'}
                </span>
                {anomaly.pct_change_vs_trailing !== null && (
                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: Number(anomaly.pct_change_vs_trailing) > 10 ? 'var(--critical-text)' : 'var(--text-secondary)'
                  }}>
                    {Number(anomaly.pct_change_vs_trailing) > 0 ? '+' : ''}{Number(anomaly.pct_change_vs_trailing).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>Peer Cohort Baseline</span>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Same-haul type ({anomaly.route_type}) in week</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
                  ₹{anomaly.peer_avg ? Number(anomaly.peer_avg).toFixed(2) : 'N/A'}
                </span>
                {anomaly.pct_change_vs_peers !== null && (
                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: Number(anomaly.pct_change_vs_peers) > 15 ? 'var(--critical-text)' : 'var(--text-secondary)'
                  }}>
                    {Number(anomaly.pct_change_vs_peers) > 0 ? '+' : ''}{Number(anomaly.pct_change_vs_peers).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Justification / Explanation */}
        <div style={{
          padding: '16px',
          background: isJustified ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isJustified ? 'var(--normal-border)' : 'var(--critical-border)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FileText size={15} color={isJustified ? 'var(--normal)' : 'var(--critical)'} />
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: isJustified ? 'var(--normal-text)' : 'var(--critical-text)', textTransform: 'uppercase' }}>
              Semantic RAG Audit Trace
            </h4>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '8px' }}>
            {anomaly.justification || 'Unexplained rate creep. No operational context note matches.'}
          </p>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>RAG Filter:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {isJustified ? 'Temporal ±14d Match • Corridor Verified' : 'Corridor / Temporal Pre-Filter Rejection'}
            </span>
          </div>
        </div>

        {/* Interactive Procurement Action */}
        <div style={{
          padding: '14px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#ffffff' }}>
              Procurement Audit Tag
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {reviewed ? 'Marked as Reviewed' : 'Pending Procurement Audit'}
            </div>
          </div>

          <button
            onClick={() => setReviewed(!reviewed)}
            className={reviewed ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {reviewed ? <Check size={12} /> : null}
            <span>{reviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
          </button>
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          onClick={handleCopy}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {copied ? <Check size={14} color="var(--normal)" /> : <Copy size={14} />}
          <span>{copied ? 'Audit Copied!' : 'Copy Audit Slip'}</span>
        </button>

        {onSelectRoute && (
          <button
            onClick={() => {
              onSelectRoute(anomaly.route);
              onClose();
            }}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span>Deep Dive Corridor</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
