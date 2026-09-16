# STEP-16 — หน้าจอ DC + จัดรถ + หน้าคนรถ

← [STEP-15](STEP-15_jobs-list.md) · [สารบัญ](README.md) · ถัดไป → [STEP-17 — หน้าจอ VD: งานรอรับ + จำลอง 3PL](STEP-17_vd-receive.md)

**เป้าหมาย:** DC ทำงานได้ครบ 5 คิว และคนรถเปิดลิงก์บนมือถือได้
**เอกสารอ้างอิง:** docs/07_screens.md §DC และ §Public (/d/:token), docs/04_workflow_state_machine.md §4, docs/prototypes/dc.html
**ต้องผ่านก่อน:** tag `step-15`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §DC และ §Public (/d/:token), docs/04_workflow_state_machine.md §4, docs/prototypes/dc.html

## งานของ Step 16 — หน้าจอ DC + จัดรถ + หน้าคนรถ
เป้าหมาย: DC ทำงานได้ครบ 5 คิว และคนรถเปิดลิงก์บนมือถือได้

ขอบเขตงาน:
1. หน้า `/dc` 5 แท็บด้วย QueuePage: เข้ารับจากสาขา (filter สาขา), รับเข้า Location, ส่งมอบให้ VD, รับคืนจาก VD, ส่งคืนกลับสาขา + date range + Export Excel หลาย sheet
2. Dispatch: ปุ่ม Print เอกสารให้คนรถ (`/documents/shipments/:id/driver-sheet`) และ ส่ง Link (สร้าง token DRIVER แสดง URL + ปุ่มคัดลอก)
3. หน้า public `/d/[token]` mobile: จุดรับ→จุดส่ง, เลขงาน, สินค้า, ผู้ติดต่อ; ถ้าเป็น DSD ให้ถ่ายภาพยืนยันรับสินค้าได้
4. API public driver ตาม 06 §7 + rate limit

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
| 1 | login dc.bkk แท็บเข้ารับจากสาขา กด ส่ง Link | ได้ URL `/d/...` เปิดในมือถือ/หน้าต่าง incognito ได้ | ☐ |
| 2 | GR สแกนส่งมอบงานนั้น แล้วกลับมาที่ DC | งานไปอยู่แท็บรับเข้า Location | ☐ |
| 3 | กรอก Location ยืนยัน → ไปแท็บส่งมอบให้ VD | ปุ่มส่งมอบ disabled จนกว่า VD จะจัดรถ | ☐ |
| 4 | Export Excel | ได้ 5 sheet | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(dc): DC queues, dispatch documents, driver link page"
git tag step-16
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-15 && git clean -fd`
