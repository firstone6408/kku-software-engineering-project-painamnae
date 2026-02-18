# คู่มือการใช้งานระบบ (User Manual)

## Story
As a driver, I want to report incidents to the admin and get the update on the filed case.

## 1.ระบบรายงานเหตุการณ์และติดตามสถานะเคส (PBL11)

ผู้ขับขี่สามารถรายงานเหตุการณ์หรือพฤติกรรมที่ไม่เหมาะสมที่เกิดขึ้นระหว่างการให้บริการไปยังผู้ดูแลระบบ เพื่อให้ตรวจสอบและดำเนินการแก้ไขปัญหาได้อย่างรวดเร็ว โดยระบบจะบันทึกรายงานแต่ละรายการในรูปแบบเคส (Case) พร้อมหมายเลขอ้างอิง รายละเอียดเหตุการณ์ หลักฐานประกอบ และสถานะการดำเนินงาน เพื่อให้สามารถติดตามความคืบหน้าและตรวจสอบย้อนหลังได้อย่างเป็นระบบ
ระบบ Painamnae Backend เป็น API Server พัฒนาด้วย Node.js (Express) และ PostgreSQL  
ทำหน้าที่จัดการข้อมูลผู้ใช้ การเดินทาง และระบบรายงานเหตุการณ์ (Incident Report)

ฟีเจอร์หลักของระบบรายงานเหตุการณ์:
- สร้างรายงานเหตุการณ์
- แนบหลักฐาน (รูปภาพ/ไฟล์)
- ติดตามสถานะเคส

---

### ขั้นตอนการเข้าใช้งาน
1. **การเข้าสู่ระบบ:** กรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่านที่หน้า Login จากนั้นกดปุ่ม “เข้าสู่ระบบ”
2. **หน้า Dashboard:** เมื่อเข้าสู่ระบบเรียบร้อยแล้ว
3. **กดปุ่ม "การเดินทางทั้งหมด"**
 <img width="1681" height="775" alt="image" src="https://github.com/user-attachments/assets/d17140c1-ac0b-499f-b7c1-6095bb476d3e" />
 
4. **กดปุ่ม "ยืนยันแล้ว"**
<img width="1679" height="792" alt="image" src="https://github.com/user-attachments/assets/21d775f4-6c0a-474e-a64e-4b9f2bbcf076" />

5. **กดปุ่ม "จัดการเส้นทาง"**
<img width="800" height="289" alt="image" src="https://github.com/user-attachments/assets/e05cb292-2097-4d49-8dc9-fc2c675752ae" />

6. **กดปุ่ม "ยืนยันแล้ว"**
<img width="1544" height="654" alt="image" src="https://github.com/user-attachments/assets/a0b585c0-039c-4e0b-a50e-12e12281469a" />

7. **กดปุ่ม "รายงาน" ผู้โดยสารที่ต้องการ**
<img width="805" height="262" alt="image" src="https://github.com/user-attachments/assets/b3fc7892-15ce-42bd-93e5-3fd871d2063d" />

8. **กดเลือกปัญหาที่พบ:** เกิดอุบัติเหตุ,ผู้โดยสารก่อกวน,ผู้โดยสารพูดจาไม่เพราะ หรือ เกิดความเสียหายกับรถ
<img width="593" height="688" alt="image" src="https://github.com/user-attachments/assets/21bb8c2c-7500-4df9-a157-c9940cae6b1e" />


9. **กดปุ่ม "ส่ง Report"**
<img width="235" height="80" alt="image" src="https://github.com/user-attachments/assets/3611aa5d-6387-47e2-8995-69198ae3bf6f" />


10. **จะแสดงข้อความ:** ส่ง Report สำเร็จ เราจะดำเนินการตรวจสอบให้เร็วที่สุด
<img width="1627" height="795" alt="image" src="https://github.com/user-attachments/assets/0db93ae8-f4de-4815-a888-c797b90f4830" />





## 2.การรายงานพฤติกรรมของคนขับให้ผู้ดูแลระบบทราบ และสามารถติดตามการอัปเดตสถานะของเคสที่ได้แจ้งไว้ได้ (PBL13)

ผู้โดยสารสามารถรายงานพฤติกรรมของคนขับที่ไม่เหมาะสมหรือเหตุการณ์ที่เกิดขึ้นระหว่างการเดินทางไปยังผู้ดูแลระบบ เพื่อให้ตรวจสอบและดำเนินการแก้ไขปัญหาได้อย่างรวดเร็ว โดยระบบจะบันทึกรายงานแต่ละรายการในรูปแบบเคส (Case) พร้อมหมายเลขอ้างอิง รายละเอียดเหตุการณ์ หลักฐานประกอบ และสถานะการดำเนินงาน เพื่อให้ผู้โดยสารสามารถติดตามการอัปเดตสถานะของเคสที่แจ้งได้

ฟีเจอร์หลักของระบบรายงานเหตุการณ์:
- สร้างรายงานเหตุการณ์
- แนบหลักฐาน (รูปภาพ/ไฟล์)
- ติดตามสถานะเคส

---

### ขั้นตอนการเข้าใช้งาน
1. **การเข้าสู่ระบบ:** กรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่านที่หน้า Login จากนั้นกดปุ่ม “เข้าสู่ระบบ”
2. **หน้า Dashboard:** เมื่อเข้าสู่ระบบเรียบร้อยแล้ว 
3. **กดปุ่ม "การเดินทางของฉัน"**
<img width="1523" height="723" alt="image" src="https://github.com/user-attachments/assets/ae983bc9-4128-4785-9fcf-2ba794d49caf" />

5. **กดปุ่ม "ยืนยันแล้ว"**
<img width="1565" height="694" alt="image" src="https://github.com/user-attachments/assets/a9101c3b-52a4-46d2-aa8b-c555b79ccff2" />

7. **กดปุ่ม "รายงาน" คนขับที่ต้องการ**
<img width="842" height="247" alt="image" src="https://github.com/user-attachments/assets/47aae004-f518-45ec-a44d-52146675dc22" />

9. **กดเลือกปัญหาที่พบ:** ขับรถเร็ว,ขับรถประมาท,ขับรถไม่ปลอดภัย หรือ พฤติกรรมไม่เหมาะสม
<img width="1462" height="856" alt="image" src="https://github.com/user-attachments/assets/b4e780fc-fe4e-4e1b-9890-b72659d376eb" />

11. **กดปุ่ม "ส่ง Report"**
<img width="235" height="74" alt="image" src="https://github.com/user-attachments/assets/5d424c68-fc44-4905-8559-50f4988d4fcf" />

13. **จะแสดงข้อความ:** ส่ง Report สำเร็จ เราจะดำเนินการตรวจสอบให้เร็วที่สุด
<img width="1476" height="754" alt="image" src="https://github.com/user-attachments/assets/172c5de0-9053-4edc-adec-96a03295e29e" />
