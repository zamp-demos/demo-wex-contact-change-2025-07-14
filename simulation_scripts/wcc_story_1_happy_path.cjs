const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_001";
const CASE_NAME = "Julie Martinez - New Primary Contact Add";

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            "Contact Name": "Julie Martinez",
            "GPID": "54321",
            "Contact Type": "Client",
            "Action": "Add",
            "Request Source": "Client Contact Change Form",
            "Roles": "Primary, Portal Access"
        }
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Reviewing Client Contact Change Form...",
            title_s: "Form validated - all required fields present",
            reasoning: [
                "Form received: Client Contact Change Form for GPID 54321",
                "Contact: Julie Martinez (julie.martinez@clientcorp.com)",
                "Action requested: Add new contact",
                "Roles requested: Primary, Portal Access, File Notifications",
                "All required fields populated - proceeding"
            ],
            artifacts: [
        {
          id: "art-onbase-review",
          type: "video",
          label: "Browser Agent - OnBase Unity Review",
          videoPath: "/data/wcc_001_step1_onbase.webm"
        },
        {
                id: "art-form", type: "file", label: "Client Contact Change Form",
                pdfPath: "/data/wcc001_contact_change_form.pdf"
            }]
        },
        {
            id: "step-2",
            title_p: "Locating client account in OnBase Unity...",
            title_s: "Client account located - GPID 54321 (ClientCorp Inc.)",
            reasoning: [
                "Searched OnBase Unity for GPID 54321",
                "Account found: ClientCorp Inc.",
                "Associated Companies: None (single GPID)",
                "Current contacts: 3 active contacts on file",
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
                "Name format: Julie Martinez (first letter capitalized only)",
                "Contact is non-divisional - no Special Info needed",
                "Roles checked: Primary, File Notifications",
                "Not file-errors-only, no COBRA ACH role needed",
                "Not an Aptia client - no Billing role check needed",
                "Clicked 'Save and Close'"
            ],
            artifacts: [{
                id: "art-ob", type: "json", label: "OnBase Unity Record",
                data: {
                    system: "OnBase Unity",
                    gpid: "54321",
                    contact: "Julie Martinez",
                    email: "julie.martinez@clientcorp.com",
                    roles: ["Primary", "File Notifications"],
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
            title_s: "Portal access granted - username: julie.martinez@clientcorp.com",
            reasoning: [
                "Clicked 'Manage employer portal users' → 'Add New User'",
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
                    username: "julie.martinez@clientcorp.com",
                    portalAccess: true,
                    roles: ["All except Benefits Administrator"],
                    reportsConfigured: true
                }
            }]
        },
        {
            id: "step-6",
            title_p: "Adding contact to COBRA Admin Portal...",
            title_s: "Contact added to COBRA Admin Portal - SSO enabled",
            reasoning: [
                "Located client account in COBRA",
                "Verified 'Allow Client SSO' is checked on General tab",
                "Selected Contacts tab → 'Add a new Contact'",
                "Entered contact info, Contact Type: Other Contact",
                "Ensured 'Allow SSO' is checked",
                "Single client - using real email address",
                "Clicked 'Insert'"
            ]
        },
        {
            id: "step-7",
            title_p: "Setting up SSO linkage between LEAP and COBRA...",
            title_s: "SSO setup complete - access available within 24 hours",
            reasoning: [
                "Opened LEAP - located client GPID 54321",
                "Found Julie Martinez in Employer Contacts",
                "Clicked contact's first name (kept window open)",
                "Opened new window to COBRA admin portal",
                "Located client → Contacts tab",
                "Copied email from COBRA contact's Email field",
                "Returned to LEAP window",
                "Pasted into COBRA User Name field (Employer contact)",
                "SSO icon updated - access will be available in 24 hours"
            ],
            artifacts: [{
                id: "art-sso", type: "json", label: "SSO Configuration",
                data: {
                    system: "LEAP → COBRA SSO",
                    contactType: "Employer",
                    cobraUsername: "julie.martinez@clientcorp.com",
                    ssoStatus: "Active (24hr activation)",
                    linkedSystems: ["LEAP", "COBRA Admin Portal"]
                }
            }]
        },
        {
            id: "step-8",
            title_p: "Checking Plan Document contact role...",
            title_s: "No Plan Document role - Relius update not required",
            reasoning: [
                "Reviewed assigned roles: Primary, File Notifications",
                "Plan Document Contact role: Not assigned",
                "Relius update: Not required for this contact"
            ]
        },
        {
            id: "step-9",
            title_p: "Generating completion summary and case notes...",
            title_s: "Contact change complete - all 3 systems updated",
            reasoning: [
                "OnBase Unity: Contact created with Primary and File roles",
                "Benefits Admin Portal: Profile added, portal access granted",
                "COBRA Admin Portal: Contact added with SSO enabled",
                "Relius: Not applicable (no Plan Document role)",
                "Discussion added to case outlining all changes",
                "Case marked 'Complete and Double Check'"
            ],
            artifacts: [{
                id: "art-summary", type: "json", label: "Completion Summary",
                data: {
                    caseId: "WCC_001",
                    contact: "Julie Martinez",
                    gpid: "54321",
                    action: "Add",
                    systemsUpdated: ["OnBase Unity", "Benefits Admin Portal", "COBRA Admin Portal"],
                    ssoConfigured: true,
                    relius: "Not required",
                    status: "Complete",
                    reviewReady: true
                }
            }]
        }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isFinal = i === steps.length - 1;

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
