import { useState } from 'react'

const SAMPLE_POSITIONS = [
  { name: 'S&P 500', value: 987.83, cost: 1000, emoji: '🇺🇸' },
  { name: 'MSCI China', value: 935.50, cost: 1000, emoji: '🇨🇳' },
  { name: 'Physical Gold', value: 632.63, cost: 500, emoji: '🥇' },
  { name: 'Brent Crude Oil', value: 496, cost: 498, emoji: '🛢️' },
  { name: 'Long JPY/EUR', value: 100.38, cost: 100, emoji: '🇯🇵' },
  { name: 'Bitcoin', value: 326.95, cost: 300, emoji: '₿' },
  { name: 'Cash @2%', value: 2546.84, cost: 2546.84, emoji: '💵' },
]

export default function PortfolioWidget({ config }) {
  let positions = SAMPLE_POSITIONS
  
  try {
    if (config.positions && config.positions !== '[]') {
      const parsed = JSON.parse(config.positions)
      if (Array.isArray(parsed) && parsed.length > 0) {
        positions = parsed
      }
    }
  } catch {}

  const totalValue = positions.reduce((sum, p) => sum + p.value, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.cost, 0)
  const totalReturn = ((totalValue - totalCost) / totalCost * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Total */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'baseline',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
            TOTAL VALUE
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>
            €{totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: totalReturn >= 0 ? 'var(--success)' : 'var(--danger)',
        }}>
          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
        </div>
      </div>

      {/* Positions */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {positions.map((pos, i) => {
          const pct = ((pos.value - pos.cost) / pos.cost * 100)
          const allocation = (pos.value / totalValue * 100)
          
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              fontSize: '13px',
            }}>
              <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>
                {pos.emoji || '📊'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '500', 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {pos.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {allocation.toFixed(1)}% of portfolio
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                  €{pos.value.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: pct >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
