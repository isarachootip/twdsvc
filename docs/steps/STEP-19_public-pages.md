# STEP-19 — หน้าลูกค้า: ใบเสนอราคา / ติดตามงาน / ชำระเงิน

← [STEP-18](STEP-18_vd-quote.md) · [สารบัญ](README.md) · ถัดไป → [STEP-20 — ขาซ่อมและส่งคืน: VD → DC → GR](STEP-20_return-flow.md)

**เป้าหมาย:** ลูกค้าอนุมัติ/ไม่อนุมัติและจ่ายเงินผ่านมือถือได้
**เอกสารอ้างอิง:** docs/07_screens.md §Public, docs/06_api.md §7–8, docs/08_rbac.md §6, docs/prototypes/customer_quote.html
**ต้องผ่านก่อน:** tag `step-18`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Public, docs/06_api.md §7–8, docs/08_rbac.md §6, docs/prototypes/customer_quote.html

## งานของ Step 19 — หน้าลูกค้า: ใบเสนอราคา / ติดตามงาน / ชำระเงิน
เป้าหมาย: ลูกค้าอนุมัติ/ไม่อนุมัติและจ่ายเงินผ่านมือถือได้

ขอบเขตงาน:
1. route group `(public)` mobile-first max 440px header แดง
2. `/q/[token]` ตาม customer_quote.html: รายการ, total, อนุมัติ → เลือก QR PromptPay / บัตร (redirect หน้า mock gateway) / ชำระภายหลังที่สาขา → หน้าผลลัพธ์; ไม่อนุมัติ → confirm → หน้าผลลัพธ์; token หมดอายุ/ใช้แล้ว → หน้าสถานะ
3. หน้า QR: ปุ่ม "ฉันชำระเงินแล้ว" = poll สถานะ (ห้าม mark paid เอง); mock gateway มีหน้าจำลองกดจ่ายสำเร็จ → ยิง webhook
4. `/t/[token]` tracking timeline ย่อ, `/pay/[token]` ชำระยอดค้าง
5. log `QUOTE_VIEWED`, rate limit `/public/*`, ไม่แสดงชื่อพนักงาน

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
| 1 | เปิดลิงก์ `/q/...` จาก NotificationLog ในโหมดมือถือของ browser | หน้าตาเหมือน customer_quote.html | ☐ |
| 2 | อนุมัติ + QR → จำลองจ่ายสำเร็จ | หน้าผลลัพธ์ ✓, งานเป็น REPAIRING, Payment PAID | ☐ |
| 3 | เปิดลิงก์เดิมอีกครั้ง | แสดงว่าตัดสินใจแล้ว กดซ้ำไม่ได้ | ☐ |
| 4 | อีกงานกดไม่อนุมัติ | งานไปคิว Pack และส่งคืนของ VD | ☐ |
| 5 | เปิด `/t/...` | เห็น timeline ไม่มีชื่อพนักงาน | ☐ |
| 6 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(public): customer quote approval, payment, tracking pages"
git tag step-19
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-18 && git clean -fd`
