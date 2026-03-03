const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_004";
const CASE_NAME = "David Park - Divisional COBRA Access Setup";

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

const waitForEmail = async () => {
    console.log("Waiting for user to send email...");
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        await fetch(`${API_URL}/email-status`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sent: false })
        });
    } catch (e) { console.error("Failed to reset email status", e); }
    while (true) {
        try {
            const response = await fetch(`${API_URL}/email-status`);
            if (response.ok) {
                const { sent } = await response.json();
                if (sent) { console.log("Email Sent!"); return true; }
            }
        } catch (e) { }
        await delay(2000);
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "Contact Name": "David Park",
            "GPID": "45678",
            "Contact Type": "Client",
            "Action": "Add (Divisional COBRA)",
            "Request Source": "LEAP Contact Change Queue",
            "Divisions": "Northeast, Southeast, Central",
            "Access Type": "Divisional (client insists)"
        }
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Reviewing contact change request in OnBase Unity...",
            title_s: "Request validated - divisional COBRA access requested via LEAP queue",
            reasoning: [
                "Request picked up from LEAP Contact Change queue in OnBase Unity",
                "Contact: David Park (david.park@megacorp.com)",
                "Client: MegaCorp Industries (GPID 45678)",
                "Request: Add contact with divisional COBRA access",
                "Divisions requested: Northeast, Southeast, Central",
                "Divisional contacts cannot have Primary role",
                "Per SOP: encourage umbrella access first"
            ],
            artifacts: [{
                id: "art-onbase-review",
                type: "video",
                label: "Browser Agent - OnBase Unity Review",
                videoPath: "/data/wcc_004_step1_onbase.webm"
            }]
        },
        {
            id: "step-2",
            title_p: "Creating OnBase Unity record and standard system updates...",
            title_s: "OnBase Unity record created - divisional flag set",
            reasoning: [
                "Created contact in OnBase Unity",
                "Division name 'Northeast, Southeast, Central' in Special Info field",
                "Divisional contact: cannot have Primary role - verified",
                "Added to Benefits Admin Portal with portal access",
                "Reports and notifications configured for applicable divisions"
            ],
            artifacts: [{
                id: "art-onbase-divisional",
                type: "video",
                label: "Browser Agent - OnBase Divisional Contact Creation",
                videoPath: "/data/wcc_004_step2_onbase_divisional.webm"
            }]
        },
        {
            id: "step-3",
            title_p: "Drafting umbrella access recommendation email...",
            title_s: "Umbrella access recommendation drafted - review and send to client",
            reasoning: [
                "SOP requires encouraging umbrella access before divisional setup",
                "Using 'Initial Response & Request for More Information' template",
                "Explains benefits of umbrella access vs divisional access",
                "Client must explicitly confirm they want divisional access",
                "Email pending human review before sending"
            ],
            artifacts: [
        {
                id: "art-email", type: "email_draft", label: "Umbrella Access Recommendation",
                data: {
                    isIncoming: false,
                    to: "david.park@megacorp.com",
                    cc: "admin@megacorp.com",
                    subject: "WEX Health COBRA Access Options - GPID 45678",
                    body: "Dear David,\n\nThank you for your COBRA access request. We'd like to recommend umbrella (full account) access instead of divisional access, as it provides:\n\n- Single login for all divisions\n- Simplified user management\n- Full visibility across the organization\n- SSO integration with your existing credentials\n\nDivisional access would require separate registration codes per division and does not include SSO capabilities.\n\nWould you like to proceed with umbrella access instead? If you still require divisional access for Northeast, Southeast, and Central divisions specifically, please confirm and we'll set that up.\n\nBest regards,\nWEX Health Contact Change Team"
                }
            }]
        }
    ];

    // Steps 1-2: normal processing
    for (let i = 0; i < 2; i++) {
        const step = steps[i];
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

    // Step 3: Email-based HITL
    const emailStep = steps[2];
    updateProcessLog(PROCESS_ID, {
        id: emailStep.id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: emailStep.title_p,
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", emailStep.title_p);
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: emailStep.id,
        title: emailStep.title_s,
        status: "warning",
        reasoning: emailStep.reasoning || [],
        artifacts: emailStep.artifacts || []
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Draft Review: Umbrella access email pending");

    await waitForEmail();

    updateProcessLog(PROCESS_ID, {
        id: emailStep.id,
        title: "Umbrella access email sent - client confirmed divisional access",
        status: "success",
        reasoning: emailStep.reasoning || [],
        artifacts: emailStep.artifacts || []
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Email sent - proceeding with divisional COBRA setup");
    await delay(1500);

    // Post-email steps: Divisional COBRA setup
    const postSteps = [
        {
            id: "step-4",
            title_p: "Setting up divisional access in COBRA Admin Portal...",
            title_s: "Division Northeast configured - registration code generated",
            reasoning: [
                "Located client in COBRA Admin Portal",
                "Navigated to Divisions tab → Northeast division",
                "Selected Contacts tab → 'Add a new Contact'",
                "Entered contact info, Contact Type: Other Contact",
                "IMPORTANT: 'Allow SSO' is UNCHECKED (divisional = no SSO)",
                "Single client account - using real email address",
                "Clicked 'Insert'",
                "Clicked 'Create Login' - registration code generated",
                "Code: NE-REG-8847"
            ],
            artifacts: [{
                id: "art-ne", type: "json", label: "Northeast Division Setup",
                data: {
                    division: "Northeast",
                    contactType: "Other Contact",
                    allowSSO: false,
                    registrationCode: "NE-REG-8847",
                    status: "Login created"
                }
            }]
        },
        {
            id: "step-5",
            title_p: "Configuring Southeast division access...",
            title_s: "Division Southeast configured - registration code generated",
            reasoning: [
                "Navigated to Divisions tab → Southeast division",
                "Added contact to Southeast Contacts tab",
                "Allow SSO: Unchecked",
                "Clicked 'Insert' → 'Create Login'",
                "Registration code: SE-REG-9923"
            ],
            artifacts: [{
                id: "art-se", type: "json", label: "Southeast Division Setup",
                data: {
                    division: "Southeast",
                    registrationCode: "SE-REG-9923",
                    allowSSO: false,
                    status: "Login created"
                }
            }]
        },
        {
            id: "step-6",
            title_p: "Configuring Central division access...",
            title_s: "Division Central - 'Create Login' unavailable, sub-case submitted",
            reasoning: [
                "Navigated to Divisions tab → Central division",
                "Added contact to Central Contacts tab",
                "Clicked 'Insert' successfully",
                "WARNING: 'Create Login' option is NOT available",
                "Submitted sub-case to COBRA Operations",
                "Note added: 'Email registration info to contact when completed'",
                "Sub-case will return with registration code"
            ],
            artifacts: [{
                id: "art-central", type: "json", label: "Central Division - Sub-case Required",
                data: {
                    division: "Central",
                    createLoginAvailable: false,
                    subCaseTo: "COBRA Operations",
                    subCaseNote: "Email registration info to contact when completed",
                    registrationCode: "Pending sub-case return",
                    status: "Sub-case submitted"
                }
            }]
        },
        {
            id: "step-7",
            title_p: "Sending divisional web access instructions to contact...",
            title_s: "Registration email sent with all division codes",
            reasoning: [
                "Using 'Divisional Web Access Instructions' template",
                "Multiple divisions: combining ALL usernames and codes in one email",
                "Northeast: NE-REG-8847",
                "Southeast: SE-REG-9923",
                "Central: Pending (COBRA Operations sub-case)",
                "Note: Central division code will be sent separately when available",
                "Email includes login instructions for each division"
            ],
            artifacts: [{
                id: "art-reg-email", type: "json", label: "Registration Email Summary",
                data: {
                    to: "david.park@megacorp.com",
                    template: "Divisional Web Access Instructions",
                    divisions: [
                        { name: "Northeast", code: "NE-REG-8847", status: "Active" },
                        { name: "Southeast", code: "SE-REG-9923", status: "Active" },
                        { name: "Central", code: "Pending", status: "Awaiting COBRA Ops" }
                    ]
                }
            }]
        },
        {
            id: "step-8",
            title_p: "Confirming setup and documenting case...",
            title_s: "Divisional COBRA setup complete - 2/3 divisions active, 1 pending",
            reasoning: [
                "Emailed requester confirming setup is complete",
                "Northeast and Southeast: fully active with registration codes",
                "Central: pending COBRA Operations sub-case",
                "OnBase Unity: Record created with divisional flag",
                "Benefits Admin Portal: Portal access configured",
                "COBRA Admin: 3 divisions set up (2 active, 1 pending)",
                "No SSO for divisional contacts (by design)",
                "Discussion added to case, marked 'Complete and Double Check'"
            ],
            artifacts: [{
                id: "art-summary", type: "json", label: "Completion Summary",
                data: {
                    caseId: "WCC_004",
                    contact: "David Park",
                    gpid: "45678",
                    accessType: "Divisional COBRA",
                    divisions: {
                        Northeast: "Active (NE-REG-8847)",
                        Southeast: "Active (SE-REG-9923)",
                        Central: "Pending COBRA Operations"
                    },
                    sso: "N/A (divisional)",
                    systemsUpdated: ["OnBase Unity", "Benefits Admin Portal", "COBRA Admin Portal"],
                    pendingItems: ["Central division registration code from COBRA Ops"],
                    status: "Complete (partial - 1 division pending)"
                }
            }]
        }
    ];

    for (let i = 0; i < postSteps.length; i++) {
        const step = postSteps[i];
        const isFinal = i === postSteps.length - 1;
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
