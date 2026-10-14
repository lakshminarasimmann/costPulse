import React, { useState } from 'react';
import { MapPin, Navigation, ArrowRight, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export default function CorridorNetworkMap({ routes = [], selectedRoute, onSelectRoute }) {
  const [hoveredRoute, setHoveredRoute] = useState(null);

  // Network topology nodes with relative coordinates on India map schematic
  const nodes = {
    'Delhi': { x: 38, y: 22, name: 'Delhi NCR' },
    'Jaipur': { x: 33, y: 30, name: 'Jaipur' },
    'Ahmedabad': { x: 24, y: 44, name: 'Ahmedabad' },
    'Mumbai': { x: 26, y: 58, name: 'Mumbai' },
    'Pune': { x: 30, y: 64, name: 'Pune' },
    'Kolkata': { x: 74, y: 44, name: 'Kolkata' },
    'Bhubaneswar': { x: 70, y: 56, name: 'Bhubaneswar' },
    'Bangalore': { x: 42, y: 82, name: 'Bangalore' },
    'Chennai': { x: 50, y: 80, name: 'Chennai' },
  };

  const corridorLinks = [
    { id: 'Mumbai-Pune', from: 'Mumbai', to: 'Pune', type: 'Short', dist: '150 km' },
    { id: 'Ahmedabad-Mumbai', from: 'Ahmedabad', to: 'Mumbai', type: 'Medium', dist: '530 km' },
    { id: 'Delhi-Jaipur', from: 'Delhi', to: 'Jaipur', type: 'Short', dist: '280 km' },
    { id: 'Kolkata-Bhubaneswar', from: 'Kolkata', to: 'Bhubaneswar', type: 'Short', dist: '440 km' },
    { id: 'Chennai-Bangalore', from: 'Chennai', to: 'Bangalore', type: 'Short', dist: '350 km' },
    { id: 'Mumbai-Delhi', from: 'Mumbai', to: 'Delhi', type: 'Long', dist: '1,420 km' },
    { id: 'Delhi-Chennai', from: 'Delhi', to: 'Chennai', type: 'Long', dist: '2,200 km' },
  ];

  return (
    <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} color="var(--brand)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              National Freight Corridor Network
            </h3>
            <span style={{ 
              fontSize: '0.68rem', 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-default)',
              color: 'var(--brand)', 
              padding: '2px 8px', 
              borderRadius: '12px',
              fontWeight: 600
            }}>
              Interactive Schematic
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Click any corridor or hub to switch analytics and inspect historical baselines
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '2px', background: 'var(--normal)' }} /> Short (&lt;500km)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '2px', background: 'var(--brand)' }} /> Medium (500-1000km)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '2px', background: '#38bdf8' }} /> Long (&gt;1000km)
          </span>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)', 
        gap: '20px', 
        alignItems: 'center' 
      }}>
        {/* SVG Network Graph */}
        <div style={{ 
          background: 'radial-gradient(ellipse at center, #141a24 0%, #0d1017 100%)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          height: '280px',
          position: 'relative'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1a2230" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Corridor Links (lines) */}
            {corridorLinks.map((link) => {
              const from = nodes[link.from];
              const to = nodes[link.to];
              const isSelected = selectedRoute === link.id;
              const isHovered = hoveredRoute === link.id;

              const strokeColor = link.type === 'Short' ? '#10b981' : link.type === 'Medium' ? '#e57324' : '#38bdf8';
              const strokeWidth = isSelected ? 2.8 : isHovered ? 2.2 : 1.4;

              return (
                <g key={link.id} style={{ cursor: 'pointer' }} onClick={() => onSelectRoute(link.id)} onMouseEnter={() => setHoveredRoute(link.id)} onMouseLeave={() => setHoveredRoute(null)}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.45}
                    strokeDasharray={isSelected ? 'none' : isHovered ? '2 1' : 'none'}
                  />
                  {/* Midpoint interactive badge */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={(from.x + to.x) / 2}
                      cy={(from.y + to.y) / 2}
                      r="2"
                      fill="#ffffff"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}

            {/* City Hub Nodes */}
            {Object.entries(nodes).map(([city, pos]) => {
              const isConnected = corridorLinks.some(l => (l.from === city || l.to === city) && (l.id === selectedRoute || l.id === hoveredRoute));
              return (
                <g key={city} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r={isConnected ? 3.5 : 2.5}
                    fill={isConnected ? 'var(--brand)' : '#334155'}
                    stroke="#ffffff"
                    strokeWidth={isConnected ? 1.2 : 0.6}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <text
                    x={city === 'Ahmedabad' ? -4 : city === 'Kolkata' ? 4 : 3}
                    y={-4}
                    fill={isConnected ? '#ffffff' : '#94a3b8'}
                    fontSize="3.4"
                    fontWeight={isConnected ? 700 : 500}
                    textAnchor={city === 'Ahmedabad' ? 'end' : city === 'Kolkata' ? 'start' : 'start'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {city}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Corridor Quick Card Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          {corridorLinks.map((link) => {
            const isSelected = selectedRoute === link.id;
            const rData = routes.find(r => r.route === link.id);
            const anomalyCount = rData?.anomaly_count || 0;

            return (
              <div
                key={link.id}
                onClick={() => onSelectRoute(link.id)}
                onMouseEnter={() => setHoveredRoute(link.id)}
                onMouseLeave={() => setHoveredRoute(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="corridor-card-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: link.type === 'Short' ? '#10b981' : link.type === 'Medium' ? '#e57324' : '#38bdf8'
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                    {link.id}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ({link.dist})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {rData?.avg_cost && (
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      ₹{rData.avg_cost.toFixed(2)}
                    </span>
                  )}
                  {anomalyCount > 0 ? (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: 'var(--critical-bg)',
                      color: 'var(--critical-text)',
                      border: '1px solid var(--critical-border)'
                    }}>
                      {anomalyCount} Alerts
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: 'var(--normal-bg)',
                      color: 'var(--normal-text)',
                      border: '1px solid var(--normal-border)'
                    }}>
                      Stable
                    </span>
                  )}
                  <ArrowRight size={13} color={isSelected ? 'var(--brand)' : 'var(--text-muted)'} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .corridor-card-hover:hover {
          border-color: var(--brand) !important;
          background: var(--bg-surface-elevated) !important;
        }
      `}</style>
    </div>
  );
}
