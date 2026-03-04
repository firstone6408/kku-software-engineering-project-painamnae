# Changelog — 3 มีนาคม 2569

## 1. Report Modal — Error Handling แนบหลักฐาน

**ไฟล์ที่แก้ไข:**
- `frontend/components/report/DriverReportModalButton.vue`
- `frontend/components/report/PassengerReportModalButton.vue`
- `frontend/components/FileErrorDialog.vue` **(NEW)**

**รายละเอียด:**
- เพิ่ม validation ในฟังก์ชัน `onFileChange()` — ตรวจสอบว่าไฟล์ที่อัพโหลดเป็น `image/*` หรือ `video/*` เท่านั้น
- หากไฟล์ไม่รองรับ จะแสดง **popup dialog กลางหน้าจอ** (z-index: 1100) แจ้ง error พร้อมชื่อไฟล์ โดยไม่บังฟอร์มรายงาน
- แยก popup ออกมาเป็น component กลาง `FileErrorDialog.vue` เพื่อลด code ซ้ำซ้อน

---

## 2. Report Modal — Required field สำหรับ "อื่นๆ"

**ไฟล์ที่แก้ไข:**
- `frontend/components/report/DriverReportModalButton.vue`
- `frontend/components/report/PassengerReportModalButton.vue`

**รายละเอียด:**
- เมื่อติ๊กเลือก "อื่นๆ" ช่อง "ระบุรายละเอียดเพิ่มเติม" จะแสดงเครื่องหมาย **`*` สีแดง** และเป็น required
- ปุ่ม "ส่ง Report" จะ **disabled** จนกว่าจะกรอกข้อมูลในช่องดังกล่าว
- แสดงข้อความ error สีแดงใต้ textarea พร้อม border สีแดงเมื่อยังไม่ได้กรอก

---

## 3. myTrip และ myRoute — ปรับปรุงปุ่มรายงานแสดงตามสถานะ

**ไฟล์ที่แก้ไข:**
- `frontend/pages/myTrip/index.vue`
- `frontend/pages/myRoute/index.vue`

**รายละเอียด:**
- ปรับปรุงให้ปุ่มรายงานในหน้า **myTrip** และ **myRoute** ทำงานด้วยมาตรฐานเดียวกันทั้งหมด
- ใช้ Icon รูป **เครื่องหมายตกใจ (Warning)** เดียวกันสำหรับทุกสถานะปุ่ม
- นำปุ่ม **"ลบรายการ"** ออกจากทุกสถานะ (rejected, cancelled) เพื่อป้องกันการลบหลักฐาน
- ปรับปรุง Tooltip เมื่อนำเมาส์ไปชี้ (Hover) ให้แสดงผลได้อย่างถูกต้องแม้ปุ่มในสถานะปกติจะกดไม่ได้

| สถานะ Report | ปุ่ม | สี | สถานะปุ่ม | กดเพื่อ | Tooltip (hover) |
|---|---|---|---|---|---|
| ยังไม่รายงาน | "รายงาน" | แดง | เปิดฟอร์มรายงานใหม่ | รายงานใหม่ | — |
| `PENDING` | "รอดำเนินการ" | เหลืองทึบ | เปิดฟอร์มแก้ไข | ดู/แก้ไข | "ผู้ดูแลกำลังตรวจสอบ" |
| `CONFIRMED` | "เสร็จสิ้น" | เขียวทึบ | เปิดฟอร์มแบบ Readonly | ดู | "ผู้ดูแลตรวจสอบดำเนินการเสร็จสิ้น" |
| `REJECTED` | "ปฏิเสธ" | เทาทึบ | เปิดฟอร์มแบบ Readonly | ดู | "ผู้ดูแลปฏิเสธการรายงาน" |
| อื่นๆ (Fallback) | "ดำเนินการแล้ว" | เทาอ่อน (Outline) | เปิดฟอร์มแบบ Readonly | ดู | "ผู้ดูแลดำเนินการเสร็จสิ้น" |

---

## 6. Report Modal — ระบบแสดงสถานะและ Readonly Mode

**ไฟล์ที่แก้ไข:**
- `frontend/components/report/DriverReportModalButton.vue`
- `frontend/components/report/PassengerReportModalButton.vue`

**รายละเอียด:**
- **Status Badge:** เมื่อเปิดฟอร์มรายงานที่ส่งไปแล้ว จะมีป้ายกำกับบอกสถานะการตรวจสอบดังนี้
  - 🟡 `PENDING`: "รอดำเนินการ — ผู้ดูแลกำลังตรวจสอบ คุณสามารถแก้ไข Report ได้"
  - 🟢 `CONFIRMED`/`RESOLVED`: "ดำเนินการเสร็จสิ้น — ผู้ดูแลตรวจสอบเรียบร้อยแล้ว"
  - 🔴 `REJECTED`: "ปฏิเสธ — ผู้ดูแลปฏิเสธการรายงานนี้" (พร้อมแสดงเหตุผลที่ถูกปฏิเสธ)
- **Readonly Mode:** หากสถานะ **ไม่ใช่** `PENDING` (เช่น ตรวจสอบเสร็จแล้วหรือถูกปฏิเสธ) ฟอร์มจะเข้าสู่โหมดอ่านอย่างเดียว:
  - Checkbox, Textarea ถูก disable
  - ปุ่มแนบรูปภาพ/วิดีโอถูกซ่อน
  - ปุ่มลบรูปภาพถูกซ่อน
  - ปุ่มส่ง/บันทึกถูกซ่อน แสดงแค่ปุ่ม **"ปิด"** เท่านั้น

---

## 4. createTrip — แก้ปุ่ม "ใช้ตำแหน่งนี้" กดไม่ได้

**ไฟล์ที่แก้ไข:**
- `frontend/pages/createTrip/index.vue`

**สาเหตุ:** ปุ่ม "ใช้ตำแหน่งนี้" และ "ยกเลิก" ใน modal แผนที่อยู่ภายใน `<form>` แต่ไม่มี `type="button"` ทำให้ default เป็น `type="submit"` → trigger form submission แทน

**การแก้ไข:** เพิ่ม `type="button"` ให้ทั้ง 2 ปุ่ม

---

## 5. createTrip — Validation จุดเริ่มต้น/ปลายทาง

**ไฟล์ที่แก้ไข:**
- `frontend/pages/createTrip/index.vue`

**สาเหตุ:** เมื่อผู้ใช้พิมพ์ข้อความโดยไม่เลือกจาก autocomplete `startMeta`/`endMeta` จะมี lat/lng เป็น `null` → `Number(null) = 0` → ส่ง `{lat: 0, lng: 0}` ไป Google Directions API → `ZERO_RESULTS`

**การแก้ไข:** เพิ่ม validation ก่อน submit ตรวจสอบว่า lat/lng ไม่เป็น `null` พร้อมแสดง toast แนะนำให้เลือกจากรายการแนะนำหรือปักหมุดบนแผนที่
