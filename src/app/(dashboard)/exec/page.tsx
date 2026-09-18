import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function ExecPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!['ADMIN', 'EXECUTIVE'].includes(user.role)) redirect('/jobs')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Executive Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-mute)' }}>ภาพรวมผลประกอบการและ KPI</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm border rounded-lg px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <option>เดือนนี้</option>
            <option>ไตรมาสนี้</option>
            <option>ปีนี้</option>
          </select>
          <button
            onClick={() => window.print()}
            className="text-sm px-4 py-2 rounded-lg border font-medium"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-2)' }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'รายได้รวม', value: '฿248,500', trend: '+12%', trendUp: true },
          { label: 'กำไรขั้นต้น (GP)', value: '฿44,730', trend: '+8%', trendUp: true },
          { label: 'GP %', value: '18.0%', trend: '-0.5%', trendUp: false },
          { label: 'ค่าเฉลี่ยต่องาน', value: '฿4,970', trend: '+5%', trendUp: true },
        ].map(kpi => (
          <div key={kpi.label} className="card">
            <div className="text-xs mb-1" style={{ color: 'var(--text-mute)' }}>{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{kpi.value}</div>
            <div className={`text-xs mt-1 font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.trend} vs เดือนก่อน
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>รายได้รายเดือน</h3>
          <div className="h-48 flex items-center justify-center" style={{ background: 'var(--surface-2)', borderRadius: '8px', color: 'var(--text-mute)' }}>
            <span className="text-sm">[ Chart.js / Recharts ]</span>
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>งานค้างในระบบ (Backlog)</h3>
          <div className="h-48 flex items-center justify-center" style={{ background: 'var(--surface-2)', borderRadius: '8px', color: 'var(--text-mute)' }}>
            <span className="text-sm">[ Backlog aging doughnut ]</span>
          </div>
        </div>
      </div>

      {/* Ops Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'SLA ผ่าน %', value: '87.2%', icon: '✅' },
          { label: 'เวลาซ่อมเฉลี่ย', value: '5.2 วัน', icon: '⏱' },
          { label: 'Repeat Rate', value: '3.1%', icon: '🔄' },
        ].map(m => (
          <div key={m.label} className="card flex items-center gap-4">
            <span className="text-3xl">{m.icon}</span>
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{m.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* VD Performance */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>ประสิทธิภาพศูนย์ซ่อม (VD)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <th className="pb-2 text-left font-medium">อันดับ</th>
              <th className="pb-2 text-left font-medium">ศูนย์ซ่อม</th>
              <th className="pb-2 text-right font-medium">งาน</th>
              <th className="pb-2 text-right font-medium">รายได้</th>
              <th className="pb-2 text-right font-medium">SLA %</th>
            </tr>
          </thead>
          <tbody>
            {[
              { rank: 1, name: 'บ.ช่างเจริญ', jobs: 12, revenue: '฿72,000', sla: '91%' },
            ].map(vd => (
              <tr key={vd.rank} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2 text-xs font-bold" style={{ color: 'var(--green)' }}>🥇 {vd.rank}</td>
                <td className="py-2">{vd.name}</td>
                <td className="py-2 text-right">{vd.jobs}</td>
                <td className="py-2 text-right">{vd.revenue}</td>
                <td className="py-2 text-right text-green-600 font-medium">{vd.sla}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
