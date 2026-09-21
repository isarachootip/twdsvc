'use client'

import { useEffect, useMemo, useState } from 'react'

type Db = Record<string, Record<string, Array<[string, string]>>>

const DEFAULT_BKK: Db = {
  'กรุงเทพมหานคร': {
    'คลองเตย': [['คลองเตย', '10110'], ['คลองตัน', '10110'], ['พระโขนง', '10110']],
    'จตุจักร': [['จตุจักร', '10900'], ['จอมพล', '10900'], ['จันทรเกษม', '10900'], ['ลาดยาว', '10900'], ['เสนานิคม', '10900']],
    'ดอนเมือง': [['ดอนเมือง', '10210'], ['สนามบิน', '10210'], ['สีกัน', '10210']],
    'บางกะปิ': [['คลองจั่น', '10240'], ['หัวหมาก', '10240']],
    'บางเขน': [['ท่าแร้ง', '10220'], ['อนุสาวรีย์', '10220']],
    'บางนา': [['บางนาเหนือ', '10260'], ['บางนาใต้', '10260']],
    'บางรัก': [['บางรัก', '10500'], ['มหาพฤฒาราม', '10500'], ['สีลม', '10500'], ['สุริยวงศ์', '10500']],
    'ปทุมวัน': [['ปทุมวัน', '10330'], ['รองเมือง', '10330'], ['ลุมพินี', '10330'], ['วังใหม่', '10330']],
    'พระโขนง': [['บางจาก', '10260'], ['พระโขนงใต้', '10260']],
    'วัฒนา': [['คลองตันเหนือ', '10110'], ['คลองเตยเหนือ', '10110'], ['พระโขนงเหนือ', '10110']],
    'ห้วยขวาง': [['บางกะปิ', '10310'], ['สามเสนนอก', '10310'], ['ห้วยขวาง', '10310']],
  },
  'นนทบุรี': {
    'เมืองนนทบุรี': [['บางกระสอ', '11000'], ['สวนใหญ่', '11000'], ['ตลาดขวัญ', '11000']],
    'บางใหญ่': [['บางใหญ่', '11140'], ['เสาธงหิน', '11140']],
    'ปากเกร็ด': [['ปากเกร็ด', '11120'], ['บางพูด', '11120'], ['คลองเกลือ', '11120']],
  },
  'สมุทรปราการ': {
    'เมืองสมุทรปราการ': [['ปากน้ำ', '10270'], ['ท้ายบ้าน', '10280'], ['สำโรงเหนือ', '10270']],
    'บางพลี': [['บางพลีใหญ่', '10540'], ['บางแก้ว', '10540'], ['ราชาเทวะ', '10540']],
  },
  'ปทุมธานี': {
    'เมืองปทุมธานี': [['บางปรอก', '12000'], ['บ้านกลาง', '12000']],
    'คลองหลวง': [['คลองหนึ่ง', '12120'], ['คลองสอง', '12120']],
    'ธัญบุรี': [['รังสิต', '12110'], ['ประชาธิปัตย์', '12130']],
  },
  'ชลบุรี': {
    'เมืองชลบุรี': [['บางปลาสร้อย', '20000'], ['บ้านสวน', '20000'], ['แสนสุข', '20130']],
    'บางละมุง': [['พัทยา', '20150'], ['หนองปรือ', '20150'], ['นาเกลือ', '20150']],
    'ศรีราชา': [['ศรีราชา', '20110'], ['สุรศักดิ์', '20110'], ['บ่อวิน', '20230']],
  },
}

let dbPromise: Promise<Db> | null = null
function loadDb() {
  if (!dbPromise) {
    dbPromise = fetch('/data/thai-address.json')
      .then(r => r.json())
      .then((data: Db) => ({ ...DEFAULT_BKK, ...data }))
      .catch(() => DEFAULT_BKK)
  }
  return dbPromise
}

export interface Address { zip: string; province: string; district: string; subdistrict: string; street: string }
export const emptyAddress: Address = { zip: '', province: '', district: '', subdistrict: '', street: '' }

export function formatAddress(a: Address) {
  return [a.street, a.subdistrict && `แขวง/ตำบล ${a.subdistrict}`, a.district && `เขต/อำเภอ ${a.district}`, a.province, a.zip].filter(Boolean).join(' ')
}

/** รหัสไปรษณีย์ (5 หลัก → เติมจังหวัด/เขต/แขวง) + จังหวัด→เขต→แขวง cascade (เลือกแขวง → เติม zip) — 05 §9 */
export default function AddressFields({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  const [db, setDb] = useState<Db>(DEFAULT_BKK)
  useEffect(() => { loadDb().then(setDb) }, [])
  const provinces = useMemo(() => Object.keys(db).sort((a, b) => (a === 'กรุงเทพมหานคร' ? -1 : b === 'กรุงเทพมหานคร' ? 1 : a.localeCompare(b, 'th'))), [db])
  const districts = useMemo(() => (value.province && db[value.province] ? Object.keys(db[value.province]).sort((a, b) => a.localeCompare(b, 'th')) : []), [db, value.province])
  const subs = useMemo(() => (value.province && value.district ? db[value.province]?.[value.district] ?? [] : []), [db, value.province, value.district])

  const onZip = (zip: string) => {
    const z = zip.replace(/\D/g, '').slice(0, 5)
    const next = { ...value, zip: z }
    if (z.length === 5) {
      for (const [p, amps] of Object.entries(db)) {
        for (const [a, ds] of Object.entries(amps)) {
          const hit = ds.find(d => d[1] === z)
          if (hit) { onChange({ ...next, province: p, district: a, subdistrict: ds.filter(d => d[1] === z).length === 1 ? hit[0] : '' }); return }
        }
      }
    }
    onChange(next)
  }

  return (
    <>
      <div className="grid4">
        <div className="field"><label>รหัสไปรษณีย์</label><input className="inp" inputMode="numeric" placeholder="เช่น 10260" maxLength={5} value={value.zip} onChange={e => onZip(e.target.value)} /></div>
        <div className="field"><label>จังหวัด</label>
          <select className="sel" value={value.province} onChange={e => onChange({ ...value, province: e.target.value, district: '', subdistrict: '' })}>
            <option value="">เลือก</option>
            {provinces.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="field"><label>เขต/อำเภอ</label>
          <select className="sel" value={value.district} disabled={!value.province} onChange={e => onChange({ ...value, district: e.target.value, subdistrict: '' })}>
            <option value="">{value.province ? 'เลือก' : 'เลือกจังหวัดก่อน'}</option>
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label>แขวง/ตำบล</label>
          <select className="sel" value={value.subdistrict} disabled={!value.district} onChange={e => {
            const s = subs.find(x => x[0] === e.target.value)
            onChange({ ...value, subdistrict: e.target.value, zip: s ? s[1] : value.zip })
          }}>
            <option value="">{value.district ? 'เลือก' : 'เลือกเขตก่อน'}</option>
            {subs.map(s => <option key={s[0] + s[1]} value={s[0]}>{s[0]}</option>)}
          </select>
        </div>
      </div>
      <div className="field" style={{ marginTop: 12 }}><label>ที่อยู่ (บ้านเลขที่ / ถนน)</label><input className="inp" placeholder="เลขที่ ถนน ซอย" value={value.street} onChange={e => onChange({ ...value, street: e.target.value })} /></div>
    </>
  )
}
