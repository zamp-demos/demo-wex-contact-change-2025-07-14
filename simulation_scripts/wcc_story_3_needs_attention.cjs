const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_003";
const CASE_NAME = "Sarah Chen - Contact Removal with Role Gap";

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

const waitForSignal = async (signalId) => {
    console.log(`Waiting for human signal: ${signalId}...`);
    const signalFile = path.join(__dirname, '../interaction-signals.json');
    for (let i = 0; i < 15; i++) {
        try {
            if (fs.existsSync(signalFile)) {
                const content = fs.readFileSync(signalFile, 'utf8');
                if (!content) continue;
                const signals = JSON.parse(content);
                if (signals[signalId]) {
                    delete signals[signalId];
                    const tempSignal = signalFile + '.' + Math.random().toString(36).substring(7) + '.tmp';
                    fs.writeFileSync(tempSignal, JSON.stringify(signals, null, 4));
                    fs.renameSync(tempSignal, signalFile);
                }
                break;
            }
        } catch (e) { await delay(Math.floor(Math.random() * 200) + 100); }
    }
    while (true) {
        try {
            if (fs.existsSync(signalFile)) {
                const content = fs.readFileSync(signalFile, 'utf8');
                if (content) {
                    const signals = JSON.parse(content);
                    if (signals[signalId]) {
                        console.log(`Signal ${signalId} received!`);
                        delete signals[signalId];
                        const tempSignal = signalFile + '.' + Math.random().toString(36).substring(7) + '.tmp';
                        fs.writeFileSync(tempSignal, JSON.stringify(signals, null, 4));
                        fs.renameSync(tempSignal, signalFile);
                        return true;
                    }
                }
            }
        } catch (e) { }
        await delay(1000);
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "Contact Name": "Sarah Chen",
            "GPID": "67890",
            "Contact Type": "Client",
            "Action": "Remove",
            "Request Source": "Email Request",
            "Current Roles": "Primary, File Errors",
            "Risk": "Role gap detected"
        }
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Reviewing removal request for Sarah Chen...",
            title_s: "Request validated - removal from GPID 67890",
            reasoning: [
                "Request received via email from ClientCorp HR",
                "Contact: Sarah Chen (sarah.chen@clientcorp.com)",
                "Client account: GPID 67890 (ClientCorp Inc.)",
                "Action: Remove contact from all systems",
                "Reason: Employee departure",
                "Proceeding to pre-removal checks"
            ],
            artifacts: [{
                id: "art-onbase-review",
                type: "video",
                label: "Browser Agent - OnBase Unity Review",
                videoPath: "/data/wcc_003_step1_onbase.webm"
            }]
        },
        {
            id: "step-2",
            title_p: "Checking current roles and role gap risk...",
            title_s: "ROLE GAP DETECTED - Primary and File Errors roles will be unassigned",
            reasoning: [
                "Navigated to Contacts tab in OnBase Unity",
                "Sarah Chen current roles: Primary, File Errors",
                "Remaining contacts after removal: 2 (neither has Primary role)",
                "WARNING: Removing Sarah leaves PRIMARY role unassigned",
                "WARNING: Removing Sarah leaves FILE ERRORS role unassigned",
                "Business rule: Cannot remove if role gap exists",
                "MUST email client for replacement contact before proceeding",
                "Using HIPAA Contact Verification template"
            ],
            artifacts: [
        {
                id: "art-gap", type: "json", label: "Role Gap Analysis",
                data: {
                    contactToRemove: "Sarah Chen",
                    currentRoles: ["Primary", "File Errors"],
                    remainingContacts: [
                        { name: "Tom Wilson", roles: ["Portal Access", "File Notifications"] },
                        { name: "Lisa Park", roles: ["COBRA ACH"] }
                    ],
                    unassignedRoles: ["Primary", "File Errors"],
                    riskLevel: "HIGH",
                    action: "STOP - email client for replacement"
                }
            }]
        },
        {
            id: "step-3",
            title_p: "Drafting HIPAA Contact Verification email to client...",
            title_s: "HIPAA email drafted - awaiting human review before sending",
            reasoning: [
                "Using HIPAA Contact Verification email template",
                "Addressed to ClientCorp HR team",
                "Requesting replacement contact for Primary and File Errors roles",
                "Includes current role assignment table",
                "Email requires human review before sending due to HIPAA content"
            ],
            artifacts: [{
                id: "art-email", type: "email_draft", label: "HIPAA Contact Verification Email",
                data: {
                    isIncoming: false,
                    to: "hr@clientcorp.com",
                    cc: "admin@clientcorp.com",
                    subject: "Action Required: Contact Role Reassignment - GPID 67890",
                    body: "Dear ClientCorp HR Team,\n\nWe are processing the removal of Sarah Chen from your WEX Health account (GPID 67890). However, removing this contact will leave the following roles unassigned:\n\n- Primary Contact\n- File Errors Contact\n\nThese roles are critical for account operations. Please provide a replacement contact who should be assigned these roles before we can proceed with the removal.\n\nPlease respond with:\n1. Replacement contact full name\n2. Email address\n3. Phone number\n4. Role(s) to assign\n\nThank you for your prompt attention.\n\nBest regards,\nWEX Health Contact Change Team"
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

    // Step 3: HITL - needs human approval for HIPAA email
    const hitlStep = steps[2];
    updateProcessLog(PROCESS_ID, {
        id: hitlStep.id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: hitlStep.title_p,
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", hitlStep.title_p);
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: hitlStep.id,
        title: hitlStep.title_s,
        status: "warning",
        reasoning: hitlStep.reasoning || [],
        artifacts: hitlStep.artifacts || []
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Role gap detected - HIPAA email pending review");

    await waitForSignal("APPROVE_HIPAA_EMAIL");
    await updateProcessListStatus(PROCESS_ID, "In Progress", "HIPAA email approved - sending to client");

    // Post-HITL steps
    const postSteps = [
        {
            id: "step-4",
            title_p: "Sending HIPAA Contact Verification email...",
            title_s: "HIPAA email sent - awaiting client response for replacement contact",
            reasoning: [
                "Human reviewer approved the HIPAA email",
                "Email sent to hr@clientcorp.com",
                "CC: admin@clientcorp.com",
                "Case status: Pending client response",
                "Removal cannot proceed until replacement contact is confirmed",
                "Case will resume when client provides replacement details"
            ]
        },
        {
            id: "step-5",
            title_p: "Noting Special Billing and sub-case requirements...",
            title_s: "Sub-case flagged for Accounting (Special Billing client)",
            reasoning: [
                "GPID 67890 is a Special Billing client",
                "Sub-case to Accounting: Required upon removal",
                "SFTP file feed: Not applicable",
                "COBRA carrier contacts: Not applicable",
                "Remit by division ACH: Not applicable",
                "Sub-case will be submitted once removal is executed"
            ],
            artifacts: [{
                id: "art-subcase", type: "json", label: "Sub-Case Requirements",
                data: {
                    specialBilling: true,
                    subCaseTo: "Accounting",
                    sftpFeed: false,
                    cobraCarrier: false,
                    remitByDivision: false,
                    status: "Flagged - pending removal execution"
                }
            }]
        },
        {
            id: "step-6",
            title_p: "Documenting case status and next steps...",
            title_s: "Case paused - pending client response for replacement contact",
            reasoning: [
                "Role gap identified: Primary and File Errors roles",
                "HIPAA Contact Verification email sent to client",
                "Special Billing sub-case flagged for Accounting",
                "Next steps upon client response:",
                "1. Add replacement contact (full Add flow)",
                "2. Execute removal across all systems",
                "3. Submit sub-case to Accounting",
                "Discussion added to case with current status"
            ],
            artifacts: [{
                id: "art-status", type: "json", label: "Case Status",
                data: {
                    caseId: "WCC_003",
                    status: "Needs Review",
                    blockedBy: "Client response for replacement contact",
                    emailSent: "2025-07-14",
                    rolesAtRisk: ["Primary", "File Errors"],
                    pendingActions: [
                        "Await client replacement contact",
                        "Execute Add flow for replacement",
                        "Execute Remove flow for Sarah Chen",
                        "Submit Accounting sub-case"
                    ]
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
        await updateProcessListStatus(PROCESS_ID, isFinal ? "Needs Review" : "In Progress", step.title_s);
        await delay(1500);
    }

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
