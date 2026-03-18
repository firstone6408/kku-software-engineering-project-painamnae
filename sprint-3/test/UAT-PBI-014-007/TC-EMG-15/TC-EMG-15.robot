*** Settings ***
Library         SeleniumLibrary
Suite Setup     Set Selenium Speed    0.5 seconds
Test Teardown   Close Browser

*** Variables ***
${URL}              https://csse4269.cpkku.com/
${BROWSER}          chrome
${USERNAME}         phatcharida.f@kkumail.com
${PASSWORD}         Ma123456789
${CONTACT_1}        พัชริดา เฟื่องอารมย์
${CONTACT_2_1}      กิตติญา ภาผล
${CONTACT_2_2}      วัฒนพงศ์ วิชาโคตร
${DURATION}         15 นาที

*** Test Cases ***
TC-EMG-15 Stop Notifying Location (1 Emergency Contact)
    [Documentation]    Test Scenario: UAT-PBI-014-007 - ผู้โดยสารหยุดแจ้งตำแหน่ง กรณีเลือกผู้ติดต่อ 1 คน
    Step 1: Open Website
    Step 2: Login to System
    Step 3.1: Setup Pre-requisite - Start Notifying 1 Contact
    Step 4: Stop Notification And Verify Result

*** Keywords ***
Step 1: Open Website
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains    ไปนำแหน่    timeout=15s
    Capture Page Screenshot     ${TEST NAME}_01_homepage.png

Step 2: Login to System
    Click Element    xpath=//a[contains(text(), 'เข้าสู่ระบบ')]
    Wait Until Element Is Visible    id=identifier    timeout=10s
    Input Text       id=identifier    ${USERNAME}
    Input Password   id=password      ${PASSWORD}
    Click Button     xpath=//button[@type='submit' and contains(text(), 'เข้าสู่ระบบ')]
    Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ    timeout=10s

Step 3.1: Setup Pre-requisite - Start Notifying 1 Contact
    [Documentation]    ขั้นตอนนี้จำลองจาก UAT-PBI-014-006
    Wait Until Element Is Visible    xpath=//span[text()='แจ้งตำแหน่ง']/..    timeout=15s
    Click Element    xpath=//span[text()='แจ้งตำแหน่ง']/..
    Wait Until Page Contains    เลือกผู้ติดต่อ    timeout=10s
    
    # เลือกผู้ติดต่อ 1 คน
    ${locator}=    Set Variable    xpath=//p[text()='${CONTACT_1}']/ancestor::label
    Wait Until Element Is Visible    ${locator}    timeout=10s
    Click Element    ${locator}
    
    # เลือกระยะเวลา
    Select From List By Label    xpath=//label[text()='ระยะเวลาการแจ้งตำแหน่ง']/following-sibling::select    ${DURATION}
    
    # กดส่ง
    Click Button    xpath=//button[text()='ส่งและเริ่มแจ้งตำแหน่ง']
    Wait Until Element Is Visible    xpath=//span[text()='กำลังแจ้งตำแหน่ง']    timeout=10s

Step 4: Stop Notification And Verify Result
    # 1. คลิกปุ่มกำลังแจ้งตำแหน่ง (ปุ่มสีแดง)
    ${sharing_btn}=    Set Variable    xpath=//span[text()='กำลังแจ้งตำแหน่ง']/ancestor::button
    Wait Until Element Is Visible    ${sharing_btn}    timeout=10s
    Click Element    ${sharing_btn}
    
    # 2. คลิกปุ่มหยุดการแจ้งตำแหน่ง (ใน Modal)
    ${stop_btn}=    Set Variable    xpath=//button[contains(@class, 'bg-red-600') and text()='หยุดการแจ้งตำแหน่ง']
    Wait Until Element Is Visible    ${stop_btn}    timeout=10s
    Click Button    ${stop_btn}
    
    # 3. ตรวจสอบว่าปุ่มเปลี่ยนกลับเป็นแจ้งตำแหน่ง (สีดำ/ปกติ)
    Wait Until Page Contains    แจ้งตำแหน่ง    timeout=10s
    ${normal_btn}=    Set Variable    xpath=//span[text()='แจ้งตำแหน่ง']/ancestor::button
    ${classes}=    Get Element Attribute    ${normal_btn}    class
    Should Not Contain    ${classes}    text-red-600
    Capture Page Screenshot    ${TEST NAME}_final_result.png