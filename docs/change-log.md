# Changelog — Sprint 2

โปรเจค: **Painamnae** — ระบบแชร์การเดินทาง

---

## 4 มีนาคม 2569

### แก้ไขข้อผิดพลาด (Bug Fixes)

- แก้ไขปัญหา `package-lock.json` ไม่ตรงกัน ทำให้ build ไม่ผ่าน (regenerate ใหม่)
- แก้ไข Report status ที่ใช้ `CONFIRMED` ผิด → เปลี่ยนเป็น `RESOLVED` ทั้งหน้า myTrip และ myRoute
- ปรับ styling ปุ่ม Report ให้ไม่ดึงดูดสายตาเกินไป (เปลี่ยนจากปุ่มสีทึบเป็น outline)

### ฟีเจอร์ใหม่

- เพิ่มข้อมูลเส้นทาง (ต้นทาง → ปลายทาง, วันที่) ในการแจ้งเตือน Report ทั้ง 3 สถานะ (filed, resolved, rejected)
- อัปเดต Report Modal — เปลี่ยนชื่อหัวข้อเป็น "Report เหตุการณ์" และปรับ UI รายการ read-only ให้ดูดีขึ้น
- อัปเดต Report Modal header ให้แสดง title, icon, subtitle ตามสถานะ Report

### ทดสอบระบบ

- เพิ่มเอกสาร `Sprint 2 Test Design UAT.xlsx` (ออกแบบ test cases)
- เพิ่มเอกสาร `Sprint 2 API Test.xlsx` (รายละเอียด API test cases)
- เพิ่ม verbose test output ในการตั้งค่า Jest
- Backend API test: `backend/tests/report.test.js` — ครอบคลุม 54 test cases

### รวมงานจากสมาชิก

