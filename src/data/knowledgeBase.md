# WEX Contact Change Management — Knowledge Base

> **Standard Operating Procedure** · CS-Company Profile & CS-Solution Analyst Teams · Post-Implementation (Plan Setup Complete)

---

## 1. Process Overview

This SOP governs how contact information is managed across WEX's systems when an existing client's contacts need to be added, changed, or removed. Because WEX's systems do not automatically sync contact data, each change must be manually replicated across all applicable systems in a specific sequence.

### 1.1 System Sequence

All contact changes must follow this order. Completing OnBase Unity first enables efficiency in establishing COBRA SSO.

| Order | System | Purpose |
|-------|--------|---------|
| 1 | OnBase Unity | Internal CRM and system of record. All other systems must match this. |
| 2 | Benefits Administration Portal | Benefits enrollment, file feeds, reports, and portal access management. |
| 3 | COBRA Administration Portal | COBRA continuation coverage management, qualified beneficiaries, payments. |
| 3a | LEAP (SSO Setup) | Link COBRA portal access back to LEAP for single sign-on. |
| 4 | Relius | Plan document contact management. Only if contact has Plan Document role. |

### 1.2 Contact Types

| Type | Description | Key Differences |
|------|-------------|-----------------|
| Client Contact | Employees at the employer company (HR staff, payroll, finance). | Typically associated with one client. Roles: Primary, Billing, ACH, File, Portal Access, Plan Document Contact, COBRA Remittance. |
| Consultant Contact | External advisors at benefits consulting or brokerage firms. | May service multiple clients (one-to-many). Only get portal access upon request. Linked to a Consulting Office. CSM notification may be required. |
| Aptia Contact | Mercer Marketplace / Aptia partner contacts. | Require Aptia365 WEX Health Access Request Form signed by authorized approver. Role on form determines access level. |
| Divisional Contact | Contact restricted to specific divisions within a client account. | Cannot have Primary role. Do not get SSO. Receive manual login credentials via email. |

### Document Information

| Field | Details |
|-------|---------|
| Version | 1.0 |
| Scope | All existing client contact changes processed by CS-Company Profile and CS-Solution Analyst teams |
| Systems Covered | OnBase Unity, Benefits Administration Portal, COBRA Administration Portal, LEAP, Relius |
| HIPAA Classification | Contains procedures for managing access to Protected Health Information (PHI) |
| Review Cadence | Manager reviews 5 completed cases + LEAP forms per analyst per week; monthly quality assessment |

---

## 2. Intake and Routing

The first step is to determine how the request arrived and what type of contact is involved. This determines which workflow to follow.

### 2.1 Intake Paths

| Intake Path | Source | Where It Appears | First Action |
|-------------|--------|------------------|--------------|
| LEAP — Client Contact Change | Client made change in LEAP self-service portal | LEAP Contact Change queue in OnBase Unity | Work the queue item |
| LEAP — Consultant Contact Change | Client made consultant change in LEAP | LEAP Consultant Change queue in OnBase Unity | Work the queue item |
| Client Contact Change Form | Client or internal team submitted form | Case in OnBase Unity with form attached | Review completed form |
| Consultant/Broker Access Change Form | Consultant or broker submitted form | Case in OnBase Unity with form attached | Review completed form |
| Aptia365 WEX Health Access Request Form | Aptia authorized approver submitted form | Case in OnBase Unity with form attached | Review form and determine role |
| Email Request | Client or consultant emailed the request | Case in OnBase Unity | Review email and confirm all info is available |

### 2.2 Aptia Role Routing

When a request comes via the Aptia365 Access Request Form, the role indicated on the form determines the workflow:

| Role on Form | Action |
|-------------|--------|
| Program level | Add as consultant contact. Portal access granted by default. Do NOT set up report/file email notifications. |
| Service Delivery Specialist (SDS) / Service Delivery Analyst (SDA) | Add as consultant contact. Portal access granted by default. Do NOT set up report/file email notifications. |
| Project Manager | Add as a CLIENT contact (not consultant). Do NOT grant portal access. |
| Team Lead / Manager / GOSS | Add as consultant contact. Portal access only if specifically requested on the form. |
| Master HIPAA Access | Add to the Aptia (Urbandale) consulting office. |
| Other | STOP. Follow up with client to determine the actual role before proceeding. |

> ⚠️ For Aptia contacts: include the Aptia EEID in the contact record in OnBase Unity. If the form indicates a GOSS role, add 'GOSS' after the job title.

