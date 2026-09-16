# STEP-13 — หน้าจอ CS เปิดใบแจ้งซ่อม

← [STEP-12](STEP-12_engine-2.md) · [สารบัญ](README.md) · ถัดไป → [STEP-14 — Queue Framework + หน้าจอ GR](STEP-14_gr.md)

**เป้าหมาย:** CS เปิดงานจริงจากหน้าจอได้ครบ
**เอกสารอ้างอิง:** docs/07_screens.md §CS-1, docs/05_business_rules.md §1, docs/prototypes/cs.html
**ต้องผ่านก่อน:** tag `step-12`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §CS-1, docs/05_business_rules.md §1, docs/prototypes/cs.html

## งานของ Step 13 — หน้าจอ CS เปิดใบแจ้งซ่อม
เป้าหมาย: CS เปิดงานจริงจากหน้าจอได้ครบ

ขอบเขตงาน:
1. หน้า `/cs/new` layout 2 คอลัมน์ตาม cs.html: ข้อมูลลูกค้า (ค้นหาลูกค้าเดิมจากเบอร์), ที่อยู่ + modal ใบกำกับภาษี, สินค้า/ประกัน/ขนาด/วิธีจัดส่ง, ภาพ 4 ช่อง + ตำหนิ
2. การ์ดค่าใช้จ่ายอัปเดตสดด้วย `/jobs/preview-fees`; การ์ดวิธีชำระ (QR modal + polling สถานะ / gen link / เลขใบเสร็จ POS) ซ่อนเมื่อยอด 0
3. บันทึก → แสดงเลขงาน + badge + ผลการเลือกศูนย์ซ่อม/ช่องทาง หรือคำเตือนรอ Admin กำหนด
4. ปุ่มพิมพ์ใบแจ้งซ่อม: `GET /documents/jobs/:id/intake-slip` (HTML template → PDF ด้วย Playwright, มี QR)
5. validation ตาม 05 §9 ทั้งฝั่ง form (zod) และ API

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
| 1 | login cs.bangna เปิดงาน: ไม่มีประกัน / ใหญ่ / ส่งด่วน | ค่าใช้จ่าย 300 + 250 = ฿550 | ☐ |
| 2 | เปลี่ยนเป็น มีประกัน / มาตรฐาน | ยอดเป็น ฿0 และการ์ดวิธีชำระหายไป | ☐ |
| 3 | บันทึกงานแบรนด์ที่ไม่มี VD รับ | ขึ้นคำเตือนรอ Admin กำหนดศูนย์ซ่อม | ☐ |
| 4 | กดพิมพ์ใบแจ้งซ่อม | ได้ PDF มีเลขงาน + QR | ☐ |
| 5 | ดู NotificationLog | มีข้อความ LON แจ้งเปิดงาน (mock) | ☐ |
| 6 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(cs): open repair job screen with fees, payment, intake slip"
git tag step-13
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-12 && git clean -fd`
