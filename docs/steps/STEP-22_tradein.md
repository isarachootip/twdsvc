# STEP-22 — Trade-in / คูปอง

← [STEP-21](STEP-21_cs-close.md) · [สารบัญ](README.md) · ถัดไป → [STEP-23 — S2 งานซ่อมสต็อกสาขา](STEP-23_s2.md)

**เป้าหมาย:** CS ออกคูปองส่วนลดได้ทั้ง 2 ประเภท
**เอกสารอ้างอิง:** docs/07_screens.md §TradeIn, docs/05_business_rules.md §6, docs/06_api.md §4, docs/prototypes/tradein.html
**ต้องผ่านก่อน:** tag `step-21`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §TradeIn, docs/05_business_rules.md §6, docs/06_api.md §4, docs/prototypes/tradein.html

## งานของ Step 22 — Trade-in / คูปอง
เป้าหมาย: CS ออกคูปองส่วนลดได้ทั้ง 2 ประเภท

ขอบเขตงาน:
1. API ตาม 06 §4 ใช้ `bestPromotion` จาก shared; ไม่มีโปร → error `NO_PROMOTION`
2. Wallet mock: issue → walletRef; `POST /webhooks/wallet` เปลี่ยน USED; ปุ่มลองส่งใหม่เมื่อ FAILED
3. หน้า `/tradein`: KPI 3 ใบ, เลือกประเภท, ฟอร์มประเภท 1 (preview โปรสดเมื่อเปลี่ยนขนาด), ประเภท 2 (เลือก job ที่เข้าเงื่อนไข auto-fill), ประวัติ + ค้นหา
4. รองรับ query `?type=2&jobId=` จากหน้า CS แล้วกลับไปหน้า pickup panel ได้

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
| 1 | ประเภท 1 เลือกขนาดเล็ก | "ระบบเลือกโปร โปรทั่วไป — ส่วนลด 10%" | ☐ |
| 2 | ประเภท 2 งานสินค้าใหญ่ (วันที่อยู่ในช่วงโปร) | ได้โปรลูกค้าเก่า 15% | ☐ |
| 3 | สร้างคูปอง | เลข TI-YYMM-xxxxx, สถานะยังไม่ใช้, job นั้นหายจากรายการเลือก | ☐ |
| 4 | กรณีไม่มีโปรตรงเงื่อนไข | ปุ่มสร้างถูกปิด พร้อมข้อความ | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(tradein): trade-in coupons with promotion selection"
git tag step-22
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-21 && git clean -fd`
