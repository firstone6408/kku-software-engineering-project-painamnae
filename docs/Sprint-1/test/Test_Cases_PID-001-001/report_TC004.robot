*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        https://cs-se42-68.cpkku.com
${BROWSER}    Chrome
${EMAIL}      preeya.k@gmail.com
${PASSWORD}   Preeya20242024

*** Test Cases ***
TC-001 Report Incident Multiple Problems
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

    # 7 กด รายงาน
    Wait Until Element Is Visible    xpath=//button[contains(.,'รายงาน')]    15s
    Click Element    xpath=//button[contains(.,'รายงาน')]
        Capture Page Screenshot

    # 8 เลือกปัญหาทั้งหมด
    Wait Until Element Is Visible    xpath=//label[contains(.,'เกิดอุบัติเหตุ')]    15s
    Click Element    xpath=//label[contains(.,'เกิดอุบัติเหตุ')]
        Capture Page Screenshot

    # 9 ส่ง Report
    Click Element    xpath=//button[contains(.,'ส่ง Report')]
        Capture Page Screenshot

    # 10 ตรวจสอบผลลัพธ์
    Wait Until Page Contains    ส่ง Report สำเร็จ    10s
    Wait Until Page Contains    เราจะดำเนินการตรวจสอบให้เร็วที่สุด    10s
    Wait Until Page Contains    รอดำเนินการ    10s

        Capture Page Screenshot

    # 11 ปิดเว็บไซต์
    #Close Browser
