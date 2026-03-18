*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        https://csse4269.cpkku.com/
${BROWSER}    Chrome
${EMAIL}      phatcharida.f@kkumail.com
${PASSWORD}   Ma123456789

*** Test Cases ***
TC-EMG-003 Edit Contact Name Success
    # 0 เปิดหน้าเว็ป
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     # 1 เข้าสู่ระบบ
     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot
     # 2 Login
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot
        Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]

    # 3 Go To Emergency Contact Page
     Wait Until Element Is Visible    xpath=//span[contains(text(),'Phatcharida')]    15s
    Click Element    xpath=//span[contains(text(),'Phatcharida')]
        Capture Page Screenshot

    Wait Until Element Is Visible    xpath=//a[contains(.,'บัญชีของฉัน')]    10s
    Click Element    xpath=//a[contains(.,'บัญชีของฉัน')]
        Capture Page Screenshot
     Wait Until Element Is Visible    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]    10s
    Click Element    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]
        
     Wait Until Page Contains    ผู้ติดต่อฉุกเฉิน    15s

    # 4 แก้ไขข้อมูลผู้ติดต่อ
    # เลื่อนตารางไปขวาสุด (แนวนอน)
    Execute Javascript    var el = document.querySelector('div.overflow-x-auto'); if (el) { el.scrollLeft = el.scrollWidth; }
        Capture Page Screenshot

    Sleep    1s

     # กดแก้ไข (ไอคอนดินสอของแถว "เกศา")
    Click Element    xpath=//*[contains(text(),'เกศา กฤติขจร')]/ancestor::tr//button[2]
        Capture Page Screenshot
    

    # แก้ไขชื่อผู้ติดต่อ
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'ชื่อ')]    10s
    Clear Element Text               xpath=//input[contains(@placeholder,'ชื่อ')]
    Input Text                       xpath=//input[contains(@placeholder,'ชื่อ')]    เกศรา กฤติขจร
        Capture Page Screenshot
    

    # กดปุ่มบันทึก
    Wait Until Element Is Visible    xpath=//button[contains(.,'บันทึก')]    10s
    Click Element                    xpath=//button[contains(.,'บันทึก')]
        Capture Page Screenshot
    


    # ตรวจสอบผลลัพธ์
    Wait Until Page Contains    แก้ไขผู้ติดต่อสำเร็จ    15s
    Wait Until Page Contains    เกศรา กฤติขจร    15s
    Page Should Contain         เกศรา กฤติขจร
        Capture Page Screenshot


    Close Browser


TC-EMG-004 Edit Relationship
 # 0 เปิดหน้าเว็ป
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     # 1 เข้าสู่ระบบ
     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot
     # 2 Login
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot
        Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]

    # 3 Go To Emergency Contact Page
     Wait Until Element Is Visible    xpath=//span[contains(text(),'Phatcharida')]    15s
    Click Element    xpath=//span[contains(text(),'Phatcharida')]
        Capture Page Screenshot

    Wait Until Element Is Visible    xpath=//a[contains(.,'บัญชีของฉัน')]    10s
    Click Element    xpath=//a[contains(.,'บัญชีของฉัน')]
        Capture Page Screenshot
     Wait Until Element Is Visible    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]    10s
    Click Element    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]
        Capture Page Screenshot
     Wait Until Page Contains    ผู้ติดต่อฉุกเฉิน    15s

    # 4 แก้ไขข้อมูลผู้ติดต่อ
    # เลื่อนตารางไปขวาสุด (แนวนอน)
    Execute Javascript    var el = document.querySelector('div.overflow-x-auto'); if (el) { el.scrollLeft = el.scrollWidth; }
        Capture Page Screenshot

    Sleep    1s

    
    
    # กดแก้ไข (ไอคอนดินสอของแถว "พิมพ์อักษร")
    Click Element    xpath=//*[contains(text(),'พิมพ์อักษร สารถ')]/ancestor::tr//button[2]
        Capture Page Screenshot

    # เปิด dropdown
    Click Element    xpath=//label[contains(text(),'ความสัมพันธ์')]/following::*[1]

    # รอ dropdown โผล่
    Wait Until Element Is Visible    xpath=//*[text()='น้อง']    10s

    # เลือก "น้อง" จาก dropdown ใต้คำว่า ความสัมพันธ์
    Wait Until Element Is Visible    xpath=//label[contains(text(),'ความสัมพันธ์')]/following::select[1]    10s
    Select From List By Label        xpath=//label[contains(text(),'ความสัมพันธ์')]/following::select[1]    น้อง
        Capture Page Screenshot


    # กดปุ่มบันทึก
    Wait Until Element Is Visible    xpath=//button[contains(.,'บันทึก')]    10s
    Click Element                    xpath=//button[contains(.,'บันทึก')]
        Capture Page Screenshot
    
    # ตรวจสอบผลลัพธ์
    Wait Until Page Contains    แก้ไขผู้ติดต่อสำเร็จ    15s
    Wait Until Page Contains    พิมพ์อักษร สารถ    15s
    Page Should Contain         พิมพ์อักษร สารถ
        Capture Page Screenshot

    Close Browser

    
