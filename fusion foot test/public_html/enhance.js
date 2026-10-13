// ==========================================================
//  enhance.js — couche de fonctionnalités par-dessus script.js
//  • icônes vectorielles à la place des emojis de navigation
//  • palette de commandes (Ctrl+K ou /) et raccourcis clavier
//  • forme récente (5 derniers matchs) dans la barre du haut
//  • sauvegarde automatique après chaque journée
// ==========================================================
(function () {
    'use strict';
    // G est un `let` global de script.js : visible ici, mais pas via window.G
    const hasG = () => { try { return !!G; } catch (e) { return false; } };

    const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]+\s*/gu;
    const ICONS = {
        match: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
        squad: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 5.5a3 3 0 010 5.5M18 14.3c1.8.8 3 2.7 3 5.7"/>',
        transfers: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
        standings: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 20h8"/>',
        europe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
        calendrier: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        upgrades: '<path d="M12 20V6M6 12l6-6 6 6"/>',
        formation: '<path d="M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
        stade: '<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9"/>',
        staff: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5M12 14l-1.5 3 1.5 2 1.5-2z"/>',
        dashboard: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
        contrats: '<path d="M7 3h8l4 4v14H7zM14 3v5h5M10 13h6M10 17h6"/>',
        save: '<path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6"/>'
    };
    const svg = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg>';
    const tabKey = btn => ((btn.getAttribute('onclick') || '').match(/showTab\('(\w+)'/) || [])[1];

    // ---- 1. Icônes + suppression des emojis décoratifs statiques ----
    function stripEmojis(root) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (w.nextNode()) nodes.push(w.currentNode);
        nodes.forEach(n => { n.nodeValue = n.nodeValue.replace(EMOJI, ''); });
    }
    function initNav() {
        document.querySelectorAll('.tab-btn').forEach(b => {
            const k = tabKey(b);
            if (k) {
                b.id = b.id || 'tab-button-' + k;
                b.setAttribute('role', 'tab');
                b.setAttribute('aria-controls', 'tab-' + k);
                b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false');
                b.tabIndex = b.classList.contains('active') ? 0 : -1;
                const panel = document.getElementById('tab-' + k);
                if (panel) {
                    panel.setAttribute('role', 'tabpanel');
                    panel.setAttribute('aria-labelledby', b.id);
                }
                b.addEventListener('keydown', e => {
                    const tabs = [...b.parentElement.querySelectorAll('[role="tab"]')].filter(x => x.style.display !== 'none');
                    const current = tabs.indexOf(b);
                    let next = null;
                    if (e.key === 'ArrowRight') next = tabs[(current + 1) % tabs.length];
                    else if (e.key === 'ArrowLeft') next = tabs[(current - 1 + tabs.length) % tabs.length];
                    else if (e.key === 'Home') next = tabs[0];
                    else if (e.key === 'End') next = tabs[tabs.length - 1];
                    if (next) { e.preventDefault(); next.click(); next.focus(); }
                });
            }
            stripEmojis(b);
            b.textContent = b.textContent.trim();
            if (ICONS[k]) b.insertAdjacentHTML('afterbegin', svg(k));
        });
        ['.prematch-title', '.style-btn', '.squad-view-btn', '.top-scorers-title', '.bench-title',
         '.halftime-title', '.halftime-btn', '.obj-icon', '.morale-label', '.tactics-label', '.lineup-hint',
         '.transfers-header .refresh-btn'].forEach(sel =>
            document.querySelectorAll(sel).forEach(stripEmojis));
    }

    function initDialogFocus() {
        const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
        let returnFocus = null;
        const activeDialog = () => dialogs.find(d => d.style.display !== 'none');
        const focusFirst = dialog => {
            const target = dialog.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
            (target || dialog).focus();
        };
        dialogs.forEach(dialog => {
            if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
            new MutationObserver(() => {
                const active = activeDialog();
                if (active === dialog) {
                    if (!returnFocus) returnFocus = document.activeElement;
                    focusFirst(dialog);
                } else if (!active && returnFocus) {
                    const previous = returnFocus;
                    returnFocus = null;
                    if (previous && previous.isConnected && !previous.disabled) previous.focus();
                }
            }).observe(dialog, {attributes: true, attributeFilter: ['style']});
        });
        document.addEventListener('keydown', e => {
            const dialog = activeDialog();
            if (!dialog || e.key !== 'Tab') return;
            const items = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
                .filter(item => item.getClientRects().length > 0);
            if (!items.length) { e.preventDefault(); dialog.focus(); return; }
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                e.preventDefault(); first.focus();
            }
        });
    }

    // ---- 2. Palette de commandes + raccourcis ----
    let cmdk, cmdInput, cmdList, cmdItems = [], cmdSel = 0;
    function buildCmdk() {
        cmdk = document.createElement('div');
        cmdk.className = 'cmdk';
        cmdk.setAttribute('role', 'dialog');
        cmdk.setAttribute('aria-label', 'Aller à…');
        cmdk.innerHTML = '<div class="cmdk-box"><input type="text" placeholder="Aller à un écran ou lancer une action…" aria-label="Rechercher"><ul></ul>' +
            '<div class="cmdk-foot">↑ ↓ pour naviguer · Entrée pour valider · Échap pour fermer</div></div>';
        document.body.appendChild(cmdk);
        cmdInput = cmdk.querySelector('input');
        cmdList = cmdk.querySelector('ul');
        cmdInput.addEventListener('input', renderCmd);
        cmdk.addEventListener('mousedown', e => { if (e.target === cmdk) closeCmd(); });
        cmdInput.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { cmdSel = Math.min(cmdSel + 1, cmdItems.length - 1); paintSel(); e.preventDefault(); }
            else if (e.key === 'ArrowUp') { cmdSel = Math.max(cmdSel - 1, 0); paintSel(); e.preventDefault(); }
            else if (e.key === 'Enter' && cmdItems[cmdSel]) { runCmd(cmdItems[cmdSel]); }
            else if (e.key === 'Escape') closeCmd();
        });
    }
    function allCommands() {
        const cmds = [];
        document.querySelectorAll('.tab-btn').forEach((b, i) => {
            const k = tabKey(b);
            if (!k || b.style.display === 'none') return;
            cmds.push({ label: b.textContent.trim(), key: k, btn: b, hint: i < 9 ? String(i + 1) : '' });
        });
        cmds.push({ label: 'Jouer le prochain match', action: () => { const p = document.getElementById('playBtn'); if (p && !p.disabled) { goTab('match'); p.click(); } }, icon: 'match', hint: 'Espace' });
        cmds.push({ label: 'Sauvegarder maintenant', action: () => { if (hasG()) saveGame(); }, icon: 'save', hint: '' });
        return cmds;
    }
    function renderCmd() {
        const q = cmdInput.value.trim().toLowerCase();
        cmdItems = allCommands().filter(c => c.label.toLowerCase().includes(q));
        cmdSel = 0;
        cmdList.innerHTML = cmdItems.map((c, i) =>
            '<li data-i="' + i + '">' + svg(c.key || c.icon) + '<span>' + c.label + '</span>' + (c.hint ? '<kbd>' + c.hint + '</kbd>' : '') + '</li>').join('');
        cmdList.querySelectorAll('li').forEach(li => li.addEventListener('click', () => runCmd(cmdItems[+li.dataset.i])));
        paintSel();
    }
    function paintSel() {
        cmdList.querySelectorAll('li').forEach((li, i) => li.classList.toggle('sel', i === cmdSel));
        const s = cmdList.querySelector('li.sel');
        if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    }
    function openCmd() { if (!hasG()) return; cmdInput.value = ''; renderCmd(); cmdk.classList.add('open'); cmdInput.focus(); }
    function closeCmd() { cmdk.classList.remove('open'); }
    function runCmd(c) { closeCmd(); if (c.action) c.action(); else goTab(c.key); }
    function goTab(k) {
        const b = [...document.querySelectorAll('.tab-btn')].find(x => tabKey(x) === k);
        if (b) showTab(k, b);
    }
    function onKey(e) {
        const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''));
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            if (document.querySelector('.pfiche:not([hidden])')) return; e.preventDefault(); cmdk.classList.contains('open') ? closeCmd() : openCmd(); return; }
        if (typing || !hasG() || cmdk.classList.contains('open')) return;
        if (document.querySelector('.pfiche:not([hidden])')) return;
        if (!document.getElementById('s-game').classList.contains('active')) return;
        if (e.key === '/') { e.preventDefault(); openCmd(); return; }
        if (/^[1-9]$/.test(e.key)) { const b = document.querySelectorAll('.tab-btn')[+e.key - 1]; if (b && b.style.display !== 'none') b.click(); return; }
        if (e.key === ' ' || e.key === 'Enter') {
            const onMatch = document.getElementById('tab-match').classList.contains('active');
            const p = document.getElementById('playBtn');
            const modalOpen = [...document.querySelectorAll('.event-modal, .season-summary')].some(m => m.style.display !== 'none');
            if (onMatch && p && !p.disabled && !modalOpen && document.activeElement.tagName !== 'BUTTON' && !(document.activeElement.dataset && document.activeElement.dataset.fiche !== undefined)) { e.preventDefault(); p.click(); }
        }
    }

    // ---- 3. Forme récente + 4. Sauvegarde automatique ----
    let lastDay = null, saveLabel;
    function ensureWidgets() {
        const bar = document.querySelector('.stats-bar');
        if (bar && !document.getElementById('g-form-pill')) {
            bar.insertAdjacentHTML('beforeend', '<div class="stat-pill" id="g-form-pill"><span class="label">Forme</span><span class="form-guide" id="g-form"></span></div>');
        }
        const top = document.querySelector('.top-bar');
        if (top && !saveLabel) {
            saveLabel = document.createElement('div');
            saveLabel.className = 'save-indicator';
            saveLabel.hidden = true;
            top.appendChild(saveLabel);
        }
    }
    function afterTopBar() {
        if (!hasG()) return;
        ensureWidgets();
        const f = document.getElementById('g-form');
        if (f) f.innerHTML = (G.results || []).slice(-5).map(r => '<i class="' + r + '" title="' + (r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite') + '">' + r + '</i>').join('') || '<i style="background:var(--panel4);color:var(--muted)">–</i>';
        if (lastDay !== null && G.matchDay !== lastDay && G.matchDay > 0) autoSave();
        lastDay = G.matchDay;
    }
    function autoSave() {
        try {
            localStorage.setItem('fm_save_' + saveSlot, JSON.stringify(G));
            const t = new Date();
            saveLabel.hidden = false;
            saveLabel.textContent = 'Sauvegarde auto · slot ' + (saveSlot + 1) + ' · ' + t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { /* stockage plein ou indisponible : on ne bloque pas la partie */ }
    }

    // ---- 5. Effets Sonores Web Audio API natifs & Feedback tactile ----
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('fm_sound') !== '0';

    function getAudioCtx() {
        if (!audioCtx) {
            const AudioClass = window.AudioContext || window.webkitAudioContext;
            if (AudioClass) audioCtx = new AudioClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    const AudioFX = {
        tap: () => {
            if (!soundEnabled) return;
            try {
                const ctx = getAudioCtx(); if (!ctx) return;
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(380, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.035);
            } catch (e) {}
        },
        whistle: () => {
            if (!soundEnabled) return;
            try {
                const ctx = getAudioCtx(); if (!ctx) return;
                const now = ctx.currentTime;
                [0, 0.12].forEach(delay => {
                    const osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(2800, now + delay);
                    osc.frequency.linearRampToValueAtTime(3300, now + delay + 0.04);
                    osc.frequency.linearRampToValueAtTime(2900, now + delay + 0.09);
                    gain.gain.setValueAtTime(0, now + delay);
                    gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(now + delay); osc.stop(now + delay + 0.09);
                });
            } catch (e) {}
        },
        whistleTriple: () => {
            if (!soundEnabled) return;
            try {
                const ctx = getAudioCtx(); if (!ctx) return;
                const now = ctx.currentTime;
                [0, 0.11, 0.25].forEach((delay, i) => {
                    const dur = i === 2 ? 0.22 : 0.09;
                    const osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(2900, now + delay);
                    gain.gain.setValueAtTime(0.1, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(now + delay); osc.stop(now + delay + dur);
                });
            } catch (e) {}
        },
        goal: () => {
            if (!soundEnabled) return;
            try {
                const ctx = getAudioCtx(); if (!ctx) return;
                const now = ctx.currentTime;
                [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
                    const osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.035);
                    gain.gain.setValueAtTime(0.12, now + idx * 0.035);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(now + idx * 0.035); osc.stop(now + 0.45);
                });
            } catch (e) {}
        }
    };
    window.AudioFX = AudioFX;

    function initMatchObserver() {
        const log = document.getElementById('matchLog');
        if (!log) return;
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        const txt = node.textContent || '';
                        if (txt.includes('BUT !') || (node.classList && node.classList.contains('log-goal'))) {
                            AudioFX.goal();
                            const sd = document.getElementById('scoreDisplay');
                            if (sd) {
                                sd.classList.remove('goal-pulse');
                                void sd.offsetWidth;
                                sd.classList.add('goal-pulse');
                            }
                        } else if (txt.includes("Coup d'envoi")) {
                            AudioFX.whistle();
                        } else if (txt.includes('Fin du match')) {
                            AudioFX.whistleTriple();
                        }
                    }
                }
            }
        });
        observer.observe(log, { childList: true, subtree: true });
    }

    // Bouton de bascule audio dans la barre supérieure
    function ensureSoundButton() {
        const top = document.querySelector('.top-bar');
        if (top && !document.getElementById('sound-toggle-btn')) {
            const btn = document.createElement('button');
            btn.id = 'sound-toggle-btn';
            btn.className = 'btn-outline';
            btn.style.cssText = 'padding:5px 11px;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:5px;cursor:pointer;';
            btn.innerHTML = soundEnabled ? '🔊 Son' : '🔇 Muet';
            btn.title = 'Activer/Désactiver le son';
            btn.onclick = () => {
                soundEnabled = !soundEnabled;
                localStorage.setItem('fm_sound', soundEnabled ? '1' : '0');
                btn.innerHTML = soundEnabled ? '🔊 Son' : '🔇 Muet';
                if (soundEnabled) AudioFX.tap();
            };
            top.appendChild(btn);
        }
    }

    // Clics tactiles satisfaisants sur l'UI
    document.addEventListener('click', e => {
        if (e.target.closest('button, .tab-btn, .club-card, .player-card, .market-card, .tactic-btn, .style-btn')) {
            AudioFX.tap();
        }
    }, true);

    function init() {
        initNav();
        initDialogFocus();
        buildCmdk();
        initMatchObserver();
        document.addEventListener('keydown', onKey);
        if (typeof updateTopBar === 'function') {
            const orig = updateTopBar;
            window.updateTopBar = updateTopBar = function () { 
                orig.apply(this, arguments); 
                afterTopBar(); 
                ensureSoundButton();
            };
        }
        if (typeof startNewGame === 'function') {
            const o = startNewGame;
            window.startNewGame = startNewGame = function () { lastDay = null; return o.apply(this, arguments); };
        }
        if (typeof loadGame === 'function') {
            const o = loadGame;
            window.loadGame = loadGame = function () { lastDay = null; return o.apply(this, arguments); };
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
