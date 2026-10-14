import React, { useState, useMemo } from 'react';

export default function CostTrendChart({ data, routeName, height = 360 }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Filter valid data points
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      ...d,
      index: i,
      actual: d.cost_per_tonne_km,
      trailing: d.trailing_avg,
      peer: d.peer_avg,
    }));
  }, [data]);

  if (points.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        No corridor telemetry available.
      </div>
    );
  }

  // Calculate SVG bounds
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const width = 900;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Find min and max for scaling
  const allValues = points.flatMap(p => [p.actual, p.trailing, p.peer].filter(v => v !== null && v !== undefined && !isNaN(v)));
  const minVal = Math.max(0, Math.min(...allValues) * 0.9);
  const maxVal = Math.max(...allValues) * 1.1;

  const getX = (idx) => padding.left + (idx / (points.length - 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;

  // Build SVG path strings
  const buildPath = (key) => {
    const valid = points.filter(p => p[key] !== null && p[key] !== undefined && !isNaN(p[key]));
    if (valid.length === 0) return '';
    return valid.reduce((acc, p, i) => {
      const x = getX(p.index);
      const y = getY(p[key]);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const actualPath = buildPath('actual');
  const trailingPath = buildPath('trailing');
  const peerPath = buildPath('peer');

  // Subtle clean area under actual path
  const areaPath = actualPath
    ? `${actualPath} L ${getX(points.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`
    : '';

  // Anomaly points
  const anomalyPoints = points.filter(p => p.is_anomaly);

  // Y-axis grid ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => minVal + ratio * (maxVal - minVal));

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{routeName}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>({points.length} consecutive weeks)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.72rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2.5px', background: '#f8fafc', borderRadius: '1px' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Actual Rate (₹/t-km)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed var(--brand)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>8-Wk Trailing Baseline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dotted #94a3b8' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Same-Haul Peer Avg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--critical-text)' }} />
            <span style={{ color: 'var(--critical-text)', fontWeight: 600 }}>Threshold Breach</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="actualGradientClean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e57324" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e57324" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="#1e2430"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="var(--text-dim)"
                fontSize="11"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                ₹{val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#actualGradientClean)" />

        {/* Peer group baseline */}
        <path
          d={peerPath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.8"
          strokeDasharray="3 3"
          opacity="0.75"
        />

        {/* Trailing rolling baseline */}
        <path
          d={trailingPath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.9"
        />

        {/* Actual rate line */}
        <path
          d={actualPath}
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2.2"
        />

        {/* Anomaly markers */}
        {anomalyPoints.map((p, i) => {
          const cx = getX(p.index);
          const cy = getY(p.actual);
          const isJustified = p.flagged === 'No (justified)';
          const color = isJustified ? 'var(--justified-text)' : 'var(--critical-text)';
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r="4.5"
                fill={color}
                stroke="#0b0d11"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Interactive hover crosshair */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + innerHeight}
              stroke="#475569"
              strokeDasharray="2 2"
            />
            {points[hoverIndex].actual && (
              <circle
                cx={getX(hoverIndex)}
                cy={getY(points[hoverIndex].actual)}
                r="5"
                fill="#ffffff"
                stroke="var(--brand)"
                strokeWidth="2"
              />
            )}
          </g>
        )}

        {/* Transparent mouse detection rects */}
        {points.map((p, idx) => {
          const sliceWidth = innerWidth / points.length;
          const x = getX(idx) - sliceWidth / 2;
          return (
            <rect
              key={idx}
              x={x}
              y={padding.top}
              width={sliceWidth}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(idx)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

        {/* X-axis time ticks */}
        {points.map((p, idx) => {
          if (idx % 12 !== 0 && idx !== points.length - 1) return null;
          return (
            <text
              key={idx}
              x={getX(idx)}
              y={padding.top + innerHeight + 18}
              fill="var(--text-dim)"
              fontSize="11"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {p.week_of}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-elevated)',
          zIndex: 10,
          minWidth: '220px',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Week of {hoveredPoint.week_of}
            </span>
            {hoveredPoint.is_anomaly && (
              <span className={`badge ${hoveredPoint.flagged === 'No (justified)' ? 'badge-justified' : 'badge-critical'}`}>
                {hoveredPoint.flagged === 'No (justified)' ? 'Justified' : 'Flagged'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actual Rate:</span>
              <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>₹{hoveredPoint.actual?.toFixed(2)}/t-km</strong>
            </div>
            {hoveredPoint.trailing && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trailing 8-Wk:</span>
                <span style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                  ₹{hoveredPoint.trailing?.toFixed(2)} ({hoveredPoint.pct_vs_own_history > 0 ? '+' : ''}{hoveredPoint.pct_vs_own_history?.toFixed(1)}%)
                </span>
              </div>
            )}
            {hoveredPoint.peer && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peer Group:</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  ₹{hoveredPoint.peer?.toFixed(2)} ({hoveredPoint.pct_vs_similar_routes > 0 ? '+' : ''}{hoveredPoint.pct_vs_similar_routes?.toFixed(1)}%)
                </span>
              </div>
            )}
            {hoveredPoint.matched_note_id && (
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', color: 'var(--justified-text)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                Matched Note: {hoveredPoint.matched_note_id}
              </div>
            )}
            {hoveredPoint.reason && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px', lineHeight: 1.3 }}>
                {hoveredPoint.reason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
