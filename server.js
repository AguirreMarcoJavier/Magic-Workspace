/**
 * 🚀 Magic Workspace - Servidor de Sincronización Local
 * Reemplaza "npx serve". Agrega API REST para sync PC ↔ Celular.
 * No necesita npm install. Solo Node.js.
 *
 * Uso: node server.js
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT      = 3000;
const HOST      = '0.0.0.0';
const STATIC    = __dirname;
const DATA_FILE = path.join(__dirname, 'magic-data.json');

// ── Tipos MIME ───────────────────────────────────────────────────────────────
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css' : 'text/css',
    '.js'  : 'application/javascript',
    '.json': 'application/json',
    '.png' : 'image/png',
    '.jpg' : 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg' : 'image/svg+xml',
    '.ico' : 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3' : 'audio/mpeg',
    '.webp': 'image/webp',
};

// ── Persistencia ─────────────────────────────────────────────────────────────
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch(e) {}
    return {};
}

function writeData(data) {
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch(e) {}
}

// Aseguramos que el archivo existe
if (!fs.existsSync(DATA_FILE)) writeData({});

// ── Servidor ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    const parsed   = url.parse(req.url, true);
    const pathname = parsed.pathname;

    // Headers CORS (necesarios para las peticiones fetch)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // ── GET /api/sync → devuelve todos los datos ──────────────────────────
    if (pathname === '/api/sync' && req.method === 'GET') {
        const data = readData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    // ── POST /api/sync → guarda un dato con metadata ─────────────────────
    if (pathname === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { key, value, device } = JSON.parse(body);
                const data = readData();
                data[`magic_${key}`]        = value;
                data[`__meta_${key}`]       = {
                    device: device || 'Desconocido',
                    updatedAt: new Date().toISOString()
                };
                writeData(data);
                console.log(`  💾 [${new Date().toLocaleTimeString()}] ${device || '?'} → ${key}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── Archivos estáticos ────────────────────────────────────────────────
    let filePath = path.join(STATIC, pathname === '/' ? 'index.html' : pathname);

    // Seguridad: evitar path traversal
    if (!filePath.startsWith(STATIC)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Intentar con .html
                fs.readFile(filePath + '.html', (err2, fd2) => {
                    if (err2) { res.writeHead(404); res.end('Not found'); return; }
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(fd2);
                });
            } else {
                res.writeHead(500); res.end('Server error');
            }
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(fileData);
    });
});

// ── Obtener IP local ──────────────────────────────────────────────────────────
function getLocalIP() {
    try {
        const os = require('os');
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) return net.address;
            }
        }
    } catch(e) {}
    return '???.???.???.???';
}

server.listen(PORT, HOST, () => {
    const ip = getLocalIP();
    console.log('\n');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║     🚀 MAGIC WORKSPACE - SERVIDOR SYNC       ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log(`  ║   PC:      http://localhost:${PORT}               ║`);
    console.log(`  ║   Celular: http://${ip}:${PORT}           ║`);
    console.log('  ║                                              ║');
    console.log('  ║   ✅ Sincronización LAN activa               ║');
    console.log('  ║   📁 Datos: magic-data.json                  ║');
    console.log('  ║                                              ║');
    console.log('  ║   Para detener: Ctrl + C                     ║');
    console.log('  ╚══════════════════════════════════════════════╝\n');
});
