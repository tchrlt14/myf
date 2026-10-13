// ==========================================================
//  fiche.js — Fiche détaillée interactive des joueurs
//  Ouvre un panneau latéral moderne au clic sur n'importe
//  quel joueur (effectif, composition, mercato, match).
//  Affiche note, jauge de potentiel, radar des caractéristiques,
//  stats de saison, contrat et actions de gestion d'équipe.
// ==========================================================

(function () {
    'use strict';

    let currentPlayer = null;
    let currentList = [];
    let currentIndex = -1;

    // Calcul des 6 statistiques pour le radar (0-99)
    function calcStats(p) {
        const lvl = p.level || 70;
        const pos = p.pos || 'MID';
        const prof = p.profil || '';

        let pac = Math.round(lvl * 0.95);
        let sho = Math.round(lvl * 0.80);
        let pas = Math.round(lvl * 0.85);
        let dri = Math.round(lvl * 0.85);
        let def = Math.round(lvl * 0.65);
        let phy = Math.round(lvl * 0.80);

        if (pos === 'GK') {
            pac = Math.round(lvl * 0.60);
            sho = Math.round(lvl * 0.35);
            pas = Math.round(lvl * 0.65);
            dri = Math.round(lvl * 0.50);
            def = Math.round(lvl * 0.95);
            phy = Math.round(lvl * 0.85);
        } else if (pos === 'DEF') {
            pac = Math.round(lvl * 0.80);
            sho = Math.round(lvl * 0.45);
            pas = Math.round(lvl * 0.72);
            dri = Math.round(lvl * 0.68);
            def = Math.min(99, Math.round(lvl * 1.05));
            phy = Math.min(99, Math.round(lvl * 0.98));
        } else if (pos === 'MID') {
            pac = Math.round(lvl * 0.82);
            sho = Math.round(lvl * 0.75);
            pas = Math.min(99, Math.round(lvl * 1.02));
            dri = Math.min(99, Math.round(lvl * 0.98));
            def = Math.round(lvl * 0.78);
            phy = Math.round(lvl * 0.82);
        } else if (pos === 'ATT') {
            pac = Math.min(99, Math.round(lvl * 1.02));
            sho = Math.min(99, Math.round(lvl * 1.06));
            pas = Math.round(lvl * 0.76);
            dri = Math.min(99, Math.round(lvl * 0.96));
            def = Math.round(lvl * 0.42);
            phy = Math.round(lvl * 0.85);
        }

        if (prof === 'buteur') sho = Math.min(99, sho + 6);
        if (prof === 'clutch') { sho = Math.min(99, sho + 3); pas = Math.min(99, pas + 3); }
        if (prof === 'leader') { phy = Math.min(99, phy + 5); pas = Math.min(99, pas + 4); }
        if (prof === 'fragile') phy = Math.max(40, phy - 8);

        return { pac, sho, pas, dri, def, phy };
    }

    // Génération du SVG Radar à 6 branches
    function renderRadar(stats) {
        const cx = 165, cy = 110, r = 78;
        const labels = ['VIT', 'TIR', 'PAS', 'DRI', 'DÉF', 'PHY'];
        const values = [stats.pac, stats.sho, stats.pas, stats.dri, stats.def, stats.phy];
        const angles = [ -90, -30, 30, 90, 150, 210 ].map(a => a * Math.PI / 180);

        // Polygones de fond (grille)
        let rings = [0.25, 0.5, 0.75, 1.0].map(scale => {
            const pts = angles.map(a => {
                const x = cx + Math.cos(a) * r * scale;
                const y = cy + Math.sin(a) * r * scale;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            return `<polygon class="rd-ring" points="${pts}" />`;
        }).join('');

        // Rayons d'axes
        let axes = angles.map(a => {
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            return `<line class="rd-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
        }).join('');

        // Polygone du joueur
        const playerPts = angles.map((a, i) => {
            const val = Math.max(20, Math.min(99, values[i])) / 100;
            const x = cx + Math.cos(a) * r * val;
            const y = cy + Math.sin(a) * r * val;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        // Étiquettes et valeurs
        let textLabels = angles.map((a, i) => {
            const lx = cx + Math.cos(a) * (r + 18);
            const ly = cy + Math.sin(a) * (r + 14);
            const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
            return `<text class="rd-lab" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${labels[i]} <tspan class="rd-val">${values[i]}</tspan></text>`;
        }).join('');

        return `
            <svg class="pf-radar" viewBox="0 0 330 220" role="img" aria-label="Radar des caractéristiques">
                ${rings}
                ${axes}
                <polygon class="rd-shape" points="${playerPts}" />
                ${textLabels}
            </svg>
        `;
    }

    // Assure l'existence du panneau dans le DOM
    function ensureFicheModal() {
        let el = document.getElementById('pfiche');
        if (el) return el;

        el = document.createElement('div');
        el.id = 'pfiche';
        el.className = 'pfiche';
        el.hidden = true;
        el.innerHTML = `
            <div class="pf-backdrop" onclick="window.closePlayerFiche()"></div>
            <div class="pf-panel" id="pf-panel" tabindex="-1">
                <div class="pf-head" id="pf-head"></div>
                <div class="pf-body" id="pf-body"></div>
                <div class="pf-foot" id="pf-foot"></div>
            </div>
        `;
        document.body.appendChild(el);
        return el;
    }

    // Couleur de note
    function levelColor(lvl) {
        if (lvl >= 85) return 'var(--gold)';
        if (lvl >= 75) return 'var(--accent)';
        if (lvl >= 68) return 'var(--accent2)';
        return 'var(--muted)';
    }

    // Rendu de la fiche d'un joueur
    function renderPlayerFiche(p) {
        if (!p) return;
        currentPlayer = p;

        const modal = ensureFicheModal();
        const head = document.getElementById('pf-head');
        const body = document.getElementById('pf-body');
        const foot = document.getElementById('pf-foot');

        const posClass = `pf-pos-${p.pos || 'MID'}`;
        head.className = `pf-head ${posClass}`;

        const cColor = levelColor(p.level || 70);
        const stats = calcStats(p);

        // Profils et badges
        const profBadge = p.profil && PROFILE_LABELS && PROFILE_LABELS[p.profil]
            ? `<span class="pf-chip prof">${PROFILE_LABELS[p.profil]}</span>` : '';
        const morBadge = p.morale
            ? `<span class="pf-chip ${p.morale < 50 ? 'bad' : (p.morale < 70 ? 'warn' : '')}">Moral : ${p.morale}%</span>` : '';
        const fitBadge = p.energy !== undefined
            ? `<span class="pf-chip ${p.energy < 70 ? 'bad' : ''}">Énergie : ${p.energy}%</span>` : '';

        // Navigation Suivant / Précédent
        const hasNav = currentList.length > 1 && currentIndex >= 0;
        const navHtml = hasNav ? `
            <div class="pf-nav">
                <button class="pf-ic" onclick="window.prevPlayerFiche()" title="Joueur précédent" ${currentIndex <= 0 ? 'disabled' : ''}>‹</button>
                <span class="pf-count">${currentIndex + 1} / ${currentList.length}</span>
                <button class="pf-ic" onclick="window.nextPlayerFiche()" title="Joueur suivant" ${currentIndex >= currentList.length - 1 ? 'disabled' : ''}>›</button>
                <button class="pf-ic pf-x" onclick="window.closePlayerFiche()" title="Fermer">×</button>
            </div>
        ` : `
            <div class="pf-nav">
                <button class="pf-ic pf-x" style="margin-left:auto" onclick="window.closePlayerFiche()" title="Fermer">×</button>
            </div>
        `;

        // Drapeau et nationalité
        const flagHtml = typeof countryFlag === 'function' ? countryFlag(p.natCode || 'fr', p.flag || '🇫🇷', 18) : (p.flag || '🇫🇷');

        head.innerHTML = `
            ${navHtml}
            <div class="pf-id">
                <div class="pf-avatar">${p.pos || 'J'}</div>
                <div class="pf-who">
                    <h2>${p.name}</h2>
                    <p>${flagHtml} ${p.pos || 'Joueur'} · ${p.age || 24} ans · ${p.foot || 'Droitier'}</p>
                </div>
                <div class="pf-ovr" style="--c:${cColor}">
                    <b>${p.level}</b>
                    <span>GÉNÉRAL</span>
                </div>
            </div>
            <div class="pf-chips">
                <span class="pf-chip">${p.pos || 'Poste'}</span>
                ${profBadge}
                ${morBadge}
                ${fitBadge}
            </div>
        `;

        // Section Statistiques de Saison
        const games = p.stats_apps || p.apps || 0;
        const goals = p.stats_goals || p.goals || 0;
        const assists = p.stats_assists || p.assists || 0;

        // Potentiel
        const potMin = p.potMin || p.level;
        const potMax = p.potMax || Math.min(99, p.level + 8);
        const potWidth = Math.max(4, potMax - potMin);

        body.innerHTML = `
            <div class="pf-sec">
                <h3>STATISTIQUES DU MATCH / SAISON</h3>
                <div class="pf-stats">
                    <div><dd>${goals}</dd><dt>Buts</dt></div>
                    <div><dd>${assists}</dd><dt>Passes D.</dt></div>
                    <div><dd>${games}</dd><dt>Matchs</dt></div>
                </div>
            </div>

            <div class="pf-sec">
                <h3>ATTRIBUTS PRINCIPAUX</h3>
                ${renderRadar(stats)}
            </div>

            <div class="pf-sec">
                <h3>DÉTAILS DU JOUEUR & CONTRAT</h3>
                <ul class="pf-rows">
                    <li><span>Potentiel estimé</span><b>${potMin} – ${potMax}</b></li>
                    <li><span>Valeur marchande</span><b>${typeof fmtMoney === 'function' ? fmtMoney(p.cost || p.val || 5000000) : ((p.cost || 5000000) + ' €')}</b></li>
                    <li><span>Salaire estimé</span><b>${typeof fmtMoney === 'function' ? fmtMoney((p.wage || Math.round((p.cost || 5000000) * 0.008))) : '50k €'}/an</b></li>
                    <li><span>Forme & Condition</span><b class="${(p.energy || 100) > 80 ? 'ok' : 'warn'}">${p.energy || 100}%</b></li>
                    <li><span>Rôle tactique</span><b>${p.role || p.pos || 'Standard'}</b></li>
                </ul>
                <div class="pf-meter ${(p.energy || 100) < 70 ? 'danger' : ''}">
                    <i style="width:${p.energy || 100}%"></i>
                </div>
            </div>
        `;

        // Boutons d'action dans le footer
        const isMyPlayer = G && G.squad && G.squad.some(m => m.name === p.name);
        foot.innerHTML = isMyPlayer ? `
            <button class="pf-btn primary" onclick="window.closePlayerFiche(); showTab('squad');">
                <span>Gérer dans l'équipe</span>
                <small>Tactique & Composition</small>
            </button>
            <button class="pf-btn ghost" onclick="window.closePlayerFiche()">
                <span>Fermer</span>
                <small>Retour au jeu</small>
            </button>
        ` : `
            <button class="pf-btn primary" onclick="window.closePlayerFiche(); if (typeof buyPlayer === 'function') buyPlayer(${JSON.stringify(p.name)}); else showTab('transfers');">
                <span>Négocier le transfert</span>
                <small>${typeof fmtMoney === 'function' ? fmtMoney(p.cost || 5000000) : ''}</small>
            </button>
            <button class="pf-btn ghost" onclick="window.closePlayerFiche()">
                <span>Fermer</span>
                <small>Retour au jeu</small>
            </button>
        `;

        modal.hidden = false;
        requestAnimationFrame(() => modal.classList.add('open'));
    }

    // Fonctions globales
    window.openPlayerFiche = function (playerOrName, list) {
        if (!playerOrName) return;
        let p = null;
        if (typeof playerOrName === 'string') {
            if (G && G.squad) p = G.squad.find(x => x.name === playerOrName);
            if (!p && window.TRANSFERS_MARKET) p = window.TRANSFERS_MARKET.find(x => x.name === playerOrName);
            if (!p) p = { name: playerOrName, level: 75, pos: 'MID', age: 24, cost: 8000000 };
        } else {
            p = playerOrName;
        }

        if (Array.isArray(list)) {
            currentList = list;
            currentIndex = currentList.findIndex(x => x.name === p.name);
        } else if (G && G.squad && G.squad.some(x => x.name === p.name)) {
            currentList = G.squad;
            currentIndex = currentList.findIndex(x => x.name === p.name);
        } else {
            currentList = [p];
            currentIndex = 0;
        }

        renderPlayerFiche(p);
    };

    window.closePlayerFiche = function () {
        const modal = document.getElementById('pfiche');
        if (!modal) return;
        modal.classList.remove('open');
        setTimeout(() => { modal.hidden = true; }, 200);
    };

    window.nextPlayerFiche = function () {
        if (currentIndex < currentList.length - 1) {
            currentIndex++;
            renderPlayerFiche(currentList[currentIndex]);
        }
    };

    window.prevPlayerFiche = function () {
        if (currentIndex > 0) {
            currentIndex--;
            renderPlayerFiche(currentList[currentIndex]);
        }
    };

    // Fermeture avec la touche Échap
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('pfiche');
            if (modal && !modal.hidden) window.closePlayerFiche();
        }
    });

    // Délégation d'événements pour tout clic sur [data-fiche]
    document.addEventListener('click', e => {
        const target = e.target.closest('[data-fiche]');
        if (target) {
            const name = target.getAttribute('data-fiche') || target.textContent.trim();
            if (name) {
                e.preventDefault();
                window.openPlayerFiche(name);
            }
        }
    });

})();
