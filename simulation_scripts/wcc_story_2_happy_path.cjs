const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "WCC_002";
const CASE_NAME = "Bob Jones - Aptia Consultant Add (Multi-Client)";

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

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "Contact Name": "Bob Jones",
            "GPID": "78901",
            "Contact Type": "Consultant",
            "Action": "Add",
            "Request Source": "Aptia365 Access Request Form",
            "Aptia Role": "Program Level",
            "Client Count": "3 accounts"
        }
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Reviewing Aptia365 WEX Health Access Request Form...",
            title_s: "Aptia365 form validated - Program level role identified",
            reasoning: [
                "Form type: Aptia365 WEX Health Access Request Form",
                "Contact: Bob Jones (bob.jones@consultfirm.com)",
                "Aptia Role: Program Level",
                "Program level = portal access by default, no report/file notifications",
                "EEID: APT-2847",
                "Assigned to 3 client accounts: GPID-78901, GPID-78902, GPID-78903"
            ],
            artifacts: [
        {
          id: "art-onbase-review",
          type: "video",
          label: "Browser Agent - OnBase Unity Review",
          videoPath: "/data/wcc_002_step1_onbase.webm"
        },
        {
                id: "art-form", type: "file", label: "Aptia365 Access Request Form",
                pdfPath: "/data/wcc002_aptia_access_form.pdf"
            }]
        },
        {
            id: "step-2",
            title_p: "Checking Associated Companies for GPID 78901...",
            title_s: "Associated company detected - WEX GPID with Aptia associated",
            reasoning: [
                "Located client account GPID 78901 in OnBase Unity",
                "Associated Companies field: Aptia GPID-78901A found",
                "Rule: WEX GPID with Aptia associated = make updates on WEX GPID",
                "Then submit case to Aptia SA team using Aptia GPID",
                "Aptia SA will verify with client",
                "Proceeding with updates on WEX side first"
            ],
            artifacts: [{
                id: "art-assoc", type: "json", label: "Associated Companies Check",
                data: {
                    wexGpid: "78901",
                    aptiaGpid: "78901A",
                    associationType: "WEX GPID with Aptia associated",
                    action: "Update on WEX GPID, submit case to Aptia SA",
                    aptiaVerification: "Required"
                }
            }]
        },
        {
            id: "step-3",
            title_p: "Creating consultant contact in OnBase Unity...",
            title_s: "Consultant created in OnBase Unity with Aptia details",
            reasoning: [
                "Searched for Bob Jones using 'Add existing' icon - no results found",
                "Clicked 'Create Object' - entered name, email",
                "Included Aptia EEID: APT-2847",
                "Checked form for GOSS role - not applicable (Program level)",
                "Uploaded change form - Description: 'Case WCC_002, Add'",
                "Aptia role is Program level - linked Aptia consulting office",
                "Saved contact record for GPID 78901",
                "Added existing contact to GPID 78902 via 'Add existing'",
                "Added existing contact to GPID 78903 via 'Add existing'"
            ],
            artifacts: [{
                id: "art-onbase-consultant",
                type: "video",
                label: "Browser Agent - OnBase Unity Consultant Creation",
                videoPath: "/data/wcc_002_step3_onbase_consultant.webm"
            }]
        },
        {
            id: "step-4",
            title_p: "Submitting case to Aptia SA team for verification...",
            title_s: "Case submitted to Aptia SA team using Aptia GPID-78901A",
            reasoning: [
                "Created sub-case for Aptia SA team",
                "Using Aptia GPID: 78901A for the case submission",
                "Aptia SA will verify the contact addition with client",
                "Cross-team coordination logged in case notes"
            ],
            artifacts: [{
                id: "art-aptia-case", type: "json", label: "Aptia SA Case Submission",
                data: {
                    caseType: "Sub-case to Aptia SA",
                    aptiaGpid: "78901A",
                    action: "Verify consultant addition with client",
                    consultant: "Bob Jones",
                    status: "Submitted"
                }
            }]
        },
        {
            id: "step-5",
            title_p: "Adding consultant to Benefits Admin Portal (multi-client)...",
            title_s: "Portal access granted with name-GPID username format",
            reasoning: [
                "Located client GPID 78901 in Benefits Admin Portal",
                "Clicked 'Manage profile' under Employer Setup",
                "Completed Main Contact Info fields (matching OnBase Unity exactly)",
                "Clicked 'Add' then 'Submit'",
                "Clicked 'Manage employer portal users' → 'Add New User'",
                "Selected client from Employer dropdown → clicked 'Grant Access'",
                "Consultant has multiple client accounts - using name-GPID format",
                "Username set to: bobjones-78901",
                "Left 'Email Password' as No",
                "Selected all roles except Benefits Administrator",
                "Clicked 'Add' - no red alert (name-GPID format already applied)",
                "No report/file email notifications (Aptia Program level rule)",
                "Repeated for GPID 78902 (username: bobjones-78902) and GPID 78903 (username: bobjones-78903)"
            ],
            artifacts: [{
                id: "art-ben-alert", type: "json", label: "Benefits Portal - Red Alert Handled",
                data: {
                    system: "Benefits Admin Portal",
                    username: "bobjones-78901",
                    format: "name-GPID (multi-client consultant)",
                    redAlert: true,
                    resolution: "Expected for consultant - name-GPID format already applied",
                    notifications: "Disabled (Aptia Program level)"
                }
            }]
        },
        {
            id: "step-6",
            title_p: "Adding consultant to COBRA Admin Portal...",
            title_s: "COBRA contact added with name-GPID email format",
            reasoning: [
                "Located client GPID 78901 in COBRA Admin Portal",
                "Verified 'Allow Client SSO' is checked on General tab",
                "Selected Contacts tab → 'Add a new Contact'",
                "Entered contact info, Contact Type: Other Contact",
                "Multi-client consultant: used name-GPID in Email field",
                "Email field set to: bobjones-78901",
                "Ensured 'Allow SSO' is checked",
                "Clicked 'Insert'",
                "Repeated for GPID 78902 (email: bobjones-78902) and GPID 78903 (email: bobjones-78903)"
            ],
            artifacts: [{
                id: "art-cobra-review", type: "video",
                label: "Browser Agent - COBRA Admin Portal",
                videoPath: "/data/wcc_002_step6_cobra.webm"
            }]
        },
        {
            id: "step-7",
            title_p: "Configuring SSO for consultant across client accounts...",
            title_s: "SSO configured - consultant linked via Consultant Employer List",
            reasoning: [
                "Opened LEAP - located client GPID 78901",
                "Found Bob Jones in Consultant Contacts",
                "Clicked contact first name (kept window open)",
                "Opened COBRA admin portal in new window",
                "Copied email from COBRA contact Email field",
                "Returned to LEAP",
                "Consultant contact: clicked 'Consultant Employer List'",
                "Pasted into Cobra UserName for GPID 78901",
                "Repeated for GPIDs 78902 and 78903",
                "SSO active within 24 hours"
            ]
        },
        {
            id: "step-8",
            title_p: "Finalizing case and generating summary...",
            title_s: "Consultant add complete - all systems updated, Aptia SA notified",
            reasoning: [
                "OnBase Unity: Consultant created with Aptia EEID and office linkage",
                "Benefits Admin Portal: Portal access with name-GPID format",
                "COBRA Admin Portal: Contact added with name-GPID, SSO enabled",
                "Aptia SA case submitted for client verification",
                "No Plan Document role - Relius not required",
                "Discussion added to case, marked 'Complete and Double Check'"
            ],
            artifacts: [{
                id: "art-summary", type: "json", label: "Completion Summary",
                data: {
                    caseId: "WCC_002",
                    contact: "Bob Jones",
                    type: "Consultant (Aptia Program Level)",
                    gpids: ["78901", "78902", "78903"],
                    usernameFormat: "bobjones-78901 (name-GPID)",
                    systemsUpdated: ["OnBase Unity", "Benefits Admin Portal", "COBRA Admin Portal"],
                    aptiaCase: "Submitted to Aptia SA",
                    ssoConfigured: true,
                    status: "Complete"
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
        await delay(2200);

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
