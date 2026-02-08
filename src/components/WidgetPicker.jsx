import { useWidgetRegistry } from '../context/WidgetRegistryContext'
import { useLayout } from '../context/LayoutContext'

export default function WidgetPicker({ onClose }) {
  const { listWidgets } = useWidgetRegistry()
  const { addWidget } = useLayout()

  const widgets = listWidgets()
  // Sort: builtin first, then custom
  widgets.sort((a, b) => (b.builtin ? 1 : 0) - (a.builtin ? 1 : 0))
  const categories = [...new Set(widgets.map(w => w.category))]

  const handleAdd = (widget) => {
    addWidget(widget.id, {
      defaultSize: widget.defaultSize,
      minSize: widget.minSize,
      defaultConfig: {},
    })
    onClose()
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h2>Add Widget</h2>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="picker-body">
          {widgets.map(widget => (
            <div 
              key={widget.id} 
              className="picker-widget-card"
              onClick={() => handleAdd(widget)}
            >
              <div className="picker-widget-icon">{widget.icon}</div>
              <div className="picker-widget-name">{widget.name}</div>
              <div className="picker-widget-desc">{widget.description}</div>
              {!widget.builtin && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  padding: '2px 8px',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                }}>
                  CUSTOM
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
