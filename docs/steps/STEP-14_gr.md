# STEP-14 — Queue Framework + หน้าจอ GR

← [STEP-13](STEP-13_cs-open.md) · [สารบัญ](README.md) · ถัดไป → [STEP-15 — หน้างานซ่อมทั้งหมด + รายละเอียดงาน](STEP-15_jobs-list.md)

**เป้าหมาย:** GR ทำงานได้ครบ 5 คิว และได้ component คิวที่ DC/VD จะใช้ต่อ
**เอกสารอ้างอิง:** docs/04_workflow_state_machine.md §4, docs/06_api.md §3.2, docs/07_screens.md §GR, docs/prototypes/gr.html
**ต้องผ่านก่อน:** tag `step-13`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/04_workflow_state_machine.md §4, docs/06_api.md §3.2, docs/07_screens.md §GR, docs/prototypes/gr.html

## งานของ Step 14 — Queue Framework + หน้าจอ GR
เป้าหมาย: GR ทำงานได้ครบ 5 คิว และได้ component คิวที่ DC/VD จะใช้ต่อ

ขอบเขตงาน:
1. API `GET /queues/:role/summary` และ `GET /queues/:role/:queueKey` แบบ generic (query ตาราง 04 §4 + คำนวณ SLA ด้วย `jobSlaView`) + `allowedActions` ต่อแถว
2. Web: `QueuePage` generic `{role, tabs, columns, actionCell}` + OverdueSummaryBanner/modal ("ไปดำเนินการ" เปลี่ยนแท็บ) + KPI คลิกเปลี่ยนแท็บ + ช่องสแกน QR/คีย์เลขงาน
3. หน้า `/gr` 5 แท็บตาม 07 §GR: รับจาก CS, Pack (หลังยืนยันเปิด PrintPreview ใบปะหน้า), ส่งมอบขนส่ง (3 section DC/DSD/3PL), รับคืน, ส่งมอบ CS
4. ปุ่ม disabled มี tooltip เหตุผลจาก allowedActions; หลังกดสำเร็จแถวจางลงแบบ optimistic แล้ว refetch
5. เอกสาร `GET /documents/jobs/:id/box-label`

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
| 1 | `pnpm db:seed:demo` แล้ว login gr.bangna | เห็นตัวเลขทุกแท็บ และ banner เกิน SLA | ☐ |
| 2 | แท็บรับจาก CS: กดยืนยันโดยยังไม่ถ่ายภาพ | ปุ่ม disabled มี tooltip | ☐ |
| 3 | ถ่ายภาพ + กรอก Location แล้วยืนยัน | งานย้ายไปแท็บ Pack | ☐ |
| 4 | Pack เสร็จ | เปิดใบปะหน้า มี QR, งานไปอยู่แท็บส่งมอบขนส่งตาม channel | ☐ |
| 5 | สแกน/พิมพ์เลขงานในช่องสแกน | แถวถูก highlight | ☐ |
| 6 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(gr): generic queue framework and GR screen"
git tag step-14
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-13 && git clean -fd`
