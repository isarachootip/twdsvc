# STEP-06 — Design System & Component กลาง

← [STEP-05](STEP-05_rules-ops.md) · [สารบัญ](README.md) · ถัดไป → [STEP-07 — Login, สิทธิ์ผู้ใช้ และ App Shell](STEP-07_auth-shell.md)

**เป้าหมาย:** หน้าตาเหมือน prototype และมี component ที่ทุกหน้าจอใช้ซ้ำ
**เอกสารอ้างอิง:** docs/02_architecture.md §6, docs/prototypes/gr.html, docs/prototypes/cs.html, docs/prototypes/admin.html
**ต้องผ่านก่อน:** tag `step-05`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/02_architecture.md §6, docs/prototypes/gr.html, docs/prototypes/cs.html, docs/prototypes/admin.html

## งานของ Step 06 — Design System & Component กลาง
เป้าหมาย: หน้าตาเหมือน prototype และมี component ที่ทุกหน้าจอใช้ซ้ำ

ขอบเขตงาน:
1. Tailwind preset ใน `packages/config` ด้วย token สีใน 02 §6 + ฟอนต์ Sarabun (next/font)
2. ติดตั้ง shadcn/ui แล้วปรับ theme ให้ตรง token (ปุ่ม primary สีแดง #C8102E, card radius 12px)
3. สร้างใน `apps/web/components/domain`: OverdueSummaryBanner, KpiCard (clickable, active), QueueTabs (มี count), SortableTable, SlaTag, JobIdCell, StatusBadge (สีตาม 04 §1), PhotoCaptureButton (UI อย่างเดียว ยังไม่ upload), LocationInput, RadioCards, AddressFields (UI), MultiSelectTags, Toggle, DateRangeExport, PrintPreviewModal, EmptyState
4. หน้า `/dev/components` แสดงทุก component พร้อมตัวอย่าง (ซ่อนเมื่อ production)

กติกา:
- ทำเฉพาะขอบเขตของ step นี้ ห้ามทำงานของ step ถัดไปล่วงหน้า
- ถ้าเอกสารไม่ชัดหรือขัดกัน ให้เลือกตามลำดับความจริงใน AGENTS.md และจดคำถามไว้ใน docs/OPEN_QUESTIONS.md
- เมื่อเสร็จ ให้รัน `pnpm lint && pnpm typecheck && pnpm test` จนผ่าน
- ห้าม git commit (ผมจะตรวจแล้ว commit เอง)

เมื่อเสร็จให้สรุป: (1) ไฟล์ที่สร้าง/แก้ (2) วิธีทดสอบด้วยมือทีละข้อ (3) สิ่งที่ยังไม่ได้ทำหรือคำถามค้าง
````

## ③ ตรวจผลด้วยตัวเอง (ติ๊กให้ครบก่อนไป step ถัดไป)
| # | ทำอะไร | ต้องเห็นอะไร | ผ่าน |
|---|--------|--------------|:----:|
| 1 | เปิด http://localhost:3000/dev/components | เห็นทุก component | ☐ |
| 2 | เปิด `docs/prototypes/gr.html` คู่กัน | สี ฟอนต์ ขนาด การ์ด ปุ่ม badge ใกล้เคียงกัน | ☐ |
| 3 | คลิกหัวตาราง SortableTable | เรียง ▲▼ ได้ | ☐ |
| 4 | `pnpm lint && pnpm typecheck` | ผ่าน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(web): design tokens and shared domain components"
git tag step-06
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-05 && git clean -fd`
