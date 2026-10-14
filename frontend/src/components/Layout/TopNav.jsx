import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Layers,
  ChevronDown,
  Activity,
  Sliders,
  ExternalLink
} from 'lucide-react';
import TruckIcon from './TruckIcon';
import { triggerPipelineRun } from '../../api/client';

export default function TopNav({ activeTab, setActiveTab, summary, routes = [], onSelectRoute, onRefresh }) {
  const [running, setRunning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);

  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'route-dive', label: 'Corridor Deep Dive', icon: TrendingUp, meta: '7 Routes' },
    { id: 'anomalies', label: 'Anomaly Inspector', icon: AlertTriangle, count: summary?.unexplained_count || 22, alert: true },
    { id: 'context-notes', label: 'Operational Context', icon: FileText, meta: '10 Notes' },
    { id: 'chat-assistant', label: 'Freight Assistant', icon: MessageSquare },
    { id: 'system-trust', label: 'Trust & Verification', icon: CheckCircle2, meta: '10/10' },
  ];

  const handleRunPipeline = async () => {
    try {
      setRunning(true);
      setSuccessMsg('');
      await triggerPipelineRun();
      setSuccessMsg('Pipeline re-computed!');
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to trigger pipeline run.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <header className="top-nav-master" style={{
      width: '100%',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
    }}>
      {/* Upper Tier: Branding + Symbol + Telemetry + Global Actions */}
      <div style={{
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '20px'
      }}>
        {/* Left: Truck Design Symbol + FreightTiger Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            onClick={() => setActiveTab('command-center')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s ease'
            }}
            className="brand-hover"
          >
            {/* The Truck Design Symbol */}
            <div style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #1e2430 0%, #141820 100%)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TruckIcon size={42} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-heading)', 
                  fontWeight: 800, 
                  fontSize: '1.2rem', 
                  color: '#ffffff', 
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  FreightTiger
                  <span style={{ 
                    fontSize: '0.62rem', 
                    background: 'var(--brand)', 
                    color: '#ffffff', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    CostPulse
                  </span>
                </span>
              </div>
              <p style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-muted)', 
                fontWeight: 600, 
                letterSpacing: '0.05em', 
                textTransform: 'uppercase',
                marginTop: '1px'
              }}>
                Smart Shipping Cost Assistant • Autonomous Corridor Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Indicator Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'var(--bg-surface)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--normal)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ color: 'var(--normal-text)', fontWeight: 600 }}>
              Telemetry Active
            </span>
          </div>
          <span style={{ color: 'var(--border-default)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>728</strong> route-weeks
          </span>
          <span style={{ color: 'var(--border-default)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>
            8-week lookback baselines
          </span>
        </div>

        {/* Right: Quick Actions (Export CSV + Re-Run Pipeline) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {successMsg && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--normal-text)',
              background: 'var(--normal-bg)',
              border: '1px solid var(--normal-border)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease'
            }}>
              <CheckCircle2 size={13} />
              {successMsg}
            </span>
          )}

          {/* Export CSV button */}
          <a
            href="/api/export"
            download="anomaly_report.csv"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download target 728-row anomaly report CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>

          {/* Re-Run Pipeline button */}
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="btn btn-primary btn-sm"
            style={{ 
              opacity: running ? 0.7 : 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              boxShadow: '0 2px 8px rgba(229, 115, 36, 0.3)'
            }}
            title="Execute complete analytics, baselines, and RAG reasoning pipeline"
          >
            <RefreshCw size={14} className={running ? 'spin-animation' : ''} />
            <span>{running ? 'Re-Computing Pipeline...' : 'Re-Run Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Lower Tier: Vertically Stacked Clickable Navigation Bar */}
      <div style={{
        padding: '6px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-app)',
        overflowX: 'auto',
        gap: '8px'
      }}>
        {/* Clickable Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`top-nav-tab ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid transparent',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--brand)' : 'var(--text-muted)'} />
                <span>{item.label}</span>

                {/* Badge Counts */}
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
                    color: isActive ? 'var(--brand-hover)' : 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: isActive ? 'rgba(229,115,36,0.1)' : 'var(--bg-surface)'
                  }}>
                    {item.meta}
                  </span>
                )}

                {/* Active Indicator Bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '12px',
                    right: '12px',
                    height: '2px',
                    background: 'var(--brand)',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px rgba(229,115,36,0.6)'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Info: Case study tag & quick corridor jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRouteMenuOpen(!routeMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
              title="Jump directly to any of the 7 Indian freight corridors"
            >
              <Layers size={13} color="var(--brand)" />
              <span>Corridor Switcher</span>
              <ChevronDown size={12} />
            </button>

            {/* Corridor Switcher Dropdown */}
            {routeMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  minWidth: '220px',
                  zIndex: 100,
                  padding: '6px 0'
                }}
              >
                <div style={{ padding: '6px 12px', fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Select Freight Corridor
                </div>
                {routes && routes.length > 0 ? (
                  routes.map((r) => (
                    <button
                      key={r.route}
                      onClick={() => {
                        if (onSelectRoute) onSelectRoute(r.route);
                        setActiveTab('route-dive');
                        setRouteMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      className="dropdown-item-hover"
                    >
                      <span>{r.route}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {r.route_type}
                      </span>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Loading corridors...
                  </div>
                )}
              </div>
            )}
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            FreightTiger Case Study <span style={{ color: 'var(--brand)', fontWeight: 600 }}>v2.4.0</span>
          </span>
        </div>
      </div>

      <style>{`
        .brand-hover:hover {
          background: rgba(255,255,255,0.03);
        }
        .top-nav-tab:hover {
          color: #ffffff !important;
          background: var(--bg-surface) !important;
        }
        .dropdown-item-hover:hover {
          background: var(--bg-surface) !important;
          color: var(--brand) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </header>
  );
}
