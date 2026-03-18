# Changelog — Sprint 3

โปรเจค: **Painamnae** — ระบบแชร์การเดินทาง

---

## 18 มีนาคม 2569

### ฟีเจอร์ใหม่
- **Location Sharing**: 
  - เพิ่ม API ให้ผู้ใช้เปิดประวัติเซสชันแชร์พิกัดย้อนหลังได้ (Session history API)
  - เชื่อมระบบส่งอัปเดตแจ้งเตือนและข้อความไปยังผู้ติดต่อฉุกเฉินผ่านทาง LINE (LINE Notification & Webhook)
- **การตั้งค่าระบบ (Config/Enhancements)**:
  - เพิ่มตัวเลือกตั้งค่าเวลา (Times) ในเมนูหน้าต่าง Dropdown ของหน้าแชร์พิกัด
  - อัปเดตการตั้งค่าเวลารอ (Interval) ของระบบแชร์โลเคชันเป็น **10 นาที** สำหรับรอบ Production จริง

### แก้ไขข้อผิดพลาด (Bug Fixes)
- **Location Sharing**: 
  - แก้บัค session expiry ที่แจ้งข้อความผิดพลาด (เลื่อนให้ `expireSession` จัดการ `buildExpiredMessage` แทน)
  - แก้ปัญหาหน้า UI ไม่ reset ข้อมูลและสถานะของตัวเองเมื่อเซสชันการแชร์พิกัดสิ้นสุดลงหรือถูกตัดจบ
- **การตรวจสอบและปรับแก้โครงสร้างไฟล์**:
  - เปลี่ยนชื่อโฟลเดอร์ให้ตรงกับโครงสร้างหลักของ DoD อย่างเป็นระบบ
  - เคลียร์โครงสร้างไฟล์ที่ตกค้างบน branch หลัก (main) เพื่อความสะอาดเรียบร้อย
  - แก้ไขการตั้งชื่อไฟล์เอกสารที่มีการพิมพ์หรือจัดกลุ่มผิด (API Test Report, UAT Test)

### เอกสาร และ การทดสอบระบบ (Documentation & Testing)
- **Automated API Testing**:
  - สร้างไฟล์เอกสารครอบคลุม API Test ใหม่อย่างละเอียด (API Test Report.xlsx) และเขียนโค้ดทดสอบเก็บเพิ่มจนได้สถานะ Full Test Coverage (คลุมทุกเงื่อนไข)
- **Robot Framework (UAT Test)**:
  - เพิ่มคู่มือการทดสอบ, โค้ดรันคำสั่ง Robot และภาพหน้าจอประกอบการทดสอบ UAT-PBI-014-004 ถึง -007 อย่างครบถ้วน
- **เอกสารโปรเจค**:
  - อัปโหลดชุดเอกสารประกอบที่เตรียมไว้ครบเซ็ต: `Sprint Backlog`, `ADAPT_Blueprint`, แผนการทดสอบ `Test report`, รวมทั้งไฟล์แนบ `Ai Declare` 
  - เพิ่มรูปแบบ User Manual ลงใน branch หลัก
  - อัปเดตและเพิ่มไฟล์ Test Data สำหรับรองรับการ Execute ทดสอบจริง
  - สร้างไฟล์ Database Schema Documentation (README) สำหรับโครงสร้างตาราง `EmergencyContact` และ `LocationSharingSession`

### รวมงานจากสมาชิก
- ทำการรวมโค้ดและ Merge branch ของสมาชิกแต่ละคน (ekkawich, phatcharida, wattanapong, kittiya, Suchaya, kantavichs) เข้าสู่ `main` อย่างปลอดภัย

---

## 16 มีนาคม 2569

### ฟีเจอร์ใหม่
- **ระบบ Emergency Contact**: สร้างหน้าจัดการและ API สำหรับเชื่อมผู้ติดต่อฉุกเฉิน พร้อมตารางฐานข้อมูล `EmergencyContact` สำหรับใช้งานเต็มรูปแบบ
- **ระบบ Location Sharing**: 
  - เชื่อมโยงระบบจัดเก็บและบันทึกข้อมูลพิกัด พร้อมตาราง `LocationSharingSession` ลงฐานข้อมูลล่วงหน้า
  - เพิ่มหน้า UI ให้ผู้ใช้งานสามารถกดเริ่มการแชร์ตำแหน่งของตนเองแบบสดๆ ได้จากหน้าจอมือถือ (Real-time Sharing UI)
- **LINE Integration**: ทำการเชื่อมต่อ Backend เพื่อรับส่งคำสั่ง LINE Messaging ผ่านช่องทาง Webhook (เช่น การจัดการคำสั่งและ Reply อัตโนมัติ)
- **Demo Mode**: 
  - เปลี่ยนรอบพิกัดระบุตำแหน่ง Location Sharing เป็น **1 นาที** สำหรับใช้พรีเซนต์รอบ Demonstration

### แก้ไขข้อผิดพลาด (Bug Fixes)
- **LINE Webhook**: แก้ปัญหาการประมวลผลคำขอซ้ำตอกย้ำเดิม (Re-processing) เมื่อ User ทำภารกิจการสมัครหรือทำการพูกผูกบัญชีสำเร็จเรียบร้อยแล้ว
- **ระบบ Dependency**: เพิ่ม package `lodash.debounce` ที่ตกหล่นหายไปเพื่อซ่อมแซมกระบวนการ Production Build
- **Nuxt/Prisma Framework**: เพิ่ม Future Compatibility เข้าไปใน Config เพื่อหลีกเลี่ยงข้อความ Warning รบกวนเวลาสั่ง Generate ทรัพยากร
