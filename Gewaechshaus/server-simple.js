#!/usr/bin/env node
/**
 * Project Iron Garden Steuerungssystem - Raspberry Pi Optimierte Version
 * Minimale Abhängigkeiten, geringer Ressourcenverbrauch
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ============== KONFIGURATION ==============
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'data.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'project-iron-garden-fixed-secret-key-2024';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// ============== EINFACHE DATENBANK (JSON-Datei) ==============
function createEmptyData() {
    return {
        zones: [],
        slots: [],
        plants: [],
        users: [],
        logs: [],
        auditLogs: [],
        forumPosts: [],
        settings: {},
        emailConfig: {
            smtp: {
                host: '',
                port: 587,
                user: '',
                pass: '',
                from: '',
                encryption: 'starttls' // none | ssl | starttls
            },
            templates: [],
            defaultTemplateId: null,
            recipients: []
        },
        emailLogs: [],
        rfidDevices: [],
        rfidCards: [],
        rfidAccessLogs: []
    };
}

function normalizeData(loaded) {
    const base = createEmptyData();
    if (!loaded || typeof loaded !== 'object') return base;
    const merged = { ...base, ...loaded };
    return {
        ...merged,
        zones: Array.isArray(merged.zones) ? merged.zones : base.zones,
        slots: Array.isArray(merged.slots) ? merged.slots : base.slots,
        plants: Array.isArray(merged.plants) ? merged.plants : base.plants,
        users: Array.isArray(merged.users) ? merged.users : base.users,
        logs: Array.isArray(merged.logs) ? merged.logs : base.logs,
        auditLogs: Array.isArray(merged.auditLogs) ? merged.auditLogs : base.auditLogs,
        forumPosts: Array.isArray(merged.forumPosts) ? merged.forumPosts : base.forumPosts,
        settings: merged.settings && typeof merged.settings === 'object' ? merged.settings : base.settings,
        emailConfig: normalizeEmailConfig(merged.emailConfig),
        emailLogs: Array.isArray(merged.emailLogs) ? merged.emailLogs : base.emailLogs,
        rfidDevices: Array.isArray(merged.rfidDevices) ? merged.rfidDevices : base.rfidDevices,
        rfidCards: Array.isArray(merged.rfidCards) ? merged.rfidCards : base.rfidCards,
        rfidAccessLogs: Array.isArray(merged.rfidAccessLogs) ? merged.rfidAccessLogs.slice(0, 2000) : base.rfidAccessLogs
    };
}

function normalizeEmailConfig(cfg) {
    const base = {
        smtp: {
            host: '',
            port: 587,
            user: '',
            pass: '',
            from: '',
            encryption: 'starttls'
        },
        templates: [],
        defaultTemplateId: null,
        recipients: []
    };
    const data = cfg && typeof cfg === 'object' ? cfg : {};
    return {
        smtp: {
            host: typeof data.smtp?.host === 'string' ? data.smtp.host : base.smtp.host,
            port: Number.isFinite(parseInt(data.smtp?.port, 10)) ? parseInt(data.smtp.port, 10) : base.smtp.port,
            user: typeof data.smtp?.user === 'string' ? data.smtp.user : base.smtp.user,
            pass: typeof data.smtp?.pass === 'string' ? data.smtp.pass : base.smtp.pass,
            from: typeof data.smtp?.from === 'string' ? data.smtp.from : base.smtp.from,
            encryption: ['none', 'ssl', 'starttls'].includes(data.smtp?.encryption) ? data.smtp.encryption : base.smtp.encryption
        },
        templates: Array.isArray(data.templates) ? data.templates : base.templates,
        defaultTemplateId: data.defaultTemplateId || null,
        recipients: Array.isArray(data.recipients) ? data.recipients.filter(r => typeof r === 'string') : base.recipients
    };
}

let data = createEmptyData();

function ensureAdminUser() {
    if (!Array.isArray(data.users)) data.users = [];
    if (data.users.length === 0) {
        data.users.push({
            id: 1,
            username: ADMIN_USER,
            password: hashPassword(ADMIN_PASS),
            role: 'ADMIN',
            created_at: new Date().toISOString()
        });
        dataChanged = true;
        log('INFO', 'Admin-User erstellt');
        if (ADMIN_PASS === 'admin123') {
            log('WARN', 'Standard-Admin-Passwort aktiv - bitte ADMIN_PASS setzen');
        }
    }
}

function loadData() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            data = normalizeData(raw.trim() ? JSON.parse(raw) : null);
            ensureAdminUser();
            log('INFO', 'Daten geladen');
        } else {
            data = normalizeData(null);
            ensureAdminUser();
            saveData();
            log('INFO', 'Neue Datenbank erstellt');
        }
    } catch (e) {
        log('ERROR', 'Fehler beim Laden der Daten: ' + e.message);
        // Backup erstellen falls Datei korrupt
        if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, DB_FILE + '.backup.' + Date.now());
        }
        data = normalizeData(null);
        ensureAdminUser();
        saveData();
    }
}

function saveData() {
    try {
        const tmpFile = `${DB_FILE}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
        fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
        console.error('Fehler beim Speichern: ' + e.message);
    }
}

// Periodisches Speichern (alle 30 Sekunden wenn Änderungen)
let dataChanged = false;
setInterval(() => {
    if (dataChanged) {
        saveData();
        dataChanged = false;
    }
}, 30000);

// ============== EINFACHES PASSWORT-HASHING ==============
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
    if (!stored) return false;
    if (stored.startsWith('scrypt$')) {
        const parts = stored.split('$');
        if (parts.length !== 3) return false;
        const salt = parts[1];
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        const storedBuf = Buffer.from(parts[2], 'hex');
        const hashBuf = Buffer.from(hash, 'hex');
        if (storedBuf.length !== hashBuf.length) return false;
        return crypto.timingSafeEqual(storedBuf, hashBuf);
    }
    // Legacy SHA256 (salted with SESSION_SECRET)
    const legacy = crypto.createHash('sha256').update(password + SESSION_SECRET).digest('hex');
    return legacy === stored;
}

// ============== SESSION MANAGEMENT (In-Memory) ==============
const sessions = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 Stunden

function createSession(userId, username, role) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
        userId,
        username,
        role,
        created: Date.now()
    });
    return sessionId;
}

function getSession(sessionId) {
    if (!sessionId) return null;
    const session = sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() - session.created > SESSION_TIMEOUT) {
        sessions.delete(sessionId);
        return null;
    }
    return session;
}

function destroySession(sessionId) {
    sessions.delete(sessionId);
}

// Session-Cleanup alle 10 Minuten
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.created > SESSION_TIMEOUT) {
            sessions.delete(id);
        }
    }
}, 10 * 60 * 1000);

// ============== LOGGING ==============
function log(level, message) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message };
    
    // In Konsole ausgeben
    console.log(`[${timestamp}] ${level}: ${message}`);
    
    // In Array speichern (max 500 Einträge)
    data.logs.unshift(entry);
    if (data.logs.length > 500) {
        data.logs = data.logs.slice(0, 500);
    }
    dataChanged = true;
}

// Default Color Scheme
function getDefaultColors() {
    return {
        primary: '#3498db',
        primaryHover: '#2980b9',
        secondary: '#6b7280',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        bgGradientStart: '#667eea',
        bgGradientEnd: '#764ba2',
        bgSurface: 'rgba(255, 255, 255, 0.92)',
        bgSurfaceStrong: 'rgba(255, 255, 255, 0.96)',
        text: '#1f2937',
        textMuted: '#6b7280',
        border: 'rgba(17, 24, 39, 0.12)',
        headerBg: 'rgba(255, 255, 255, 0.96)',
        cardBg: 'rgba(255, 255, 255, 0.92)'
    };
}

// Audit Log Funktion
function addAuditLog(session, action, entityType = null, entityId = null, metadata = null) {
    const entry = {
        id: (data.auditLogs?.length || 0) + 1,
        actor_user_id: session?.userId || null,
        actor_username: session?.username || 'system',
        action,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        metadata_json: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date().toISOString()
    };
    
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.unshift(entry);
    if (data.auditLogs.length > 500) {
        data.auditLogs = data.auditLogs.slice(0, 500);
    }
    dataChanged = true;
}

function sanitizeEmailList(recipients) {
    if (!Array.isArray(recipients)) return [];
    return recipients
        .map(r => typeof r === 'string' ? r.trim() : '')
        .filter(r => r.includes('@'));
}

function getEmailConfigSafe(includePassword = false) {
    const cfg = data.emailConfig || normalizeEmailConfig();
    return {
        smtp: {
            host: cfg.smtp.host,
            port: cfg.smtp.port,
            user: cfg.smtp.user,
            from: cfg.smtp.from,
            encryption: cfg.smtp.encryption,
            ...(includePassword ? { pass: cfg.smtp.pass } : {})
        },
        templates: cfg.templates || [],
        defaultTemplateId: cfg.defaultTemplateId || null,
        recipients: cfg.recipients || []
    };
}

function createSmtpTransport() {
    const cfg = getEmailConfigSafe(true).smtp;
    if (!cfg.host || !cfg.port || !cfg.from) {
        throw new Error('SMTP unvollständig konfiguriert');
    }
    const isSecure = cfg.encryption === 'ssl';
    const transportOptions = {
        host: cfg.host,
        port: cfg.port,
        secure: isSecure,
        auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined
    };
    if (cfg.encryption === 'starttls') {
        transportOptions.requireTLS = true;
    }
    return nodemailer.createTransport(transportOptions);
}

function renderTemplateString(str, context) {
    if (!str) return '';
    return str.replace(/\{(\w+)\}/g, (_, key) => {
        const val = context && Object.prototype.hasOwnProperty.call(context, key) ? context[key] : '';
        return val !== undefined && val !== null ? String(val) : '';
    });
}

async function sendEmail({ templateId, subject, body, recipients, context }) {
    const cfg = getEmailConfigSafe(true);
    const transport = createSmtpTransport();
    let usedSubject = subject;
    let usedBody = body;
    if (templateId) {
        const tpl = (cfg.templates || []).find(t => t.id === templateId);
        if (!tpl) throw new Error('Vorlage nicht gefunden');
        usedSubject = tpl.subject;
        usedBody = tpl.body;
    }
    const finalSubject = renderTemplateString(usedSubject || '', context);
    const finalBody = renderTemplateString(usedBody || '', context);
    const info = await transport.sendMail({
        from: cfg.smtp.from,
        to: recipients.join(','),
        subject: finalSubject,
        html: finalBody,
        text: finalBody
    });
    return info;
}

function addEmailLog(entry) {
    if (!data.emailLogs) data.emailLogs = [];
    data.emailLogs.unshift({
        id: data.emailLogs.length ? Math.max(...data.emailLogs.map(l => l.id || 0)) + 1 : 1,
        ...entry,
        timestamp: new Date().toISOString()
    });
    data.emailLogs = data.emailLogs.slice(0, 200);
    dataChanged = true;
}

// ============== MIME TYPES ==============
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// ============== AVATAR UPLOAD DIRECTORY ==============
const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============== HTTP HELPER ==============
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) { // 1MB limit
                req.destroy();
                reject(new Error('Body too large'));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Parse multipart/form-data for avatar upload
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        if (!boundaryMatch) {
            return reject(new Error('No boundary found'));
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2];

        const chunks = [];
        let totalSize = 0;
        const maxSize = 2 * 1024 * 1024; // 2MB

        req.on('data', chunk => {
            totalSize += chunk.length;
            if (totalSize > maxSize) {
                req.destroy();
                return reject(new Error('File too large'));
            }
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const boundaryBuffer = Buffer.from('--' + boundary);

                // Find first boundary
                let start = buffer.indexOf(boundaryBuffer);
                if (start === -1) return reject(new Error('Invalid multipart'));

                // Find second boundary (end of first part)
                start += boundaryBuffer.length + 2; // skip \r\n
                const end = buffer.indexOf(boundaryBuffer, start);
                if (end === -1) return reject(new Error('Invalid multipart'));

                const part = buffer.slice(start, end - 2); // -2 for \r\n before boundary

                // Parse headers
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd === -1) return reject(new Error('Invalid part headers'));

                const headerStr = part.slice(0, headerEnd).toString('utf8');
                const fileData = part.slice(headerEnd + 4);

                // Extract filename
                const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
                const filename = filenameMatch ? filenameMatch[1] : 'upload';

                // Extract content-type
                const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
                const mimeType = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';

                resolve({ filename, mimeType, data: fileData });
            } catch (e) {
                reject(e);
            }
        });

        req.on('error', reject);
    });
}

function getCookie(req, name) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
}

// Global request context for CORS
let currentRequestOrigin = '';

function isAllowedOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    if (ALLOWED_ORIGINS.length > 0) {
        return ALLOWED_ORIGINS.includes(origin);
    }
    try {
        const originUrl = new URL(origin);
        return originUrl.host === req.headers.host;
    } catch {
        return false;
    }
}

function setSecurityHeaders(res, req = null) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    const isSecure = req && (req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https');
    if (isSecure) {
        res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
}

function sendJson(res, data, status = 200, req = null) {
    setSecurityHeaders(res, req);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...(currentRequestOrigin ? { 'Access-Control-Allow-Origin': currentRequestOrigin } : {}),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        ...(currentRequestOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {})
    });
    res.end(JSON.stringify(data));
}

function sendError(res, message, status = 400, req = null) {
    sendJson(res, { error: message }, status, req);
}

function sendFile(res, filePath, req = null) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            setSecurityHeaders(res, req);
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        setSecurityHeaders(res, req);
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
    });
}

// ============== RATE LIMITING ==============
const rateLimits = new Map();
const RATE_LIMIT = 100; // Requests pro Minute
const AUTH_RATE_LIMIT = 10; // Login-Versuche pro 10 Minuten
const authRateLimits = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimits.get(ip);
    
    if (!record || now - record.start > 60000) {
        rateLimits.set(ip, { start: now, count: 1 });
        return true;
    }
    
    if (record.count >= RATE_LIMIT) {
        return false;
    }
    
    record.count++;
    return true;
}

function checkAuthRateLimit(ip) {
    const now = Date.now();
    const record = authRateLimits.get(ip);
    const windowMs = 10 * 60 * 1000;
    
    if (!record || now - record.start > windowMs) {
        authRateLimits.set(ip, { start: now, count: 1 });
        return true;
    }
    
    if (record.count >= AUTH_RATE_LIMIT) {
        return false;
    }
    
    record.count++;
    return true;
}

// Cleanup alle 5 Minuten
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimits.entries()) {
        if (now - record.start > 60000) {
            rateLimits.delete(ip);
        }
    }
    for (const [ip, record] of authRateLimits.entries()) {
        if (now - record.start > 10 * 60 * 1000) {
            authRateLimits.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// ============== RFID HELPERS ==============
const rfidRateLimits = {};

function checkRfidRateLimit(deviceId) {
    const now = Date.now();
    const record = rfidRateLimits[deviceId];
    if (!record || now > record.resetAt) {
        rfidRateLimits[deviceId] = { count: 1, resetAt: now + 60000 };
        return true;
    }
    if (record.count >= 60) return false;
    record.count++;
    return true;
}

// Cleanup RFID rate limits
setInterval(() => {
    const now = Date.now();
    for (const id of Object.keys(rfidRateLimits)) {
        if (now > rfidRateLimits[id].resetAt) delete rfidRateLimits[id];
    }
}, 60000);

function generateApiKey() {
    const raw = crypto.randomBytes(32).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(salt + raw).digest('hex');
    return { raw, stored: `sha256$${salt}$${hash}` };
}

function verifyApiKey(providedKey, storedKey) {
    if (!providedKey || !storedKey) return false;
    const parts = storedKey.split('$');
    if (parts.length !== 3 || parts[0] !== 'sha256') return false;
    const salt = parts[1];
    const storedHash = parts[2];
    const checkHash = crypto.createHash('sha256').update(salt + providedKey).digest('hex');
    return checkHash === storedHash;
}

function authenticateDevice(req) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return null;
    return data.rfidDevices.find(d => verifyApiKey(apiKey, d.apiKey));
}

function validateUid(uid) {
    if (!uid || typeof uid !== 'string') return false;
    return /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){2,6}$/.test(uid.trim());
}

function validateDeviceId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[a-zA-Z0-9-]{3,50}$/.test(id);
}

function sanitizeName(name, maxLen = 100) {
    if (!name || typeof name !== 'string') return '';
    return name.replace(/<[^>]*>/g, '').trim().substring(0, maxLen);
}

function addRfidAccessLog(entry) {
    if (!data.rfidAccessLogs) data.rfidAccessLogs = [];
    const newId = data.rfidAccessLogs.length > 0 ? Math.max(...data.rfidAccessLogs.map(l => l.id || 0)) + 1 : 1;
    data.rfidAccessLogs.unshift({ id: newId, timestamp: new Date().toISOString(), ...entry });
    if (data.rfidAccessLogs.length > 2000) data.rfidAccessLogs = data.rfidAccessLogs.slice(0, 2000);
    dataChanged = true;
}

function getCardVersionHash() {
    const cards = data.rfidCards || [];
    const str = cards.map(c => `${c.uid}:${c.enabled}:${(c.deviceIds||[]).join(',')}`).join('|');
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
}

// Device offline detection & learning mode expiry (every 60 seconds)
setInterval(() => {
    const now = new Date();
    let changed = false;
    (data.rfidDevices || []).forEach(device => {
        // Offline detection: lastSeen older than 90 seconds
        if (device.status !== 'offline' && device.lastSeen) {
            const lastSeen = new Date(device.lastSeen);
            if (now - lastSeen > 90000) {
                const wasOnline = device.status;
                device.status = 'offline';
                device.updated_at = now.toISOString();
                changed = true;
                if (wasOnline === 'online') {
                    log('INFO', `RFID-Gerät ${device.id} ist offline`);
                }
            }
        }
        // Learning mode expiry
        if (device.mode === 'learning' && device.modeExpiresAt) {
            if (now >= new Date(device.modeExpiresAt)) {
                device.mode = 'normal';
                device.modeExpiresAt = null;
                device.updated_at = now.toISOString();
                if (device.status === 'learning') device.status = 'online';
                changed = true;
                log('INFO', `RFID-Gerät ${device.id} Anlernmodus abgelaufen`);
            }
        }
    });
    if (changed) dataChanged = true;
}, 60000);

// ============== API ROUTES ==============
async function handleAPI(req, res, urlPath, method) {
    const sessionId = getCookie(req, 'session');
    const session = getSession(sessionId);
    const requireAuth = () => {
        if (!session) {
            sendError(res, 'Nicht authentifiziert', 401, req);
            return false;
        }
        return true;
    };
    const requireAdmin = () => {
        if (!session || session.role !== 'ADMIN') {
            sendError(res, 'Keine Berechtigung', 403, req);
            return false;
        }
        return true;
    };
    
    // AUTH ENDPOINTS
    if (urlPath === '/api/auth/login' && method === 'POST') {
        const ip = req.socket.remoteAddress || 'unknown';
        if (!checkAuthRateLimit(ip)) {
            return sendError(res, 'Zu viele Login-Versuche', 429, req);
        }
        const body = await parseBody(req);
        const user = data.users.find(u => u.username === body.username);
        
        if (!user || !verifyPassword(body.password, user.password)) {
            log('WARN', `Login fehlgeschlagen: ${body.username}`);
            return sendError(res, 'Ungültige Anmeldedaten', 401, req);
        }
        
        const newSessionId = createSession(user.id, user.username, user.role);
        log('INFO', `Login erfolgreich: ${user.username}`);

        // Upgrade legacy password hashes on successful login
        if (!user.password.startsWith('scrypt$')) {
            user.password = hashPassword(body.password);
            user.updated_at = new Date().toISOString();
            dataChanged = true;
        }

        const isSecure = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
        setSecurityHeaders(res, req);
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `session=${newSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${isSecure ? '; Secure' : ''}`,
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Origin': currentRequestOrigin } : {}),
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {})
        });
        return res.end(JSON.stringify({
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        }));
    }
    
    if (urlPath === '/api/auth/logout' && method === 'POST') {
        if (sessionId) destroySession(sessionId);
        const isSecure = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
        setSecurityHeaders(res, req);
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`,
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Origin': currentRequestOrigin } : {}),
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {})
        });
        return res.end(JSON.stringify({ success: true }));
    }
    
    if (urlPath === '/api/auth/me') {
        if (!session) return sendJson(res, { user: null }, 200, req);
        const user = data.users.find(u => u.id === session.userId);
        if (!user) return sendJson(res, { user: null }, 200, req);
        return sendJson(res, { 
            user: { id: user.id, username: user.username, role: user.role, avatar_url: user.avatar_url, created_at: user.created_at }
        }, 200, req);
    }
    
    // CHANGE PASSWORD
    if (urlPath === '/api/auth/change-password' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        const user = data.users.find(u => u.id === session.userId);
        if (!user) return sendError(res, 'User nicht gefunden', 404, req);
        
        if (!verifyPassword(body.currentPassword, user.password)) {
            return sendError(res, 'Aktuelles Passwort falsch', 401, req);
        }
        if (!body.newPassword || body.newPassword.length < 8) {
            return sendError(res, 'Neues Passwort muss mindestens 8 Zeichen haben', 400, req);
        }
        
        user.password = hashPassword(body.newPassword);
        user.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'PASSWORD_CHANGED', 'user', session.userId);
        log('INFO', `Passwort geändert: ${user.username}`);
        return sendJson(res, { success: true }, 200, req);
    }
    
    // DATA ENDPOINTS
    if (urlPath === '/api/data' && method === 'GET') {
        return sendJson(res, {
            zones: data.zones,
            slots: data.slots,
            plants: data.plants,
            settings: data.settings
        }, 200, req);
    }
    
    if (urlPath === '/api/data' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        if (body.zones) data.zones = body.zones;
        if (body.slots) data.slots = body.slots;
        if (body.plants) data.plants = body.plants;
        if (body.settings) data.settings = body.settings;
        dataChanged = true;
        saveData(); // Sofort speichern bei explizitem Save
        log('INFO', 'Daten gespeichert');
        return sendJson(res, { success: true }, 200, req);
    }
    
    // ZONES
    if (urlPath === '/api/zones' && method === 'GET') {
        return sendJson(res, data.zones, 200, req);
    }
    
    if (urlPath === '/api/zones' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        const newId = data.zones.length > 0 ? Math.max(...data.zones.map(z => z.id)) + 1 : 1;
        const zone = { id: newId, ...body, created_at: new Date().toISOString() };
        data.zones.push(zone);
        dataChanged = true;
        log('INFO', `Zone erstellt: ${zone.name}`);
        return sendJson(res, zone, 200, req);
    }
    
    // PLANTS
    if (urlPath === '/api/plants' && method === 'GET') {
        return sendJson(res, data.plants, 200, req);
    }
    
    if (urlPath === '/api/plants' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        const newId = data.plants.length > 0 ? Math.max(...data.plants.map(p => p.id)) + 1 : 1;
        const plant = { id: newId, ...body, created_at: new Date().toISOString() };
        data.plants.push(plant);
        dataChanged = true;
        log('INFO', `Pflanze hinzugefügt: ${plant.name}`);
        return sendJson(res, plant, 200, req);
    }
    
    if (urlPath.startsWith('/api/plants/') && method === 'PUT') {
        if (!requireAuth()) return;
        const id = parseInt(urlPath.split('/')[3]);
        const body = await parseBody(req);
        const idx = data.plants.findIndex(p => p.id === id);
        if (idx === -1) return sendError(res, 'Pflanze nicht gefunden', 404, req);
        data.plants[idx] = { ...data.plants[idx], ...body, updated_at: new Date().toISOString() };
        dataChanged = true;
        return sendJson(res, data.plants[idx], 200, req);
    }
    
    if (urlPath.startsWith('/api/plants/') && method === 'DELETE') {
        if (!requireAuth()) return;
        const id = parseInt(urlPath.split('/')[3]);
        const idx = data.plants.findIndex(p => p.id === id);
        if (idx === -1) return sendError(res, 'Pflanze nicht gefunden', 404, req);
        data.plants.splice(idx, 1);
        dataChanged = true;
        log('INFO', `Pflanze gelöscht: ID ${id}`);
        return sendJson(res, { success: true }, 200, req);
    }
    
    // SLOTS
    if (urlPath === '/api/slots' && method === 'GET') {
        return sendJson(res, data.slots, 200, req);
    }
    
    if (urlPath === '/api/slots' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        if (Array.isArray(body)) {
            data.slots = body;
        } else {
            const newId = data.slots.length > 0 ? Math.max(...data.slots.map(s => s.id)) + 1 : 1;
            data.slots.push({ id: newId, ...body });
        }
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }
    
    // LOGS
    if (urlPath === '/api/logs' && method === 'GET') {
        if (!requireAdmin()) return;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const level = url.searchParams.get('level');
        let logs = data.logs;
        if (level) logs = logs.filter(l => l.level === level);
        return sendJson(res, logs.slice(0, limit), 200, req);
    }
    
    if (urlPath === '/api/logs' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const entry = {
            timestamp: new Date().toISOString(),
            level: body.level || 'INFO',
            message: body.message || '',
            data: body.data || null
        };
        data.logs.unshift(entry);
        if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }
    
    // USERS (Admin only)
    if (urlPath === '/api/users' && method === 'GET') {
        if (!requireAdmin()) return;
        return sendJson(res, data.users.map(u => ({
            id: u.id, username: u.username, role: u.role, created_at: u.created_at
        })), 200, req);
    }
    
    if (urlPath === '/api/users' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        if (!body.username || !body.password) {
            return sendError(res, 'Username und Passwort erforderlich', 400, req);
        }
        if (data.users.find(u => u.username === body.username)) {
            return sendError(res, 'Username bereits vergeben', 409, req);
        }
        const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
        const user = {
            id: newId,
            username: body.username,
            email: body.email || null,
            password: hashPassword(body.password),
            role: body.role || 'NORMAL_USER',
            created_at: new Date().toISOString()
        };
        data.users.push(user);
        dataChanged = true;
        addAuditLog(session, 'USER_CREATED', 'user', newId, { username: body.username });
        log('INFO', `User erstellt: ${user.username}`);
        return sendJson(res, { success: true, userId: newId }, 200, req);
    }
    
    // USER UPDATE
    if (urlPath.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
        if (!requireAdmin()) return;
        const userId = parseInt(urlPath.split('/')[3]);
        const body = await parseBody(req);
        const user = data.users.find(u => u.id === userId);
        if (!user) return sendError(res, 'User nicht gefunden', 404, req);
        
        if (body.username) user.username = body.username;
        if (body.email !== undefined) user.email = body.email;
        if (body.role) user.role = body.role;
        user.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'USER_UPDATED', 'user', userId);
        return sendJson(res, { success: true }, 200, req);
    }
    
    // USER DELETE
    if (urlPath.match(/^\/api\/users\/\d+$/) && method === 'DELETE') {
        if (!requireAdmin()) return;
        const userId = parseInt(urlPath.split('/')[3]);
        if (userId === session.userId) {
            return sendError(res, 'Eigenen Account nicht löschbar', 400, req);
        }
        const idx = data.users.findIndex(u => u.id === userId);
        if (idx === -1) return sendError(res, 'User nicht gefunden', 404, req);
        data.users.splice(idx, 1);
        dataChanged = true;
        addAuditLog(session, 'USER_DELETED', 'user', userId);
        log('INFO', `User gelöscht: ID ${userId}`);
        return sendJson(res, { success: true }, 200, req);
    }
    
    // PASSWORD RESET (Admin)
    if (urlPath.match(/^\/api\/users\/\d+\/reset-password$/) && method === 'POST') {
        if (!requireAdmin()) return;
        const userId = parseInt(urlPath.split('/')[3]);
        const body = await parseBody(req);
        const user = data.users.find(u => u.id === userId);
        if (!user) return sendError(res, 'User nicht gefunden', 404, req);
        
        if (!body.newPassword || body.newPassword.length < 8) {
            return sendError(res, 'Passwort muss mindestens 8 Zeichen haben', 400, req);
        }
        
        user.password = hashPassword(body.newPassword);
        user.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'PASSWORD_RESET_BY_ADMIN', 'user', userId);
        log('INFO', `Passwort zurückgesetzt für User ID ${userId}`);
        return sendJson(res, { success: true }, 200, req);
    }
    
    // AVATAR UPLOAD
    if (urlPath === '/api/users/avatar' && method === 'POST') {
        if (!requireAuth()) return;

        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return sendError(res, 'Multipart form-data erforderlich', 400, req);
        }

        try {
            const file = await parseMultipart(req);

            // Validate file type
            const ext = path.extname(file.filename).toLowerCase();
            const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
            if (!allowedExts.includes(ext)) {
                return sendError(res, 'Nur PNG, JPG, JPEG, WEBP erlaubt', 400, req);
            }

            const user = data.users.find(u => u.id === session.userId);
            if (!user) return sendError(res, 'User nicht gefunden', 404, req);

            // Delete old avatar if exists
            if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
                const oldPath = path.join(__dirname, user.avatar_url);
                try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
            }

            // Save new avatar
            const filename = `${session.userId}_${Date.now()}${ext}`;
            const filePath = path.join(uploadsDir, filename);
            fs.writeFileSync(filePath, file.data);

            // Update user
            const avatarUrl = `/uploads/avatars/${filename}`;
            user.avatar_url = avatarUrl;
            user.updated_at = new Date().toISOString();
            dataChanged = true;

            addAuditLog(session, 'AVATAR_UPDATED', 'user', session.userId);
            log('INFO', `Avatar aktualisiert für User ${user.username}`);

            return sendJson(res, { success: true, avatar_url: avatarUrl }, 200, req);
        } catch (e) {
            log('ERROR', `Avatar-Upload Fehler: ${e.message}`);
            return sendError(res, e.message || 'Upload fehlgeschlagen', 400, req);
        }
    }
    
    // AUDIT LOGS
    if (urlPath === '/api/audit-logs' && method === 'GET') {
        if (!requireAdmin()) return;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const action = url.searchParams.get('action');
        const actor = url.searchParams.get('actor');
        
        let logs = data.auditLogs || [];
        if (action) logs = logs.filter(l => l.action === action);
        if (actor) logs = logs.filter(l => l.actor_username && l.actor_username.includes(actor));
        
        return sendJson(res, logs.slice(0, limit), 200, req);
    }
    
    // SETTINGS
    if (urlPath === '/api/settings' && method === 'GET') {
        return sendJson(res, data.settings, 200, req);
    }
    
    if (urlPath === '/api/settings' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        data.settings = { ...data.settings, ...body };
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }

    // EMAIL CONFIG
    if (urlPath === '/api/email/config' && method === 'GET') {
        if (!requireAdmin()) return;
        const cfg = getEmailConfigSafe(false);
        return sendJson(res, cfg, 200, req);
    }

    if (urlPath === '/api/email/config' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const cfg = data.emailConfig || normalizeEmailConfig();
        if (body.recipients) {
            cfg.recipients = sanitizeEmailList(body.recipients);
        }
        if (body.defaultTemplateId !== undefined) {
            cfg.defaultTemplateId = body.defaultTemplateId || null;
        }
        data.emailConfig = normalizeEmailConfig(cfg);
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }

    if (urlPath === '/api/email/smtp' && method === 'GET') {
        if (!requireAdmin()) return;
        const cfg = getEmailConfigSafe(false);
        return sendJson(res, { ...cfg, smtp: { ...cfg.smtp, hasPassword: Boolean(data.emailConfig?.smtp?.pass) } }, 200, req);
    }

    if (urlPath === '/api/email/smtp' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const cfg = data.emailConfig || normalizeEmailConfig();
        cfg.smtp.host = typeof body.host === 'string' ? body.host.trim() : cfg.smtp.host;
        cfg.smtp.port = Number.isFinite(parseInt(body.port, 10)) ? parseInt(body.port, 10) : cfg.smtp.port;
        cfg.smtp.user = typeof body.user === 'string' ? body.user.trim() : cfg.smtp.user;
        cfg.smtp.from = typeof body.from === 'string' ? body.from.trim() : cfg.smtp.from;
        cfg.smtp.encryption = ['none', 'ssl', 'starttls'].includes(body.encryption) ? body.encryption : cfg.smtp.encryption;
        if (typeof body.pass === 'string' && body.pass.trim() !== '') {
            cfg.smtp.pass = body.pass;
        }
        data.emailConfig = normalizeEmailConfig(cfg);
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }

    if (urlPath === '/api/email/test' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const recipients = sanitizeEmailList(body.recipients || []);
        if (recipients.length === 0) return sendError(res, 'Empfänger erforderlich', 400, req);
        try {
            const info = await sendEmail({
                subject: body.subject || 'Test E-Mail',
                body: body.body || 'Dies ist eine Test-E-Mail.',
                recipients,
                context: { timestamp: new Date().toISOString(), sensor_name: 'Test' }
            });
            addEmailLog({ type: 'test', recipients, success: true, info: info.messageId });
            return sendJson(res, { success: true }, 200, req);
        } catch (e) {
            addEmailLog({ type: 'test', recipients, success: false, error: e.message });
            return sendError(res, e.message, 500, req);
        }
    }

    if (urlPath === '/api/email/templates' && method === 'GET') {
        if (!requireAdmin()) return;
        const cfg = getEmailConfigSafe(false);
        return sendJson(res, cfg.templates || [], 200, req);
    }

    if (urlPath === '/api/email/templates' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        if (!body.name || !body.subject || !body.body) return sendError(res, 'Name, Subject und Body erforderlich', 400, req);
        const cfg = data.emailConfig || normalizeEmailConfig();
        const newId = cfg.templates.length ? Math.max(...cfg.templates.map(t => t.id || 0)) + 1 : 1;
        const tpl = {
            id: newId,
            name: body.name,
            subject: body.subject,
            body: body.body,
            created_at: new Date().toISOString()
        };
        cfg.templates.unshift(tpl);
        data.emailConfig = normalizeEmailConfig(cfg);
        dataChanged = true;
        return sendJson(res, tpl, 200, req);
    }

    if (urlPath.match(/^\/api\/email\/templates\/\d+$/) && method === 'PUT') {
        if (!requireAdmin()) return;
        const id = parseInt(urlPath.split('/')[4]);
        const body = await parseBody(req);
        const cfg = data.emailConfig || normalizeEmailConfig();
        const tpl = cfg.templates.find(t => t.id === id);
        if (!tpl) return sendError(res, 'Template nicht gefunden', 404, req);
        if (body.name) tpl.name = body.name;
        if (body.subject) tpl.subject = body.subject;
        if (body.body) tpl.body = body.body;
        tpl.updated_at = new Date().toISOString();
        data.emailConfig = normalizeEmailConfig(cfg);
        dataChanged = true;
        return sendJson(res, tpl, 200, req);
    }

    if (urlPath.match(/^\/api\/email\/templates\/\d+$/) && method === 'DELETE') {
        if (!requireAdmin()) return;
        const id = parseInt(urlPath.split('/')[4]);
        const cfg = data.emailConfig || normalizeEmailConfig();
        cfg.templates = cfg.templates.filter(t => t.id !== id);
        if (cfg.defaultTemplateId === id) cfg.defaultTemplateId = null;
        data.emailConfig = normalizeEmailConfig(cfg);
        dataChanged = true;
        return sendJson(res, { success: true }, 200, req);
    }

    if (urlPath === '/api/email/logs' && method === 'GET') {
        if (!requireAdmin()) return;
        const limit = Math.min(parseInt(new URL(req.url, `http://${req.headers.host}`).searchParams.get('limit')) || 50, 200);
        return sendJson(res, (data.emailLogs || []).slice(0, limit), 200, req);
    }

    if (urlPath === '/api/email/alarms/send' && method === 'POST') {
        if (!requireAuth()) return;
        const body = await parseBody(req);
        const recipients = sanitizeEmailList(body.recipients || data.emailConfig?.recipients || []);
        if (recipients.length === 0) return sendError(res, 'Keine Empfänger konfiguriert', 400, req);
        const tplId = body.templateId || data.emailConfig?.defaultTemplateId || null;
        const context = {
            sensor_name: body.sensor_name || 'Sensor',
            sensor_value: body.sensor_value,
            threshold: body.threshold,
            alarm_type: body.alarm_type || 'Alarm',
            timestamp: body.timestamp || new Date().toISOString(),
            details: body.details || ''
        };
        try {
            const info = await sendEmail({
                templateId: tplId,
                subject: body.subject,
                body: body.body,
                recipients,
                context
            });
            addEmailLog({ type: 'alarm', recipients, success: true, info: info.messageId, context });
            return sendJson(res, { success: true }, 200, req);
        } catch (e) {
            addEmailLog({ type: 'alarm', recipients, success: false, error: e.message, context });
            return sendError(res, e.message, 500, req);
        }
    }

    // FORUM (public GET, public POST)
    if (urlPath === '/api/forum/posts' && method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 200);
        const posts = (data.forumPosts || []).slice(0, limit);
        return sendJson(res, posts, 200, req);
    }
    
    if (urlPath === '/api/forum/posts' && method === 'POST') {
        const body = await parseBody(req);
        const content = (body.content || '').trim();
        if (!content) return sendError(res, 'Inhalt erforderlich', 400, req);
        if (content.length > 2000) return sendError(res, 'Inhalt zu lang', 400, req);
        let tag = (body.tag || '').trim().toLowerCase();
        if (!/^[a-z0-9_-]{1,40}$/.test(tag)) tag = 'allgemein';
        const authorName = session?.username || 'Gast';

        const newId = data.forumPosts.length > 0
            ? Math.max(...data.forumPosts.map(p => p.id)) + 1
            : 1;
        const post = {
            id: newId,
            author_user_id: session?.userId || null,
            author_username: authorName,
            content,
            tag,
            created_at: new Date().toISOString(),
            comments: []
        };
        data.forumPosts.unshift(post);
        dataChanged = true;
        if (session) {
            addAuditLog(session, 'FORUM_POST_CREATED', 'forum_post', newId);
        }
        return sendJson(res, { success: true, post }, 200, req);
    }

    if (urlPath.match(/^\/api\/forum\/posts\/\d+\/comments$/) && method === 'POST') {
        const postId = parseInt(urlPath.split('/')[4]);
        const body = await parseBody(req);
        const content = (body.content || '').trim();
        if (!content) return sendError(res, 'Inhalt erforderlich', 400, req);
        if (content.length > 1000) return sendError(res, 'Inhalt zu lang', 400, req);
        const authorName = session?.username || 'Gast';

        const post = data.forumPosts.find(p => p.id === postId);
        if (!post) return sendError(res, 'Beitrag nicht gefunden', 404, req);
        const newCommentId = post.comments.length > 0
            ? Math.max(...post.comments.map(c => c.id)) + 1
            : 1;
        const comment = {
            id: newCommentId,
            author_user_id: session?.userId || null,
            author_username: authorName,
            content,
            created_at: new Date().toISOString()
        };
        post.comments.push(comment);
        dataChanged = true;
        if (session) {
            addAuditLog(session, 'FORUM_COMMENT_CREATED', 'forum_post', postId, { commentId: newCommentId });
        }
        return sendJson(res, { success: true, comment }, 200, req);
    }
    
    // COLOR SCHEME (public GET, admin-only POST)
    if (urlPath === '/api/colors' && method === 'GET') {
        return sendJson(res, data.colorScheme || getDefaultColors(), 200, req);
    }
    
    if (urlPath === '/api/colors' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        data.colorScheme = { ...getDefaultColors(), ...body, updatedAt: new Date().toISOString() };
        dataChanged = true;
        saveData();
        addAuditLog(session, 'COLOR_SCHEME_CHANGED', 'settings', 'colors');
        log('INFO', `Farbschema geändert von ${session.username}`);
        return sendJson(res, { success: true, colors: data.colorScheme }, 200, req);
    }
    
    if (urlPath === '/api/colors/reset' && method === 'POST') {
        if (!requireAdmin()) return;
        data.colorScheme = { ...getDefaultColors(), updatedAt: new Date().toISOString() };
        dataChanged = true;
        saveData();
        addAuditLog(session, 'COLOR_SCHEME_RESET', 'settings', 'colors');
        log('INFO', `Farbschema zurückgesetzt von ${session.username}`);
        return sendJson(res, { success: true, colors: data.colorScheme }, 200, req);
    }
    
    // HEALTH CHECK
    if (urlPath === '/api/health') {
        return sendJson(res, { 
            status: 'ok', 
            uptime: process.uptime(),
            memory: process.memoryUsage().heapUsed,
            sessions: sessions.size
        }, 200, req);
    }

    // ============== RFID DEVICE MANAGEMENT (Admin-only) ==============

    // GET /api/rfid/devices - Alle Geräte auflisten
    if (urlPath === '/api/rfid/devices' && method === 'GET') {
        if (!requireAdmin()) return;
        const devices = (data.rfidDevices || []).map(d => ({
            ...d,
            apiKey: undefined, // Niemals API-Key zurückgeben
            cardCount: (data.rfidCards || []).filter(c => (c.deviceIds || []).includes(d.id)).length
        }));
        return sendJson(res, devices, 200, req);
    }

    // POST /api/rfid/devices - Neues Gerät registrieren
    if (urlPath === '/api/rfid/devices' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const deviceId = (body.id || '').trim();
        const name = sanitizeName(body.name);
        if (!validateDeviceId(deviceId)) return sendError(res, 'Ungültige Device-ID (3-50 Zeichen, alphanumerisch + Bindestriche)', 400, req);
        if (!name) return sendError(res, 'Name erforderlich', 400, req);
        if (data.rfidDevices.find(d => d.id === deviceId)) return sendError(res, 'Device-ID bereits vergeben', 409, req);

        const key = generateApiKey();
        const now = new Date().toISOString();
        const device = {
            id: deviceId,
            name,
            apiKey: key.stored,
            status: 'offline',
            lastSeen: null,
            lastActivity: null,
            firmwareVersion: null,
            ipAddress: null,
            wifiSignal: null,
            doorOpenDuration: Number.isFinite(parseInt(body.doorOpenDuration)) ? Math.min(Math.max(parseInt(body.doorOpenDuration), 1), 30) : 3,
            learningTimeout: Number.isFinite(parseInt(body.learningTimeout)) ? Math.min(Math.max(parseInt(body.learningTimeout), 15), 300) : 60,
            mode: 'normal',
            modeExpiresAt: null,
            created_at: now,
            updated_at: now
        };
        data.rfidDevices.push(device);
        dataChanged = true;
        addAuditLog(session, 'RFID_DEVICE_CREATED', 'rfid_device', deviceId, { name });
        log('INFO', `RFID-Gerät erstellt: ${deviceId} (${name})`);
        return sendJson(res, { success: true, device: { ...device, apiKey: undefined }, apiKey: key.raw }, 200, req);
    }

    // GET /api/rfid/devices/:id - Einzelnes Gerät
    if (urlPath.match(/^\/api\/rfid\/devices\/[a-zA-Z0-9-]+$/) && method === 'GET') {
        if (!requireAdmin()) return;
        const id = urlPath.split('/')[4];
        const device = data.rfidDevices.find(d => d.id === id);
        if (!device) return sendError(res, 'Gerät nicht gefunden', 404, req);
        const cardCount = (data.rfidCards || []).filter(c => (c.deviceIds || []).includes(id)).length;
        return sendJson(res, { ...device, apiKey: undefined, cardCount }, 200, req);
    }

    // PUT /api/rfid/devices/:id - Gerät bearbeiten
    if (urlPath.match(/^\/api\/rfid\/devices\/[a-zA-Z0-9-]+$/) && method === 'PUT') {
        if (!requireAdmin()) return;
        const id = urlPath.split('/')[4];
        const device = data.rfidDevices.find(d => d.id === id);
        if (!device) return sendError(res, 'Gerät nicht gefunden', 404, req);
        const body = await parseBody(req);
        if (body.name !== undefined) device.name = sanitizeName(body.name);
        if (body.doorOpenDuration !== undefined) device.doorOpenDuration = Math.min(Math.max(parseInt(body.doorOpenDuration) || 3, 1), 30);
        if (body.learningTimeout !== undefined) device.learningTimeout = Math.min(Math.max(parseInt(body.learningTimeout) || 60, 15), 300);
        device.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'RFID_DEVICE_UPDATED', 'rfid_device', id);
        return sendJson(res, { success: true, device: { ...device, apiKey: undefined } }, 200, req);
    }

    // DELETE /api/rfid/devices/:id - Gerät löschen
    if (urlPath.match(/^\/api\/rfid\/devices\/[a-zA-Z0-9-]+$/) && method === 'DELETE') {
        if (!requireAdmin()) return;
        const id = urlPath.split('/')[4];
        const idx = data.rfidDevices.findIndex(d => d.id === id);
        if (idx === -1) return sendError(res, 'Gerät nicht gefunden', 404, req);
        data.rfidDevices.splice(idx, 1);
        // Remove device from all cards
        (data.rfidCards || []).forEach(c => {
            if (c.deviceIds) c.deviceIds = c.deviceIds.filter(did => did !== id);
        });
        dataChanged = true;
        addAuditLog(session, 'RFID_DEVICE_DELETED', 'rfid_device', id);
        log('INFO', `RFID-Gerät gelöscht: ${id}`);
        return sendJson(res, { success: true }, 200, req);
    }

    // POST /api/rfid/devices/:id/mode - Modus ändern
    if (urlPath.match(/^\/api\/rfid\/devices\/[a-zA-Z0-9-]+\/mode$/) && method === 'POST') {
        if (!requireAdmin()) return;
        const id = urlPath.split('/')[4];
        const device = data.rfidDevices.find(d => d.id === id);
        if (!device) return sendError(res, 'Gerät nicht gefunden', 404, req);
        const body = await parseBody(req);
        const newMode = body.mode;
        if (!['normal', 'learning'].includes(newMode)) return sendError(res, 'Ungültiger Modus', 400, req);
        device.mode = newMode;
        if (newMode === 'learning') {
            const timeout = device.learningTimeout || 60;
            device.modeExpiresAt = new Date(Date.now() + timeout * 1000).toISOString();
            device.status = 'learning';
            addAuditLog(session, 'RFID_LEARNING_MODE_STARTED', 'rfid_device', id, { timeout });
        } else {
            device.modeExpiresAt = null;
            if (device.status === 'learning') device.status = device.lastSeen && (Date.now() - new Date(device.lastSeen).getTime() < 90000) ? 'online' : 'offline';
            addAuditLog(session, 'RFID_LEARNING_MODE_STOPPED', 'rfid_device', id);
        }
        device.updated_at = new Date().toISOString();
        dataChanged = true;
        return sendJson(res, { success: true, device: { ...device, apiKey: undefined } }, 200, req);
    }

    // POST /api/rfid/devices/:id/regenerate-key - Neuen API-Key generieren
    if (urlPath.match(/^\/api\/rfid\/devices\/[a-zA-Z0-9-]+\/regenerate-key$/) && method === 'POST') {
        if (!requireAdmin()) return;
        const id = urlPath.split('/')[4];
        const device = data.rfidDevices.find(d => d.id === id);
        if (!device) return sendError(res, 'Gerät nicht gefunden', 404, req);
        const key = generateApiKey();
        device.apiKey = key.stored;
        device.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'RFID_DEVICE_UPDATED', 'rfid_device', id, { action: 'regenerate-key' });
        log('INFO', `RFID API-Key neu generiert für: ${id}`);
        return sendJson(res, { success: true, apiKey: key.raw }, 200, req);
    }

    // ============== RFID CARD MANAGEMENT (Admin-only) ==============

    // GET /api/rfid/cards - Alle Karten
    if (urlPath === '/api/rfid/cards' && method === 'GET') {
        if (!requireAdmin()) return;
        const url = new URL(req.url, `http://${req.headers.host}`);
        let cards = data.rfidCards || [];
        const deviceFilter = url.searchParams.get('device_id');
        const enabledFilter = url.searchParams.get('enabled');
        if (deviceFilter) cards = cards.filter(c => (c.deviceIds || []).includes(deviceFilter));
        if (enabledFilter !== null && enabledFilter !== undefined && enabledFilter !== '') cards = cards.filter(c => String(c.enabled) === enabledFilter);
        return sendJson(res, cards, 200, req);
    }

    // POST /api/rfid/cards - Neue Karte manuell registrieren
    if (urlPath === '/api/rfid/cards' && method === 'POST') {
        if (!requireAdmin()) return;
        const body = await parseBody(req);
        const uid = (body.uid || '').trim().toUpperCase();
        if (!validateUid(uid)) return sendError(res, 'Ungültiges UID-Format (z.B. AA:BB:CC:DD)', 400, req);
        const name = sanitizeName(body.name);
        if (!name) return sendError(res, 'Name erforderlich', 400, req);
        if (data.rfidCards.find(c => c.uid === uid)) return sendError(res, 'Karte mit dieser UID bereits registriert', 409, req);
        const deviceIds = Array.isArray(body.deviceIds) ? body.deviceIds.filter(id => data.rfidDevices.find(d => d.id === id)) : [];
        // Check card limit per device
        for (const did of deviceIds) {
            const count = data.rfidCards.filter(c => (c.deviceIds || []).includes(did)).length;
            if (count >= 50) return sendError(res, `Kartenlimit (50) für Gerät ${did} erreicht`, 400, req);
        }
        const newId = data.rfidCards.length > 0 ? Math.max(...data.rfidCards.map(c => c.id || 0)) + 1 : 1;
        const card = {
            id: newId,
            uid,
            name,
            enabled: true,
            deviceIds,
            registered_at: new Date().toISOString(),
            registered_by: session.username,
            last_used: null,
            use_count: 0,
            notes: sanitizeName(body.notes, 500) || ''
        };
        data.rfidCards.push(card);
        dataChanged = true;
        addAuditLog(session, 'RFID_CARD_REGISTERED', 'rfid_card', newId, { uid, name });
        log('INFO', `RFID-Karte registriert: ${uid} (${name})`);
        return sendJson(res, { success: true, card }, 200, req);
    }

    // GET /api/rfid/cards/:id - Einzelne Karte
    if (urlPath.match(/^\/api\/rfid\/cards\/\d+$/) && method === 'GET') {
        if (!requireAdmin()) return;
        const id = parseInt(urlPath.split('/')[4]);
        const card = data.rfidCards.find(c => c.id === id);
        if (!card) return sendError(res, 'Karte nicht gefunden', 404, req);
        return sendJson(res, card, 200, req);
    }

    // PUT /api/rfid/cards/:id - Karte bearbeiten
    if (urlPath.match(/^\/api\/rfid\/cards\/\d+$/) && method === 'PUT') {
        if (!requireAdmin()) return;
        const id = parseInt(urlPath.split('/')[4]);
        const card = data.rfidCards.find(c => c.id === id);
        if (!card) return sendError(res, 'Karte nicht gefunden', 404, req);
        const body = await parseBody(req);
        if (body.name !== undefined) card.name = sanitizeName(body.name);
        if (body.notes !== undefined) card.notes = sanitizeName(body.notes, 500);
        if (body.enabled !== undefined) {
            const wasEnabled = card.enabled;
            card.enabled = Boolean(body.enabled);
            if (wasEnabled !== card.enabled) {
                addAuditLog(session, card.enabled ? 'RFID_CARD_ENABLED' : 'RFID_CARD_DISABLED', 'rfid_card', id, { uid: card.uid });
            }
        }
        if (body.deviceIds !== undefined) {
            const newDeviceIds = Array.isArray(body.deviceIds) ? body.deviceIds.filter(did => data.rfidDevices.find(d => d.id === did)) : card.deviceIds;
            // Check card limit per device for newly added devices
            for (const did of newDeviceIds) {
                if (!(card.deviceIds || []).includes(did)) {
                    const count = data.rfidCards.filter(c => c.id !== id && (c.deviceIds || []).includes(did)).length;
                    if (count >= 50) return sendError(res, `Kartenlimit (50) für Gerät ${did} erreicht`, 400, req);
                }
            }
            card.deviceIds = newDeviceIds;
        }
        card.updated_at = new Date().toISOString();
        dataChanged = true;
        addAuditLog(session, 'RFID_CARD_UPDATED', 'rfid_card', id, { uid: card.uid });
        return sendJson(res, { success: true, card }, 200, req);
    }

    // DELETE /api/rfid/cards/:id - Karte löschen
    if (urlPath.match(/^\/api\/rfid\/cards\/\d+$/) && method === 'DELETE') {
        if (!requireAdmin()) return;
        const id = parseInt(urlPath.split('/')[4]);
        const idx = data.rfidCards.findIndex(c => c.id === id);
        if (idx === -1) return sendError(res, 'Karte nicht gefunden', 404, req);
        const card = data.rfidCards[idx];
        data.rfidCards.splice(idx, 1);
        dataChanged = true;
        addAuditLog(session, 'RFID_CARD_DELETED', 'rfid_card', id, { uid: card.uid, name: card.name });
        log('INFO', `RFID-Karte gelöscht: ${card.uid} (${card.name})`);
        return sendJson(res, { success: true }, 200, req);
    }

    // ============== RFID ESP32 ENDPOINTS (API-Key Auth) ==============

    // POST /api/rfid/access - Zugangsprüfung
    if (urlPath === '/api/rfid/access' && method === 'POST') {
        const device = authenticateDevice(req);
        // Also allow admin session for simulation
        if (!device && !session) return sendError(res, 'Nicht authentifiziert', 401, req);
        const body = await parseBody(req);
        const uid = (body.uid || '').trim().toUpperCase();
        const deviceId = body.device_id || (device ? device.id : '');
        if (!validateUid(uid)) return sendError(res, 'Ungültige UID', 400, req);
        const targetDevice = data.rfidDevices.find(d => d.id === deviceId);
        if (!targetDevice) return sendError(res, 'Gerät nicht gefunden', 404, req);
        if (device && !checkRfidRateLimit(deviceId)) return sendError(res, 'Zu viele Anfragen', 429, req);

        // Check if device is in learning mode
        if (targetDevice.mode === 'learning' && targetDevice.modeExpiresAt && new Date() < new Date(targetDevice.modeExpiresAt)) {
            // Register new card
            let card = data.rfidCards.find(c => c.uid === uid);
            if (card) {
                // Card already exists, just add device if not already assigned
                if (!(card.deviceIds || []).includes(deviceId)) {
                    const count = data.rfidCards.filter(c => (c.deviceIds || []).includes(deviceId)).length;
                    if (count < 50) {
                        card.deviceIds = [...(card.deviceIds || []), deviceId];
                        card.updated_at = new Date().toISOString();
                    }
                }
                addRfidAccessLog({ uid, cardName: card.name, deviceId, deviceName: targetDevice.name, action: 'CARD_REGISTERED', method: 'server', details: 'Karte bereits vorhanden, Gerät zugeordnet' });
                addAuditLog(session || { username: 'esp32' }, 'RFID_CARD_REGISTERED', 'rfid_card', card.id, { uid, deviceId });
                dataChanged = true;
                return sendJson(res, { granted: true, card_name: card.name, message: 'Karte bereits registriert, Gerät zugeordnet', action: 'CARD_REGISTERED' }, 200, req);
            } else {
                // New card
                const count = data.rfidCards.filter(c => (c.deviceIds || []).includes(deviceId)).length;
                if (count >= 50) return sendJson(res, { granted: false, message: 'Kartenlimit erreicht', action: 'CARD_LIMIT' }, 200, req);
                const newId = data.rfidCards.length > 0 ? Math.max(...data.rfidCards.map(c => c.id || 0)) + 1 : 1;
                card = {
                    id: newId,
                    uid,
                    name: `Karte ${uid}`,
                    enabled: true,
                    deviceIds: [deviceId],
                    registered_at: new Date().toISOString(),
                    registered_by: 'esp32',
                    last_used: null,
                    use_count: 0,
                    notes: ''
                };
                data.rfidCards.push(card);
                addRfidAccessLog({ uid, cardName: card.name, deviceId, deviceName: targetDevice.name, action: 'CARD_REGISTERED', method: 'server', details: 'Neue Karte im Anlernmodus registriert' });
                addAuditLog(session || { username: 'esp32' }, 'RFID_CARD_REGISTERED', 'rfid_card', newId, { uid, deviceId });
                dataChanged = true;
                return sendJson(res, { granted: true, card_name: card.name, message: 'Neue Karte registriert', action: 'CARD_REGISTERED', card_id: newId }, 200, req);
            }
        }

        // Normal access check
        const card = data.rfidCards.find(c => c.uid === uid);
        if (!card) {
            addRfidAccessLog({ uid, cardName: null, deviceId, deviceName: targetDevice.name, action: 'CARD_UNKNOWN', method: 'server', details: 'Unbekannte Karte' });
            addAuditLog(session || { username: 'esp32' }, 'RFID_ACCESS_DENIED', 'rfid_card', null, { uid, deviceId, reason: 'unknown' });
            return sendJson(res, { granted: false, card_name: null, message: 'Karte unbekannt' }, 200, req);
        }
        if (!card.enabled) {
            addRfidAccessLog({ uid, cardName: card.name, deviceId, deviceName: targetDevice.name, action: 'ACCESS_DENIED', method: 'server', details: 'Karte deaktiviert' });
            addAuditLog(session || { username: 'esp32' }, 'RFID_ACCESS_DENIED', 'rfid_card', card.id, { uid, deviceId, reason: 'disabled' });
            return sendJson(res, { granted: false, card_name: card.name, message: 'Karte deaktiviert' }, 200, req);
        }
        if (!(card.deviceIds || []).includes(deviceId)) {
            addRfidAccessLog({ uid, cardName: card.name, deviceId, deviceName: targetDevice.name, action: 'ACCESS_DENIED', method: 'server', details: 'Karte nicht für dieses Gerät berechtigt' });
            addAuditLog(session || { username: 'esp32' }, 'RFID_ACCESS_DENIED', 'rfid_card', card.id, { uid, deviceId, reason: 'wrong_device' });
            return sendJson(res, { granted: false, card_name: card.name, message: 'Karte nicht für dieses Gerät berechtigt' }, 200, req);
        }

        // Access granted
        card.last_used = new Date().toISOString();
        card.use_count = (card.use_count || 0) + 1;
        targetDevice.lastActivity = new Date().toISOString();
        addRfidAccessLog({ uid, cardName: card.name, deviceId, deviceName: targetDevice.name, action: 'ACCESS_GRANTED', method: body.method || 'server', details: '' });
        addAuditLog(session || { username: 'esp32' }, 'RFID_ACCESS_GRANTED', 'rfid_card', card.id, { uid, deviceId });
        dataChanged = true;
        return sendJson(res, { granted: true, card_name: card.name, message: 'Zugang gewährt' }, 200, req);
    }

    // POST /api/rfid/access-bulk - Nachträgliche Meldung gepufferter Scans
    if (urlPath === '/api/rfid/access-bulk' && method === 'POST') {
        const device = authenticateDevice(req);
        if (!device) return sendError(res, 'Nicht authentifiziert', 401, req);
        if (!checkRfidRateLimit(device.id)) return sendError(res, 'Zu viele Anfragen', 429, req);
        const body = await parseBody(req);
        const events = Array.isArray(body.events) ? body.events : [];
        let processed = 0;
        events.forEach(evt => {
            if (evt.uid && evt.timestamp) {
                const card = data.rfidCards.find(c => c.uid === evt.uid.toUpperCase());
                addRfidAccessLog({
                    uid: evt.uid.toUpperCase(),
                    cardName: card ? card.name : null,
                    deviceId: device.id,
                    deviceName: device.name,
                    action: evt.action || (card ? 'ACCESS_GRANTED' : 'CARD_UNKNOWN'),
                    method: 'local',
                    details: 'Nachgemeldeter Offline-Scan'
                });
                processed++;
            }
        });
        dataChanged = true;
        return sendJson(res, { success: true, processed }, 200, req);
    }

    // POST /api/rfid/heartbeat - ESP32 Heartbeat
    if (urlPath === '/api/rfid/heartbeat' && method === 'POST') {
        const device = authenticateDevice(req);
        if (!device) return sendError(res, 'Nicht authentifiziert', 401, req);
        if (!checkRfidRateLimit(device.id)) return sendError(res, 'Zu viele Anfragen', 429, req);
        const body = await parseBody(req);
        const now = new Date().toISOString();
        device.lastSeen = now;
        if (body.firmware_version) device.firmwareVersion = String(body.firmware_version).substring(0, 20);
        if (body.ip_address) device.ipAddress = String(body.ip_address).substring(0, 45);
        if (body.wifi_signal !== undefined) device.wifiSignal = parseInt(body.wifi_signal) || null;
        if (device.status === 'offline') device.status = device.mode === 'learning' ? 'learning' : 'online';
        device.updated_at = now;
        dataChanged = true;
        // Return card version hash so ESP can detect changes
        return sendJson(res, { success: true, card_hash: getCardVersionHash(), server_time: now }, 200, req);
    }

    // GET /api/rfid/device/:id/mode - Aktuellen Modus abfragen (ESP polling)
    if (urlPath.match(/^\/api\/rfid\/device\/[a-zA-Z0-9-]+\/mode$/) && method === 'GET') {
        const device = authenticateDevice(req);
        if (!device) return sendError(res, 'Nicht authentifiziert', 401, req);
        const id = urlPath.split('/')[4];
        const targetDevice = data.rfidDevices.find(d => d.id === id);
        if (!targetDevice) return sendError(res, 'Gerät nicht gefunden', 404, req);
        return sendJson(res, {
            mode: targetDevice.mode || 'normal',
            expires_at: targetDevice.modeExpiresAt || null,
            door_open_duration: targetDevice.doorOpenDuration || 3,
            learning_timeout: targetDevice.learningTimeout || 60
        }, 200, req);
    }

    // GET /api/rfid/device/:id/cards - Kartenliste für Gerät (ESP sync)
    if (urlPath.match(/^\/api\/rfid\/device\/[a-zA-Z0-9-]+\/cards$/) && method === 'GET') {
        const device = authenticateDevice(req);
        if (!device) return sendError(res, 'Nicht authentifiziert', 401, req);
        const id = urlPath.split('/')[4];
        const cards = (data.rfidCards || [])
            .filter(c => (c.deviceIds || []).includes(id))
            .map(c => ({ uid: c.uid, enabled: c.enabled }));
        return sendJson(res, { cards, hash: getCardVersionHash() }, 200, req);
    }

    // POST /api/rfid/device/:id/register-card - Karte im Anlernmodus registrieren
    if (urlPath.match(/^\/api\/rfid\/device\/[a-zA-Z0-9-]+\/register-card$/) && method === 'POST') {
        const device = authenticateDevice(req);
        if (!device) return sendError(res, 'Nicht authentifiziert', 401, req);
        const id = urlPath.split('/')[4];
        const targetDevice = data.rfidDevices.find(d => d.id === id);
        if (!targetDevice) return sendError(res, 'Gerät nicht gefunden', 404, req);
        if (targetDevice.mode !== 'learning') return sendError(res, 'Gerät nicht im Anlernmodus', 400, req);
        const body = await parseBody(req);
        const uid = (body.uid || '').trim().toUpperCase();
        if (!validateUid(uid)) return sendError(res, 'Ungültige UID', 400, req);

        let card = data.rfidCards.find(c => c.uid === uid);
        if (card) {
            if (!(card.deviceIds || []).includes(id)) {
                const count = data.rfidCards.filter(c => (c.deviceIds || []).includes(id)).length;
                if (count >= 50) return sendError(res, 'Kartenlimit erreicht', 400, req);
                card.deviceIds = [...(card.deviceIds || []), id];
                card.updated_at = new Date().toISOString();
            }
        } else {
            const count = data.rfidCards.filter(c => (c.deviceIds || []).includes(id)).length;
            if (count >= 50) return sendError(res, 'Kartenlimit erreicht', 400, req);
            const newId = data.rfidCards.length > 0 ? Math.max(...data.rfidCards.map(c => c.id || 0)) + 1 : 1;
            card = {
                id: newId,
                uid,
                name: `Karte ${uid}`,
                enabled: true,
                deviceIds: [id],
                registered_at: new Date().toISOString(),
                registered_by: 'esp32',
                last_used: null,
                use_count: 0,
                notes: ''
            };
            data.rfidCards.push(card);
        }
        addRfidAccessLog({ uid, cardName: card.name, deviceId: id, deviceName: targetDevice.name, action: 'CARD_REGISTERED', method: 'server', details: 'Im Anlernmodus registriert' });
        addAuditLog({ username: 'esp32' }, 'RFID_CARD_REGISTERED', 'rfid_card', card.id, { uid, deviceId: id });
        dataChanged = true;
        return sendJson(res, { success: true, card_name: card.name, card_id: card.id }, 200, req);
    }

    // ============== RFID ACCESS LOGS (Admin-only) ==============

    // GET /api/rfid/access-logs
    if (urlPath === '/api/rfid/access-logs' && method === 'GET') {
        if (!requireAdmin()) return;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 2000);
        let logs = data.rfidAccessLogs || [];
        const deviceFilter = url.searchParams.get('device_id');
        const uidFilter = url.searchParams.get('uid');
        const actionFilter = url.searchParams.get('action');
        const fromFilter = url.searchParams.get('from');
        const toFilter = url.searchParams.get('to');
        if (deviceFilter) logs = logs.filter(l => l.deviceId === deviceFilter);
        if (uidFilter) logs = logs.filter(l => l.uid && l.uid.includes(uidFilter.toUpperCase()));
        if (actionFilter) logs = logs.filter(l => l.action === actionFilter);
        if (fromFilter) { const from = new Date(fromFilter); logs = logs.filter(l => new Date(l.timestamp) >= from); }
        if (toFilter) { const to = new Date(toFilter); logs = logs.filter(l => new Date(l.timestamp) <= to); }
        return sendJson(res, logs.slice(0, limit), 200, req);
    }

    return sendError(res, 'Endpoint nicht gefunden', 404, req);
}

// ============== HAUPTSERVER ==============
const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const method = req.method;
    let urlPath = req.url.split('?')[0];
    
    // Set global origin for CORS
    const originAllowed = isAllowedOrigin(req);
    currentRequestOrigin = originAllowed ? (req.headers.origin || '') : '';
    if (!originAllowed && req.headers.origin) {
        return sendError(res, 'CORS nicht erlaubt', 403, req);
    }
    
    // Rate Limiting
    if (!checkRateLimit(ip)) {
        return sendError(res, 'Zu viele Anfragen', 429, req);
    }
    
    // CORS Preflight
    if (method === 'OPTIONS') {
        setSecurityHeaders(res, req);
        res.writeHead(204, {
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Origin': currentRequestOrigin } : {}),
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
            ...(currentRequestOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
            'Access-Control-Max-Age': '86400'
        });
        return res.end();
    }
    
    try {
        // API Routes
        if (urlPath.startsWith('/api/')) {
            return await handleAPI(req, res, urlPath, method);
        }
        
        // Static Files
        if (urlPath === '/') urlPath = '/index.html';
        
        const filePath = path.join(__dirname, urlPath);
        const safePath = path.resolve(filePath);
        
        // Sicherheit: Nur Dateien im Projektverzeichnis
        if (!safePath.startsWith(__dirname)) {
            return sendError(res, 'Forbidden', 403, req);
        }
        
        if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
            return sendFile(res, safePath, req);
        }
        
        // Fallback zu index.html für SPA
        return sendFile(res, path.join(__dirname, 'index.html'), req);
        
    } catch (e) {
        if (e && e.message === 'Body too large') {
            return sendError(res, 'Request zu gross', 413, req);
        }
        log('ERROR', `Request error: ${e.message}`);
        return sendError(res, 'Interner Serverfehler', 500, req);
    }
});

server.on('error', (err) => {
    log('ERROR', `Server error: ${err.message}`);
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} ist bereits belegt.`);
        process.exit(1);
    }
});

server.on('clientError', (err, socket) => {
    if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});

// ============== GRACEFUL SHUTDOWN ==============
function shutdown(signal) {
    log('INFO', `${signal} empfangen, Server wird beendet...`);
    
    // Daten speichern
    saveData();
    
    server.close(() => {
        log('INFO', 'Server beendet');
        process.exit(0);
    });
    
    // Force exit nach 5 Sekunden
    setTimeout(() => {
        log('WARN', 'Erzwungenes Beenden');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
    log('ERROR', `Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    // Nicht beenden, Server weiterlaufen lassen
});

process.on('unhandledRejection', (reason) => {
    log('ERROR', `Unhandled Rejection: ${reason}`);
});

// ============== SERVER STARTEN ==============
loadData();
if (SESSION_SECRET === 'project-iron-garden-fixed-secret-key-2024') {
    log('WARN', 'SESSION_SECRET Standardwert aktiv - bitte in Produktion setzen');
}

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     🌱 Project Iron Garden Steuerungssystem gestartet 🌱       ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Server:     http://localhost:${PORT}                     ║`);
    console.log(`║  API:        http://localhost:${PORT}/api                 ║`);
    console.log('║  Admin:      admin / admin                             ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    log('INFO', `Server gestartet auf Port ${PORT}`);
});

// Memory-Überwachung (für Raspberry Pi)
setInterval(() => {
    const mem = process.memoryUsage();
    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
    if (heapMB > 100) { // Warnung bei über 100MB
        log('WARN', `Hoher Speicherverbrauch: ${heapMB}MB`);
        // Garbage Collection anregen
        if (global.gc) global.gc();
    }
}, 60000);
