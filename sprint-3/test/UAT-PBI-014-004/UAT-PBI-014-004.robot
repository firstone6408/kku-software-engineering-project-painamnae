*** Settings ***
Documentation       UAT-PBI-014-004 ทดสอบการแก้ไขผู้ติดต่อฉุกเฉินผู้ใช้ไม่สำเร็จ
...                 PBI 14 - As a passenger, I want people in my emergency contact
...                 to check on my location from time to time so that they know I am whereabout.
...                 Version: V.1 | Last update: 17/3/2026
Library             SeleniumLibrary
Suite Setup         Open Browser    ${BASE_URL}    ${BROWSER}
Suite Teardown      Close Browser
Test Setup          Run Keywords
...                 Go To    ${BASE_URL}
...                 AND    Sleep    0.5s
Test Teardown       Close Modal If Open

*** Variables ***
${BASE_URL}         https://csse4269.cpkku.com/
${LOGIN_URL}        https://csse4269.cpkku.com/login
${BROWSER}          chrome
${EMAIL}            phatcharida.f@kkumail.com
${PASSWORD}         Ma123456789
${TARGET_CONTACT}   เกศรา กฤติขจร

*** Keywords ***
Clear Field With JS
    [Arguments]    ${element}
    [Documentation]    ล้างค่า input field ด้วย JavaScript (เพื่อให้แน่ใจว่าข้อมูลถูกลบออกทั้งหมด)
    Execute Javascript    arguments[0].value = '';    ARGUMENTS    ${element}
    Press Keys    ${element}    SPACE+BACK_SPACE

Close Modal If Open
    [Documentation]    ปิด modal ถ้ายังเปิดอยู่ (กด X หรือ ยกเลิก)
    ${modal_open}=    Run Keyword And Return Status
    ...    Element Should Be Visible    xpath=//*[contains(text(),'แก้ไขผู้ติดต่อฉุกเฉิน')]
    Run Keyword If    ${modal_open}
    ...    Click Element    xpath=//button[contains(text(),'ยกเลิก')]

Open Website And Verify
    [Documentation]    Step 1: เปิดเว็บไซต์และตรวจสอบ
    Page Should Contain    ไปนำแหน่
    Capture Page Screenshot    01_open_website.png

Login With Valid Credentials
    [Documentation]    Step 2: เข้าสู่ระบบสำเร็จ
    Go To    ${LOGIN_URL}
    Wait Until Page Contains Element
    ...    xpath=//input[@placeholder='กรอกชื่อผู้ใช้หรืออีเมล']    timeout=10s
    Capture Page Screenshot    02_login_page.png
    Input Text        xpath=//input[@placeholder='กรอกชื่อผู้ใช้หรืออีเมล']    ${EMAIL}
    Input Password    xpath=//input[@placeholder='กรอกรหัสผ่าน']               ${PASSWORD}
    Capture Page Screenshot    03_login_filled.png
    Click Element     xpath=//button[contains(text(),'เข้าสู่ระบบ')]
    Wait Until Page Contains    เดินทางร่วมกัน    timeout=10s
    Capture Page Screenshot    04_login_success.png

Navigate To Emergency Contact Page
    [Documentation]    Step 3: เข้าหน้าผู้ติดต่อฉุกเฉิน
    ...                กดโปรไฟล์ → บัญชีของฉัน → ผู้ติดต่อฉุกเฉิน
    ...                ตรวจสอบ: แสดงตาราง มีปุ่ม "+ เพิ่มผู้ติดต่อ" และ "ประวัติการแจ้ง"
    Click Element    xpath=//*[contains(text(),'Phatcharida')]
    Wait Until Element Is Visible
    ...    xpath=//*[contains(text(),'บัญชีของฉัน')]    timeout=5s
    Capture Page Screenshot    05_profile_dropdown.png
    Click Element    xpath=//*[contains(text(),'บัญชีของฉัน')]
    Wait Until Page Contains    โปรไฟล์ของฉัน    timeout=10s
    Capture Page Screenshot    06_account_page.png
    Click Element    xpath=//*[contains(text(),'ผู้ติดต่อฉุกเฉิน')]
    Wait Until Page Contains    ผู้ติดต่อฉุกเฉิน    timeout=10s
    Wait Until Page Does Not Contain    กำลังโหลด    timeout=15s
    Wait Until Page Contains    ${TARGET_CONTACT}    timeout=10s
    Page Should Contain Element    xpath=//*[contains(text(),'เพิ่มผู้ติดต่อ')]
    Page Should Contain Element    xpath=//*[contains(text(),'ประวัติการแจ้ง')]
    Capture Page Screenshot    07_emergency_contact_page.png

