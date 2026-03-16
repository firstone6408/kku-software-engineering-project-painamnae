*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        https://csse4269.cpkku.com/
${BROWSER}    Chrome
${EMAIL}      preeya.k@gmail.com
${PASSWORD}   Preeya20242024

*** Test Cases ***
TC-001 เปิดเว็บไซต์และLogin 
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot

TC-002 Loginสำเร็จ
     Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot

    Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]
    Wait Until Element Is Visible    xpath=//*[text()='ปรียา']    10s
    
        Capture Page Screenshot
   

TC-003 ตรวจสอบการแจ้งเตือนหลังอัปเดตสถานะ
        Sleep    3s
    Wait Until Element Is Visible    xpath=//button[.//*[name()='svg']]    15s
    Click Element    xpath=//button[.//*[name()='svg']]

    Wait Until Page Contains    Notification    10s
    Wait Until Page Contains    Report ของคุณถูกปฏิเสธ    10s
    Wait Until Page Contains    รายงานเหตุการณ์ของคุณถูกปฏิเสธโดยผู้ดูแลระบบ    10s
    Wait Until Page Contains   เหตุผล: ไม่มีหลักฐานประกอบที่แนบมา ทำให้ข้อมูลไม่เพียงพอต่อการดำเนินการ    10s
        Capture Page Screenshot 
    sleep   10s