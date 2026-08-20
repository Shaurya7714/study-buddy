'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#38a169', '#e53e3e']

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
    <section style={{ marginBottom: '30px' }}>
      <h2>Your Progress</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Accuracy over time bar chart */}
        <div style={{ border: '1px solid #334155', borderRadius: '12px', padding: '20px', backgroundColor: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>Accuracy Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              <Bar dataKey="accuracy" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Correct vs Incorrect pie chart */}
        <div style={{ border: '1px solid #334155', borderRadius: '12px', padding: '20px', backgroundColor: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>Correct vs Incorrect</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </section>
  )
}
