import React, { useState } from 'react';
import { Sliders, Fuel, CloudRain, Truck, RotateCcw, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function WhatIfSimulator({ selectedRoute = 'Ahmedabad-Mumbai', routes = [] }) {
  const [fuelDelta, setFuelDelta] = useState(0); // -10% to +30%
  const [detourKm, setDetourKm] = useState(0); // 0 to 250 km
  const [loadFactor, setLoadFactor] = useState(0); // -20% to +20%

  // Reference base rate per route
  const currentRoute = routes.find(r => r.route === selectedRoute);
  const baseCost = currentRoute?.avg_cost || 2.85;
  const baseDistance = selectedRoute.includes('Mumbai-Delhi') ? 1420 :
                       selectedRoute.includes('Delhi-Chennai') ? 2200 :
                       selectedRoute.includes('Ahmedabad-Mumbai') ? 530 :
                       selectedRoute.includes('Mumbai-Pune') ? 150 :
                       selectedRoute.includes('Delhi-Jaipur') ? 280 :
                       selectedRoute.includes('Chennai-Bangalore') ? 350 : 440;

  // Impact calculation:
  // Fuel is ~40% of total freight cost in India
  const fuelMultiplier = 1 + (fuelDelta / 100) * 0.40;
  // Detour adds distance and toll
  const distanceMultiplier = (baseDistance + detourKm) / baseDistance;
  // Load factor inversely impacts per tonne-km
  const capacityMultiplier = 1 / (1 + loadFactor / 100);

  const simulatedCost = baseCost * fuelMultiplier * distanceMultiplier * capacityMultiplier;
  const percentageDelta = ((simulatedCost - baseCost) / baseCost) * 100;

  // Threshold logic
  const isHistoricalBreached = percentageDelta > 10.0;
  const isPeerBreached = percentageDelta > 15.0;

  const applyPreset = (fuel, detour, load) => {
    setFuelDelta(fuel);
    setDetourKm(detour);
    setLoadFactor(load);
  };

  const resetAll = () => {
    setFuelDelta(0);
    setDetourKm(0);
    setLoadFactor(0);
  };

  return (
    <div className="card" style={{ padding: '22px', border: '1px solid var(--border-default)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(229,115,36,0.12)',
            border: '1px solid rgba(229,115,36,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand)'
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Corridor Rate What-If Simulator
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Simulate operational shocks on {selectedRoute} and test dual-baseline sensitivity
            </p>
          </div>
        </div>

        <button
          onClick={resetAll}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button
          onClick={() => applyPreset(12, 0, 0)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.72rem', padding: '4px 10px', background: fuelDelta === 12 ? 'var(--bg-surface-elevated)' : 'transparent' }}
        >
          <Fuel size={12} color="#f97316" />
          <span>Diesel Spike (+12%)</span>
        </button>

        <button
          onClick={() => applyPreset(0, 150, 0)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.72rem', padding: '4px 10px', background: detourKm === 150 ? 'var(--bg-surface-elevated)' : 'transparent' }}
        >
          <CloudRain size={12} color="#38bdf8" />
          <span>Monsoon Detour (+150 km)</span>
        </button>

        <button
          onClick={() => applyPreset(8, 80, -10)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.72rem', padding: '4px 10px', background: (fuelDelta === 8 && detourKm === 80) ? 'var(--bg-surface-elevated)' : 'transparent' }}
        >
          <Zap size={12} color="#facc15" />
          <span>Compound Shock</span>
        </button>
      </div>

      {/* Simulation Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Slider 1: Diesel Price Delta */}
        <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel size={14} color="#f97316" /> Diesel Price Surcharge
            </span>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: fuelDelta > 0 ? 'var(--brand)' : 'var(--text-primary)' }}>
              {fuelDelta > 0 ? `+${fuelDelta}%` : `${fuelDelta}%`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="30"
            step="1"
            value={fuelDelta}
            onChange={(e) => setFuelDelta(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>-10%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>

        {/* Slider 2: Route Detour (km) */}
        <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CloudRain size={14} color="#38bdf8" /> Route Detour / Diversion
            </span>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: detourKm > 0 ? '#38bdf8' : 'var(--text-primary)' }}>
              +{detourKm} km
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="250"
            step="10"
            value={detourKm}
            onChange={(e) => setDetourKm(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>0 km (Direct)</span>
            <span>+120 km</span>
            <span>+250 km</span>
          </div>
        </div>

        {/* Slider 3: Capacity Load Factor */}
        <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={14} color="var(--normal)" /> Fleet Load Efficiency
            </span>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: loadFactor < 0 ? 'var(--critical-text)' : 'var(--text-primary)' }}>
              {loadFactor > 0 ? `+${loadFactor}%` : `${loadFactor}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="5"
            value={loadFactor}
            onChange={(e) => setLoadFactor(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--normal)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>-20% Underload</span>
            <span>0% Nominal</span>
            <span>+20% High Load</span>
          </div>
        </div>
      </div>

      {/* Real-Time Outcome Calculation Display */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: isHistoricalBreached ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${isHistoricalBreached ? 'var(--critical-border)' : 'var(--normal-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Base Rate
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              ₹{baseCost.toFixed(2)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/t-km</span>
            </div>
          </div>

          <div style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>→</div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Simulated Rate
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isHistoricalBreached ? 'var(--critical-text)' : 'var(--normal-text)' }}>
              ₹{simulatedCost.toFixed(2)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/t-km</span>
            </div>
          </div>

          <div style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: isHistoricalBreached ? 'var(--critical-bg)' : 'var(--normal-bg)',
            color: isHistoricalBreached ? 'var(--critical-text)' : 'var(--normal-text)',
            fontWeight: 700,
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)'
          }}>
            {percentageDelta >= 0 ? `+${percentageDelta.toFixed(1)}%` : `${percentageDelta.toFixed(1)}%`}
          </div>
        </div>

        {/* Audit Guidance Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isHistoricalBreached ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--critical)" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--critical-text)' }}>
                  {isPeerBreached ? 'Peer & Trailing Threshold Breached' : 'Trailing Baseline Breached (>10%)'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Would trigger autonomous anomaly audit flag
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--normal)" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--normal-text)' }}>
                  Within Permissible Cost Envelope
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Under 10% delta threshold — No alert triggered
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
