import { useState, useEffect, useCallback } from 'react'

export default function ServicesWidget({ config }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const apiHost = config.apiHost || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8092` : 'http://localhost:8092')
  const refreshInterval = parseInt(config.refreshInterval) || 30

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${apiHost}/api/services`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiHost])

  useEffect(() => {
    fetchServices()
    const interval = setInterval(fetchServices, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchServices, refreshInterval])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading services...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
        <span style={{ color: 'var(--danger)', fontSize: '13px' }}>⚠️ {error}</span>
        <button onClick={fetchServices} style={refreshBtnStyle}>Retry</button>
      </div>
    )
  }

  const { services, summary } = data
  const allHealthy = summary.stopped === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: allHealthy ? 'var(--success)' : 'var(--danger)',
            boxShadow: `0 0 8px ${allHealthy ? 'var(--success)' : 'var(--danger)'}`,
          }} />
          <span style={{ fontSize: '20px', fontWeight: '700' }}>
            {summary.running}<span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}>/{summary.total}</span>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>running</span>
        </div>
        <button onClick={fetchServices} style={refreshBtnStyle} title="Refresh now">
          🔄
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(summary.running / summary.total) * 100}%`,
          background: allHealthy ? 'var(--success)' : 'var(--warning)',
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Service list */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {services.map((svc, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 8px', borderRadius: '6px',
            background: svc.status === 'stopped' ? 'rgba(248, 113, 113, 0.08)' : 'transparent',
            fontSize: '12px',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background: svc.status === 'running' ? 'var(--success)' : 'var(--danger)',
            }} />
            <span style={{
              flex: 1, fontWeight: svc.status === 'stopped' ? '600' : '400',
              color: svc.status === 'stopped' ? 'var(--danger)' : 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {svc.name}
            </span>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}>
              {svc.type}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: '10px', color: 'var(--text-muted)',
        display: 'flex', justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)', paddingTop: '6px',
      }}>
        <span>Every {refreshInterval}s</span>
        <span>{lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}</span>
      </div>
    </div>
  )
}

const refreshBtnStyle = {
  width: '28px', height: '28px', borderRadius: '6px',
  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
