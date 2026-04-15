import { useEffect, useRef, useState, memo } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  darkMode: true,
  themeVariables: {
    background: '#0e0e0e',
    mainBkg: '#161616',
    nodeBorder: '#CABEFF',
    clusterBkg: '#1a1a1a',
    titleColor: '#e7e5e4',
    edgeLabelBackground: '#111',
    lineColor: '#555',
    primaryColor: '#161616',
    primaryTextColor: '#e7e5e4',
    primaryBorderColor: '#CABEFF',
    secondaryColor: '#1a1a1a',
    tertiaryColor: '#111',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
  },
  flowchart: { curve: 'basis', padding: 20 },
  sequence: { actorMargin: 50, useMaxWidth: true },
  gantt: { useMaxWidth: true },
})

let idCounter = 0

const MermaidDiagram = memo(({ code }) => {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code?.trim()) return
    const id = `mermaid-${++idCounter}`
    // Decode HTML entities before passing to mermaid
    const decoded = code.trim()
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Fix arrow syntax: -->|label|> should be -->|label|
      .replace(/-->/g, '-->')
      .replace(/\|>/g, '|')
    mermaid.render(id, decoded)
      .then(({ svg }) => { setSvg(svg); setError('') })
      .catch(err => {
        setError('Could not render diagram')
        console.warn('Mermaid error:', err)
      })
  }, [code])

  if (error) return (
    <div className="my-3 px-4 py-3 text-xs" style={{ background: '#0a0a0a', color: '#f87171', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
      ⚠ {error}
      <pre className="mt-2 text-[10px] opacity-50 whitespace-pre-wrap">{code}</pre>
    </div>
  )

  if (!svg) return (
    <div className="my-3 flex items-center gap-2 px-4 py-3 text-xs" style={{ color: '#555' }}>
      <span className="animate-spin inline-block w-3 h-3 border border-t-transparent rounded-full" style={{ borderColor: '#CABEFF', borderTopColor: 'transparent' }} />
      Rendering diagram...
    </div>
  )

  return (
    <div
      className="my-4 w-full overflow-x-auto"
      style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        ref={ref}
        className="flex justify-center"
        style={{ minWidth: 'fit-content' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
})

export default MermaidDiagram
