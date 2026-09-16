# STEP-10 — หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 2

← [STEP-09](STEP-09_admin-1.md) · [สารบัญ](README.md) · ถัดไป → [STEP-11 — Job Engine ส่วนที่ 1 (เปิดงาน → สินค้าถึง VD)](STEP-11_engine-1.md)

**เป้าหมาย:** Admin ตั้งค่า VD, การจับคู่, SLA, สิทธิ์ และโปรโมชั่นได้ครบ
**เอกสารอ้างอิง:** docs/07_screens.md §Admin (ข้อ 1, 4, 5, 6, 9, 10), docs/05_business_rules.md §3, §4.1, §6.2, docs/prototypes/admin.html
**ต้องผ่านก่อน:** tag `step-09`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Admin (ข้อ 1, 4, 5, 6, 9, 10), docs/05_business_rules.md §3, §4.1, §6.2, docs/prototypes/admin.html

## งานของ Step 10 — หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 2
เป้าหมาย: Admin ตั้งค่า VD, การจับคู่, SLA, สิทธิ์ และโปรโมชั่นได้ครบ

ขอบเขตงาน:
1. หมวด 1 Vendor Portal: การ์ด VD หลัก + แบรนด์/ขนาด (multi tags) + ตารางศูนย์ย่อย (override GP/SLA มี placeholder ค่าเริ่มต้น) — บันทึกทั้งก้อน `PUT /vendors/:id`
2. หมวด 4 จับคู่สาขา-VD: เลือกสาขา → ผู้จัดการเขตขึ้นเอง, primary/backup, standardChannel (เตือนถ้าไม่เข้ากับ method ของศูนย์)
3. หมวด 5 SLA: แก้ชั่วโมง/วัน (รับ "24 ชม." หรือ "2 วัน"), เปิด/ปิด, เพิ่มขั้นโดยเลือก event จาก dropdown
4. หมวด 6 สิทธิ์: matrix เมนู × role + จัดการผู้ใช้ (สร้าง/ปิด/รีเซ็ตรหัส/ผูก scope) — ล็อกไม่ให้ Admin ถอดสิทธิ์ admin ตัวเอง
5. หมวด 9 Trade-in/คูปอง: ตารางโปร + date picker + เตือนช่วงเวลาซ้อน
6. หมวด 10 Dashboard: toggle widget, สิทธิ์เห็นต้นทุนต่อ role

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
| 1 | เพิ่มแบรนด์ Panasonic ให้ VD-0091 แล้วรีเฟรช | ยังอยู่ | ☐ |
| 2 | ตั้ง SLA ขั้น GR Pack เป็น "2 วัน" | บันทึกเป็น 48 ชั่วโมง | ☐ |
| 3 | ปิดเมนู Trade-in ของ CS แล้ว login cs.bangna | เมนู Trade-in หายไป | ☐ |
| 4 | สร้างโปร T2 LARGE ช่วงซ้อนกับโปรปีใหม่ | ขึ้นข้อความเตือน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(admin): vendor portal, routes, sla, rbac, promotions, dashboard config"
git tag step-10
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-09 && git clean -fd`
