import { useState, useRef, useEffect } from 'react'
import { useClawdbot } from '../context/ClawdbotContext'
import { useWidgetRegistry } from '../context/WidgetRegistryContext'
import { useLayout } from '../context/LayoutContext'
import { processWidgetResponse } from '../lib/widgetCompiler'

export default function ChatPanel({ onClose }) {
  const { selectedModel, updateModel, models, sendMessage, gatewayUrl, gatewayToken, updateGateway } = useClawdbot()
  const { registerWidget, listWidgets } = useWidgetRegistry()
  const { addWidget } = useLayout()

  // UI messages (display)
  const [messages, setMessages] = useState([
    { role: 'system', content: '⬡ Widget Creator ready. Describe a widget and I\'ll build it.' }
  ])
  // Conversation history for the API (role: user/assistant only)
  const [conversation, setConversation] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempUrl, setTempUrl] = useState(gatewayUrl)
  const [tempToken, setTempToken] = useState(gatewayToken)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMsg = (role, content) => setMessages(prev => [...prev, { role, content }])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput('')
    addMsg('user', userMsg)
    setSending(true)

    // Add context about existing widgets
    const existingInfo = listWidgets().map(w => `${w.icon} ${w.name}`).join(', ')
    const enrichedMsg = conversation.length === 0
      ? `Existing widgets in dashboard: ${existingInfo}\n\nUser request: ${userMsg}`
      : userMsg

    const newConversation = [...conversation, { role: 'user', content: enrichedMsg }]

    try {
      const agentText = await sendMessage(newConversation)
      
      // Update conversation history
      setConversation([...newConversation, { role: 'assistant', content: agentText }])

      // Try to extract and compile a widget
      const result = processWidgetResponse(agentText)

      if (result.success) {
        const def = result.definition
        registerWidget(def)
        addMsg('agent', agentText)
        addMsg('system', `✅ Widget "${def.name}" compiled and registered!`)
        addWidget(def.id, {
          defaultSize: def.defaultSize,
          minSize: def.minSize,
          defaultConfig: {},
        })
        addMsg('system', `📌 Added to your dashboard.`)
      } else if (result.error && result.widgetDef) {
        // Compilation failed — auto-retry by asking agent to fix
        addMsg('agent', agentText)
        addMsg('system', `⚠️ Compilation error: ${result.error}`)
        addMsg('system', `🔄 Asking agent to fix...`)
        
        const fixConvo = [...newConversation, 
          { role: 'assistant', content: agentText },
          { role: 'user', content: `The widget code has a compilation error:\n\n${result.error}\n\nPlease fix the code and resend. Remember: function must be called "Widget", no imports, hooks are pre-injected (useState, useEffect, useRef, useCallback, useMemo). Send ONLY the corrected json and jsx code blocks.` }
        ]
        
        try {
          const fixedText = await sendMessage(fixConvo)
          const fixResult = processWidgetResponse(fixedText)
          
          if (fixResult.success) {
            const def = fixResult.definition
            registerWidget(def)
            addMsg('agent', fixedText)
            addMsg('system', `✅ Fixed! Widget "${def.name}" compiled and registered.`)
            addWidget(def.id, { defaultSize: def.defaultSize, minSize: def.minSize, defaultConfig: {} })
            addMsg('system', `📌 Added to your dashboard.`)
            setConversation([...fixConvo, { role: 'assistant', content: fixedText }])
          } else {
            addMsg('agent', fixedText)
            addMsg('system', `❌ Still failing: ${fixResult.error}. Try simplifying your request.`)
            setConversation([...fixConvo, { role: 'assistant', content: fixedText }])
          }
        } catch (fixErr) {
          addMsg('system', `❌ Could not auto-fix: ${fixErr.message}`)
        }
      } else {
        // Normal text response (no widget code found)
        addMsg('agent', agentText)
      }
    } catch (err) {
      // Check if it's a code paste (local mode)
      if (userMsg.includes('```')) {
        const result = processWidgetResponse(userMsg)
        if (result.success) {
          const def = result.definition
          registerWidget(def)
          addMsg('system', `✅ Compiled "${def.name}" locally!`)
          addWidget(def.id, { defaultSize: def.defaultSize, minSize: def.minSize, defaultConfig: {} })
          addMsg('system', `📌 Added to dashboard.`)
        } else {
          addMsg('system', `❌ Compilation failed: ${result.error}`)
        }
      } else {
        addMsg('system', `⚠️ Can't reach gateway at ${gatewayUrl}. Configure in ⚙️ settings.\nError: ${err.message}`)
      }
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
    addMsg('system', `Gateway: ${tempUrl}`)
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-agent-dot" />
          <h3>Widget Creator</h3>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="chat-close-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">⚙️</button>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {showSettings && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Gateway URL</label>
            <input type="text" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="http://localhost:18789"
              style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }} />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Auth Token</label>
            <input type="password" value={tempToken} onChange={e => setTempToken(e.target.value)} placeholder="Gateway auth token"
              style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }} />
          </div>
          <button onClick={saveSettings} style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Save</button>
        </div>
      )}

      <div className="chat-model-selector">
        <select value={selectedModel} onChange={e => updateModel(e.target.value)}>
          {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === 'agent' ? <FormattedMessage text={msg.content} /> : msg.content}
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
          placeholder="Describe a widget or paste JSX..."
          disabled={sending}
          rows={1}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}

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
              background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '6px',
              fontSize: '11px', overflow: 'auto', margin: '6px 0', lineHeight: '1.4', fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{code}</pre>
          )
        }
        return (
          <span key={i}>
            {part.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line.split(/(\*\*.*?\*\*)/g).map((seg, k) => {
                  if (seg.startsWith('**') && seg.endsWith('**')) return <strong key={k}>{seg.slice(2, -2)}</strong>
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