---

## 3. Pre-Change Review

Before making any system updates, review the request and verify all necessary information is available.

### 3.1 Associated Companies Check (OnBase Unity)

1. Locate the client's account in OnBase Unity.
2. Navigate to the Account tab.
3. Review the Associated Companies field to determine if additional GPIDs are impacted.

| Scenario | Action |
|----------|--------|
| Request received through WEX GPID, and Associated Companies shows an Aptia GPID | WEX team member makes the requested updates. Then submits a case to Aptia SA team using the Aptia GPID. Aptia SA verifies with client whether updates also apply. |
| Request received through Aptia GPID, and Associated Companies shows a WEX GPID | Aptia SA makes the requested updates. Then submits a case using the WEX GPID. WEX team member verifies with client whether updates also apply. |
| No associated companies | Proceed with changes on the current GPID only. |

### 3.2 Role Gap Check (For Removals and Edits)

Navigate to the Contacts tab and review existing contacts. If the requested change would result in a role no longer being assigned to any contact:

> ❌ **CRITICAL: STOP.** Do not proceed. Reach out to the client using the applicable email template from HIPAA Contact Verification and Change Requests Templates to request a replacement contact for the unassigned role.

> ⚠️ Aptia clients should not have any contacts with the Billing role in OnBase Unity. If you see one, remove that role. Aptia updates counts on behalf of their clients.

---

## 4. Add a Client Contact

### 4.1 OnBase Unity

#### 4.1.1 Determine Contact Scope

| Scenario | Action |
|----------|--------|
| Contact is associated with ONE client | Add to the Company Contacts section only. |
| Contact is associated with MULTIPLE clients | Add to both Company Contacts and Multiple Company Contacts sections. Leave the Special Info field blank. Check the 'Block LEAP Access' checkbox so the contact maintains only one LEAP login. |

#### 4.1.2 Create the Contact Record

1. Click the 'Create Object' icon in the Company Contacts section.
2. Enter the contact's name, email address, and any other applicable information.

> ⚠️ Best practice: Capitalize only the first letter of first and last names. All capitals causes confusion during LEAP registration.

#### 4.1.3 Handle Divisional Contacts

| Scenario | Action |
|----------|--------|
| Contact should only have access to one division | Enter the division name in the Special Info field. |
| Contact should only be notified of file errors | Enter 'File errors only' in the Special Info field. |

> ❌ **CRITICAL:** Divisional contacts CANNOT have the Primary role. With Primary, they would see cases for all divisions in LEAP, not just their assigned divisions.

#### 4.1.4 Assign Roles

1. Check the boxes for the appropriate contact roles.
2. Handle COBRA ACH role based on client setup:

| Scenario | Action |
|----------|--------|
| Contact needs COBRA ACH role, and client does NOT remit by division | Check the COBRA Remittance box. |
| Contact needs COBRA ACH role, and client DOES remit by division | Do NOT check the box. Submit a sub case to COBRA Billing instead. |

> Note: Clients set up as remit by division have the 'COBRA Remit by Division' box checked on the COBRA tab of their account in OnBase Unity.

3. Click 'Save and Close.'

### 4.2 Benefits Administration Portal

#### 4.2.1 Add Contact Information

1. Locate the client's account.
2. Click 'Manage profile' under Employer Setup.
3. Scroll down to the Main Contact Information section.
4. Complete the required fields.

> ❌ **CRITICAL:** All information must match what is in OnBase Unity exactly, including capitalization.

5. Complete the Title field to indicate the contact's role:

| Scenario | Action |
|----------|--------|
| Contact has Primary, ACH, File, or Portal Access role | Enter the applicable role as the Title. |
| Contact has none of these roles but still needs portal access | Enter 'Portal Access' as the Title. |

> ⚠️ All File contacts MUST be given portal access.

6. Click 'Add' then click 'Submit' at the bottom of the page.

#### 4.2.2 Activate Portal Access

1. Click 'Manage employer portal users' under Employer Setup.
2. Click 'Add New User.'
3. Select the applicable client from the Employer drop-down list.
4. Click 'Grant Access' next to the contact's name.
5. Enter the Username:

| Scenario | Username Format |
|----------|----------------|
| Contact only needs access to ONE client account | Use the contact's email address. |
| Contact needs access to MULTIPLE client accounts (linked or consultant) | Use name-GPID format (e.g., Julie-12345). |

