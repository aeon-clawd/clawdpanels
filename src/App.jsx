import { useState } from 'react'
import Dashboard from './components/Dashboard'
import WidgetPicker from './components/WidgetPicker'
import { LayoutProvider } from './context/LayoutContext'
import { WidgetRegistryProvider } from './context/WidgetRegistryContext'
import './App.css'

function App() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  return (
    <WidgetRegistryProvider>
      <LayoutProvider>
        <div className="app">
          <header className="app-header">
            <div className="header-left">
              <h1 className="app-title">
                <span className="logo">⬡</span> ClawdPanels
              </h1>
            </div>
            <div className="header-right">
              <button 
                className={`header-btn ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}
                title="Edit layout"
              >
                {editMode ? '✓ Done' : '✏️ Edit'}
              </button>
              <button 
                className="header-btn"
                onClick={() => setPickerOpen(!pickerOpen)}
                title="Add widget"
              >
                + Add Widget
              </button>
            </div>
          </header>

          <main className="app-main">
            <Dashboard editMode={editMode} />
            
            {pickerOpen && (
              <WidgetPicker 
                onClose={() => setPickerOpen(false)} 
              />
            )}
          </main>
        </div>
      </LayoutProvider>
    </WidgetRegistryProvider>
  )
}

export default App
