'use client'

import { useState } from 'react'
import { 
  BookOpen, Search, UserCheck, Package, Warehouse, Wrench, 
  Truck, ShieldCheck, HelpCircle, ChevronRight, CheckCircle2, 
  AlertTriangle, ArrowRight, ExternalLink, Copy, Check
} from 'lucide-react'

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'cs' | 'gr' | 'dc' | 'vd' | 's2' | 'admin' | 'km' | 'faq'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedUser, setCopiedUser] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUser(text)
    setTimeout(() => setCopiedUser(null), 2000)
  }

  const testAccounts = [
    { role: 'CS (บริการลูกค้า)', user: 'test_cs', pass: 'password123', site: 'สาขาบางนา (BN)', desc: 'เปิดใบแจ้งซ่อม, ถ่ายรูป S/N, เก็บค่าเปิดเครื่อง, ปิดงานพร้อมลายเซ็น' },
    { role: 'GR (คลังสาขา)', user: 'test_gr', pass: 'password123', site: 'สาขาบางนา (BN)', desc: 'รับเครื่องจาก CS, แพ็กสินค้า, เลือกส่ง DC หรือตรง Vendor' },
    { role: 'DC (คลังใหญ่)', user: 'test_dc', pass: 'password123', site: 'คลัง DC กรุงเทพ', desc: 'รับเข้าคลัง DC, ตีกลับสินค้า (Reject), ส่งต่อ Vendor' },
    { role: 'VD (ศูนย์ซ่อม/ช่าง)', user: 'test_vd', pass: 'password123', site: 'บ.ช่างเจริญ', desc: 'ตรวจเช็ค, ทำใบเสนอราคา Cost-Plus, บันทึกผลซ่อม' },
    { role: 'S2 (เร่งรัดงาน)', user: 'test_s2', pass: 'password123', site: 'ศูนย์ประสานงาน', desc: 'มอนิเตอร์ไฟเตือน SLA (On Track / At Risk / Overdue), เร่งรัดงานค้าง' },
    { role: 'Admin (ผู้ดูแลระบบ)', user: 'test_am', pass: 'password123', site: 'สำนักงานใหญ่', desc: 'จัดการ SLA 16 ขั้น, ค่าธรรมเนียม, สิทธิ์เมนู, ผู้ใช้งาน' },
    { role: 'Executive (ผู้บริหาร)', user: 'test_exec', pass: 'password123', site: 'บริหารส่วนกลาง', desc: 'ดู Executive Dashboard สรุป KPI, SLA Compliance %' },
  ]

  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true
    return text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
              <BookOpen size={14} />
              <span>TRAINING & KM CENTER (V2.2.0)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              คู่มือการใช้งานระบบ & คลังความรู้ (KM Guide)
            </h1>
            <p className="text-red-100 text-sm max-w-2xl leading-relaxed">
              ระบบใบแจ้งซ่อม VService Repair System — รวบรวมแนวทางปฏิบัติงานทีละขั้นตอน (Step-by-Step),
              มาตรฐานรหัสสถานะ 3 หลัก, กฎธุรกิจ SLA และแนวทางแก้ไขปัญหาหน้างาน
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาหน้าจอ, รหัสสถานะ, SLA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none border-t border-white/10 pt-4">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'cs', label: 'CS บริการลูกค้า' },
            { id: 'gr', label: 'GR คลังสาขา' },
            { id: 'dc', label: 'DC คลังกลาง' },
            { id: 'vd', label: 'VD ช่าง/ศูนย์ซ่อม' },
            { id: 's2', label: 'S2 ติดตามงาน' },
            { id: 'admin', label: 'Admin & Exec' },
            { id: 'km', label: 'กฎธุรกิจ KM' },
            { id: 'faq', label: 'คำถามที่พบบ่อย' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Accounts Card */}
      {(activeTab === 'all' || activeTab === 'admin') && matchesSearch('บัญชีผู้ใช้ รหัสผ่าน demo test account login') && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">บัญชีทดสอบระบบสำหรับฝึกอบรม (Training Accounts)</h3>
                <p className="text-xs text-gray-500">รหัสผ่านเริ่มต้นทุกบัญชีคือ: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-red-600">password123</code></p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">บทบาท (Role)</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">สังกัด/สาขา</th>
                  <th className="py-3 px-4">ขอบเขตหน้าที่</th>
                  <th className="py-3 px-4 text-center">คัดลอก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {testAccounts.map((acc) => (
                  <tr key={acc.user} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800">{acc.role}</td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">{acc.user}</td>
                    <td className="py-3 px-4">{acc.site}</td>
                    <td className="py-3 px-4 text-gray-500">{acc.desc}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => copyToClipboard(acc.user)}
                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                        title="คัดลอก Username"
                      >
                        {copiedUser === acc.user ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overview Diagram & Status Standard */}
      {(activeTab === 'all' || activeTab === 'km') && matchesSearch('สถานะ diagram workflow dc path vendor path 100 200 300') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
            <ArrowRight size={20} className="text-red-600" />
            <span>มาตรฐานรหัสสถานะ 3 หลัก และเส้นทางเดินงาน (Status Flow Architecture)</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            ระบบใช้ตัวเลข 3 หลักเพื่อความโปร่งใสและอ่านความคืบหน้าได้ทันที:
            <span className="font-semibold text-gray-800"> หลักร้อย</span> คือสายงาน (0=ยกเลิก, 1=รับเข้าสาขา, 2=DC Path, 3=Vendor Path),
            <span className="font-semibold text-gray-800"> หลักสิบ</span> คือลำดับขั้นตอน, และ
            <span className="font-semibold text-gray-800"> หลักหน่วย</span> คือทางเลือกผลลัพธ์ (เช่น 270 ไม่ซ่อม / 275 ซ่อมเสร็จ)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <Warehouse size={16} />
                <span>เส้นทางผ่านคลัง DC (DC Path - รหัส 2xx)</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                เหมาะสำหรับสินค้าแบรนด์หลักที่มีสัญญาขนส่งผ่านคลังใหญ่ (Hitachi, Panasonic, Samsung, LG ฯลฯ)
                สาขาส่งเข้าคลัง DC เพื่อรวบรวมส่งต่อช่างศูนย์ซ่อม
              </p>
              <div className="text-[11px] font-mono text-blue-700 bg-white/70 p-2.5 rounded-lg border border-blue-100">
                100 CS เปิดงาน → 110 GR รับ → 200 จัดส่ง DC → 220 DC รับเข้า → 230 DC ส่ง Vendor → 240 ตีราคา → 260 ลูกค้าอนุมัติ → 275 ซ่อมเสร็จ → 280 คืน DC → 285 คืนสาขา → 290 GR รับ → 299 ส่งมอบลูกค้า
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                <Wrench size={16} />
                <span>เส้นทางส่งตรง Vendor (Direct Path - รหัส 3xx)</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                เหมาะสำหรับศูนย์ซ่อมในพื้นที่ (Local Vendor) ที่ช่างมารับเครื่องเองที่สาขา หรือส่งผ่าน 3PL ตรงถึงศูนย์ซ่อมเพื่อความรวดเร็ว
              </p>
              <div className="text-[11px] font-mono text-purple-700 bg-white/70 p-2.5 rounded-lg border border-purple-100">
                100 CS เปิดงาน → 110 GR รับ → 300 จัดส่ง Vendor → 310 Vendor รับเข้า → 320 ทำใบเสนอราคา → 330 CS แจ้งลูกค้า → 345 ซ่อมเสร็จ → 350 ส่งคืนสาขา → 360 GR รับ → 390 CS เตรียมมอบ → 399 ส่งมอบลูกค้า
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Guides: CS */}
      {(activeTab === 'all' || activeTab === 'cs') && matchesSearch('cs บริการลูกค้า เปิดใบแจ้งซ่อม รูป serial ลายเซ็น ค่าเปิดเครื่อง') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold">CS</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">แผนกบริการลูกค้า (Customer Service)</h3>
                <p className="text-xs text-gray-500">หน้าจอ: <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/cs</code> และ <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/cs/new</code></p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">หน้าร้านสาขา</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">1</span>
                <span>เปิดใบแจ้งซ่อมใหม่ (/cs/new)</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>กรอกชื่อและเบอร์โทรศัพท์ลูกค้า (ใช้ส่ง SMS Link)</li>
                <li>ค้นหา SKU สินค้า และระบุ Serial Number</li>
                <li><strong className="text-red-600">บังคับแนบ:</strong> รูปถ่าย S/N และรูปตัวเครื่อง</li>
                <li>เลือกระดับบริการ (Normal / Express / VIP)</li>
                <li>ออกใบเสร็จค่าเปิดเครื่อง (Diagnostic Fee) งานนอกประกัน</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">2</span>
                <span>ส่งมอบเครื่องให้คลัง GR</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>พิมพ์ป้าย Job Tag แปะตัวเครื่อง</li>
                <li>นำเครื่องส่งแผนก GR คลังสาขา</li>
                <li>กดปุ่ม <span className="font-semibold text-gray-800">"ส่งมอบให้ GR"</span> ในระบบ</li>
                <li>บันทึกชื่อผู้ส่งมอบ และผู้รับเครื่องฝั่ง GR</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">3</span>
                <span>ปิดงานส่งมอบลูกค้า (/cs)</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>เมื่อเครื่องซ่อมเสร็จกลับมาที่สาขา</li>
                <li>เรียกเก็บยอดค่าซ่อมคงเหลือ (หักค่าเปิดเครื่องแล้ว)</li>
                <li>ให้ลูกค้าลงนามในช่อง <strong className="text-amber-700">Digital Signature Canvas</strong></li>
                <li>กดยืนยันส่งมอบ ระบบออกเลขใบคืนสินค้าปิดงาน 299/399</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Screen Guides: GR */}
      {(activeTab === 'all' || activeTab === 'gr') && matchesSearch('gr คลังสาขา แพ็กสินค้า ขนส่ง เลือกเส้นทาง dc vendor') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold">GR</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">แผนกคลังสินค้าสาขา (Goods Receiving)</h3>
                <p className="text-xs text-gray-500">หน้าจอ: <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/gr</code></p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">คลังสาขา</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>รับเครื่อง & แพ็กกิ้ง</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>ตรวจรับเครื่องจาก CS (สถานะ 110: GR_RECEIVED)</li>
                <li>ห่อบับเบิ้ลกันกระแทก บรรจุลงกล่องมาตรฐาน</li>
                <li>กดปุ่ม <span className="font-semibold text-gray-800">"แพ็กกิ้งเสร็จสิ้น"</span> (GR_PACKED)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>ตัดสินใจเลือกเส้นทาง (Key Action)</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>กดปุ่ม <span className="font-bold text-blue-700">"จัดส่งให้ DC (200)"</span> สำหรับแบรนด์มาตรฐาน</li>
                <li>กดปุ่ม <span className="font-bold text-purple-700">"จัดส่งให้ Vendor (300)"</span> สำหรับช่างพื้นที่</li>
                <li>ระบบจะแจ้งเตือนหากสินค้านั้นอยู่นอกเงื่อนไข DC เพื่อให้ยืนยันก่อน</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>ส่งมอบคนขับ & รับเครื่องคืน</span>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                <li>บันทึกชื่อคนขับรถ, ทะเบียนรถ, เบอร์โทร และแนบรูปใบส่งของ</li>
                <li>เมื่อเครื่องซ่อมเสร็จกลับมาสาขา: กดรับคืน (290 หรือ 360)</li>
                <li>ส่งมอบต่อให้เคาน์เตอร์ CS เพื่อโทรเรียกลูกค้า</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Screen Guides: DC */}
      {(activeTab === 'all' || activeTab === 'dc') && matchesSearch('dc คลังใหญ่ ตีกลับ reject location ศูนย์กระจายสินค้า') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold">DC</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">ศูนย์กระจายสินค้า (Distribution Center)</h3>
                <p className="text-xs text-gray-500">หน้าจอ: <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/dc</code> หรือคิว DC</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">คลังกลาง</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-gray-800">1. รับเข้าคลัง (220)</span>
              <p className="text-gray-600">สแกนบาร์โค้ดรับสินค้าจากรถสาขาเข้า Location พักสินค้า ตรวจสอบสภาพกล่องภายนอก</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-red-600">2. การตีกลับสินค้า (Reject)</span>
              <p className="text-gray-600">หากพบสินค้าเสียหายจากการขนส่ง หรือสินค้าไม่ตรงเอกสาร กดปุ่ม <span className="font-bold text-red-600">"ตีกลับไปยังสาขา"</span> ระบุเหตุผล ระบบจะตั้งแฟล็ก reject_flg="Y"</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-gray-800">3. ส่งต่อ Vendor & รับคืน (230/280)</span>
              <p className="text-gray-600">รวมส่งต่อศูนย์บริการแบรนด์ และรับคืนเครื่องซ่อมเสร็จเพื่อกระจายขึ้นรถสายรอบปกติกลับสาขาต้นทาง</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Guides: Vendor & Quotation */}
      {(activeTab === 'all' || activeTab === 'vd') && matchesSearch('vd ช่าง ศูนย์ซ่อม ใบเสนอราคา quotation cost-plus gp margin') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 font-bold">VD</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">ศูนย์บริการซ่อมภายนอก (Vendor Repair Center)</h3>
                <p className="text-xs text-gray-500">หน้าจอ: <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/jobs</code> และหน้า Action ช่าง</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">ช่างซ่อม</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-gray-800">1. รับเครื่องตรวจเช็ค (310)</span>
              <p className="text-gray-600">ช่างลงบันทึกรับเครื่องเข้าซ่อม เริ่มนับเวลาตรวจเช็คตาม SLA ช่าง</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-purple-700">2. ทำใบเสนอราคา (Cost-Plus)</span>
              <p className="text-gray-600">ระบุรายการอะไหล่และค่าแรง ช่างระบุต้นทุน (Cost) ระบบคำนวณราคาขายพร้อม GP Margin อัตโนมัติ ก่อนส่งขออนุมัติลูกค้า</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="font-bold text-gray-800">3. บันทึกผลการซ่อม</span>
              <p className="text-gray-600">เมื่อลูกค้าอนุมัติ: ดำเนินการซ่อมและกด <span className="text-green-600 font-bold">"ซ่อมเสร็จ (275/345)"</span> หรือหากปฏิเสธ ให้กด <span className="text-gray-600 font-bold">"ไม่ซ่อมส่งคืนเดิม (270/340)"</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Guides: Customer Public Portal */}
      {(activeTab === 'all' || activeTab === 'cs' || activeTab === 'vd') && matchesSearch('ลูกค้า customer portal sms link q token อนุมัติซ่อม') && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <ExternalLink size={18} className="text-emerald-600" />
            <span>พอร์ทัลลูกค้าพิจารณาใบเสนอราคาออนไลน์ (/q/[token])</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            ลูกค้าจะได้รับลิงก์เฉพาะผ่าน SMS เช่น <code className="bg-white px-2 py-0.5 rounded border text-emerald-700">https://vhomesvc.online/q/abcdef123</code>
            สามารถเปิดดูได้จากสมาร์ทโฟนทันทีโดยไม่ต้องติดตั้งแอปพลิเคชัน:
          </p>
          <ul className="list-disc list-inside text-xs text-emerald-700 space-y-1">
            <li>แสดงตารางค่าอะไหล่และค่าแรง (เฉพาะราคาขาย ไม่เปิดเผยต้นทุนภายใน)</li>
            <li>แสดงยอดหักลดค่าเปิดเครื่องที่ลูกค้าจ่ายไว้แล้ว (Diagnostic Fee Credit)</li>
            <li>ลูกค้ากดปุ่ม <strong className="text-emerald-700">"อนุมัติซ่อม"</strong> หรือ <strong className="text-red-700">"ไม่อนุมัติ"</strong> พร้อมระบุเหตุผล ผลจะอัปเดตเข้าระบบหลัก Real-time ทันที</li>
          </ul>
        </div>
      )}

      {/* Screen Guides: S2, Trade-in, Exec & Admin */}
      {(activeTab === 'all' || activeTab === 's2' || activeTab === 'admin') && matchesSearch('s2 tradein exec admin sla fee rate route') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <Truck size={16} className="text-red-600" />
              <span>S2 ฝ่ายประสานงานและเร่งรัดงาน (/s2)</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              มอนิเตอร์สถานะ SLA แบบสัญญาณไฟจราจร: 🟢 On Track (ปกติ), 🟡 At Risk (เหลือเวลา &lt; 24 ชม.), 🔴 Critical Overdue (เกินกำหนด)
              พร้อมฟังก์ชันบันทึกการติดตามและส่ง Notification เตือนช่าง
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <ShieldCheck size={16} className="text-red-600" />
              <span>ตั้งค่าระบบหลังบ้าน Admin (/admin)</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              จัดการ SLA 16 ขั้นตอน, อัตราค่าบริการตามขนาดสินค้า (Small/Large), จัดการเส้นทางเดินสินค้าประจำสาขา,
              จัดการสิทธิ์เมนู RBAC และเพิ่ม/แก้ไขผู้ใช้งานในระบบ
            </p>
          </div>
        </div>
      )}

      {/* KM Articles */}
      {(activeTab === 'all' || activeTab === 'km') && matchesSearch('km knowledge กฎธุรกิจ sla multiplier diagnostic fee rollback') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-lg border-b pb-3">
            <BookOpen size={20} className="text-red-600" />
            <span>คลังความรู้และกฎธุรกิจหลัก (KM Articles)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="font-bold text-red-700 text-sm">KM-01: SLA Multipliers ตาม Service Tier</div>
              <p className="text-gray-600 leading-relaxed">
                การคิดกำหนดเวลาแล้วเสร็จ: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold">Deadline = วันที่เริ่ม + (SLA Base × Tier Multiplier)</code>
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li><strong>NORMAL:</strong> ตัวคูณ 1.0 (เวลามาตรฐาน 7 วันทำการ)</li>
                <li><strong>EXPRESS:</strong> ตัวคูณ 0.5 (เวลาลดลงครึ่งหนึ่ง ช่างต้องตรวจใน 48 ชม.)</li>
                <li><strong>VIP:</strong> ตัวคูณ 0.3 สำหรับลูกค้าระดับผู้บริหาร/โครงการ</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="font-bold text-red-700 text-sm">KM-02: นโยบายค่าเปิดเครื่อง (Diagnostic Fee)</div>
              <p className="text-gray-600 leading-relaxed">
                เรียกเก็บทันที ณ วันรับเครื่อง (เฉพาะงานนอกประกัน) เช่น แอร์ 300 บาท, ตู้เย็น 300 บาท, ทีวี 200 บาท
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>หากลูกค้าอนุมัติซ่อม: ยอดนี้จะถูกนำไปหักลดจากยอดค่าซ่อมสุทธิ</li>
                <li>หากลูกค้าไม่อนุมัติซ่อม: <strong className="text-red-600">ไม่คืนเงิน</strong> เนื่องจากมีต้นทุนตรวจเช็คแล้ว</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="font-bold text-red-700 text-sm">KM-03: กฎใบเสนอราคาแบบต้นทุนบวกกำไร (Cost-Plus)</div>
              <p className="text-gray-600 leading-relaxed">
                ช่าง Vendor ระบุต้นทุน (Cost) โดยระบบจะคำนวณราคาขายอัตโนมัติตาม Gross Profit (GP%) ที่กำหนดในระบบ
              </p>
              <p className="text-gray-600">
                ลูกค้าจะมองเห็นเฉพาะ <strong>ราคาขายสุทธิรวม VAT</strong> โดยไม่เปิดเผยโครงสร้างต้นทุนและ GP ภายใน
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="font-bold text-red-700 text-sm">KM-04: กฎการถอยสถานะ (Rollback Map)</div>
              <p className="text-gray-600 leading-relaxed">
                ระบบไม่อนุญาตให้ถอยสถานะข้ามขั้นตอนตามใจชอบ แต่ต้องถอยทีละขั้นตาม Rollback Map และต้องระบุเหตุผลทุกครั้ง
              </p>
              <p className="text-gray-600">
                การยกเลิกใบงาน (000: CANCELLED) ทำได้เฉพาะก่อนส่งมอบให้ขนส่งเท่านั้น เพื่อความถูกต้องทางบัญชี
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting & FAQs */}
      {(activeTab === 'all' || activeTab === 'faq') && matchesSearch('faq คำถามที่พบบ่อย ปัญหา sms ปุ่มเทา ลายเซ็น') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-lg border-b pb-3">
            <HelpCircle size={20} className="text-red-600" />
            <span>คำถามที่พบบ่อยและการแก้ไขปัญหาหน้างาน (FAQs & Troubleshooting)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1.5">
              <div className="font-bold text-amber-900 text-sm">Q: ลูกค้าแจ้งว่าไม่ได้รับ SMS ลิงก์ใบเสนอราคา ต้องทำอย่างไร?</div>
              <p className="text-gray-700 leading-relaxed">
                <strong>วิธีแก้:</strong> ให้เจ้าหน้าที่ CS เข้าไปที่หน้า <code className="bg-white px-1.5 py-0.5 rounded border font-mono">/cs</code> ค้นหาหมายเลข Job No. ของลูกค้า
                จากนั้นกดเข้าไปดูรายละเอียด จะมีปุ่ม <strong>"คัดลอกลิงก์ใบเสนอราคา (Copy Quote Link)"</strong> เจ้าหน้าที่สามารถส่งลิงก์ให้ลูกค้าผ่าน LINE หรือช่องทางแชทได้ทันที
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <div className="font-bold text-gray-900 text-sm">Q: ปุ่มดำเนินการเป็นสีเทา กดไม่ได้ เกิดจากสาเหตุใด?</div>
              <p className="text-gray-700 leading-relaxed">
                <strong>วิธีแก้:</strong> 1) ตรวจสอบว่าบัญชีที่ Login อยู่มีสิทธิ์ตรงกับสถานะนั้นหรือไม่ (เช่น บัญชี CS จะไม่สามารถกดยืนยันรับของเข้าคลัง DC ได้)
                หรือ 2) ตรวจสอบว่ามีช่องข้อมูลบังคับที่มีเครื่องหมายดอกจัน (*) เช่น รูปถ่าย S/N หรือชื่อผู้มารับสินค้า ที่ยังกรอกไม่ครบหรือไม่
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <div className="font-bold text-gray-900 text-sm">Q: เครื่องซ่อมเสร็จแล้ว แต่ทำไม CS กดยืนยันปิดงานส่งมอบไม่ได้?</div>
              <p className="text-gray-700 leading-relaxed">
                <strong>วิธีแก้:</strong> ตรวจสอบว่ายอดเงินคงเหลือได้รับการชำระครบถ้วนแล้วหรือยัง (ยอดค้างชำระต้องเป็น 0) และลูกค้าต้องทำการลงนามในช่อง <strong>Digital Signature</strong> ให้เรียบร้อยก่อนกดยืนยัน
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
