#!/usr/bin/env node
/**
 * Gewächshaus Steuerungssystem - Raspberry Pi Optimierte Version
 * Minimale Abhängigkeiten, geringer Ressourcenverbrauch
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============== KONFIGURATION ==============
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'data.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'gewachshaus-fixed-secret-key-2024';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// ============== EINFACHE DATENBANK (JSON-Datei) ==============
let data = {
    zones: [],
    slots: [],
    plants: [],
    users: [],
    logs: [],
    auditLogs: [],
    settings: {}
};

function loadData() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            data = JSON.parse(raw);
            log('INFO', 'Daten geladen');
        } else {
            // Default Admin erstellen
            data.users.push({
                id: 1,
                username: ADMIN_USER,
                password: hashPassword(ADMIN_PASS),
                role: 'ADMIN',
                created_at: new Date().toISOString()
            });
            saveData();
            log('INFO', 'Neue Datenbank erstellt mit Admin-User');
            if (ADMIN_PASS === 'admin123') {
                log('WARN', 'Standard-Admin-Passwort aktiv - bitte ADMIN_PASS setzen');
            }
        }
    } catch (e) {
        log('ERROR', 'Fehler beim Laden der Daten: ' + e.message);
        // Backup erstellen falls Datei korrupt
        if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, DB_FILE + '.backup.' + Date.now());
        }
    }
}

function saveData() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        log('ERROR', 'Fehler beim Speichern: ' + e.message);
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

// ============== HTTP HELPER ==============
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) { // 1MB limit
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
        'Access-Control-Allow-Headers': 'Content-Type',
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
    
    // AVATAR UPLOAD (simplified - just acknowledge)
    if (urlPath === '/api/users/avatar' && method === 'POST') {
        if (!requireAuth()) return;
        // Simplified: don't actually handle file upload, just return success
        return sendJson(res, { success: true, avatar_url: '/assets/default-avatar.svg' }, 200, req);
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
            'Access-Control-Allow-Headers': 'Content-Type',
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
        log('ERROR', `Request error: ${e.message}`);
        return sendError(res, 'Interner Serverfehler', 500, req);
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
if (SESSION_SECRET === 'gewachshaus-fixed-secret-key-2024') {
    log('WARN', 'SESSION_SECRET Standardwert aktiv - bitte in Produktion setzen');
}

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     🌱 Gewächshaus Steuerungssystem gestartet 🌱       ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Server:     http://localhost:${PORT}                     ║`);
    console.log(`║  API:        http://localhost:${PORT}/api                 ║`);
    console.log('║  Admin:      admin / admin123                          ║');
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
