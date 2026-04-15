import { useState } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faFileLines, faArrowRight, faSpinner, faGear } from '@fortawesome/free-solid-svg-icons'

const API = import.meta.env.VITE_API_URL || '/api'

export default function ContentInput({ onProcessed, apiKey, supadataKey, onSettings, onNeedKeys }) {
  const [sourceType, setSourceType] = useState('youtube')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!apiKey || !supadataKey) { onNeedKeys(); return }

    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}')
    if (sourceType === 'youtube' && sessions[input]) {
      const { data } = await axios.post(`${API}/content/process/`, { source_type: 'youtube', source_url: input }, {
        headers: { 'X-Groq-Api-Key': apiKey, 'X-Supadata-Api-Key': supadataKey },
      })
      onProcessed({ ...data, source_url: input })
      return
    }

    setLoading(true)
    try {
      const payload = sourceType === 'youtube'
        ? { source_type: 'youtube', source_url: input }
        : { source_type: 'text', raw_text: input }
      const { data } = await axios.post(`${API}/content/process/`, payload, {
        headers: { 'X-Groq-Api-Key': apiKey, 'X-Supadata-Api-Key': supadataKey },
      })
      onProcessed({ ...data, source_url: input })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4" style={{ background: '#0e0e0e' }}>
      <div className="flex flex-col items-center gap-5 w-full max-w-xs text-center">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="rounded-full animate-bounce" style={{ width: '6px', height: '6px', background: '#CABEFF', animationDelay: `${delay}ms`, display: 'inline-block' }} />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold mb-1.5" style={{ color: '#e7e5e4' }}>Analyzing content</p>
          <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
            {sourceType === 'youtube'
              ? 'Fetching transcript and running AI analysis. Longer videos may take 30–60 seconds.'
              : 'Running AI analysis on your text...'}
          </p>
        </div>
        <div className="w-40 h-px overflow-hidden" style={{ background: '#1a1a1a' }}>
          <div className="h-full animate-pulse" style={{ background: '#CABEFF', width: '60%', borderRadius: '99px' }} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0e0e0e' }}>

      {/* Topbar */}
      <header className="flex items-center justify-between shrink-0 px-4 sm:px-8 md:px-14 lg:px-20" style={{ height: '56px', borderBottom: '1px solid #1a1a1a' }}>
        <div className="text-sm font-black tracking-[0.15em] uppercase" style={{ color: '#e7e5e4', letterSpacing: '0.18em' }}>NEXUS</div>
        <button onClick={onSettings} className="cursor-pointer hover:opacity-60 transition-opacity p-1" style={{ color: '#555' }}>
          <FontAwesomeIcon icon={faGear} style={{ fontSize: '14px' }} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center py-8 sm:py-10 px-4 sm:px-8 md:px-14 lg:px-20">
        <div className="w-full max-w-2xl">

          {/* Headline */}
          <div className="mb-8 sm:mb-12 md:mb-14">
            <p className="text-xs uppercase tracking-[0.3em] mb-4 sm:mb-6 font-medium" style={{ color: '#555' }}>AI-Powered Learning</p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem]"
              style={{ lineHeight: 1.08, fontWeight: 800, letterSpacing: '-0.03em', color: '#e7e5e4' }}
            >
              What do you want<br />
              to <span style={{ color: '#CABEFF' }}>learn</span> today?
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 sm:mb-8 p-1 w-fit" style={{ background: '#161616', borderRadius: '4px', border: '1px solid #1e1e1e' }}>
            {[
              { type: 'youtube', label: 'YouTube URL', icon: faYoutube },
              { type: 'text', label: 'Text / Article', icon: faFileLines },
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => { setSourceType(type); setInput('') }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: sourceType === type ? '#CABEFF' : 'transparent',
                  color: sourceType === type ? '#2a00a0' : '#555',
                  borderRadius: '3px',
                }}
              >
                <FontAwesomeIcon icon={icon} style={{ fontSize: '11px' }} />
                <span className="hidden xs:inline sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="relative mb-5 sm:mb-6">
              {sourceType === 'youtube' ? (
                <input
                  type="url"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter YouTube URL..."
                  className="w-full bg-transparent text-base sm:text-lg md:text-xl font-light focus:outline-none transition-all duration-300 pb-4"
                  style={{
                    borderBottom: `1.5px solid ${input ? '#CABEFF' : '#2a2a2a'}`,
                    color: '#e7e5e4',
                    caretColor: '#CABEFF',
                  }}
                  onFocus={e => e.target.style.borderBottomColor = '#CABEFF'}
                  onBlur={e => e.target.style.borderBottomColor = input ? '#CABEFF' : '#2a2a2a'}
                  required
                />
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your article, blog post, or any text here..."
                  rows={4}
                  className="w-full bg-transparent text-sm sm:text-base font-light focus:outline-none transition-all duration-300 pb-4 resize-none"
                  style={{
                    borderBottom: `1.5px solid ${input ? '#CABEFF' : '#2a2a2a'}`,
                    color: '#e7e5e4',
                    caretColor: '#CABEFF',
                  }}
                  onFocus={e => e.target.style.borderBottomColor = '#CABEFF'}
                  onBlur={e => e.target.style.borderBottomColor = input ? '#CABEFF' : '#2a2a2a'}
                  required
                />
              )}
              <style>{`input::placeholder, textarea::placeholder { color: #333; }`}</style>
            </div>

            {error && (
              <div className="mb-5 sm:mb-6 px-4 py-3 text-xs" style={{ background: 'rgba(232,133,106,0.08)', border: '1px solid rgba(232,133,106,0.2)', color: '#e8856a', borderRadius: '3px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#CABEFF', color: '#2a00a0', borderRadius: '3px' }}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Start Learning
                  <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '12px' }} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p className="text-[11px]" style={{ color: '#444' }}>
          Developed by{' '}
          <a
            href="https://abdnoman.com"
            target="_blank"
            rel="noreferrer"
            className="transition-opacity hover:opacity-80"
            style={{ color: '#CABEFF' }}
          >
            Abdullah Al Noman
          </a>
        </p>
      </footer>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(202,190,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(110,68,255,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>
    </div>
  )
}
