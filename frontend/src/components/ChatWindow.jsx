import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableList, faPaperPlane, faSpinner, faFileText, faXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import MessageBubble from './MessageBubble'
import SummaryPanel from './SummaryPanel'

const API = '/api'

export default function ChatWindow({ session, apiKey, onBack }) {
  const decodeHtml = (str) => str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

  const points = (() => {
    const kp = session.key_points
    const flatten = (arr) => arr.map(p => {
      if (typeof p === 'string') return p
      if (Array.isArray(p)) return p[0]
      return p.text || p.title || p.name || ''
    }).filter(Boolean)
    if (Array.isArray(kp)) return flatten(kp)
    if (typeof kp === 'string') {
      try {
        const parsed = JSON.parse(decodeHtml(kp))
        return Array.isArray(parsed) ? flatten(parsed) : []
      } catch { return [] }
    }
    return []
  })()

  const keyPointsList = points.map(p => `- ${p}`).join('\n')

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `## Topics Covered\n\n${keyPointsList}\n\n---\n\n*Ask me anything about these topics — I can explain, quiz you, or draw diagrams!*`,
  }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const bottomRef = useRef(null)

  const fetchTranscript = async () => {
    if (transcript) { setShowTranscript(true); return }
    setTranscriptLoading(true)
    try {
      const { data } = await (await import('axios')).default.get(`${API}/learning/sessions/${session.session_id}/`)
      setTranscript(data.content_source?.transcript || 'No transcript available.')
      setShowTranscript(true)
    } catch { setTranscript('Failed to load transcript.') }
    finally { setTranscriptLoading(false) }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || streaming) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch(`${API}/content/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Groq-Api-Key': apiKey },
        body: JSON.stringify({ session_id: session.session_id, message: userMsg }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.chunk) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + json.chunk }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => { const u = [...prev]; u[u.length - 1].content = `Error: ${err.message}`; return u })
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0e0e0e' }}>

      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{ height: '56px', background: '#111', borderBottom: '1px solid #1a1a1a', paddingLeft: '80px', paddingRight: '80px' }}>
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-60" style={{ color: '#CABEFF' }}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '10px' }} />
          NEXUS
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-all duration-150 cursor-pointer"
            style={{ background: showSummary ? 'rgba(202,190,255,0.1)' : 'transparent', border: `1px solid ${showSummary ? 'rgba(202,190,255,0.25)' : '#222'}`, color: showSummary ? '#CABEFF' : '#555', borderRadius: '3px' }}
          >
            <FontAwesomeIcon icon={faTableList} style={{ fontSize: '10px' }} />
            Summary
          </button>
          <button
            onClick={fetchTranscript}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-all duration-150 cursor-pointer"
            style={{ background: showTranscript ? 'rgba(202,190,255,0.1)' : 'transparent', border: `1px solid ${showTranscript ? 'rgba(202,190,255,0.25)' : '#222'}`, color: showTranscript ? '#CABEFF' : '#555', borderRadius: '3px' }}
          >
            <FontAwesomeIcon icon={transcriptLoading ? faSpinner : faFileText} className={transcriptLoading ? 'animate-spin' : ''} style={{ fontSize: '10px' }} />
            Transcript
          </button>
        </div>
      </div>

      {/* Summary fullscreen */}
      {showSummary
        ? <SummaryPanel summary={session.summary} keyPoints={session.key_points} />
        : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={streaming && i === messages.length - 1}
                />
              ))}
              {streaming && messages[messages.length - 1]?.content === '' && (
                <div className="flex items-center gap-1.5 pl-9">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="rounded-full animate-bounce" style={{ width: '5px', height: '5px', background: '#CABEFF', animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-8 py-5 shrink-0" style={{ background: '#111', borderTop: '1px solid #1a1a1a' }}>
              <form onSubmit={sendMessage} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question, request a quiz, or say you're confused..."
                    rows={2}
                    className="w-full bg-transparent text-sm focus:outline-none resize-none pb-3 transition-all duration-200"
                    style={{ borderBottom: `1.5px solid ${input ? '#CABEFF' : '#222'}`, color: '#e7e5e4', caretColor: '#CABEFF' }}
                    onFocus={e => e.target.style.borderBottomColor = '#CABEFF'}
                    onBlur={e => e.target.style.borderBottomColor = input ? '#CABEFF' : '#222'}
                  />
                  <style>{`textarea::placeholder { color: #333; }`}</style>
                </div>
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="flex items-center justify-center w-9 h-9 transition-all duration-150 cursor-pointer disabled:opacity-30 hover:opacity-85 active:scale-95 shrink-0 mb-3"
                  style={{ background: '#CABEFF', color: '#2a00a0', borderRadius: '3px' }}
                >
                  <FontAwesomeIcon icon={streaming ? faSpinner : faPaperPlane} className={streaming ? 'animate-spin' : ''} style={{ fontSize: '12px' }} />
                </button>
              </form>
              <p className="text-[10px] mt-2 text-center" style={{ color: '#333' }}>Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )
      }

      {/* Transcript Modal */}
      {showTranscript && transcript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-2xl flex flex-col" style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '4px', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#CABEFF' }}>Full Transcript</span>
              <button onClick={() => setShowTranscript(false)} className="cursor-pointer transition-opacity hover:opacity-60" style={{ color: '#555' }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#888' }}>{transcript}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
