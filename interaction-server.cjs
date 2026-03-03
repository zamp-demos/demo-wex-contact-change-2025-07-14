try { require('dotenv').config(); } catch(e) {}

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.VITE_MODEL || 'gemini-2.5-flash';

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const KB_PATH = path.join(__dirname, 'src/data/knowledgeBase.md');
const FEEDBACK_QUEUE_PATH = path.join(__dirname, 'feedbackQueue.json');
const KB_VERSIONS_PATH = path.join(DATA_DIR, 'kbVersions.json');
const SIGNAL_FILE = path.join(__dirname, 'interaction-signals.json');

let state = { sent: false, confirmed: false, signals: {} };
const runningProcesses = new Map();

// Initialize files on startup
const BASE_PROCESSES = path.join(DATA_DIR, 'base_processes.json');
const PROCESSES_FILE = path.join(DATA_DIR, 'processes.json');
if (!fs.existsSync(PROCESSES_FILE) && fs.existsSync(BASE_PROCESSES)) {
    fs.copyFileSync(BASE_PROCESSES, PROCESSES_FILE);
}
if (!fs.existsSync(SIGNAL_FILE)) {
    fs.writeFileSync(SIGNAL_FILE, JSON.stringify({ APPROVE_HIPAA_EMAIL: false, ESCALATE_TO_MANAGER: false, MANAGER_DECISION_RFI: false, WCC005_PROCEED: false, WCC005_CANCEL: false, WCC005_MGR_RFI: false, WCC006_REACTIVATE: false, WCC006_CREATE_NEW: false, WCC006_OTHER: false }, null, 4));
}
if (!fs.existsSync(FEEDBACK_QUEUE_PATH)) fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
if (!fs.existsSync(KB_VERSIONS_PATH)) fs.writeFileSync(KB_VERSIONS_PATH, '[]');
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const mimeTypes = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webm': 'video/webm',
    '.pdf': 'application/pdf', '.md': 'text/markdown', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

const readBody = (req) => new Promise((resolve) => {
    let body = ''; req.on('data', c => body += c); req.on('end', () => resolve(body));
});

