# STEP-07 — Login, สิทธิ์ผู้ใช้ และ App Shell

← [STEP-06](STEP-06_ui-kit.md) · [สารบัญ](README.md) · ถัดไป → [STEP-08 — Integration Adapters (mock), อัปโหลดภาพ, Worker](STEP-08_integrations.md)

**เป้าหมาย:** ผู้ใช้ login แล้วเห็นเมนูตาม role ของตัวเอง
**เอกสารอ้างอิง:** docs/08_rbac.md ทั้งไฟล์, docs/06_api.md §1, docs/07_screens.md §0, docs/prototypes/index.html
**ต้องผ่านก่อน:** tag `step-06`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/08_rbac.md ทั้งไฟล์, docs/06_api.md §1, docs/07_screens.md §0, docs/prototypes/index.html

## งานของ Step 07 — Login, สิทธิ์ผู้ใช้ และ App Shell
เป้าหมาย: ผู้ใช้ login แล้วเห็นเมนูตาม role ของตัวเอง

ขอบเขตงาน:
1. API: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/me` ตาม 06 §1 (JWT access 15 นาที + refresh cookie, lock 5 ครั้ง) ตาม 08 §7
2. Guard: `RolesGuard`, decorator `@Roles()`, `MenuGuard` อ่านจาก RoleMenuPermission, helper `scopeJobsFor(user)` ตาม 08 §4 (เขียน test)
3. Web: หน้า `/login`, layout `(staff)` sidebar + topbar ตาม index.html (ไม่มี dropdown เปลี่ยน role), เมนูจาก `/me.menus`
4. สร้าง placeholder page ทุกเมนู (เขียน "กำลังพัฒนา") และ redirect หน้าแรกตาม role ตาม 07 §0
5. หน้า 403 เมื่อเข้า URL ที่ไม่มีสิทธิ์; ปุ่มออกจากระบบ

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
| 1 | login `admin` / `Passw0rd!` | เห็นเมนูครบ 11 รายการ ไปหน้า Executive | ☐ |
| 2 | login `gr.bangna` | เห็นแค่ งานซ่อมทั้งหมด + GR, หน้าแรกคือ GR | ☐ |
| 3 | ขณะเป็น gr.bangna พิมพ์ URL `/admin` | หน้า 403 | ☐ |
| 4 | กรอกรหัสผิด 5 ครั้ง | บัญชีถูกล็อกชั่วคราว | ☐ |
| 5 | `pnpm test` | test ของ guard/scope ผ่าน | ☐ |
| 6 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(auth): login, rbac guards, app shell by role"
git tag step-07
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-06 && git clean -fd`
