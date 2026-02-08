import { createContext, useContext, useState } from 'react'

const ClawdbotContext = createContext()

const DEFAULT_MODELS = [
  { id: 'anthropic/claude-haiku-4-5', label: '⚡ Haiku (fast)' },
  { id: 'anthropic/claude-sonnet-4-5', label: '🎯 Sonnet (balanced)' },
  { id: 'google-gemini-cli/gemini-3-flash-preview', label: '⚡ Gemini Flash' },
  { id: 'anthropic/claude-opus-4-6', label: '🧠 Opus (powerful)' },
]

// Widget Creator system prompt
const WIDGET_CREATOR_SYSTEM = `You are the ClawdPanels Widget Creator Agent. Your ONLY job is to create React widgets.

## Widget Contract
Every widget MUST be a function called "Widget" that receives { config, onConfigChange, size }:
- config: object with user-configurable values
- onConfigChange: function to persist config changes — call with { key: value }
- size: { w, h } grid size

## Available in Scope (DO NOT import)
React, useState, useEffect, useRef, useCallback, useMemo — all pre-injected.

## Response Format
ALWAYS respond with BOTH a JSON metadata block AND a JSX code block:

\`\`\`json
{
  "widget": {
    "id": "unique-kebab-id",
    "name": "Human Readable Name",
    "description": "What this widget does",
    "icon": "🎯",
    "category": "general",
    "defaultSize": { "w": 4, "h": 3 },
    "minSize": { "w": 2, "h": 2 },
    "configSchema": {}
  }
}
\`\`\`

\`\`\`jsx
function Widget({ config, onConfigChange, size }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Widget content here
    </div>
  )
}
\`\`\`

## Styling Rules
- Inline styles ONLY (no CSS imports)
- Use CSS variables: var(--bg-primary) #0f1117, var(--bg-secondary) #1a1d27, var(--bg-card) #1e2130, var(--text-primary) #e4e6ed, var(--text-secondary) #8b8fa3, var(--text-muted) #5a5e72, var(--accent) #4f6df5, var(--success) #34d399, var(--warning) #fbbf24, var(--danger) #f87171, var(--border-color) #2a2d3a
- Dark theme. Fill container: height: '100%'
- Handle undefined config values with defaults

## Data Fetching
- Use fetch() in useEffect for external APIs
- Always handle loading and error states
- Use CORS-friendly APIs (wttr.in, public APIs, etc.)

## CRITICAL
- The function MUST be named "Widget"
- NO imports — hooks are pre-injected
- ALWAYS include both JSON and JSX code blocks
- Keep widgets self-contained`

export function ClawdbotProvider({ children }) {
  // Auto-detect gateway URL: same host as the dashboard, port 8091 (proxy)
  const defaultGatewayUrl = typeof window !== 'undefined' 
    ? `http://${window.location.hostname}:8091`
    : 'http://localhost:8091'

  const [gatewayUrl, setGatewayUrl] = useState(
    () => localStorage.getItem('clawdpanels-gateway-url') || defaultGatewayUrl
  )
  const [gatewayToken, setGatewayToken] = useState(
    () => localStorage.getItem('clawdpanels-gateway-token') || ''
  )
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('clawdpanels-model') || DEFAULT_MODELS[0].id
  )
  const [connected, setConnected] = useState(false)
  const [models] = useState(DEFAULT_MODELS)

  const updateGateway = (url, token) => {
    setGatewayUrl(url)
    setGatewayToken(token)
    localStorage.setItem('clawdpanels-gateway-url', url)
    localStorage.setItem('clawdpanels-gateway-token', token)
  }

  const updateModel = (modelId) => {
    setSelectedModel(modelId)
    localStorage.setItem('clawdpanels-model', modelId)
  }

  // Send message via OpenAI-compatible chat completions endpoint
  const sendMessage = async (conversationMessages) => {
    const messages = [
      { role: 'system', content: WIDGET_CREATOR_SYSTEM },
      ...conversationMessages,
    ]

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
        'x-clawdbot-agent-id': 'main',
      },
      body: JSON.stringify({
        model: `clawdbot:main`,
        messages,
        user: 'clawdpanels-widget-creator',
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return content
  }

  const checkConnection = async () => {
    try {
      const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify({
          model: 'clawdbot:main',
          messages: [{ role: 'user', content: 'ping' }],
        }),
      })
      setConnected(response.ok)
      return response.ok
    } catch {
      setConnected(false)
      return false
    }
  }

  return (
    <ClawdbotContext.Provider value={{
      gatewayUrl, gatewayToken, updateGateway,
      selectedModel, updateModel, models,
      connected, checkConnection, sendMessage,
    }}>
      {children}
    </ClawdbotContext.Provider>
  )
}

export const useClawdbot = () => useContext(ClawdbotContext)
