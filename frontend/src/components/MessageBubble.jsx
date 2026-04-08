import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faRobot, faUser } from '@fortawesome/free-solid-svg-icons'
import ChartBlock from './ChartBlock'
import FlowChart from './FlowChart'
import 'katex/dist/katex.min.css'

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

const MarkdownContent = memo(({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkMath, remarkGfm]}
    rehypePlugins={[rehypeKatex]}
    components={{
      p: ({ children }) => <div className="mb-3 last:mb-0 leading-relaxed">{children}</div>,
      strong: ({ children }) => <strong className="font-semibold" style={{ color: '#e7e5e4' }}>{children}</strong>,
      em: ({ children }) => <em className="italic" style={{ color: '#bbb' }}>{children}</em>,
      h1: ({ children }) => <h1 className="text-base font-bold mt-5 mb-2 pb-1" style={{ color: '#e7e5e4', borderBottom: '1px solid #1e1e1e' }}>{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold mt-4 mb-2" style={{ color: '#e7e5e4' }}>{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: '#CABEFF' }}>{children}</h3>,
      ul: ({ children }) => <ul className="space-y-1 my-2 pl-4" style={{ color: '#aaa', listStyleType: 'disc' }}>{children}</ul>,
      ol: ({ children }) => <ol className="space-y-1 my-2 pl-4" style={{ color: '#aaa', listStyleType: 'decimal' }}>{children}</ol>,
      li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
      blockquote: ({ children }) => (
        <blockquote className="pl-4 my-3 py-2" style={{ borderLeft: '2px solid #CABEFF', color: '#888', background: 'rgba(202,190,255,0.04)', borderRadius: '0 3px 3px 0' }}>{children}</blockquote>
      ),
      hr: () => <hr className="my-4" style={{ borderColor: '#1e1e1e' }} />,
      table: ({ children }) => (
        <div className="overflow-x-auto my-4" style={{ borderRadius: '4px', border: '1px solid #222' }}>
          <table className="w-full text-sm border-collapse" style={{ minWidth: '100%' }}>{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead style={{ background: '#1a1035', borderBottom: '2px solid rgba(202,190,255,0.2)' }}>{children}</thead>,
      tbody: ({ children }) => <tbody>{children}</tbody>,
      th: ({ children }) => (
        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: '#CABEFF' }}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-3 text-xs" style={{ color: '#ccc', borderTop: '1px solid #1e1e1e' }}>{children}</td>
      ),
      tr: ({ children }) => <tr className="hover-row">{children}</tr>,
      code({ inline, className, children }) {
        const lang = /language-(\w+)/.exec(className || '')?.[1] || ''
        const codeStr = String(children).replace(/\n$/, '')
          .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')

        // inline code
        if (inline) return (
          <code className="px-1.5 py-0.5 text-[0.8em] font-mono" style={{ background: 'rgba(202,190,255,0.08)', color: '#CABEFF', border: '1px solid rgba(202,190,255,0.12)', borderRadius: '2px' }}>{children}</code>
        )

        if (lang === 'flowchart') return <FlowChart code={codeStr} />
        if (lang === 'chart') return <ChartBlock code={codeStr} />

        // only render as code block if it has a programming language
        const programmingLangs = ['js','jsx','ts','tsx','py','python','java','c','cpp','cs','go','rust','ruby','php','swift','kotlin','bash','sh','sql','html','css','json','yaml','xml','r','scala','dart']
        if (!lang || !programmingLangs.includes(lang.toLowerCase())) {
          return <span className="whitespace-pre-wrap" style={{ color: '#d4d2d1' }}>{codeStr}</span>
        }

        return (
          <div className="my-3 overflow-hidden" style={{ border: '1px solid #1e1e1e', borderRadius: '3px' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{lang}</span>
              <CopyButton text={codeStr} />
            </div>
            <SyntaxHighlighter
              language={lang}
              style={oneDark}
              customStyle={{ margin: 0, borderRadius: 0, background: '#0a0a0a', fontSize: '0.72rem' }}
              showLineNumbers={codeStr.split('\n').length > 4}
            >
              {codeStr}
            </SyntaxHighlighter>
          </div>
        )
      },
    }}
  >
    {content}
  </ReactMarkdown>
))

const MessageBubble = memo(({ role, content, isStreaming }) => {
  const isUser = role === 'user'

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
        {isUser
          ? <span className="whitespace-pre-wrap">{content}</span>
          : <MarkdownContent content={decodeHtml(content)} />
        }
      </div>
    </div>
  )
})

export default MessageBubble
