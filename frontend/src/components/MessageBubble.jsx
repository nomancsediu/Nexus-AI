import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faRobot, faUser } from '@fortawesome/free-solid-svg-icons'
import MermaidDiagram from './FlowChart'

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
  // Fix: use [\s\S]+? to match bold/italic across any chars including spaces
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
    <div className="my-4 w-full rounded" style={{ border: '1px solid #2a2a2a', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'block' }}>
      <table className="border-collapse" style={{ width: '100%', minWidth: 'max-content', tableLayout: 'auto', fontSize: 'clamp(10px, 2vw, 13px)' }}>
        <thead>
          <tr style={{ background: 'rgba(202,190,255,0.08)', borderBottom: '1px solid #2a2a2a' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                style={{
                  color: '#CABEFF',
                  textAlign: aligns[i] || 'left',
                  borderRight: i < headers.length - 1 ? '1px solid #2a2a2a' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {stripBold(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((cells, ri) => {
            const isEven = ri % 2 === 1
            return (
              <tr
                key={ri}
                style={{
                  background: isEven ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: ri < dataRows.length - 1 ? '1px solid #1e1e1e' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(202,190,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = isEven ? 'rgba(255,255,255,0.02)' : 'transparent'}
              >
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs"
                    style={{
                      color: ci === 0 ? '#d4d2d1' : '#888',
                      textAlign: aligns[ci] || 'left',
                      borderRight: ci < cells.length - 1 ? '1px solid #1e1e1e' : 'none',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                    }}
                  >
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
    if (textBuffer.length) {
      parts.push({ type: 'text', value: textBuffer.join('\n') })
      textBuffer = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      flushText()
      const lang = line.slice(3).trim() || 'text'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      parts.push({ type: 'code', lang, value: codeLines.join('\n') || '' })
      i++
      continue
    }

    // Pipe table
    if (isPipeRow(line) && lines[i + 1] && isPipeSeparator(lines[i + 1])) {
      flushText()
      const headers = parsePipeRow(line)
      const aligns = parseSeparatorAligns(lines[i + 1])
      i += 2
      const dataRows = []
      while (i < lines.length && isPipeRow(lines[i])) {
        dataRows.push(parsePipeRow(lines[i]))
        i++
      }
      parts.push({ type: 'table', headers, aligns, dataRows })
      continue
    }

    // Tab-separated table (header row followed by data rows with tabs)
    if (isTabRow(line) && lines[i + 1] && isTabRow(lines[i + 1])) {
      flushText()
      const headers = parseTabRow(line)
      // check if next line is a separator (---)
      let startData = i + 1
      const aligns = new Array(headers.length).fill('left')
      if (/^[\s\-\t]+$/.test(lines[i + 1])) startData = i + 2
      i = startData
      const dataRows = []
      while (i < lines.length && isTabRow(lines[i])) {
        dataRows.push(parseTabRow(lines[i]))
        i++
      }
      if (dataRows.length > 0) {
        parts.push({ type: 'table', headers, aligns, dataRows })
        continue
      } else {
        // not enough rows, treat as text
        textBuffer.push(line)
        i = startData
        continue
      }
    }

    textBuffer.push(line)
    i++
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
      output.push(
        <div key={i} className="font-bold mt-4 mb-1" style={{ color: '#e7e5e4', fontSize: '0.9rem' }}>
          {renderInline(line.replace(/^#+\s/, ''))}
        </div>
      )
    } else if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      output.push(
        <div key={i} className="flex gap-2 my-0.5 pl-2">
          <span style={{ color: '#CABEFF' }}>•</span>
          <span className="min-w-0 break-words">{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</span>
        </div>
      )
    } else {
      output.push(
        <div key={i} className="my-0.5 leading-relaxed break-words">
          {renderInline(line)}
        </div>
      )
    }
    i++
  }

  return <div>{output}</div>
}

// ── MessageBubble ──────────────────────────────────────────────────────────────

const MessageBubble = memo(({ role, content, isStreaming }) => {
  const isUser = role === 'user'
  const decoded = decodeHtml(content || '')
  const parts = isUser ? null : parseContent(decoded)

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
          maxWidth: isUser ? '88%' : '100%',
        }}
      >
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
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2" style={{ background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{part.lang}</span>
                    <CopyButton text={part.value || ''} />
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
