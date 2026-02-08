import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ChatPanel from './components/ChatPanel'
import WidgetPicker from './components/WidgetPicker'
import { LayoutProvider } from './context/LayoutContext'
import { WidgetRegistryProvider } from './context/WidgetRegistryContext'
import { ClawdbotProvider } from './context/ClawdbotContext'
import './App.css'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  return (
    <ClawdbotProvider>
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
                <button 
                  className={`header-btn chat-btn ${chatOpen ? 'active' : ''}`}
                  onClick={() => setChatOpen(!chatOpen)}
                  title="Widget Creator Agent"
                >
                  💬 Agent
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
              
              {chatOpen && (
                <ChatPanel 
                  onClose={() => setChatOpen(false)} 
                />
              )}
            </main>
          </div>
        </LayoutProvider>
      </WidgetRegistryProvider>
    </ClawdbotProvider>
  )
}

export default App