*** Test Cases ***
TC-EMG-005 Edit PhoneNumber
    # 0 เปิดหน้าเว็ป
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     # 1 เข้าสู่ระบบ
     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot
     # 2 Login
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot
        Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]

    # 3 Go To Emergency Contact Page
     Wait Until Element Is Visible    xpath=//span[contains(text(),'Phatcharida')]    15s
    Click Element    xpath=//span[contains(text(),'Phatcharida')]
        Capture Page Screenshot

    Wait Until Element Is Visible    xpath=//a[contains(.,'บัญชีของฉัน')]    10s
    Click Element    xpath=//a[contains(.,'บัญชีของฉัน')]
        Capture Page Screenshot
     Wait Until Element Is Visible    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]    10s
    Click Element    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]
        Capture Page Screenshot
     Wait Until Page Contains    ผู้ติดต่อฉุกเฉิน    15s

    # 4 แก้ไขข้อมูลผู้ติดต่อ
    # เลื่อนตารางไปขวาสุด (แนวนอน)
    Execute Javascript    var el = document.querySelector('div.overflow-x-auto'); if (el) { el.scrollLeft = el.scrollWidth; }
        Capture Page Screenshot

    Sleep    1s

    
    
    # กดแก้ไข (ไอคอนดินสอของแถว "รินดา")
    Click Element    xpath=//*[contains(text(),'รินดา พวงนาถ')]/ancestor::tr//button[2]
        Capture Page Screenshot

    # แก้ไขเบอร์โทร
    Wait Until Element Is Visible    xpath=//input[@type='tel']    10s
    Clear Element Text               xpath=//input[@type='tel']
    Input Text                       xpath=//input[@type='tel']    0653245560
        Capture Page Screenshot

    

    # กดปุ่มบันทึก
    Wait Until Element Is Visible    xpath=//button[contains(.,'บันทึก')]    10s
    Click Element                    xpath=//button[contains(.,'บันทึก')]
        Capture Page Screenshot
    


    # ตรวจสอบผลลัพธ์
    Wait Until Page Contains    แก้ไขผู้ติดต่อสำเร็จ    10s
    Wait Until Page Contains    0653245560    15s
    Page Should Contain         0653245560
        Capture Page Screenshot

    Close Browser

TC-EMG-006 Edit Email
 # 0 เปิดหน้าเว็ป
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Capture Page Screenshot

     # 1 เข้าสู่ระบบ
     Wait Until Page Contains    เข้าสู่ระบบ    10s
    Click Element    xpath=//a[contains(.,'เข้าสู่ระบบ')]
        Capture Page Screenshot
     # 2 Login
    Wait Until Element Is Visible    xpath=//input[contains(@placeholder,'อีเมล')]    15s
    Input Text    xpath=//input[contains(@placeholder,'อีเมล')]    ${EMAIL}
    Input Text    xpath=//input[contains(@placeholder,'รหัสผ่าน')]    ${PASSWORD}
        Capture Page Screenshot
        Click Element    xpath=//button[contains(.,'เข้าสู่ระบบ')]

    # 3 Go To Emergency Contact Page
     Wait Until Element Is Visible    xpath=//span[contains(text(),'Phatcharida')]    15s
    Click Element    xpath=//span[contains(text(),'Phatcharida')]
        Capture Page Screenshot

    Wait Until Element Is Visible    xpath=//a[contains(.,'บัญชีของฉัน')]    10s
    Click Element    xpath=//a[contains(.,'บัญชีของฉัน')]
        Capture Page Screenshot
     Wait Until Element Is Visible    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]    10s
    Click Element    xpath=//a[contains(.,'ผู้ติดต่อฉุกเฉิน')]
        Capture Page Screenshot
     Wait Until Page Contains    ผู้ติดต่อฉุกเฉิน    15s

    # 4 แก้ไขข้อมูลผู้ติดต่อ
    # เลื่อนตารางไปขวาสุด (แนวนอน)
    Execute Javascript    var el = document.querySelector('div.overflow-x-auto'); if (el) { el.scrollLeft = el.scrollWidth; }
        Capture Page Screenshot

    Sleep    1s

    
    
    # กดแก้ไข (ไอคอนดินสอของแถว "สมศรี")
    Click Element    xpath=//*[contains(text(),'สมศรี ดวงตา')]/ancestor::tr//button[2]
        Capture Page Screenshot

   # แก้ไขอีเมล
    Wait Until Element Is Visible    xpath=//input[@type='email']    10s
    Clear Element Text               xpath=//input[@type='email']
    Input Text                       xpath=//input[@type='email']    sisi.d@gmail.com
        Capture Page Screenshot

    # กดปุ่มบันทึก
    Wait Until Element Is Visible    xpath=//button[contains(.,'บันทึก')]    10s
    Click Element                    xpath=//button[contains(.,'บันทึก')]
        Capture Page Screenshot
    


    # ตรวจสอบผลลัพธ์
    Wait Until Page Contains    แก้ไขผู้ติดต่อสำเร็จ    10s
    Wait Until Page Contains    สมศรี ดวงตา    15s
    Page Should Contain         สมศรี ดวงตา
        Capture Page Screenshot
    Sleep    10s
    Close Browser
    