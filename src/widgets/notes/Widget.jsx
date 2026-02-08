import { useState, useRef, useEffect } from 'react'

export default function NotesWidget({ config, onConfigChange }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(config.content || '')
  const textareaRef = useRef(null)

  useEffect(() => {
    setText(config.content || '')
  }, [config.content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    onConfigChange({ content: text })
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setText(config.content || '')
      setEditing(false)
    }
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (editing) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: '10px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setText(config.content || ''); setEditing(false) }}
            style={{
              padding: '4px 12px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '4px 12px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Save (⌘S)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={() => setEditing(true)}
      style={{ 
        height: '100%', 
        cursor: 'text',
        fontSize: '13px',
        lineHeight: '1.6',
        color: text ? 'var(--text-primary)' : 'var(--text-muted)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text || 'Click to add notes...'}
    </div>
  )
}
