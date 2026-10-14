import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import AnomalyGauge from '../components/Charts/AnomalyGauge';
import CorridorNetworkMap from '../components/Interactive/CorridorNetworkMap';

export default function CommandCenter({ summary, routes, onSelectRoute, onInspectAnomaly }) {
  if (!summary) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading network metrics...</div>;
  }

  const stats = [
    {
      label: 'Shipment Volume',
      value: '2,940',
      sub: '7 Core Corridors (2024-2025)',
      icon: Package,
      badge: '100% Ingested'
    },
    {
      label: 'Monitored Route-Weeks',
      value: summary.total_route_weeks || 728,
      sub: '104 Weeks × 7 Routes',
      icon: TrendingUp,
      badge: '8-Wk Baselines'
    },
    {
      label: 'Breached Anomalies',
      value: summary.total_anomalies || 27,
      sub: `${summary.anomaly_rate}% Exceeded Thresholds`,
      icon: AlertTriangle,
      badge: '>10% or >15%',
      isAlert: true
    },
    {
      label: 'RAG Verified Justified',
      value: summary.justified_count || 5,
      sub: 'Floods, Fuel, Surcharges',
      icon: CheckCircle2,
      badge: 'Validated'
    },
    {
      label: 'Unexplained (Audit Review)',
      value: summary.unexplained_count || 22,
      sub: 'Procurement Action Required',
      icon: HelpCircle,
      badge: 'Actionable',
      isWarning: true
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Enterprise KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="enterprise-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: s.isAlert ? 'var(--critical-bg)' : s.isWarning ? 'var(--justified-bg)' : 'var(--bg-surface-elevated)',
                  color: s.isAlert ? 'var(--critical-text)' : s.isWarning ? 'var(--justified-text)' : 'var(--text-secondary)',
                  border: `1px solid ${s.isAlert ? 'var(--critical-border)' : s.isWarning ? 'var(--justified-border)' : 'var(--border-subtle)'}`,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {s.badge}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {s.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive National Freight Corridor Network Map Schematic */}
      <CorridorNetworkMap
        routes={routes}
        selectedRoute="Ahmedabad-Mumbai"
        onSelectRoute={onSelectRoute}
      />

      {/* Main Grid: Corridor Health Grid + Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left Column: Corridor Health Overview */}
        <div className="enterprise-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Corridor Health & Volatility Matrix</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                7 monitored freight corridors categorized by haul length and anomaly frequency
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Click corridor to inspect deep dive
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {routes && routes.map((r) => {
              const hasCritical = r.unexplained > 0;
              return (
                <div
                  key={r.route}
                  onClick={() => onSelectRoute(r.route)}
                  className="enterprise-card enterprise-card-interactive"
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-app)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {r.route}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {r.route_type} Haul
                      </span>
                    </div>
                    <span className={`badge ${hasCritical ? 'badge-critical' : r.justified > 0 ? 'badge-justified' : 'badge-normal'}`}>
                      {hasCritical ? `${r.unexplained} Review` : r.justified > 0 ? 'Justified' : 'Normal'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Avg Unit Rate</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        ₹{r.avg_cost?.toFixed(2)}<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>/t-km</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Anomaly Rate</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: hasCritical ? 'var(--critical-text)' : 'var(--normal-text)', fontFamily: 'var(--font-mono)' }}>
                        {r.anomaly_rate}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Anomaly Distribution & Detection Logic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Anomaly Gauge */}
          <div className="enterprise-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '14px', alignSelf: 'flex-start' }}>
              Anomaly Severity Breakdown
            </h4>
            <AnomalyGauge
              justified={summary.justified_count || 5}
              unexplained={summary.unexplained_count || 22}
              total={summary.total_route_weeks || 728}
              size={170}
            />
          </div>

          {/* Operational Methodology Callout */}
          <div className="enterprise-card" style={{ padding: '18px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={16} color="var(--brand)" />
              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Dual-Baseline Audit Logic</h5>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              A corridor-week is flagged if cost exceeds <strong>&gt;10%</strong> over its own 8-week trailing rolling baseline, or <strong>&gt;15%</strong> over same-haul peer corridors during that exact week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
