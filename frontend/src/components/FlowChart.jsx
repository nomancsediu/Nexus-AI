import { useMemo, memo } from 'react'

const NODE_W = 140
const NODE_H = 40
const COL_GAP = 60
const ROW_GAP = 60
const PAD = 30

function computeLayout(rawNodes, rawEdges) {
  const adj = {}, inDegree = {}
  rawNodes.forEach(n => { adj[n.id] = []; inDegree[n.id] = 0 })
  rawEdges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target)
    if (inDegree[e.target] !== undefined) inDegree[e.target]++
  })

  // BFS to assign levels
  const level = {}
  const queue = rawNodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  queue.forEach(id => { level[id] = 0 })
  let head = 0
  while (head < queue.length) {
    const cur = queue[head++]
    adj[cur]?.forEach(next => {
      level[next] = Math.max(level[next] ?? 0, (level[cur] ?? 0) + 1)
      if (!queue.includes(next)) queue.push(next)
    })
  }
  // fallback for disconnected nodes
  rawNodes.forEach(n => { if (level[n.id] === undefined) level[n.id] = 0 })

  // group by level
  const byLevel = {}
  rawNodes.forEach(n => {
    const l = level[n.id]
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(n.id)
  })

  const pos = {}
  Object.entries(byLevel).forEach(([l, ids]) => {
    const totalW = ids.length * NODE_W + (ids.length - 1) * COL_GAP
    ids.forEach((id, i) => {
      pos[id] = {
        x: PAD + i * (NODE_W + COL_GAP) + (ids.length === 1 ? 0 : 0),
        y: PAD + Number(l) * (NODE_H + ROW_GAP),
        cx: PAD + i * (NODE_W + COL_GAP) + NODE_W / 2,
        cy: PAD + Number(l) * (NODE_H + ROW_GAP) + NODE_H / 2,
      }
    })
    // center each level
    const maxW = Math.max(...Object.values(byLevel).map(ids => ids.length)) * (NODE_W + COL_GAP) - COL_GAP
    const rowW = ids.length * (NODE_W + COL_GAP) - COL_GAP
    const offset = (maxW - rowW) / 2
    ids.forEach(id => { pos[id].x += offset; pos[id].cx += offset })
  })

  const maxLevel = Math.max(...rawNodes.map(n => level[n.id]))
  const maxCols = Math.max(...Object.values(byLevel).map(ids => ids.length))
  const svgW = PAD * 2 + maxCols * (NODE_W + COL_GAP) - COL_GAP
  const svgH = PAD * 2 + (maxLevel + 1) * (NODE_H + ROW_GAP) - ROW_GAP

  return { pos, svgW, svgH }
}

function edgePath(from, to) {
  const x1 = from.cx, y1 = from.y + NODE_H
  const x2 = to.cx, y2 = to.y
  const my = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`
}

const FlowChart = memo(({ code }) => {
  const result = useMemo(() => {
    try {
      const data = JSON.parse(code)
      const nodes = data.nodes || []
      const edges = data.edges || []
      if (!nodes.length) return { error: 'No nodes' }
      const { pos, svgW, svgH } = computeLayout(nodes, edges)
      return { nodes, edges, pos, svgW, svgH }
    } catch {
      return { error: 'Invalid flowchart JSON' }
    }
  }, [code])

  if (result.error) return (
    <div className="my-3 px-4 py-3 text-xs" style={{ background: '#0a0a0a', color: '#f87171', border: '1px solid #1e1e1e', borderRadius: '3px' }}>
      {result.error}
    </div>
  )

  const { nodes, edges, pos, svgW, svgH } = result

  return (
    <div className="my-3 overflow-x-auto" style={{ border: '1px solid #1e1e1e', borderRadius: '3px', background: '#0e0e0e' }}>
      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
        viewBox={`0 0 ${svgW} ${svgH}`}
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#555" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = pos[e.source], to = pos[e.target]
          if (!from || !to) return null
          return (
            <path
              key={i}
              d={edgePath(from, to)}
              fill="none"
              stroke="#333"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const p = pos[n.id]
          if (!p) return null
          return (
            <g key={n.id}>
              <rect
                x={p.x} y={p.y}
                width={NODE_W} height={NODE_H}
                rx="4"
                fill="#161616"
                stroke="#CABEFF"
                strokeWidth="1"
              />
              <text
                x={p.cx} y={p.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e7e5e4"
                fontSize="11"
                fontFamily="inherit"
              >
                {n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
})

export default FlowChart
