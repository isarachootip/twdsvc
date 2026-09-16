# STEP-02 — สร้าง Database Schema

← [STEP-01](STEP-01_scaffold.md) · [สารบัญ](README.md) · ถัดไป → [STEP-03 — ใส่ข้อมูลตั้งต้น (Seed)](STEP-03_seed.md)

**เป้าหมาย:** มีตารางครบตาม data model และ API ต่อ DB ได้
**เอกสารอ้างอิง:** docs/03_data_model.md §3
**ต้องผ่านก่อน:** tag `step-01`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/03_data_model.md §3

## งานของ Step 02 — สร้าง Database Schema
เป้าหมาย: มีตารางครบตาม data model และ API ต่อ DB ได้

ขอบเขตงาน:
1. คัดลอก Prisma schema จาก 03 §3 ไปที่ `packages/db/prisma/schema.prisma` **ตามเอกสารทุกตัวอักษร**
2. `packages/db` export Prisma client (singleton) + type ให้ package อื่นใช้
3. สร้าง migration แรก ชื่อ `init` และผูก script `pnpm db:migrate`, `pnpm db:studio`
4. `apps/api`: สร้าง `PrismaModule` (global) และให้ `/health` ตรวจการเชื่อมต่อ DB ด้วย คืน `{status:'ok', db:'ok'}`

นอกขอบเขต step นี้: ยังไม่ต้องใส่ข้อมูล seed

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
| 1 | `pnpm db:migrate` | migration `init` สร้างสำเร็จ | ☐ |
| 2 | `pnpm db:studio` | เห็นตารางครบ (Job, JobEvent, Shipment, Quote, Vendor, ... ประมาณ 40 ตาราง) | ☐ |
| 3 | เปิด http://localhost:4000/api/v1/health | `db: ok` | ☐ |
| 4 | `pnpm typecheck` | ผ่าน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(db): prisma schema and initial migration"
git tag step-02
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-01 && git clean -fd`
