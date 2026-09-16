# STEP-28 — Security, Performance และ Production Build

← [STEP-27](STEP-27_e2e.md) · [สารบัญ](README.md) · ถัดไป → [STEP-29 — เชื่อมระบบภายนอกจริง (ทำเมื่อได้ API จากผู้ให้บริการ)](STEP-29_real-integrations.md)

**เป้าหมาย:** พร้อมขึ้นระบบทดสอบกับผู้ใช้จริง
**เอกสารอ้างอิง:** docs/02_architecture.md §7, docs/08_rbac.md, docs/01_overview.md §6
**ต้องผ่านก่อน:** tag `step-27`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/02_architecture.md §7, docs/08_rbac.md, docs/01_overview.md §6

## งานของ Step 28 — Security, Performance และ Production Build
เป้าหมาย: พร้อมขึ้นระบบทดสอบกับผู้ใช้จริง

ขอบเขตงาน:
1. ไล่ตรวจ 08 ทุกข้อ: scope ทุก endpoint (เขียน test วนทุก route ด้วย user ต่าง scope), PII masking, token expiry, rate limit, helmet/CSP, ห้าม log ข้อมูลส่วนตัว
2. ปุ่ม/หน้า "จำลอง" ทั้งหมดถูกปิดเมื่อ production (เขียน test)
3. Load test (k6 หรือ autocannon) คิวและ `/jobs` ที่ 50k งาน ≤ 1 วินาที — เพิ่ม index ถ้าจำเป็น
4. Dockerfile production ของ web/api/worker + `docker-compose.prod.yml` + migration ตอน deploy + healthcheck
5. สร้าง `docs/OPEN_QUESTIONS.md` รวมรายการ 🔶 จาก 01 §6 พร้อมค่าที่ระบบใช้อยู่ ให้เจ้าของระบบยืนยัน
6. อัปเดต README วิธี deploy

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
| 1 | test scope ทุก route | ผ่าน ไม่มี endpoint หลุด scope | ☐ |
| 2 | `NODE_ENV=production` build แล้วรัน | ไม่มีปุ่มจำลอง, `/dev/components` 404 | ☐ |
| 3 | ผล load test | p95 ≤ 1 วินาที | ☐ |
| 4 | `docker compose -f docker-compose.prod.yml up` | ระบบรันได้ครบ | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "chore: security hardening, load test, production images"
git tag step-28
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-27 && git clean -fd`
