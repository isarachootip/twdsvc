# STEP-29 — เชื่อมระบบภายนอกจริง (ทำเมื่อได้ API จากผู้ให้บริการ)

← [STEP-28](STEP-28_hardening.md) · [สารบัญ](README.md) · ถัดไป → 🎉 จบทุก step

**เป้าหมาย:** เปลี่ยนจาก mock เป็นระบบจริงทีละตัวโดยไม่กระทบส่วนอื่น
**เอกสารอ้างอิง:** docs/02_architecture.md §4, docs/06_api.md §8–9
**ต้องผ่านก่อน:** tag `step-28`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/02_architecture.md §4, docs/06_api.md §8–9

## งานของ Step 29 — เชื่อมระบบภายนอกจริง (ทำเมื่อได้ API จากผู้ให้บริการ)
เป้าหมาย: เปลี่ยนจาก mock เป็นระบบจริงทีละตัวโดยไม่กระทบส่วนอื่น

ขอบเขตงาน:
1. **ก่อนวาง prompt: แนบเอกสาร API ของผู้ให้บริการ 1 ราย (เช่น LINE Messaging API, Payment gateway, 3PL) ไว้ใน `docs/vendors/<ชื่อ>/` และแก้ชื่อระบบในบรรทัดนี้** — ทำครั้งละ 1 ระบบ
2. สร้าง provider `real` ของ adapter ที่ระบุ ตาม interface เดิมใน 02 §4 โดยไม่แก้ส่วนที่เรียกใช้
3. ตรวจลายเซ็น webhook, idempotency, retry/backoff, timeout, log ที่ไม่มีข้อมูลส่วนตัว
4. config ผ่าน env/secret เท่านั้น + อัปเดต `.env.example`
5. contract test กับ sandbox ของผู้ให้บริการ (ข้ามได้ใน CI ถ้าไม่มี credential) + test ว่า `mock` ยังใช้ได้
6. เขียนสรุปวิธีตั้งค่าใน `docs/vendors/<ชื่อ>/SETUP.md`

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
| 1 | ตั้ง env ให้ใช้ provider real บน sandbox | flow ที่เกี่ยวข้องทำงานกับ sandbox จริง (เช่น ได้ข้อความ LINE จริง) | ☐ |
| 2 | สลับกลับเป็น mock | ระบบยังทำงานเหมือนเดิม | ☐ |
| 3 | `pnpm e2e` | ยังผ่าน 12/12 (ใช้ mock) | ☐ |
| 4 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(integrations): real provider for <ชื่อระบบ>"
git tag step-29
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-28 && git clean -fd`
