import { useState } from 'react'
import ContentInput from './components/ContentInput'
import ChatWindow from './components/ChatWindow'
import ApiKeyModal from './components/ApiKeyModal'

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '')
  const [supadataKey, setSupadataKey] = useState(() => localStorage.getItem('supadata_api_key') || '')
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('current_session')
    return saved ? JSON.parse(saved) : null
  })
  const [showSettings, setShowSettings] = useState(false)

  const handleSessionSet = (data) => {
    const { transcript, chat_context, ...meta } = data
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}')
    sessions[data.source_url] = meta
    localStorage.setItem('sessions', JSON.stringify(sessions))
    localStorage.setItem('current_session', JSON.stringify(data))
    setSession(data)
  }

  const handleBack = () => {
    setSession(null)
  }

  const handleSaveKeys = (groq, supadata) => {
    setApiKey(groq)
    setSupadataKey(supadata)
    setShowSettings(false)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e0e0e', color: '#e7e5e4' }}>
      <main className="flex-1 flex flex-col overflow-hidden">
        {session
          ? <ChatWindow session={session} apiKey={apiKey} onBack={handleBack} onSettings={() => setShowSettings(true)} />
          : <ContentInput
              onProcessed={handleSessionSet}
              apiKey={apiKey}
              supadataKey={supadataKey}
              onSettings={() => setShowSettings(true)}
              onNeedKeys={() => setShowSettings(true)}
            />
        }
      </main>
      {showSettings && (
        <ApiKeyModal
          onSave={handleSaveKeys}
          onClose={apiKey && supadataKey ? () => setShowSettings(false) : null}
          initialGroq={apiKey}
          initialSupadata={supadataKey}
        />
      )}
    </div>
  )
}
