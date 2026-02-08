import { createContext, useContext, useState } from 'react'

const ClawdbotContext = createContext()

// Default models available — in production these come from the gateway config
const DEFAULT_MODELS = [
  { id: 'anthropic/claude-haiku-4-5', label: 'Haiku (fast)' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Sonnet (balanced)' },
  { id: 'anthropic/claude-opus-4-6', label: 'Opus (powerful)' },
  { id: 'google-gemini-cli/gemini-3-flash-preview', label: 'Gemini Flash' },
]

export function ClawdbotProvider({ children }) {
  const [gatewayUrl, setGatewayUrl] = useState(
    () => localStorage.getItem('clawdpanels-gateway-url') || 'http://localhost:3577'
  )
  const [gatewayToken, setGatewayToken] = useState(
    () => localStorage.getItem('clawdpanels-gateway-token') || ''
  )
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('clawdpanels-model') || DEFAULT_MODELS[0].id
  )
  const [connected, setConnected] = useState(false)
  const [models, setModels] = useState(DEFAULT_MODELS)

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

  // Send a message to the Clawdbot gateway chat API
  const sendMessage = async (message, sessionKey = null) => {
    try {
      const response = await fetch(`${gatewayUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(gatewayToken ? { 'Authorization': `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          message,
          model: selectedModel,
          sessionKey,
          agentId: 'widget-creator',
        }),
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err) {
      console.error('Clawdbot API error:', err)
      throw err
    }
  }

  // Check gateway connection
  const checkConnection = async () => {
    try {
      const response = await fetch(`${gatewayUrl}/api/status`, {
        headers: gatewayToken ? { 'Authorization': `Bearer ${gatewayToken}` } : {},
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
