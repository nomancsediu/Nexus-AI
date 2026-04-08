import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'

export default function SummaryPanel({ summary, keyPoints }) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5" style={{ background: '#111' }}>
      <div>
        <div className="text-[9px] uppercase tracking-[0.25em] mb-2.5 font-semibold" style={{ color: '#CABEFF' }}>Summary</div>
        <p className="text-sm leading-relaxed" style={{ color: '#888' }}>{summary}</p>
      </div>

      {keyPoints?.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] mb-3 font-semibold" style={{ color: '#CABEFF' }}>Key Points</div>
          <ul className="grid grid-cols-1 gap-1.5">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-xs px-3 py-2.5" style={{ background: '#161616', border: '1px solid #1e1e1e', color: '#888', borderRadius: '3px' }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#CABEFF', fontSize: '11px', marginTop: '1px', flexShrink: 0 }} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
