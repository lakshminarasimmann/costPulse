import React, { useState, useEffect } from 'react';
import TopNav from './components/Layout/TopNav';
import CommandCenter from './pages/CommandCenter';
import RouteDeepDive from './pages/RouteDeepDive';
import AnomalyInspector from './pages/AnomalyInspector';
import ContextIntelligence from './pages/ContextIntelligence';
import ChatAssistant from './pages/ChatAssistant';
import SystemTrust from './pages/SystemTrust';
import AnomalyDrawer from './components/Interactive/AnomalyDrawer';
import { fetchSummary, fetchRoutes } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('command-center');
  const [selectedRoute, setSelectedRoute] = useState('Chennai-Bangalore');
  const [summary, setSummary] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, routesRes] = await Promise.all([
        fetchSummary(),
        fetchRoutes()
      ]);
      setSummary(sumRes);
      setRoutes(routesRes);
      if (routesRes && routesRes.length > 0 && !selectedRoute) {
        setSelectedRoute(routesRes[0].route);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setActiveTab('route-dive');
  };

  const handleInspectAnomaly = (anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      minHeight: '100vh', 
      background: 'var(--bg-base)',
      color: 'var(--text-primary)'
    }}>
      {/* Master Top Navigation featuring Freight Truck Symbol & Clickable Tabs */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={summary}
        routes={routes}
        onSelectRoute={handleRouteSelect}
        onRefresh={loadData}
      />

      {/* Main Content Area — Full-Width Enterprise Dashboard Layout */}
      <main style={{ 
        flex: 1, 
        padding: '24px 32px 48px', 
        width: '100%', 
        maxWidth: '1680px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'command-center' && (
          <CommandCenter
            summary={summary}
            routes={routes}
            onSelectRoute={handleRouteSelect}
            onInspectAnomaly={handleInspectAnomaly}
          />
        )}

        {activeTab === 'route-dive' && (
          <RouteDeepDive
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyInspector
            routes={routes}
            onSelectRoute={handleRouteSelect}
            onInspectAnomaly={handleInspectAnomaly}
          />
        )}

        {activeTab === 'context-notes' && (
          <ContextIntelligence />
        )}

        {activeTab === 'chat-assistant' && (
          <ChatAssistant />
        )}

        {activeTab === 'system-trust' && (
          <SystemTrust />
        )}
      </main>

      {/* Interactive Anomaly Detail Slide-over Drawer */}
      {selectedAnomaly && (
        <AnomalyDrawer
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onSelectRoute={handleRouteSelect}
        />
      )}
    </div>
  );
}
