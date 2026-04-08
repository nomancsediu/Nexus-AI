import { useEffect, useState } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash, faFilm, faFileLines, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

const API = '/api'

export default function Sidebar({ onNewSession, currentSessionId }) {
  const [sessions, setSessions] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  const fetchSessions = () => {
    axios.get(`${API}/learning/sessions/`).then(({ data }) => setSessions(data)).catch(() => {})
  }

  useEffect(() => { fetchSessions() }, [currentSessionId])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await axios.delete(`${API}/learning/sessions/${id}/`)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (id === currentSessionId) onNewSession()
    } catch {}
    finally { setDeletingId(null) }
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full" style={{ background: '#0a0a0a', borderRight: '1px solid #1a1a1a' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#CABEFF', color: '#2a00a0', borderRadius: '3px' }}
        >
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: '10px' }} />
          New Session
        </button>
      </div>

      <div className="mx-5 mb-4" style={{ height: '1px', background: '#1a1a1a' }} />

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="text-[9px] uppercase tracking-[0.2em] mb-3 px-2 font-semibold" style={{ color: '#3a3a3a' }}>
          Sessions
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-10">
            <div className="text-xs" style={{ color: '#333' }}>No sessions yet</div>
          </div>
        )}

        <div className="space-y-0.5">
          {sessions.map((s) => {
            const isActive = s.id === currentSessionId
            const isYT = s.content_source__source_type === 'youtube'
            return (
              <div
                key={s.id}
                className="group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(202,190,255,0.07)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? '#7c5cfc' : 'transparent'}`,
                  borderRadius: '0 3px 3px 0',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FontAwesomeIcon
                    icon={isYT ? faFilm : faFileLines}
                    style={{ fontSize: '10px', color: isActive ? '#CABEFF' : '#444', flexShrink: 0 }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: isActive ? '#CABEFF' : '#777' }}>
                      Session #{s.id}
                    </div>
                    {s.weak_points?.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '9px', color: '#e8856a' }} />
                        <span className="text-[10px]" style={{ color: '#e8856a' }}>
                          {s.weak_points.length} weak point{s.weak_points.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deletingId === s.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                  style={{ color: '#444' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e8856a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '10px' }} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
