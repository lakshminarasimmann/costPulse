import React from 'react';

export default function TruckIcon({ size = 38, className = '' }) {
  return (
    <div 
      className={`truck-symbol-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer'
      }}
      title="FreightTiger Heavy Fleet Dispatch"
    >
      <svg 
        width={size} 
        height={Math.round(size * 0.72)} 
        viewBox="0 0 54 38" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', transition: 'transform 0.25s ease' }}
      >
        <defs>
          <linearGradient id="cabGrad" x1="32" y1="12" x2="52" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f97316" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="trailerGrad" x1="2" y1="6" x2="33" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e2430" />
            <stop offset="0.5" stopColor="#141820" />
            <stop offset="1" stopColor="#0f131a" />
          </linearGradient>
          <linearGradient id="windshieldGrad" x1="37" y1="11" x2="45" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>
          <filter id="headlightGlow" x="46" y="16" width="16" height="16" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Road Surface Line */}
        <line x1="0" y1="34" x2="54" y2="34" stroke="#272f3d" strokeWidth="2" strokeDasharray="3 3" />

        {/* Cargo Container (Trailer) */}
        <rect x="2" y="6" width="31" height="21" rx="3" fill="url(#trailerGrad)" stroke="#2b3445" strokeWidth="1.2" />
        
        {/* Container Corrugation Ridges */}
        <line x1="8" y1="8" x2="8" y2="25" stroke="#272f3d" strokeWidth="1" />
        <line x1="14" y1="8" x2="14" y2="25" stroke="#272f3d" strokeWidth="1" />
        <line x1="20" y1="8" x2="20" y2="25" stroke="#272f3d" strokeWidth="1" />
        <line x1="26" y1="8" x2="26" y2="25" stroke="#272f3d" strokeWidth="1" />

        {/* Freight Tiger Orange Accent Stripe on Trailer */}
        <path d="M2 17 L33 17" stroke="#e57324" strokeWidth="1.8" />
        <circle cx="17" cy="11" r="2.5" fill="#e57324" fillOpacity="0.2" />
        <path d="M15.5 11 L18.5 11 M17 9.5 L17 12.5" stroke="#e57324" strokeWidth="0.8" />

        {/* Hitch Connector */}
        <rect x="31" y="21" width="4" height="4" fill="#475569" />

        {/* Truck Cabin Base & Hood */}
        <path 
          d="M33 17 
             L41 10 
             L47 10 
             C49 10, 50 12, 51 14 
             L53 20 
             C53.5 21.5, 53.5 23, 53.5 24 
             L53.5 27 
             L33 27 Z" 
          fill="url(#cabGrad)" 
          stroke="#9a3412" 
          strokeWidth="1"
        />

        {/* Windshield */}
        <path 
          d="M41 12 
             L46 12 
             L49.5 19 
             L41 19 Z" 
          fill="url(#windshieldGrad)" 
          stroke="#0284c7" 
          strokeWidth="0.5" 
        />

        {/* Side Door Window */}
        <rect x="35" y="13" width="4.5" height="5.5" rx="0.5" fill="#1e293b" />

        {/* Front Chrome Bumper & Grille */}
        <rect x="52" y="22" width="2" height="5" rx="0.8" fill="#94a3b8" />
        
        {/* Headlight with Amber Beam */}
        <circle cx="52.5" cy="21" r="1.5" fill="#fde047" filter="url(#headlightGlow)" />
        <path d="M54 20.5 L60 17 L60 25 L54 22 Z" fill="#fde047" fillOpacity="0.15" />

        {/* Exhaust Stack */}
        <rect x="33.5" y="4" width="1.8" height="8" rx="0.6" fill="#64748b" />
        <path d="M34.5 3 C34.5 1.5, 36 1, 37 0.5" stroke="#475569" strokeWidth="0.8" strokeDasharray="1 1" opacity="0.6" />

        {/* Rear Trailer Wheels (Tandem) */}
        <circle cx="9" cy="28" r="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
        <circle cx="9" cy="28" r="2" fill="#94a3b8" />
        <circle cx="19" cy="28" r="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
        <circle cx="19" cy="28" r="2" fill="#94a3b8" />

        {/* Front Steer Wheel */}
        <circle cx="45" cy="28" r="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
        <circle cx="45" cy="28" r="2" fill="#94a3b8" />
      </svg>
    </div>
  );
}
