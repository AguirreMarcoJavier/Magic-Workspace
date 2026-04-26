/**
 * 🏗️ Dashboard Logic v7.2
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

    window.Dashboard = {
        palettes: {
            'home': '#0a0a0a', 'pomodoro': '#042f2e', 'clima': '#1c0f0a', 'gastos': '#0a0a1a',
            'contrasenas': '#1a0a0a', 'cuotas': '#1a140a', 'grabador': '#0a1a0a', 'agenda': '#1a0a0a',
            'gemini': '#1a1a0a', 'calculadora': '#0a0a1a', 'objetos': '#0a0a1a', 'critico': '#1a0a0a',
            'deudas': '#0a1a0a', 'proyectos': '#0a0a1a', 'cerebro': '#0a1a1a', 'revision': '#1a0a1a',
            'propuestas': '#0a0f1a'
        },
        neonThemes: [
            { main: '#a855f7', muted: 'rgba(168, 85, 247, 0.1)' },
            { main: '#06b6d4', muted: 'rgba(6, 182, 212, 0.1)' },
            { main: '#22c55e', muted: 'rgba(34, 197, 94, 0.1)' },
            { main: '#ec4899', muted: 'rgba(236, 72, 153, 0.1)' },
            { main: '#f916d7', muted: 'rgba(249, 22, 215, 0.1)' },
            { main: '#fbbf24', muted: 'rgba(251, 191, 36, 0.1)' }
        ],
        currentThemeIndex: 0,

        init: function() {
            try {
                this.loadInitialState();
                this.renderAll();
            } catch(e) { console.error("[Dashboard] Init error:", e); }
        },

        loadInitialState: function() {
            try {
                const savedTheme = localStorage.getItem('magic_current_theme');
                if(savedTheme !== null) this.currentThemeIndex = parseInt(savedTheme);
                this.applyTheme(this.currentThemeIndex);
                const savedMode = localStorage.getItem('magic_theme_mode');
                if(savedMode === 'light') document.body.classList.add('light-mode');
            } catch(e) {}
        },

        renderAll: function() {
            try {
                this.updateStats();
                this.renderMonthEvents();
                this.checkMarketingInsight();
            } catch(e) {}
        },

        updateStats: function() {
            try {
                // 1. Tareas del Foco Crítico
                const tasks = (typeof MagicShared !== 'undefined') ? MagicShared.load('strategic_tasks', []) : [];
                let total = tasks.length;
                let done = tasks.filter(t => t.completed).length;

                // 2. Hábitos Diarios Activos
                const habits = (typeof MagicShared !== 'undefined') ? MagicShared.load('strategic_habits', []) : [];
                const jsDay = new Date().getDay();
                // Días hábiles L-V (en JS: domingo = 0, lunes = 1... viernes = 5)
                const habitDayIdx = (jsDay >= 1 && jsDay <= 5) ? (jsDay - 1) : -1;
                
                if (habitDayIdx !== -1) {
                    total += habits.length;
                    done += habits.filter(h => h.history && h.history[habitDayIdx]).length;
                }

                // Cálculo: Evitar penalizar dividiendo por 0 si no hay tareas planificadas.
                const eff = total === 0 ? 0 : Math.round((done / total) * 100);
                
                const doneEl = document.getElementById('statsDone');
                const effEl = document.getElementById('statsEff');
                
                if(doneEl) doneEl.innerText = total === 0 ? '-' : done;
                // Si total es 0, mostramos vacío para no desmotivar.
                if(effEl) effEl.innerText = total === 0 ? '--%' : eff + '%';
                
                this.renderEfficiencyChart(eff);
            } catch(e) {}
        },

        renderEfficiencyChart: function(currentEff) {
            try {
                const chart = document.getElementById('effChart'); if(!chart) return;
                chart.innerHTML = '';
                const history = [65, 80, 75, 90, 85, 70, currentEff];
                history.forEach((val, i) => {
                    const bar = document.createElement('div');
                    bar.className = 'chart-bar' + (i === 6 ? ' active' : '');
                    bar.style.height = Math.max(val * 0.4, 4) + 'px';
                    chart.appendChild(bar);
                });
            } catch(e) {}
        },

        toggleSidebar: function() {
            try {
                const sidebar = document.getElementById('sidebar');
                if(sidebar) sidebar.classList.toggle('pinned');
            } catch(e) {}
        },

        toggleCategory: function(id) {
            try {
                const target = document.getElementById(id); if(!target) return;
                const isOpen = target.classList.contains('open');
                document.querySelectorAll('.sidebar-category').forEach(cat => cat.classList.remove('open'));
                if(!isOpen) target.classList.add('open');
            } catch(e) {}
        },

        loadApp: function(url, el, bgType) {
            try {
                if(el) {
                    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    el.classList.add('active');
                }

                if(url === 'home') {
                    // Volver al home del dashboard (no navega fuera)
                    const home = document.getElementById('homeSection');
                    if(home) {
                        home.style.display = 'block';
                        setTimeout(() => home.style.opacity = '1', 10);
                    }
                    this.renderAll();
                } else {
                    // Navegación directa — sin iframe
                    window.location.href = url;
                }
            } catch(e) {}
        },

        autoOpenCategoryByApp: function(url) {
            try {
                const item = document.querySelector(`.nav-item[onclick*="${url}"]`);
                if(item) {
                    const wrapper = item.closest('.sidebar-category');
                    if(wrapper) {
                        document.querySelectorAll('.sidebar-category').forEach(cat => cat.classList.remove('open'));
                        wrapper.classList.add('open');
                    }
                }
            } catch(e) {}
        },

        applyTheme: function(index) {
            try {
                const theme = this.neonThemes[index];
                const root = document.documentElement;
                root.style.setProperty('--primary', theme.main);
                root.style.setProperty('--primary-muted', theme.muted);
                localStorage.setItem('magic_current_theme', index);
            } catch(e) {}
        },

        cycleTheme: function() { this.currentThemeIndex = (this.currentThemeIndex + 1) % this.neonThemes.length; this.applyTheme(this.currentThemeIndex); },

        toggleThemeMode: function() {
            try {
                const body = document.body; const isLight = body.classList.toggle('light-mode');
                localStorage.setItem('magic_theme_mode', isLight ? 'light' : 'dark');
                const btn = document.getElementById('themeBtn'); if(btn) btn.innerHTML = isLight ? '☀️ Modo Día' : '🌙 Modo Noche';
            } catch(e) {}
        },

        renderMonthEvents: function() {
            try {
                const list = document.getElementById('monthEventsList'); if(!list) return;
                list.innerHTML = '';
                const events = (typeof MagicShared !== 'undefined') ? MagicShared.load('agenda_events', []) : [];
                const filtered = events.slice(0, 4);
                if(filtered.length === 0) { list.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center">Sin eventos este mes.</p>'; return; }
                filtered.forEach(ev => {
                    const day = ev.date?.split('-')[2] || '??';
                    const item = document.createElement('div');
                    item.className = 'event-item-mini';
                    item.onclick = () => this.loadApp('calendario.html', null, 'agenda');
                    item.innerHTML = `<div class="event-date-box">${day}<span>Día</span></div><div class="event-mini-info"><h4>${ev.title}</h4><p>${ev.time || 'Todo el día'}</p></div>`;
                    list.appendChild(item);
                });
            } catch(e) {}
        },

        checkMarketingInsight: function() {
            const banner = document.getElementById('marketingBanner'); if(banner) banner.style.display = 'none';
        },

        filterCards: function(type, btnEl) {
            try {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                if(btnEl) btnEl.classList.add('active');
                document.querySelectorAll('.card').forEach(c => {
                    const match = (type === 'all') || c.classList.contains('cat-' + type);
                    c.style.display = match ? 'flex' : 'none';
                });
            } catch(e) {}
        },

        debugClearStorage: function() {
            try { if(confirm('⚠️ ¿ESTÁS SEGURO?')) {
                Object.keys(localStorage).forEach(key => { if(key.startsWith('magic_')) localStorage.removeItem(key); });
                location.reload();
            }} catch(e) {}
        },

        switchDebugTab: function(tabId, btn) {
            try {
                document.querySelectorAll('.debug-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.debug-content-section').forEach(s => s.classList.remove('active'));
                btn.classList.add('active'); document.getElementById(tabId).classList.add('active');
            } catch(e) {}
        },

        refreshDebugInfo: function() {
            try {
                const si = document.getElementById('debugSystemInfo');
                if(si) si.innerHTML = `Agent: ${navigator.userAgent.split(' ')[0]} | Theme: ${localStorage.getItem('magic_theme_mode') || 'dark'}`;
                const sti = document.getElementById('debugStorageInfo');
                if(sti) { const totalKeys = Object.keys(localStorage).filter(k => k.startsWith('magic_')).length; sti.innerHTML = `Objetos: ${totalKeys}`; }
                this.renderDebugHistory();
            } catch(e) {}
        },

        // Genera descripción legible comparando old vs new
        generateDescription: function(key, oldData, newData) {
            try {
                // Cambios en arrays (tareas, proyectos, hábitos, eventos, transacciones)
                if (Array.isArray(newData) && Array.isArray(oldData || [])) {
                    const old = oldData || [];
                    if (newData.length > old.length) {
                        const added = newData.find(n => !old.some(o => o.id === n.id));
                        const name = added?.text || added?.name || added?.title || added?.description || 'elemento';
                        return `✅ Se agregó <strong>"${name}"</strong>`;
                    } else if (newData.length < old.length) {
                        const removed = old.find(o => !newData.some(n => n.id === o.id));
                        const name = removed?.text || removed?.name || removed?.title || 'elemento';
                        return `🗑️ Se eliminó <strong>"${name}"</strong>`;
                    } else {
                        // Mismo largo: algo se modificó (ej. togglear completado)
                        for (let i = 0; i < newData.length; i++) {
                            if (JSON.stringify(newData[i]) !== JSON.stringify(old[i])) {
                                const item = newData[i];
                                const name = item?.text || item?.name || item?.title || 'elemento';
                                if (item?.completed !== undefined) {
                                    return item.completed
                                        ? `✔️ Completado: <strong>"${name}"</strong>`
                                        : `↩️ Reabierto: <strong>"${name}"</strong>`;
                                }
                                return `✏️ Se modificó <strong>"${name}"</strong>`;
                            }
                        }
                        return `💾 Actualizados`;
                    }
                }

                // Objeto de finanzas estratégicas
                if (key === 'strategic_finance') {
                    const old = oldData || {};
                    if (newData.debts && old.debts !== undefined) {
                        if (newData.debts.length > (old.debts?.length || 0)) {
                            const added = newData.debts[newData.debts.length - 1];
                            return `✅ Nueva deuda: <strong>"${added.name}" $${parseFloat(added.amount).toLocaleString()}</strong>`;
                        }
                        if (newData.debts.length < (old.debts?.length || 0)) {
                            return `🗑️ Deuda eliminada`;
                        }
                    }
                    const labels = { expected: 'Ingresos Esperados', real: 'Ingresos Reales', cash: 'Caja Total' };
                    for (const [field, label] of Object.entries(labels)) {
                        if (old[field] !== newData[field]) {
                            return `💰 ${label}: <strong>$${parseFloat(newData[field] || 0).toLocaleString()}</strong>`;
                        }
                    }
                    return `💰 Finanzas actualizadas`;
                }

                // Revisión semanal
                if (key === 'strategic_review') return `📝 Bitácora actualizada`;

                // Notas de voz
                if (typeof newData === 'string') return `📄 Notas actualizadas`;

                // Finanzas gastos
                if (key === 'finances_v2') {
                    const old = oldData || [];
                    if (newData.length > old.length) {
                        const added = newData.find(n => !old.some(o => o.id === n.id));
                        const label = added?.type === 'income' ? 'Ingreso' : 'Gasto';
                        return `✅ ${label}: <strong>"${added?.description || ''}" $${added?.amount || 0}</strong>`;
                    }
                    if (newData.length < old.length) return `🗑️ Transacción eliminada`;
                }

                return `💾 Datos guardados`;
            } catch(e) {
                return `💾 Datos guardados`;
            }
        },

        renderDebugHistory: function() {
            try {
                const list = document.getElementById('debugHistoryList'); if(!list) return;
                let history = [];
                try {
                    const raw = sessionStorage.getItem('__magic_history__');
                    history = raw ? JSON.parse(raw) : [];
                } catch(e) {}

                if(history.length === 0) {
                    list.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">Sin acciones. Realizá cambios en las apps y volvé aquí.</p>';
                    return;
                }
                list.innerHTML = history.map((action, index) => {
                    const desc = this.generateDescription(action.key, action.old, action.new);
                    const appName = ({
                        strategic_tasks: 'Foco Crítico',
                        strategic_finance: 'Finanzas & Deudas',
                        strategic_projects: 'Proyectos',
                        strategic_review: 'Revisión',
                        strategic_habits: 'Hábitos',
                        agenda_events: 'Agenda',
                        finances_v2: 'Gastos',
                        notes: 'Grabador',
                        job_proposals: 'Trácker Laboral'
                    })[action.key] || action.key;

                    return `<div class="history-item" id="hitem-${index}">
                        <div class="history-header">
                            <span class="history-key">${appName} <small style="opacity:0.6;font-weight:normal;padding-left:0.3rem">(${action.device || 'PC'})</small></span>
                            <span class="history-time">${action.timestamp}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin: 0.3rem 0 0.6rem 0;">${desc}</div>
                        <div class="history-actions" id="hactions-${index}">
                            <button class="magic-btn secondary" style="padding:0.3rem 0.8rem;font-size:0.7rem"
                                onclick="Dashboard.showRevertConfirm(${index})">&#8617; Revertir</button>
                        </div>
                    </div>`;
                }).join('');
            } catch(e) {}
        },

        showRevertConfirm: function(index) {
            const actionsEl = document.getElementById('hactions-' + index);
            if (!actionsEl) return;
            actionsEl.innerHTML = `
                <span style="font-size:0.8rem; color:var(--text); margin-right:0.6rem">¿Desea revertir este cambio?</span>
                <button class="magic-btn" style="padding:0.3rem 0.8rem;font-size:0.7rem;background:var(--danger)"
                    onclick="Dashboard.debugRevert(${index})">Sí</button>
                <button class="magic-btn secondary" style="padding:0.3rem 0.8rem;font-size:0.7rem; margin-left:0.4rem"
                    onclick="Dashboard.renderDebugHistory()">No</button>
            `;
        },

        debugRevert: function(index) {
            try {
                let history = [];
                try {
                    const raw = sessionStorage.getItem('__magic_history__');
                    history = raw ? JSON.parse(raw) : [];
                } catch(e) {}
                const action = history[index]; if(!action) return;
                if(action.old === null) localStorage.removeItem(`magic_${action.key}`);
                else localStorage.setItem(`magic_${action.key}`, JSON.stringify(action.old));
                history.splice(index, 1);
                sessionStorage.setItem('__magic_history__', JSON.stringify(history));
                this.refreshDebugInfo();
            } catch(e) {}
        }
    };

    window.addEventListener('DOMContentLoaded', () => Dashboard.init());
})();
