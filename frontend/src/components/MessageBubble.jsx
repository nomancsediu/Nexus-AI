import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faRobot, faUser } from '@fortawesome/free-solid-svg-icons'
import MermaidDiagram from './FlowChart'

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer" style={{ color: copied ? '#CABEFF' : '#444' }}>
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ fontSize: '10px' }} />
      {copied ? 'Copied' : label}
    </button>
  )
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

// ── Table helpers ──────────────────────────────────────────────────────────────

function isPipeRow(line) {
  const t = line.trim()
  return t.startsWith('|') && t.endsWith('|') && t.length > 2
}

function isPipeSeparator(line) {
  const t = line.trim()
  if (!isPipeRow(t)) return false
  return t.slice(1, -1).split('|').every(c => /^\s*:?-+:?\s*$/.test(c))
}

function parsePipeRow(line) {
  return line.trim().slice(1, -1).split('|').map(c => c.trim())
}

function isTabRow(line) {
  return line.includes('\t') && !line.trim().startsWith('|')
}

function parseTabRow(line) {
  return line.split('\t').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''))
}

function parseSeparatorAligns(sepLine) {
  const cells = isPipeRow(sepLine) ? parsePipeRow(sepLine) : parseTabRow(sepLine)
  return cells.map(c => {
    const t = c.trim()
    if (t.startsWith(':') && t.endsWith(':')) return 'center'
    if (t.endsWith(':')) return 'right'
    return 'left'
  })
}

function stripBold(text) {
  return text ? text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim() : text
}

function renderInline(text) {
  if (!text) return text
  const parts = []
  const regex = /(`[^`]+`|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*)/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>)
    const raw = m[0]
    if (raw.startsWith('`'))
      parts.push(<code key={m.index} className="px-1.5 py-0.5 text-[0.8em] font-mono" style={{ background: 'rgba(202,190,255,0.08)', color: '#CABEFF', border: '1px solid rgba(202,190,255,0.12)', borderRadius: '2px' }}>{raw.slice(1, -1)}</code>)
    else if (raw.startsWith('**'))
      parts.push(<strong key={m.index} style={{ color: '#e7e5e4', fontWeight: 700 }}>{raw.slice(2, -2)}</strong>)
    else
      parts.push(<em key={m.index} style={{ color: '#aaa' }}>{raw.slice(1, -1)}</em>)
    last = m.index + raw.length
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>)
  return parts.length ? parts : text
}

// ── Table component ────────────────────────────────────────────────────────────

