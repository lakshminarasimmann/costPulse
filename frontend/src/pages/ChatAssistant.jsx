import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api/client';
import { Send, Terminal, User, Database, ArrowRight } from 'lucide-react';

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'FreightTiger Operations Intelligence online. Monitoring 728 route-weeks across 7 corridors with verified ground truth from 10 operational context notes.\n\nYou can query specific route spikes, flood detours, festival surcharges, or verify why trap notes were excluded.',
      sources: [],
      confidence: 'high'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const presets = [
    'Why did Chennai-Bangalore rates surge in late February 2025?',
    'What does note N002 say about Ahmedabad-Mumbai festival surcharges?',
    'Why was Mumbai-Delhi maintenance (N005) rejected as an anomaly justification?',
    'Which routes experienced unexplained cost increases in Q4 2024?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await sendChatMessage(q);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.answer,
          sources: res.sources || [],
          confidence: res.confidence || 'high'
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Error connecting to analytics engine. Ensure the FastAPI backend is running on port 8000.',
          sources: [],
          confidence: 'low'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)', maxWidth: '1100px', margin: '0 auto', gap: '16px' }}>
      {/* Messages Scroll Area */}
      <div className="enterprise-card" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: isUser ? 'var(--brand)' : 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--border-subtle)',
                color: isUser ? '#ffffff' : 'var(--brand)'
              }}>
                {isUser ? <User size={15} /> : <Terminal size={15} />}
              </div>

              <div style={{
                maxWidth: '78%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isUser ? 'var(--bg-surface-active)' : 'var(--bg-app)',
                border: isUser ? '1px solid var(--brand-border)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                <div>{m.content}</div>

                {/* Sources list if present */}
                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--brand)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                      <Database size={11} />
                      <span>Retrieved Context Notes:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {m.sources.map((s, si) => (
                        <div key={si} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          • <strong>{s.note_id}</strong> ({s.date}): {s.note_text?.slice(0, 95)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
              <Terminal size={15} />
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}>
              Querying ChromaDB vector index & analytics telemetry...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          >
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="enterprise-card"
        style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <input
          type="text"
          placeholder="Ask about route rates, anomalies, or ground truth notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-control"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '8px 10px', fontSize: '0.85rem' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn btn-primary"
          style={{ padding: '8px 16px' }}
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
