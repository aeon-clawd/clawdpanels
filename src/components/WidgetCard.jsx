import { useState } from 'react'

export default function WidgetCard({ 
  instanceId, definition, config, editMode, onRemove, onConfigChange, size 
}) {
  const [configOpen, setConfigOpen] = useState(false)
  const Component = definition.component

  const mergedConfig = { ...getDefaults(definition.configSchema), ...config }

  return (
    <div className={`widget-card ${editMode ? 'edit-mode' : ''}`}>
      <div className="widget-header">
        <div className="widget-header-left">
          <span className="widget-icon">{definition.icon}</span>
          <span className="widget-title">{mergedConfig.title || definition.name}</span>
        </div>
        <div className="widget-actions">
          <button 
            className="widget-action-btn"
            onClick={() => setConfigOpen(!configOpen)}
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            className="widget-action-btn danger"
            onClick={onRemove}
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {configOpen && (
        <WidgetConfigPanel 
          schema={definition.configSchema} 
          config={mergedConfig}
          onChange={onConfigChange}
          onClose={() => setConfigOpen(false)}
        />
      )}

      <div className="widget-body">
        <Component 
          config={mergedConfig} 
          onConfigChange={onConfigChange}
          size={size}
        />
      </div>
    </div>
  )
}

function WidgetConfigPanel({ schema, config, onChange, onClose }) {
  if (!schema) return null

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      fontSize: '13px',
    }}>
      {Object.entries(schema).map(([key, def]) => (
        <div key={key} style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {def.label || key}
          </label>
          {def.type === 'boolean' ? (
            <input
              type="checkbox"
              checked={config[key] ?? def.default}
              onChange={e => onChange({ [key]: e.target.checked })}
            />
          ) : def.type === 'text' ? (
            <textarea
              value={config[key] ?? def.default}
              onChange={e => onChange({ [key]: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          ) : (
            <input
              type="text"
              value={config[key] ?? def.default}
              onChange={e => onChange({ [key]: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
          )}
        </div>
      ))}
      <button 
        onClick={onClose}
        style={{
          marginTop: '4px',
          padding: '4px 12px',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  )
}

function getDefaults(schema) {
  if (!schema) return {}
  const defaults = {}
  for (const [key, def] of Object.entries(schema)) {
    defaults[key] = def.default
  }
  return defaults
}