6. Leave 'Email Password to User' as No. The contact will use new user registration in LEAP.
7. Select divisions as applicable.
8. Select all roles except Benefits Administrator.
9. Click 'Add.'

| Scenario | Action |
|----------|--------|
| Red alert is displayed | The contact is likely a linked or consultant contact. Go back and use the name-GPID username format. |

10. When the pop-up window appears, click 'Close.'

> ⚠️ Mercer Marketplace contacts should NOT be set up to receive report or file email notifications through the portal.

#### 4.2.3 Reports and Notifications

Add the contact to any relevant reports and notifications the client receives.

### 4.3 COBRA Administration Portal

First, determine if the contact is divisional. If yes, skip to Section 7 (Divisional COBRA Contacts).

#### 4.3.1 Initial Verification

1. Locate the client's account.
2. Within the General tab, review the Client Options section. Ensure the 'Allow Client SSO' box is checked.
3. Select the Contacts tab.

#### 4.3.2 Add the Contact

1. Click 'Add a new Contact.'
2. Enter the contact's information:

| Scenario | Email Field Value |
|----------|-------------------|
| Contact only needs access to ONE client account | Use the contact's real email address. |
| Consultant or linked contact needs access to MULTIPLE accounts | Use name-GPID format (e.g., bobjones-12345). The real email cannot be used on multiple accounts since contacts cannot have duplicate logins. |

3. Leave the Contact Type field as the default: Other Contact.
4. Ensure the 'Allow SSO' box in the bottom left-hand corner is checked.
5. Click 'Insert.'

#### 4.3.3 Set Up SSO (LEAP → COBRA)

Immediately after adding the contact in COBRA, set up single sign-on:

1. Locate the client's account in LEAP.
2. Locate the contact in the appropriate section (Employer Contacts, Consultant Contacts, or Linked Contacts).
3. Click on the contact's first name and keep this window open.
4. Open a new window and navigate to the COBRA administration portal.
5. Locate the client's account and navigate to the Contacts tab.
6. Copy the data in the Email field for the applicable contact.
7. Return to the LEAP window.
8. Paste the data:

| Contact Type | Where to Paste |
|-------------|----------------|
| Employer contact | Paste into the COBRA User Name field. |
| Consultant contact | Click 'Consultant Employer List.' Paste into the Cobra UserName field for the applicable GPID. |

> ❌ **CRITICAL:** Always COPY and PASTE from the COBRA portal to LEAP. Never type manually. The systems must match exactly or SSO will fail. Access will be available within 24 hours.

### 4.4 Relius (Plan Document Contact Only)

Only proceed with this section if the contact has been assigned the Plan Document Contact role. Skip this section entirely for Aptia clients (Aptia creates their own documents).

> ❌ **CRITICAL:** Only ONE Plan Document contact can be assigned per client. If adding a new one, you MUST remove the existing contact first. If no replacement is specified, confirm with the client. If unresponsive, default to the primary contact.

#### 4.4.1 Prerequisite for Consultant Contacts

If the Plan Document contact is a consultant, first complete these steps in LEAP:

1. Locate the client in LEAP.
2. Click on the consultant contact's name.
3. Navigate to the Consultant Employer List + Roles tab.
4. Select 'Plan Document Contact' under the Optional Roles section for the applicable client.
5. Click 'Save.'

#### 4.4.2 Add User in Relius

1. Log in to Relius. Customer ID: 065077.
2. Select 'User Setup' from the Administration drop-down list.
3. Select 'Add.'
4. Complete the User Profile fields:

| Field | Value |
|-------|-------|
| First Name | Contact's first name (must match OnBase Unity) |
| Last Name | Contact's last name (must match OnBase Unity) |
| Login Name | FirstName LastName (separated with a space) |
| E-mail Address | Contact's email address |
| User Group | Select 'Relius Connect User Group' |
| Status | Select 'Active' |
| User Permissions | Select 'User, Template' from Inherit from user dropdown |
| Product Group Rights | Select 'User, Template' from Inherit from user dropdown |
| Password | PingPong_1!! |

5. Click 'Save.'

| Scenario | Action |
|----------|--------|
| Error: email address already exists (contact listed under multiple GPIDs) | Skip to Project Assignment below. |
| Error: email address already exists (NOT a multi-GPID situation) | Advise the client to work with Relius or their previous TPA to remove the existing account. Cannot proceed until resolved. |

#### 4.4.3 Project Assignment

