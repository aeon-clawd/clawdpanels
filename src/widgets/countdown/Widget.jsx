import { useState, useEffect } from 'react'

export default function CountdownWidget({ config }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // update every minute
    return () => clearInterval(timer)
  }, [])

  const targetDate = config.targetDate ? new Date(config.targetDate) : null

  if (!targetDate || isNaN(targetDate.getTime())) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        Set a target date in widget settings ⚙️
      </div>
    )
  }

  const diff = targetDate.getTime() - now.getTime()
  const isPast = diff < 0
  const absDiff = Math.abs(diff)

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '12px',
    }}>
      <div style={{ fontSize: '32px' }}>{config.emoji || '🎯'}</div>
      
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        {config.title || 'Countdown'}
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'baseline',
      }}>
        <TimeUnit value={days} label="days" />
        <TimeUnit value={hours} label="hrs" />
        <TimeUnit value={minutes} label="min" />
      </div>

      <div style={{
        fontSize: '11px',
        color: isPast ? 'var(--danger)' : 'var(--text-muted)',
      }}>
        {isPast ? 'ago' : targetDate.toLocaleDateString(undefined, { 
          month: 'long', day: 'numeric', year: 'numeric' 
        })}
      </div>
    </div>
  )
}

function TimeUnit({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-primary)',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginTop: '4px',
      }}>
        {label}
      </div>
    </div>
  )
}
