# STEP-08 — Integration Adapters (mock), อัปโหลดภาพ, Worker

← [STEP-07](STEP-07_auth-shell.md) · [สารบัญ](README.md) · ถัดไป → [STEP-09 — หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 1](STEP-09_admin-1.md)

**เป้าหมาย:** มีช่องทางเชื่อมระบบภายนอกแบบจำลอง และถ่าย/อัปโหลดภาพได้จริง
**เอกสารอ้างอิง:** docs/02_architecture.md §4–5, docs/06_api.md §3.4 และ §9
**ต้องผ่านก่อน:** tag `step-07`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/02_architecture.md §4–5, docs/06_api.md §3.4 และ §9

## งานของ Step 08 — Integration Adapters (mock), อัปโหลดภาพ, Worker
เป้าหมาย: มีช่องทางเชื่อมระบบภายนอกแบบจำลอง และถ่าย/อัปโหลดภาพได้จริง

ขอบเขตงาน:
1. `apps/api/src/integrations`: interface + mock provider ของ Notification(LON), Payment, Pos, ThirdPartyLogistics, WalletCoupon, Accounting, Address, Storage ตาม 02 §4 เลือกด้วย env `INTEGRATION_<NAME>_PROVIDER=mock`
2. Mock Notification เขียนลง `NotificationLog`; mock Payment คืน QR payload/URL ปลอม; mock 3PL คืน trackingNo `MOCK-xxxx`
3. StorageProvider ใช้ MinIO (สร้าง bucket อัตโนมัติ) + endpoints `/attachments/presign`, `/attachments/:id/complete`, `/attachments/:id/url`
4. `PhotoCaptureButton` อัปโหลดจริง (resize ≤1600px ฝั่ง client, รองรับกล้องมือถือ) คืน attachmentId
5. BullMQ worker (อยู่ใน api หรือ `apps/worker`) + ตัวประมวลผล `OutboxMessage` แบบ retry 3 ครั้ง
6. Address endpoints ตาม 06 §2 + `AddressFields` ต่อ API จริง

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
| 1 | หน้า `/dev/components` กดถ่าย/เลือกภาพ | อัปโหลดสำเร็จ เห็นไฟล์ใน MinIO console http://localhost:9001 | ☐ |
| 2 | AddressFields พิมพ์ 10260 | จังหวัด กรุงเทพมหานคร เขต บางนา ขึ้นอัตโนมัติ | ☐ |
| 3 | insert OutboxMessage ทดสอบ (ผ่าน test) | worker ประมวลผลและตั้ง processedAt | ☐ |
| 4 | `pnpm test` | ผ่าน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(api): integration adapters with mocks, attachments, outbox worker"
git tag step-08
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-07 && git clean -fd`
