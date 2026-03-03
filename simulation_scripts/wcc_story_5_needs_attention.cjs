const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_005";
const CASE_NAME = "Jane Smith - Conflicting Identity on Contact Add";

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
            "Contact Name": "Jane Smith",
            "GPID": "33210",
            "Contact Type": "Client",
            "Action": "Add",
            "Request Source": "Client Contact Change Form",
            "Requested Email": "jane.smith@acme.com",
            "Conflict": "Existing jsmith@acme.com found",
            "Risk": "Identity conflict - duplicate name"
        }
    });

    // --- Pre-HITL Steps ---
    const preSteps = [
        {
            id: "step-1",
            title_p: "Reviewing contact change form for Jane Smith...",
            title_s: "Form validated - Add request for GPID 33210",
            reasoning: [
                "Contact Change Form received from Acme Corp HR",
                "Contact: Jane Smith (jane.smith@acme.com)",
                "Client account: GPID 33210 (Acme Corp)",
                "Action: Add as new client contact",
                "Roles requested: Primary, Portal Access",
                "Proceeding to locate client in OnBase Unity"
            ],
            artifacts: [{
                id: "art-onbase-review",
                type: "video",
                label: "Browser Agent - OnBase Unity Review",
                videoPath: "/data/wcc_005_step1_onbase.webm"
            }]
        },
        {
            id: "step-2",
            title_p: "Locating client in OnBase Unity...",
            title_s: "Client located - checking Associated Companies",
            reasoning: [
                "Searched OnBase Unity for GPID 33210",
                "Client found: Acme Corp",
                "Navigated to Associated Companies tab",
                "Result: No associated companies found",
                "Single-client account confirmed",
                "Proceeding to Contacts tab to check existing contacts"
            ]
        },
        {
            id: "step-3",
            title_p: "Checking Contacts tab for existing records...",
            title_s: "IDENTITY CONFLICT DETECTED - existing Jane Smith with different email",
            reasoning: [
                "Navigated to Contacts tab in OnBase Unity",
                "Found existing contact: Jane Smith (jsmith@acme.com)",
                "New request is for: Jane Smith (jane.smith@acme.com)",
                "CONFLICT: Same name, different email addresses",
                "Cannot determine if this is the same person or a different Jane Smith",
                "Possible scenarios:",
                "  A) Same person - email address changed (update existing)",
                "  B) Different person - coincidental name match (add new)",
                "  C) Data entry error on one of the records",
                "Business rule: Cannot proceed without identity resolution",
                "Escalation required - human decision needed"
            ],
            artifacts: [
        {
                id: "art-conflict", type: "json", label: "Identity Conflict Analysis",
                data: {
                    newRequest: {
                        name: "Jane Smith",
                        email: "jane.smith@acme.com",
                        rolesRequested: ["Primary", "Portal Access"]
                    },
                    existingRecord: {
                        name: "Jane Smith",
                        email: "jsmith@acme.com",
                        currentRoles: ["Portal Access", "File Notifications"]
                    },
                    conflictType: "Same name, different email",
                    riskLevel: "HIGH",
                    possibleResolutions: [
                        "Send RFI to client to clarify identity",
                        "Escalate to manager for decision"
                    ]
                }
            }]
        }
    ];

    // Run pre-HITL steps
    for (let i = 0; i < preSteps.length; i++) {
        const step = preSteps[i];
        updateProcessLog(PROCESS_ID, {
            id: step.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: step.title_p,
            status: "processing"
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_p);
        await delay(2000);

        const isFinalPre = i === preSteps.length - 1;
        updateProcessLog(PROCESS_ID, {
            id: step.id,
            title: step.title_s,
            status: isFinalPre ? "warning" : "success",
            reasoning: step.reasoning || [],
            artifacts: step.artifacts || []
        });
        await updateProcessListStatus(PROCESS_ID,
            isFinalPre ? "Needs Attention" : "In Progress",
            isFinalPre ? "Identity conflict detected - escalation required" : step.title_s
        );
        await delay(1500);
    }

    // --- HITL 1: Escalate to Manager ---
    console.log("HITL 1: Waiting for ESCALATE_TO_MANAGER signal...");
    await waitForSignal("ESCALATE_TO_MANAGER");
    console.log("HITL 1 resolved: Escalated to manager.");

    updateProcessLog(PROCESS_ID, {
        id: "step-3",
        title: "Escalated to manager - awaiting manager decision",
        status: "warning",
        reasoning: [
            "Navigated to Contacts tab in OnBase Unity",
            "Found existing contact: Jane Smith (jsmith@acme.com)",
            "New request is for: Jane Smith (jane.smith@acme.com)",
            "CONFLICT: Same name, different email addresses",
            "Human operator chose: Escalate to Manager",
            "Awaiting manager decision on resolution approach"
        ],
        artifacts: [{
            id: "art-conflict", type: "json", label: "Identity Conflict Analysis",
            data: {
                newRequest: { name: "Jane Smith", email: "jane.smith@acme.com", rolesRequested: ["Primary", "Portal Access"] },
                existingRecord: { name: "Jane Smith", email: "jsmith@acme.com", currentRoles: ["Portal Access", "File Notifications"] },
                conflictType: "Same name, different email",
                riskLevel: "HIGH",
                escalationStatus: "Escalated to Manager",
                possibleResolutions: ["Add as new contact", "Edit existing contact", "Send RFI to client"]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Escalated to manager - awaiting decision");

    // --- HITL 2: Manager Decision (RFI) ---
    console.log("HITL 2: Waiting for MANAGER_DECISION_RFI signal...");
    await waitForSignal("MANAGER_DECISION_RFI");
    console.log("HITL 2 resolved: Manager chose RFI.");

    await updateProcessListStatus(PROCESS_ID, "In Progress", "Manager decision: Send RFI to client");

    // Step 4: Draft RFI email
    updateProcessLog(PROCESS_ID, {
        id: "step-4",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Drafting RFI email to clarify identity conflict...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Drafting RFI email to clarify identity conflict...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-4",
        title: "RFI email drafted - review and send to Acme Corp HR",
        status: "warning",
        reasoning: [
            "Manager approved: Send RFI to client for identity clarification",
            "Using 'Request for Information' email template",
            "Addressed to Acme Corp HR team",
            "Requesting confirmation whether Jane Smith (jane.smith@acme.com) is:",
            "  - The same person as existing Jane Smith (jsmith@acme.com)",
            "  - A different individual who happens to share the name",
            "If same person: existing record will be updated with new email",
            "If different person: new contact will be added",
            "Email requires human review before sending"
        ],
        artifacts: [{
            id: "art-rfi-email", type: "email_draft", label: "RFI: Identity Clarification",
            data: {
                isIncoming: false,
                to: "hr@acme.com",
                cc: "benefits@acme.com",
                subject: "Request for Information: Contact Identity Clarification - GPID 33210",
                body: "Dear Acme Corp HR Team,\n\nWe are processing a contact change request to add Jane Smith (jane.smith@acme.com) to your WEX Health account (GPID 33210).\n\nHowever, we have an existing contact on file with the same name but a different email address:\n\n- Existing record: Jane Smith (jsmith@acme.com)\n- New request: Jane Smith (jane.smith@acme.com)\n\nTo proceed accurately, please confirm one of the following:\n\n1. This is the SAME person and the email address should be updated from jsmith@acme.com to jane.smith@acme.com\n2. This is a DIFFERENT individual and a new contact record should be created\n\nPlease also confirm the roles to be assigned:\n- Primary Contact\n- Portal Access\n\nThank you for your prompt response.\n\nBest regards,\nWEX Health Contact Change Team"
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Draft Review: RFI email pending review");

    // --- HITL 3: Email send (waitForEmail) ---
    await waitForEmail();

    updateProcessLog(PROCESS_ID, {
        id: "step-4",
        title: "RFI email sent to Acme Corp - awaiting client response",
        status: "success",
        reasoning: [
            "Manager approved: Send RFI to client for identity clarification",
            "RFI email sent to hr@acme.com",
            "CC: benefits@acme.com",
            "Awaiting client confirmation on identity resolution",
            "Case will resume when client responds"
        ],
        artifacts: [{
            id: "art-rfi-email", type: "email_draft", label: "RFI: Identity Clarification (Sent)",
            data: {
                isIncoming: false,
                to: "hr@acme.com",
                cc: "benefits@acme.com",
                subject: "Request for Information: Contact Identity Clarification - GPID 33210",
                body: "Dear Acme Corp HR Team,\n\nWe are processing a contact change request to add Jane Smith (jane.smith@acme.com) to your WEX Health account (GPID 33210).\n\nHowever, we have an existing contact on file with the same name but a different email address:\n\n- Existing record: Jane Smith (jsmith@acme.com)\n- New request: Jane Smith (jane.smith@acme.com)\n\nTo proceed accurately, please confirm one of the following:\n\n1. This is the SAME person and the email address should be updated from jsmith@acme.com to jane.smith@acme.com\n2. This is a DIFFERENT individual and a new contact record should be created\n\nPlease also confirm the roles to be assigned:\n- Primary Contact\n- Portal Access\n\nThank you for your prompt response.\n\nBest regards,\nWEX Health Contact Change Team"
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "RFI email sent - awaiting client response");
    await delay(1500);

    // Step 5: Document case status
    updateProcessLog(PROCESS_ID, {
        id: "step-5",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Documenting case status and escalation trail...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Documenting case status and escalation trail...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-5",
        title: "Case paused - pending RFI response for identity resolution",
        status: "completed",
        reasoning: [
            "Identity conflict identified: two Jane Smith records",
            "Existing: jsmith@acme.com (Portal Access, File Notifications)",
            "Requested: jane.smith@acme.com (Primary, Portal Access)",
            "Escalation path: Operator -> Manager -> RFI to client",
            "RFI email sent to hr@acme.com",
            "Next steps upon client response:",
            "1. If same person: Update email, merge roles",
            "2. If different person: Add new contact, assign requested roles",
            "Discussion added to case with full escalation trail"
        ],
        artifacts: [{
            id: "art-status", type: "json", label: "Case Status",
            data: {
                caseId: "WCC_005",
                status: "Needs Review",
                conflictType: "Identity - same name, different email",
                escalationPath: ["Operator detected conflict", "Escalated to Manager", "Manager approved RFI", "RFI sent to client"],
                blockedBy: "Client response to RFI",
                rfiSent: new Date().toISOString().split('T')[0],
                existingContact: { name: "Jane Smith", email: "jsmith@acme.com" },
                requestedContact: { name: "Jane Smith", email: "jane.smith@acme.com" },
                pendingActions: [
                    "Await client identity confirmation",
                    "Update or Add based on response",
                    "Assign roles (Primary, Portal Access)"
                ]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Review", "Case paused - pending RFI response for identity resolution");

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
