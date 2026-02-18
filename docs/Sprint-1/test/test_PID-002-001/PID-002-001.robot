*** Settings ***
Library    SeleniumLibrary
Test Teardown    Capture Page Screenshot
Suite Setup       Open Browser    ${BASE_URL}    chrome    options=add_argument("--start-maximized")
Suite Teardown    Close Browser

*** Variables ***
${BASE_URL}       https://cs-se42-68.cpkku.com/
${USERNAME}       somsuk@gmail.com
${PASSWORD}       somsuk123456789

*** Keywords ***
Login
    Go To    ${BASE_URL}/login
    Wait Until Element Is Visible    id=identifier    15s
    Input Text    id=identifier    ${USERNAME}
    Input Text    xpath=//input[@type='password']    ${PASSWORD}
    Click Button    xpath=//button[contains(text(),'เข้าสู่ระบบ')]
    Wait Until Location Does Not Contain    /login    15s

Navigate To Report Page
    Wait Until Page Contains    การเดินทางของฉัน    10s
    Click Element    xpath=//a[contains(text(),'การเดินทางของฉัน')] | //button[contains(text(),'การเดินทางของฉัน')]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'ยืนยันแล้ว')]    10s
    Click Element    xpath=//*[contains(text(),'ยืนยันแล้ว')]
    Sleep    2s
    Wait Until Element Is Visible    xpath=(//button[contains(text(),'รายงาน')])[1]    10s
    Click Element    xpath=(//button[contains(text(),'รายงาน')])[1]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'รายงานปัญหาคนขับ')]    10s

Select Report Topic
    [Arguments]    @{topics}
    FOR    ${topic}    IN    @{topics}
        # คลิกที่แถวของ checkbox ที่มีข้อความนั้น
        Click Element    xpath=//label[contains(.,'${topic}')] | //div[contains(@class,'flex') and contains(.,'${topic}') and .//input[@type='checkbox']]
        Sleep    0.5s
    END

Submit Report
    Scroll Element Into View    xpath=//button[contains(text(),'ส่ง Report')]
    Click Element    xpath=//button[contains(text(),'ส่ง Report')]

*** Test Cases ***
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
    # placeholder จริงคือ "กรุณาระบุปัญหาที่พบ..."
    Wait Until Element Is Visible    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    10s
    Input Text    xpath=//textarea[@placeholder='กรุณาระบุปัญหาที่พบ...']    ผู้โดยสารทำร้ายร่างกาย เกิดอาการบาดเจ็บที่แขนซ้าย ก่อให้เกิดอุบัติเหตุรถพลิกคว่ำ
    Submit Report
    Wait Until Page Contains    รอดำเนินการ    10s
    Page Should Contain    รอดำเนินการ

TC-003 แนบไฟล์รูปภาพอย่างเดียว (ไม่เลือกหัวข้อ)
    [Documentation]    แนบรูปภาพโดยไม่เลือกหัวข้อ ปุ่มส่งยังกด disabled
    Login
    Navigate To Report Page
    Choose File    xpath=//input[@type='file']    C:\\kku-software-engineering-project-painamnae\\tests\\test_image.jpg
    Sleep    1s
    # ตรวจว่าปุ่ม "ส่ง Report" ยังคง disabled อยู่
    Element Should Be Disabled    xpath=//button[contains(text(),'ส่ง Report')]

TC-004 กดส่งโดยไม่เลือกหัวข้อ
    [Documentation]    กด "ส่ง Report" โดยไม่เลือกหัวข้อใดๆ ระบบแจ้งเตือน
    Login
    Navigate To Report Page
    Submit Report
    Sleep    2s
    # ตรวจสอบ toast หรือ alert ที่แสดงขึ้น
    ${body_text}=    Get Text    xpath=//body
    Should Contain    ${body_text}    เลือกหัวข้อ

TC-005 เลือกหัวข้อหลายข้อแล้วส่ง
    [Documentation]    เลือกหัวข้อที่มีจริงในระบบหลายข้อแล้วส่ง
    Login
    Navigate To Report Page
    # ใช้หัวข้อที่มีจริงในระบบ (จากรูป UI)
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