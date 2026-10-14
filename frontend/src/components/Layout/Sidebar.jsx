import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Truck,
  ArrowUpRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, summary }) {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'route-dive', label: 'Corridor Deep Dive', icon: TrendingUp, meta: '7 Routes' },
    { id: 'anomalies', label: 'Anomaly Inspector', icon: AlertTriangle, count: summary?.unexplained_count || 22, alert: true },
    { id: 'context-notes', label: 'Operational Context', icon: FileText, meta: '10 Notes' },
    { id: 'chat-assistant', label: 'Freight Assistant', icon: MessageSquare },
    { id: 'system-trust', label: 'Trust & Verification', icon: CheckCircle2, meta: '10/10' },
  ];

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)',
            flexShrink: 0
          }}>
            FT
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                FreightTiger
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Cost Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '16px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px 8px' }}>
          Corridor Analytics
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                outline: 'none',
                borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color={isActive ? 'var(--brand)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 500 }}>
                  {item.label}
                </span>
              </div>
              {item.count !== undefined && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: 'var(--critical-bg)',
                  color: 'var(--critical-text)',
                  border: '1px solid var(--critical-border)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {item.count}
                </span>
              )}
              {item.meta && !item.count && (
                <span style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Corridor System Status Card */}
      <div style={{ padding: '14px 16px', margin: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Network Telemetry</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--normal-text)', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--normal)' }} />
            Active
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          728 route-weeks verified against 8-week lookback baselines.
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          24-Hour Case Study
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          v2.4.0
        </span>
      </div>
    </aside>
  );
}
