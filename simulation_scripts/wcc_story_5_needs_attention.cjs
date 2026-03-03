const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_005";
const CASE_NAME = "Jane Smith - Identity Conflict on Add";

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
            "Contact Name": "Jane Smith",
            "GPID": "33456",
            "Contact Type": "Client",
            "Action": "Add (Requested)",
            "Request Source": "Client Contact Change Form",
            "Email on Form": "jane.smith@acme.com",
            "Risk": "Identity conflict detected"
        }
    });

    // ==========================================
    // PRE-CONFLICT STEPS (normal processing)
    // ==========================================
    const preSteps = [
        {
            id: "step-1",
            title_p: "Reviewing Client Contact Change Form...",
            title_s: "Form validated - Add request for Jane Smith (jane.smith@acme.com)",
            reasoning: [
                "Form received: Client Contact Change Form for GPID 33456",
                "Contact: Jane Smith (jane.smith@acme.com)",
                "Action requested: Add new contact",
                "Roles requested: Primary, Portal Access, File Notifications",
                "Client account: Acme Industries",
                "All required fields populated - proceeding to OnBase Unity"
            ],
            artifacts: [{
                id: "art-form", type: "file", label: "Client Contact Change Form",
                pdfPath: "/data/wcc005_contact_change_form.pdf"
            }]
        },
        {
            id: "step-2",
            title_p: "Locating client account in OnBase Unity...",
            title_s: "Client located - reviewing existing contacts on GPID 33456",
            reasoning: [
                "Searched OnBase Unity for GPID 33456",
                "Account found: Acme Industries",
                "Associated Companies: None (single GPID)",
                "Navigating to Contacts tab to review existing contacts",
                "Checking for potential duplicates before creating new record"
            ]
        }
    ];

    // Run pre-conflict steps normally
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

    // ==========================================
    // STEP 3: CONFLICT DETECTED + HITL #1
    // Two options: Send RFI or Escalate to Manager
    // ==========================================
    updateProcessLog(PROCESS_ID, {
        id: "step-3",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Checking for existing contacts with matching identity...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Checking for existing contacts with matching identity...");
    await delay(2200);

    updateProcessLog(PROCESS_ID, {
        id: "step-3",
        title: "IDENTITY CONFLICT - Jane Smith already exists with different email (jsmith@acme.com)",
        status: "warning",
        reasoning: [
            "Existing contact found: Jane Smith (jsmith@acme.com) on GPID 33456",
            "Request is to ADD: Jane Smith (jane.smith@acme.com) to same account",
            "Same name, different email — cannot determine if this is:",
            "  (a) The same person whose email changed (should be an Edit, not Add)",
            "  (b) A different person who shares the same name (legitimate Add)",
            "If treated as Add: risk of duplicate records across all downstream systems",
            "If treated as Edit: risk of overwriting a different person's contact info",
            "SOP does not cover ambiguous identity matches — cannot proceed without clarification"
        ],
        artifacts: [
            {
                id: "art-conflict", type: "json", label: "Identity Conflict Analysis",
                data: {
                    requestedContact: "Jane Smith (jane.smith@acme.com)",
                    existingContact: "Jane Smith (jsmith@acme.com)",
                    account: "Acme Industries (GPID 33456)",
                    conflictType: "Same name, different email",
                    riskIfAdd: "Duplicate records in OnBase, Benefits Admin, COBRA",
                    riskIfEdit: "Overwrite different person's data, break SSO linkage",
                    sopCoverage: "Gap — no procedure for ambiguous identity match"
                }
            },
            {
                id: "decision-analyst",
                type: "decision",
                label: "Action Required: Identity Conflict Resolution",
                data: {
                    question: "An existing contact 'Jane Smith (jsmith@acme.com)' was found on this account. The request is to add 'Jane Smith (jane.smith@acme.com)'. How should this conflict be resolved?",
                    options: [
                        {
                            label: "Send RFI to Client — Ask the client to clarify whether this is the same person or a different individual",
                            value: "send_rfi",
                            signal: "WCC005_ANALYST_RFI"
                        },
                        {
                            label: "Escalate to Manager — Route to manager for review and decision",
                            value: "escalate_manager",
                            signal: "WCC005_ANALYST_ESCALATE"
                        }
                    ]
                }
            }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Identity conflict detected - awaiting analyst decision");

    // Wait for analyst to click "Escalate to Manager"
    await waitForSignal("WCC005_ANALYST_ESCALATE");

    // ==========================================
    // STEP 4: ESCALATION ACKNOWLEDGED + HITL #2
    // Manager gets three options: Add, Edit, or RFI
    // ==========================================
    updateProcessLog(PROCESS_ID, {
        id: "step-4",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Escalating identity conflict to manager for review...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Escalating to manager...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-4",
        title: "Escalated to manager - awaiting manager decision",
        status: "warning",
        reasoning: [
            "Analyst chose to escalate identity conflict to manager",
            "Conflict summary forwarded:",
            "  Requested: Jane Smith (jane.smith@acme.com) — Add",
            "  Existing:  Jane Smith (jsmith@acme.com) — already on GPID 33456",
            "Manager must decide: treat as Add, treat as Edit, or request client clarification"
        ],
        artifacts: [
            {
                id: "art-escalation", type: "json", label: "Escalation Summary",
                data: {
                    escalatedBy: "Analyst",
                    reason: "Ambiguous identity match on contact Add request",
                    requestedContact: "Jane Smith (jane.smith@acme.com)",
                    existingContact: "Jane Smith (jsmith@acme.com)",
                    account: "Acme Industries (GPID 33456)",
                    rolesRequested: ["Primary", "Portal Access", "File Notifications"],
                    existingRoles: ["Portal Access", "File Errors"]
                }
            },
            {
                id: "decision-manager",
                type: "decision",
                label: "Manager Decision: Identity Conflict",
                data: {
                    question: "A contact 'Jane Smith' already exists on GPID 33456 with a different email. The analyst has escalated this for your decision. How should this be resolved?",
                    options: [
                        {
                            label: "Proceed as Add — These are two different people who share the same name. Create a new contact record.",
                            value: "proceed_add",
                            signal: "WCC005_MGR_ADD"
                        },
                        {
                            label: "Proceed as Edit — This is the same person whose email has changed. Update the existing record.",
                            value: "proceed_edit",
                            signal: "WCC005_MGR_EDIT"
                        },
                        {
                            label: "Send RFI to Client — Request clarification from the client before making any changes.",
                            value: "send_rfi",
                            signal: "WCC005_MGR_RFI"
                        }
                    ]
                }
            }
        ]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Manager review - identity conflict decision pending");

    // Wait for manager to click "Send RFI to Client"
    await waitForSignal("WCC005_MGR_RFI");

    // ==========================================
    // STEP 5: RFI EMAIL DRAFT (email-based HITL)
    // ==========================================
    updateProcessLog(PROCESS_ID, {
        id: "step-5",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Drafting RFI email to client for identity clarification...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Drafting RFI email...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-5",
        title: "RFI email drafted - review and send to client",
        status: "warning",
        reasoning: [
            "Manager decision: Send RFI to client for clarification",
            "Using Request for Information email template",
            "Email asks client to confirm whether this is the same individual or a different person",
            "Includes both email addresses for reference",
            "No system changes will be made until client responds"
        ],
        artifacts: [{
            id: "art-rfi-email", type: "email_draft", label: "RFI: Identity Clarification Request",
            data: {
                isIncoming: false,
                to: "hr@acme.com",
                cc: "admin@acme.com",
                subject: "Request for Information: Contact Identity Clarification - GPID 33456",
                body: "Dear Acme Industries HR Team,\n\nWe received a Client Contact Change Form requesting to add a new contact to your WEX Health account (GPID 33456):\n\n  Name: Jane Smith\n  Email: jane.smith@acme.com\n  Roles: Primary, Portal Access, File Notifications\n\nHowever, we already have a contact on file with the same name but a different email address:\n\n  Existing Contact: Jane Smith\n  Existing Email: jsmith@acme.com\n  Current Roles: Portal Access, File Errors\n\nTo proceed accurately, we need your confirmation on one of the following:\n\n1. Same person — Jane Smith's email has changed from jsmith@acme.com to jane.smith@acme.com, and her roles should be updated. (We will process this as an edit to the existing record.)\n\n2. Different person — This is a different individual who happens to share the same name. (We will create a new, separate contact record.)\n\nPlease respond at your earliest convenience so we can complete this request.\n\nThank you,\nWEX Health Contact Change Team"
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Draft Review: RFI email pending");

    // Wait for human to send the RFI email
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

    await waitForEmail();

    updateProcessLog(PROCESS_ID, {
        id: "step-5",
        title: "RFI email sent to client - awaiting response",
        status: "success",
        reasoning: [
            "Manager decision: Send RFI to client for clarification",
            "Using Request for Information email template",
            "Email asks client to confirm whether this is the same individual or a different person",
            "Includes both email addresses for reference",
            "No system changes will be made until client responds"
        ],
        artifacts: [{
            id: "art-rfi-email", type: "email_draft", label: "RFI: Identity Clarification Request",
            data: {
                isIncoming: false,
                isSent: true,
                to: "hr@acme.com",
                cc: "admin@acme.com",
                subject: "Request for Information: Contact Identity Clarification - GPID 33456",
                body: "Dear Acme Industries HR Team,\n\nWe received a Client Contact Change Form requesting to add a new contact to your WEX Health account (GPID 33456):\n\n  Name: Jane Smith\n  Email: jane.smith@acme.com\n  Roles: Primary, Portal Access, File Notifications\n\nHowever, we already have a contact on file with the same name but a different email address:\n\n  Existing Contact: Jane Smith\n  Existing Email: jsmith@acme.com\n  Current Roles: Portal Access, File Errors\n\nTo proceed accurately, we need your confirmation on one of the following:\n\n1. Same person — Jane Smith's email has changed from jsmith@acme.com to jane.smith@acme.com, and her roles should be updated. (We will process this as an edit to the existing record.)\n\n2. Different person — This is a different individual who happens to share the same name. (We will create a new, separate contact record.)\n\nPlease respond at your earliest convenience so we can complete this request.\n\nThank you,\nWEX Health Contact Change Team"
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "RFI email sent - awaiting client response");
    await delay(1500);

    // ==========================================
    // STEP 6: CASE PAUSED + LEARNING NOTE
    // ==========================================
    updateProcessLog(PROCESS_ID, {
        id: "step-6",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Documenting case status, escalation path, and process recommendation...",
        status: "processing"
    });
    await updateProcessListStatus(PROCESS_ID, "In Progress", "Documenting case status...");
    await delay(2000);

    updateProcessLog(PROCESS_ID, {
        id: "step-6",
        title: "Case paused pending client RFI response — process improvement noted",
        status: "completed",
        reasoning: [
            "Identity conflict flagged: Jane Smith exists with different email on same account",
            "Escalation path: Analyst → Manager → RFI to Client",
            "RFI email sent to hr@acme.com requesting identity clarification",
            "No system changes made — all updates blocked until client confirms",
            "",
            "📋 Process Improvement Recommendation:",
            "In this case, the analyst escalated to a manager, who then chose to send an RFI.",
            "The escalation added a round-trip delay without changing the outcome.",
            "RECOMMENDATION: For future identity conflict cases, default to sending an RFI",
            "to the client directly. This resolves the ambiguity faster and avoids the",
            "unnecessary escalation step. Reserve manager escalation for cases where the",
            "analyst has additional context that makes Add or Edit the clear choice.",
            "",
            "Next steps upon client response:",
            "  If same person → Reclassify as Edit, follow CC_EDIT flow",
            "  If different person → Proceed with Add, note name collision in case discussion"
        ],
        artifacts: [{
            id: "art-status", type: "json", label: "Case Status & Recommendation",
            data: {
                caseId: "WCC_005",
                status: "Needs Review",
                blockedBy: "Client RFI response — identity clarification",
                rfiSentTo: "hr@acme.com",
                rfiSentDate: new Date().toISOString().split('T')[0],
                escalationPath: "Analyst → Manager → RFI",
                processRecommendation: "Default to RFI for identity conflicts; skip manager escalation",
                pendingActions: [
                    "Await client response to RFI",
                    "If same person: process as Edit (update email + roles)",
                    "If different person: process as Add (create new record)"
                ]
            }
        }]
    });
    await updateProcessListStatus(PROCESS_ID, "Needs Review", "Pending client RFI response — identity clarification");

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();
