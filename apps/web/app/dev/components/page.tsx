'use client';

import React, { useState } from 'react';
import {
  StatusBadge,
  JobStageType,
} from '@/components/domain/StatusBadge';
import { SlaTag } from '@/components/domain/SlaTag';
import { JobIdCell } from '@/components/domain/JobIdCell';
import { KpiCard } from '@/components/domain/KpiCard';
import { OverdueSummaryBanner } from '@/components/domain/OverdueSummaryBanner';
import { QueueTabs, TabItem } from '@/components/domain/QueueTabs';
import { SortableTable, Column } from '@/components/domain/SortableTable';
import { PhotoCaptureButton } from '@/components/domain/PhotoCaptureButton';
import { LocationInput } from '@/components/domain/LocationInput';
import { RadioCards, RadioCardOption } from '@/components/domain/RadioCards';
import { AddressFields, AddressValue } from '@/components/domain/AddressFields';
import { MultiSelectTags } from '@/components/domain/MultiSelectTags';
import { Toggle } from '@/components/domain/Toggle';
import { DateRangeExport } from '@/components/domain/DateRangeExport';
import { PrintPreviewModal } from '@/components/domain/PrintPreviewModal';
import { EmptyState } from '@/components/domain/EmptyState';
import {
  Package,
  Wrench,
  CheckCircle,
  Truck,
  Box,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface SampleJob {
  jobNo: string;
  customerName: string;
  productName: string;
  brand: string;
  stage: JobStageType;
  hoursInStep: number;
  slaHours: number;
  isOverdue: boolean;
  location: string;
}

const SAMPLE_JOBS: SampleJob[] = [
  {
    jobNo: 'JB-2609-0001',
    customerName: 'สมชาย ใจดี',
    productName: 'สว่านไร้สาย 18V',
    brand: 'MAKITA',
    stage: 'GR_RECEIVED',
    hoursInStep: 12,
    slaHours: 24,
    isOverdue: false,
    location: 'A-01-02',
  },
  {
    jobNo: 'JB-2609-0002',
    customerName: 'วิภา สุขสม',
    productName: 'เครื่องตัดหญ้า 4 จังหวะ',
    brand: 'HONDA',
    stage: 'VD_INSPECTING',
    hoursInStep: 32,
    slaHours: 24,
    isOverdue: true,
    location: 'B-03-01',
  },
  {
    jobNo: 'JB-2609-0003',
    customerName: 'อนุชา มีทรัพย์',
    productName: 'ปั๊มน้ำอัตโนมัติ 250W',
    brand: 'MITSUBISHI',
    stage: 'WAITING_APPROVAL',
    hoursInStep: 18,
    slaHours: 24,
    isOverdue: false,
    location: 'A-02-04',
  },
  {
    jobNo: 'JB-2609-0004',
    customerName: 'กิตติพงษ์ ยอดเยี่ยม',
    productName: 'ตู้เชื่อมอินเวอร์เตอร์ 200A',
    brand: 'PUMPKIN',
    stage: 'READY_FOR_PICKUP',
    hoursInStep: 4,
    slaHours: 48,
    isOverdue: false,
    location: 'C-01-01',
  },
];

export default function DevComponentsShowcasePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [activeKpi, setActiveKpi] = useState<string | null>('repairing');
  const [isFilterOverdue, setIsFilterOverdue] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationVal, setLocationVal] = useState('A-02-03');
  const [sizeCategory, setSizeCategory] = useState<'SMALL' | 'LARGE'>('SMALL');
  const [address, setAddress] = useState<AddressValue>({
    postalCode: '10260',
    province: 'กรุงเทพมหานคร',
    district: 'บางนา',
    subdistrict: 'บางนาเหนือ',
    addressLine: '888 ถ.บางนา-ตราด แขวงบางนาเหนือ',
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([
    'MAKITA',
    'BOSCH',
  ]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const sampleStages: JobStageType[] = [
    'PENDING_VENDOR_ASSIGNMENT',
    'CS_OPENED',
    'GR_RECEIVED',
    'GR_PACKED',
    'OUTBOUND_TO_DC',
    'AT_DC_OUTBOUND',
    'VD_INSPECTING',
    'WAITING_APPROVAL',
    'REPAIRING',
    'RETURN_PACKING',
    'INBOUND_TO_BRANCH',
    'GR_RETURN_RECEIVED',
    'READY_FOR_PICKUP',
    'CLOSED_REPAIRED',
    'CLOSED_NOT_REPAIRED',
    'CANCELLED',
  ];

  const sizeOptions: RadioCardOption<'SMALL' | 'LARGE'>[] = [
    {
      value: 'SMALL',
      title: 'สินค้าขนาดเล็ก (Small)',
      description: 'ขนาดพัสดุไม่เกิน 60 ซม. หรือน้ำหนักไม่เกิน 15 กก. ส่งผ่าน DC ปกติ',
      badge: 'ค่าจัดส่ง ฿80',
      badgeVariant: 'green',
      icon: <Box className="w-5 h-5" />,
    },
    {
      value: 'LARGE',
      title: 'สินค้าขนาดใหญ่ (Large)',
      description: 'สินค้าขนาดใหญ่พิเศษหรือน้ำหนักเกิน 15 กก. ส่งตรง DSD / รถเหมา',
      badge: 'ค่าจัดส่ง ฿250',
      badgeVariant: 'amber',
      icon: <Truck className="w-5 h-5" />,
    },
  ];

  const brandOptions = [
    { value: 'MAKITA', label: 'Makita', count: 42 },
    { value: 'BOSCH', label: 'Bosch', count: 28 },
    { value: 'DEWALT', label: 'DeWalt', count: 19 },
    { value: 'STANLEY', label: 'Stanley', count: 15 },
    { value: 'PUMPKIN', label: 'Pumpkin', count: 31 },
    { value: 'HITACHI', label: 'Hitachi / Hikoki', count: 12 },
    { value: 'MITSUBISHI', label: 'Mitsubishi', count: 25 },
  ];

  const queueTabsData: TabItem[] = [
    { key: 'all', label: 'งานทั้งหมด', count: 56 },
    { key: 'pending', label: 'รอตรวจรับ (GR)', count: 12 },
    { key: 'dc', label: 'อยู่ระหว่างทาง (DC)', count: 18 },
    { key: 'vendor', label: 'อยู่ที่ศูนย์ซ่อม (VD)', count: 21 },
    { key: 'pickup', label: 'พร้อมรับคืน', count: 5 },
  ];

  const tableColumns: Column<SampleJob>[] = [
    {
      key: 'jobNo',
      title: 'เลขที่ใบงาน',
      sortable: true,
      render: (job: SampleJob) => (
        <JobIdCell
          jobNo={job.jobNo}
          isOverdue={job.isOverdue}
          subText={job.brand}
        />
      ),
    },
    {
      key: 'customerName',
      title: 'ลูกค้า',
      sortable: true,
      render: (job: SampleJob) => (
        <div>
          <div className="font-medium text-text">{job.customerName}</div>
          <div className="text-xs text-text-mute">{job.productName}</div>
        </div>
      ),
    },
    {
      key: 'stage',
      title: 'สถานะ',
      sortable: true,
      render: (job: SampleJob) => <StatusBadge stage={job.stage} size="sm" />,
    },
    {
      key: 'hoursInStep',
      title: 'SLA',
      sortable: true,
      render: (job: SampleJob) => (
        <SlaTag
          hoursInStep={job.hoursInStep}
          slaHours={job.slaHours}
          isOverdue={job.isOverdue}
          overdueOwner={job.isOverdue ? 'ศูนย์ซ่อม VD' : null}
        />
      ),
    },
    {
      key: 'location',
      title: 'ตำแหน่งจัดเก็บ',
      sortable: true,
      render: (job: SampleJob) => (
        <span className="font-mono text-xs px-2 py-0.5 bg-surface-2 rounded border border-border">
          {job.location}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red inline-block" />
            SVCM Shared Component Showcase
          </h1>
          <p className="text-sm text-text-mute mt-1">
            ชุด UI Component มาตรฐานตาม Design Tokens ใน docs/02_architecture.md §6
          </p>
        </div>
        <button
          onClick={() => setIsPrintOpen(true)}
          className="px-4 py-2 bg-red hover:bg-red-dark text-white text-xs font-semibold rounded-input shadow-xs transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          เปิดตัวอย่าง Print Modal
        </button>
      </div>

      {/* 1. Overdue Summary Banner */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">
          1. OverdueSummaryBanner
        </h2>
        <OverdueSummaryBanner
          totalOverdue={5}
          breakdown={{
            grCount: 1,
            vdCount: 3,
            logisticsCount: 1,
            csCount: 0,
          }}
          isFilterActive={isFilterOverdue}
          onFilterOverdue={() => setIsFilterOverdue(true)}
          onClearFilter={() => setIsFilterOverdue(false)}
        />
      </section>

      {/* 2. KPI Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">2. KpiCard (Clickable & Active)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="งานรับใหม่วันนี้"
            value="14"
            icon={Package}
            colorVariant="blue"
            subtitle="รับเข้าสาขาแล้ว"
            active={activeKpi === 'new'}
            onClick={() => setActiveKpi('new')}
          />
          <KpiCard
            title="กำลังซ่อมที่ศูนย์"
            value="28"
            icon={Wrench}
            colorVariant="amber"
            subtitle="เฉลี่ย 3.2 วัน/เครื่อง"
            active={activeKpi === 'repairing'}
            onClick={() => setActiveKpi('repairing')}
          />
          <KpiCard
            title="เกิน SLA กำหนด"
            value="5"
            icon={AlertTriangle}
            colorVariant="red"
            badge="ด่วน"
            subtitle="ต้องติดตามเร่งด่วน"
            active={activeKpi === 'overdue'}
            onClick={() => setActiveKpi('overdue')}
          />
          <KpiCard
            title="พร้อมส่งมอบลูกค้า"
            value="9"
            icon={CheckCircle}
            colorVariant="emerald"
            subtitle="รอปิดงานที่สาขา"
            active={activeKpi === 'ready'}
            onClick={() => setActiveKpi('ready')}
          />
        </div>
      </section>

      {/* 3. Queue Tabs */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">3. QueueTabs</h2>
        <QueueTabs
          tabs={queueTabsData}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </section>

      {/* 4. SortableTable & JobIdCell & StatusBadge & SlaTag */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            4. SortableTable & JobIdCell & SlaTag & StatusBadge
          </h2>
          <span className="text-xs text-text-mute">
            คลิกที่หัวตารางเพื่อจัดเรียง ▲▼
          </span>
        </div>
        <SortableTable
          columns={tableColumns}
          data={SAMPLE_JOBS}
          keyExtractor={(job) => job.jobNo}
          onRowClick={(job) => alert(`คลิกดูรายละเอียดใบงาน: ${job.jobNo}`)}
        />
      </section>

      {/* 5. Status Badges Catalog */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">
          5. StatusBadge (ทุกสถานะในระบบ)
        </h2>
        <div className="p-4 bg-surface rounded-card border border-border flex flex-wrap gap-2.5">
          {sampleStages.map((stg) => (
            <StatusBadge key={stg} stage={stg} />
          ))}
        </div>
      </section>

      {/* 6. Form Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Capture */}
        <div className="p-5 bg-surface rounded-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-text">
            6. PhotoCaptureButton (UI Only)
          </h3>
          <PhotoCaptureButton
            value={photos}
            onChange={setPhotos}
            required={true}
            hint="ถ่ายภาพสภาพสินค้าจริง 0-4 รูป"
          />
        </div>

        {/* Location & Toggle */}
        <div className="p-5 bg-surface rounded-card border border-border space-y-4">
          <h3 className="text-sm font-semibold text-text">
            7. LocationInput & Toggle
          </h3>
          <LocationInput
            value={locationVal}
            onChange={setLocationVal}
            label="ตำแหน่งจัดเก็บบน Shelf (Zone-Row-Shelf)"
            hint="เช่น A-02-03"
          />
          <div className="pt-2 border-t border-border flex flex-col gap-3">
            <Toggle
              checked={isUrgent}
              onChange={setIsUrgent}
              label="งานด่วนพิเศษ (Express Priority)"
              description="จะส่งการแจ้งเตือนพิเศษไปยังผู้จัดการศูนย์ซ่อม"
            />
          </div>
        </div>
      </div>

      {/* 8. RadioCards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">8. RadioCards</h2>
        <RadioCards
          options={sizeOptions}
          value={sizeCategory}
          onChange={setSizeCategory}
          columns={2}
        />
      </section>

      {/* 9. AddressFields */}
      <section className="p-5 bg-surface rounded-card border border-border space-y-3">
        <h2 className="text-lg font-semibold text-text">
          9. AddressFields (Auto Zipcode Lookup)
        </h2>
        <p className="text-xs text-text-mute">
          ทดลองพิมพ์รหัสไปรษณีย์ เช่น 10260 (บางนา), 12120 (คลองหลวง), 20000 (ชลบุรี), 50000 (เชียงใหม่)
        </p>
        <AddressFields value={address} onChange={setAddress} required={true} />
      </section>

      {/* 10. MultiSelectTags & DateRangeExport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-surface rounded-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-text">
            10. MultiSelectTags
          </h3>
          <MultiSelectTags
            options={brandOptions}
            value={selectedBrands}
            onChange={setSelectedBrands}
            label="กรองยี่ห้อสินค้าที่ดูแล"
          />
        </div>

        <div className="p-5 bg-surface rounded-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-text">
            11. DateRangeExport
          </h3>
          <DateRangeExport
            onExport={(r) =>
              alert(`ส่งออกข้อมูลช่วงวันที่: ${r.from} ถึง ${r.to}`)
            }
          />
        </div>
      </div>

      {/* 12. EmptyState */}
      <section className="p-5 bg-surface rounded-card border border-border space-y-3">
        <h2 className="text-lg font-semibold text-text">12. EmptyState</h2>
        <EmptyState
          title="ไม่พบรายการใบแจ้งซ่อม"
          description="ไม่มีงานซ่อมที่ตรงกับเงื่อนไขการค้นหาหรือคิวปัจจุบันของคุณ"
          action={
            <button
              onClick={() => alert('Reset Filters')}
              className="px-3 py-1.5 text-xs font-medium rounded-input bg-surface-2 hover:bg-border text-text transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          }
        />
      </section>

      {/* 13. PrintPreviewModal */}
      <PrintPreviewModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="ตัวอย่างพิมพ์: ใบรับซ่อมสินค้า (CS Receipt)"
        documentTitle="เลขที่: JB-2609-08231"
      >
        <div className="space-y-6 text-text">
          <div className="flex justify-between items-start border-b-2 border-red pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-red text-white flex items-center justify-center font-bold text-sm">
                  SC
                </span>
                <span className="text-lg font-bold">ไทวัสดุ ศูนย์บริการซ่อม</span>
              </div>
              <p className="text-xs text-text-mute mt-1">
                สาขาบางนา (00001) | โทร. 02-123-4567
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-base font-bold text-red">ใบรับซ่อมสินค้า</h2>
              <p className="text-xs font-mono font-bold mt-1">JB-2609-08231</p>
              <p className="text-[11px] text-text-mute">
                วันที่: 16 ก.ย. 2569 14:30
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-surface-2 rounded-lg space-y-1">
              <div className="font-semibold text-text-2">ข้อมูลลูกค้า</div>
              <div>คุณสมชาย ใจดี (081-234-5678)</div>
              <div className="text-text-mute">
                888 ถ.บางนา-ตราด แขวงบางนาเหนือ เขตบางนา กรุงเทพฯ 10260
              </div>
            </div>
            <div className="p-3 bg-surface-2 rounded-lg space-y-1">
              <div className="font-semibold text-text-2">ข้อมูลสินค้า</div>
              <div>สว่านกระแทกไร้สาย 18V (MAKITA)</div>
              <div className="text-text-mute">Serial: MKT-9821034</div>
              <div className="text-amber font-medium">อาการ: มอเตอร์มีเสียงดังและมีกลิ่นไหม้</div>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  <th className="p-2 text-left">รายการ</th>
                  <th className="p-2 text-right">จำนวน</th>
                  <th className="p-2 text-right">ราคาประเมิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-2">ค่าตรวจเช็คเบื้องต้น (ฟรีโปรโมชั่น)</td>
                  <td className="p-2 text-right">1</td>
                  <td className="p-2 text-right">฿0.00</td>
                </tr>
                <tr>
                  <td className="p-2">ค่าขนส่ง Standard ไปศูนย์บริการ</td>
                  <td className="p-2 text-right">1</td>
                  <td className="p-2 text-right">฿80.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 border border-border-strong rounded-lg text-[11px] text-text-mute leading-relaxed space-y-1">
            <div className="font-semibold text-text">เงื่อนไขการรับซ่อม:</div>
            <div>
              1. โปรดเก็บเอกสารนี้ไว้เป็นหลักฐานในการรับสินค้าคืน
            </div>
            <div>
              2. หากไม่มารับสินค้าคืนภายใน 60 วัน นับจากวันแจ้งเตือน ทางบริษัทฯ ขอสงวนสิทธิ์ในการจัดการสินค้าตามความเหมาะสม
            </div>
          </div>

          <div className="flex justify-between items-end pt-8 text-xs text-center">
            <div className="w-40 border-t border-text-mute pt-1">
              ลายมือชื่อผู้ส่งซ่อม
            </div>
            <div className="w-40 border-t border-text-mute pt-1">
              ลายมือชื่อพนักงานรับซ่อม
            </div>
          </div>
        </div>
      </PrintPreviewModal>
    </div>
  );
}
