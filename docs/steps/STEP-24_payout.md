# STEP-24 — รายงานจ่ายเงิน VD

← [STEP-23](STEP-23_s2.md) · [สารบัญ](README.md) · ถัดไป → [STEP-25 — Dashboard Overview](STEP-25_analytics.md)

**เป้าหมาย:** Admin สรุปและส่งทำจ่าย VD ตามรอบได้
**เอกสารอ้างอิง:** docs/07_screens.md §Reports, docs/05_business_rules.md §7, docs/06_api.md §5, docs/prototypes/report_vd_payment.html
**ต้องผ่านก่อน:** tag `step-23`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Reports, docs/05_business_rules.md §7, docs/06_api.md §5, docs/prototypes/report_vd_payment.html

## งานของ Step 24 — รายงานจ่ายเงิน VD
เป้าหมาย: Admin สรุปและส่งทำจ่าย VD ตามรอบได้

ขอบเขตงาน:
1. API payouts ตาม 06 §5 ใช้ `calcPayoutLine`/`groupPayout`; gp fields ส่งเฉพาะผู้มี canViewCost
2. หน้า `/reports/vd-payment`: filter รอบ/วันที่/ค้นหา, By VD / By สาขา, toggle คอลัมน์ GP, KPI 4, ตาราง + select all, modal รายละเอียด, footer sticky "ส่งไปทำจ่าย" (confirm dialog), Export Excel
3. ฟอร์มรายการหักเงิน VD (VendorDeduction) และหักใน net
4. Accounting mock + สถานะ SENT → PAID (PATCH)

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
| 1 | ปิดงานจาก Step 21 แล้วเปิดรายงาน (เลือกช่วงวันที่ครอบคลุมวันนี้) | VD-0088 มีงานนั้น ยอดค่าซ่อม ฿1,200 สุทธิ ฿984 | ☐ |
| 2 | เปิด toggle GP | GP 18% ฿216 | ☐ |
| 3 | เลือก 1 กลุ่มแล้วส่งไปทำจ่าย | สถานะจ่ายแล้ว, checkbox disabled, KPI ส่งจ่ายแล้วเพิ่มขึ้น | ☐ |
| 4 | เพิ่มรายการหัก ฿100 ให้ VD อีกราย | ยอดสุทธิลดลง ฿100 | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(reports): vendor payout report and batches"
git tag step-24
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-23 && git clean -fd`
