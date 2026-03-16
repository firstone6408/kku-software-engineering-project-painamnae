*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        https://csse4269.cpkku.com/
${BROWSER}    Chrome
${EMAIL}      admin@gmail.com
${PASSWORD}   123456789
${DETAIL}     ไม่มีหลักฐานประกอบที่แนบมา ทำให้ข้อมูลไม่เพียงพอต่อการดำเนินการ

*** Test Cases ***
TC-001 เปิดเว็บไซต์และตรวจสอบหน้า    
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot

TC-002 เข้าสู่ระบบสำเร็จ
     Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot

    Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot

TC-003 เข้าไปที่หน้า Dashboard
    Wait Until Element Is Visible    xpath=//*[text()='System']    10s
    Mouse Over    xpath=//*[text()='System']
        Capture Page Screenshot

    Click Element    xpath=//*[contains(text(),'Dashboard')]
        Capture Page Screenshot
    Wait Until Page Contains    ผู้ใช้    10s
    Wait Until Element Is Visible    xpath=//img
        Capture Page Screenshot

TC-004 การจัดการ Report
    Wait Until Element Is Visible    xpath=//a[contains(.,'Report Management')]    10s
    Click Element    xpath=//a[contains(.,'Report Management')]
    Wait Until Location Contains    report    10s
    Wait Until Page Contains        ผู้แจ้ง    20s
    Wait Until Element Is Visible   xpath=//table    10s
        Capture Page Screenshot

    Wait Until Page Contains    ผู้แจ้ง    20s

    Wait Until Element Is Visible    xpath=//tr[.//*[contains(text(),'รอตรวจสอบ')]]    20s
    Scroll Element Into View    xpath=//tr[.//*[contains(text(),'รอตรวจสอบ')]]

    Click Element    xpath=//tr[.//*[contains(text(),'รอตรวจสอบ')]]//i[contains(@class,'eye')]

    Wait Until Page Contains    วันเดินทาง    10s
    Capture Page Screenshot

TC-005 อัปเดตสถานะ และแสดงผลลัพธ์
    Wait Until Element Is Visible    xpath=//select    10s
    Select From List By Label        xpath=//select    ปฏิเสธ
        Capture Page Screenshot

    Wait Until Page Contains    เหตุผลการปฏิเสธ (ไม่บังคับ)    10s
    Wait Until Element Is Visible    xpath=//textarea    10s
    Input Text    xpath=//textarea    ${DETAIL}
    Capture Page Screenshot

    Click Element    xpath=//button[contains(.,'บันทึกและส่งแจ้งเตือน')]
        Capture Page Screenshot
    
    Wait Until Element Is Visible    xpath=//button[contains(.,'ยืนยัน')]    10s
    Click Element    xpath=//button[contains(.,'ยืนยัน')]
        Capture Page Screenshot
    
    Wait For Condition    return document.readyState == "complete"

    
    Wait Until Page Contains    รายละเอียดการรายงาน    10s
    Wait Until Page Contains    สำเร็จ    10s
    Wait Until Page Contains    ปฏิเสธ Report แล้ว และส่งแจ้งเตือนผู้แจ้งเรียบร้อย    10s
    Wait Until Page Contains    Report นี้ถูกปฏิเสธแล้ว    10s

    Capture Page Screenshot
   

    Sleep    10s