1. On the confirmation screen, click 'No.'
2. Select 'Existing' from the Project drop-down list.
3. Enter the client's GPID in the search box and click 'Search.'
4. Note the name listed in the User Name column.

If there is no active user with an assigned project, no further action is needed. Otherwise continue:

5. Select 'Project Admin' from the Administration drop-down list.
6. Select 'Reassign Projects.'
7. Select the current user name (from step 4) and click 'Next.'
8. Enter the GPID and click 'Search.' Select the project and click 'Next.'
9. Select the new contact's user name and click 'OK.'
10. On the confirmation screen, click 'No.'

---

## 5. Edit a Client Contact

### 5.1 OnBase Unity

1. Complete the Associated Companies check (Section 3.1).
2. Double-click on the contact's name in the Company Contacts section.
3. Update roles (check/uncheck boxes) and/or contact information as needed.
4. Click 'Save and Close.'

### 5.2 Benefits Administration Portal

1. Locate the client's account.
2. Click 'Manage profile' under Employer Setup.
3. Scroll to the Main Contact Information section.
4. Click 'Update' next to the applicable contact's name.
5. Update information as necessary.
6. Click 'Submit' at the bottom of the page.
7. Update any reports and notifications as needed.

### 5.3 COBRA Administration Portal

1. Click 'Edit' next to the applicable contact's name.
2. Update the contact's information as necessary.

> ❌ **CRITICAL:** Ensure both the 'Active' and 'Allow SSO' boxes remain checked.

| Scenario | Action |
|----------|--------|
| 'Allow SSO' box is not checked | You cannot simply check it. You must REMOVE the contact and RE-ADD them with the box checked. See Section 4.3.2 for add instructions. |
| Contact's email address has changed | Do NOT update the Email field in the COBRA portal. Do NOT update the COBRA User Name field in LEAP. This preserves SSO functionality. |

3. Click 'Update.'

### 5.4 Relius (If Plan Document Role Changed)

1. Log in to Relius. Customer ID: 065077.
2. Select 'User Setup' from the Administration drop-down list.
3. Select 'Modify.'
4. Select the applicable user name and click 'OK.'
5. Edit applicable fields.
6. Click 'Save.'

---

## 6. Remove a Client Contact

### 6.1 Pre-Removal Checks

Before removing, complete the Role Gap Check (Section 3.2). If removing this contact leaves any role unassigned, stop and contact the client for a replacement.

### 6.2 OnBase Unity

1. Double-click on the contact's name in the Company Contacts section.
2. Click 'Delete.'
3. Click 'OK' to confirm.

#### 6.2.1 Sub Case Routing

Check if any of the following conditions apply and submit the appropriate sub case:

| Condition | Sub Case To |
|-----------|-------------|
| Request involves the Billing role for a Special Billing client (indicated on Fees tab) | Accounting |
| SFTP contacts need updating (file feed setup or termination) | Integration Analysts (IA) |
| COBRA/direct bill carrier contacts need updating | Submit COBRA Carrier Contact Change Form |
| Contact has ACH role and client is set up as remit by division | COBRA Billing |

### 6.3 Benefits Administration Portal

> ❌ **CRITICAL:** The order of these steps matters. You MUST remove from reports/notifications BEFORE deactivating portal access BEFORE removing the contact record. Failure to follow this order will result in errors.

#### Step 1: Remove from Reports and Notifications

Remove the contact from ALL reports and notifications the client receives.

#### Step 2: Deactivate Portal Access

1. Locate the client's account.
2. Click 'Manage employer portal users' under Employer Setup.
3. Click the contact's name.
4. Select Inactive from the Status drop-down list.
5. Click 'Update.'

#### Step 3: Remove Contact Record

1. Click 'Manage profile' under Employer Setup.
2. Scroll to the Main Contact Information section.
3. Click 'Remove' next to the applicable contact's name.

| Scenario | Action |
|----------|--------|
| Error: contact is linked to reports/notifications | Go back to Step 1 and ensure the contact is removed from ALL reports and notifications. |
| Cannot identify which reports/notifications the contact is linked to | Submit a sub case to Benefit Operations. |

4. Click 'Submit' at the bottom of the page.

### 6.4 COBRA Administration Portal

1. Click 'Edit' next to the applicable contact's name.
2. Uncheck the 'Active' box.
3. Add 'z' in front of the contact's last name (moves contact to bottom of list).
4. Click 'Update.'

