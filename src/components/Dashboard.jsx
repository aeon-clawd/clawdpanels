import { useMemo, useCallback, useRef, useState, useEffect, Fragment } from 'react'
import { Responsive } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLayout } from '../context/LayoutContext'
import { useWidgetRegistry } from '../context/WidgetRegistryContext'
import WidgetCard from './WidgetCard'

function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => observer.disconnect()
  }, [ref])
  return width
}

export default function Dashboard({ editMode }) {
  const { layout, updateLayout, removeWidget, updateWidgetConfig } = useLayout()
  const { getWidget } = useWidgetRegistry()
  const containerRef = useRef(null)
  const width = useWidth(containerRef)
  const prevLenRef = useRef(layout.length)

  // Auto-scroll when a new widget is added
  useEffect(() => {
    if (layout.length > prevLenRef.current) {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300)
    }
    prevLenRef.current = layout.length
  }, [layout.length])

  const gridLayout = useMemo(() => 
    layout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      static: !editMode,
    })),
    [layout, editMode]
  )

  const onLayoutChange = useCallback((newLayout) => {
    if (editMode) {
      updateLayout(newLayout)
    }
  }, [editMode, updateLayout])

  if (layout.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⬡</div>
        <h2>Your dashboard is empty</h2>
        <p>
          Click <strong>+ Add Widget</strong> to pick from available widgets, 
          or open the <strong>💬 Agent</strong> to create custom ones.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {width > 0 && (
        <Responsive
          className="layout"
          layouts={{ lg: gridLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={80}
          width={width}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={onLayoutChange}
          compactType="vertical"
          margin={[16, 16]}
        >
          {layout.map(item => {
            const widgetDef = getWidget(item.widgetId)
            if (!widgetDef) return null

            return (
              <div key={item.i}>
                <WidgetCard
                  instanceId={item.i}
                  definition={widgetDef}
                  config={item.config}
                  editMode={editMode}
                  onRemove={() => removeWidget(item.i)}
                  onConfigChange={(newConfig) => updateWidgetConfig(item.i, newConfig)}
                  size={{ w: item.w, h: item.h }}
                />
              </div>
            )
          })}
        </Responsive>
      )}
    </div>
  )
}