function MarkdownTable({ headers, aligns, dataRows }) {
  if (!headers?.length) return null
  return (
    <div style={{ margin: '16px 0', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'block', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', width: 'max-content', tableLayout: 'auto', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: 'rgba(202,190,255,0.08)', borderBottom: '1px solid #2a2a2a' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', color: '#CABEFF', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: aligns[i] || 'left', borderRight: i < headers.length - 1 ? '1px solid #2a2a2a' : 'none', whiteSpace: 'nowrap' }}>
                {stripBold(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((cells, ri) => {
            const isEven = ri % 2 === 1
            return (
              <tr key={ri} style={{ background: isEven ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: ri < dataRows.length - 1 ? '1px solid #1e1e1e' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(202,190,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = isEven ? 'rgba(255,255,255,0.02)' : 'transparent'}
              >
                {cells.map((cell, ci) => (
                  <td key={ci} style={{ padding: '7px 12px', color: ci === 0 ? '#d4d2d1' : '#888', fontSize: '12px', textAlign: aligns[ci] || 'left', borderRight: ci < cells.length - 1 ? '1px solid #1e1e1e' : 'none', whiteSpace: 'nowrap', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={typeof cell === 'string' ? cell : ''}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Content parser ─────────────────────────────────────────────────────────────

function parseContent(content) {
  const parts = []
  const lines = content.split('\n')
  let i = 0
  let textBuffer = []

  const flushText = () => {
    if (textBuffer.length) { parts.push({ type: 'text', value: textBuffer.join('\n') }); textBuffer = [] }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      flushText()
      const lang = line.slice(3).trim() || 'text'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      parts.push({ type: 'code', lang, value: codeLines.join('\n') || '' })
      i++; continue
    }

    if (isPipeRow(line) && lines[i + 1] && isPipeSeparator(lines[i + 1])) {
      flushText()
      const headers = parsePipeRow(line)
      const aligns = parseSeparatorAligns(lines[i + 1])
      i += 2
      const dataRows = []
      while (i < lines.length && isPipeRow(lines[i])) { dataRows.push(parsePipeRow(lines[i])); i++ }
      parts.push({ type: 'table', headers, aligns, dataRows }); continue
    }

    if (isTabRow(line) && lines[i + 1] && isTabRow(lines[i + 1])) {
      flushText()
      const headers = parseTabRow(line)
      let startData = i + 1
      const aligns = new Array(headers.length).fill('left')
      if (/^[\s\-\t]+$/.test(lines[i + 1])) startData = i + 2
      i = startData
      const dataRows = []
      while (i < lines.length && isTabRow(lines[i])) { dataRows.push(parseTabRow(lines[i])); i++ }
      if (dataRows.length > 0) { parts.push({ type: 'table', headers, aligns, dataRows }); continue }
      else { textBuffer.push(line); i = startData; continue }
    }

    textBuffer.push(line); i++
  }

  flushText()
  return parts
}

// ── TextBlock ──────────────────────────────────────────────────────────────────

function TextBlock({ text }) {
  const lines = text.split('\n')
  const output = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '' || line.trim() === '---') {
      output.push(<div key={i} style={{ height: '8px' }} />)
    } else if (/^#{1,3} /.test(line)) {
      output.push(<div key={i} className="font-bold mt-4 mb-1" style={{ color: '#e7e5e4', fontSize: '0.9rem' }}>{renderInline(line.replace(/^#+\s/, ''))}</div>)
    } else if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      output.push(<div key={i} className="flex gap-2 my-0.5 pl-2"><span style={{ color: '#CABEFF' }}>•</span><span className="min-w-0 break-words">{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</span></div>)
    } else {
      output.push(<div key={i} className="my-0.5 leading-relaxed break-words">{renderInline(line)}</div>)
    }
    i++
  }
  return <div>{output}</div>
}

// ── Plain text extractor (for copy) ───────────────────────────────────────────

function extractPlainText(content) {
  return content
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s/gm, '')
    .trim()
}

// ── MessageBubble ──────────────────────────────────────────────────────────────

const MessageBubble = memo(({ role, content, isStreaming }) => {
  const isUser = role === 'user'
  const decoded = decodeHtml(content || '')
  const parts = isUser ? null : parseContent(decoded)
  const [showCopy, setShowCopy] = useState(false)

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      <div
        className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
        style={{ background: isUser ? '#CABEFF' : '#161616', border: isUser ? 'none' : '1px solid #1e1e1e', borderRadius: '3px' }}
      >
        <FontAwesomeIcon icon={isUser ? faUser : faRobot} style={{ fontSize: '10px', color: isUser ? '#2a00a0' : '#CABEFF' }} />
      </div>

      <div
        className="min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed"
        style={{
          background: isUser ? 'rgba(202,190,255,0.07)' : '#111',
          border: `1px solid ${isUser ? 'rgba(202,190,255,0.15)' : '#1a1a1a'}`,
          color: '#d4d2d1',
          borderRadius: '3px',
          minWidth: 0,
          width: isUser ? 'fit-content' : '100%',
          maxWidth: isUser ? '85%' : '100%',
          position: 'relative',
        }}
      >
        {/* Copy text button — top right on hover */}
        {!isUser && !isStreaming && (
          <div
            className="absolute top-2 right-2 transition-opacity duration-150"
            style={{ opacity: showCopy ? 1 : 0, pointerEvents: showCopy ? 'auto' : 'none' }}
          >
            <CopyButton text={extractPlainText(decoded)} label="Copy" />
          </div>
        )}

        {isUser ? (
          <span className="whitespace-pre-wrap break-words">{content}</span>
        ) : (
          <div className="min-w-0">
            {parts.map((part, i) =>
              part.type === 'code' ? (
                part.lang === 'mermaid' ? (
                  <MermaidDiagram key={i} code={part.value || ''} />
                ) : (
                  <div key={i} className="my-3 overflow-hidden" style={{ border: '1px solid #1e1e1e', borderRadius: '3px' }}>
                    <div className="flex items-center px-3 sm:px-4 py-2" style={{ background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
                      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{part.lang}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <SyntaxHighlighter
                        language={part.lang || 'text'}
                        style={oneDark}
                        customStyle={{ margin: 0, borderRadius: 0, background: '#0a0a0a', fontSize: '0.7rem' }}
                        showLineNumbers={(part.value || '').split('\n').length > 4}
                      >
                        {part.value || ''}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )
              ) : part.type === 'table' ? (
                <MarkdownTable key={i} headers={part.headers} aligns={part.aligns} dataRows={part.dataRows} />
              ) : (
                <TextBlock key={i} text={part.value || ''} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageBubble
