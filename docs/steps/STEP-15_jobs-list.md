# STEP-15 — หน้างานซ่อมทั้งหมด + รายละเอียดงาน

← [STEP-14](STEP-14_gr.md) · [สารบัญ](README.md) · ถัดไป → [STEP-16 — หน้าจอ DC + จัดรถ + หน้าคนรถ](STEP-16_dc.md)

**เป้าหมาย:** ทุก role ค้นหาและดูประวัติงานได้ พร้อม KPI SLA
**เอกสารอ้างอิง:** docs/07_screens.md §Jobs, docs/05_business_rules.md §4.5, docs/06_api.md §3.2, docs/prototypes/dashboard.html
**ต้องผ่านก่อน:** tag `step-14`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Jobs, docs/05_business_rules.md §4.5, docs/06_api.md §3.2, docs/prototypes/dashboard.html

## งานของ Step 15 — หน้างานซ่อมทั้งหมด + รายละเอียดงาน
เป้าหมาย: ทุก role ค้นหาและดูประวัติงานได้ พร้อม KPI SLA

ขอบเขตงาน:
1. API `GET /jobs`, `GET /jobs/kpis`, `GET /jobs/:id`, `GET /jobs/by-no/:jobNo`, Excel `format=xlsx` (exceljs)
2. หน้า `/jobs`: date range, KPI 6 ใบ (คลิก filter), filter สาขา/ช่องทาง/สถานะ/ค้นหา, ตาราง sortable, ปุ่ม Export
3. Job detail drawer: timeline ขั้น SLA (dot เขียว/เหลือง/แดง/เทา + ผู้ทำ + เวลา) + event log + thumbnail ภาพ, รายละเอียดใบแจ้งซ่อม, ปุ่มดูใบเสนอราคา, ปุ่ม Admin (กำหนด VD/ยกเลิก)
4. ช่องค้นหาเลขงานใน topbar เปิด detail
5. ข้อมูลถูก mask/กรองตาม scope และ role (08 §4–5)
6. Admin หมวด 12 "รอกำหนดศูนย์ซ่อม" (`/admin/pending-vendor-assignment`): ตารางงาน `PENDING_VENDOR_ASSIGNMENT` + dialog เลือกศูนย์ย่อย/ช่องทาง → action `assign_vendor`

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
| 1 | login admin เปิด `/jobs` | เห็นงาน demo ทุกสาขา; KPI ตรงจำนวนงานเกิน SLA | ☐ |
| 2 | คลิก KPI "เกิน SLA ฝั่ง GR" | ตารางเหลือเฉพาะงานนั้น มีปุ่มล้างตัวกรอง | ☐ |
| 3 | คลิกแถวงาน | timeline แสดงผู้ทำและภาพ | ☐ |
| 4 | Export Excel | ได้ไฟล์ตาม filter | ☐ |
| 5 | login vd.0088 เปิด `/jobs` | เห็นเฉพาะงานของ VD-0088 และเบอร์โทรถูก mask | ☐ |
| 6 | admin เปิดหมวดรอกำหนดศูนย์ซ่อม แล้วกำหนด VD ให้งานหนึ่ง | งานหายจากคิวและไปโผล่ในแท็บรับจาก CS ของ GR | ☐ |
| 7 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(jobs): job list, kpis, detail timeline, excel export"
git tag step-15
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-14 && git clean -fd`
