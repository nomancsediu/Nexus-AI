import { useEffect, useRef, useState, memo } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  darkMode: true,
  securityLevel: 'loose',
  themeVariables: {
    background: '#0e0e0e',
    mainBkg: '#1a1a2e',
    nodeBorder: '#CABEFF',
    clusterBkg: '#1a1a1a',
    titleColor: '#e7e5e4',
    edgeLabelBackground: '#111',
    lineColor: '#888',
    primaryColor: '#1a1a2e',
    primaryTextColor: '#e7e5e4',
    primaryBorderColor: '#CABEFF',
    secondaryColor: '#161616',
    tertiaryColor: '#111',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
  },
  flowchart: { curve: 'basis', padding: 24, useMaxWidth: false },
  sequence: { actorMargin: 60, useMaxWidth: false, mirrorActors: false },
  gantt: { useMaxWidth: false },
})

let uid = 0

function decodeForMermaid(code) {
  return code
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\|>/g, '|')
    .trim()
}

const MermaidDiagram = memo(({ code }) => {
  const ref = useRef(null)
  const [error, setError] = useState('')
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!ref.current || !code?.trim()) return

    const el = ref.current
    const decoded = decodeForMermaid(code)
    const id = `mermaid-el-${++uid}`

    el.innerHTML = ''
    el.removeAttribute('data-processed')
    setError('')
    setRendered(false)

    mermaid.render(id, decoded)
      .then(({ svg }) => {
        el.innerHTML = svg
        const svgEl = el.querySelector('svg')
        if (svgEl) {
          // Read original dimensions before removing them
          const w = parseFloat(svgEl.getAttribute('width')) || 800
          const h = parseFloat(svgEl.getAttribute('height')) || 500

          if (!svgEl.getAttribute('viewBox')) {
            svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
          }

          svgEl.removeAttribute('width')
          svgEl.removeAttribute('height')
          svgEl.style.cssText = 'width:100%;height:auto;display:block;min-width:0;'

          // Fix foreignObject height errors
          svgEl.querySelectorAll('foreignObject').forEach(fo => {
            const fh = fo.getAttribute('height')
            if (!fh || fh === 'auto' || isNaN(parseFloat(fh))) {
              fo.setAttribute('height', '40')
            }
          })
        }
        setRendered(true)
      })
      .catch(err => {
        console.warn('Mermaid render error:', err)
        setError(err?.message || 'Syntax error in diagram')
      })
  }, [code])

  if (error) return (
    <div className="my-4 p-4 text-xs" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f87171' }}>
      <div className="flex items-center gap-2 mb-2">
        <span>⚠</span>
        <span className="font-semibold">Diagram syntax error</span>
      </div>
      <pre className="text-[10px] opacity-40 whitespace-pre-wrap break-all mt-1">{code}</pre>
    </div>
  )

  return (
    <div
      className="my-4 w-full"
      style={{
        background: '#0d0d1a',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '24px 20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {!rendered && (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#555' }}>
          <span className="animate-spin inline-block w-3 h-3 rounded-full" style={{ border: '1.5px solid #CABEFF', borderTopColor: 'transparent' }} />
          Rendering diagram...
        </div>
      )}
      <div
        ref={ref}
        style={{ width: '100%', minWidth: '280px', display: rendered ? 'block' : 'none' }}
      />
    </div>
  )
})

export default MermaidDiagram
