'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Store, DollarSign, MapPin, Route, Clock, ShieldCheck,
  Package, BarChart2, Settings, Users, ChevronRight,
  Save, Loader2, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorBrand { brand: { id: number; name: string } }
interface VendorCenter { id: string; code: string; address: string | null; phone: string | null; deliveryMethod: string; active: boolean; gpPctOverride: number | null }
interface VendorParent { id: string; code: string; name: string; defaultGpPct: number; isBrandAuthorized: boolean; active: boolean; brands: VendorBrand[]; centers: VendorCenter[] }
interface FeeEntry { sizeCategory: { id: number; code: string; name: string }; rate: { id: number; operationFee: number; shippingFee3pl: number } | null }
interface Site { id: string; code: string; name: string; nickname: string; type: string; province: string; phone: string | null; active: boolean; _count: { users: number; jobs: number } }
interface BranchRoute { id: string; priority: number; standardChannel: string; branch: { code: string; name: string }; dcSite: { code: string; name: string } | null; primaryCenter: { code: string; vendorParent: { name: string } } | null; backupCenter: { code: string; vendorParent: { name: string } } | null }
interface SlaStep { id: number; seq: number; code: string; name: string; ownerDept: string; hours: number; appliesTo: string; condition: string | null }
interface AdminUser { id: string; username: string; fullName: string; email: string | null; role: string; active: boolean; createdAt: string; site: { code: string; name: string } | null; vendorCenter: { code: string } | null }
interface RoleMenuPerm { id: string; menuKey: string; role: string; canAccess: boolean; canWrite: boolean }
interface RbacData { perms: RoleMenuPerm[]; menuKeys: string[]; roles: string[] }

// ─── Loading / Error helpers ─────────────────────────────────────────────────

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-mute)' }} />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl text-sm" style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}>
      <AlertCircle size={16} />
      {message}
    </div>
  )
}

function SaveBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
      style={{ background: 'var(--green)' }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      บันทึก
    </button>
  )
}

// ─── Section 1: Vendor Portal ─────────────────────────────────────────────────

