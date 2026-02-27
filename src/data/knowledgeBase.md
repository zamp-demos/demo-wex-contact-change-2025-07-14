# WEX Contact Change Processing - Knowledge Base

## Overview

The WEX Contact Change Process manages additions, edits, and removals of client and consultant contacts across four integrated systems: **OnBase Unity**, **Benefits Admin Portal**, **COBRA Admin Portal**, and **Relius** (for Plan Document contacts). Changes are coordinated through **LEAP** for SSO setup.

## Intake Channels

Contact change requests can arrive through five channels:
1. **LEAP Client Change Queue** - Client-initiated changes in LEAP
2. **LEAP Consultant Change Queue** - Consultant-initiated changes in LEAP
3. **Client Contact Change Form or Email** - External submissions
4. **Consultant/Broker Access Change Form or Email** - Broker submissions
5. **Aptia365 WEX Health Access Request Form** - Aptia-specific access requests

### Aptia365 Role Routing
- **Program level / SDS / SDA**: Portal access by default, no report/file notifications
- **Project Manager**: Add as CLIENT contact (not consultant), no portal access
- **Team Lead / Manager / GOSS**: Access only if requested on form
- **Master HIPAA Access**: Add to Aptia Urbandale consulting office
- **Other roles**: STOP and follow up with client to determine role

## Contact Types

### Client Contacts
Direct employees or representatives of client companies. Managed in OnBase Unity under Company Contacts.

### Consultant Contacts
Third-party advisors (brokers, TPAs) who may serve multiple clients. Require consulting office linkage and may need name-GPID username format for portal access.

## System Sequence for Contact Changes

### Add Flow
1. **OnBase Unity** - Create contact record, assign roles
2. **Benefits Admin Portal** - Add to profile, configure portal access
3. **COBRA Admin Portal** - Add contact, configure SSO
4. **LEAP → COBRA SSO Setup** - Link LEAP credentials to COBRA
5. **Relius** (if Plan Document role) - Create user account

### Edit Flow
1. **OnBase Unity** - Update contact record
2. **Benefits Admin Portal** - Update profile fields
3. **COBRA Admin Portal** - Update contact (DO NOT change email field)
4. **Relius** (if Plan Doc role changed) - Modify user account

### Remove Flow
1. **OnBase Unity** - Delete contact from Company/Consultant Contacts
2. **Benefits Admin Portal** - Remove from reports/notifications FIRST, then deactivate portal, then remove
3. **COBRA Admin Portal** - Uncheck Active, add 'z' prefix to last name
4. **Relius** (if Plan Document contact) - Set status to Inactive

## Critical Business Rules

### Associated Companies (WEX/Aptia GPIDs)
- If WEX GPID has Aptia associated: Make updates on WEX GPID, then submit case to Aptia SA team using Aptia GPID
- If Aptia GPID has WEX associated: Aptia SA makes updates, then submits case using WEX GPID

### Multi-Client Contacts
- Use **name-GPID format** (e.g., Julie-12345) as username in Benefits Admin and COBRA portals
- Block LEAP Access must be checked
- Leave Special Info blank in OnBase Unity

### Divisional Contacts
- Cannot have Primary role
- Division name goes in Special Info field
- COBRA divisional access requires separate flow with registration codes
- Always encourage umbrella access first

### Email Changes in COBRA
**CRITICAL**: Never update the Email field in COBRA Admin Portal. Never update COBRA User Name in LEAP. This preserves SSO linkage.

### Role Gap Prevention
Before removing a contact, verify removal won't leave any role unassigned. If it will, STOP and email the client using the HIPAA Contact Verification template to request a replacement contact.

### Aptia Client Billing Role
Ensure no contact has the Billing role on Aptia client accounts. Remove if present.

### Benefits Admin Portal - Removal Order
1. Remove from ALL reports and notifications FIRST
2. Deactivate portal access (set Status to Inactive)
3. Then remove the contact record
Failure to follow this order causes errors.

## SSO Setup Process (LEAP → COBRA)
1. Locate client in LEAP
2. Find contact in Employer/Consultant/Linked Contacts
3. Click contact's first name (keep window open)
4. Open new window to COBRA admin portal
5. Locate client → Contacts tab
6. COPY email from COBRA contact's Email field
7. Return to LEAP window
8. For employers: Paste into COBRA User Name field
9. For consultants: Click Consultant Employer List, paste into Cobra UserName for applicable GPID
10. SSO icon changes - access available within 24 hours

## Relius (Plan Document Contacts)
- Customer ID: 065077
- Default password: PingPong_1!!
- User Group: Relius Connect User Group
- Skip for Aptia clients (they create their own documents)
- If email already exists for non-multi-GPID: client must work with Relius/previous TPA

## Sub-Case Routing
| Scenario | Route To |
|----------|----------|
| Special Billing client | Accounting |
| SFTP file feed | Integration Analysts |
| COBRA/direct bill carrier contacts | COBRA Carrier Contact Change Form |
| Remit by division ACH | COBRA Billing |
| Consultant name/email change | Channel Success Managers (Salesforce update) |

## Quality Assurance
- Add discussion to case outlining all changes made
- Click 'Complete and Double Check'
- Manager reviews 5 cases per week per analyst
