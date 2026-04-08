import { useEffect, useRef, memo } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', fontFamily: 'inherit' })

let uid = 0

function cleanLabel(inner) {
  return inner.replace(/[(){}|<>:!^]/g, '').replace(/\s+/g, ' ').trim()
}

function cleanCode(raw) {
  let code = raw
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/^```mermaid\s*/i, '').replace(/```\s*$/, '').trim()

  // strip ALL edge labels: -->|anything| or -->|anything|>
  code = code.replace(/-->\s*\|[^|]*\|>?/g, '-->')
  // fix mismatched closing brackets
  code = code.replace(/([A-Za-z0-9_]+)\[([^\]\[})]*)([})])/g,
    (_, id, inner) => `${id}[${cleanLabel(inner)}]`
  )
  // clean labels inside [ ]
  code = code.replace(/\[([^\]]*)\]/g, (_, inner) => `[${cleanLabel(inner)}]`)
  // remove unsupported lines
  code = code.split('\n').filter(line => !/^\s*(style|classDef|class |click )/.test(line)).join('\n')
  return code
}

const MermaidBlock = memo(({ code }) => {
  const ref = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (!ref.current || !code?.trim()) return

    const cleaned = cleanCode(code)
    const id = `mm${++uid}`

    const el = document.createElement('div')
    el.id = id
    el.style.cssText = 'position:absolute;top:-9999px;left:-9999px'
    document.body.appendChild(el)

    mermaid.render(id, cleaned)
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.removeAttribute('width')
            svgEl.removeAttribute('height')
            svgEl.style.cssText = 'max-width:100%;height:auto;display:block;margin:0 auto'
          }
        }
        if (errorRef.current) errorRef.current.textContent = ''
      })
      .catch(err => {
        console.error('[Mermaid error]', err.message, '\n', cleaned)
        if (ref.current) ref.current.innerHTML = ''
        if (errorRef.current) errorRef.current.textContent = cleaned
      })
      .finally(() => el.remove())
  }, [code])

  return (
    <div className="my-3" style={{ border: '1px solid #1e1e1e', borderRadius: '3px' }}>
      <div ref={ref}
        className="overflow-x-auto flex justify-center"
        style={{ background: '#111', padding: '20px', minHeight: '80px' }}
      />
      <pre ref={errorRef}
        className="hidden"
        style={{ display: 'none', background: '#0a0a0a', color: '#f87171', fontSize: '0.7rem', padding: '12px', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}
        onLoad={e => { if (e.target.textContent) e.target.style.display = 'block' }}
      />
    </div>
  )
})

export default MermaidBlock
