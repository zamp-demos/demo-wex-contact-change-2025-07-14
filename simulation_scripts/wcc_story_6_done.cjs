const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const SIGNAL_FILE = path.join(PROJECT_ROOT, 'interaction-signals.json');
const PROCESS_ID = "WCC_006";
const CASE_NAME = "Mark Reynolds - Deactivated Contact Rediscovery";

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForSignal = (signalNames) => {
    return new Promise((resolve) => {
        const check = () => {
            try {
                const signals = JSON.parse(fs.readFileSync(SIGNAL_FILE, 'utf8'));
                for (const name of signalNames) {
                    if (signals[name] === true) {
                        resolve(name);
                        return;
                    }
                }
            } catch (e) {}
            setTimeout(check, 1000);
        };
        check();
    });
};

const updateProcessLog = (processId, logEntry, keyDetailsUpdate = {}) => {
    const processFile = path.join(PUBLIC_DATA_DIR, `process_${processId}.json`);
    let data = { logs: [], keyDetails: {}, sidebarArtifacts: [] };
    if (fs.existsSync(processFile)) data = readJson(processFile);
    if (logEntry) {
        const existingIdx = logEntry.id ? data.logs.findIndex(l => l.id === logEntry.id) : -1;
        if (existingIdx !== -1) { data.logs[existingIdx] = { ...data.logs[existingIdx], ...logEntry }; }
        else { data.logs.push(logEntry); }
    }
    if (keyDetailsUpdate && Object.keys(keyDetailsUpdate).length > 0) {
        data.keyDetails = { ...data.keyDetails, ...keyDetailsUpdate };
    }
    // Sort logs by step ID to ensure correct order after any race conditions
    data.logs.sort((a, b) => {
        const numA = parseInt((a.id || '').replace('step-', ''), 10) || 0;
        const numB = parseInt((b.id || '').replace('step-', ''), 10) || 0;
        return numA - numB;
    });
    writeJson(processFile, data);
};

