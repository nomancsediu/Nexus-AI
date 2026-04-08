import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa']

export default function ChartBlock({ code }) {
  let config
  try {
    const decoded = code
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      // fix comma-formatted numbers like 10,000
      .replace(/(\d),(?=\d{3})/g, '$1')
    config = JSON.parse(decoded.trim())
  } catch {
    return (
      <div className="my-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
        <span className="text-xs text-orange-400">Invalid chart data</span>
        <pre className="text-xs text-gray-500 mt-1">{code}</pre>
      </div>
    )
  }

  const { title, xLabel, yLabel, series } = config
  // series: [{ name: 'O(n)', data: [{ x: 1, y: 1 }, ...] }]

  // merge all series data by x value
  const xValues = [...new Set(series.flatMap(s => s.data.map(d => d.x)))].sort((a, b) => a - b)
  const merged = xValues.map(x => {
    const point = { x }
    series.forEach(s => {
      const found = s.data.find(d => d.x === x)
      point[s.name] = found ? found.y : null
    })
    return point
  })

  return (
    <div className="my-3 bg-[#0f1117] border border-white/5 rounded-xl p-4">
      {title && <p className="text-sm font-semibold text-gray-200 mb-3 text-center">{title}</p>}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
          <XAxis
            dataKey="x"
            label={{ value: xLabel || 'n', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            label={{ value: yLabel || 'Time', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: '#1a1d27', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          {series.map((s, i) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
