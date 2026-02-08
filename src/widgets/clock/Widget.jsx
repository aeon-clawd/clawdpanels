import { useState, useEffect } from 'react'

export default function ClockWidget({ config }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !config.format24h,
    ...(config.timezone && config.timezone !== 'local' ? { timeZone: config.timezone } : {}),
  }

  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(config.timezone && config.timezone !== 'local' ? { timeZone: config.timezone } : {}),
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      gap: '8px',
    }}>
      <div style={{ 
        fontSize: '36px', 
        fontWeight: '700',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '2px',
        color: 'var(--text-primary)',
      }}>
        {time.toLocaleTimeString(undefined, options)}
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--text-secondary)',
      }}>
        {time.toLocaleDateString(undefined, dateOptions)}
      </div>
      {config.timezone && config.timezone !== 'local' && (
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          marginTop: '4px',
        }}>
          {config.timezone}
        </div>
      )}
    </div>
  )
}