function VendorSection() {
  const [vendors, setVendors] = useState<VendorParent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/vendors')
      .then((r) => r.ok ? r.json() : Promise.reject('error'))
      .then(setVendors)
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>รายชื่อ Vendor ทั้งหมด ({vendors.length})</h3>
        <button className="px-4 py-2 text-sm rounded-lg font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          + เพิ่ม VD
        </button>
      </div>
      <div className="space-y-3">
        {vendors.map((vd) => (
          <div key={vd.id} className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {/* VD header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-2)' }}>{vd.code}</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{vd.name}</span>
                {vd.isBrandAuthorized && (
                  <span className="text-xs px-2 py-0.5 rounded-full b-green">Authorized</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-2)' }}>
                <span>GP: <strong style={{ color: 'var(--text)' }}>{vd.defaultGpPct}%</strong></span>
                <span>ยี่ห้อ: {vd.brands.map((b) => b.brand.name).join(', ') || '-'}</span>
              </div>
            </div>
            {/* Centers table */}
            {vd.centers.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                    {['Code', 'ที่อยู่', 'โทร', 'วิธีขนส่ง', 'GP Override', 'สถานะ'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: 'var(--text-2)', background: 'var(--bg)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vd.centers.map((c) => (
                    <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-2.5 font-mono font-medium" style={{ color: 'var(--text)' }}>{c.code}</td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-2)' }}>{c.address ?? '-'}</td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-2)' }}>{c.phone ?? '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full b-blue">{c.deliveryMethod}</span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-2)' }}>{c.gpPctOverride != null ? `${c.gpPctOverride}%` : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full ${c.active ? 'b-green' : 'b-gray'}`}>
                          {c.active ? 'ใช้งาน' : 'ปิด'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 2: Fees ──────────────────────────────────────────────────────────

function FeeSection() {
  const [data, setData] = useState<FeeEntry[]>([])
  const [edits, setEdits] = useState<Record<number, { operationFee: number; shippingFee3pl: number }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/fees')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: FeeEntry[]) => {
        setData(d)
        const init: typeof edits = {}
        d.forEach((e) => {
          init[e.sizeCategory.id] = {
            operationFee: e.rate?.operationFee ?? 0,
            shippingFee3pl: e.rate?.shippingFee3pl ?? 0,
          }
        })
        setEdits(init)
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(edits).map(([id, vals]) => ({
        sizeCategoryId: Number(id),
        operationFee: vals.operationFee,
        shippingFee3pl: vals.shippingFee3pl,
      }))
      const res = await fetch('/api/admin/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>ค่าดำเนินการ / ค่าขนส่ง ตามขนาดสินค้า</h3>
        <SaveBtn onClick={handleSave} loading={saving} />
      </div>
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['ขนาด', 'Code', 'ค่าดำเนินการ (฿)', 'ค่าขนส่ง 3PL (฿)'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-sm" style={{ color: 'var(--text-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => {
              const id = entry.sizeCategory.id
              const vals = edits[id] ?? { operationFee: 0, shippingFee3pl: 0 }
              return (
                <tr key={id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{entry.sizeCategory.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                      {entry.sizeCategory.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={vals.operationFee}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], operationFee: Number(e.target.value) } }))}
                      className="w-28 px-3 py-1.5 border rounded-lg text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={vals.shippingFee3pl}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], shippingFee3pl: Number(e.target.value) } }))}
                      className="w-28 px-3 py-1.5 border rounded-lg text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section 3: Sites ────────────────────────────────────────────────────────

function SitesSection() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/sites')
      .then((r) => r.json())
      .then(setSites)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const branches = sites.filter((s) => s.type === 'BRANCH')
  const dcs = sites.filter((s) => s.type === 'DC')

  const renderTable = (list: Site[], title: string) => (
    <div>
      <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-2)' }}>{title}</h4>
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Code', 'ชื่อ', 'จังหวัด', 'โทร', 'Users', 'Jobs', 'สถานะ'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-xs" style={{ color: 'var(--text-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2.5 font-mono font-medium text-xs" style={{ color: 'var(--text)' }}>{s.code}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text)' }}>{s.name}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>{s.province}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>{s.phone ?? '-'}</td>
                <td className="px-4 py-2.5 text-xs text-center" style={{ color: 'var(--text)' }}>{s._count.users}</td>
                <td className="px-4 py-2.5 text-xs text-center" style={{ color: 'var(--text)' }}>{s._count.jobs}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'b-green' : 'b-gray'}`}>
                    {s.active ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {renderTable(branches, `สาขา (${branches.length})`)}
      {renderTable(dcs, `ศูนย์กระจาย DC (${dcs.length})`)}
    </div>
  )
}

// ─── Section 4: Routes ───────────────────────────────────────────────────────

function RoutesSection() {
  const [routes, setRoutes] = useState<BranchRoute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/routes')
      .then((r) => r.json())
      .then(setRoutes)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>จับคู่สาขา-VD ({routes.length} เส้นทาง)</h3>
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['สาขา', 'DC', 'VD หลัก', 'VD สำรอง', 'ช่องทาง', 'Priority'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-xs" style={{ color: 'var(--text-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs font-medium" style={{ color: 'var(--text)' }}>{r.branch.code}</span>
                  <span className="text-xs ml-1" style={{ color: 'var(--text-2)' }}>{r.branch.name}</span>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>{r.dcSite?.code ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text)' }}>
                  {r.primaryCenter ? `${r.primaryCenter.code} (${r.primaryCenter.vendorParent.name})` : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>
                  {r.backupCenter ? `${r.backupCenter.code} (${r.backupCenter.vendorParent.name})` : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full b-blue">{r.standardChannel}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-center" style={{ color: 'var(--text-2)' }}>{r.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section 5: SLA ──────────────────────────────────────────────────────────

function SlaSection() {
  const [steps, setSteps] = useState<SlaStep[]>([])
  const [edits, setEdits] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/sla')
      .then((r) => r.json())
      .then((d: SlaStep[]) => {
        setSteps(d)
        const init: typeof edits = {}
        d.forEach((s) => { init[s.id] = s.hours })
        setEdits(init)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/sla', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.entries(edits).map(([id, hours]) => ({ id: Number(id), hours }))),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>ขั้นตอน SLA</h3>
        <SaveBtn onClick={handleSave} loading={saving} />
      </div>
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['#', 'Code', 'ชื่อขั้นตอน', 'แผนก', 'ใช้กับ', 'ชั่วโมง SLA'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-xs" style={{ color: 'var(--text-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2.5 text-xs text-center" style={{ color: 'var(--text-2)' }}>{s.seq}</td>
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--text)' }}>{s.code}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text)' }}>{s.name}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full b-amber">{s.ownerDept}</span>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>{s.appliesTo}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={edits[s.id] ?? s.hours}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                      className="w-20 px-2.5 py-1.5 border rounded-lg text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-mute)' }}>ชม.</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section 6: RBAC ─────────────────────────────────────────────────────────

const MENU_LABELS: Record<string, string> = {
  exec: 'Executive', analytics: 'Analytics', jobs: 'งานซ่อม',
  cs: 'CS', gr: 'GR', dc: 'DC', vd: 'VD',
  tradein: 'Trade-in', s2: 'S2', vd_payment: 'จ่ายเงิน VD', admin: 'Admin',
}

function RbacSection() {
  const [data, setData] = useState<RbacData | null>(null)
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'users'>('matrix')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/rbac').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
    ])
      .then(([rbac, u]: [RbacData, AdminUser[]]) => {
        setData(rbac)
        setUsers(u)
        // Build matrix: matrix[menuKey][role] = canAccess
        const m: typeof matrix = {}
        rbac.menuKeys.forEach((mk) => {
          m[mk] = {}
          rbac.roles.forEach((role) => {
            const perm = rbac.perms.find((p) => p.menuKey === mk && p.role === role)
            m[mk][role] = perm?.canAccess ?? false
          })
        })
        setMatrix(m)
      })
      .finally(() => setLoading(false))
  }, [])

  const togglePerm = (menuKey: string, role: string) => {
    setMatrix((prev) => ({
      ...prev,
      [menuKey]: { ...prev[menuKey], [role]: !prev[menuKey][role] },
    }))
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const updates = data.menuKeys.flatMap((mk) =>
        data.roles.map((role) => ({
          menuKey: mk,
          role,
          canAccess: matrix[mk]?.[role] ?? false,
          canWrite: matrix[mk]?.[role] ?? false,
        }))
      )
      await fetch('/api/admin/rbac', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (!data) return <ErrorBox message="โหลดข้อมูลไม่สำเร็จ" />

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        {[{ key: 'matrix', label: 'เมทริกซ์สิทธิ์' }, { key: 'users', label: `รายชื่อผู้ใช้ (${users.length})` }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as 'matrix' | 'users')}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeSubTab === tab.key ? 'var(--surface)' : 'transparent',
              color: activeSubTab === tab.key ? 'var(--text)' : 'var(--text-2)',
              boxShadow: activeSubTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'matrix' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Toggle เพื่อให้สิทธิ์เข้าถึงเมนู</p>
            <SaveBtn onClick={handleSave} loading={saving} />
          </div>
          <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--border)' }}>
            <table className="text-xs">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th className="px-4 py-3 text-left font-medium sticky left-0" style={{ color: 'var(--text-2)', background: 'var(--surface-2)', minWidth: '120px' }}>เมนู</th>
                  {data.roles.map((role) => (
                    <th key={role} className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-2)', minWidth: '80px' }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.menuKeys.map((mk) => (
                  <tr key={mk} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5 font-medium sticky left-0" style={{ color: 'var(--text)', background: 'var(--surface)' }}>
                      {MENU_LABELS[mk] ?? mk}
                    </td>
                    {data.roles.map((role) => {
                      const on = matrix[mk]?.[role] ?? false
                      return (
                        <td key={role} className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => togglePerm(mk, role)}
                            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                            style={{ background: on ? 'var(--green)' : 'var(--border-strong)' }}
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                              style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['ชื่อผู้ใช้', 'ชื่อ-นามสกุล', 'Email', 'Role', 'สาขา/VD', 'สถานะ', 'วันที่สร้าง'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium text-xs" style={{ color: 'var(--text-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5 font-mono text-xs font-medium" style={{ color: 'var(--text)' }}>{u.username}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text)' }}>{u.fullName}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>{u.email ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full b-blue">{u.role}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>
                    {u.site ? `${u.site.code} ${u.site.name}` : u.vendorCenter ? u.vendorCenter.code : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? 'b-green' : 'b-gray'}`}>
                      {u.active ? 'ใช้งาน' : 'ปิด'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-2)' }}>
                    {new Date(u.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Placeholder Section ──────────────────────────────────────────────────────

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Settings size={36} style={{ color: 'var(--border-strong)' }} />
      <p className="font-medium" style={{ color: 'var(--text-2)' }}>{title}</p>
      <p className="text-sm" style={{ color: 'var(--text-mute)' }}>อยู่ระหว่างพัฒนา</p>
    </div>
  )
}

// ─── Sidebar Nav Config ───────────────────────────────────────────────────────

const SECTIONS = [
  { id: 1, label: 'Vendor Portal', icon: <Store size={16} />, component: <VendorSection /> },
  { id: 2, label: 'ค่าดำเนินการ / ค่าขนส่ง', icon: <DollarSign size={16} />, component: <FeeSection /> },
  { id: 3, label: 'สาขา', icon: <MapPin size={16} />, component: <SitesSection /> },
  { id: 4, label: 'จับคู่สาขา-VD', icon: <Route size={16} />, component: <RoutesSection /> },
  { id: 5, label: 'SLA', icon: <Clock size={16} />, component: <SlaSection /> },
  { id: 6, label: 'สิทธิ์ผู้ใช้', icon: <ShieldCheck size={16} />, component: <RbacSection /> },
  { id: 7, label: 'โปรโมชัน', icon: <Tag size={16} />, component: <PlaceholderSection title="โปรโมชัน" /> },
  { id: 8, label: 'รายงาน', icon: <BarChart2 size={16} />, component: <PlaceholderSection title="รายงาน" /> },
  { id: 9, label: 'สินค้า / แบรนด์', icon: <Package size={16} />, component: <PlaceholderSection title="สินค้า / แบรนด์" /> },
  { id: 10, label: 'ระบบ', icon: <Settings size={16} />, component: <PlaceholderSection title="ตั้งค่าระบบ" /> },
]

// Import Tag for section 7
import { Tag } from 'lucide-react'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeId, setActiveId] = useState(1)

  const active = SECTIONS.find((s) => s.id === activeId)!

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>ตั้งค่าระบบหลังบ้าน</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Admin Settings — เฉพาะ ADMIN เท่านั้น</p>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <aside
          className="w-56 shrink-0 rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)', alignSelf: 'start' }}
        >
          <div className="px-3 py-3">
            {SECTIONS.map((sec) => {
              const isActive = sec.id === activeId
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveId(sec.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all mb-0.5"
                  style={{
                    background: isActive ? 'var(--red-tint)' : 'transparent',
                    color: isActive ? 'var(--red)' : 'var(--text-2)',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '3px solid var(--red)' : '3px solid transparent',
                  }}
                >
                  <span style={{ color: isActive ? 'var(--red)' : 'var(--text-mute)' }}>{sec.icon}</span>
                  <span className="flex-1 text-xs">{sec.id}. {sec.label}</span>
                  {isActive && <ChevronRight size={12} />}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--red)' }}>{active.icon}</span>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              {active.id}. {active.label}
            </h2>
          </div>
          {active.component}
        </div>
      </div>
    </div>
  )
}
