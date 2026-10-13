// ==========================================================
//  career.js — mode carrière « jour par jour » (style FC)
//  Calendrier réel dès le 1er juillet, accueil, fil d'actualités,
//  mercato à dates fixes, bouton Continuer. Le moteur de match reste celui de script.js.
// ==========================================================
(function () {
    'use strict';
    const $ = id => document.getElementById(id), D = 864e5;
    const MS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
    const ML = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const JS = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
    const P = s => new Date(s + 'T12:00:00Z');
    const add = (s, n) => new Date(P(s).getTime() + n * D).toISOString().slice(0, 10);
    const days = (a, b) => Math.round((P(b) - P(a)) / D);
    const fmt = s => { const d = P(s); return JS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MS[d.getUTCMonth()]; };
    const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, pick = a => a[rnd(0, a.length - 1)];
    const pois = l => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const ok = () => { try { return !!(G && G.squad && G.date); } catch (e) { return false; } };
    const wrap = (n, fn) => { const o = window[n]; if (typeof o !== 'function') return; window[n] = function () { return fn.call(this, o, arguments); }; };
    const winOpen = d => { const k = d.slice(5); return (k >= '07-01' && k <= '09-01') || (k >= '01-01' && k <= '02-01'); };
    let busy = false, calYM = null, nf = 'all', managerBridgeBound = false;

    // ---------- Calendrier de saison ----------
    function build() {
        const y = G.seasonYear, n = G.seasonLength || 38, step = n > 38 ? 6 : 7, st = y + (n > 38 ? '-08-09' : '-08-16'), s = [];
        for (let i = 0; i < n; i++) s.push({ d: add(st, i * step + (i >= n / 2 ? 10 : 0)), t: 'L', md: i + 1 });
        const used = new Set(s.map(e => e.d));
        ['-07-12', '-07-19', '-07-26', '-08-02'].forEach(k => s.push({ d: y + k, t: 'F' }));
        const blocked = [...used];
        if (window.CUP) {
            const cup = CUP.newSeason(y), cupDates = CUP.scheduleDates(y, blocked);
            CUP.setDates(cupDates);
            for (let i = 0; i < cupDates.length; i++) {
                const r = cup.rounds.find(x => x.index === i);
                s.push({ d: cupDates[i], t: 'C', cupRound: i, r: r ? r.name : 'Tour ' + (i + 1) });
            }
        }
        s.sort((a, b) => a.d < b.d ? -1 : 1);
        G.sched = s;
        if (typeof buildEuro === 'function') buildEuro(used);
    }

    // ---------- Coupes d'Europe : intégrées au calendrier ----------
    const EUB = { '1er tour qualif.': ['07-07', '07-14'], '2e tour qualif.': ['07-21', '07-28'], '3e tour qualif.': ['08-04', '08-11'], 'Barrages (playoff)': ['08-18', '08-25'], 'Barrage (mars)': ['02-16', '02-23'], '8e de finale': ['03-09', '03-16'], 'Quart de finale': ['04-06', '04-13'], 'Demi-finale': ['04-27', '05-04'], 'FINALE': ['05-23'] };
    const LPB = ['09-15', '09-29', '10-20', '11-03', '11-24', '12-08', '01-19', '01-26'], EUM = { ucl: 1, el: .4, uecl: .2 }, EUR = { ucl: 25, el: 12, uecl: 8 };
    function buildEuro(used) {
        if (typeof buildEuroRounds !== 'function' || typeof getEuroSpot !== 'function') return;
        const y = G.seasonYear, lg = LEAGUES[G.leagueKey];
        G.euroState = { ucl: null, el: null, uecl: null }; G.euroSched = y;
        if (!lg || lg.tier !== 1) return;
        if (G.euroQual === undefined) {
            const r = lg.clubs.slice().sort((a, b) => b.budget - a.budget).findIndex(c => c.name === G.clubName) + 1;
            G.euroQual = r ? (getEuroSpot(G.leagueKey, r) || null) : null;
        }
        const sp = G.euroQual; if (!sp) return;
        const rs = buildEuroRounds(sp.comp, sp.entry); if (!rs.length) return;
        const comp = sp.comp, wd = comp === 'ucl' ? 3 : 4, yr = b => (b < '07' ? y + 1 : y) + '-' + b;
        G.euroState[comp] = { entry: sp.entry, rounds: rs.map(r => ({ ...r, result: null })), currentRound: 0, eliminated: false, winner: false, pts: 0, pl: 0 };
        rs.forEach((r, ri) => {
            const two = /aller.*retour/i.test(r.desc), lp = r.name === 'Phase de Ligue', m = r.desc.match(/(\d+) matchs/);
            const base = lp ? (m && +m[1] === 6 ? [0, 2, 3, 4, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7]).map(i => LPB[i]) : (EUB[r.name] || []);
            base.forEach((b, li) => {
                let d = yr(b);
                while (P(d).getUTCDay() !== wd) d = add(d, 1);
                while (used.has(d)) d = add(d, 7);
                used.add(d);
                G.sched.push({ d, t: 'E', c: comp, ri, li, n: base.length, k: lp ? 'lp' : two ? 'two' : 'one' });
            });
        });
        G.sched.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
        drawRound(comp, 0);
    }
    function migrateEuro() {
        if (!G.sched) return;
        G.sched = G.sched.filter(e => e.t !== 'E');
        buildEuro(new Set(G.sched.map(e => e.d)));
        const comp = ['ucl', 'el', 'uecl'].find(c => G.euroState && G.euroState[c]); if (!comp) return;
        const st = G.euroState[comp]; let i = 0;
        while (i < st.rounds.length) {
            const f = G.sched.find(e => e.t === 'E' && e.ri === i);
            if (!f || f.d >= G.date) break;
            st.rounds[i].result = 'win'; st.rounds[i].bye = true; i++;
            if (st.rounds[i - 1].name === 'Phase de Ligue' && st.rounds[i] && st.rounds[i].name === 'Barrage (mars)') { st.rounds[i].result = 'win'; st.rounds[i].bye = true; i++; }
        }
        st.currentRound = i;
        if (i >= st.rounds.length) st.eliminated = true; else drawRound(comp, i);
    }
    function drawRound(c, ri) {
        if (!G.euroState || !G.euroState[c]) return;
        const st = G.euroState[c], r = st.rounds[ri], es = G.sched.filter(e => e.t === 'E' && e.c === c && e.ri === ri);
        if (!es.length || es[0].o) return;
        const me = LEAGUES[G.leagueKey] ? LEAGUES[G.leagueKey].country : ''; let all = [];
        Object.values(LEAGUES).forEach(l => { if (l.tier === 1 && l.country !== me) all = all.concat(l.clubs); });
        all = all.filter(x => x.name !== G.clubName).sort((a, b) => b.budget - a.budget);
        if (!all.length) return;
        const f = /qualif|playoff/i.test(r.name) ? [.4, 1] : r.name === 'Phase de Ligue' ? [0, .75] : [0, .4];
        let pool = all.slice(Math.floor(f[0] * all.length), Math.ceil(f[1] * all.length));
        if (!pool.length) pool = all;
        pool = pool.slice().sort(() => Math.random() - .5);
        const h0 = Math.random() < .5;
        es.forEach((e, i) => { const x = e.k === 'lp' ? pool[i % pool.length] : pool[0]; e.o = { n: x.name, e: x.emoji, b: x.budget }; e.h = e.k === 'one' ? null : (i % 2 === 0) === h0; });
    }
    const euroDead = e => !e.done && (() => { const st = G.euroState && G.euroState[e.c]; return !st || st.eliminated || !!(st.rounds[e.ri] && st.rounds[e.ri].bye); })();
    function closeRound(c, ri, win, skipNext) {
        const st = G.euroState[c]; st.rounds[ri].result = win ? 'win' : 'loss';
        if (!win) { st.eliminated = true; return; }
        st.currentRound = ri + 1;
        if (skipNext && st.rounds[ri + 1]) { st.rounds[ri + 1].result = 'win'; st.rounds[ri + 1].bye = true; st.currentRound = ri + 2; }
        if (st.currentRound >= st.rounds.length) st.winner = true; else drawRound(c, st.currentRound);
    }
    function playEuro(e, live) {
        const st = G.euroState[e.c], r = st.rounds[e.ri], m = EUM[e.c], name = typeof getCompLabel === 'function' ? getCompLabel(e.c) : e.c.toUpperCase();
        drawRound(e.c, e.ri);
        const o = e.o, [a, b] = live || quick(budgetToRating(o.b)), sc = a + '–' + b, w0 = a > b ? 'victoire' : a < b ? 'défaite' : 'nul';
        e.done = 1; e.s = [a, b]; e.sc = sc; e.res = a > b ? 'W' : a < b ? 'L' : 'D';
        const where = e.h === true ? 'à domicile' : e.h === false ? 'à l\'extérieur' : 'sur terrain neutre';
        if (a > b && !live) G.morale = Math.min(100, (G.morale || 50) + 2);
        if (e.k === 'lp') {
            st.pts = (st.pts || 0) + (a > b ? 3 : a === b ? 1 : 0); st.pl = (st.pl || 0) + 1;
            G.money += Math.round((a > b ? 1e6 : a === b ? 3e5 : 0) * m);
            news('match', name + ' : ' + w0 + ' ' + sc, 'Phase de Ligue ' + st.pl + '/' + e.n + ' contre ' + o.n + ' ' + where + '. ' + st.pts + ' pt(s).');
            if (st.pl >= e.n) {
                const need = e.n === 6 ? [10, 5] : [13, 7], dir = st.pts >= need[0], bar = st.pts >= need[1];
                news('match', name + ' : phase de ligue terminée', st.pts + ' points. ' + (dir ? 'Qualifié directement pour les 8es de finale.' : bar ? 'Qualifié pour le barrage de février.' : 'Éliminé.'));
                closeRound(e.c, e.ri, bar, dir);
            }
            return;
        }
        if (e.k === 'two' && e.li === 0) {
            const l1 = G.sched.find(x => x.t === 'E' && x.c === e.c && x.ri === e.ri && x.li === 1);
            news('match', name + ' · ' + r.name + ' (aller) : ' + w0 + ' ' + sc, 'Contre ' + o.n + ' ' + where + '.' + (l1 ? ' Match retour : ' + fmt(l1.d) : ''));
            return;
        }
        let A = a, B = b, agg = '', pen = '', win;
        if (e.k === 'two') { const l0 = G.sched.find(x => x.t === 'E' && x.c === e.c && x.ri === e.ri && x.li === 0), s0 = l0 && l0.s ? l0.s : [0, 0]; A += s0[0]; B += s0[1]; agg = A + '–' + B; }
        if (A === B) { win = Math.random() < .5; pen = win ? ' (vainqueur aux t.a.b.)' : ' (battu aux t.a.b.)'; e.pen = win ? 'w' : 'l'; } else win = A > B;
        const tail = (agg ? ' Cumulé : ' + agg : '') + pen + (agg || pen ? '.' : '');
        if (!win) news('match', name + ' : éliminé', r.name + ' : ' + w0 + ' ' + sc + ' contre ' + o.n + '.' + tail);
        else if (e.ri === st.rounds.length - 1) {
            const prize = Math.round(1e7 * m); G.money += prize; G.repPoints = (G.repPoints || 0) + EUR[e.c];
            news('club', 'Vainqueur de la ' + name + ' !', 'Finale gagnée ' + sc + ' contre ' + o.n + '.' + tail + ' Prime : ' + fmtMoney(prize) + '.'); toast(name + ' remportée !', 'success');
        } else {
            const prize = Math.round(1.5e6 * m); G.money += prize;
            news('match', name + ' : qualifié', r.name + ' : ' + w0 + ' ' + sc + ' contre ' + o.n + '.' + tail + ' +' + fmtMoney(prize) + '.');
        }
        closeRound(e.c, e.ri, win, false);
    }
    function evInfo(e) {
        const ab = n => n ? n.slice(0, 3).toUpperCase() : '???'; let comp, round = '', o = null, home = null, res = null;
        if (e.t === 'L') { const x = oppOf(e.md); comp = LEAGUES[G.leagueKey] ? LEAGUES[G.leagueKey].name : 'Championnat'; round = 'J' + e.md; if (x) { o = { n: x.c.name, e: x.c.emoji }; home = x.home; } if (e.md <= G.matchDay) res = G.results[e.md - 1]; }
        else if (e.t === 'F') { comp = 'Match amical'; o = e.o; res = e.res; }
        else if (e.t === 'C') { comp = typeof getCupName === 'function' ? getCupName(G.leagueKey) : 'Coupe'; round = e.r || 'Coupe'; o = e.o; res = e.res; }
        else { const st = G.euroState && G.euroState[e.c]; comp = typeof getCompLabel === 'function' ? getCompLabel(e.c) : 'Coupe d\'Europe'; round = st && st.rounds[e.ri] ? st.rounds[e.ri].name + (e.n > 1 ? ' · ' + (e.li + 1) + '/' + e.n : '') : ''; o = e.o; home = e.h; res = e.res; }
        const sc = e.sc || '', cell = o ? (home === false ? '@' : '') + ab(o.n) + (sc ? ' ' + sc : '') : e.t === 'F' ? 'Amical' : e.t === 'C' ? 'Coupe' : e.t === 'E' ? 'Europe' : 'J' + e.md;
        const tip = (comp + (round ? ' · ' + round : '') + (o ? ' · ' + (home === false ? 'à l\'extérieur : ' : home ? 'à domicile : ' : '') + o.n : '') + (sc ? ' · ' + sc : '')).replace(/"/g, '&quot;');
        return { k: e.t, c: e.t === 'E' ? e.c : '', comp, round, o, home, res, sc, cell, tip };
    }
    function evLabel(e) { const i = evInfo(e); return i.comp + (i.round ? ' · ' + i.round : '') + (i.o ? ' · ' + (i.home === false ? '@ ' : '') + i.o.n : ''); }
    const shown = e => !(e.t === 'E' && euroDead(e));
    function monthList(ym) {
        const m = +ym.slice(5), rows = G.sched.filter(e => e.d.slice(0, 7) === ym && shown(e)).map(e => {
            const i = evInfo(e), loc = i.home === true ? 'Domicile' : i.home === false ? 'Extérieur' : e.t === 'E' ? 'Terrain neutre' : '';
            return '<div class="ml-row' + (i.c ? ' eu-' + i.c : '') + (e.d < G.date ? ' past' : '') + (e.d === G.date ? ' today' : '') + '"><time>' + fmt(e.d) + '</time><div class="ml-c"><em class="ml-tag k-' + i.k + (i.c ? ' eu-' + i.c : '') + '">' + i.comp + '</em><small>' + i.round + '</small></div><div class="ml-o">' +
                (i.o ? crest(i.o.n, i.o.e, 20) + '<b>' + i.o.n + '</b><small>' + loc + '</small>' : '<span class="ml-tbd">' + (e.t === 'E' || e.t === 'C' ? 'Adversaire : tirage à venir' : '—') + '</span>') +
                '</div>' + (i.res ? '<i class="ml-res ' + i.res + '">' + (i.sc || i.res) + '</i>' : '<i class="ml-res"></i>') + '</div>';
        });
        return '<div class="cm-list"><h4>Matchs de ' + ML[m - 1].toLowerCase() + '</h4>' + (rows.join('') || '<p class="nw-empty">Aucun match ce mois-ci.</p>') + '</div>';
    }
    function renderEuro() {
        const el = $('euro-content'); if (!el) return;
        const lg = LEAGUES[G.leagueKey], cs = ['ucl', 'el', 'uecl'].filter(c => G.euroState && G.euroState[c]);
        if (!lg || lg.tier !== 1) { el.innerHTML = '<div class="euro-no-qual"><div class="big">⬆️</div>Monte en D1 pour disputer les compétitions européennes !</div>'; return; }
        if (!cs.length) { el.innerHTML = '<div class="euro-no-qual"><div class="big">😔</div>Pas de coupe d\'Europe cette saison. La qualification dépend du classement final de la saison précédente.</div>'; return; }
        let h = '<p class="eu-note">Les matchs européens sont au calendrier : ils se jouent avec le bouton « Continuer », comme le championnat.</p>';
        cs.forEach(c => {
            const st = G.euroState[c], cc = typeof getCompClass === 'function' ? getCompClass(c) : c, badge = st.winner ? '<span class="euro-status-badge qualified">🏆 Vainqueur !</span>' : st.eliminated ? '<span class="euro-status-badge eliminated">❌ Éliminé</span>' : '<span class="euro-status-badge qualified">✅ En course</span>';
            h += '<div class="euro-comp-header ' + cc + '"><span class="euro-logo">' + (typeof getCompEmoji === 'function' ? getCompEmoji(c) : '🏆') + '</span><div><div class="euro-comp-name ' + cc + '">' + (typeof getCompLabel === 'function' ? getCompLabel(c) : c.toUpperCase()) + '</div><div class="euro-comp-sub">Entrée : ' + (typeof entryLabel === 'function' ? entryLabel(st.entry) : st.entry) + '</div></div>' + badge + '</div><div class="euro-rounds-list">';
            st.rounds.forEach((r, i) => {
                const es = G.sched.filter(e => e.t === 'E' && e.c === c && e.ri === i), last = i === st.rounds.length - 1;
                let cls = 'locked', res = '<span class="euro-round-result tbd">À venir</span>';
                if (r.bye) { cls = 'done'; res = '<span class="euro-round-result win">✓ Exempté</span>'; }
                else if (r.result === 'win') { cls = 'done'; res = '<span class="euro-round-result win">' + (last ? '🏆 Vainqueur' : '✓ Qualifié') + '</span>'; }
                else if (r.result === 'loss') { cls = 'done'; res = '<span class="euro-round-result loss">✗ Éliminé</span>'; }
                else if (!st.eliminated && !st.winner && i === st.currentRound) { cls = 'active'; res = '<span class="euro-round-result next">▶ En cours</span>'; }
                const det = r.bye ? '' : es.map(e => fmt(e.d) + (e.o ? ' · ' + (e.h === false ? '@ ' : '') + e.o.n : '') + (e.sc ? ' · <b>' + e.sc + '</b>' : '')).join('<br>');
                h += '<div class="euro-round-card ' + cls + '"><span class="euro-round-icon">' + (r.icon || '🏆') + '</span><div class="euro-round-info"><div class="euro-round-name">' + r.name + (r.name === 'Phase de Ligue' && st.pl ? ' — ' + st.pts + ' pts' : '') + '</div><div class="euro-round-desc">' + r.desc + (det ? '<br>' + det : '') + '</div></div>' + res + '</div>';
            });
            h += '</div><div style="height:24px;"></div>';
        });
        el.innerHTML = h;
    }
    function euroTheme() {
        const lt = leagueToday(), ne = nextEv(), td = G.sched.find(x => x.t === 'E' && x.done && x.d === G.date), nc = ne && ne.t === 'E' ? ne.c : '';
        const root = $('s-game'), dock = document.querySelector('.cc-dock'), go = $('cc-go');
        const amb = td ? td.c : (nc && days(G.date, ne.d) <= 1 ? nc : '');
        if (root) { if (amb) root.dataset.euro = amb; else delete root.dataset.euro; }
        if (dock) { if (nc) dock.dataset.euro = nc; else delete dock.dataset.euro; }
        if (go) {
            go.classList.toggle('eu', !!nc && (lt ? lt.t === 'E' : true));
            if (lt && lt.t === 'E') go.textContent = 'Jouer : ' + (typeof getCompLabel === 'function' ? getCompLabel(lt.c) : 'Europe') + ' ▶';
            else if (!lt && nc && days(G.date, ne.d) === 1) go.textContent = 'Soirée européenne ▶';
        }
        if (nc && window.EuroFX && $('cc-next')) $('cc-next').insertAdjacentHTML('afterbegin', EuroFX.emblem(nc, 20));
    }
    function setHead(html, comp) {
        const tm = $('tab-match'); if (!tm) return;
        let h = $('eu-matchhead');
        if (!html) { if (h) h.remove(); delete tm.dataset.euro; return; }
        if (!h) { h = document.createElement('div'); h.id = 'eu-matchhead'; tm.insertBefore(h, tm.firstChild); }
        h.innerHTML = html; if (comp) tm.dataset.euro = comp; else delete tm.dataset.euro;
    }
    function prepareSpecial(e) {
        if (e.t === 'E') drawRound(e.c, e.ri);
        if (!e.o) { const x = randOpp(); e.o = { n: x.name, e: x.emoji, b: x.budget }; }
        if (e.t === 'F' && e.h === undefined) e.h = true;
        if (e.rat === undefined) e.rat = cl(budgetToRating(e.o.b) + rnd(-4, 4), 40, 99);
        liveEv = e; prepareNextMatch(); liveEv = e;
        const home = e.h !== false, opp = { name: e.o.n, emoji: e.o.e, budget: e.o.b };
        G.nextOpponent = opp; G.isHomeMatch = home; G.isDerby = false; G.isCrucial = e.t === 'E'; G.nextOppRat = e.rat;
        const arena = document.querySelector('.match-arena'); if (arena) arena.classList.remove('derby');
        const me = crest(G.clubName, G.clubEmoji, 26) + ' ' + G.clubName, ot = crest(opp.name, opp.emoji, 26) + ' ' + opp.name;
        $('m-home').innerHTML = home ? me : ot; $('m-away').innerHTML = home ? ot : me;
        $('m-home-rat').textContent = 'Force : ' + (home ? getTeamRating() + ' (dom.)' : e.rat);
        $('m-away-rat').textContent = 'Force : ' + (home ? e.rat : getTeamRating() + ' (ext.)');
        const i = evInfo(e); $('m-status').textContent = i.comp + (i.round ? ' · ' + i.round : '') + ' — prêt pour le coup d\'envoi';
        const b = $('playBtn'); if (b) { b.disabled = false; b.textContent = 'Coup d\'envoi ▶'; b.onclick = () => playMatch(); }
        setHead(window.EuroFX ? EuroFX.head(e) : '', e.t === 'E' ? e.c : '');
        if (window.PitchViz) PitchViz.preview(true);
    }
    async function playSpecial(e, o, a) {
        const total = G.seasonLength || 38, snap = {
            md: G.matchDay, pts: G.points, w: G.wins, d: G.draws, l: G.losses, gf: G.goalsFor, ga: G.goalsAgainst, nr: G.results.length,
            st: (G.standings || []).map(t => [t, Object.assign({}, t)]), ct: (G.contracts || []).map(c => c.matchesLeft),
            pl: G.squad.map(p => [p, p.goals, p.assists])
        };
        const sw = window.simulateWorldMatchday, ts = window.tickScouts;
        window.simulateWorldMatchday = function () { };
        if (typeof ts === 'function') window.tickScouts = function () { };
        liveEv = e; playing = true; G.matchDay = Math.min(G.matchDay, total - 1);
        let played = false, a1 = 0, b1 = 0;
        try {
            await o.apply(null, a);
            played = G.results.length > snap.nr; a1 = G.goalsFor - snap.gf; b1 = G.goalsAgainst - snap.ga;
        } finally {
            window.simulateWorldMatchday = sw; if (typeof ts === 'function') window.tickScouts = ts;
            G.matchDay = snap.md; G.points = snap.pts; G.wins = snap.w; G.draws = snap.d; G.losses = snap.l; G.goalsFor = snap.gf; G.goalsAgainst = snap.ga;
            G.results.length = snap.nr;
            snap.st.forEach(([t, c]) => Object.assign(t, c));
            (G.contracts || []).forEach((c, i) => { if (snap.ct[i] !== undefined) c.matchesLeft = snap.ct[i]; });
            if (e.t === 'F') snap.pl.forEach(([p, g, as]) => { p.goals = g; p.assists = as; });
            try { _rankCache.day = -1; } catch (x) { }
            try { localStorage.setItem('fm_save_' + saveSlot, JSON.stringify(G)); } catch (x) { }
        }
        if (played) {
            const r = a1 > b1 ? 'W' : a1 < b1 ? 'L' : 'D', i0 = evInfo(e);
            if (e.t === 'F') {
                e.done = 1; e.s = [a1, b1]; e.sc = a1 + '–' + b1; e.res = r;
                news('match', 'Amical : ' + (r === 'W' ? 'victoire' : r === 'L' ? 'défaite' : 'nul') + ' ' + e.sc, 'Match de préparation contre ' + e.o.n + '.');
            } else playEuro(e, [a1, b1]);
            G.lastRes = i0.comp + ' · ' + (r === 'W' ? 'Victoire ' : r === 'D' ? 'Match nul ' : 'Défaite ') + a1 + ':' + b1 + ' vs ' + e.o.n;
            refresh();
            await new Promise(r => setTimeout(r, e.t === 'E' ? 1500 : 2500));
            if (e.t === 'E' && window.EuroFX) EuroFX.queue(e, { instant: true });
        }
        liveEv = null; playing = false; setHead(null); goMatch(); lockBtn(); refresh();
    }

    const entry = d => G.sched.find(e => e.d === d);
    const leagueToday = () => {
        const e = entry(G.date); if (!e) return null;
        if (e.t === 'L') return e.md > G.matchDay ? e : null;
        if (e.t === 'F') return e.done ? null : e;
        if (e.t === 'E') return !e.done && !euroDead(e) ? e : null;
        return null;
    };
    const cupToday = () => !!(G.activeMatch && G.activeMatch.competition === 'cup' && G.cup && G.cup.currentMatchId);
    function oppOf(md) {
        const f = (G.fixtures || []).filter(f => f.homeClub.name === G.clubName || f.awayClub.name === G.clubName).sort((a, b) => a.matchDay - b.matchDay)[md - 1];
        if (!f) return null;
        const h = f.homeClub.name === G.clubName;
        return { c: h ? f.awayClub : f.homeClub, home: h };
    }
    const randOpp = () => pick(getLeagueClubs(G.leagueKey).filter(c => c.name !== G.clubName));
    const quick = r => { const g = (getTeamRating() - r) / 60; return [pois(1.4 * cl(1 + g, .5, 1.8)), pois(1.2 * cl(1 - g, .5, 1.8))]; };

    function init() {
        if (!G.seasonYear) G.seasonYear = 2025;
        if (!G.news) G.news = [];
        if (!G.sched || !G.date) {
            build();
            if (!G.date) { const l = G.matchDay > 0 && G.sched.find(e => e.t === 'L' && e.md === G.matchDay); G.date = l ? add(l.d, 1) : G.seasonYear + '-07-01'; }
        } else if (!G.cup || G.cup.schema !== 1 || G.cup.year !== G.seasonYear) {
            const savedDate = G.date; build(); G.date = savedDate;
        }
        if (G.sched && G.euroSched !== G.seasonYear && typeof migrateEuro === 'function') migrateEuro();
        if (window.CareerDepth) CareerDepth.migrate(G);
        if (!G.news.length) news('club', 'Bienvenue à ' + G.clubName, 'Le mercato est ouvert jusqu\'au 1er septembre. Quatre matchs amicaux sont prévus avant la reprise du championnat le ' + fmt(G.sched.find(e => e.t === 'L').d) + '.');
    }

    // ---------- Actualités ----------
    const CATS = { club: 'Club', match: 'Match', transfer: 'Transfert', world: 'Monde' };
    function news(c, t, b) { G.news.unshift({ d: G.date, c, t, b: b || '', u: 1 }); if (G.news.length > 90) G.news.length = 90; }
    function renderNews() {
        const l = $('nw-list'); if (!l) return;
        $('nw-unread').textContent = G.news.filter(n => n.u).length || '';
        $('nw-filters').innerHTML = [['all', 'Tout']].concat(Object.entries(CATS)).map(([k, v]) => '<button class="' + (nf === k ? 'on' : '') + '" onclick="CC.filter(\'' + k + '\')">' + (k === 'all' ? v : v) + '</button>').join('');
        l.innerHTML = G.news.map((n, i) => ({ n, i })).filter(x => nf === 'all' || x.n.c === nf).slice(0, 40).map(({ n, i }) =>
            '<article class="nw c-' + n.c + (n.u ? ' unread' : '') + '" onclick="CC.read(' + i + ')"><div class="nw-meta"><span>' + CATS[n.c] + '</span><time>' + fmt(n.d) + '</time></div><h4>' + n.t + '</h4>' + (n.b ? '<p>' + n.b + '</p>' : '') + '</article>').join('') || '<p class="nw-empty">Aucune actualité.</p>';
    }

    // ---------- Un jour qui passe ----------
    function arrive() {
        const d = G.date, e = entry(d), k = d.slice(5), stop = false; let s = false;
        if (window.AIWorld) {
            AIWorld.ensure(G, LEAGUES);
            if (d.slice(8) === '01') AIWorld.onMonth(G, LEAGUES, d);
            if (k === '07-01' || k === '01-01') {
                const market = AIWorld.onTransferWindow(G, LEAGUES, d);
                if (market.processed && market.transfers.length) news('transfer', 'Mercato des clubs — ' + market.transfers.length + ' mouvements', market.transfers.slice(0, 4).map(x => x.player + ' : ' + x.from + ' → ' + x.to).join('<br>'));
            }
        }
        if (e && e.t === 'F' && !e.done) {
            e.done = 1; const o = randOpp(), [a, b] = quick(budgetToRating(o.budget)); s = true;
            news('match', 'Amical : ' + (a > b ? 'victoire' : a < b ? 'défaite' : 'nul') + ' ' + a + '–' + b, 'Match de préparation contre ' + o.name + '.');
            if (a > b) G.morale = Math.min(100, (G.morale || 50) + 3);
        }
        if (e && e.t === 'C' && !e.done && window.CUP) {
            const cupDay = CUP.processDate(d);
            e.done = 1;
            if (cupDay.round) { s = true; news('match', CUP.getState().competition + ' — ' + cupDay.round.name, cupDay.hasPlayerMatch ? 'Votre match de coupe est prêt. Le résultat du championnat reste inchangé.' : 'Les résultats du tour sont enregistrés dans le tableau.'); }
            if (cupDay.hasPlayerMatch) goMatch();
        }
        if (d.slice(8) === '01') {
            s = true;
            const staffWages = STAFF_DEF.reduce((total, staff) => total + (G.staff && G.staff[staff.id] ? staff.salary : 0), 0);
            const w = G.squad.reduce((t, p) => t + (p.wage || 0), 0) + staffWages;
            G.money = Math.max(0, G.money - w);
            const rankSummary = G.matchDay ? 'Classement : ' + getRank() + 'e.' : 'Classement : saison en attente de son premier match.';
            news('club', 'Bilan de ' + ML[+d.slice(5, 7) - 1].toLowerCase(), 'Salaires et staff : –' + fmtMoney(w) + '. Budget : ' + fmtMoney(G.money) + '. ' + rankSummary);
            try { localStorage.setItem('fm_save_' + saveSlot, JSON.stringify(G)); } catch (x) { }
        }
        if (k === '07-01' || k === '01-01') { s = true; news('transfer', 'Le mercato ' + (k === '07-01' ? 'd\'été' : 'd\'hiver') + ' est ouvert', 'Jusqu\'au 1er ' + (k === '07-01' ? 'septembre' : 'février') + '. Achats et ventes possibles.'); }
        if (k === '09-02' || k === '02-02') { s = true; news('transfer', 'Le mercato est fermé', 'Plus aucun transfert avant la prochaine fenêtre.'); }
        if (k === '09-01' || k === '02-01') news('transfer', 'Dernier jour du mercato', 'C\'est le moment de conclure vos dossiers.');
        if (winOpen(d) && P(d).getUTCDay() === 1) { G.market = generateMarket(G.upgrades.scouting || 0); news('transfer', 'Nouveaux profils sur le marché', G.market.length + ' joueurs sont disponibles cette semaine.'); }
        if (winOpen(d) && Math.random() < .12 && G.market && G.market.length) { const p = pick(G.market); news('transfer', 'Rumeur : ' + p.name, p.pos + ' · note ' + p.level + ' · pot. ' + potText(p) + ' · ' + p.age + ' ans · environ ' + fmtMoney(p.price)); }
        if (Math.random() < .07) { const y = G.squad.filter(p => ensurePot(p).level < p.pot && (p.age || 25) <= 27); if (y.length) { const p = pick(y); p.level++; news('club', 'Progression : ' + p.name, 'Belle semaine d\'entraînement, sa note passe à ' + p.level + '.'); } }
        if (Math.random() < .02) { const h = G.squad.filter(p => !p.injuredGames); if (h.length) { const p = pick(h); p.injuredGames = rnd(1, 4); s = true; news('club', 'Blessure : ' + p.name, 'Absent pour ' + p.injuredGames + ' match(s) selon le staff médical.'); } }
        if (['10-01', '01-15', '04-01'].includes(k)) { s = true; news('club', 'Point avec le board', (G.matchDay ? 'Vous êtes ' + getRank() + 'e du championnat avec ' + G.points + ' points.' : 'Le championnat attend encore son premier match.') + ' Le budget est de ' + fmtMoney(G.money) + '.'); }
        if (leagueToday()) { s = true; G.activeMatch = { competition: 'league', matchDay: leagueToday().md }; G.matchContext = { type: 'league' }; prepareNextMatch(); const e2 = leagueToday(), o = oppOf(e2.md); news('match', 'Jour de match — J' + e2.md, (o ? (o.home ? 'Réception de ' : 'Déplacement à ') + o.c.name + '. ' : '') + 'Le coup d\'envoi est à vous.'); goMatch(); }
        if (d === (G.seasonYear + 1) + '-05-31') { s = true; showSeasonSummary(); }
        return s;
    }
    const blocked = () => { const m = $('event-modal'), s = $('season-summary'); return (m && m.style.display !== 'none') || (s && s.style.display !== 'none'); };
    function adv(all) {
        if (!ok() || busy) return;
        if (blocked()) { toast('Termine d\'abord la décision en cours', 'error'); return; }
        if (leagueToday() || cupToday()) { goMatch(); const b = $('playBtn'); if (b && !b.disabled) b.click(); return; }
        busy = true;
        try { for (let i = 0; i < 45; i++) { G.date = add(G.date, 1); const stop = arrive(); if (!all || stop || leagueToday() || cupToday() || blocked()) break; } } finally { busy = false; }
        refresh();
    }
    const homeBtn = () => document.querySelector('.tab-btn[onclick*="\'home\'"]');
    function goMatch() { showTab('home', homeBtn()); window.scrollTo(0, 0); }
    let playing = false;
    const matchOn = () => !!leagueToday() || cupToday() || playing;
    function syncMatch() {
        const tm = $('tab-match'), on = matchOn() && $('tab-home').classList.contains('active');
        if (!tm) return;
        const was = tm.style.display !== 'none';
        tm.style.display = on ? '' : 'none'; tm.classList.toggle('active', on);
        tm.setAttribute('aria-hidden', on ? 'false' : 'true');
        const lt = leagueToday();
        if (on && lt && (lt.t === 'E' || lt.t === 'F')) {
            prepareSpecial(lt);
        }
        if (on && !was && window.PitchViz) PitchViz.preview(true);
    }
    function lockBtn() {
        const b = $('playBtn'); if (!b || !ok() || leagueToday() || cupToday()) return;
        b.disabled = true; const n = G.sched.find(e => e.t === 'L' && e.md > G.matchDay);
        b.textContent = n ? 'Prochain match : ' + fmt(n.d) : 'Saison terminée';
    }

    // ---------- Rendu ----------
    function nextLabel() {
        const e = G.sched.find(e => e.d >= G.date && (e.t === 'L' ? e.md > G.matchDay : !e.done && !(e.t === 'C' && (G.cup.playerEliminated || G.cup.championId))));
        if (!e) return 'Fin de saison le 31 mai';
        const dd = days(G.date, e.d), when = dd === 0 ? 'aujourd\'hui' : dd === 1 ? 'demain' : 'dans ' + dd + ' j';
        const what = e.t === 'L' ? 'J' + e.md + (oppOf(e.md) ? ' · ' + (oppOf(e.md).home ? '' : '@ ') + oppOf(e.md).c.name : '') : e.t === 'F' ? 'Match amical' : e.t === 'E' ? evLabel(e) : (typeof getCupName === 'function' ? getCupName(G.leagueKey) : 'Coupe') + ' · ' + e.r;
        return what + ' — ' + fmt(e.d) + ' (' + when + ')';
    }
    function refresh() {
        if (!ok()) return;
        const bar = document.querySelector('.stats-bar');
        if (bar && !$('g-date')) bar.insertAdjacentHTML('afterbegin', '<div class="stat-pill"><span class="label">Date</span><span class="value" id="g-date"></span></div>');
        $('g-date').textContent = fmt(G.date) + ' ' + G.date.slice(2, 4);
        $('cc-date').textContent = fmt(G.date) + ' ' + G.date.slice(0, 4);
        $('cc-win').textContent = winOpen(G.date) ? 'Mercato ouvert' : 'Mercato fermé'; $('cc-win').className = winOpen(G.date) ? 'open' : '';
        $('cc-next').textContent = 'Prochain : ' + nextLabel();
        const m = !!leagueToday() || cupToday(); $('cc-go').textContent = m ? 'Jouer le match ▶' : 'Continuer ▶'; $('cc-go').classList.toggle('match', m); $('cc-day').disabled = m;
        if (typeof euroTheme === 'function') euroTheme();
        renderNews();
        if (typeof updateTopBar === 'function') updateTopBar();
        if ($('tab-home').classList.contains('active')) { syncMatch(); renderHome(); }
        if ($('tab-calendrier').classList.contains('active')) renderCal();
        if ($('tab-coupe') && $('tab-coupe').classList.contains('active') && window.CUP) CUP.render();
        if ($('tab-carriere') && $('tab-carriere').classList.contains('active') && window.CareerDepth) CareerDepth.render('#career-depth-panel');
    }
    function monthHTML(ym, nav) {
        const [y, m] = ym.split('-').map(Number), dow = (new Date(Date.UTC(y, m - 1, 1, 12)).getUTCDay() + 6) % 7, n = new Date(Date.UTC(y, m, 0)).getUTCDate();
        let h = '<div class="cm"><div class="cm-head">' + (nav ? '<button onclick="CC.cal(-1)">‹</button>' : '') + '<b>' + ML[m - 1] + ' ' + y + '</b>' + (nav ? '<button onclick="CC.cal(1)">›</button>' : '') + '</div><div class="cm-grid">' + ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(x => '<i class="dw">' + x + '</i>').join('');
        for (let i = 0; i < dow; i++) h += '<i></i>';
        for (let d = 1; d <= n; d++) {
            const s = ym + '-' + String(d).padStart(2, '0'), e = G.sched.find(x => x.d === s); let c = 'cm-d', t = '';
            if (s === G.date) c += ' today'; else if (s < G.date) c += ' past';
            if (e) {
                if (e.t === 'L') { const o = oppOf(e.md); c += ' ev-l' + (e.md <= G.matchDay ? ' r' + G.results[e.md - 1] : ''); t = '<span>' + (o ? (o.home ? '' : '@') + o.c.name.slice(0, 3).toUpperCase() : 'J' + e.md) + '</span>'; }
                else if (e.t === 'F') { c += ' ev-f'; t = '<span>Amical</span>'; } else { c += ' ev-c'; t = '<span>Coupe</span>'; }
            }
            h += '<div class="' + c + '"><em>' + d + '</em>' + t + '</div>';
        }
        return h + '</div></div>';
    }
    function renderCal() {
        if (!calYM) calYM = G.date.slice(0, 7);
        $('cal-content').innerHTML = '<div class="section-title">Calendrier</div>' + monthHTML(calYM, true) +
            '<div class="cm-legend"><span class="l">Championnat</span><span class="c">Coupe</span><span class="f">Amical</span><span class="w">Mercato : 1er juil. – 1er sept. · 1er janv. – 1er févr.</span></div>';
    }
    function renderHome() {
        const nx = G.sched.find(e => e.t === 'L' && e.md > G.matchDay), o = nx && oppOf(nx.md), lg = LEAGUES[G.leagueKey];
        let hero = '<div class="hero"><div class="hero-in"><h3>Saison terminée</h3></div></div>';
        if (nx && o) hero = '<div class="hero"><small>' + (lg.flag || '') + ' ' + lg.name + ' · Journée ' + nx.md + ' · ' + fmt(nx.d) + '</small><div class="hero-vs"><div>' + crest(G.clubName, G.clubEmoji, 64) + '<b>' + G.clubName + '</b><span>Force ' + getTeamRating() + '</span></div><strong>' + (o.home ? 'DOM' : 'EXT') + '</strong><div>' + crest(o.c.name, o.c.emoji, 64) + '<b>' + o.c.name + '</b><span>Force ' + budgetToRating(o.c.budget) + '</span></div></div><div class="hero-f"><span>Forme</span>' + (G.results.slice(-5).map(r => '<i class="' + r + '">' + r + '</i>').join('') || '<i>–</i>') + '<button onclick="showTab(\'squad\',document.querySelector(\'.tab-btn[onclick*=&quot;squad&quot;]\'))">Composition</button></div></div>';
        const t = [...G.standings].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga)), me = t.findIndex(x => x.isMe), st = cl(me - 2, 0, Math.max(0, t.length - 6));
        const tbl = t.slice(st, st + 6).map((x, i) => '<tr class="' + (x.isMe ? 'me' : '') + '"><td>' + (st + i + 1) + '</td><td>' + crest(x.name, x.emoji, 18) + ' ' + x.name + '</td><td>' + x.played + '</td><td><b>' + x.points + '</b></td></tr>').join('');
        $('home-content').innerHTML = (matchOn() ? '' : hero) + (G.lastRes && !matchOn() ? '<div class="last">Dernier match : <b>' + G.lastRes + '</b></div>' : '') + '<div class="home-grid"><div>' + monthHTML(G.date.slice(0, 7), false) + '</div><div class="mini"><h4>Classement</h4><table><tr><th>#</th><th>Club</th><th>MJ</th><th>Pts</th></tr>' + tbl + '</table></div></div>';
    }

    // ---------- Montage ----------
    function shell() {
        const g = $('s-game'), bar = g.querySelector('.tab-bar');
        bar.insertAdjacentHTML('afterbegin', '<button class="tab-btn" id="tab-button-home" role="tab" aria-selected="false" aria-controls="tab-home" onclick="showTab(\'home\', this)"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/></svg>Accueil</button>');
        bar.insertAdjacentHTML('beforeend', '<button class="tab-btn" id="tab-button-coupe" role="tab" aria-selected="false" aria-controls="tab-coupe" onclick="showTab(\'coupe\', this)">🏆 Coupe</button>');
        bar.insertAdjacentHTML('beforeend', '<button class="tab-btn" id="tab-button-carriere" role="tab" aria-selected="false" aria-controls="tab-carriere" onclick="showTab(\'carriere\', this)">📚 Carrière</button>');
        g.querySelector('.tab-content').insertAdjacentHTML('beforebegin', '<div id="tab-home" class="tab-content"><div id="home-content"></div></div>');
        g.querySelector('.tab-content').insertAdjacentHTML('beforebegin', '<div id="tab-coupe" class="tab-content"><div id="cup-content"></div></div>');
        g.querySelector('.tab-content').insertAdjacentHTML('beforebegin', '<div id="tab-carriere" class="tab-content"><div id="career-depth-panel"></div></div>');
        g.insertAdjacentHTML('beforeend', '<aside id="cc-news"><div class="nw-head"><h3>Actualités <em id="nw-unread"></em></h3><button onclick="CC.readAll()">Tout lire</button></div><div class="nw-filters" id="nw-filters"></div><div class="nw-list" id="nw-list"></div></aside>' +
            '<div class="cc-dock"><div class="cc-date"><b id="cc-date"></b><span id="cc-win"></span></div><div class="cc-next" id="cc-next"></div><button class="cc-day" id="cc-day" onclick="CC.adv(0)">+1 jour</button><button class="cc-go" id="cc-go" onclick="CC.adv(1)">Continuer ▶</button></div>');
        const tm = $('tab-match'); tm.classList.remove('tab-content'); tm.style.display = 'none';
        $('tab-home').insertBefore(tm, $('home-content'));
        const mb = document.querySelector('.tab-btn[onclick*="\'match\'"]'); if (mb) mb.style.display = 'none';
        _TAB_RENDER.home = () => { if (ok()) { syncMatch(); renderHome(); } };
        _TAB_RENDER.calendrier = () => ok() && renderCal();
        _TAB_RENDER.coupe = () => ok() && window.CUP && CUP.render();
        _TAB_RENDER.carriere = () => ok() && window.CareerDepth && CareerDepth.render('#career-depth-panel');
    }
    window.CC = {
        adv, filter: k => { nf = k; renderNews(); }, read: i => { G.news[i].u = 0; renderNews(); }, readAll: () => { G.news.forEach(n => n.u = 0); renderNews(); },
        cal: n => { const [y, m] = calYM.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + n, 1)); calYM = d.toISOString().slice(0, 7); renderCal(); }
    };

    function boot() {
        shell();
        if (window.CareerDepth && !managerBridgeBound) {
            window.onCareerJobAccepted = function () {
                if (!ok()) return;
                G.date = (Number(G.seasonYear) || 2025) + '-07-01';
                G.sched = null; G.fixtures = null; G._calendar = null; G.activeMatch = null; G.matchContext = null;
                build(); calYM = null;
                if (window.AIWorld) AIWorld.ensure(G, LEAGUES);
                if (typeof prepareNextMatch === 'function') prepareNextMatch();
                if (typeof saveGame === 'function') saveGame();
                refresh();
            };
            managerBridgeBound = true;
        }
        wrap('showTab', (o, a) => a[0] === 'match' ? o.call(null, 'home', homeBtn()) : o.apply(null, a));
        wrap('renderEurope', (o, a) => ok() ? renderEuro() : o.apply(null, a));
        window.playEuroRound = () => toast('Les matchs européens se jouent depuis le calendrier.', 'info');
        wrap('enterGame', (o, a) => { init(); calYM = null; const r = o.apply(null, a); showTab('home', document.querySelector('.tab-btn')); { const t = leagueToday(); if (t && (t.t === 'E' || t.t === 'F')) prepareSpecial(t); } if (leagueToday() || cupToday()) goMatch(); refresh(); return r; });
        wrap('showSeasonSummary', (o, a) => {
            const r = o.apply(null, a);
            if (window.CareerDepth && window._seasonOutcome) {
                const out = window._seasonOutcome, lg = LEAGUES[G.leagueKey] || {};
                if (window.AIWorld) AIWorld.finishSeason(G, LEAGUES, {[G.leagueKey]: G.standings}, (G.seasonYear || 2025) + 1);
                CareerDepth.seasonEnd({rank:out.myRank,objectiveAchieved:G.objective?checkObjective():null,promoted:!!(lg.promotesTo&&out.msgClass==='promo'),relegated:out.msgClass==='rel',cupResult:G.cup&&G.cup.championId===G.cup.playerId?'winner':G.cup&&G.cup.playerEliminated?'eliminated':null,cupName:G.cup&&G.cup.competition,outcome:out.msgClass});
            }
            return r;
        });
        wrap('prepareNextMatch', (o, a) => { const r = o.apply(null, a); lockBtn(); return r; });
        window._setPostMatchBtn = function () { lockBtn(); refresh(); };
        wrap('playMatch', async (o, a) => {
            const lt = leagueToday();
            if (lt && (lt.t === 'F' || lt.t === 'E')) { return playSpecial(lt, o, a); }
            const cupMatch = G.matchContext && G.matchContext.type === 'cup', b = G.matchDay, op = G.nextOpponent, home = G.isHomeMatch;
            playing = true;
            try { await o.apply(null, a); } catch (x) { playing = false; throw x; }
            if (cupMatch && !cupToday()) {
                const played = G.lastCupMatch;
                if (played) news('match', played.winnerId === CUP.getState().playerId ? 'Coupe : qualification' : 'Coupe : élimination', (op ? op.name + ' ' : '') + played.homeGoals + '–' + played.awayGoals + (played.penalties ? ' (t.a.b. ' + played.penalties.join('–') + ')' : '') + '. Prime de match enregistrée.');
                refresh();
            } else if (!cupMatch && G.matchDay > b) {
                const r = G.results[G.results.length - 1], sc = ($('m-score').textContent || '').replace(/\s/g, '');
                news('match', (r === 'W' ? 'Victoire ' : r === 'D' ? 'Match nul ' : 'Défaite ') + sc + ' vs ' + op.name, 'Journée ' + G.matchDay + ' · ' + (home ? 'à domicile' : 'à l\'extérieur') + ' · ' + getRank() + 'e au classement.');
                const ln = (G.leagueMatchResults || []).slice(0, 4)
                    .map(game => game.home + ' ' + game.homeGoals + '–' + game.awayGoals + ' ' + game.away);
                news('world', 'Autres résultats — J' + G.matchDay, ln.join('<br>'));
                G.lastRes = (r === 'W' ? 'Victoire ' : r === 'D' ? 'Match nul ' : 'Défaite ') + sc + ' vs ' + op.name;
                refresh();
                await new Promise(r => setTimeout(r, 2500));
            }
            playing = false; goMatch(); refresh();
        });
        wrap('closeSummary', (o, a) => {
            const y = G.seasonYear; o.apply(null, a);
            G.seasonYear = y + 1; G.date = (y + 1) + '-07-01'; build(); calYM = null;
            if (window.CareerDepth) CareerDepth.newSeason({});
            news('club', 'Saison ' + (y + 1) + '-' + (y + 2), 'Nouvelle saison, nouveau mercato : il est ouvert jusqu\'au 1er septembre.');
            prepareNextMatch(); refresh();
        });
        ['buyPlayer', 'negoPlayer'].forEach(n => wrap(n, (o, a) => {
            if (ok() && !winOpen(G.date)) { toast('Mercato fermé — rendez-vous le ' + (G.date.slice(5) < '07-01' && G.date.slice(5) >= '02-01' ? '1er juillet' : '1er janvier'), 'error'); return; }
            return o.apply(null, a);
        }));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
