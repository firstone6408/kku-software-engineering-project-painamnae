*** Settings ***
Library    SeleniumLibrary

Suite Setup       Open Website
Suite Teardown    Close Browser


*** Variables ***
${URL}        https://cs-se42-68.cpkku.com
${BROWSER}    Chrome
${EMAIL}      preeya.k@gmail.com
${PASSWORD}   Preeya20242024


*** Keywords ***
Open Website
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains    เข้าสู่ระบบ    15s
    Capture Page Screenshot    


Login
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s

    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Capture Page Screenshot    

    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
    Capture Page Screenshot    

    Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]
    Capture Page Screenshot    

    Wait Until Page Contains    การเดินทางทั้งหมด    15s
    Capture Page Screenshot    


Go To Report Page
    Click Element    xpath=//a[contains(.,'การเดินทางทั้งหมด')]
    Capture Page Screenshot    

    Wait Until Element Is Visible    xpath=//button[contains(.,'ยืนยันแล้ว')]    15s
    Click Element    xpath=//button[contains(.,'ยืนยันแล้ว')]
    Capture Page Screenshot    

    Wait Until Element Is Visible    xpath=//a[contains(.,'จัดการเส้นทาง')]    15s
    Click Element    xpath=//a[contains(.,'จัดการเส้นทาง')]
    Capture Page Screenshot    

    Wait Until Element Is Visible    xpath=//button[contains(.,'ยืนยันแล้ว')]    15s
    Click Element    xpath=//button[contains(.,'ยืนยันแล้ว')]
    Capture Page Screenshot    

    Wait Until Element Is Visible    xpath=//button[contains(.,'รายงาน')]    15s
    Click Element    xpath=//button[contains(.,'รายงาน')]
    Capture Page Screenshot    

    Wait Until Page Contains    ส่ง Report    15s
    Capture Page Screenshot    


Submit Empty Report
    Wait Until Element Is Visible    xpath=//button[contains(.,'ส่ง Report')]    15s

    Capture Page Screenshot    

    Click Element    xpath=//button[contains(.,'ส่ง Report')]

    Sleep    2s

    Capture Page Screenshot    


Verify Warning Message
    Wait Until Page Contains    ให้เลือกหัวข้อที่จะรายงานก่อนกดส่ง    10s
    Capture Page Screenshot    


Verify Report Not Submitted
    Page Should Not Contain    รอดำเนินการ
    Capture Page Screenshot    



*** Test Cases ***
TC-003 Submit Empty Report Should Show Warning
    Login
    Go To Report Page
    Submit Empty Report
    Verify Warning Message
    Verify Report Not Submitted
