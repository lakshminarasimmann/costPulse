import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { triggerPipelineRun } from '../../api/client';

export default function Header({ activeTab, summary, onRefresh }) {
  const [running, setRunning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const titles = {
    'command-center': {
      title: 'Command Center',
      subtitle: 'Corridor rate volatility, peer group variance, and anomaly tracking across 7 Indian freight corridors'
    },
    'route-dive': {
      title: 'Corridor Deep Dive',
      subtitle: 'Granular ₹/tonne-km progression vs 8-week trailing rolling baselines and same-haul peer averages'
    },
    'anomalies': {
      title: 'Anomaly Inspector',
      subtitle: 'Audited log of threshold breaches, dual-baseline percentage deltas, and plain-English root causes'
    },
    'context-notes': {
      title: 'Operational Context & Note Verification',
      subtitle: 'Deterministic 4-stage filter and dense vector retrieval matching rate spikes to verified ground truth'
    },
    'chat-assistant': {
      title: 'Freight Rate Assistant',
      subtitle: 'Natural language analytical inquiries cross-referencing route telemetry and verified context'
    },
    'system-trust': {
      title: 'Trust & Verification Matrix',
      subtitle: '10-test golden evaluation harness, multi-run byte diff checker, and zero-cost telemetry'
    }
  };

  const current = titles[activeTab] || titles['command-center'];

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
    <header style={{
      padding: '16px 28px',
      background: 'var(--bg-app)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 15
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {current.title}
          </h1>
          {successMsg && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              color: 'var(--normal-text)',
              background: 'var(--normal-bg)',
              border: '1px solid var(--normal-border)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              fontWeight: 600
            }}>
              <CheckCircle2 size={12} />
              {successMsg}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {current.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Export CSV button */}
        <a
          href="/api/export"
          download="anomaly_report.csv"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <Download size={14} />
          <span>Export CSV</span>
        </a>

        {/* Re-Run Pipeline button */}
        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="btn btn-primary btn-sm"
          style={{ opacity: running ? 0.7 : 1 }}
        >
          <RefreshCw size={14} className={running ? 'spin-animation' : ''} />
          <span>{running ? 'Re-Computing...' : 'Re-Run Pipeline'}</span>
        </button>
      </div>

      <style>{`
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
