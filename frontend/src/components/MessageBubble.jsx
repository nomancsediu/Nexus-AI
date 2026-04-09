import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faRobot, faUser } from '@fortawesome/free-solid-svg-icons'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer" style={{ color: copied ? '#CABEFF' : '#444' }}>
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ fontSize: '10px' }} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function parseContent(content) {
  const parts = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let last = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: content.slice(last, match.index) })
    }
    parts.push({ type: 'code', lang: match[1] || 'text', value: match[2] })
    last = match.index + match[0].length
  }

  if (last < content.length) {
    parts.push({ type: 'text', value: content.slice(last) })
  }

  return parts
}

function TextBlock({ text }) {
  // bold **text**, inline `code`, newlines
  const lines = text.split('\n')
  return (
    <div>
      {lines.map((line, i) => {
        if (line.trim() === '' || line.trim() === '---') {
          return <div key={i} style={{ height: '8px' }} />
        }

        const parts = []
        const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
        let last = 0
        let m

        while ((m = regex.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={last}>{line.slice(last, m.index)}</span>)
          const raw = m[0]
          if (raw.startsWith('`')) {
            parts.push(
              <code key={m.index} className="px-1.5 py-0.5 text-[0.8em] font-mono" style={{ background: 'rgba(202,190,255,0.08)', color: '#CABEFF', border: '1px solid rgba(202,190,255,0.12)', borderRadius: '2px' }}>
                {raw.slice(1, -1)}
              </code>
            )
          } else if (raw.startsWith('**')) {
            parts.push(<strong key={m.index} style={{ color: '#e7e5e4' }}>{raw.slice(2, -2)}</strong>)
          } else {
            parts.push(<em key={m.index} style={{ color: '#aaa' }}>{raw.slice(1, -1)}</em>)
          }
          last = m.index + raw.length
        }

        if (last < line.length) parts.push(<span key={last}>{line.slice(last)}</span>)

        const isHeading = line.startsWith('## ') || line.startsWith('### ') || line.startsWith('# ')
        const isBullet = line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')

        if (isHeading) {
          const text = line.replace(/^#+\s/, '')
          return <div key={i} className="font-bold mt-4 mb-1" style={{ color: '#e7e5e4', fontSize: '0.9rem' }}>{text}</div>
        }

        if (isBullet) {
          const bulletText = line.replace(/^\s*[-*]\s+/, '')
          const bParts = []
          const bRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
          let bLast = 0, bm
          while ((bm = bRegex.exec(bulletText)) !== null) {
            if (bm.index > bLast) bParts.push(<span key={bLast}>{bulletText.slice(bLast, bm.index)}</span>)
            const r = bm[0]
            if (r.startsWith('`')) bParts.push(<code key={bm.index} className="px-1.5 py-0.5 text-[0.8em] font-mono" style={{ background: 'rgba(202,190,255,0.08)', color: '#CABEFF', border: '1px solid rgba(202,190,255,0.12)', borderRadius: '2px' }}>{r.slice(1, -1)}</code>)
            else if (r.startsWith('**')) bParts.push(<strong key={bm.index} style={{ color: '#e7e5e4' }}>{r.slice(2, -2)}</strong>)
            else bParts.push(<em key={bm.index} style={{ color: '#aaa' }}>{r.slice(1, -1)}</em>)
            bLast = bm.index + r.length
          }
          if (bLast < bulletText.length) bParts.push(<span key={bLast}>{bulletText.slice(bLast)}</span>)
          return (
            <div key={i} className="flex gap-2 my-0.5 pl-2">
              <span style={{ color: '#CABEFF' }}>•</span>
              <span>{bParts.length ? bParts : bulletText}</span>
            </div>
          )
        }

        return <div key={i} className="my-0.5 leading-relaxed">{parts.length ? parts : line}</div>
      })}
    </div>
  )
}

const MessageBubble = memo(({ role, content, isStreaming }) => {
  const isUser = role === 'user'
  const decoded = decodeHtml(content)
  const parts = isUser ? null : parseContent(decoded)

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className="shrink-0 w-7 h-7 flex items-center justify-center"
        style={{ background: isUser ? '#CABEFF' : '#161616', border: isUser ? 'none' : '1px solid #1e1e1e', borderRadius: '3px', flexShrink: 0 }}
      >
        <FontAwesomeIcon icon={isUser ? faUser : faRobot} style={{ fontSize: '11px', color: isUser ? '#2a00a0' : '#CABEFF' }} />
      </div>

      <div
        className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
        style={{ background: isUser ? 'rgba(202,190,255,0.07)' : '#111', border: `1px solid ${isUser ? 'rgba(202,190,255,0.15)' : '#1a1a1a'}`, color: '#d4d2d1', borderRadius: '3px' }}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <div>
            {parts.map((part, i) =>
              part.type === 'code' ? (
                <div key={i} className="my-3 overflow-hidden" style={{ border: '1px solid #1e1e1e', borderRadius: '3px' }}>
                  <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{part.lang}</span>
                    <CopyButton text={part.value} />
                  </div>
                  <SyntaxHighlighter
                    language={part.lang || 'text'}
                    style={oneDark}
                    customStyle={{ margin: 0, borderRadius: 0, background: '#0a0a0a', fontSize: '0.72rem' }}
                    showLineNumbers={part.value.split('\n').length > 4}
                  >
                    {part.value}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <TextBlock key={i} text={part.value} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageBubble
