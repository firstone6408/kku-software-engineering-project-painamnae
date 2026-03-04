*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem
Test Teardown    Capture Page Screenshot
Suite Setup       Open Browser    ${BASE_URL}    chrome    options=add_argument("--start-maximized")
Suite Teardown    Close Browser

*** Variables ***
${BASE_URL}       https://cs-se42-68.cpkku.com/
${USERNAME}       somsuk@gmail.com
${PASSWORD}       somsuk123456789
${TEST_DIR}       C:\\kku-software-engineering-project-painamnae\\tests

*** Keywords ***
Login
    Go To    ${BASE_URL}/login
    Wait Until Element Is Visible    id=identifier    15s
    Input Text    id=identifier    ${USERNAME}
    Input Text    xpath=//input[@type='password']    ${PASSWORD}
    Click Button    xpath=//button[contains(text(),'เข้าสู่ระบบ')]
    Wait Until Location Does Not Contain    /login    15s

Navigate To MyTrip Confirmed Tab
    [Documentation]    ไปหน้าการเดินทางของฉัน แล้วคลิกแท็บ "ยืนยันแล้ว"
    Wait Until Page Contains    การเดินทางของฉัน    10s
    Click Element    xpath=//a[contains(text(),'การเดินทางของฉัน')] | //button[contains(text(),'การเดินทางของฉัน')]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'ยืนยันแล้ว')]    10s
    Click Element    xpath=//*[contains(text(),'ยืนยันแล้ว')]
    Sleep    2s