- รวม branch ekkawich-6198, kantavichs-5867, phatcharida-6083, wattanapong-4007, kittiya-3768 เข้า main (Pull Request #12–#21)

### เอกสาร

- เพิ่ม Sprint Backlog สำหรับ Sprint 2
- เพิ่ม A-DAPT Blueprint สำหรับ Sprint 2
- เพิ่มไฟล์ Test Data
- เพิ่มไฟล์ Retrospective
- เพิ่มไฟล์ทดสอบ Robot Framework (screen capture และ robot.html)
- เปลี่ยนชื่อโฟลเดอร์ `product-backlog` → `sprint-backlog`

---

## 3 มีนาคม 2569

### แก้ไขข้อผิดพลาด (Bug Fixes)

- แก้ไข Report Modal validation (ตรวจสอบข้อมูลก่อนส่ง)
- แก้ไขบัคฟอร์ม createTrip
- แก้ไขปัญหาโหลด Google Maps

### ปุ่ม Report มาตรฐาน

- ปรับปุ่ม Report ให้เป็นมาตรฐานเดียวกันทุกหน้า
- เพิ่มฟอร์ม read-only สำหรับ myTrip/myRoute (ดู/แก้ไข Report ที่ส่งไปแล้ว)

### เอกสารและทดสอบ

- อัปเดตคู่มือการใช้งาน
- เพิ่ม `Sprint 2 Test Design UAT.xlsx`
- เพิ่ม Test Case PID-001-001 (Robot Framework) — 8 ไฟล์:
  - `testTC001-2.robot`, `testTC003.robot` – `testTC009.robot`
  - screenshot ประกอบ: `PhotoTC001-2/`, `PhotcTC005/`, `PhotcTC009/`
- เพิ่ม Test Case PID-002 (Robot Framework) — 6 ไฟล์:
  - `testPID002-001.robot` – `testPID002-006.robot`
  - screenshot ประกอบ: `PhototestPID002-001/` – `PhototestPID002-006/`
- เพิ่ม `test_PID-002-001/PID-002-001.robot`

### รวมงานจากสมาชิก

- รวม branch kittiya-3768 และ wattanapong-4007 เข้า main (Pull Request #10–#11)

---

## 2 มีนาคม 2569

### ฟีเจอร์ใหม่ — ระบบ Report Rejection

- เพิ่มสถานะ `REJECTED` ใน ReportStatus enum พร้อมฟิลด์ `rejectionReason`
- สร้าง API endpoint สำหรับ admin ปฏิเสธ Report พร้อมส่งแจ้งเตือน
- เพิ่ม UI สำหรับ admin เปลี่ยนสถานะ Report (dropdown + เหตุผลการปฏิเสธ)
- เขียน test cases สำหรับ rejection endpoint

### แก้ไขข้อผิดพลาด (Bug Fixes)

- แก้ไขปัญหา Swagger ไม่แสดงผลบน Docker deployment
- อัปเดต Swagger docs เพิ่ม reject endpoint และสถานะ REJECTED

---

## 1 มีนาคม 2569

### ฟีเจอร์ใหม่ — Admin Report Management

- สร้าง API endpoints สำหรับ admin จัดการ Report (GET /admin, GET /admin/:id)
- สร้างหน้า admin report management พร้อม components (ตาราง, รายละเอียด, ตัวกรอง)
- เขียน test cases สำหรับ admin report API ด้วย Jest

### แก้ไขข้อผิดพลาด (Bug Fixes)

- แก้ไข Dockerfile ให้รองรับ TypeScript build
- แก้ไขบัคหน้า admin bookings (hardcoded URL, double-slash, computed side-effect, wrong updatedAt)

---

## 28 กุมภาพันธ์ 2569

### เอกสาร

- เพิ่มโครงสร้างเอกสาร Sprint 2 และคู่มือการใช้งาน

---

## 25 กุมภาพันธ์ 2569

### Refactor

- ย้ายระบบ backend ทั้งหมดจาก JavaScript เป็น TypeScript
- เปลี่ยนไฟล์ .js → .ts ทุกไฟล์ พร้อม type annotations
- ปรับ module imports/exports ให้เป็น ES module style
- ส่งออก Zod-inferred types ไปยังโฟลเดอร์ `types` สำหรับ frontend ใช้งาน

---

---

# Changelog — Sprint 1

โปรเจค: **Painamnae** — ระบบแชร์การเดินทาง

---

## 18 กุมภาพันธ์ 2569

### รวมงานจากทุกสมาชิก

- รวม branch ของสมาชิกทุกคนเข้า main (Pull Request #1–#8)
- อัปเดตข้อมูลทีมในหน้า about-my-team

### เอกสาร

- เพิ่มไฟล์ A-DAPT Blueprint พร้อมรูปภาพ และข้อมูลทดสอบ
- เพิ่มไฟล์ A-DAPT Blueprint and Task (.xlsx)
- เพิ่ม Sprint Backlog (.xlsx)
- เพิ่ม UAT Test (.xlsx)
- อัปโหลดคู่มือการใช้งาน (.md & .pdf)

### ทดสอบระบบ

- เขียน Automated API Test สำหรับระบบรายงาน (Report) ด้วย Jest + Supertest รวม 17 test cases ครอบคลุมทุก endpoint
- แยกไฟล์ Express app (`app.js`) ออกจาก server เพื่อรองรับการทดสอบอัตโนมัติ
- เพิ่ม Test Cases สำหรับ PID-001-001 (คนขับ) และ PID-002-001 (ผู้โดยสาร)

### แก้ไขข้อผิดพลาด (Bug Fixes)

- แก้ปัญหาคนขับที่จองเดินทางเป็นผู้โดยสาร ไม่สามารถส่ง report ได้ (เดิมล็อค role ไว้)
- แก้หน้า "การเดินทางของฉัน" ให้คนขับเห็นเส้นทางที่ตัวเองสร้างด้วย (เดิมแสดงแค่การจองในฐานะผู้โดยสาร)
- แก้หน้า "เส้นทางของฉัน" ให้แสดงเส้นทางทุกสถานะ รวมถึงที่เสร็จสิ้นและยกเลิกแล้ว
- แก้ปัญหา CORS ที่ทำให้ frontend เรียก API ไม่ได้
- แก้ข้อผิดพลาดหน้า Admin ที่เกิดจากการโหลดข้อมูล user ก่อนที่จะพร้อม

### ฟีเจอร์ใหม่ — ระบบรายงาน (Report System)

- สร้างตาราง database สำหรับเก็บข้อมูลรายงาน (Report, เหตุผล, ไฟล์แนบ)
- สร้าง API สำหรับส่งรายงานโดยคนขับและผู้โดยสาร สามารถแก้ไขได้ก่อน admin ดำเนินการ
- สร้าง API สำหรับ admin ใช้ปิดเคส (resolve) พร้อมส่งแจ้งเตือนให้ผู้ส่งรายงาน
- สร้างหน้าต่าง pop-up สำหรับกรอกรายงาน ทั้งฝั่งคนขับและผู้โดยสาร (รองรับอัปโหลดรูปและวิดีโอ)
- เพิ่มปุ่มรายงานในหน้าเดินทาง โดยมี 3 สถานะ: ยังไม่ report / report แล้ว / ดำเนินการเรียบร้อย

### Deployment

- สร้าง Dockerfile สำหรับ deploy backend ขึ้น server
- ปรับ Docker base image เป็น node:20-slim เพื่อความเข้ากันได้ดีขึ้น

### อื่นๆ

- ลบไฟล์ .env.render ที่ไม่ใช้แล้ว
- ลบไฟล์เอกสารซ้ำที่อัปโหลดผิด

---

## 17 กุมภาพันธ์ 2569

### เริ่มต้นโปรเจค

- สร้าง repository และตั้งค่าโปรเจคเริ่มต้น
- เพิ่ม README.md และ .gitignore
- เพิ่มข้อมูลสมาชิกในทีม (about-my-team.md)
- เพิ่มโปรเจคอ้างอิง (reference project)
- สร้างโครงสร้าง frontend (Nuxt.js) และ backend (Express.js) เริ่มต้น
- เพิ่มคู่มือการใช้งานสำหรับ Sprint 1
