import { useState, useEffect, useCallback } from 'react'

export default function WodWidget({ config }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const apiHost = config.apiHost || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8092` : 'http://localhost:8092')

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const date = new Date().toISOString().split('T')[0]
      const res = await fetch(`${apiHost}/api/aimharder/classes?date=${date}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiHost])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const today = new Date()
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
        <span style={{ fontSize: '32px' }}>🏋️</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando clases...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</span>
        <button onClick={fetchClasses} style={btnStyle}>Reintentar</button>
      </div>
    )
  }

  const classes = data?.classes || []
  const isArray = Array.isArray(classes)
  const hasError = classes?.error

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>🏋️ WOD</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {dayName}, {dateStr}
          </div>
        </div>
        <button onClick={fetchClasses} style={btnStyle} title="Refrescar">🔄</button>
      </div>

      {/* Classes */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {hasError ? (
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {classes.error}
            {classes.htmllen && <span style={{ color: 'var(--text-muted)' }}> (page loaded: {classes.htmllen} bytes)</span>}
          </div>
        ) : isArray && classes.length > 0 ? (
          classes.map((cls, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                fontSize: '14px', fontWeight: '700', color: 'var(--accent)',
                minWidth: '48px',
              }}>
                {cls.time || '—'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{cls.activity || 'Clase'}</div>
                {cls.coach && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coach: {cls.coach}</div>}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                padding: '2px 8px', borderRadius: '4px',
                background: cls.status?.includes('Reservado') ? 'rgba(52, 211, 153, 0.15)' : 'var(--accent-dim)',
                color: cls.status?.includes('Reservado') ? 'var(--success)' : 'var(--accent)',
              }}>
                {cls.status || ''}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No hay clases disponibles hoy
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
        Alpha Link CrossFit · AimHarder
      </div>
    </div>
  )
}

const btnStyle = {
  width: '28px', height: '28px', borderRadius: '6px',
  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