const updateProcessListStatus = async (processId, status, currentStatus) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        const response = await fetch(`${apiUrl}/api/update-status`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: processId, status, currentStatus })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
    } catch (e) {
        try {
            const processes = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
            const idx = processes.findIndex(p => p.id === String(processId));
            if (idx !== -1) { processes[idx].status = status; processes[idx].currentStatus = currentStatus; fs.writeFileSync(PROCESSES_FILE, JSON.stringify(processes, null, 4)); }
        } catch (err) { }
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "Contact Name": "Mark Reynolds",
            "GPID": "44789",
            "Contact Type": "Client",
            "Action": "Add",
            "Request Source": "Client Contact Change Form",
            "Roles": "Primary, Portal Access"
        }
    });

    // Steps 1-5: Standard Add flow
    // Step 6: COBRA discovery with HITL
    // Steps 7-11: Post-decision flow
    const standardSteps = [
        {
            id: "step-1",
            title_p: "Reviewing Client Contact Change Form...",
            title_s: "Form validated - all required fields present",
            reasoning: [
                "Form received: Client Contact Change Form for GPID 44789",
                "Contact: Mark Reynolds (mark.reynolds@acmefinancial.com)",
                "Action requested: Add new contact",
                "Roles requested: Primary, Portal Access",
                "All required fields populated - proceeding"
            ],
            artifacts: [
        {
          id: "art-onbase-review",
          type: "video",
          label: "Browser Agent - OnBase Unity Review",
          videoPath: "/data/wcc_006_step1_onbase.webm"
        },
        {
                id: "art-form", type: "file", label: "Client Contact Change Form"
            }]
        },
        {
            id: "step-2",
            title_p: "Locating client account in OnBase Unity...",
            title_s: "Client account located - GPID 44789 (Acme Financial Services)",
            reasoning: [
                "Searched OnBase Unity for GPID 44789",
                "Account found: Acme Financial Services",
                "Associated Companies: None (single GPID)",
                "Current contacts: 2 active contacts on file",
                "No Aptia association detected"
            ]
        },
        {
            id: "step-3",
            title_p: "Creating contact record in OnBase Unity...",
            title_s: "Contact created in OnBase Unity - roles assigned",
            reasoning: [
                "Navigated to Contacts tab",
                "Clicked 'Create Object' - entered name and email",
                "Name format: Mark Reynolds (first letter capitalized only)",
                "Contact is non-divisional - no Special Info needed",
                "Roles checked: Primary, Portal Access",
                "Not file-errors-only, no COBRA ACH role needed",
                "Not an Aptia client - no Billing role check needed",
                "Clicked 'Save and Close'"
            ],
            artifacts: [{
                id: "art-ob", type: "json", label: "OnBase Unity Record",
                data: {
                    system: "OnBase Unity",
                    gpid: "44789",
                    contact: "Mark Reynolds",
                    email: "mark.reynolds@acmefinancial.com",
                    roles: ["Primary", "Portal Access"],
                    divisional: false,
                    status: "Created"
                }
            }]
        },
        {
            id: "step-4",
            title_p: "Adding contact to Benefits Admin Portal...",
            title_s: "Contact added to Benefits Admin Portal with portal access",
            reasoning: [
                "Located client in Benefits Admin Portal",
                "Clicked 'Manage profile' under Employer Setup",
                "Completed Main Contact Info fields (matching OnBase Unity exactly)",
                "Title field set to 'Primary' (has Primary role)",
                "Clicked 'Add' then 'Submit'",
                "Proceeded to portal access setup"
            ]
        },
        {
            id: "step-5",
            title_p: "Activating portal access in Benefits Admin...",
            title_s: "Portal access granted - username: mark.reynolds@acmefinancial.com",
            reasoning: [
                "Clicked 'Manage employer portal users', then 'Add New User'",
                "Single client account - using email as Username",
                "Left 'Email Password' as No",
                "Selected all roles except Benefits Administrator",
                "Clicked 'Add' - no red alert displayed",
                "Closed confirmation pop-up",
                "Added contact to relevant reports and notifications"
            ],
            artifacts: [{
                id: "art-ben", type: "json", label: "Benefits Admin Portal Access",
                data: {
                    system: "Benefits Admin Portal",
                    username: "mark.reynolds@acmefinancial.com",
                    portalAccess: true,
                    roles: ["All except Benefits Administrator"],
                    reportsConfigured: true
                }
            }]
        }
    ];

    // === Run standard steps 1-5 ===
    for (let i = 0; i < standardSteps.length; i++) {
        const step = standardSteps[i];
        updateProcessLog(PROCESS_ID, {
            id: step.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: step.title_p,
            status: "processing"
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_p);
        await delay(2000);

        updateProcessLog(PROCESS_ID, {
            id: step.id,
            title: step.title_s,
            status: "success",
            reasoning: step.reasoning || [],
            artifacts: step.artifacts || []
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_s);
        await delay(1500);
    }

    // === Step 6: COBRA Discovery + HITL Pause ===
    updateProcessLog(PROCESS_ID, {
        id: "step-6",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Adding contact to COBRA Admin Portal...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Adding contact to COBRA Admin Portal...");
    await delay(2500);

    // Discover deactivated record - switch to warning with decision artifact
    updateProcessLog(PROCESS_ID, {
        id: "step-6",
        title: "Deactivated record found in COBRA - analyst decision required",
        status: "warning",
        reasoning: [
            "Located client account in COBRA Admin Portal",
            "Navigated to Contacts tab to add new contact",
            "⚠ ALERT: Found existing deactivated record for this individual",
            "Record shows: 'zReynolds, Mark' (z-prefix indicates prior deactivation)",
            "Active checkbox: Unchecked",
            "Email on file: mark.reynolds-GPID12345@oldclient.com (stale name-GPID workaround)",
            "Allow SSO: Checked (may not reflect current requirement)",
            "SOP provides no explicit guidance for reinstating previously deactivated contacts",
            "Risk if reactivating: may carry forward stale data, outdated SSO configurations, incorrect role assignments",
            "Risk if creating new: duplicate entries (one active, one inactive) in system",
            "Escalating to analyst for decision on how to proceed"
        ],
        artifacts: [{
            id: "art-cobra-decision", type: "decision", label: "COBRA Contact Resolution",
            data: {
                question: "A deactivated record for Mark Reynolds was found in COBRA (z-prefix, inactive, stale email). How should this be handled?",
                options: [
                    { label: "Reactivate old record (remove z-prefix, update contact info, verify SSO settings)", value: "reactivate", signal: "WCC006_REACTIVATE" },
                    { label: "Create new record alongside deactivated one (standard add process)", value: "create_new", signal: "WCC006_CREATE_NEW" },
                    { label: "Other approach (document in case notes)", value: "other", signal: "WCC006_OTHER" }
                ]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Deactivated record found in COBRA - analyst decision required");

    console.log(`${PROCESS_ID}: Waiting for analyst decision on COBRA deactivated record...`);
    const receivedSignal = await waitForSignal(["WCC006_REACTIVATE", "WCC006_CREATE_NEW", "WCC006_OTHER"]);
    console.log(`${PROCESS_ID}: Received signal: ${receivedSignal}`);

    // Update step 6 after decision received
    updateProcessLog(PROCESS_ID, {
        id: "step-6",
        title: "Decision recorded: Create new COBRA contact alongside deactivated record",
        status: "success",
        reasoning: [
            "Located client account in COBRA Admin Portal",
            "Navigated to Contacts tab to add new contact",
            "⚠ Found existing deactivated record: 'zReynolds, Mark'",
            "Analyst decision received: Create new record alongside deactivated one",
            "Proceeding with standard add process for new contact"
        ],
        artifacts: [{
            id: "art-cobra-decision", type: "decision", label: "COBRA Contact Resolution",
            data: {
                question: "A deactivated record for Mark Reynolds was found in COBRA (z-prefix, inactive, stale email). How should this be handled?",
                options: [
                    { label: "Reactivate old record (remove z-prefix, update contact info, verify SSO settings)", value: "reactivate", signal: "WCC006_REACTIVATE" },
                    { label: "Create new record alongside deactivated one (standard add process)", value: "create_new", signal: "WCC006_CREATE_NEW" },
                    { label: "Other approach (document in case notes)", value: "other", signal: "WCC006_OTHER" }
                ]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Decision recorded - proceeding with new COBRA contact creation");
    await delay(1500);

    // === Step 7: HITL - Confirm future case handling ===
    updateProcessLog(PROCESS_ID, {
        id: "step-7",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Reviewing decision for future case applicability...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Reviewing decision for future case applicability...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-7",
        title: "New precedent detected - confirm future case handling",
        status: "warning",
        reasoning: [
            "This is the first case involving a previously deactivated contact in COBRA",
            "The SOP does not cover this scenario explicitly",
            "Analyst chose: Create new record alongside deactivated one",
            "Rationale: avoids carrying forward stale data, outdated SSO, or incorrect roles",
            "This decision could be applied as standard handling for all similar future cases",
            "Awaiting confirmation to update Knowledge Base"
        ],
        artifacts: [{
            id: "art-future-decision", type: "decision", label: "Future Case Handling",
            data: {
                question: "Should this approach (create new record alongside deactivated contacts) be applied as standard handling for all future cases?",
                options: [
                    { label: "Yes - apply this as the standard approach for future deactivated contact cases", value: "yes", signal: "WCC006_KB_YES" },
                    { label: "No - treat this as a one-time decision only", value: "no", signal: "WCC006_KB_NO" }
                ]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "New precedent detected - confirm future case handling");

    console.log(`${PROCESS_ID}: Waiting for Knowledge Base confirmation...`);
    await waitForSignal(["WCC006_KB_YES", "WCC006_KB_NO"]);
    console.log(`${PROCESS_ID}: KB confirmation received.`);

    updateProcessLog(PROCESS_ID, {
        id: "step-7",
        title: "Knowledge Base updated - future deactivated contact cases will follow this precedent",
        status: "success",
        reasoning: [
            "Analyst confirmed: apply this decision to all future cases",
            "Knowledge Base updated with new rule:",
            "  When a deactivated contact (z-prefix) is found in COBRA:",
            "  - Always create a new record alongside the deactivated one",
            "  - Do not reactivate old records (risk of stale data)",
            "  - Preserve deactivated record as historical reference",
            "This precedent will be automatically applied in future cases",
            "No further analyst intervention needed for this scenario type"
        ],
        artifacts: [{
            id: "art-kb-update", type: "json", label: "Knowledge Base Entry",
            data: {
                type: "Process Learning",
                rule: "When a deactivated contact is found in COBRA, always create a new record alongside it",
                rationale: "Reactivating old records risks carrying forward stale data, outdated SSO configurations, and incorrect role assignments",
                applicability: "All future deactivated contact rediscovery cases",
                capturedFrom: "WCC_006",
                status: "Active"
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Knowledge Base updated - proceeding with COBRA contact creation");
    await delay(1500);

    // === Steps 8-12: Post-decision flow ===
    const postDecisionSteps = [
        {
            id: "step-8",
            title_p: "Creating new contact in COBRA Admin Portal...",
            title_s: "New contact created in COBRA alongside deactivated record",
            reasoning: [
                "Selected 'Add a new Contact' on Contacts tab",
                "Entered contact info: Mark Reynolds",
                "Contact Type: Other Contact",
                "Allow SSO: Checked",
                "Used current email: mark.reynolds@acmefinancial.com (not stale workaround)",
                "Clicked 'Insert' - new active record created",
                "Deactivated record 'zReynolds, Mark' remains unchanged in system"
            ],
            artifacts: [{
                id: "art-cobra", type: "json", label: "COBRA Contact Record",
                data: {
                    system: "COBRA Admin Portal",
                    gpid: "44789",
                    newRecord: {
                        name: "Reynolds, Mark",
                        email: "mark.reynolds@acmefinancial.com",
                        contactType: "Other Contact",
                        allowSSO: true,
                        active: true,
                        status: "Created"
                    },
                    deactivatedRecord: {
                        name: "zReynolds, Mark",
                        email: "mark.reynolds-GPID12345@oldclient.com",
                        active: false,
                        status: "Deactivated (preserved)"
                    }
                }
            }]
        },
        {
            id: "step-9",
            title_p: "Setting up SSO linkage between LEAP and COBRA...",
            title_s: "SSO setup complete - access available within 24 hours",
            reasoning: [
                "Opened LEAP - located client GPID 44789",
                "Found Mark Reynolds in Employer Contacts",
                "Clicked contact's first name (kept window open)",
                "Opened new window to COBRA admin portal",
                "Located client, navigated to Contacts tab, found new active record",
                "Copied email from new COBRA contact's Email field",
                "Returned to LEAP window",
                "Pasted into COBRA User Name field (Employer contact)",
                "SSO icon updated - access will be available in 24 hours"
            ],
            artifacts: [{
                id: "art-sso", type: "json", label: "SSO Configuration",
                data: {
                    system: "LEAP to COBRA SSO",
                    contactType: "Employer",
                    cobraUsername: "mark.reynolds@acmefinancial.com",
                    ssoStatus: "Active (24hr activation)",
                    linkedSystems: ["LEAP", "COBRA Admin Portal"],
                    note: "Linked to NEW record only (not deactivated zReynolds)"
                }
            }]
        },
        {
            id: "step-10",
            title_p: "Checking Plan Document contact role...",
            title_s: "No Plan Document role - Relius update not required",
            reasoning: [
                "Reviewed assigned roles: Primary, Portal Access",
                "Plan Document Contact role: Not assigned",
                "Relius update: Not required for this contact"
            ]
        },
        {
            id: "step-11",
            title_p: "Generating completion summary and case notes...",
            title_s: "Contact change complete - all systems updated, precedent recorded",
            reasoning: [
                "OnBase Unity: Contact created with Primary and Portal Access roles",
                "Benefits Admin Portal: Profile added, portal access granted",
                "COBRA Admin Portal: New contact created alongside preserved deactivated record",
                "SSO: Configured via LEAP-COBRA linkage (24hr activation)",
                "Relius: Not applicable (no Plan Document role)",
                "Knowledge Base updated: future deactivated contact cases will follow this precedent",
                "Discussion added to case outlining all changes and decision rationale",
                "Case marked 'Complete and Double Check'"
            ],
            artifacts: [{
                id: "art-summary", type: "json", label: "Completion Summary",
                data: {
                    caseId: "WCC_006",
                    contact: "Mark Reynolds",
                    gpid: "44789",
                    action: "Add",
                    systemsUpdated: ["OnBase Unity", "Benefits Admin Portal", "COBRA Admin Portal"],
                    ssoConfigured: true,
                    relius: "Not required",
                    specialHandling: "Deactivated contact rediscovery - new record created alongside",
                    precedentCaptured: true,
                    status: "Complete",
                    reviewReady: true
                }
            }]
        }
    ];

    // Run post-decision steps
    for (let i = 0; i < postDecisionSteps.length; i++) {
        const step = postDecisionSteps[i];
        const isFinal = i === postDecisionSteps.length - 1;

        updateProcessLog(PROCESS_ID, {
            id: step.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: step.title_p,
            status: "processing"
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_p);
        await delay(2000);

        updateProcessLog(PROCESS_ID, {
            id: step.id,
            title: step.title_s,
            status: isFinal ? "completed" : "success",
            reasoning: step.reasoning || [],
            artifacts: step.artifacts || []
        });
        await updateProcessListStatus(PROCESS_ID, isFinal ? "Done" : "In Progress", step.title_s);
        await delay(1500);
    }

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
