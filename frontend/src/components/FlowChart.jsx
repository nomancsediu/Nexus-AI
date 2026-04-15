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
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 20, useMaxWidth: true },
  sequence: { actorMargin: 50, useMaxWidth: true },
  gantt: { useMaxWidth: true },
})

let idCounter = 0

const MermaidDiagram = memo(({ code }) => {
  const containerRef = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code?.trim()) return
    const id = `mermaid-${++idCounter}`
    const decoded = code.trim()
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\|>/g, '|')

    mermaid.render(id, decoded)
      .then(({ svg: renderedSvg }) => {
        // Force SVG to be fully responsive: remove fixed width/height, set viewBox-based scaling
        const responsive = renderedSvg
          .replace(/width="[^"]*"/, 'width="100%"')
          .replace(/height="[^"]*"/, 'height="auto"')
          .replace(/style="[^"]*max-width:[^"]*"/, '')
        setSvg(responsive)
        setError('')
      })
      .catch(err => {
        setError('Could not render diagram')
        console.warn('Mermaid error:', err)
      })
  }, [code])

  if (error) return (
    <div className="my-3 px-4 py-3 text-xs" style={{ background: '#0a0a0a', color: '#f87171', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
      ⚠ {error}
      <pre className="mt-2 text-[10px] opacity-50 whitespace-pre-wrap break-all">{code}</pre>
    </div>
  )

  if (!svg) return (
    <div className="my-3 flex items-center gap-2 px-4 py-3 text-xs" style={{ color: '#555' }}>
      <span className="animate-spin inline-block w-3 h-3 rounded-full" style={{ border: '1.5px solid #CABEFF', borderTopColor: 'transparent' }} />
      Rendering diagram...
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="my-4 w-full overflow-x-auto"
      style={{
        background: '#0e0e0e',
        border: '1px solid #2a2a2a',
        borderRadius: '6px',
        padding: '16px',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {/* SVG fills container width on desktop, scrolls on mobile */}
      <div
        style={{ width: '100%', minWidth: 0 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
})

export default MermaidDiagram
