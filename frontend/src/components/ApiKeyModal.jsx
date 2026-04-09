import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faArrowRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

export default function ApiKeyModal({ onSave, onClose, initialGroq = '', initialSupadata = '' }) {
  const [groqKey, setGroqKey] = useState(initialGroq)
  const [supadataKey, setSupadataKey] = useState(initialSupadata)
  const [showGroq, setShowGroq] = useState(false)
  const [showSupadata, setShowSupadata] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!groqKey.trim().startsWith('gsk_')) { setError('Invalid Groq key — must start with gsk_'); return }
    if (!supadataKey.trim()) { setError('Supadata API key is required'); return }
    localStorage.setItem('groq_api_key', groqKey.trim())
    localStorage.setItem('supadata_api_key', supadataKey.trim())
    onSave(groqKey.trim(), supadataKey.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-8 cursor-pointer hover:opacity-60 transition-opacity" style={{ color: '#555', fontSize: '18px' }}>✕</button>
      )}
      <div className="w-full max-w-md px-8">
        <div className="mb-10">
          <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ background: 'rgba(202,190,255,0.1)', border: '1px solid rgba(202,190,255,0.2)', borderRadius: '3px' }}>
            <FontAwesomeIcon icon={faKey} style={{ color: '#CABEFF', fontSize: '16px' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#e7e5e4' }}>API Keys</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#555' }}>Keys are stored locally and never sent to any server other than their respective services.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {[{
            label: 'Groq API Key',
            value: groqKey, setValue: setGroqKey,
            show: showGroq, setShow: setShowGroq,
            placeholder: 'gsk_...',
            link: 'https://console.groq.com/keys', linkText: 'Get free key →'
          }, {
            label: 'Supadata API Key',
            value: supadataKey, setValue: setSupadataKey,
            show: showSupadata, setShow: setShowSupadata,
            placeholder: 'your supadata key...',
            link: 'https://supadata.ai', linkText: 'Get free key →'
          }].map(({ label, value, setValue, show, setShow, placeholder, link, linkText }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>{label}</span>
                <a href={link} target="_blank" rel="noreferrer" className="text-xs underline hover:opacity-80" style={{ color: '#CABEFF' }}>{linkText}</a>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError('') }}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-sm focus:outline-none pb-3 pr-10 transition-all duration-200"
                  style={{ borderBottom: `1.5px solid ${value ? '#CABEFF' : '#2a2a2a'}`, color: '#e7e5e4', caretColor: '#CABEFF' }}
                  onFocus={e => e.target.style.borderBottomColor = '#CABEFF'}
                  onBlur={e => e.target.style.borderBottomColor = value ? '#CABEFF' : '#2a2a2a'}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-0 bottom-3 cursor-pointer hover:opacity-60" style={{ color: '#555' }}>
                  <FontAwesomeIcon icon={show ? faEyeSlash : faEye} style={{ fontSize: '13px' }} />
                </button>
              </div>
            </div>
          ))}

          {error && <p className="text-xs" style={{ color: '#e8856a' }}>{error}</p>}

          <button
            type="submit"
            disabled={!groqKey.trim() || !supadataKey.trim()}
            className="flex items-center gap-3 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-150 cursor-pointer disabled:opacity-30 hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#CABEFF', color: '#2a00a0', borderRadius: '3px' }}
          >
            Save <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '11px' }} />
          </button>
        </form>
      </div>
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(202,190,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
    </div>
  )
}
