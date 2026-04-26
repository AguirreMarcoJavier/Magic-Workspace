/**
 * 🏗️ Magic Workspace Shared Logic v6.4
 * IIFE Protected Scope to prevent global collisions.
 */

(function() {
    const getSafeContext = () => {
        try {
            if (window.top && window.top.location.href) {
                try { window.top.__magic_t = true; return window.top; } catch(e) {}
            }
        } catch (e) {}
        return window;
    };

    const _ctx = getSafeContext();
    const syncDebouncers = {};

    const postSync = (key, data, device) => {
        if(syncDebouncers[key]) clearTimeout(syncDebouncers[key]);
        syncDebouncers[key] = setTimeout(() => {
            try {
                fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value: data, device })
                }).catch(e => console.warn('Sync post fallido', e));
            } catch(e) {}
            delete syncDebouncers[key];
        }, 800);
    };

    function getDeviceName() {
        let name = localStorage.getItem('magic_device_name');
        if (!name) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            name = isMobile ? 'Celular' : 'PC';
            localStorage.setItem('magic_device_name', name);
        }
        return name;
    }

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/sync', false);
        xhr.send(null);
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            for (const k in data) {
                localStorage.setItem(k, JSON.stringify(data[k]));
            }
        }
    } catch(e) {
        console.warn('Local sync inicial fallida', e);
    }

    // Historial persistente en sessionStorage (sobrevive navegación de página)
    const HISTORY_KEY = '__magic_history__';
    const getHistory = () => {
        try {
            const raw = sessionStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    };
    const saveHistory = (h) => {
        try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
    };

    window.MagicShared = {
        syncTheme: function() {
            try {
                const mode = localStorage.getItem('magic_theme_mode');
                if(mode === 'light') document.body.classList.add('light-mode');
                else document.body.classList.remove('light-mode');
            } catch(e) {}
        },

        initAppMode: function() {
            // Inyectar barra de navegación superior en apps (si no es el dashboard)
            const isIndex = window.location.pathname === '/' ||
                            window.location.pathname.endsWith('index.html') ||
                            window.location.pathname === '';
            if (isIndex) return; // No inyectar en el dashboard

            const nav = document.createElement('div');
            nav.id = 'magic-app-nav';
            nav.innerHTML = `
                <a href="/" id="magic-back-btn">
                    <span>←</span>
                    <span>Dashboard</span>
                </a>
                <span id="magic-nav-title">${document.title || 'App'}</span>
                <span></span>
            `;

            const navStyle = document.createElement('style');
            navStyle.textContent = `
                #magic-app-nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 9999;
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: rgba(10,10,10,0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    font-family: 'Inter', sans-serif;
                }
                #magic-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--primary, #a855f7);
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: opacity 0.2s;
                }
                #magic-back-btn:hover { opacity: 0.7; }
                #magic-nav-title {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-align: center;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                body { padding-top: 52px !important; }
                body.light-mode #magic-app-nav {
                    background: rgba(248,250,252,0.9);
                    border-bottom-color: rgba(0,0,0,0.08);
                }
                body.light-mode #magic-nav-title { color: rgba(0,0,0,0.4); }
            `;

            document.head.appendChild(navStyle);
            document.body.insertBefore(nav, document.body.firstChild);

            // Ocultar los nav-link inline que ya existían (reemplazados por la nav bar)
            document.querySelectorAll('.nav-link').forEach(link => link.style.display = 'none');
        },

        save: function(key, data) {
            const fullKey = `magic_${key}`;
            let oldVal = null;
            try {
                const raw = localStorage.getItem(fullKey);
                oldVal = raw ? JSON.parse(raw) : null;
            } catch(e) {}

            try {
                const history = getHistory();
                history.unshift({ timestamp: new Date().toLocaleTimeString(), key: key, old: oldVal, new: data, device: getDeviceName() });
                if(history.length > 30) history.pop();
                saveHistory(history);
            } catch(e) {}
            
            try {
                localStorage.setItem(fullKey, JSON.stringify(data));
                
                postSync(key, data, getDeviceName());

                const event = new CustomEvent('magic:data-changed', { detail: { key, data } });
                _ctx.dispatchEvent(event);
                if(_ctx !== window) window.dispatchEvent(event);
            } catch(e) {
                try { window.dispatchEvent(new CustomEvent('magic:data-changed', { detail: { key, data } })); } catch(e2) {}
            }
        },

        load: function(key, fallback = null) {
            try {
                const saved = localStorage.getItem(`magic_${key}`);
                if(!saved) return fallback;
                return JSON.parse(saved);
            } catch(e) { return fallback; }
        },

        utils: {
            caesar: function(text, shift) {
                return text.replace(/[a-z]/gi, (c) => {
                    const s = c <= 'Z' ? 65 : 97;
                    return String.fromCharCode(((c.charCodeAt(0) - s + shift) % 26 + 26) % 26 + s);
                });
            }
        },

        DevTools: {
            fps: 0, hudActive: false, outlineActive: false,
            toggleHUD: function() {
                this.hudActive = !this.hudActive;
                const hud = document.getElementById('debugHUD');
                if(hud) hud.style.display = this.hudActive ? 'block' : 'none';
                if(this.hudActive) this.startFPSCounter();
            },
            toggleOutline: function() {
                this.outlineActive = !this.outlineActive;
                document.body.classList.toggle('debug-outline-mode', this.outlineActive);
            },
            startFPSCounter: function() {
                let lastTime = performance.now(); let frames = 0;
                const loop = () => {
                    if(!this.hudActive) return;
                    frames++; const now = performance.now();
                    if(now >= lastTime + 1000) { this.fps = frames; frames = 0; lastTime = now;
                        const el = document.getElementById('debugFPS'); if(el) el.innerText = `FPS: ${this.fps}`;
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            }
        },

        Cheats: {
            sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'],
            currentStep: 0, lastTime: 0,
            init: function() {
                document.addEventListener('keydown', (e) => {
                    const now = Date.now();
                    if (this.currentStep > 0 && now - this.lastTime > 4000) this.currentStep = 0;
                    this.lastTime = now;
                    const mapping = { 'Up':'ArrowUp', 'Down':'ArrowDown', 'Left':'ArrowLeft', 'Right':'ArrowRight', 'NumpadEnter':'Enter' };
                    const normalized = mapping[e.key] || e.key;
                    if (normalized.toLowerCase() === this.sequence[this.currentStep].toLowerCase()) {
                        this.currentStep++;
                        if (this.currentStep === this.sequence.length) { this.activate(); this.currentStep = 0; }
                    } else { this.currentStep = (normalized.toLowerCase() === this.sequence[0].toLowerCase()) ? 1 : 0; }
                });
            },
            activate: function() {
                try {
                    const event = new CustomEvent('magic:cheat-activated');
                    _ctx.dispatchEvent(event);
                    if(_ctx !== window) window.dispatchEvent(event);
                } catch(e) { try { window.dispatchEvent(new CustomEvent('magic:cheat-activated')); } catch(e2) {} }
                document.body.style.animation = 'glitch-flash 0.3s ease';
                setTimeout(() => document.body.style.animation = '', 300);
            }
        }
    };

    // ==========================================
    // 🧠 MAGIC AI ENGINE (Integración Gemini)
    // ==========================================
    window.MagicAI = {
        getApiKey: function() {
            return localStorage.getItem('magic_gemini_api_key');
        },
        
        async askGemini(prompt, history = []) {
            try {
                const apiKey = this.getApiKey();
                if (!apiKey) {
                    throw new Error("API_KEY_MISSING");
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                
                const requestBody = {
                    contents: [...history, { role: "user", parts: [{ text: prompt }] }]
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error((errorData.error && errorData.error.message) ? errorData.error.message : response.statusText);
                }

                const data = await response.json();
                
                if(data && data.candidates && data.candidates.length > 0) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("No obtuve una respuesta válida de Google.");
                }
            } catch (error) {
                console.error("MagicAI Error:", error);
                throw error;
            }
        }
    };

    window.addEventListener('storage', () => MagicShared.syncTheme());
    window.addEventListener('DOMContentLoaded', () => {
        try { MagicShared.syncTheme(); MagicShared.initAppMode(); MagicShared.Cheats.init(); } catch(e) {}
    });

    const style = document.createElement('style');
    style.textContent = `@keyframes glitch-flash { 0% { filter: invert(1) hue-rotate(90deg); opacity: 0.5; } 50% { filter: invert(0) hue-rotate(180deg); opacity: 1; } 100% { filter: invert(0) hue-rotate(0deg); } }`;
    document.head.appendChild(style);
})();
