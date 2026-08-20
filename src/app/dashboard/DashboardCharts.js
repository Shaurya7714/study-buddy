'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#10b981', '#f43f5e']

export default function DashboardCharts({ attempts }) {
  // --- Accuracy over time (grouped by date) ---
  const byDate = {}
  for (const a of attempts) {
    const date = new Date(a.attempted_at).toLocaleDateString()
    if (!byDate[date]) byDate[date] = { correct: 0, total: 0 }
    byDate[date].total++
    if (a.is_correct) byDate[date].correct++
  }

  const accuracyData = Object.entries(byDate).map(([date, v]) => ({
    date,
    accuracy: Math.round((v.correct / v.total) * 100),
    total: v.total
  }))

  // --- Correct vs Incorrect pie ---
  const correctCount = attempts.filter(a => a.is_correct).length
  const incorrectCount = attempts.length - correctCount
  const pieData = [
    { name: 'Correct', value: correctCount },
    { name: 'Incorrect', value: incorrectCount }
  ]

  return (
    <>
      {/* Accuracy over time bar chart */}
      <div className="bento-card bento-chart bento-span-2">
        <h3>📊 Accuracy Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={accuracyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8b8fa3' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8b8fa3' }} unit="%" />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{ backgroundColor: '#12121a', borderColor: '#1e1e2e', color: '#f8fafc', borderRadius: '12px', fontWeight: 700 }}
            />
            <Bar dataKey="accuracy" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Correct vs Incorrect pie chart */}
      <div className="bento-card bento-chart bento-span-2">
        <h3>🎯 Correct vs Incorrect</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#12121a', borderColor: '#1e1e2e', color: '#f8fafc', borderRadius: '12px', fontWeight: 700 }} />
            <Legend wrapperStyle={{ color: '#8b8fa3', fontWeight: 700, fontSize: '13px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
