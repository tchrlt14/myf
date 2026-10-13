// ==========================================================
//  contracts.js — vrais contrats de joueurs
//  • chaque joueur a p.contract = { until, wage, signed, bonuses[] }
//      until  : année de fin (le contrat expire le 30 juin de cette année)
//      wage   : salaire mensuel (p.wage reste synchronisé : la paie du 1er du mois l'utilise)
//      bonuses: primes d'objectifs (buts, passes, matchs, clean sheets, classement du club)
//  • négociation par dialogue avec l'agent du joueur (durée, salaire, prime de signature, primes)
//  • fin de contrat en juin : les joueurs non prolongés partent libres
//  • remplace l'ancien système (tableau G.contracts indexé par la position dans l'effectif)
// ==========================================================
(function () {
    'use strict';
    const hasG = () => { try { return !!(G && G.squad && G.squad.length); } catch (e) { return false; } };
    const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const pickOf = a => a[Math.floor(Math.random() * a.length)];
    const money = v => typeof fmtMoney === 'function' ? fmtMoney(v) : Math.round(v / 1000) + ' k €';
    const Y = () => G.seasonYear || 2025;          // année de début de la saison en cours
    const END = () => Y() + 1;                     // la saison finit en juin de cette année
    const STEP = 50000;
    const roundStep = v => Math.round(v / STEP) * STEP;

    // ---------- Icônes ----------
    const IC = {
        coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
        cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2 0-4-1-4-3s3-2 4 1c1-3 4-3 4-1s-2 3-4 3z"/>',
        alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
        trophy: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 20h8"/>',
        ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
        assist: '<path d="M5 19L19 5M9 5h10v10"/>',
        user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
        cs: '<path d="M4 20V8h16v12M4 8l3-3h10l3 3M9 12v8M15 12v8"/>',
        chat: '<path d="M4 5h16v11H9l-5 4z"/>',
        lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
        check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        send: '<path d="M4 12l16-8-6 16-3-7z"/>',
        heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
        users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 5.5a3 3 0 010 5.5M18 14.3c1.8.8 3 2.7 3 5.7"/>',
        GK: '<path d="M4 20V8h16v12M4 8l3-3h10l3 3M9 12v8M15 12v8"/>',
        DEF: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
        MID: '<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
        ATT: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
        plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
        up: '<path d="M4 16l6-6 4 4 6-7M15 7h5v5"/>'
    };
    const ic = (k, cls) => '<svg class="ct-ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>';

    // ---------- Primes ----------
    const BT = {
        goals: { label: 'Buts marqués', short: 'Buts', icon: 'ball', mult: 2 },
        assists: { label: 'Passes décisives', short: 'Passes', icon: 'assist', mult: 1.5 },
        apps: { label: 'Matchs joués', short: 'Matchs', icon: 'user', mult: 1 },
        cs: { label: 'Matchs sans but encaissé', short: 'Clean sheets', icon: 'cs', mult: 1.5 },
        team: { label: 'Classement du club (Top N)', short: 'Classement', icon: 'trophy', mult: 3 }
    };
    const typesFor = p => p.pos === 'GK' ? ['cs', 'apps', 'team'] : p.pos === 'DEF' ? ['cs', 'goals', 'apps', 'team'] : ['goals', 'assists', 'apps', 'team'];
    const stat = (p, t) => t === 'goals' ? (p.goals || 0) : t === 'assists' ? (p.assists || 0) : t === 'apps' ? (p.apps || 0) : t === 'cs' ? (p.cs || 0) : 0;
    const progress = (p, b) => Math.max(0, stat(p, b.type) - (b.base || 0));
    function teamSug() {
        const s = (G.standings || []).slice().sort((a, b) => (b.strength || 0) - (a.strength || 0));
        const i = s.findIndex(t => t.isMe) + 1 || 10;
        return Math.max(1, i - 2);
    }
    function sugTarget(p, t) {
        const sl = G.seasonLength || 38, base = 3 + (p.level - 45) * 0.29;
        if (t === 'goals') return Math.max(p.pos === 'DEF' ? 2 : 3, Math.round(base * (p.pos === 'ATT' ? 1 : p.pos === 'MID' ? 0.5 : 0.25)));
        if (t === 'assists') return Math.max(3, Math.round(base * (p.pos === 'MID' ? 0.6 : 0.7)));
        if (t === 'apps') return Math.round(sl * 0.65);
        if (t === 'cs') return Math.round(sl * (p.pos === 'GK' ? 0.25 : 0.2));
        return teamSug();
    }
    const sugAmount = (t, wage) => Math.max(STEP, roundStep(wage * BT[t].mult));
    const bonusLabel = b => b.type === 'team' ? 'Top ' + b.target : b.target + ' ' + BT[b.type].short.toLowerCase();
    function prob(p, b) {   // chance « perçue » par le joueur d'atteindre l'objectif
        const sug = sugTarget(p, b.type);
        return b.type === 'team' ? cl(0.55 * b.target / sug, 0.08, 0.92) : cl(0.55 * sug / Math.max(1, b.target), 0.08, 0.92);
    }

    // ---------- Contrats : création / cohérence ----------
    function newContract(p) {
        const a = p.age || 25, extra = a <= 21 ? rnd(1, 4) : a <= 27 ? rnd(0, 3) : a <= 31 ? rnd(0, 2) : rnd(0, 1);
        return { until: END() + extra, wage: p.wage || 500000, signed: Y(), bonuses: [] };
    }
    function ensure() {
        if (!hasG()) return;
        G.squad.forEach(p => {
            if (!p.contract || typeof p.contract.until !== 'number') p.contract = newContract(p);
            if (!Array.isArray(p.contract.bonuses)) p.contract.bonuses = [];
            if (!p.contract.wage) p.contract.wage = p.wage || 500000;
            p.wage = p.contract.wage;
        });
    }
    const remaining = p => Math.max(0, p.contract.until - Y());            // saisons restantes (saison en cours incluse)
    const expiring = () => G.squad.filter(p => p.contract && p.contract.until <= END());
    const endLabel = u => 'juin ' + u;

    // ---------- Ce que veut le joueur ----------
    const wageIdx = l => cl(Math.round(5 + (l - 40) / 59 * 40), 5, 45) * 100000;
    function scale() {  // calibre le « marché » sur la structure salariale du club
        let sw = 0, sm = 0;
        G.squad.forEach(q => { sw += q.wage || 0; sm += wageIdx(q.level); });
        return cl(sw / Math.max(1, sm), 0.1, 3);
    }
    function want(p) {
        const mk = wageIdx(p.level) * scale();
        const base = (p.age || 25) >= 33 ? Math.max(p.wage * 0.9, mk * 0.85) : Math.max(p.wage * 1.04, mk);
        let m = 0;
        if (p.happy === false) m += 0.12;
        if ((G.reputation || 1) < 3 && p.level >= 75) m += 0.08;
        if ((p.age || 25) <= 23 && (p.pot || 0) - p.level >= 10) m += 0.08;
        if (p.profile === 'irregulier') m += 0.05;
        if (p.profile === 'leader') m -= 0.05;
        const rem = remaining(p);
        if (rem > 2) m += Math.min(0.15, 0.05 * (rem - 2));
        if ((G.morale || 50) >= 75) m -= 0.03;
        return Math.max(STEP, roundStep(base * (1 + m)));
    }
    function prefYears(p) { const a = p.age || 25; return a <= 21 ? 5 : a <= 25 ? 4 : a <= 29 ? 3 : a <= 32 ? 2 : 1; }
    function evaluate(p, o) {
        const w = want(p), pd = prefYears(p), dy = Math.abs(o.years - pd), pen = 1 - 0.035 * dy;
        const ev = o.bonuses.filter(b => b.on).reduce((s, b) => s + b.amount * prob(p, b), 0);
        const extra = (o.signing / (o.years * 12)) * 0.85 + (ev / 12) * 0.5;
        const value = (o.wage + extra) * pen;
        const needed = Math.max(STEP, Math.ceil((w / pen - extra) / STEP) * STEP);
        return { ratio: value / w, want: w, pd, dy, needed };
    }

    // ---------- Journal / actus ----------
    function news(c, t, b) {
        if (!G.news) return;
        G.news.unshift({ d: G.date, c, t, b: b || '', u: 1 });
        if (G.news.length > 90) G.news.length = 90;
    }
    const addDays = (s, n) => new Date(new Date(s + 'T12:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);
    const lockObj = () => G.date ? { d: addDays(G.date, 21) } : { md: (G.matchDay || 0) + 4 };
    function isLocked(p) {
        const k = p.contract && p.contract.lock; if (!k) return false;
        if (k.d && G.date) return G.date < k.d;
        if (k.md != null) return (G.matchDay || 0) < k.md;
        return false;
    }
    function pay(amount, why) {
        G.money = Math.max(0, G.money - amount);
        G.bonusPaid = (G.bonusPaid || 0) + amount;
        if (typeof updateTopBar === 'function') updateTopBar();
    }

    // ---------- Primes d'objectifs : versement ----------
    function payBonuses() {
        G.squad.forEach(p => {
            const c = p.contract; if (!c) return;
            c.bonuses.forEach(b => {
                if (b.type === 'team' || b.paid || progress(p, b) < b.target) return;
                b.paid = true; pay(b.amount);
                news('club', 'Prime versée : ' + p.name, 'Objectif atteint (' + bonusLabel(b) + '). Prime de ' + money(b.amount) + '.');
                if (typeof toast === 'function') toast(p.name + ' : objectif atteint, prime de ' + money(b.amount), 'success');
            });
        });
    }
    function payTeamBonuses() {
        const s = (G.standings || []).slice().sort((a, b) => b.points !== a.points ? b.points - a.points : (b.gf - b.ga) - (a.gf - a.ga));
        const rank = s.findIndex(t => t.isMe) + 1; if (!rank) return;
        let total = 0, n = 0;
        G.squad.forEach(p => (p.contract ? p.contract.bonuses : []).forEach(b => {
            if (b.type === 'team' && !b.paid && rank <= b.target) { b.paid = true; total += b.amount; n++; }
        }));
        if (total) { pay(total); news('club', 'Primes de classement', n + ' prime(s) versée(s) pour la ' + rank + 'e place : ' + money(total) + '.'); }
    }
    function lateWarning() {
        if (G._expNews === Y() || (G.matchDay || 0) < (G.seasonLength || 38) - 8) return;
        const ex = expiring(); if (!ex.length) return;
        G._expNews = Y();
        news('club', 'Fins de contrat en vue', ex.length + ' joueur(s) seront libres en juin : ' + ex.slice(0, 4).map(p => p.name).join(', ') + (ex.length > 4 ? '…' : '') + '. Voyez l\'onglet Contrats.');
    }

    // ==========================================================
    //  NÉGOCIATION
    // ==========================================================
    let NEG = null, ov = null;
    const initials = n => n.split(/[\s-]+/).filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
    const line = a => pickOf(a);

    function initOffer(p) {
        const w = want(p);
        return {
            years: prefYears(p), wage: Math.max(p.wage, roundStep(w * 0.95)), signing: 0,
            bonuses: typesFor(p).map(t => { const wg = p.wage; return { type: t, on: false, target: sugTarget(p, t), amount: sugAmount(t, wg) }; })
        };
    }
    function openNeg(p, onClose) {
        if (!hasG() || !p) return;
        ensure();
        const locked = isLocked(p);
        NEG = { p, onClose, patience: cl(3 + (p.profile === 'leader' ? 1 : 0) - (p.happy === false ? 1 : 0), 2, 4), maxP: 0, rounds: 0, log: [], offer: initOffer(p), done: false, broken: locked };
        NEG.maxP = NEG.patience;
        const w = want(p), fuzz = roundStep(w * (0.93 + Math.random() * 0.14)), y = prefYears(p);
        if (locked) {
            NEG.log.push({ who: 'agent', t: 'Mon client ne veut plus discuter pour le moment. Revenez un peu plus tard, coach.' });
        } else {
            NEG.log.push({ who: 'agent', t: 'Bonjour coach. Je représente <b>' + esc(p.name) + '</b>. ' + (p.happy === false ? 'Il n\'est pas très heureux en ce moment, mais il reste ouvert à la discussion. ' : 'Il est bien ici. ') +
                'Il s\'attend à environ <b>' + money(fuzz) + '</b> par mois sur <b>' + y + ' saison' + (y > 1 ? 's' : '') + '</b> supplémentaire' + (y > 1 ? 's' : '') + '. Que proposez-vous ?' });
        }
        renderNeg();
    }
    function closeNeg() {
        const cb = NEG && NEG.onClose;
        if (ov) { ov.remove(); ov = null; }
        NEG = null;
        if (hasG() && document.getElementById('tab-contrats') && document.getElementById('tab-contrats').classList.contains('active')) renderTab();
        if (cb) cb();
    }
    function offerSummary(o) {
        const n = o.bonuses.filter(b => b.on).length;
        return 'Je vous propose <b>' + o.years + ' saison' + (o.years > 1 ? 's' : '') + '</b>, <b>' + money(o.wage) + '</b> par mois' + (o.signing ? ', <b>' + money(o.signing) + '</b> de prime de signature' : '') + (n ? ' et ' + n + ' prime' + (n > 1 ? 's' : '') + ' d\'objectif' : '') + '.';
    }
    function propose() {
        const p = NEG.p, o = NEG.offer;
        if (NEG.done || NEG.broken) return;
        if (o.signing > G.money) { toast('Budget insuffisant pour la prime de signature', 'error'); return; }
        NEG.log.push({ who: 'you', t: offerSummary(o) });
        NEG.rounds++;
        const e = evaluate(p, o), nm = esc(p.name.split(' ').slice(-1)[0]);
        let extra = '';
        if (e.dy >= 2) extra = o.years > e.pd ? ' Et franchement, ' + o.years + ' saisons, c\'est trop long pour moi.' : ' Et ' + (o.years > 1 ? o.years + ' saisons' : 'une seule saison') + ', ça ne me donne pas assez de sécurité.';
        if (e.ratio >= 1) { sign(); return; }
        if (e.ratio >= 0.93) {
            NEG.log.push({ who: 'player', t: line([
                'On n\'est pas loin, mais il me manque un petit effort. Dans ces conditions, je ne signe pas pour moins de <b>' + money(e.needed) + '</b> par mois.',
                'Votre offre est sérieuse. Avec <b>' + money(e.needed) + '</b> mensuels, on s\'entend.',
                'On y est presque ! Montez à <b>' + money(e.needed) + '</b> par mois et c\'est réglé.']) + extra });
        } else if (e.ratio >= 0.75) {
            NEG.patience--;
            NEG.log.push({ who: 'player', t: line([
                'Ce n\'est pas à la hauteur de ce que j\'apporte au groupe. Il faut revoir votre copie.',
                'Je m\'attendais à mieux, coach. ' + (e.ratio >= 0.8 ? 'Il faudrait au moins <b>' + money(e.needed) + '</b> par mois dans ces conditions.' : 'On est assez loin du compte.'),
                'Honnêtement, d\'autres clubs me proposeraient davantage.']) + extra });
        } else {
            NEG.patience -= 2;
            NEG.log.push({ who: 'player', t: line(['Vous plaisantez ? C\'est presque insultant.', 'Mon agent va bondir en voyant ça…', 'Je ne peux pas accepter une offre pareille, ' + nm + ' mérite mieux.']) + extra });
        }
        if (NEG.patience <= 0 || NEG.rounds >= 8) breakTalks();
        renderNeg();
    }
    function breakTalks() {
        const p = NEG.p;
        NEG.broken = true; p.happy = false; p.contract.lock = lockObj();
        NEG.log.push({ who: 'player', t: 'Je crois qu\'on a épuisé la discussion. Je vais réfléchir à mon avenir. On reparlera plus tard, peut-être.' });
        news('club', 'Discussions rompues : ' + p.name, 'La négociation de contrat a échoué. Il est mécontent.');
    }
    function sign() {
        const p = NEG.p, o = NEG.offer, old = p.contract;
        if (o.signing) pay(o.signing);
        const bonuses = o.bonuses.filter(b => b.on).map((b, i) => ({ id: Date.now() + i, type: b.type, target: Math.max(1, b.target), amount: Math.max(0, b.amount), base: b.type === 'team' ? 0 : stat(p, b.type), paid: false }));
        p.contract = { until: Math.max(old.until, END()) + o.years, wage: o.wage, signed: Y(), bonuses };
        p.wage = o.wage; p.happy = true;
        NEG.done = true;
        NEG.log.push({ who: 'player', t: line(['Marché conclu ! Je suis ravi de continuer l\'aventure ici.', 'Ce projet me parle. Où est-ce que je signe ?', 'Merci pour votre confiance, coach. On signe !']) });
        news('club', 'Prolongation : ' + p.name, 'Signe jusqu\'en ' + endLabel(p.contract.until) + ' · ' + money(o.wage) + ' par mois' + (bonuses.length ? ' · ' + bonuses.length + ' prime(s)' : '') + '.');
        if (typeof toast === 'function') toast(p.name + ' a prolongé jusqu\'en ' + endLabel(p.contract.until), 'success');
        if (typeof updateTopBar === 'function') updateTopBar();
        renderNeg();
    }

    function offerTotals() {
        const o = NEG.offer, bonusYear = o.bonuses.filter(b => b.on).reduce((s, b) => s + b.amount, 0);
        return { total: o.wage * 12 * o.years + o.signing, annual: o.wage * 12, bonusYear };
    }
    function summaryHTML() {
        const p = NEG.p, o = NEG.offer, t = offerTotals(), cur = p.wage || 1, diff = Math.round((o.wage / cur - 1) * 100);
        const base = Math.max(p.contract.until, END()) + o.years;
        return '<div class="ct-sum-row"><span>Nouvelle échéance</span><b>' + endLabel(base) + ' · ' + ((p.age || 25) + (base - END()) + 1) + ' ans</b></div>' +
            '<div class="ct-sum-row"><span>Salaire annuel</span><b>' + money(t.annual) + ' <small class="' + (diff > 0 ? 'up' : diff < 0 ? 'dn' : '') + '">' + (diff > 0 ? '+' : '') + diff + ' %</small></b></div>' +
            '<div class="ct-sum-row"><span>Primes max. par saison</span><b>' + money(t.bonusYear) + '</b></div>' +
            '<div class="ct-sum-row tot"><span>Coût total estimé</span><b>' + money(t.total) + '</b></div>' +
            '<div class="ct-sum-row"><span>Budget disponible</span><b class="' + (o.signing > G.money ? 'dn' : '') + '">' + money(G.money) + '</b></div>';
    }
    function renderNeg() {
        if (!NEG) return;
        if (!ov) { ov = document.createElement('div'); ov.className = 'ct-overlay'; ov.style.zIndex = 10050; document.body.appendChild(ov); bindNeg(); }
        const p = NEG.p, o = NEG.offer, c = p.contract, off = NEG.done || NEG.broken, dis = off ? ' disabled' : '';
        const bubbles = NEG.log.map(m => '<div class="ct-msg ' + m.who + '">' + (m.who === 'you' ? '' : '<b>' + (m.who === 'agent' ? 'Agent' : esc(p.name.split(' ').slice(-1)[0])) + '</b>') + '<p>' + m.t + '</p></div>').join('');
        const hearts = Array.from({ length: NEG.maxP }, (_, i) => ic('heart', i < NEG.patience ? 'on' : 'off')).join('');
        const years = [1, 2, 3, 4, 5].map(y => '<button type="button" class="ct-seg' + (o.years === y ? ' on' : '') + '" data-years="' + y + '"' + dis + '>' + y + '</button>').join('');
        const brows = o.bonuses.map(b => '<div class="ct-brow' + (b.on ? ' on' : '') + '"><label class="ct-bl"><input type="checkbox" data-bt="' + b.type + '"' + (b.on ? ' checked' : '') + dis + '>' + ic(BT[b.type].icon) + '<span>' + BT[b.type].label + '</span></label>' +
            '<div class="ct-bin"' + (b.on ? '' : ' hidden') + '><label>' + (b.type === 'team' ? 'Top' : 'Objectif') + '<input type="number" min="1" data-bf="target" data-t="' + b.type + '" value="' + b.target + '"' + dis + '></label>' +
            '<label>Prime (k€)<input type="number" min="0" step="50" data-bf="amount" data-t="' + b.type + '" value="' + Math.round(b.amount / 1000) + '"' + dis + '></label></div></div>').join('');
        const cur = 'Actuel : <b>' + money(p.wage) + '</b>/mois · jusqu\'en <b>' + endLabel(c.until) + '</b>' + (c.bonuses.length ? ' · ' + c.bonuses.length + ' prime(s)' : '');
        ov.innerHTML = '<div class="ct-modal" role="dialog" aria-label="Négociation de contrat"><header class="ct-mh"><span class="ct-av ' + p.pos + '">' + initials(p.name) + '</span>' +
            '<div class="ct-mt"><h3>' + esc(p.name) + '</h3><div class="ct-ms"><span class="ct-pos ' + p.pos + '">' + ic(p.pos) + p.pos + '</span><span>' + (p.age || '?') + ' ans</span><span>Note <b>' + p.level + '</b></span><span>Pot. <b>' + (p.potMin === p.potMax ? p.potMax : p.potMin + '–' + p.potMax) + '</b></span></div><div class="ct-cur">' + cur + '</div></div>' +
            '<div class="ct-pat" title="Patience du joueur">' + hearts + '</div><button class="ct-x" data-act="close" aria-label="Fermer">' + ic('x') + '</button></header>' +
            '<div class="ct-mb"><section class="ct-chat" id="ct-chat">' + bubbles + (NEG.done ? '<div class="ct-banner ok">' + ic('check') + 'Contrat signé jusqu\'en ' + endLabel(c.until) + '</div>' : '') + (NEG.broken && !NEG.done ? '<div class="ct-banner ko">' + ic('lock') + 'Discussions rompues' + (c.lock && c.lock.d ? ' jusqu\'au ' + c.lock.d.split('-').reverse().join('/') : '') + '</div>' : '') + '</section>' +
            '<section class="ct-form"><div class="ct-fl">Durée de la prolongation <small>(saisons ajoutées après l\'échéance)</small></div><div class="ct-segs">' + years + '</div>' +
            '<div class="ct-fl">Salaire mensuel</div><div class="ct-stepper"><button type="button" data-step="-1"' + dis + '>' + ic('minus') + '</button><input type="number" data-f="wage" step="50" min="50" value="' + Math.round(o.wage / 1000) + '"' + dis + '><em>k€ / mois</em><button type="button" data-step="1"' + dis + '>' + ic('plus') + '</button></div>' +
            '<div class="ct-fl">Prime de signature</div><div class="ct-stepper"><input type="number" data-f="signing" step="50" min="0" value="' + Math.round(o.signing / 1000) + '"' + dis + '><em>k€ (versée tout de suite)</em></div>' +
            '<div class="ct-fl">Primes d\'objectifs <small>(versées dès que l\'objectif est atteint dans la saison)</small></div><div class="ct-brows">' + brows + '</div>' +
            '<div class="ct-sum" id="ct-sum">' + summaryHTML() + '</div>' +
            '<div class="ct-act">' + (NEG.done ? '<button class="ct-btn go" data-act="close">' + ic('check') + 'Terminer</button>' : off ? '<button class="ct-btn" data-act="close">Fermer</button>' : '<button class="ct-btn" data-act="close">Quitter la discussion</button><button class="ct-btn go" data-act="propose">' + ic('send') + 'Proposer</button>') + '</div></section></div></div>';
        const chat = document.getElementById('ct-chat'); if (chat) chat.scrollTop = chat.scrollHeight;
    }
    function refreshSummary() { const s = document.getElementById('ct-sum'); if (s && NEG) s.innerHTML = summaryHTML(); }
    function bindNeg() {
        ov.addEventListener('mousedown', e => { if (e.target === ov) closeNeg(); });
        ov.addEventListener('click', e => {
            if (!NEG) return;
            const a = e.target.closest('[data-act]');
            if (a) { if (a.dataset.act === 'close') closeNeg(); else if (a.dataset.act === 'propose') propose(); return; }
            const y = e.target.closest('[data-years]');
            if (y) { NEG.offer.years = +y.dataset.years; renderNeg(); return; }
            const s = e.target.closest('[data-step]');
            if (s) { NEG.offer.wage = Math.max(STEP, NEG.offer.wage + (+s.dataset.step) * STEP); renderNeg(); }
        });
        ov.addEventListener('change', e => {
            if (!NEG || !e.target.dataset.bt) return;
            NEG.offer.bonuses.find(b => b.type === e.target.dataset.bt).on = e.target.checked; renderNeg();
        });
        ov.addEventListener('input', e => {
            if (!NEG) return;
            const t = e.target, v = parseFloat(t.value), n = isFinite(v) ? v : 0;
            if (t.dataset.f === 'wage') NEG.offer.wage = Math.max(STEP, Math.round(n) * 1000);
            else if (t.dataset.f === 'signing') NEG.offer.signing = Math.max(0, Math.round(n) * 1000);
            else if (t.dataset.bf) { const b = NEG.offer.bonuses.find(x => x.type === t.dataset.t); if (b) b[t.dataset.bf] = t.dataset.bf === 'amount' ? Math.max(0, Math.round(n) * 1000) : Math.max(1, Math.round(n)); }
            refreshSummary();
        });
    }

    // ==========================================================
    //  ONGLET CONTRATS
    // ==========================================================
    const C = { filter: 'all', sort: 'until', dir: 1 };
    const lvlColor = l => l >= 85 ? '#3fb871' : l >= 75 ? '#8fd16b' : l >= 65 ? '#e8b94f' : l >= 55 ? '#e8924f' : '#d9534f';
    const posPill = p => '<span class="ct-pos ' + p + '">' + ic(p) + p + '</span>';
    function bonusChips(p) {
        const c = p.contract; if (!c.bonuses.length) return '<span class="ct-none">Aucune</span>';
        return c.bonuses.map(b => {
            const prog = b.type === 'team' ? '' : ' ' + Math.min(progress(p, b), b.target) + '/' + b.target;
            return '<span class="ct-chip' + (b.paid ? ' done' : '') + '" title="' + esc(BT[b.type].label) + ' — prime ' + money(b.amount) + (b.paid ? ' (versée)' : '') + '">' + ic(b.paid ? 'check' : BT[b.type].icon) + (b.type === 'team' ? 'Top ' + b.target : BT[b.type].short + prog) + '<em>' + money(b.amount) + '</em></span>';
        }).join('');
    }
    function renderTab() {
        const el = document.getElementById('contrats-content');
        if (!el || !hasG()) return;
        ensure();
        const sq = G.squad, monthly = sq.reduce((s, p) => s + (p.wage || 0), 0), ex = expiring();
        const open = sq.reduce((s, p) => s + p.contract.bonuses.filter(b => !b.paid).reduce((a, b) => a + b.amount, 0), 0);
        let list = sq.map((p, i) => ({ p, i }));
        if (C.filter === 'expiring') list = list.filter(x => x.p.contract.until <= END());
        else if (C.filter === 'bonus') list = list.filter(x => x.p.contract.bonuses.length);
        const val = { until: x => x.p.contract.until, wage: x => x.p.wage || 0, level: x => x.p.level, name: x => x.p.name.toLowerCase(), age: x => x.p.age || 0 }[C.sort];
        list.sort((a, b) => { const u = val(a), v = val(b); return u < v ? -C.dir : u > v ? C.dir : (b.p.level - a.p.level); });
        const kpi = (icon, v, l, cls) => '<div class="ct-kpi ' + (cls || '') + '">' + ic(icon) + '<div><b>' + v + '</b><span>' + l + '</span></div></div>';
        const chip = (k, l, n) => '<button class="ct-fchip' + (C.filter === k ? ' on' : '') + '" data-filter="' + k + '">' + l + '<small>' + n + '</small></button>';
        const th = (k, l, cls) => '<th class="' + (cls || '') + (C.sort === k ? ' on' : '') + '" data-sort="' + k + '">' + l + (C.sort === k ? '<em>' + (C.dir > 0 ? '▲' : '▼') + '</em>' : '') + '</th>';
        const rows = list.map(({ p, i }) => {
            const rem = remaining(p), cls = rem <= 1 ? 'danger' : rem === 2 ? 'warn' : 'ok', lock = isLocked(p);
            return '<tr><td><div class="ct-pl"><span class="ct-av ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.name) + '</b><small>' + (p.age || '?') + ' ans · note <i style="color:' + lvlColor(p.level) + '">' + p.level + '</i>' + (p.happy === false ? ' · <i class="dn">mécontent</i>' : '') + '</small></div></div></td>' +
                '<td class="r"><b>' + money(p.wage) + '</b><small>/ mois</small></td>' +
                '<td><span class="ct-end ' + cls + '">' + ic(rem <= 1 ? 'alert' : 'cal') + endLabel(p.contract.until) + '<em>' + rem + ' saison' + (rem > 1 ? 's' : '') + '</em></span></td>' +
                '<td class="ct-bc">' + bonusChips(p) + '</td>' +
                '<td class="r"><button class="ct-neg' + (lock ? ' lock' : '') + '" data-neg="' + i + '"' + (lock ? ' title="Discussions rompues"' : '') + '>' + ic(lock ? 'lock' : 'chat') + (lock ? 'Rompu' : 'Négocier') + '</button></td></tr>';
        }).join('');
        el.innerHTML = '<div class="section-title">Contrats</div>' +
            '<div class="ct-kpis">' + kpi('coins', money(monthly), 'masse salariale / mois') + kpi('cal', money(monthly * 12), 'sur 12 mois') +
            kpi('alert', ex.length, 'fin de contrat en juin', ex.length ? 'warn' : '') + kpi('gift', money(G.bonusPaid || 0), 'primes versées (saison)') + kpi('trophy', money(open), 'primes encore à gagner') + '</div>' +
            '<div class="ct-help">' + ic('clock') + '<span>Les salaires sont prélevés le 1er de chaque mois. Les contrats expirent le <b>30 juin</b> : un joueur non prolongé part libre à la fin de la saison. Une prolongation s\'ajoute après l\'échéance, le nouveau salaire s\'applique tout de suite.</span></div>' +
            '<div class="ct-fchips">' + chip('all', 'Tous', sq.length) + chip('expiring', 'Expirent cette saison', ex.length) + chip('bonus', 'Avec primes', sq.filter(p => p.contract.bonuses.length).length) + '</div>' +
            '<div class="ct-scroll"><table class="ct-table"><thead><tr>' + th('name', 'Joueur') + th('wage', 'Salaire', 'r') + th('until', 'Échéance') + '<th>Primes d\'objectifs</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="ct-empty">Aucun joueur.</td></tr>') + '</tbody></table></div>';
        if (!el.dataset.bound) {
            el.dataset.bound = '1';
            el.addEventListener('click', e => {
                const n = e.target.closest('[data-neg]'); if (n) { openNeg(G.squad[+n.dataset.neg]); return; }
                const f = e.target.closest('[data-filter]'); if (f) { C.filter = f.dataset.filter; renderTab(); return; }
                const h = e.target.closest('th[data-sort]'); if (h) { const k = h.dataset.sort; if (C.sort === k) C.dir = -C.dir; else { C.sort = k; C.dir = k === 'wage' || k === 'level' ? -1 : 1; } renderTab(); }
            });
        }
    }

    // ==========================================================
    //  FIN DE SAISON : fenêtre « fins de contrat » + départs
    // ==========================================================
    let leaveOv = null;
    function renderLeave(cont) {
        const ex = expiring();
        if (!leaveOv) { leaveOv = document.createElement('div'); leaveOv.className = 'ct-overlay'; leaveOv.style.zIndex = 10040; document.body.appendChild(leaveOv); }
        const rows = ex.map(p => '<div class="ct-lrow"><span class="ct-av ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.name) + '</b><small>' + (p.age || '?') + ' ans · note ' + p.level + ' · ' + money(p.wage) + '/mois</small></div><button class="ct-neg" data-lneg="' + G.squad.indexOf(p) + '">' + ic('chat') + 'Négocier</button></div>').join('');
        leaveOv.innerHTML = '<div class="ct-modal sm"><header class="ct-mh"><span class="ct-av ico">' + ic('alert') + '</span><div class="ct-mt"><h3>Fins de contrat</h3><div class="ct-cur">' + (ex.length ? ex.length + ' joueur(s) seront libres le 30 juin s\'ils ne sont pas prolongés.' : 'Tous les contrats sont réglés.') + '</div></div></header>' +
            '<div class="ct-lbody">' + (rows || '<div class="ct-empty">Rien à signaler.</div>') + '</div>' +
            '<div class="ct-act"><button class="ct-btn" data-lact="back">Revenir</button><button class="ct-btn go" data-lact="go">' + (ex.length ? 'Les laisser partir et continuer' : 'Continuer') + '</button></div></div>';
        leaveOv.onclick = e => {
            if (e.target === leaveOv) { closeLeave(); return; }
            const n = e.target.closest('[data-lneg]');
            if (n) { openNeg(G.squad[+n.dataset.lneg], () => renderLeave(cont)); return; }
            const a = e.target.closest('[data-lact]'); if (!a) return;
            closeLeave(); if (a.dataset.lact === 'go') cont();
        };
    }
    function closeLeave() { if (leaveOv) { leaveOv.remove(); leaveOv = null; } }

    function afterSeasonReset() {
        G.squad.forEach(p => { p.apps = 0; p.cs = 0; (p.contract ? p.contract.bonuses : []).forEach(b => { b.paid = false; b.base = 0; }); });
        G.bonusPaid = 0; G._expNews = 0;
        const gone = G.squad.filter(p => p.contract && p.contract.until <= Y());
        if (!gone.length) return;
        // on garde un minimum de joueurs : prolongation automatique d'un an (+10 %) des meilleurs
        const stay = [], leave = gone.slice().sort((a, b) => b.level - a.level);
        while (leave.length && G.squad.length - leave.length < 15) stay.push(leave.shift());
        stay.forEach(p => { p.contract.until = Y() + 1; p.contract.wage = roundStep(p.contract.wage * 1.1); p.wage = p.contract.wage; });
        if (stay.length) news('club', 'Prolongations automatiques', stay.map(p => p.name).join(', ') + ' : un an de plus (+10 % de salaire) pour garder un effectif suffisant.');
        if (leave.length) {
            G.squad = G.squad.filter(p => !leave.includes(p));
            news('club', 'Départs libres', leave.map(p => p.name).join(', ') + ' quitte' + (leave.length > 1 ? 'nt' : '') + ' le club à la fin de son contrat.');
            setTimeout(() => { if (typeof toast === 'function') toast(leave.length + ' joueur(s) parti(s) en fin de contrat', 'info'); }, 900);
        }
    }

    // ---------- Branchements sur script.js / career.js ----------
    function wrapFn(name, make) {
        const o = window[name]; if (typeof o !== 'function') return;
        window[name] = make(o);   // les fonctions de script.js sont des propriétés de window : le binding global suit
    }
    function init() {
        const t = typeof _TAB_RENDER === 'object' ? _TAB_RENDER : null;
        if (t) t.contrats = () => renderTab();
        window.renderContrats = renderTab;
        window.generateContracts = () => [];
        window.extendContract = i => { if (hasG()) openNeg(G.squad[i]); };
        wrapFn('renderContrats', () => renderTab);
        wrapFn('updateTopBar', o => function () { const r = o.apply(this, arguments); try { ensure(); } catch (e) { } return r; });
        wrapFn('playMatch', o => async function () {
            let xi = [], b = 0, ga = 0;
            try {
                if (hasG()) {
                    ensure(); b = G.matchDay; ga = G.goalsAgainst || 0;
                    xi = (G.lineup && G.lineup.pitch ? G.lineup.pitch : []).map(i => G.squad[i]).filter(p => p && !p.injuredGames);
                    if (xi.length < 11) xi = G.squad.filter(p => !p.injuredGames).sort((a, c) => c.level - a.level).slice(0, 11);
                }
            } catch (e) { }
            const r = await o.apply(this, arguments);
            try {
                if (hasG() && G.matchDay > b) {
                    xi.forEach(p => { p.apps = (p.apps || 0) + 1; });
                    if ((G.goalsAgainst || 0) === ga) xi.filter(p => p.pos === 'GK' || p.pos === 'DEF').forEach(p => { p.cs = (p.cs || 0) + 1; });
                    payBonuses(); lateWarning();
                }
            } catch (e) { console.warn('contracts:', e); }
            return r;
        });
        let skip = false;
        wrapFn('closeSummary', o => function () {
            if (!hasG()) return o.apply(this, arguments);
            ensure();
            const self = this, args = arguments;
            if (!skip && expiring().length) {
                renderLeave(() => { skip = true; try { window.closeSummary.apply(self, args); } finally { skip = false; } });
                return;
            }
            try { payTeamBonuses(); } catch (e) { console.warn(e); }
            const pitch = G.lineup && G.lineup.pitch ? G.lineup.pitch.map(i => (i == null ? null : G.squad[i])) : null;
            const r = o.apply(this, arguments);
            try {
                afterSeasonReset();
                if (pitch && G.lineup) { G.lineup.pitch = pitch.map(p => { const i = p ? G.squad.indexOf(p) : -1; return i < 0 ? null : i; }); if (typeof initLineup === 'function') initLineup(); }
                G.contracts = [];
            } catch (e) { console.warn('contracts:', e); }
            return r;
        });
        if (hasG()) ensure();
    }
    window.Contracts = { open: i => hasG() && openNeg(G.squad[i]), ensure, want, evaluate, _t: { openNeg, propose, sign: () => sign(), get NEG() { return NEG; }, renderTab, afterSeasonReset, payBonuses, payTeamBonuses, expiring, initOffer } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
