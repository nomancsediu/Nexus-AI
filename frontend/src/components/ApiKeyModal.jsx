import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faArrowRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!key.trim().startsWith('gsk_')) {
      setError('Invalid key — Groq API keys start with gsk_')
      return
    }
    localStorage.setItem('groq_api_key', key.trim())
    onSave(key.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      <div className="w-full max-w-md px-8">

        <div className="mb-10">
          <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ background: 'rgba(202,190,255,0.1)', border: '1px solid rgba(202,190,255,0.2)', borderRadius: '3px' }}>
            <FontAwesomeIcon icon={faKey} style={{ color: '#CABEFF', fontSize: '16px' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#e7e5e4' }}>Enter your Groq API Key</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
            Your key is stored locally in your browser and never sent to any server other than Groq.{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline hover:opacity-80 transition-opacity" style={{ color: '#CABEFF' }}>
              Get a free key →
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
              placeholder="gsk_..."
              className="w-full bg-transparent text-sm focus:outline-none pb-3 pr-10 transition-all duration-200"
              style={{
                borderBottom: `1.5px solid ${error ? '#e8856a' : key ? '#CABEFF' : '#2a2a2a'}`,
                color: '#e7e5e4',
                caretColor: '#CABEFF',
              }}
              onFocus={e => e.target.style.borderBottomColor = error ? '#e8856a' : '#CABEFF'}
              onBlur={e => e.target.style.borderBottomColor = error ? '#e8856a' : key ? '#CABEFF' : '#2a2a2a'}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-0 bottom-3 cursor-pointer transition-opacity hover:opacity-60"
              style={{ color: '#555' }}
            >
              <FontAwesomeIcon icon={show ? faEyeSlash : faEye} style={{ fontSize: '13px' }} />
            </button>
            <style>{`input::placeholder { color: #333; }`}</style>
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#e8856a' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!key.trim()}
            className="flex items-center gap-3 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-150 cursor-pointer disabled:opacity-30 hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#CABEFF', color: '#2a00a0', borderRadius: '3px' }}
          >
            Continue
            <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '11px' }} />
          </button>
        </form>
      </div>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(202,190,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
    </div>
  )
}