Open Edit Modal For Contact
    [Documentation]    Step 4 (เริ่มต้น): กดปุ่มแก้ไข (ไอคอนดินสอ) ที่แถวของ TARGET_CONTACT
    # Scroll ตารางไปขวาสุดเพื่อให้เห็นปุ่มจัดการ
    Execute Javascript
    ...    var el = document.querySelector('div.overflow-x-auto');
    ...    if (el) { el.scrollLeft = el.scrollWidth; }
    Sleep    0.5s
    Capture Page Screenshot    08_table_scrolled_right.png
    # คลิกปุ่มแก้ไขด้วย JS เพราะชื่ออยู่ใน nested element
    Execute Javascript
    ...    var rows = document.querySelectorAll('tr');
    ...    for (var i = 0; i < rows.length; i++) {
    ...        if (rows[i].innerText.includes('${TARGET_CONTACT}')) {
    ...            var btn = rows[i].querySelector('button[title="แก้ไข"]');
    ...            if (btn) { btn.click(); break; }
    ...        }
    ...    }
    Wait Until Element Is Visible
    ...    xpath=//*[contains(text(),'แก้ไขผู้ติดต่อฉุกเฉิน')]    timeout=10s
    Capture Page Screenshot    09_edit_modal_open.png

Get Modal Input
    [Arguments]    ${index}
    [Documentation]    ดึง input ลำดับที่ ${index} ใน modal (1=ชื่อ, 2=เบอร์, 3=อีเมล)
    ${field}=    Get WebElement
    ...    xpath=(//div[contains(@class,'fixed') or contains(@class,'modal') or contains(@class,'dialog')]//input)[${index}]
    RETURN    ${field}

Get Modal Select
    [Documentation]    ดึง select (ความสัมพันธ์) ใน modal
    ${sel}=    Get WebElement
    ...    xpath=(//div[contains(@class,'fixed') or contains(@class,'modal') or contains(@class,'dialog')]//select)[1]
    RETURN    ${sel}

*** Test Cases ***
TC-EMG-07 แก้ไขผู้ติดต่อโดยไม่กรอกชื่อ ควรแสดง Error
    [Documentation]    UAT Step 4: กดแก้ไข → ลบชื่อผู้ติดต่อ → กดบันทึก
    ...                Expected: ระบบแสดงข้อความ "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    [Tags]    TC-EMG-07    negative    edit-contact

    Open Website And Verify
    Login With Valid Credentials
    Navigate To Emergency Contact Page
    Open Edit Modal For Contact

    # ลบชื่อผู้ติดต่อ (input[1]) ด้วย JS + keyboard
    ${name_field}=    Get Modal Input    1
    Clear Field With JS    ${name_field}
    Capture Page Screenshot    TC07_01_name_cleared.png

    # กดบันทึก
    Click Element    xpath=//button[contains(text(),'บันทึก')]
    Wait Until Page Contains    กรุณากรอกข้อมูลที่จำเป็นให้ครบ    timeout=5s
    Capture Page Screenshot    TC07_02_error_message.png

TC-EMG-08 แก้ไขผู้ติดต่อโดยไม่เลือกความสัมพันธ์ ควรแสดง Error
    [Documentation]    UAT Step 4: กดแก้ไข → เลือก "- เลือกความสัมพันธ์ -" → กดบันทึก
    ...                Expected: ระบบแสดงข้อความ "กรุณาใส่ความสัมพันธ์"
    [Tags]    TC-EMG-08    negative    edit-contact

    Open Website And Verify
    Login With Valid Credentials
    Navigate To Emergency Contact Page
    Open Edit Modal For Contact

    # เลือก option แรก (ค่าว่าง/placeholder) ของ dropdown ความสัมพันธ์
    ${select}=    Get Modal Select
    Select From List By Index    ${select}    0
    Capture Page Screenshot    TC08_01_relationship_cleared.png

    # กดบันทึก
    Click Element    xpath=//button[contains(text(),'บันทึก')]
    Wait Until Page Contains    กรุณาใส่ความสัมพันธ์    timeout=5s
    Capture Page Screenshot    TC08_02_error_message.png

TC-EMG-09 แก้ไขผู้ติดต่อโดยไม่กรอกเบอร์โทรศัพท์ ควรแสดง Error
    [Documentation]    UAT Step 4: กดแก้ไข → ลบเบอร์โทรศัพท์ → กดบันทึก
    ...                Expected: ระบบแสดงข้อความ "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    [Tags]    TC-EMG-09    negative    edit-contact

    Open Website And Verify
    Login With Valid Credentials
    Navigate To Emergency Contact Page
    Open Edit Modal For Contact

    # ลบเบอร์โทรศัพท์ (input[2]) ด้วย JS + keyboard
    ${phone_field}=    Get Modal Input    2
    Clear Field With JS    ${phone_field}
    Capture Page Screenshot    TC09_01_phone_cleared.png

    # กดบันทึก
    Click Element    xpath=//button[contains(text(),'บันทึก')]
    Wait Until Page Contains    กรุณากรอกข้อมูลที่จำเป็นให้ครบ    timeout=5s
    Capture Page Screenshot    TC09_02_error_message.png

TC-EMG-10 แก้ไขผู้ติดต่อโดยไม่กรอกอีเมล ควรแสดง Error
    [Documentation]    UAT Step 4: กดแก้ไข → ลบอีเมล → กดบันทึก
    ...                Expected: ระบบแสดงข้อความ "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    [Tags]    TC-EMG-10    negative    edit-contact

    Open Website And Verify
    Login With Valid Credentials
    Navigate To Emergency Contact Page
    Open Edit Modal For Contact

    # ลบอีเมล (input[3]) ด้วย JS + keyboard
    ${email_field}=    Get Modal Input    3
    Clear Field With JS    ${email_field}
    Capture Page Screenshot    TC10_01_email_cleared.png

    # กดบันทึก
    Click Element    xpath=//button[contains(text(),'บันทึก')]
    Wait Until Page Contains    กรุณากรอกข้อมูลที่จำเป็นให้ครบ    timeout=5s
    Capture Page Screenshot    TC10_02_error_message.png

TC-EMG-11 แก้ไขผู้ติดต่อโดยกรอกอีเมลผิดรูปแบบ ควรแสดง Error
    [Documentation]    UAT Step 4: กดแก้ไข → กรอกอีเมล = "pha.k" → กดบันทึก
    ...                Expected: ระบบแสดงข้อความ "กรุณาใส่อีเมลที่ถูกต้อง"
    [Tags]    TC-EMG-11    negative    edit-contact    email-validation

    Open Website And Verify
    Login With Valid Credentials
    Navigate To Emergency Contact Page
    Open Edit Modal For Contact

    # แก้ไขอีเมลเป็นรูปแบบผิด (input[3])
    ${email_field}=    Get Modal Input    3
    Clear Field With JS    ${email_field}
    Input Text              ${email_field}    pha.k
    Capture Page Screenshot    TC11_01_invalid_email_filled.png

    # กดบันทึก
    Click Element    xpath=//button[contains(text(),'บันทึก')]
    Wait Until Page Contains    กรุณาใส่อีเมลที่ถูกต้อง    timeout=5s
    Capture Page Screenshot    TC11_02_error_message.png
