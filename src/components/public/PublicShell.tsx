export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--red)', color: '#fff', padding: '20px 20px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>ศูนย์บริการซ่อมไทวัสดุ</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>Thaiwasadu Service Center</p>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}

export function PCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '18px 20px', marginBottom: 14, border: '0.5px solid var(--border)' }}>
      {title && <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>{title}</h3>}
      {children}
    </div>
  )
}

export function PRow({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ color: 'var(--text-2)' }}>{l}</span><span style={{ textAlign: 'right' }}>{v}</span>
    </div>
  )
}

export function PResult({ icon, msg, sub }: { icon: string; msg: string; sub: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{msg}</p>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.7 }}>{sub}</p>
    </div>
  )
}

export const pbtn = (primary: boolean): React.CSSProperties => ({
  width: '100%', fontFamily: 'inherit', fontSize: 14, padding: 13, borderRadius: 10, cursor: 'pointer', fontWeight: 500, marginBottom: 10,
  border: primary ? 'none' : '1px solid var(--border-strong)', background: primary ? 'var(--red)' : 'var(--surface)', color: primary ? '#fff' : 'var(--text-2)',
})
