*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        https://csse4269.cpkku.com/
${BROWSER}    chrome
${EMAIL}   preeya.k@gmail.com
${PASSWORD}   Preeya20242024
${TXT_FILE}   ${CURDIR}/test.txt

*** Test Cases ***
TC005 
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

       # 8 เลือกปัญหา อื่นๆ
    Wait Until Element Is Visible    xpath=//label[contains(.,'อื่นๆ')]    15s
    Click Element    xpath=//label[contains(.,'อื่นๆ')]
    Capture Page Screenshot

    # 9 กดส่ง Report
    Click Element    xpath=//button[contains(.,'ส่ง Report')]
    Capture Page Screenshot

    # 10 ต้องขึ้น Validation และต้องไม่มีคำว่า รอดำเนินการ
    Wait Until Page Contains    กรุณาระบุรายละเอียดเพิ่มเติม    10s
    Page Should Contain    กรุณาระบุรายละเอียดเพิ่มเติม
    Page Should Not Contain    รอดำเนินการ

    Close Browser

    Close Browser