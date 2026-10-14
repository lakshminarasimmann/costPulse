import React from 'react';

export default function AnomalyGauge({ justified = 0, unexplained = 0, total = 728, size = 160 }) {
  const anomalies = justified + unexplained;
  const normal = Math.max(0, total - anomalies);
  const anomalyRate = total > 0 ? ((anomalies / total) * 100).toFixed(1) : 0;

  // Donut geometry
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segment ratios
  const normalRatio = total > 0 ? normal / total : 1;
  const justifiedRatio = total > 0 ? justified / total : 0;
  const unexplainedRatio = total > 0 ? unexplained / total : 0;

  const normalStroke = normalRatio * circumference;
  const justifiedStroke = justifiedRatio * circumference;
  const unexplainedStroke = unexplainedRatio * circumference;

  const normalOffset = 0;
  const justifiedOffset = -normalStroke;
  const unexplainedOffset = -(normalStroke + justifiedStroke);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Normal weeks (emerald) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--normal)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${normalStroke} ${circumference}`}
            strokeDashoffset={normalOffset}
            opacity="0.85"
          />
          {/* Justified anomalies (amber) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--justified)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${justifiedStroke} ${circumference}`}
            strokeDashoffset={justifiedOffset}
          />
          {/* Unexplained anomalies (crimson) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--critical)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${unexplainedStroke} ${circumference}`}
            strokeDashoffset={unexplainedOffset}
          />
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {anomalyRate}%
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Breach Rate
          </span>
        </div>
      </div>

      {/* Legend underneath */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '14px', fontSize: '0.72rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--normal)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Normal ({normal})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--justified)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Justified ({justified})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--critical)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Review ({unexplained})</span>
        </div>
      </div>
    </div>
  );
}
