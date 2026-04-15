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

function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|')
}

function isSeparatorRow(line) {
  return isTableRow(line) && /^\|[\s\-:|]+\|$/.test(line.trim().replace(/\|[\s\-:|]+/g, '|'))
}

function parseTableRow(line) {
  return line.trim().slice(1, -1).split('|').map(cell => cell.trim())
}

function parseSeparator(sepLine) {
  return sepLine.trim().slice(1, -1).split('|').map(cell => {
    const t = cell.trim()
    if (t.startsWith(':') && t.endsWith(':')) return 'center'
    if (t.endsWith(':')) return 'right'
    return 'left'
  })
}

function MarkdownTable({ rows }) {
  const headers = parseTableRow(rows[0])
  const aligns = parseSeparator(rows[1])
  const dataRows = rows.slice(2)

  return (
    <div className="my-4 overflow-x-auto" style={{ borderRadius: '6px', border: '1px solid #2a2a2a' }}>
      <table className="w-full text-xs border-collapse" style={{ minWidth: 'max-content' }}>
        <thead>
          <tr style={{ background: 'rgba(202,190,255,0.08)', borderBottom: '1px solid #2a2a2a' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{
                  color: '#CABEFF',
                  textAlign: aligns[i] || 'left',
                  borderRight: i < headers.length - 1 ? '1px solid #2a2a2a' : 'none',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => {
            const cells = parseTableRow(row)
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
                    className="px-4 py-2.5 text-xs"
                    style={{
                      color: ci === 0 ? '#d4d2d1' : '#888',
                      textAlign: aligns[ci] || 'left',
                      borderRight: ci < cells.length - 1 ? '1px solid #1e1e1e' : 'none',
                      whiteSpace: 'nowrap',
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

function renderInline(text) {
  const parts = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>)
    const raw = m[0]
    if (raw.startsWith('`'))
      parts.push(<code key={m.index} className="px-1.5 py-0.5 text-[0.8em] font-mono break-all" style={{ background: 'rgba(202,190,255,0.08)', color: '#CABEFF', border: '1px solid rgba(202,190,255,0.12)', borderRadius: '2px' }}>{raw.slice(1, -1)}</code>)
    else if (raw.startsWith('**'))
      parts.push(<strong key={m.index} style={{ color: '#e7e5e4' }}>{raw.slice(2, -2)}</strong>)
    else
      parts.push(<em key={m.index} style={{ color: '#aaa' }}>{raw.slice(1, -1)}</em>)
    last = m.index + raw.length
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>)
  return parts.length ? parts : text
}

function TextBlock({ text }) {
  const lines = text.split('\n')
  const output = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Detect table block
    if (isTableRow(line) && lines[i + 1] && isSeparatorRow(lines[i + 1])) {
      const tableRows = []
      while (i < lines.length && isTableRow(lines[i])) {
        tableRows.push(lines[i])
        i++
      }
      output.push(<MarkdownTable key={`table-${i}`} rows={tableRows} />)
      continue
    }

    if (line.trim() === '' || line.trim() === '---') {
      output.push(<div key={i} style={{ height: '8px' }} />)
    } else if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      const headingText = line.replace(/^#+\s/, '')
      output.push(
        <div key={i} className="font-bold mt-4 mb-1" style={{ color: '#e7e5e4', fontSize: '0.9rem' }}>
          {renderInline(headingText)}
        </div>
      )
    } else if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const bulletText = line.replace(/^\s*[-*]\s+/, '')
      output.push(
        <div key={i} className="flex gap-2 my-0.5 pl-2">
          <span style={{ color: '#CABEFF' }}>•</span>
          <span className="min-w-0 break-words">{renderInline(bulletText)}</span>
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

const MessageBubble = memo(({ role, content, isStreaming }) => {
  const isUser = role === 'user'
  const decoded = decodeHtml(content)
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
        className="min-w-0 max-w-[88%] sm:max-w-[82%] md:max-w-[78%] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed overflow-hidden"
        style={{ background: isUser ? 'rgba(202,190,255,0.07)' : '#111', border: `1px solid ${isUser ? 'rgba(202,190,255,0.15)' : '#1a1a1a'}`, color: '#d4d2d1', borderRadius: '3px' }}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap break-words">{content}</span>
        ) : (
          <div className="min-w-0">
            {parts.map((part, i) =>
              part.type === 'code' ? (
                <div key={i} className="my-3 overflow-hidden" style={{ border: '1px solid #1e1e1e', borderRadius: '3px' }}>
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2" style={{ background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{part.lang}</span>
                    <CopyButton text={part.value} />
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={part.lang || 'text'}
                      style={oneDark}
                      customStyle={{ margin: 0, borderRadius: 0, background: '#0a0a0a', fontSize: '0.7rem' }}
                      showLineNumbers={part.value.split('\n').length > 4}
                    >
                      {part.value}
                    </SyntaxHighlighter>
                  </div>
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
