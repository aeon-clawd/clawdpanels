import { createContext, useContext, useState, useEffect } from 'react'
import { compileWidget } from '../lib/widgetCompiler'
import ClockWidget from '../widgets/clock/Widget'
import WeatherWidget from '../widgets/weather/Widget'
import NotesWidget from '../widgets/notes/Widget'
import CountdownWidget from '../widgets/countdown/Widget'
import PortfolioWidget from '../widgets/portfolio/Widget'
import ServicesWidget from '../widgets/services/Widget'

const WidgetRegistryContext = createContext()

const STORAGE_KEY = 'clawdpanels-custom-widgets'

// Built-in widget definitions
const BUILTIN_WIDGETS = {
  clock: {
    id: 'clock',
    name: 'Clock',
    description: 'Current time with timezone support',
    icon: '🕐',
    category: 'general',
    builtin: true,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    component: ClockWidget,
    configSchema: {
      timezone: { type: 'string', default: 'local', label: 'Timezone' },
      format24h: { type: 'boolean', default: true, label: '24h format' },
    }
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather and forecast',
    icon: '⛅',
    category: 'data',
    builtin: true,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    component: WeatherWidget,
    configSchema: {
      city: { type: 'string', default: '', label: 'City' },
    }
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and text',
    icon: '📝',
    category: 'general',
    builtin: true,
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    component: NotesWidget,
    configSchema: {
      content: { type: 'text', default: '', label: 'Notes' },
    }
  },
  countdown: {
    id: 'countdown',
    name: 'Countdown',
    description: 'Countdown to a target date',
    icon: '⏳',
    category: 'general',
    builtin: true,
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
    component: CountdownWidget,
    configSchema: {
      title: { type: 'string', default: 'Countdown', label: 'Title' },
      targetDate: { type: 'string', default: '', label: 'Target date (YYYY-MM-DD)' },
      emoji: { type: 'string', default: '🎯', label: 'Emoji' },
    }
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Investment portfolio overview',
    icon: '📈',
    category: 'finance',
    builtin: true,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    component: PortfolioWidget,
    configSchema: {
      positions: { type: 'json', default: '[]', label: 'Positions (JSON)' },
    }
  },
  services: {
    id: 'services',
    name: 'Services Monitor',
    description: 'VPS services and containers status',
    icon: '🖥️',
    category: 'system',
    builtin: true,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    component: ServicesWidget,
    configSchema: {
      apiHost: { type: 'string', default: '', label: 'API Host (auto-detect if empty)' },
      refreshInterval: { type: 'string', default: '30', label: 'Refresh interval (seconds)' },
    }
  },
}

// Load custom widgets from localStorage and recompile them
function loadCustomWidgets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    
    const customs = JSON.parse(saved)
    const compiled = {}
    
    for (const [id, def] of Object.entries(customs)) {
      if (def.code) {
        const result = compileWidget(def.code)
        if (result.success) {
          compiled[id] = {
            ...def,
            component: result.component,
            builtin: false,
          }
        } else {
          console.warn(`Failed to recompile widget ${id}:`, result.error)
        }
      }
    }
    
    return compiled
  } catch {
    return {}
  }
}

// Save custom widget metadata + code to localStorage (no component serialization)
function saveCustomWidgets(registry) {
  const customs = {}
  for (const [id, def] of Object.entries(registry)) {
    if (!def.builtin && def.code) {
      customs[id] = {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        defaultSize: def.defaultSize,
        minSize: def.minSize,
        configSchema: def.configSchema,
        code: def.code,
      }
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs))
}

export function WidgetRegistryProvider({ children }) {
  const [registry, setRegistry] = useState(() => {
    const customs = loadCustomWidgets()
    return { ...BUILTIN_WIDGETS, ...customs }
  })

  // Persist custom widgets whenever registry changes
  useEffect(() => {
    saveCustomWidgets(registry)
  }, [registry])

  const registerWidget = (definition) => {
    setRegistry(prev => ({
      ...prev,
      [definition.id]: { ...definition, builtin: false }
    }))
  }

  const unregisterWidget = (widgetId) => {
    setRegistry(prev => {
      const next = { ...prev }
      if (next[widgetId] && !next[widgetId].builtin) {
        delete next[widgetId]
      }
      return next
    })
  }

  const getWidget = (widgetId) => registry[widgetId] || null

  const listWidgets = () => Object.values(registry)

  const listByCategory = (category) => 
    Object.values(registry).filter(w => w.category === category)

  return (
    <WidgetRegistryContext.Provider value={{ 
      registry, registerWidget, unregisterWidget, getWidget, listWidgets, listByCategory 
    }}>
      {children}
    </WidgetRegistryContext.Provider>
  )
}

export const useWidgetRegistry = () => useContext(WidgetRegistryContext)
