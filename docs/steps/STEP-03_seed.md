# STEP-03 — ใส่ข้อมูลตั้งต้น (Seed)

← [STEP-02](STEP-02_database.md) · [สารบัญ](README.md) · ถัดไป → [STEP-04 — Business Rules ส่วนเงิน (pure functions)](STEP-04_rules-money.md)

**เป้าหมาย:** มี master data และผู้ใช้ทดสอบครบทุก role
**เอกสารอ้างอิง:** docs/03_data_model.md §4, docs/05_business_rules.md §4.1 และ §6.1, docs/08_rbac.md §2
**ต้องผ่านก่อน:** tag `step-02`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/03_data_model.md §4, docs/05_business_rules.md §4.1 และ §6.1, docs/08_rbac.md §2

## งานของ Step 03 — ใส่ข้อมูลตั้งต้น (Seed)
เป้าหมาย: มี master data และผู้ใช้ทดสอบครบทุก role

ขอบเขตงาน:
1. เขียน `packages/db/prisma/seed.ts` ที่รันซ้ำได้ (upsert, idempotent)
2. Sites, DistrictManagers, Brands, SizeCategory + FeeRate, Vendors + VendorCenters + brands/sizes, BranchVendorRoute ตาม 03 §4
3. SlaStep 16 ขั้นตามตาราง 05 §4.1 (ครบทุกคอลัมน์ รวม condition, ownerDept, pausable)
4. RepairSku, PayoutCycleConfig (วันที่ 5 และ 20), Promotions 4 รายการ ตาม 03 §4 (createdAt ตามที่ระบุ)
5. RoleMenuPermission ตามตาราง 08 §2 (✓ และ 👁 = allowed), RoleDataPermission (ADMIN, EXECUTIVE = canViewCost)
6. SystemSetting: vatRate=0.07, quoteExpiryDays=7, charge3plReturnFee=false, tradeInCouponValidDays=30, vendorSlaThreshold=85
7. Users 7 คน (admin, exec, cs.bangna, gr.bangna, dc.bkk, vd.0088, s2.bangna) รหัส `Passw0rd!` (bcrypt) + scope ให้ถูก
8. ThaiAddress: ถ้าติดตั้ง dataset ที่อยู่ไทยแบบ open data ได้ให้ใช้ทั้งประเทศ ถ้าไม่ได้ ให้ใส่อย่างน้อยรหัส 10260, 10110, 12130, 20000 ตาม `docs/prototypes/cs.html`
9. ยังไม่ต้อง seed Job (จะทำใน Step 12)

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
| 1 | `pnpm db:seed` รัน 2 ครั้งติดกัน | ครั้งที่ 2 ไม่ error และข้อมูลไม่ซ้ำ | ☐ |
| 2 | เปิด `pnpm db:studio` | Site 7, Vendor 4, SlaStep 16, Promotion 4, User 7 | ☐ |
| 3 | ดูตาราง User | `vd.0088` ผูก vendorCenter VD-0088-1, `gr.bangna` ผูกสาขาบางนา | ☐ |
| 4 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(db): seed master data, sla steps, permissions, users"
git tag step-03
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-02 && git clean -fd`
