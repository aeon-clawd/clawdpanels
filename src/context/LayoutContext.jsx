import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const LayoutContext = createContext()

const STORAGE_KEY = 'clawdpanels-layout'

const DEFAULT_LAYOUT = []

export function LayoutProvider({ children }) {
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  }, [layout])

  const addWidget = (widgetId, config = {}) => {
    const instanceId = uuidv4()
    // Find next available position
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
    
    const newItem = {
      i: instanceId,
      widgetId,
      x: 0,
      y: maxY,
      w: config.defaultSize?.w || 4,
      h: config.defaultSize?.h || 3,
      minW: config.minSize?.w || 2,
      minH: config.minSize?.h || 2,
      config: config.defaultConfig || {},
    }
    setLayout(prev => [...prev, newItem])
    return instanceId
  }

  const removeWidget = (instanceId) => {
    setLayout(prev => prev.filter(item => item.i !== instanceId))
  }

  const updateLayout = (newLayout) => {
    setLayout(prev => prev.map(item => {
      const updated = newLayout.find(l => l.i === item.i)
      if (updated) {
        return { ...item, x: updated.x, y: updated.y, w: updated.w, h: updated.h }
      }
      return item
    }))
  }

  const updateWidgetConfig = (instanceId, newConfig) => {
    setLayout(prev => prev.map(item => 
      item.i === instanceId 
        ? { ...item, config: { ...item.config, ...newConfig } }
        : item
    ))
  }

  return (
    <LayoutContext.Provider value={{ 
      layout, addWidget, removeWidget, updateLayout, updateWidgetConfig 
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

export const useLayout = () => useContext(LayoutContext)
