*** Settings ***
Library           SeleniumLibrary
Suite Setup       Set Selenium Speed    0.5 seconds
Test Teardown     Close Browser

*** Variables ***
${URL}              https://csse4269.cpkku.com/
${BROWSER}          chrome
${USERNAME}         phatcharida.f@kkumail.com
${PASSWORD}         Ma123456789
${CONTACT_2_1}      กิตติญา ภาผล
${CONTACT_2_2}      วัฒนพงศ์ วิชาโคตร
${DURATION}         15 นาที

*** Test Cases ***
TC-EMG-14 Notify Location to 2 Emergency Contacts
    [Documentation]    Test Scenario: UAT-PBI-014-006 - ทดสอบผู้โดยสารแจ้งตำแหน่งผู้ติดต่อ 2 คน สำเร็จ
    Step 1: Open Website
    Step 2: Login to System
    Step 3: Click Notify Location Button
    Step 4: Select 2 Emergency Contacts And Duration
    Step 5: Submit And Verify Notification Status

*** Keywords ***
Step 1: Open Website
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains    ไปนำแหน่    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_01_homepage.png

Step 2: Login to System
    Click Element    xpath=//a[contains(text(), 'เข้าสู่ระบบ')]
    Wait Until Element Is Visible    id=identifier    timeout=10s
    
    Input Text       id=identifier    ${USERNAME}
    Input Password   id=password      ${PASSWORD}
    Capture Page Screenshot     ${TEST NAME}_02_before_login.png
    
    Click Button     xpath=//button[@type='submit' and contains(text(), 'เข้าสู่ระบบ')]
    Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_03_after_login_success.png

Step 3: Click Notify Location Button
    Wait Until Element Is Visible    xpath=//span[text()='แจ้งตำแหน่ง']/..    timeout=10s
    Click Element    xpath=//span[text()='แจ้งตำแหน่ง']/..
    
    Wait Until Page Contains    เลือกผู้ติดต่อ    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_04_notify_modal.png


Step 4: Select 2 Emergency Contacts And Duration
    # เลือกผู้ติดต่อคนที่ 1
    ${locator_1}=    Set Variable    xpath=//p[text()='${CONTACT_2_1}']/ancestor::label
    Wait Until Element Is Visible    ${locator_1}    timeout=10s
    Scroll Element Into View         ${locator_1}
    Click Element                    ${locator_1}

    # เลือกผู้ติดต่อคนที่ 2
    ${locator_2}=    Set Variable    xpath=//p[text()='${CONTACT_2_2}']/ancestor::label
    Wait Until Element Is Visible    ${locator_2}    timeout=10s
    Scroll Element Into View         ${locator_2}
    Click Element                    ${locator_2}
    
    # เลือกระยะเวลา
    ${select_locator}=    Set Variable    xpath=//label[text()='ระยะเวลาการแจ้งตำแหน่ง']/following-sibling::select
    Wait Until Element Is Visible    ${select_locator}    timeout=10s
    Select From List By Label        ${select_locator}    ${DURATION}
    
    Capture Page Screenshot     ${TEST NAME}_05_selected_contacts_and_duration.png

Step 5: Submit And Verify Notification Status
    ${submit_btn}=    Set Variable    xpath=//button[text()='ส่งและเริ่มแจ้งตำแหน่ง']
    
    # รอจนกว่าปุ่มจะหายจากสถานะ disabled (หลังจากเลือกผู้ติดต่อครบ)
    Wait Until Element Is Enabled    ${submit_btn}    timeout=10s
    Click Button    ${submit_btn}
    
    # Check Result 1: ตรวจสอบว่าข้อความเปลี่ยนเป็น "กำลังแจ้งตำแหน่ง"
    Wait Until Element Is Visible    xpath=//span[text()='กำลังแจ้งตำแหน่ง']    timeout=10s
    
    # Check Result 2: ตรวจสอบว่าปุ่มเปลี่ยนเป็นสีแดง (ใช้ class bg-red-50 หรือ text-red-600)
    Wait Until Element Is Visible    xpath=//button[contains(@class, 'text-red-600')]    timeout=5s
    
    # Check Result 3: ตรวจสอบว่ามีจุดแจ้งเตือนสีแดง (Notification Dot) ขึ้นมา
    Wait Until Element Is Visible    xpath=//span[contains(@class, 'bg-red-500')]    timeout=5s
    
    Capture Page Screenshot     ${TEST NAME}_06_after_submit_success.png