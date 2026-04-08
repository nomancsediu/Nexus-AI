import { useState } from 'react'
import ContentInput from './components/ContentInput'
import ChatWindow from './components/ChatWindow'
import ApiKeyModal from './components/ApiKeyModal'

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '')
  const [session, setSession] = useState(null)

  if (!apiKey) return <ApiKeyModal onSave={setApiKey} />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e0e0e', color: '#e7e5e4' }}>
      <main className="flex-1 flex flex-col overflow-hidden">
        {session
          ? <ChatWindow session={session} apiKey={apiKey} onBack={() => setSession(null)} />
          : <ContentInput onProcessed={setSession} apiKey={apiKey} />
        }
      </main>
    </div>
  )
}