> Note: Contacts are never fully deleted from the COBRA portal. They are deactivated.

### 6.5 Relius (If Contact Was Plan Document Contact)

1. Log in to Relius. Customer ID: 065077.
2. Select 'User Setup' from the Administration drop-down list.
3. Select 'Modify.'
4. Select the applicable user name and click 'OK.'
5. Select 'Inactive' from the Status drop-down list.
6. Click 'Save.'

---

## 7. Divisional COBRA Contacts

This section replaces the standard COBRA process (Section 4.3) when a contact should only have access to specific divisions within a client's COBRA account.

> ❌ **CRITICAL:** Divisional contacts CANNOT have the Primary role. Divisional contacts do NOT get SSO. They receive separate login credentials that must be manually emailed.

### 7.1 Encourage Umbrella Access

Before setting up divisional access, attempt to persuade the client to grant full umbrella access instead:

1. Send the client the 'Initial Response & Request for More Information' email template from the Setting Up Divisional Contacts in the COBRA administration portal Templates document.
2. If the client agrees to umbrella access, proceed with the standard COBRA process (Section 4.3).
3. If the client insists on divisional access, continue below.

### 7.2 Add Divisional Contact in COBRA Portal

1. Locate the client's account in the COBRA administration portal.
2. Navigate to the Divisions tab.
3. Click the name of the applicable division.
4. Navigate to the Contacts tab within the division.
5. Click 'Add a new Contact.'
6. Enter the contact's information:

| Scenario | Email Field Value |
|----------|-------------------|
| Contact only needs access to one client's division | Use the contact's real email or standard identifier. |
| Consultant or linked contact needs access to multiple accounts | Use name-GPID format (e.g., Julie-12345). |

7. Leave Contact Type as Other Contact.
8. Ensure the 'Allow SSO' box is **UNCHECKED** (opposite of standard process).
9. Click 'Insert.'

### 7.3 Generate Registration Code

1. Click 'Create Login' in the Login Status column.

| Scenario | Action |
|----------|--------|
| 'Create Login' option is available | Registration code is generated. Continue to Section 7.4. |
| 'Create Login' option is NOT available | Submit a sub case to COBRA Operations requesting they generate a registration code. Add this note to the sub case: 'Email registration information to [contact name] when completed.' Wait for sub case to be returned before continuing. |

### 7.4 Email Login Information

1. Email the divisional contact their web access information using the 'Divisional Web Access Instructions' email template.

| Scenario | Action |
|----------|--------|
| Contact has access to multiple divisions | Include the username and registration code for EACH division in one email. Review and update the email verbiage as needed. |

> Note: The username referenced in the email template is the email address listed within the COBRA portal under the Contacts tab of the designated division.

2. Email the person who originally requested the divisional contacts to confirm the request has been processed and the contacts have received their registration information.

---

## 8. Consultant Contact Changes

Consultant contact changes follow the same Benefits, COBRA, SSO, and Relius steps as client contacts (Sections 4–6), with the following differences in OnBase Unity and additional considerations.

> ⚠️ Consultants are only given access to the Benefits and COBRA administration portals upon request. Do not automatically grant access.

### 8.1 Add Consultant — OnBase Unity

#### 8.1.1 Check for Existing Record

1. Click the 'Add existing' icon in the Consultant Contacts section.
2. Search by first name, last name, and/or email address.

> Tip: Using the first few letters followed by an asterisk (*) provides broader results.

| Scenario | Action |
|----------|--------|
| Contact is found | Select the contact and click 'OK.' Skip to step 8.1.3. |
| Contact is not found | Continue to step 8.1.2 to create a new record. |

#### 8.1.2 Create New Record

1. Click the 'Create Object' icon in the Consultant Contacts section.
2. Enter the contact's name, email address, and other applicable information.

#### 8.1.3 Upload Documentation

1. Click 'Upload' in the Documents section of the contact record.
2. Click 'Browse' and locate the Access Request Form or Consultant/Broker Access Change Form.
3. In the Description field, add: 'Case [case number], [Add/Edit/Remove]' (e.g., Case 12345, Add).
4. Click 'Upload.'

#### 8.1.4 Link Consulting Office

1. Click the 'Add existing' icon in the Consulting Office section.
2. Search for the applicable firm. This must match the consulting firm linked to the client on the External tab in OnBase Unity.
3. Click 'Save and Close.'
4. If applicable, add the contact to other client accounts.

