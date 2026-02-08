import { createContext, useContext, useState } from 'react'
import ClockWidget from '../widgets/clock/Widget'
import WeatherWidget from '../widgets/weather/Widget'
import NotesWidget from '../widgets/notes/Widget'
import CountdownWidget from '../widgets/countdown/Widget'
import PortfolioWidget from '../widgets/portfolio/Widget'

const WidgetRegistryContext = createContext()

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
}

export function WidgetRegistryProvider({ children }) {
  const [registry, setRegistry] = useState(BUILTIN_WIDGETS)

  const registerWidget = (definition) => {
    setRegistry(prev => ({
      ...prev,
      [definition.id]: { ...definition, builtin: false }
    }))
  }

  const getWidget = (widgetId) => registry[widgetId] || null

  const listWidgets = () => Object.values(registry)

  const listByCategory = (category) => 
    Object.values(registry).filter(w => w.category === category)

  return (
    <WidgetRegistryContext.Provider value={{ 
      registry, registerWidget, getWidget, listWidgets, listByCategory 
    }}>
      {children}
    </WidgetRegistryContext.Provider>
  )
}

export const useWidgetRegistry = () => useContext(WidgetRegistryContext)