Open Report Modal From First Trip
    [Documentation]    คลิกปุ่ม "รายงาน" ของทริปแรกที่ยังไม่ได้รายงาน
    Wait Until Element Is Visible    xpath=(//button[contains(text(),'รายงาน')])[1]    10s
    Click Element    xpath=(//button[contains(text(),'รายงาน')])[1]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'รายงานปัญหาคนขับ')]    10s

Navigate To Report Page
    [Documentation]    ไปหน้า myTrip > ยืนยันแล้ว > เปิดฟอร์มรายงาน
    Navigate To MyTrip Confirmed Tab
    Open Report Modal From First Trip

Select Report Topic
    [Arguments]    @{topics}
    FOR    ${topic}    IN    @{topics}
        Click Element    xpath=//label[contains(.,'${topic}')] | //div[contains(@class,'flex') and contains(.,'${topic}') and .//input[@type='checkbox']]
        Sleep    0.5s
    END

Submit Report
    Scroll Element Into View    xpath=//button[contains(text(),'ส่ง Report')]
    Click Element    xpath=//button[contains(text(),'ส่ง Report')]

Close Report Modal
    [Documentation]    ปิด Report Modal โดยกดปุ่ม "ยกเลิก" หรือ "ปิด"
    ${close_exists}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//button[contains(text(),'ปิด')]
    Run Keyword If    ${close_exists}    Click Element    xpath=//button[contains(text(),'ปิด')]
    ...    ELSE    Click Element    xpath=//button[contains(text(),'ยกเลิก')]
    Sleep    1s

*** Test Cases ***
# =========================================================================
# Sprint 1: Test Cases เดิม (TC-001 ถึง TC-006)
# =========================================================================

TC-001 รายงานพฤติกรรมคนขับ (หลายตัวเลือก)
    [Documentation]    เลือกหลายหัวข้อเกี่ยวกับพฤติกรรมคนขับแล้วส่งรายงาน
    Login
    Navigate To Report Page
    Select Report Topic    ขับรถเร็ว    ขับรถประมาท    ขับรถไม่ปลอดภัย    พฤติกรรมไม่เหมาะสม
    Submit Report
    Wait Until Page Contains    รอดำเนินการ    10s
    Page Should Contain    รอดำเนินการ

TC-002 เลือกหัวข้อ อื่นๆ และกรอกรายละเอียดเพิ่มเติม
    [Documentation]    เลือก "อื่นๆ" แล้วกรอกรายละเอียดเพิ่มเติม
    Login
    Navigate To Report Page
    Select Report Topic    อื่นๆ
    Wait Until Element Is Visible    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    10s
    Input Text    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    ผู้โดยสารทำร้ายร่างกาย เกิดอาการบาดเจ็บที่แขนซ้าย ก่อให้เกิดอุบัติเหตุรถพลิกคว่ำ
    Submit Report
    Wait Until Page Contains    รอดำเนินการ    10s
    Page Should Contain    รอดำเนินการ

TC-003 แนบไฟล์รูปภาพอย่างเดียว (ไม่เลือกหัวข้อ)
    [Documentation]    แนบรูปภาพโดยไม่เลือกหัวข้อ ปุ่มส่งยังกด disabled
    Login
    Navigate To Report Page
    Choose File    xpath=//input[@type='file']    ${TEST_DIR}\\test_image.jpg
    Sleep    1s
    Element Should Be Disabled    xpath=//button[contains(text(),'ส่ง Report')]

TC-004 กดส่งโดยไม่เลือกหัวข้อ
    [Documentation]    กด "ส่ง Report" โดยไม่เลือกหัวข้อใดๆ ระบบแจ้งเตือน
    Login
    Navigate To Report Page
    Submit Report
    Sleep    2s
    ${body_text}=    Get Text    xpath=//body
    Should Contain    ${body_text}    เลือกหัวข้อ

TC-005 เลือกหัวข้อหลายข้อแล้วส่ง
    [Documentation]    เลือกหัวข้อที่มีจริงในระบบหลายข้อแล้วส่ง
    Login
    Navigate To Report Page
    Select Report Topic    ขับรถเร็ว    พูดจาไม่เพราะ    ขับรถประมาท    พฤติกรรมไม่เหมาะสม
    Submit Report
    Wait Until Page Contains    รอดำเนินการ    10s
    Page Should Contain    รอดำเนินการ

TC-006 ตรวจสอบข้อความยืนยันหลังส่งรายงาน
    [Documentation]    ตรวจสอบว่าระบบแสดงข้อความยืนยันครบถ้วน
    Login
    Navigate To Report Page
    Select Report Topic    ขับรถเร็ว
    Submit Report
    Wait Until Page Contains    ส่ง Report สำเร็จ    10s
    Page Should Contain    ส่ง Report สำเร็จ
    Page Should Contain    เราจะดำเนินการตรวจสอบให้เร็วที่สุด
    Page Should Contain    รอดำเนินการ

# =========================================================================
# Sprint 2: Test Cases ใหม่ (TC-007 ถึง TC-014)
# =========================================================================

# --- CHANGELOG #1: File Upload Validation ---

TC-007 แนบไฟล์ที่ไม่รองรับ (เช่น .txt) ระบบแสดง Error Dialog
    [Documentation]    อัปโหลดไฟล์ที่ไม่ใช่ image/video → ระบบแสดง popup "ไฟล์ไม่รองรับ"
    Login
    Navigate To Report Page
    # สร้างไฟล์ .txt ชั่วคราวเพื่อทดสอบ
    Create File    ${TEST_DIR}\\test_invalid.txt    This is a test file
    Choose File    xpath=//input[@type='file']    ${TEST_DIR}\\test_invalid.txt
    Sleep    1s
    # ตรวจสอบว่า popup error แสดงขึ้น
    Wait Until Page Contains    ไฟล์ไม่รองรับ    10s
    Page Should Contain    ไฟล์ไม่รองรับ
    # กดปุ่ม "ตกลง" เพื่อปิด popup
    Click Element    xpath=//button[contains(text(),'ตกลง')]
    Sleep    0.5s
    # popup ควรหายไป
    Page Should Not Contain    ไฟล์ไม่รองรับ

TC-008 แนบไฟล์รูปภาพที่รองรับ (.jpg) สำเร็จ
    [Documentation]    อัปโหลดไฟล์ image → ไม่แสดง popup error + แสดง preview
    Login
    Navigate To Report Page
    Choose File    xpath=//input[@type='file']    ${TEST_DIR}\\test_image.jpg
    Sleep    1s
    # ไม่ควรมี popup error
    Page Should Not Contain    ไฟล์ไม่รองรับ
    # ควรมี preview ของไฟล์แสดง (img หรือ video tag ใน media section)
    Element Should Be Visible    xpath=//img[contains(@class,'media')] | //div[contains(@class,'media')]//img

# --- CHANGELOG #2: Required Field สำหรับ "อื่นๆ" ---

TC-009 เลือก "อื่นๆ" แต่ไม่กรอกรายละเอียด ปุ่มส่งต้อง disabled
    [Documentation]    เลือก "อื่นๆ" โดยไม่กรอก textarea → ปุ่ม "ส่ง Report" ต้อง disabled + แสดง error message
    Login
    Navigate To Report Page
    Select Report Topic    อื่นๆ
    # รอ textarea แสดง
    Wait Until Element Is Visible    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    10s
    # ไม่กรอกอะไร → ปุ่มส่งต้อง disabled
    Element Should Be Disabled    xpath=//button[contains(text(),'ส่ง Report')]
    # ควรแสดงข้อความ error
    Page Should Contain    กรุณาระบุรายละเอียดเพิ่มเติม

TC-010 เลือก "อื่นๆ" แล้วกรอกรายละเอียด ปุ่มส่งต้อง enabled
    [Documentation]    เลือก "อื่นๆ" แล้วกรอก textarea → ปุ่ม "ส่ง Report" ต้อง enabled
    Login
    Navigate To Report Page
    Select Report Topic    อื่นๆ
    Wait Until Element Is Visible    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    10s
    Input Text    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    ทดสอบรายละเอียดเพิ่มเติม
    Sleep    0.5s
    # ปุ่มส่งต้อง enabled
    Element Should Be Enabled    xpath=//button[contains(text(),'ส่ง Report')]
    # ไม่ควรแสดง error
    Page Should Not Contain    กรุณาระบุรายละเอียดเพิ่มเติม

# --- CHANGELOG #3: ปุ่มรายงานแสดงตามสถานะ ---

TC-011 ปุ่มรายงานเปลี่ยนเป็น "รอดำเนินการ" หลังส่งรายงานสำเร็จ
    [Documentation]    หลังส่ง Report สำเร็จ ปุ่มต้องเปลี่ยนจาก "รายงาน" เป็น "รอดำเนินการ" (สีเหลือง)
    Login
    Navigate To Report Page
    Select Report Topic    ขับรถเร็ว
    Submit Report
    Wait Until Page Contains    ส่ง Report สำเร็จ    10s
    Sleep    2s
    # ปุ่มต้องเปลี่ยนเป็น "รอดำเนินการ" (สีเหลือง)
    Wait Until Element Is Visible    xpath=//button[contains(@class,'bg-yellow') and contains(text(),'รอดำเนินการ')]    10s
    Page Should Contain    รอดำเนินการ

# --- CHANGELOG #6: Status Badge & Readonly Mode ---

TC-012 กดปุ่ม "รอดำเนินการ" เปิดฟอร์มแก้ไขได้ + แสดง Status Badge
    [Documentation]    กดปุ่ม "รอดำเนินการ" → เปิด modal พร้อมแสดง status badge + form ยังแก้ไขได้
    Login
    Navigate To MyTrip Confirmed Tab
    # คลิกที่ทริปที่มีปุ่ม "รอดำเนินการ"
    Wait Until Element Is Visible    xpath=//button[contains(@class,'bg-yellow') and contains(text(),'รอดำเนินการ')]    10s
    Click Element    xpath=(//button[contains(@class,'bg-yellow') and contains(text(),'รอดำเนินการ')])[1]
    Sleep    1s
    # ตรวจ Status Badge แสดง
    Wait Until Page Contains    ผู้ดูแลกำลังตรวจสอบ    10s
    Page Should Contain    คุณสามารถแก้ไข Report ได้
    # ตรวจว่า checkbox ยัง Enabled อยู่ (ไม่ใช่ readonly)
    Element Should Be Enabled    xpath=(//input[@type='checkbox' and contains(@class,'report-checkbox')])[1]
    # ปุ่ม "บันทึกการแก้ไข" ต้องมี (ไม่ใช่ปุ่ม "ปิด" อย่างเดียว)
    Element Should Be Visible    xpath=//button[contains(text(),'บันทึกการแก้ไข')]
    Close Report Modal

TC-013 ฟอร์ม Readonly เมื่อสถานะเป็น CONFIRMED (เสร็จสิ้น)
    [Documentation]    กดปุ่ม "เสร็จสิ้น" → เปิด modal แบบ readonly + ไม่มีปุ่มส่ง/แก้ไข มีแค่ปุ่ม "ปิด"
    Login
    Navigate To MyTrip Confirmed Tab
    # คลิกปุ่ม "เสร็จสิ้น" (สีเขียว) ถ้ามี
    ${has_confirmed}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//button[contains(@class,'bg-green') and contains(text(),'เสร็จสิ้น')]    5s
    Run Keyword If    not ${has_confirmed}    Skip    ไม่มี Report ที่อยู่ในสถานะ CONFIRMED
    Click Element    xpath=(//button[contains(@class,'bg-green') and contains(text(),'เสร็จสิ้น')])[1]
    Sleep    1s
    # ตรวจ status badge
    Wait Until Page Contains    ดำเนินการเสร็จสิ้น    10s
    Page Should Contain    ผู้ดูแลตรวจสอบเรียบร้อยแล้ว
    # ตรวจว่า checkbox ถูก disabled (readonly)
    Element Should Be Disabled    xpath=(//input[@type='checkbox' and contains(@class,'report-checkbox')])[1]
    # ไม่ควรมีปุ่ม "ส่ง Report" หรือ "บันทึกการแก้ไข"
    Page Should Not Contain Element    xpath=//button[contains(text(),'ส่ง Report')]
    Page Should Not Contain Element    xpath=//button[contains(text(),'บันทึกการแก้ไข')]
    # ต้องมีปุ่ม "ปิด" เท่านั้น
    Element Should Be Visible    xpath=//button[contains(text(),'ปิด')]
    # ไม่ควรแสดงส่วนแนบหลักฐาน (ปุ่มอัปโหลด)
    Page Should Not Contain Element    xpath=//label[contains(text(),'แนบหลักฐาน')]
    Close Report Modal

TC-014 ฟอร์ม Readonly เมื่อสถานะเป็น REJECTED (ปฏิเสธ)
    [Documentation]    กดปุ่ม "ปฏิเสธ" → เปิด modal แบบ readonly + แสดงเหตุผลที่ถูกปฏิเสธ
    Login
    Navigate To MyTrip Confirmed Tab
    # คลิกปุ่ม "ปฏิเสธ" (สีเทา) ถ้ามี
    ${has_rejected}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//button[contains(@class,'bg-gray-500') and contains(text(),'ปฏิเสธ')]    5s
    Run Keyword If    not ${has_rejected}    Skip    ไม่มี Report ที่อยู่ในสถานะ REJECTED
    Click Element    xpath=(//button[contains(@class,'bg-gray-500') and contains(text(),'ปฏิเสธ')])[1]
    Sleep    1s
    # ตรวจ status badge
    Wait Until Page Contains    ปฏิเสธ    10s
    Page Should Contain    ผู้ดูแลปฏิเสธการรายงานนี้
    # ตรวจว่า checkbox ถูก disabled (readonly)
    Element Should Be Disabled    xpath=(//input[@type='checkbox' and contains(@class,'report-checkbox')])[1]
    # ไม่ควรมีปุ่ม "ส่ง Report" หรือ "บันทึกการแก้ไข"
    Page Should Not Contain Element    xpath=//button[contains(text(),'ส่ง Report')]
    Page Should Not Contain Element    xpath=//button[contains(text(),'บันทึกการแก้ไข')]
    # ต้องมีปุ่ม "ปิด" เท่านั้น
    Element Should Be Visible    xpath=//button[contains(text(),'ปิด')]
    Close Report Modal
