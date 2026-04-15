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
  flowchart: { curve: 'basis', padding: 20, useMaxWidth: false },
  sequence: { actorMargin: 50, useMaxWidth: false },
  gantt: { useMaxWidth: false },
})

let idCounter = 0

const MermaidDiagram = memo(({ code }) => {
  const wrapRef = useRef(null)
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
      .then(({ svg: raw }) => { setSvg(raw); setError('') })
      .catch(err => { setError('Could not render diagram'); console.warn('Mermaid:', err) })
  }, [code])

  // After SVG is injected into DOM, fix its dimensions directly
  useEffect(() => {
    if (!svg || !wrapRef.current) return
    const svgEl = wrapRef.current.querySelector('svg')
    if (!svgEl) return

    // Preserve viewBox for scaling, then let CSS control size
    const vb = svgEl.getAttribute('viewBox')
    if (!vb) {
      const w = svgEl.getAttribute('width') || '800'
      const h = svgEl.getAttribute('height') || '400'
      svgEl.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`)
    }

    svgEl.setAttribute('width', '100%')
    svgEl.removeAttribute('height')
    svgEl.style.width = '100%'
    svgEl.style.height = 'auto'
    svgEl.style.display = 'block'
    svgEl.style.maxWidth = '100%'

    // Fix any foreignObject height="auto" errors
    svgEl.querySelectorAll('foreignObject').forEach(fo => {
      const h = fo.getAttribute('height')
      if (!h || h === 'auto' || isNaN(parseFloat(h))) {
        fo.setAttribute('height', '40')
      }
    })
  }, [svg])

  if (error) return (
    <div className="my-3 px-4 py-3 text-xs" style={{ background: '#0a0a0a', color: '#f87171', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
      ⚠ Could not render diagram
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
      className="my-4 w-full"
      style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        ref={wrapRef}
        style={{ width: '100%' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
})

export default MermaidDiagram
