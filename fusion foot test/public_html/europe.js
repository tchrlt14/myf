// ==========================================================
//  europe.js — habillage « soirées européennes »
//  Ligue des Champions (bleu nuit / argent), Ligue Europa (orange),
//  Conference League (vert). Emblèmes dessinés en SVG (aucun logo officiel).
//  • écran de match plein cadre : présentation, score qui monte, issue du tour
//  • bannière « prochain match / résultat » sur l'accueil
//  • en-tête de l'écran de match quand l'amical / le match européen est joué en direct
//  • emblèmes réutilisés dans le dock (voir career.js)
//  Expose window.EuroFX : { queue(e, opts), head(e), hero(e, dateLabel, 'next'|'done'), emblem(comp, px) }
// ==========================================================
(function () {
    'use strict';
    const COMP = {
        ucl: { name: 'Ligue des Champions', tag: 'La grande scène d\'Europe' },
        el: { name: 'Ligue Europa', tag: 'La nuit européenne' },
        uecl: { name: 'Conference League', tag: 'Une nouvelle page à écrire' }
    };
    const MS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const JS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    const fmtD = s => { const d = new Date(s + 'T12:00:00Z'); return JS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MS[d.getUTCMonth()]; };
    const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cr = (n, e, s) => (typeof crest === 'function' ? crest(n, e, s) : (e || ''));

    // ---------- Emblèmes ----------
    function star(cx, cy, r, rot) {
        let p = '';
        for (let i = 0; i < 10; i++) {
            const a = rot + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
            p += (i ? 'L' : 'M') + (cx + rr * Math.sin(a)).toFixed(1) + ' ' + (cy - rr * Math.cos(a)).toFixed(1);
        }
        return p + 'Z';
    }
    function emblem(c, px) {
        let ring = '';
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            ring += '<path d="' + star(50 + 40 * Math.sin(a), 50 - 40 * Math.cos(a), 6.2, a) + '"/>';
        }
        const core = c === 'ucl'
            ? '<circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 40l9 6.5-3.5 10.5h-11L41 46.5z"/><path d="M50 40V28M59 46.5l11-3.5M55.5 57l7 9M44.5 57l-7 9M41 46.5L30 43" stroke="currentColor" stroke-width="2.4" fill="none"/>'
            : c === 'el'
                ? '<path d="M50 24c9 12 21 20 17 36-3 11-11 16-17 16s-14-5-17-16c-3-10 6-14 9-24 3 5 4 8 8-12z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M50 46c5 6 9 9 6 17-2 5-5 7-6 7s-4-2-6-7c-3-8 1-11 6-17z"/>'
                : '<path d="M50 23c22 8 26 33 0 54C24 56 28 31 50 23z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M50 32v38M50 46l-9-7M50 56l10-8M50 64l-8-6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
        return '<svg class="eu-emb" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" fill="currentColor">' + ring + core + '</svg>';
    }

    // ---------- Données d'un match ----------
    function info(e) {
        const st = G.euroState[e.c], r = st.rounds[e.ri];
        const round = r.name + (e.n > 1 ? ' · ' + (e.li + 1) + '/' + e.n : '');
        const venue = e.h === true ? 'À domicile' : e.h === false ? 'À l\'extérieur' : 'Terrain neutre';
        return { st, r, round, venue };
    }
    function outcome(e) {
        const { st, r } = info(e), last = e.ri === st.rounds.length - 1;
        if (e.k === 'lp') {
            if (st.pl < e.n) return { t: 'Phase de Ligue ' + st.pl + '/' + e.n + ' · ' + st.pts + ' point' + (st.pts > 1 ? 's' : ''), cls: '' };
            if (r.result === 'loss') return { t: 'Phase de Ligue terminée · ' + st.pts + ' pts · Éliminé', cls: 'ko' };
            const nx = st.rounds[e.ri + 1];
            return { t: st.pts + ' pts · ' + (nx && nx.bye ? 'Qualifié directement pour les 8es de finale' : 'Qualifié pour le barrage'), cls: 'ok' };
        }
        if (e.k === 'two' && e.li === 0) {
            const l1 = G.sched.find(x => x.t === 'E' && x.c === e.c && x.ri === e.ri && x.li === 1);
            return { t: 'Match aller' + (l1 ? ' · retour le ' + fmtD(l1.d) : ''), cls: '' };
        }
        let agg = '';
        if (e.k === 'two') {
            const l0 = G.sched.find(x => x.t === 'E' && x.c === e.c && x.ri === e.ri && x.li === 0), s0 = l0 && l0.s ? l0.s : [0, 0];
            agg = 'Cumulé ' + (e.s[0] + s0[0]) + '–' + (e.s[1] + s0[1]);
        }
        const pen = e.pen === 'w' ? 'Qualifié aux tirs au but' : e.pen === 'l' ? 'Éliminé aux tirs au but' : '';
        if (r.result === 'win') return { t: [agg, last ? 'Vainqueur de la ' + COMP[e.c].name + ' !' : (pen || 'Qualifié pour le tour suivant')].filter(Boolean).join(' · '), cls: last ? 'cup' : 'ok' };
        return { t: [agg, pen || 'Éliminé'].filter(Boolean).join(' · '), cls: 'ko' };
    }

    // ---------- Écran de match ----------
    const queue = []; let busy = false, ov = null, timers = [], finishFn = null;
    function queueEv(e, opts) { queue.push([e, opts || {}]); setTimeout(next, 40); }
    function next() { if (busy || !queue.length) return; busy = true; const q = queue.shift(); show(q[0], q[1]); }
    const T = (fn, ms) => timers.push(setTimeout(fn, ms));

    function goalsFeed(a, b, meHome) {
        // minutes aléatoires triées ; côté gauche = équipe à domicile
        const gl = meHome ? a : b, gr = meHome ? b : a, g = [];
        for (let i = 0; i < gl; i++) g.push({ m: 1 + Math.floor(Math.random() * 90), s: 'L' });
        for (let i = 0; i < gr; i++) g.push({ m: 1 + Math.floor(Math.random() * 90), s: 'R' });
        return g.sort((x, y) => x.m - y.m);
    }

    function show(e, opts) {
        opts = opts || {};
        const C = COMP[e.c], { round, venue } = info(e), out = outcome(e), me = { n: G.clubName, e: G.clubEmoji }, o = e.o;
        const [a, b] = e.s, meLeft = e.h !== false;
        const L = meLeft ? { t: me, g: a, me: 1 } : { t: o, g: b }, R = meLeft ? { t: o, g: b } : { t: me, g: a, me: 1 };
        const feed = opts.instant ? [] : goalsFeed(a, b, meLeft);   // instant : bilan après un match joué en direct
        const resTxt = { W: 'Victoire', D: 'Match nul', L: 'Défaite' }[e.res];
        ov = document.createElement('div');
        ov.className = 'eu-ov eu-' + e.c + (out.cls === 'cup' ? ' eu-trophy' : '');
        ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', C.name + ' — ' + round);
        ov.innerHTML =
            '<div class="eu-bg"><i class="eu-stars"></i><i class="eu-beam b1"></i><i class="eu-beam b2"></i><i class="eu-beam b3"></i></div>' +
            '<div class="eu-card">' +
            '<div class="eu-top">' + emblem(e.c, 112) + '<h2 class="eu-name">' + C.name + '</h2><p class="eu-tag">' + C.tag + '</p>' +
            '<div class="eu-chips"><span>' + round + '</span><span>' + venue + '</span><span>' + fmtD(e.d) + '</span></div></div>' +
            '<div class="eu-teams">' +
            '<div class="eu-team' + (L.me ? ' me' : '') + '">' + cr(L.t.n, L.t.e, 84) + '<b>' + L.t.n + '</b></div>' +
            '<div class="eu-score vs" aria-live="polite"><span class="eu-gl">0</span><i>–</i><span class="eu-gr">0</span><em>VS</em></div>' +
            '<div class="eu-team' + (R.me ? ' me' : '') + '">' + cr(R.t.n, R.t.e, 84) + '<b>' + R.t.n + '</b></div></div>' +
            '<ul class="eu-feed"></ul>' +
            '<div class="eu-after"><span class="eu-res ' + e.res + '">' + resTxt + '</span>' +
            '<p class="eu-out ' + out.cls + '">' + out.t + '</p></div>' +
            '<div class="eu-act"><button type="button" class="eu-btn">Passer</button></div></div>';
        document.body.appendChild(ov);
        const btn = ov.querySelector('.eu-btn'), gl = ov.querySelector('.eu-gl'), gr = ov.querySelector('.eu-gr'), ul = ov.querySelector('.eu-feed'), sc = ov.querySelector('.eu-score');
        let cl = 0, cr2 = 0, done = false;
        const line = (g, n) => '<li class="' + (g.s === 'L' ? 'l' : 'r') + ((g.s === 'L') === !!L.me ? ' mine' : '') + '"><time>' + g.m + '\'</time><span>But</span><b>' + (g.s === 'L' ? L.t.n : R.t.n) + '</b></li>';
        const finish = () => {
            if (done) return; done = true; timers.forEach(clearTimeout); timers = [];
            gl.textContent = L.g; gr.textContent = R.g; sc.classList.remove('vs');
            ul.innerHTML = feed.map(line).join('');
            ov.classList.add('done'); btn.textContent = 'Continuer'; btn.focus();
        };
        finishFn = finish;
        const close = () => {
            if (!done) return finish();
            document.removeEventListener('keydown', onKey, true);
            ov.classList.add('out'); const node = ov; setTimeout(() => { node.remove(); }, 260);
            ov = null; busy = false; finishFn = null; setTimeout(next, 280);
        };
        function onKey(ev) {
            if (['Enter', ' ', 'Escape'].includes(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); close(); }
            else if (ev.key === 'Tab') { ev.preventDefault(); btn.focus(); }
        }
        document.addEventListener('keydown', onKey, true);
        btn.addEventListener('click', close);
        btn.focus();
        if (reduced() || opts.instant) { finish(); return; }
        // présentation (≈1,6 s), puis les buts un à un
        let t = 1600;
        T(() => sc.classList.remove('vs'), t - 200);
        feed.forEach(g => {
            T(() => {
                if (g.s === 'L') gl.textContent = ++cl; else gr.textContent = ++cr2;
                ul.insertAdjacentHTML('beforeend', line(g));
                const el = g.s === 'L' ? gl : gr; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
            }, t);
            t += 520;
        });
        T(finish, t + 450);
    }

    // ---------- Bannière d'accueil ----------
    function hero(e, dateLabel, state) {
        const C = COMP[e.c], { round, venue } = info(e), me = { n: G.clubName, e: G.clubEmoji }, o = e.o;
        const done = state === 'done', mid = done ? e.s[0] + '–' + e.s[1] : (e.h === true ? 'DOM' : e.h === false ? 'EXT' : 'NEUTRE');
        const out = done ? outcome(e) : null;
        return '<div class="hero eu-hero eu-' + e.c + '"><i class="eu-stars"></i>' +
            '<div class="eu-hh">' + emblem(e.c, 58) + '<div class="eu-ht"><b>' + C.name + '</b><span>' + round + ' · ' + venue + '</span></div>' +
            '<em class="eu-hchip' + (done ? ' ' + e.res : '') + '">' + (done ? { W: 'Victoire', D: 'Nul', L: 'Défaite' }[e.res] : 'Prochain match · ' + dateLabel) + '</em></div>' +
            '<div class="hero-vs"><div>' + cr(me.n, me.e, 64) + '<b>' + me.n + '</b></div><strong>' + mid + '</strong><div>' + cr(o.n, o.e, 64) + '<b>' + o.n + '</b></div></div>' +
            (out ? '<p class="eu-hout ' + out.cls + '">' + out.t + '</p>' : '') + '</div>';
    }

    // ---------- En-tête de l'écran de match (match joué en direct) ----------
    function head(e) {
        if (e.t === 'E') { const C = COMP[e.c], i = info(e); return '<div class="eu-mh eu-' + e.c + '">' + emblem(e.c, 46) + '<div><b>' + C.name + '</b><span>' + i.round + ' · ' + i.venue + ' · ' + fmtD(e.d) + '</span></div></div>'; }
        return '<div class="eu-mh eu-fr"><div><b>Match amical</b><span>Préparation · ' + fmtD(e.d) + ' · sans incidence sur le classement</span></div></div>';
    }

    window.EuroFX = { queue: queueEv, head, hero, emblem: (c, px) => '<span class="eu-mini eu-' + c + '">' + emblem(c, px) + '</span>', _comp: COMP };
})();
