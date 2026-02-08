import { useState, useRef, useEffect } from 'react'
import { useClawdbot } from '../context/ClawdbotContext'
import { useWidgetRegistry } from '../context/WidgetRegistryContext'
import { useLayout } from '../context/LayoutContext'
import { processWidgetResponse } from '../lib/widgetCompiler'

export default function ChatPanel({ onClose }) {
  const { selectedModel, updateModel, models, gatewayUrl, gatewayToken, updateGateway, connected } = useClawdbot()
  const { registerWidget, listWidgets } = useWidgetRegistry()
  const { addWidget } = useLayout()
  
  const [messages, setMessages] = useState([
    { 
      role: 'system', 
      content: '⬡ Widget Creator Agent ready. Describe a widget and I\'ll build it for you.' 
    }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempUrl, setTempUrl] = useState(gatewayUrl)
  const [tempToken, setTempToken] = useState(gatewayToken)
  const [sessionKey, setSessionKey] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }])
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    addMessage('user', userMsg)
    setSending(true)

    try {
      // Build the system context with current widget registry
      const existingWidgets = listWidgets().map(w => `${w.icon} ${w.name} (${w.id})`).join(', ')
      
      const response = await fetch(`${gatewayUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(gatewayToken ? { 'Authorization': `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          message: userMsg,
          model: selectedModel,
          sessionKey: sessionKey,
          context: {
            existingWidgets,
            widgetSpec: 'Function Widget({ config, onConfigChange, size }) that returns JSX.',
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`)
      }

      const data = await response.json()
      const agentText = data.message || data.text || ''
      
      // Save session key for continued conversation
      if (data.sessionKey) {
        setSessionKey(data.sessionKey)
      }

      // Try to extract and compile a widget from the response
      const result = processWidgetResponse(agentText)
      
      if (result.success) {
        // Widget was created!
        const def = result.definition
        registerWidget(def)
        
        addMessage('agent', agentText)
        addMessage('system', `✅ Widget "${def.name}" created and registered!`)
        
        // Auto-add to dashboard
        addWidget(def.id, {
          defaultSize: def.defaultSize,
          minSize: def.minSize,
          defaultConfig: {},
        })
        addMessage('system', `📌 Added "${def.name}" to your dashboard.`)
      } else {
        // Normal text response (no widget code found)
        addMessage('agent', agentText)
      }
    } catch (err) {
      // If gateway is not reachable, fall back to local-only mode
      if (err.message.includes('fetch') || err.message.includes('Gateway') || err.message.includes('Failed')) {
        addMessage('system', `⚠️ Can't reach Clawdbot at ${gatewayUrl}. Using local mode.`)
        handleLocalMode(userMsg)
      } else {
        addMessage('agent', `Error: ${err.message}`)
      }
    } finally {
      setSending(false)
    }
  }

  // Local mode: parse widget descriptions and generate simple widgets without an API
  const handleLocalMode = (userMsg) => {
    const lower = userMsg.toLowerCase()
    
    // Check if user is trying to create a widget
    if (lower.includes('widget') || lower.includes('create') || lower.includes('build') || lower.includes('make') || lower.includes('quiero') || lower.includes('añad')) {
      addMessage('agent', 
        'I can\'t reach the Clawdbot gateway for AI-powered widget creation. To enable it:\n\n' +
        '1. Click ⚙️ above\n' +
        '2. Set your Gateway URL (e.g., http://localhost:3577)\n' +
        '3. Add your Gateway Token if needed\n\n' +
        'Meanwhile, you can add built-in widgets from the **+ Add Widget** button in the header.\n\n' +
        'Or paste widget code directly — I can compile JSX! Try:\n' +
        '```jsx\nfunction Widget({ config }) {\n  return <div style={{textAlign: "center", padding: "20px"}}>Hello World!</div>\n}\n```'
      )
    } else if (userMsg.includes('```')) {
      // User pasted code directly — try to compile it
      const result = processWidgetResponse(userMsg)
      if (result.success) {
        const def = result.definition
        registerWidget(def)
        addMessage('system', `✅ Compiled and registered "${def.name}"!`)
        addWidget(def.id, {
          defaultSize: def.defaultSize,
          minSize: def.minSize,
          defaultConfig: {},
        })
        addMessage('system', `📌 Added to your dashboard.`)
      } else {
        addMessage('system', `❌ ${result.error}`)
      }
    } else {
      addMessage('agent', 
        'I\'m the Widget Creator. I can:\n\n' +
        '• Create custom widgets from descriptions (needs Clawdbot gateway)\n' +
        '• Compile JSX code you paste directly\n' +
        '• Help you configure existing widgets\n\n' +
        'Try pasting some widget code, or configure the gateway connection (⚙️) for full AI widget creation.'
      )
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
    addMessage('system', `Gateway updated: ${tempUrl}`)
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
            {msg.role === 'agent' ? (
              <FormattedMessage text={msg.content} />
            ) : (
              msg.content
            )}
          </div>
        ))}
        {sending && (
          <div className="chat-message agent" style={{ opacity: 0.6 }}>
            <span className="typing-dots">Creating widget</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a widget or paste JSX code..."
          disabled={sending}
          rows={1}
          style={{ minHeight: '40px', maxHeight: '120px' }}
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

// Simple markdown-like formatting for agent messages
function FormattedMessage({ text }) {
  if (!text) return null
  
  const parts = text.split(/(```[\s\S]*?```)/g)
  
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
          return (
            <pre key={i} style={{
              background: 'var(--bg-primary)',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              overflow: 'auto',
              margin: '6px 0',
              lineHeight: '1.4',
              fontFamily: 'monospace',
            }}>
              {code}
            </pre>
          )
        }
        // Bold and line breaks
        return (
          <span key={i}>
            {part.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line.split(/(\*\*.*?\*\*)/g).map((seg, k) => {
                  if (seg.startsWith('**') && seg.endsWith('**')) {
                    return <strong key={k}>{seg.slice(2, -2)}</strong>
                  }
                  return seg
                })}
              </span>
            ))}
          </span>
        )
      })}
    </div>
  )
}