async function callGemini(messages, systemPrompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: systemPrompt });
    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }]
    }));
    const chat = model.startChat({ history });
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    return result.response.text();
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cleanPath = url.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders); res.end(); return;
    }

    // ---- RESET ----
    if (cleanPath === '/reset') {
        state = { sent: false, confirmed: false, signals: {} };
        console.log('Demo Reset Triggered');

        fs.writeFileSync(SIGNAL_FILE, JSON.stringify({ APPROVE_HIPAA_EMAIL: false, ESCALATE_TO_MANAGER: false, MANAGER_DECISION_RFI: false, WCC005_PROCEED: false, WCC005_CANCEL: false, WCC005_MGR_RFI: false, WCC006_REACTIVATE: false, WCC006_CREATE_NEW: false, WCC006_OTHER: false }, null, 4));

        runningProcesses.forEach((proc, id) => {
            try { process.kill(-proc.pid, 'SIGKILL'); } catch (e) { }
        });
        runningProcesses.clear();

        exec('pkill -9 -f "node(.*)simulation_scripts" || true', (err) => {
            setTimeout(() => {
                const cases = [
                    {
                        id: "WCC_001", name: "Julie Martinez - New Primary Contact Add",
                        category: "Contact Change Processing", stockId: "GPID-54321",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Client",
                        actionType: "Add", requestSource: "Client Contact Change Form"
                    },
                    {
                        id: "WCC_002", name: "Bob Jones - Aptia Consultant Add (Multi-Client)",
                        category: "Contact Change Processing", stockId: "GPID-78901",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Consultant",
                        actionType: "Add", requestSource: "Aptia365 WEX Health Access Request Form"
                    },
                    {
                        id: "WCC_003", name: "Sarah Chen - Contact Removal with Role Gap",
                        category: "Contact Change Processing", stockId: "GPID-67890",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Client",
                        actionType: "Remove", requestSource: "Email Request"
                    },
                    {
                        id: "WCC_004", name: "David Park - Divisional COBRA Access Setup",
                        category: "Contact Change Processing", stockId: "GPID-45678",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Client",
                        actionType: "Add", requestSource: "LEAP Contact Change Queue"
                    },
                    {
                        id: "WCC_005", name: "Jane Smith - Conflicting Identity on Contact Add",
                        category: "Contact Change Processing", stockId: "GPID-33210",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Client",
                        actionType: "Add", requestSource: "Client Contact Change Form"
                    },
                    {
                        id: "WCC_006", name: "Mark Reynolds - Deactivated Contact Rediscovery",
                        category: "Contact Change Processing", stockId: "GPID-44789",
                        year: new Date().toISOString().split('T')[0], status: "In Progress",
                        currentStatus: "Initializing...", contactType: "Client",
                        actionType: "Add", requestSource: "Client Contact Change Form"
                    }
                ];
                fs.writeFileSync(PROCESSES_FILE, JSON.stringify(cases, null, 4));
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
                fs.writeFileSync(KB_VERSIONS_PATH, '[]');

                // Reset process log files
                cases.forEach(c => {
                    fs.writeFileSync(path.join(DATA_DIR, `process_${c.id}.json`),
                        JSON.stringify({ logs: [], keyDetails: {}, sidebarArtifacts: [] }, null, 4));
                });

                const scripts = [
                    { file: 'wcc_story_1_happy_path.cjs', id: 'WCC_001' },
                    { file: 'wcc_story_2_happy_path.cjs', id: 'WCC_002' },
                    { file: 'wcc_story_3_needs_attention.cjs', id: 'WCC_003' },
                    { file: 'wcc_story_4_needs_attention.cjs', id: 'WCC_004' },
                    { file: 'wcc_story_5_needs_attention.cjs', id: 'WCC_005' },
                    { file: 'wcc_story_6_done.cjs', id: 'WCC_006' }
                ];

                let totalDelay = 0;
                scripts.forEach((script) => {
                    setTimeout(() => {
                        const scriptPath = path.join(__dirname, 'simulation_scripts', script.file);
                        const child = exec(
                            `node "${scriptPath}" > "${scriptPath}.log" 2>&1`,
                            (error) => {
                                if (error && error.code !== 0) console.error(`${script.file} error:`, error.message);
                                runningProcesses.delete(script.id);
                            }
                        );
                        runningProcesses.set(script.id, child);
                    }, totalDelay * 1000);
                    totalDelay += 2;
                });
            }, 1000);
        });

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ---- EMAIL STATUS ----
    if (cleanPath === '/email-status') {
        if (req.method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ sent: state.sent }));
        } else if (req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            state.sent = body.sent;
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }
        return;
    }

    // ---- SIGNAL ----
    if (cleanPath === '/signal' && req.method === 'POST') {
        const body = JSON.parse(await readBody(req));
        const signalId = body.signalId || body.signal;
        try {
            let signals = {};
            if (fs.existsSync(SIGNAL_FILE)) signals = JSON.parse(fs.readFileSync(SIGNAL_FILE, 'utf8'));
            signals[signalId] = true;
            const tmp = SIGNAL_FILE + '.' + Math.random().toString(36).substring(7) + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(signals, null, 4));
            fs.renameSync(tmp, SIGNAL_FILE);
        } catch (e) { console.error('Signal write error:', e); }
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (cleanPath === '/signal-status' && req.method === 'GET') {
        let signals = {};
        try { if (fs.existsSync(SIGNAL_FILE)) signals = JSON.parse(fs.readFileSync(SIGNAL_FILE, 'utf8')); } catch (e) { }
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(signals));
        return;
    }

    // ---- UPDATE STATUS ----
    if (cleanPath === '/api/update-status' && req.method === 'POST') {
        const body = JSON.parse(await readBody(req));
        try {
            const processes = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
            const idx = processes.findIndex(p => p.id === String(body.id));
            if (idx !== -1) {
                processes[idx].status = body.status;
                processes[idx].currentStatus = body.currentStatus;
                fs.writeFileSync(PROCESSES_FILE, JSON.stringify(processes, null, 4));
            }
        } catch (e) { console.error('Update status error:', e); }
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ---- CHAT (KB + Work-with-Pace) ----
    if (cleanPath === '/api/chat' && req.method === 'POST') {
        try {
            const parsed = JSON.parse(await readBody(req));
            let messages, systemPrompt;

            if (parsed.messages && parsed.systemPrompt) {
                messages = parsed.messages;
                systemPrompt = parsed.systemPrompt;
            } else {
                const kb = parsed.knowledgeBase || '';
                systemPrompt = `You are a helpful assistant. Answer questions based on this knowledge base:\n\n${kb}\n\nBe concise and accurate.`;
                messages = [];
                if (parsed.history) {
                    parsed.history.forEach(h => messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }));
                }
                messages.push({ role: 'user', content: parsed.message });
            }

            const response = await callGemini(messages, systemPrompt);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ response }));
        } catch (e) {
            console.error('Chat error:', e);
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ---- FEEDBACK QUESTIONS ----
    if (cleanPath === '/api/feedback/questions' && req.method === 'POST') {
        try {
            const parsed = JSON.parse(await readBody(req));
            const { feedback, knowledgeBase } = parsed;
            const systemPrompt = `You are a knowledge base editor. Given user feedback and the current KB, generate exactly 3 clarifying questions to understand the feedback better. Return as JSON: { "questions": ["Q1?", "Q2?", "Q3?"] }`;
            const messages = [{ role: 'user', content: `Feedback: ${feedback}\n\nCurrent KB:\n${knowledgeBase}` }];
            const response = await callGemini(messages, systemPrompt);
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(cleaned);
        } catch (e) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ---- FEEDBACK SUMMARIZE ----
    if (cleanPath === '/api/feedback/summarize' && req.method === 'POST') {
        try {
            const parsed = JSON.parse(await readBody(req));
            const { feedback, questions, answers, knowledgeBase } = parsed;
            const systemPrompt = `Summarize the user's feedback into a clear, actionable proposal for updating the knowledge base. Return as JSON: { "summary": "..." }`;
            const messages = [{ role: 'user', content: `Feedback: ${feedback}\nQuestions: ${JSON.stringify(questions)}\nAnswers: ${JSON.stringify(answers)}\nCurrent KB:\n${knowledgeBase}` }];
            const response = await callGemini(messages, systemPrompt);
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(cleaned);
        } catch (e) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ---- FEEDBACK QUEUE ----
    if (cleanPath === '/api/feedback/queue') {
        if (req.method === 'GET') {
            const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ queue }));
        } else if (req.method === 'POST') {
            const item = JSON.parse(await readBody(req));
            const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
            queue.push({ ...item, status: 'pending', timestamp: new Date().toISOString() });
            fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }
        return;
    }

    // ---- FEEDBACK QUEUE DELETE ----
    if (cleanPath.startsWith('/api/feedback/queue/') && req.method === 'DELETE') {
        const id = cleanPath.split('/').pop();
        let queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
        queue = queue.filter(item => item.id !== id);
        fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ---- FEEDBACK APPLY ----
    if (cleanPath === '/api/feedback/apply' && req.method === 'POST') {
        try {
            const { feedbackId } = JSON.parse(await readBody(req));
            const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
            const item = queue.find(i => i.id === feedbackId);
            if (!item) { res.writeHead(404, corsHeaders); res.end(JSON.stringify({ error: 'Not found' })); return; }

            const currentKB = fs.readFileSync(KB_PATH, 'utf8');
            const previousFile = `snapshot_before_${Date.now()}.md`;
            fs.writeFileSync(path.join(SNAPSHOTS_DIR, previousFile), currentKB);

            const systemPrompt = `You are a knowledge base editor. Apply the following feedback to update the knowledge base. Return ONLY the updated markdown content, nothing else.`;
            const messages = [{ role: 'user', content: `Feedback to apply:\n${item.summary}\n\nCurrent Knowledge Base:\n${currentKB}` }];
            const updatedKB = await callGemini(messages, systemPrompt);

            fs.writeFileSync(KB_PATH, updatedKB);
            const snapshotFile = `snapshot_after_${Date.now()}.md`;
            fs.writeFileSync(path.join(SNAPSHOTS_DIR, snapshotFile), updatedKB);

            const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
            versions.push({ id: `v${versions.length + 1}`, timestamp: new Date().toISOString(), snapshotFile, previousFile, changes: [item.summary] });
            fs.writeFileSync(KB_VERSIONS_PATH, JSON.stringify(versions, null, 4));

            item.status = 'applied';
            fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));

            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, content: updatedKB }));
        } catch (e) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ---- KB CONTENT ----
    if (cleanPath === '/api/kb/content' && req.method === 'GET') {
        const versionId = url.searchParams.get('versionId');
        if (versionId) {
            const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
            const version = versions.find(v => v.id === versionId);
            if (version) {
                const content = fs.readFileSync(path.join(SNAPSHOTS_DIR, version.snapshotFile), 'utf8');
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ content }));
            } else {
                res.writeHead(404, corsHeaders); res.end(JSON.stringify({ error: 'Version not found' }));
            }
        } else {
            const content = fs.readFileSync(KB_PATH, 'utf8');
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content }));
        }
        return;
    }

    // ---- KB VERSIONS ----
    if (cleanPath === '/api/kb/versions' && req.method === 'GET') {
        const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ versions }));
        return;
    }

    // ---- KB SNAPSHOT ----
    if (cleanPath.startsWith('/api/kb/snapshot/') && req.method === 'GET') {
        const filename = cleanPath.split('/').pop();
        const filePath = path.join(SNAPSHOTS_DIR, filename);
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/markdown' });
            res.end(fs.readFileSync(filePath, 'utf8'));
        } else { res.writeHead(404, corsHeaders); res.end('Not found'); }
        return;
    }

    // ---- KB UPDATE ----
    if (cleanPath === '/api/kb/update' && req.method === 'POST') {
        const { content } = JSON.parse(await readBody(req));
        fs.writeFileSync(KB_PATH, content);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // ---- DEBUG ----
    if (cleanPath === '/debug-paths') {
        const info = { dataDir: DATA_DIR, exists: fs.existsSync(DATA_DIR), files: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [] };
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
    }

    // ---- STATIC FILES ----
    let filePath = path.join(PUBLIC_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { ...corsHeaders, 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, corsHeaders); res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`WEX Contact Change demo server running on port ${PORT}`);
});
