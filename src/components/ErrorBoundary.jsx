import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: '16px', textAlign: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '24px' }}>💥</span>
          <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: '600' }}>Widget Error</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
            {this.state.error?.message || 'Unknown error'}
          </span>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '4px', padding: '4px 12px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', borderRadius: '6px',
              color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
