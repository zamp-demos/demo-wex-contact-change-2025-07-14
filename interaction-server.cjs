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
    fs.writeFileSync(SIGNAL_FILE, JSON.stringify({ APPROVE_HIPAA_EMAIL: false, ESCALATE_TO_MANAGER: false, MANAGER_DECISION_RFI: false }, null, 4));
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

        fs.writeFileSync(SIGNAL_FILE, JSON.stringify({ APPROVE_HIPAA_EMAIL: false, ESCALATE_TO_MANAGER: false, MANAGER_DECISION_RFI: false }, null, 4));

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
