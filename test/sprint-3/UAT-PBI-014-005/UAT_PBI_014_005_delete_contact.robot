*** Settings ***
Library           SeleniumLibrary
Suite Setup       Set Selenium Speed    0.5 seconds
Test Teardown     Close Browser

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
TC-EMG-13 Notify Location to 1 Emergency Contact
    [Documentation]    Test Scenario: UAT-PBI-014-006 - ทดสอบผู้โดยสารแจ้งตำแหน่งผู้ติดต่อ 1 คน สำเร็จ
    Step 1: Open Website
    Step 2: Login to System
    Step 3: Click Notify Location Button
    Step 4: Select 1 Emergency Contact And Duration
    Step 5: Submit And Verify Notification Status

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
    # เปลี่ยนมาใช้ @href='/login' เพื่อให้หาเจอง่ายและแม่นยำที่สุด
    Wait Until Element Is Visible    xpath=//a[@href='/login']    timeout=10s
    Click Element    xpath=//a[@href='/login']
    
    # รอจนกว่าช่องกรอกชื่อผู้ใช้จะขึ้นมา
    Wait Until Element Is Visible    id=identifier    timeout=10s
    Input Text       id=identifier    ${USERNAME}
    Input Password   id=password      ${PASSWORD}
    Capture Page Screenshot     ${TEST NAME}_02_before_login.png
    
    # เจาะจงกดปุ่ม submit ที่อยู่ในฟอร์ม login
    Click Button     xpath=//form[@id='loginForm']//button[@type='submit']
    
    # รอให้ล็อกอินเสร็จ (รอจนกว่าชื่อผู้ใช้จะแสดงบน Nav bar หรือเช็คข้อความ)
    Wait Until Element Is Visible    xpath=//span[contains(text(), 'Phatcharida')]    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_03_after_login_success.png

Step 3: Click Notify Location Button
    # ปุ่มแจ้งตำแหน่ง
    Wait Until Element Is Visible    xpath=//span[text()='แจ้งตำแหน่ง']/..    timeout=10s
    Click Element    xpath=//span[text()='แจ้งตำแหน่ง']/..
    
    Wait Until Page Contains    เลือกผู้ติดต่อ    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_04_notify_modal.png

Step 4: Select 1 Emergency Contact And Duration
    # เลือกผู้ติดต่อ 1 คน
    ${locator}=    Set Variable    xpath=//p[text()='${CONTACT_1}']/ancestor::label
    Wait Until Element Is Visible    ${locator}    timeout=10s
    Scroll Element Into View         ${locator}
    Click Element                    ${locator}
    
    # เลือกระยะเวลา (ใช้ 15 นาที ตาม <option> text ใน HTML)
    ${select_locator}=    Set Variable    xpath=//label[text()='ระยะเวลาการแจ้งตำแหน่ง']/following-sibling::select
    Wait Until Element Is Visible    ${select_locator}    timeout=10s
    Select From List By Label        ${select_locator}    ${DURATION}
    
    Capture Page Screenshot     ${TEST NAME}_05_selected_contact_and_duration.png

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

    Wait Until Element Is Enabled    ${submit_btn}    timeout=10s
    Click Button    ${submit_btn}
    
    # (ใน HTML มี <span class="absolute w-2 h-2 bg-red-500 rounded-full..."> ขึ้นมาที่ปุ่มกระดิ่ง)
    Wait Until Element Is Visible    xpath=//span[contains(@class, 'bg-red-500')]    timeout=10s
    Capture Page Screenshot     ${TEST NAME}_06_after_submit_success.png