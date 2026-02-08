import { useState, useEffect } from 'react'

export default function WeatherWidget({ config }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        const city = config.city || 'Madrid'
        const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
        if (!res.ok) throw new Error('Weather API error')
        const data = await res.json()
        setWeather(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10 min
    return () => clearInterval(interval)
  }, [config.city])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!weather) return null

  const current = weather.current_condition?.[0]
  const area = weather.nearest_area?.[0]
  const forecast = weather.weather?.[0]

  const weatherEmoji = getWeatherEmoji(current?.weatherCode)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '40px' }}>{weatherEmoji}</span>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {current?.temp_C}°C
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {current?.weatherDesc?.[0]?.value}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '8px',
        fontSize: '12px',
      }}>
        <InfoBox label="Feels like" value={`${current?.FeelsLikeC}°`} />
        <InfoBox label="Humidity" value={`${current?.humidity}%`} />
        <InfoBox label="Wind" value={`${current?.windspeedKmph} km/h`} />
      </div>

      {forecast && (
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>↓ {forecast.mintempC}°</span>
          <span>↑ {forecast.maxtempC}°</span>
          <span>{area?.areaName?.[0]?.value}</span>
        </div>
      )}
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      padding: '8px',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      height: '100%', color: 'var(--text-muted)', fontSize: '13px' 
    }}>
      Loading weather...
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      height: '100%', color: 'var(--danger)', fontSize: '13px' 
    }}>
      ⚠️ {message}
    </div>
  )
}

function getWeatherEmoji(code) {
  const c = parseInt(code)
  if (c === 113) return '☀️'
  if (c === 116) return '⛅'
  if (c === 119 || c === 122) return '☁️'
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(c)) return '🌧️'
  if ([179, 323, 326, 329, 332, 335, 338, 368, 371].includes(c)) return '🌨️'
  if ([200, 386, 389, 392, 395].includes(c)) return '⛈️'
  if ([227, 230].includes(c)) return '❄️'
  if ([143, 248, 260].includes(c)) return '🌫️'
  return '🌤️'
}
