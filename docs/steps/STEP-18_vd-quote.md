# STEP-18 — VD ประเมิน + เสนอราคา

← [STEP-17](STEP-17_vd-receive.md) · [สารบัญ](README.md) · ถัดไป → [STEP-19 — หน้าลูกค้า: ใบเสนอราคา / ติดตามงาน / ชำระเงิน](STEP-19_public-pages.md)

**เป้าหมาย:** VD ออกใบเสนอราคาและส่งให้ลูกค้าได้
**เอกสารอ้างอิง:** docs/07_screens.md §VD (Quote full-screen), docs/05_business_rules.md §2, docs/prototypes/vd.html (#quote-fullscreen, #quote-doc-modal, #lon-modal)
**ต้องผ่านก่อน:** tag `step-17`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §VD (Quote full-screen), docs/05_business_rules.md §2, docs/prototypes/vd.html (#quote-fullscreen, #quote-doc-modal, #lon-modal)

## งานของ Step 18 — VD ประเมิน + เสนอราคา
เป้าหมาย: VD ออกใบเสนอราคาและส่งให้ลูกค้าได้

ขอบเขตงาน:
1. แท็บประเมิน/เสนอราคา → หน้า `/vd/jobs/[id]/quote` full-screen: ประกัน/ค่าเปิดเครื่อง read-only, บรรทัดอะไหล่ (+ค่าแรง), ระยะเวลาซ่อม, รับประกัน read-only, หมายเหตุ, สรุปยอด sticky คำนวณสดด้วย `calcQuoteTotals`
2. ส่ง → action `vd_submit_quote` → modal เอกสารใบเสนอราคา → "ส่งให้ลูกค้าทาง LON" → modal preview ข้อความ LINE
3. PDF `GET /documents/quotes/:id` หัวไทวัสดุ + ที่อยู่สาขาที่เปิดงาน
4. แท็บรอลูกค้าอนุมัติ: ดูหน้า LON ลูกค้า, แก้ไขใบเสนอราคา (`vd_revise_quote`), แสดงสถานะหมดอายุ
5. งาน STOCK: แท็บนี้แสดงปุ่ม "เริ่มซ่อม" แทน

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
| 1 | เปิดงานไม่มีประกัน ใส่อะไหล่ 450 + 150 | สรุป 900 / VAT 63 / รวม 963 | ☐ |
| 2 | ส่งใบเสนอราคา | งานไปแท็บรอลูกค้าอนุมัติ, NotificationLog มี LON พร้อมลิงก์ `/q/...` | ☐ |
| 3 | งานมีประกันที่ยอดรวม 0 | ข้ามไปแท็บกำลังซ่อมทันที | ☐ |
| 4 | แก้ไขใบเสนอราคา | ได้ QT version 2 ของเดิมเป็น SUPERSEDED | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(vd): quotation form, quote document, LON preview"
git tag step-18
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-17 && git clean -fd`
