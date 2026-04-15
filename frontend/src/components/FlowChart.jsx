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

  useEffect(() => {
    if (!svg || !wrapRef.current) return
    const svgEl = wrapRef.current.querySelector('svg')
    if (!svgEl) return

    // Get the real width/height from attributes or bounding box
    const rawW = parseFloat(svgEl.getAttribute('width')) || svgEl.getBoundingClientRect().width || 800
    const rawH = parseFloat(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height || 400

    // Set viewBox from real dimensions if missing
    if (!svgEl.getAttribute('viewBox')) {
      svgEl.setAttribute('viewBox', `0 0 ${rawW} ${rawH}`)
    }

    // Now make it fully responsive — CSS will scale it
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('height')
    svgEl.style.cssText = 'width:100%;height:auto;display:block;'

    // Fix foreignObject invalid height
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
      style={{
        background: '#0e0e0e',
        border: '1px solid #2a2a2a',
        borderRadius: '6px',
        padding: '20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={wrapRef}
        style={{ width: '100%', lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
})

export default MermaidDiagram
