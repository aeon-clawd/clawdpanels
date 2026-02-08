import { useState, useRef, useEffect } from 'react'
import { useClawdbot } from '../context/ClawdbotContext'

export default function ChatPanel({ onClose }) {
  const { selectedModel, updateModel, models, sendMessage, gatewayUrl, gatewayToken, updateGateway } = useClawdbot()
  const [messages, setMessages] = useState([
    { 
      role: 'system', 
      content: 'Widget Creator Agent ready. Describe a widget and I\'ll build it for you.' 
    }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempUrl, setTempUrl] = useState(gatewayUrl)
  const [tempToken, setTempToken] = useState(gatewayToken)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    try {
      const response = await sendMessage(userMsg)
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: response.message || response.text || 'Widget created!' 
      }])
      
      // If the response includes a widget definition, we could auto-register it
      if (response.widget) {
        // TODO: Dynamic widget registration from agent response
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `✅ Widget "${response.widget.name}" registered!` 
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `⚠️ Could not reach Clawdbot. Configure gateway URL in settings (⚙️). Error: ${err.message}` 
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const saveSettings = () => {
    updateGateway(tempUrl, tempToken)
    setShowSettings(false)
    setMessages(prev => [...prev, { 
      role: 'system', 
      content: `Gateway updated: ${tempUrl}` 
    }])
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-agent-dot" />
          <h3>Widget Creator</h3>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className="chat-close-btn" 
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {showSettings && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          fontSize: '12px',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Gateway URL
            </label>
            <input
              type="text"
              value={tempUrl}
              onChange={e => setTempUrl(e.target.value)}
              placeholder="http://localhost:3577"
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Gateway Token
            </label>
            <input
              type="password"
              value={tempToken}
              onChange={e => setTempToken(e.target.value)}
              placeholder="Optional auth token"
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            />
          </div>
          <button onClick={saveSettings} style={{
            padding: '6px 12px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}>
            Save
          </button>
        </div>
      )}

      <div className="chat-model-selector">
        <select value={selectedModel} onChange={e => updateModel(e.target.value)}>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {sending && (
          <div className="chat-message agent" style={{ opacity: 0.6 }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a widget you want..."
          disabled={sending}
        />
        <button 
          className="chat-send-btn" 
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
