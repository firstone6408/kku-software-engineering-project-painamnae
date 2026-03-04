*** Settings ***
Library    SeleniumLibrary
Suite Teardown    Close Browser
Test Teardown    Capture Page Screenshot

*** Variables ***
${URL}        https://csse4269.cpkku.com/
${BROWSER}    chrome
${EMAIL}      preeya.k@gmail.com
${PASSWORD}   Preeya20242024

*** Test Cases ***
TC008
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    
    Capture Page Screenshot
     # 0 เข้าสู่ระบบ
     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot


    # 1-2 Login
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot

    Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot

    # 3 กด การเดินทางทั้งหมด
    Wait Until Element Is Visible    xpath=//a[contains(.,'การเดินทางทั้งหมด')]    15s
    Click Element    xpath=//a[contains(.,'การเดินทางทั้งหมด')]
        Capture Page Screenshot

    # 4 กด ยืนยันแล้ว
    Wait Until Element Is Visible    xpath=//button[contains(.,'ยืนยันแล้ว')]    15s
    Click Element    xpath=//button[contains(.,'ยืนยันแล้ว')]
        Capture Page Screenshot

    # 5 กด จัดการเส้นทาง
    Wait Until Element Is Visible    xpath=//a[contains(.,'จัดการเส้นทาง')]    15s
    Click Element    xpath=//a[contains(.,'จัดการเส้นทาง')]
        Capture Page Screenshot

    # 6 กด ยืนยันแล้ว
    Wait Until Element Is Visible    xpath=//button[contains(.,'ยืนยันแล้ว')]    15s
    Click Element    xpath=//button[contains(.,'ยืนยันแล้ว')]
        Capture Page Screenshot

    # 7 เลื่อนลงไปกดปุ่ม "รอดำเนินการ" ตัวล่างสุด
    Execute Javascript    window.scrollTo(0, document.body.scrollHeight)
    Sleep    2s

    Scroll Element Into View    xpath=(//button[contains(.,'รอดำเนินการ')])[last()]
    Click Element    xpath=(//button[contains(.,'รอดำเนินการ')])[last()]
        Capture Page Screenshot


    # 8 ตรวจสอบข้อความ
    Wait Until Page Contains    แก้ไข Report เหตุการณ์    20s
    Page Should Contain    แก้ไข Report เหตุการณ์
    Page Should Contain    รอดำเนินการ — ผู้ดูแลกำลังตรวจสอบ คุณสามารถแก้ไข Report ได้
    Capture Page Screenshot


    # 9 
    Wait Until Element Is Visible    xpath=//label[contains(.,'เกิดอุบัติเหตุ')]    15s
    Click Element    xpath=//label[contains(.,'เกิดอุบัติเหตุ')]
    Click Element    xpath=//label[contains(.,'ผู้โดยสารก่อกวน')]
    Capture Page Screenshot

    Click Element    xpath=//a[contains(.,'[บันทึกการแก้ไข]')]
        Capture Page Screenshot

    # 9 ปิดเว็บไซต์
    Close Browser