# STEP-00 — เตรียมเครื่องและ Repository (ทำเอง ไม่ต้องใช้ AI)

[สารบัญ](README.md) · ถัดไป → [STEP-01 — สร้างโครง Monorepo](STEP-01_scaffold.md)

**เป้าหมาย:** เครื่องพร้อมรันโปรเจกต์ มี repo ที่มีเอกสารออกแบบอยู่ใน `docs/` และมี AI Agent พร้อมใช้

---

## ① ติดตั้งโปรแกรม

| โปรแกรม | เวอร์ชัน | ตรวจด้วยคำสั่ง |
|---------|----------|---------------|
| Git | ล่าสุด | `git --version` |
| Node.js | 22 LTS | `node -v` → `v22.x` |
| pnpm | 9 ขึ้นไป | `corepack enable` แล้ว `pnpm -v` |
| Docker Desktop | ล่าสุด (เปิดโปรแกรมค้างไว้) | `docker compose version` |
| AI Coding Agent | แนะนำ **Claude Code** (`npm i -g @anthropic-ai/claude-code`) หรือ Cursor / Codex ก็ได้ | `claude --version` |
| VS Code | ไม่บังคับ แต่ช่วยดูไฟล์ | — |

> **Windows:** แนะนำใช้ **WSL2 (Ubuntu)** แล้วติดตั้ง Node/pnpm/Claude Code ใน WSL และเก็บโปรเจกต์ไว้ใน `~/projects` (ไม่ใช่ `C:\`) จะเร็วและเจอปัญหาน้อยกว่า Docker Desktop ให้เปิด "Use WSL 2 based engine"

## ② สร้าง Repository และวางเอกสาร

```bash
mkdir -p ~/projects/svcm && cd ~/projects/svcm
git init -b main

# แตก svcm-system-design.zip แล้วจัดวางแบบนี้
mkdir docs
cp -r /path/to/svcm-system-design/*.md docs/          # 01..09, README.md
cp -r /path/to/svcm-system-design/prototypes docs/
cp -r /path/to/svcm-system-design/steps docs/
mv docs/AGENTS.md ./AGENTS.md
cp AGENTS.md CLAUDE.md                                 # Claude Code อ่าน CLAUDE.md อัตโนมัติ
touch docs/OPEN_QUESTIONS.md
```

โครงสร้างที่ต้องได้:
```
svcm/
├── AGENTS.md
├── CLAUDE.md
└── docs/
    ├── README.md, 01_overview.md … 09_implementation_plan.md, OPEN_QUESTIONS.md
    ├── prototypes/   (13 ไฟล์ .html)
    └── steps/        (ไฟล์ชุดนี้)
```

แก้ path ใน `AGENTS.md`: ข้อความที่อ้าง `docs/0x_*.md` และ `docs/prototypes/` ถูกต้องอยู่แล้ว ไม่ต้องแก้

## ③ Commit จุดเริ่มต้น
```bash
git add -A
git commit -m "docs: add system design pack"
git tag step-00
```
(ถ้าจะใช้ GitHub: สร้าง repo ว่างแล้ว `git remote add origin <url>` และ `git push -u origin main --tags`)

## ④ ทดลองใช้ AI Agent
```bash
cd ~/projects/svcm
claude
```
พิมพ์ทดสอบ:
```text
อ่าน AGENTS.md และ docs/README.md แล้วสรุปให้ผมฟัง 5 บรรทัดว่าระบบนี้คืออะไร และ step แรกต้องทำอะไร ห้ามแก้ไฟล์ใดๆ
```

## ตรวจผล
| # | ทำอะไร | ต้องเห็นอะไร | ผ่าน |
|---|--------|--------------|:----:|
| 1 | `node -v && pnpm -v && docker compose version` | แสดงเวอร์ชันครบ ไม่ error | ☐ |
| 2 | `ls docs/prototypes docs/steps` | มี 13 ไฟล์ html และไฟล์ STEP ครบ | ☐ |
| 3 | `git tag` | มี `step-00` | ☐ |
| 4 | ถาม AI ตามข้อ ④ | AI สรุปได้ถูก ว่าเป็นระบบศูนย์ซ่อมไทวัสดุ และ step แรกคือสร้าง monorepo | ☐ |
