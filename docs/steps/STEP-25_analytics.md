# STEP-25 — Dashboard Overview

← [STEP-24](STEP-24_payout.md) · [สารบัญ](README.md) · ถัดไป → [STEP-26 — Executive Dashboard + PDF](STEP-26_executive.md)

**เป้าหมาย:** ผู้จัดการเห็นภาพรวมปฏิบัติการจากข้อมูลจริง
**เอกสารอ้างอิง:** docs/07_screens.md §Analytics, docs/05_business_rules.md §8.1–8.2, §8.5, docs/06_api.md §6, docs/prototypes/dashboard_analytics.html
**ต้องผ่านก่อน:** tag `step-24`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Analytics, docs/05_business_rules.md §8.1–8.2, §8.5, docs/06_api.md §6, docs/prototypes/dashboard_analytics.html

## งานของ Step 25 — Dashboard Overview
เป้าหมาย: ผู้จัดการเห็นภาพรวมปฏิบัติการจากข้อมูลจริง

ขอบเขตงาน:
1. `/reports/overview` คำนวณตามนิยาม 05 §8 (ใช้ SQL/view ที่มี index, ไม่ loop ใน JS กับข้อมูลทั้งหมด)
2. หน้า `/analytics` ตาม dashboard_analytics.html ใช้ Recharts: KPI + sparkline, pipeline, finance chart, SLA violation list, งานรออะไหล่ (แทน Stock Alert), GP breakdown, job trend, VD summary + ranking sortable, quick actions
3. ซ่อน widget ตาม DashboardWidgetConfig และ canViewCost
4. เขียน test ของ query ด้วยข้อมูล seed ที่รู้คำตอบ

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
| 1 | `pnpm db:seed:demo` แล้วเปิด `/analytics` | ทุก widget มีข้อมูล ไม่ error | ☐ |
| 2 | นับงาน WAITING_APPROVAL ใน studio | ตรงกับ KPI PENDING APPROVAL | ☐ |
| 3 | ปิด widget ใน admin หมวด Dashboard | widget หายจากหน้า | ☐ |
| 4 | `pnpm --filter api test` | test ของ report ผ่าน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(reports): operational dashboard overview"
git tag step-25
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-24 && git clean -fd`