### 8.2 Edit Consultant — OnBase Unity

1. Double-click the contact in the Consultant Contacts section.
2. Update fields as necessary.
3. Upload the change form (same process as Section 8.1.3, using 'Edit' in the description).
4. Click 'Save and Close.'

#### 8.2.1 CSM Notification

| Scenario | Action |
|----------|--------|
| Consultant's name or email address is being updated | Submit a sub case to Channel Success Managers (CSM) to update Salesforce. |
| New consultant added to or removed from a firm | Submit a sub case to CSM. |
| Existing consultant added to or removed from specific clients within a firm | Do NOT submit a sub case to CSM. |

### 8.3 Remove Consultant — OnBase Unity

#### 8.3.1 Remove from a Client Account

1. Double-click the contact in the Consultant Contacts section.
2. Select the company name in the Employer Groups section.
3. Upload the change form (same process as Section 8.1.3, using 'Remove' in the description).
4. Click 'Save and Close.'
5. Select the contact's name from the Consultant Contacts section.
6. Click the 'Remove from List' icon.
7. Click 'Yes' to confirm.

> ⚠️ Remember to also remove portal access in the Benefits and COBRA portals, and remove the contact from any reports/notifications.

#### 8.3.2 Remove from a Consulting Firm

1. Double-click the contact in the Consultant Contacts section.
2. Select the company name in the Consulting Office section.
3. Click the 'Remove from List' icon.
4. Click 'Yes' to confirm.

#### 8.3.3 Aptia Bulk Removal

When you receive an email from InternalControlCentralizedSecurity@mercer.com to remove Aptia Client Delivery contacts:

| Scenario | Process |
|----------|---------|
| 11 or fewer contacts | 1) Take ownership of the case. 2) For each contact: Navigate CRM tab → Filters → Customer Accounts → Consultant Contacts filter → Search → Open record → Add 'z' before last name → Save and Close. 3) Reply to the email confirming removal from all Aptia client accounts. |
| 12 or more contacts | 1) Take ownership of the case. 2) Follow the standard removal process. 3) Email CS team leadership: 'We have removed the main access for these contacts so they can no longer access our systems. We will continue to remove the remaining access and follow up once this is fully complete.' |

> ❌ **CRITICAL:** Aptia does NOT have authority to remove contacts from WEX client accounts. Only take action on Aptia client accounts. When responding, confirm that access to all Aptia client accounts has been removed.

---

## 9. Completion

After all system updates have been made:

1. Add a discussion to the case in OnBase Unity outlining all changes made across all systems.
2. Click the 'Complete and Double Check' task.

### 9.1 Quality Assurance

These reviews ensure mitigation of HIPAA risk and compliance with outlined changes in internal systems.

| Review Type | Frequency | Performed By |
|-------------|-----------|-------------|
| Double-check case review | 5 completed cases + LEAP forms per team member per week | CS-Company Profile Manager |
| Case quality assessment | Monthly | CS-Company Profile Manager |

---

## 10. Quick Reference: Key Rules

| Rule | Details |
|------|---------|
| System sequence | OnBase Unity → Benefits Portal → COBRA Portal → SSO Setup → Relius |
| Data consistency | All contact info must match across systems exactly, including capitalization. |
| SSO setup | Always COPY and PASTE from COBRA portal to LEAP. Never type manually. |
| Divisional contacts | Cannot have Primary role. Do not get SSO. Receive manual login credentials. |
| Email change in COBRA | Do NOT update Email field in COBRA or COBRA User Name in LEAP. This breaks SSO. |
| Benefits portal removal order | Reports/notifications first → Deactivate portal access → Remove contact record. |
| COBRA portal removal | Uncheck Active + add 'z' before last name. Never fully delete. |
| Plan Document contacts | Only one per client. Remove existing before adding new. Not applicable for Aptia clients. |
| Consultant portal access | Only granted upon request. Never automatic. |
| Multi-client contacts | Use name-GPID format for usernames in Benefits and COBRA portals. |
| Aptia Billing role | Aptia clients should never have contacts with the Billing role in OnBase Unity. |
| Role gap on removal | If removal leaves a role unassigned, stop and contact the client for a replacement. |
| CSM notification | Required when consultant name/email changes or consultant added/removed from a firm. Not required for client-level changes within a firm. |
| Relius password | Default password for new users: PingPong_1!! |
| OnBase Unity name format | Capitalize first letter only. All caps causes LEAP registration confusion. |
