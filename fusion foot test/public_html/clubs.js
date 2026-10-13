// ==========================================================
//  clubs.js — effectifs de TOUS les clubs
//  • charge joueur.json (un club, un tableau de clubs, ou { "clubs": [...] })
//  • clubs présents dans le JSON → vrai effectif ; les autres → effectif généré (stable)
//  • si tu joues avec un club du JSON, ton effectif de départ est le vrai
//  • onglet « Clubs » : icônes SVG + vrais drapeaux (aucun emoji)
//  Champs par joueur : nom, numero, poste, nationalite, date_naissance
//  (facultatifs : note, potentiel, salaire)
// ==========================================================
(function () {
    'use strict';
    const SRC = 'joueur.json';
    const hasG = () => { try { return !!(G && G.squad); } catch (e) { return false; } };
    const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const ALIAS = { 'tottenham hotspur': 'tottenham', spurs: 'tottenham', 'brighton hove albion': 'brighton', 'afc bournemouth': 'bournemouth', wolves: 'wolverhampton wanderers', 'man city': 'manchester city', 'man united': 'manchester united', 'manchester utd': 'manchester united', newcastle: 'newcastle united', 'nottm forest': 'nottingham forest' };
    const key = n => { const k = norm(n).replace(/^(afc|fc) /, '').replace(/ (fc|afc)$/, ''); return ALIAS[k] || k; };
    const POS_MAP = { gardien: 'GK', defenseur: 'DEF', milieu: 'MID', attaquant: 'ATT', gk: 'GK', def: 'DEF', mid: 'MID', att: 'ATT' };
    const POS_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
    const POS_LABEL = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', ATT: 'Attaquant' };
    const MIN_SQUAD = 11;   // en dessous, le club du JSON est jugé incomplet et ignoré

    // ---------- Icônes SVG ----------
    const IC = {
        users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 5.5a3 3 0 010 5.5M18 14.3c1.8.8 3 2.7 3 5.7"/>',
        gauge: '<path d="M4 18a8 8 0 1116 0"/><path d="M12 18l4-6"/>',
        cake: '<path d="M4 20h16v-6H4zM4 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M12 12V8M12 5v1"/>',
        star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
        coach: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5M12 14l-1.5 3 1.5 2 1.5-2z"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
        chevron: '<path d="M6 9l6 6 6-6"/>',
        check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
        warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
        db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
        shuffle: '<path d="M3 7h4c4 0 6 10 10 10h4M3 17h4c1.6 0 2.8-1.2 3.8-2.6M21 7h-4c-1.6 0-2.8 1.2-3.8 2.6M18 4l3 3-3 3M18 14l3 3-3 3"/>',
        up: '<path d="M4 16l6-6 4 4 6-7M15 7h5v5"/>',
        home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/>',
        globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
        all: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
        GK: '<path d="M4 20V8h16v12M4 8l3-3h10l3 3M9 12v8M15 12v8"/>',
        DEF: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
        MID: '<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
        ATT: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>'
    };
    const ic = (k, cls) => '<svg class="cl-ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>';

    // ---------- Drapeaux & écussons (images, jamais d'emoji) ----------
    const LEAGUE_ISO = { england: 'GB-ENG', scotland: 'GB-SCT', france: 'FR', germany: 'DE', italy: 'IT', spain: 'ES', greece: 'GR', austria: 'AT', switzerland: 'CH', denmark: 'DK', norway: 'NO', sweden: 'SE', poland: 'PL', croatia: 'HR', ukraine: 'UA', serbia: 'RS', romania: 'RO', portugal: 'PT', netherlands: 'NL', belgium: 'BE', turkey: 'TR', czech: 'CZ', israel: 'IL', cyprus: 'CY', hungary: 'HU', bulgaria: 'BG', slovakia: 'SK', azerbaijan: 'AZ', slovenia: 'SI', ireland: 'IE', finland: 'FI', iceland: 'IS', albania: 'AL', luxembourg: 'LU', andorra: 'AD', gibraltar: 'GI', sanmarino: 'SM' };
    const COUNTRY_NAT = { england: 'Angleterre', france: 'France', germany: 'Allemagne', italy: 'Italie', spain: 'Espagne', greece: 'Grèce', austria: 'Autriche', scotland: 'Écosse', switzerland: 'Suisse', denmark: 'Danemark', norway: 'Norvège', sweden: 'Suède', poland: 'Pologne', croatia: 'Croatie', ukraine: 'Ukraine', serbia: 'Serbie', romania: 'Roumanie', portugal: 'Portugal', netherlands: 'Pays-Bas', belgium: 'Belgique', turkey: 'Turquie', czech: 'Tchéquie', israel: 'Israël', cyprus: 'Chypre', hungary: 'Hongrie', bulgaria: 'Bulgarie', slovakia: 'Slovaquie', azerbaijan: 'Azerbaïdjan', slovenia: 'Slovénie', ireland: 'Irlande', finland: 'Finlande', iceland: 'Islande', albania: 'Albanie', luxembourg: 'Luxembourg', andorra: 'Andorre', gibraltar: 'Gibraltar', sanmarino: 'Saint-Marin' };
    const COUNTRY_NAME = Object.assign({}, COUNTRY_NAT, { czech: 'Rép. tchèque', sanmarino: 'Saint-Marin' });
    const NAT_ISO = { italie: 'IT', angleterre: 'GB-ENG', ecosse: 'GB-SCT', 'pays de galles': 'GB-WLS', 'irlande du nord': 'GB-NIR', argentine: 'AR', france: 'FR', portugal: 'PT', algerie: 'DZ', bresil: 'BR', croatie: 'HR', ouzbekistan: 'UZ', maroc: 'MA', norvege: 'NO', senegal: 'SN', belgique: 'BE', ghana: 'GH', espagne: 'ES', allemagne: 'DE', 'pays bas': 'NL', nigeria: 'NG', 'cote d ivoire': 'CI', cameroun: 'CM', uruguay: 'UY', colombie: 'CO', irlande: 'IE', suisse: 'CH', autriche: 'AT', danemark: 'DK', suede: 'SE', pologne: 'PL', serbie: 'RS', turquie: 'TR', grece: 'GR', ukraine: 'UA', 'etats unis': 'US', japon: 'JP', 'coree du sud': 'KR', mali: 'ML', egypte: 'EG', tunisie: 'TN', 'rd congo': 'CD', equateur: 'EC', paraguay: 'PY', mexique: 'MX', canada: 'CA', australie: 'AU', roumanie: 'RO', tchequie: 'CZ', israel: 'IL', chypre: 'CY', hongrie: 'HU', bulgarie: 'BG', slovaquie: 'SK', azerbaidjan: 'AZ', slovenie: 'SI', finlande: 'FI', islande: 'IS', albanie: 'AL', luxembourg: 'LU', andorre: 'AD', gibraltar: 'GI', 'saint marin': 'SM', 'burkina faso': 'BF', guinee: 'GN', gabon: 'GA', benin: 'BJ', jamaique: 'JM', venezuela: 'VE', chili: 'CL', perou: 'PE', 'afrique du sud': 'ZA', 'bosnie herzegovine': 'BA', estonie: 'EE', gambie: 'GM', georgie: 'GE', 'nouvelle zelande': 'NZ', lettonie: 'LV', lituanie: 'LT', armenie: 'AM', kosovo: 'XK', macedoine: 'MK', montenegro: 'ME', suriname: 'SR', curacao: 'CW', 'cap vert': 'CV', angola: 'AO', togo: 'TG', guinee_: 'GN', congo: 'CG', zambie: 'ZM', zimbabwe: 'ZW', iran: 'IR', irak: 'IQ', chine: 'CN' };
    const FOREIGN = ['France', 'Brésil', 'Espagne', 'Portugal', 'Argentine', 'Sénégal', 'Maroc', 'Nigeria', 'Allemagne', 'Pays-Bas', 'Belgique', 'Côte d\'Ivoire', 'Cameroun', 'Colombie', 'Uruguay', 'Ghana', 'Mali', 'Italie', 'Angleterre', 'Croatie'];
    const FALLBACK_FLAG = '<svg class="cl-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 5h12l-2 4 2 4H5"/></svg>';
    window.__clFlagErr = img => { const s = document.createElement('span'); s.className = 'cl-flag-fb'; s.innerHTML = FALLBACK_FLAG; img.replaceWith(s); };
    window.__clCrestErr = img => { const s = document.createElement('span'); s.innerHTML = shield(+img.dataset.size, img.dataset.color); img.replaceWith(s.firstChild); };
    const flagCC = (cc, w) => {
        if (!cc) return '<span class="cl-flag-fb">' + FALLBACK_FLAG + '</span>';
        const c = cc.toLowerCase(), b = w <= 24 ? 40 : 80, h = Math.round(w * .75);
        return '<img class="cl-flag" width="' + w + '" height="' + h + '" alt="" loading="lazy" src="https://flagcdn.com/w' + b + '/' + c + '.png" srcset="https://flagcdn.com/w' + b * 2 + '/' + c + '.png 2x" onerror="__clFlagErr(this)">';
    };
    const natFlag = (nat, w) => flagCC(NAT_ISO[norm(nat)], w || 20);
    const leagueFlag = (lg, w) => flagCC(LEAGUE_ISO[lg.country], w || 20);
    const DOT = { '🔵': '#4c8fe0', '🔴': '#e0504c', '⚪': '#e6edf3', '⚫': '#6b7782', '🟣': '#9b6ce0', '🟡': '#e8c04f', '🟠': '#ec8a3c', '🟢': '#3fb871', '🟤': '#a0714f' };
    function shield(size, color) {
        return '<svg class="cl-shield" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" style="color:' + color + '" aria-hidden="true"><path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10.5-4.6-1.7-8-5.500-8-10.500v-6z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    }
    function crestOf(name, size, club) {
        const color = DOT[club && club.emoji] || '#8aa0b2';
        let f = null; try { f = CLUB_LOGOS[name]; } catch (e) { }
        if (!f) return shield(size, color);
        return '<img class="cl-crest" width="' + size + '" height="' + size + '" alt="" loading="lazy" data-size="' + size + '" data-color="' + color + '" src="image/logo_club/' + f + '.png" onerror="__clCrestErr(this)">';
    }

    // ---------- Aléatoire stable ----------
    function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function rng(seedStr) { let a = hash(seedStr); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

    // ---------- Données JSON ----------
    const DB = new Map();
    const partial = [];
    let status = 'loading', errMsg = '', salvaged = false;
    function ingest(json) {
        const list = Array.isArray(json) ? json : (json && Array.isArray(json.clubs) ? json.clubs : [json]);
        DB.clear(); partial.length = 0;
        list.forEach(c => {
            if (!c || !c.club || !Array.isArray(c.joueurs)) return;
            if (c.joueurs.length < MIN_SQUAD) { partial.push(c.club + ' (' + c.joueurs.length + ')'); return; }
            DB.set(key(c.club), { name: c.club, season: c.saison, coach: c.entraineur, players: c.joueurs });
        });
        cache.clear();
        status = DB.size ? 'ok' : 'error';
        if (!DB.size) errMsg = 'Aucun club complet trouvé dans ' + SRC + '.';
    }
    // JSON tronqué (upload coupé…) : on garde tout ce qui est lisible
    function parseTolerant(text) {
        try { return { data: JSON.parse(text) }; } catch (e) { }
        const t = text.trimEnd(); let end = t.length;
        for (let n = 0; n < 80; n++) {
            end = t.lastIndexOf('}', end - 1); if (end < 0) break;
            const head = t.slice(0, end + 1);
            for (const tail of [']}]', ']}', ']']) { try { return { data: JSON.parse(head + tail), salvaged: true }; } catch (e) { } }
        }
        return null;
    }
    function load() {
        const fallback = () => {
            if (window.JOUEUR_DATA) { ingest(window.JOUEUR_DATA); return; }
            status = 'error';
            errMsg = 'Impossible de lire ' + SRC + ' (ouvre le jeu via un serveur local, ou charge joueur-data.js).';
        };
        if (typeof fetch !== 'function') { fallback(); refreshView(); return; }
        fetch(SRC, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(txt => { const p = parseTolerant(txt); if (!p) throw new Error('json'); salvaged = !!p.salvaged; ingest(p.data); })
            .catch(fallback).then(refreshView);
    }

    // ---------- Clubs du jeu ----------
    let clubIndex = null;
    function clubs() {
        if (clubIndex) return clubIndex;
        clubIndex = new Map();
        Object.keys(LEAGUES).forEach(k => LEAGUES[k].clubs.forEach(c => { if (!clubIndex.has(c.name)) clubIndex.set(c.name, { club: c, leagueKey: k, league: LEAGUES[k] }); }));
        return clubIndex;
    }
    const refDate = () => {
        try { if (hasG() && G.date) { const d = new Date(G.date); if (!isNaN(d)) return d; } } catch (e) { }
        return new Date('2026-07-01');
    };
    const ageOf = (born, ref) => {
        const b = new Date(born); if (isNaN(b)) return 25;
        let a = ref.getFullYear() - b.getFullYear();
        if (ref.getMonth() < b.getMonth() || (ref.getMonth() === b.getMonth() && ref.getDate() < b.getDate())) a--;
        return a;
    };

    // ---------- Construction des joueurs ----------
    function potFor(level, age, r) {
        const g = age <= 19 ? 10 + r() * 25 : age <= 22 ? 6 + r() * 19 : age <= 25 ? 2 + r() * 12 : age <= 28 ? r() * 5 : age <= 30 ? r() * 2 : 0;
        const pot = Math.min(99, Math.round(level + g));
        const w = age <= 19 ? 20 : age <= 22 ? 14 : age <= 25 ? 8 : age <= 28 ? 4 : age <= 30 ? 2 : 0;
        const lo = Math.max(level, pot - Math.round(r() * w));
        return { pot, potMin: lo, potMax: Math.min(99, Math.max(pot, lo + w)) };
    }
    const wageFor = level => Math.max(5, Math.min(45, Math.round(5 + (level - 40) / 59 * 40))) * 100000;
    const PROFILES = ['buteur', 'clutch', 'fragile', 'irregulier', 'leader', null, null, null];
    const baseRating = c => budgetToRating(c.budget);

    function makePlayer(clubName, baseRat, raw, idx, ref) {
        const r = rng(clubName + '|' + raw.nom + '|' + idx);
        const pos = POS_MAP[norm(raw.poste)] || 'MID';
        const level = Math.max(35, Math.min(97, Math.round(raw.note != null ? raw.note : baseRat - 8 + r() * 20)));
        const age = ageOf(raw.date_naissance, ref);
        const pt = raw.potentiel != null ? { pot: raw.potentiel, potMin: raw.potentiel, potMax: raw.potentiel } : potFor(level, age, r);
        return Object.assign({
            name: raw.nom, pos, level, wage: raw.salaire || wageFor(level), age, number: raw.numero, nat: raw.nationalite || '',
            born: raw.date_naissance, goals: 0, assists: 0, injuredGames: 0, profile: pick(r, PROFILES), happy: true
        }, pt);
    }
    function generateFor(clubName, info) {
        const r = rng('club|' + clubName), ref = refDate(), base = baseRating(info.club);
        const local = COUNTRY_NAT[info.league.country] || 'France';
        const shape = ['GK', 'GK', 'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT', 'ATT', 'ATT', 'ATT'];
        const nums = []; for (let i = 2; i <= 49; i++) if (i !== 13 && i !== 25) nums.push(i);
        for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
        const gkNums = [1, 13, 25]; let gk = 0, n = 0;
        const fn = typeof FIRST_NAMES !== 'undefined' ? FIRST_NAMES : ['Lucas'], ln = typeof LAST_NAMES !== 'undefined' ? LAST_NAMES : ['Martin'];
        return shape.map((pos, i) => {
            const age = 17 + Math.floor(Math.pow(r(), 1.25) * 20);
            const born = (ref.getFullYear() - age) + '-' + String(1 + Math.floor(r() * 12)).padStart(2, '0') + '-' + String(1 + Math.floor(r() * 28)).padStart(2, '0');
            return makePlayer(clubName, base, {
                nom: pick(r, fn) + ' ' + pick(r, ln), numero: pos === 'GK' ? gkNums[gk++] : nums[n++],
                poste: POS_LABEL[pos], nationalite: r() < 0.62 ? local : pick(r, FOREIGN), date_naissance: born
            }, i, ref);
        });
    }

    // ---------- Effectif d'un club (avec cache) ----------
    const cache = new Map();
    function squadOf(name) {
        const info = clubs().get(name), rec = DB.get(key(name));
        if (hasG() && G.clubName === name) {
            return { name, info, live: true, real: !!rec, coach: rec && rec.coach, players: G.squad.map(p => Object.assign({ nat: '', number: null }, p)) };
        }
        if (cache.has(name)) return cache.get(name);
        const ref = refDate();
        let res;
        if (rec) res = { name, info, real: true, season: rec.season, coach: rec.coach, players: rec.players.map((p, i) => makePlayer(name, info ? baseRating(info.club) : 70, p, i, ref)) };
        else if (info) res = { name, info, real: false, players: generateFor(name, info) };
        else res = { name, info, real: false, players: [] };
        cache.set(name, res);
        return res;
    }
    function realSquadFor(club) {
        const rec = DB.get(key(club.name));
        if (!rec) return null;
        const ref = refDate(), base = budgetToRating(club.budget);
        const arr = rec.players.map((p, i) => { const q = makePlayer(club.name, base, p, i, ref); delete q.born; return q; });
        // Un effectif réel compte 25-35 joueurs (contre 12 dans le jeu de base) : on répartit une masse salariale
        // comparable (~36 M€/mois) au prorata de la note, au lieu de ~100 M€/mois qui viderait le budget.
        const w = arr.map(q => Math.pow(q.level, 4)), sw = w.reduce((a, b) => a + b, 0), target = 36e6;
        arr.forEach((q, i) => { if (rec.players[i].salaire == null) q.wage = Math.max(100000, Math.round(target * w[i] / sw / 50000) * 50000); });
        return arr;
    }

    // ---------- Vue ----------
    const S = { league: null, club: null, sort: 'pos', dir: 1, q: '', pos: 'ALL', open: false };
    const root = () => document.getElementById('clubs-content');
    const lvlColor = l => l >= 85 ? '#3fb871' : l >= 75 ? '#8fd16b' : l >= 65 ? '#e8b94f' : l >= 55 ? '#e8924f' : '#d9534f';
    const potStr = p => p.potMin === p.potMax ? String(p.potMax) : p.potMin + '–' + p.potMax;
    const posPill = p => '<span class="cl-pos ' + p + '">' + ic(p) + p + '</span>';
    const initials = n => n.split(/[\s-]+/).filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
    const lvlCell = p => '<span class="cl-lvl" style="--c:' + lvlColor(p.level) + '"><b>' + p.level + '</b><i><u style="width:' + p.level + '%"></u></i></span>';

    function sortPlayers(list) {
        const k = S.sort, d = S.dir;
        const val = { pos: p => POS_ORDER[p.pos], num: p => p.number == null ? 999 : p.number, name: p => norm(p.name), nat: p => norm(p.nat), age: p => p.age, level: p => p.level, pot: p => p.potMax }[k] || (() => 0);
        return list.slice().sort((a, b) => {
            const x = val(a), y = val(b);
            if (x < y) return -d; if (x > y) return d;
            return b.level - a.level;
        });
    }
    const th = (k, label, cls) => '<th class="' + (cls || '') + (S.sort === k ? ' on' : '') + '" data-sort="' + k + '">' + label + (S.sort === k ? '<em>' + (S.dir > 0 ? '▲' : '▼') + '</em>' : '') + '</th>';

    function leaguePicker() {
        const lg = LEAGUES[S.league];
        const groups = {};
        Object.keys(LEAGUES).sort((a, b) => LEAGUES[a].tier - LEAGUES[b].tier).forEach(k => { (groups[LEAGUES[k].country] = groups[LEAGUES[k].country] || []).push(k); });
        const items = Object.keys(groups).sort((a, b) => (COUNTRY_NAME[a] || a).localeCompare(COUNTRY_NAME[b] || b, 'fr')).map(c =>
            '<div class="cl-lg-grp"><div class="cl-lg-c">' + flagCC(LEAGUE_ISO[c], 18) + (COUNTRY_NAME[c] || c) + '</div>' +
            groups[c].map(k => '<button class="cl-lg-i' + (k === S.league ? ' on' : '') + '" data-lg="' + k + '"><span>' + esc(LEAGUES[k].name) + '</span><small>' + LEAGUES[k].clubs.length + '</small></button>').join('') + '</div>').join('');
        return '<div class="cl-lg"><button class="cl-lg-btn" data-toggle="1" aria-haspopup="true" aria-expanded="' + S.open + '">' + leagueFlag(lg, 24) + '<span>' + esc(lg.name) + '</span>' + ic('chevron', 'chev') + '</button>' +
            '<div class="cl-lg-pop"' + (S.open ? '' : ' hidden') + '>' + items + '</div></div>';
    }
    function clubListHTML() {
        return LEAGUES[S.league].clubs.map(c => {
            const real = DB.has(key(c.name)), me = hasG() && G.clubName === c.name;
            return '<button class="cl-club' + (c.name === S.club ? ' on' : '') + (me ? ' me' : '') + '" data-club="' + esc(c.name) + '" data-league="' + S.league + '">' +
                crestOf(c.name, 22, c) + '<span>' + esc(c.name) + '</span>' + (me ? ic('star', 'cl-me') : '') + (real ? '<span class="cl-real" title="Effectif réel">' + ic('db') + '</span>' : '') + '</button>';
        }).join('');
    }
    function kpi(icon, val, label) { return '<div class="cl-kpi">' + ic(icon) + '<div><b>' + val + '</b><span>' + label + '</span></div></div>'; }

    function squadHTML() {
        const sq = squadOf(S.club);
        if (!sq.players.length) return '<div class="cl-empty">Aucun joueur pour ce club.</div>';
        const all = sq.players, avg = Math.round(all.reduce((s, p) => s + p.level, 0) / all.length);
        const age = (all.reduce((s, p) => s + p.age, 0) / all.length).toFixed(1);
        const best = all.reduce((b, p) => p.level > b.level ? p : b, all[0]);
        const color = DOT[sq.info && sq.info.club.emoji] || '#5aa9f0';
        const tags = (sq.live ? '<span class="cl-tag me">' + ic('star') + 'Mon effectif</span>' : '') +
            (sq.real ? '<span class="cl-tag real">' + ic('db') + 'Effectif réel</span>' : '<span class="cl-tag gen">' + ic('shuffle') + 'Effectif généré</span>');
        const chips = ['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(p => '<button class="cl-chip' + (S.pos === p ? ' on' : '') + '" data-pos="' + p + '">' + ic(p === 'ALL' ? 'all' : p) + (p === 'ALL' ? 'Tous' : POS_LABEL[p] + 's') + '<small>' + (p === 'ALL' ? all.length : all.filter(x => x.pos === p).length) + '</small></button>').join('');
        const shown = sortPlayers(S.pos === 'ALL' ? all : all.filter(p => p.pos === S.pos));
        const rows = shown.map(p => '<tr><td class="num"><span class="cl-av ' + p.pos + '">' + (p.number == null ? initials(p.name) : p.number) + '</span></td><td class="nm">' + esc(p.name) + '</td><td>' + posPill(p.pos) + '</td>' +
            '<td class="nat">' + natFlag(p.nat) + '<span>' + esc(p.nat) + '</span></td><td class="r">' + p.age + '</td><td class="r">' + lvlCell(p) + '</td><td class="r pot">' + (p.potMax > p.level + 2 ? ic('up', 'upi') : '') + potStr(p) + '</td></tr>').join('');
        return '<div class="cl-hero" style="--club:' + color + '"><div class="cl-hero-crest">' + crestOf(sq.name, 76, sq.info && sq.info.club) + '</div><div class="cl-hero-txt"><h3>' + esc(sq.name) + '</h3>' +
            '<div class="cl-sub">' + (sq.info ? leagueFlag(sq.info.league, 18) + '<span>' + esc(sq.info.league.name) + '</span>' : '') + (sq.season ? '<span class="dot">' + esc(sq.season) + '</span>' : '') +
            (sq.coach ? '<span class="dot cl-coach">' + ic('coach') + esc(sq.coach) + '</span>' : '') + '</div><div class="cl-tags">' + tags + '</div></div></div>' +
            '<div class="cl-kpis">' + kpi('users', all.length, 'joueurs') + kpi('gauge', avg, 'note moyenne') + kpi('cake', age, 'âge moyen') + kpi('star', esc(best.name.split(' ').slice(-1)[0]), 'meilleur · ' + best.level) + '</div>' +
            '<div class="cl-chips">' + chips + '</div>' +
            '<div class="cl-scroll"><table class="cl-table"><thead><tr>' + th('num', 'N°', 'num') + th('name', 'Joueur') + th('pos', 'Poste') + th('nat', 'Nationalité') + th('age', 'Âge', 'r') + th('level', 'Note', 'r') + th('pot', 'Potentiel', 'r') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    function searchHTML() {
        const q = norm(S.q), out = [];
        clubs().forEach((info, name) => { squadOf(name).players.forEach(p => { if (norm(p.name).includes(q)) out.push({ p, name, info }); }); });
        out.sort((a, b) => b.p.level - a.p.level);
        const rows = out.slice(0, 80).map(o => '<tr class="cl-hit" data-club="' + esc(o.name) + '" data-league="' + o.info.leagueKey + '"><td class="nm">' + esc(o.p.name) + '</td><td>' + posPill(o.p.pos) + '</td>' +
            '<td class="nat">' + crestOf(o.name, 18, o.info.club) + '<span>' + esc(o.name) + '</span></td><td class="nat">' + natFlag(o.p.nat) + '<span>' + esc(o.p.nat) + '</span></td><td class="r">' + o.p.age + '</td><td class="r">' + lvlCell(o.p) + '</td></tr>').join('');
        return '<div class="cl-counts">' + ic('search') + out.length + ' joueur(s) trouvé(s)' + (out.length > 80 ? ' — 80 premiers affichés' : '') + ' · clique pour ouvrir le club</div>' +
            (out.length ? '<div class="cl-scroll"><table class="cl-table"><thead><tr><th>Joueur</th><th>Poste</th><th>Club</th><th>Nationalité</th><th class="r">Âge</th><th class="r">Note</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="cl-empty">Aucun résultat.</div>');
    }
    function statusHTML() {
        if (status === 'loading') return '<div class="cl-note">' + ic('info') + '<span>Chargement de ' + SRC + '…</span></div>';
        const extra = (salvaged ? ' ' + SRC + ' est tronqué : lecture partielle.' : '') + (partial.length ? ' Incomplet, ignoré : ' + esc(partial.join(', ')) + '.' : '');
        if (status === 'error') return '<div class="cl-note warn">' + ic('warn') + '<span>' + esc(errMsg) + ' Les effectifs de tous les clubs sont générés en attendant.' + extra + '</span></div>';
        return '<div class="cl-note ' + (salvaged || partial.length ? 'warn' : 'ok') + '">' + ic(salvaged || partial.length ? 'warn' : 'check') + '<span><b>' + DB.size + '</b> club(s) avec effectif réel · les autres sont générés.' + extra + '</span></div>';
    }

    function render() {
        const el = root(); if (!el) return;
        if (!S.league || !LEAGUES[S.league]) S.league = hasG() && LEAGUES[G.leagueKey] ? G.leagueKey : 'pl';
        if (!S.club || !clubs().has(S.club) || clubs().get(S.club).leagueKey !== S.league)
            S.club = hasG() && clubs().has(G.clubName) && clubs().get(G.clubName).leagueKey === S.league ? G.clubName : LEAGUES[S.league].clubs[0].name;
        const typing = document.activeElement && document.activeElement.id === 'cl-q';
        el.innerHTML = '<div class="section-title">Clubs &amp; effectifs</div>' + statusHTML() +
            '<div class="cl-bar">' + leaguePicker() + '<label class="cl-search">' + ic('search') + '<input id="cl-q" type="search" placeholder="Chercher un joueur dans tous les clubs…" value="' + esc(S.q) + '" aria-label="Rechercher un joueur"></label></div>' +
            (S.q.trim().length >= 2 ? '<div class="cl-main">' + searchHTML() + '</div>' :
                '<div class="cl-layout"><nav class="cl-clubs">' + clubListHTML() + '</nav><div class="cl-main">' + squadHTML() + '</div></div>');
        if (typing) { const i = document.getElementById('cl-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }
    function refreshView() { const t = document.getElementById('tab-clubs'); if (t && t.classList.contains('active')) render(); }

    function bind() {
        const el = root(); if (!el || el.dataset.bound) return; el.dataset.bound = '1';
        el.addEventListener('click', e => {
            const lg = e.target.closest('[data-lg]');
            if (lg) { S.league = lg.dataset.lg; S.club = null; S.q = ''; S.open = false; render(); return; }
            if (e.target.closest('[data-toggle]')) { S.open = !S.open; render(); return; }
            const c = e.target.closest('[data-club]');
            if (c) { S.league = c.dataset.league; S.club = c.dataset.club; S.q = ''; S.pos = 'ALL'; S.open = false; render(); return; }
            const ps = e.target.closest('[data-pos]');
            if (ps) { S.pos = ps.dataset.pos; render(); return; }
            const h = e.target.closest('th[data-sort]');
            if (h) { const k = h.dataset.sort; if (S.sort === k) S.dir = -S.dir; else { S.sort = k; S.dir = (k === 'level' || k === 'pot') ? -1 : 1; } render(); }
        });
        let t; el.addEventListener('input', e => { if (e.target.id === 'cl-q') { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value; render(); }, 180); } });
        document.addEventListener('mousedown', e => { if (S.open && !e.target.closest('.cl-lg')) { S.open = false; refreshView(); } });
    }

    // ---------- Branchements sur script.js ----------
    function init() {
        bind();
        if (typeof _TAB_RENDER === 'object') _TAB_RENDER.clubs = () => { bind(); S.q = ''; S.pos = 'ALL'; S.open = false; if (hasG()) { S.league = G.leagueKey; S.club = G.clubName; } render(); };
        if (typeof startNewGame === 'function' && typeof generateSquad === 'function') {
            let pending = null;
            const origStart = startNewGame, origGen = generateSquad;
            window.generateSquad = generateSquad = function (budget) {
                const real = pending && realSquadFor(pending);
                return real && real.length >= MIN_SQUAD ? real : origGen.apply(this, arguments);
            };
            window.startNewGame = startNewGame = function () {
                try { pending = LEAGUES[document.getElementById('leagueSelect').value].clubs[parseInt(document.getElementById('clubSelect').value)] || null; } catch (e) { pending = null; }
                try { return origStart.apply(this, arguments); } finally { pending = null; }
            };
        }
        load();
    }
    window.ClubsDB = { squadOf, reload: load, has: n => DB.has(key(n)) };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
