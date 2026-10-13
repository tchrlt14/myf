/*
 * AI World — persistent simulation for non-player clubs.
 *
 * This file deliberately does not read the DOM, mutate the user's squad, or
 * replace the match engine. Call the methods below with the save object (G)
 * and the static LEAGUES definitions. All state is plain JSON data.
 */
(function (root) {
    'use strict';

    const VERSION = 1;
    const FIRST = ['Lucas','Antoine','Hugo','Théo','Axel','Mathis','Noah','Enzo','Luca','Pierre','Kylian','Marcus','Soren','Rayan','Yanis','Baptiste','Maxime','Julien','Florian','Dylan','Karim','Raheem','Moussa','Youssef','Houssem','Romain','Corentin','Kevin','Adrien'];
    const LAST = ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Morel','Simon','Laurent','Garcia','Fernandez','Rodriguez','Michel','David','Bertrand','Moreau','Lefebvre','Roux','Diallo','Konaté','Ndombélé','Aouar','Tchouaméni','Guendouzi','Camavinga','Fofana','Nkunku'];
    const POS = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','MID','ATT','ATT','ATT'];
    const TACTICS = ['4-3-3','4-4-2','3-5-2','4-2-3-1'];
    const STYLES = ['equilibre','offensif','defensif'];

    function hash(s) {
        let h = 2166136261;
        for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    function rng(seed) {
        let x = (typeof seed === 'number' ? seed : hash(seed)) || 1;
        return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
    }
    function int(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
    function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
    function slug(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function clubKey(leagueKey, name) { return String(leagueKey) + '|' + String(name); }
    function clubId(leagueKey, name) { return 'club:' + slug(leagueKey) + ':' + slug(name) + ':' + hash(leagueKey+'|'+name).toString(36); }
    function playerId(id, serial) { return 'p' + hash(id).toString(36) + '-' + serial.toString(36); }
    function valueOf(p) { return Math.max(25000, Math.round(p.level * p.level * 2800 * (p.age <= 24 ? 1.15 : p.age >= 32 ? .65 : 1))); }
    function compactName(name) {
        const parts=String(name||'').split(' '), first=FIRST.indexOf(parts.shift()), last=LAST.indexOf(parts.join(' '));
        return first >= 0 && last >= 0 ? '~' + (first * LAST.length + last) : String(name||'');
    }
    function expandName(code) {
        if (typeof code !== 'string' || code[0] !== '~') return code;
        const index=Number(code.slice(1));
        return FIRST[Math.floor(index/LAST.length)] + ' ' + LAST[index%LAST.length];
    }
    function playerJson(p) {
        return [p.id,compactName(p.name),p.pos,p.level,p.potential,p.age,p.wage,p.contractEndSeason,
            p.status || '',p.loanOwner || '',p.loanEndSeason || 0];
    }
    function attachPlayerCodec(p) {
        if (!p || typeof p !== 'object') return p;
        if (Array.isArray(p) && p.id === undefined) {
            const raw=p.slice();
            p.id=raw[0]; p.name=expandName(raw[1]); p.pos=raw[2]; p.level=raw[3]; p.potential=raw[4];
            p.age=raw[5]; p.wage=raw[6]; p.contractEndSeason=raw[7];
            if (raw[8]) p.status=raw[8]; if (raw[9]) p.loanOwner=raw[9]; if (raw[10]) p.loanEndSeason=raw[10];
            p.length=0;
        }
        if (p.id === undefined && p.i !== undefined) {
            p.id=p.i; p.name=p.n; p.pos=p.r; p.level=p.l; p.potential=p.t;
            p.age=p.a; p.wage=p.w; p.contractEndSeason=p.e;
            if (p.s !== undefined) p.status=p.s;
            if (p.o !== undefined) p.loanOwner=p.o;
            if (p.u !== undefined) p.loanEndSeason=p.u;
            ['i','n','r','l','t','a','w','e','s','o','u'].forEach(k=>delete p[k]);
        }
        delete p.value; delete p.appearances; delete p.goals; delete p.assists;
        if (!Object.prototype.hasOwnProperty.call(p,'toJSON'))
            Object.defineProperty(p,'toJSON',{value:function(){return playerJson(this);},enumerable:false,configurable:true});
        return p;
    }
    function seal(w) {
        Object.values(w.clubs).forEach(c=>{
            (c.players||[]).forEach(attachPlayerCodec);
            (c.loans||[]).forEach(loan=>attachPlayerCodec(loan.playerSnapshot));
        });
        w.freeAgents.forEach(attachPlayerCodec);
        return w;
    }
    function ratingForBudget(b) {
        if (!b || b <= 0) return 60;
        return Math.round(45 + (clamp(Math.log10(Math.max(b, 1e5)), 5, 8.78) - 5) / 3.78 * 50);
    }
    function playerName(r) { return FIRST[int(r, 0, FIRST.length - 1)] + ' ' + LAST[int(r, 0, LAST.length - 1)]; }
    function allLeagueClubEntries(leagueDefs, dynamic) {
        const out = [];
        Object.keys(leagueDefs || {}).forEach(key => {
            const clubs = dynamic && Array.isArray(dynamic[key]) && dynamic[key].length ? dynamic[key] : (leagueDefs[key].clubs || []);
            clubs.forEach(c => out.push({leagueKey: key, club: c}));
        });
        return out;
    }
    function ensureShape(state) {
        if (!state.aiWorld || typeof state.aiWorld !== 'object') state.aiWorld = {};
        const w = state.aiWorld;
        if (w.version !== VERSION) w.version = VERSION;
        if (!w.clubs || typeof w.clubs !== 'object') w.clubs = {};
        if (!w.byName || typeof w.byName !== 'object') w.byName = {};
        if (!w.processed || typeof w.processed !== 'object') w.processed = {months: {}, windows: {}, matchdays: {}, seasons: {}};
        ['months','windows','matchdays','seasons'].forEach(k => { if (!w.processed[k] || typeof w.processed[k] !== 'object') w.processed[k] = {}; });
        if (!Array.isArray(w.freeAgents)) w.freeAgents = [];
        if (!Array.isArray(w.transferLog)) w.transferLog = [];
        if (!w.matchdayProgress || typeof w.matchdayProgress !== 'object') w.matchdayProgress = {};
        if (!w.seasonYear) w.seasonYear = Number(state.seasonYear) || 2025;
        return w;
    }
    function idsFor(w, leagueKey, name) {
        const value = w.byName[clubKey(leagueKey, name)];
        if (Array.isArray(value)) return value;
        return value ? [value] : [];
    }
    function registerClub(w, leagueKey, name, id) {
        const key = clubKey(leagueKey, name), ids = idsFor(w, leagueKey, name);
        if (!ids.includes(id)) ids.push(id);
        w.byName[key] = ids;
    }
    function unregisterClub(w, leagueKey, name, id) {
        const key = clubKey(leagueKey, name), ids = idsFor(w, leagueKey, name).filter(x=>x!==id);
        if (ids.length) w.byName[key] = ids; else delete w.byName[key];
    }
    function findClubId(w, leagueKey, name, preferredId) {
        if (preferredId && w.clubs[preferredId] && w.clubs[preferredId].leagueKey === leagueKey) return preferredId;
        const id = idsFor(w, leagueKey, name).find(x=>w.clubs[x] && w.clubs[x].leagueKey===leagueKey);
        if (id) return id;
        const c = Object.values(w.clubs).find(x=>x.name===name && x.leagueKey===leagueKey);
        return c ? c.id : null;
    }

    function makePlayer(club, index, level, age, random, season) {
        const pos = POS[index % POS.length];
        const max = Math.min(99, level + (age < 22 ? int(random, 8, 25) : age < 26 ? int(random, 1, 12) : 0));
        return {
            id: playerId(club.id, index), name: playerName(random), pos,
            level: clamp(level + int(random, -7, 7), 38, 96), potential: max,
            age, wage: 0, contractEndSeason: season + int(random, 1, 3),
            status: undefined
        };
    }
    function createClub(entry, season, forcedId) {
        const name = entry.club.name;
        const id = forcedId || clubId(entry.leagueKey, name);
        const budget = Math.max(250000, Number(entry.club.budget) || 10000000);
        const r = rng(id + ':initial');
        const target = ratingForBudget(budget);
        const club = {
            id, name, emoji: entry.club.emoji || '⚽', leagueKey: entry.leagueKey,
            budget, annualRevenue: Math.round(budget * 0.33), annualWageCap: Math.round(budget * 0.34),
            players: [], manager: {name: playerName(r), tactic: TACTICS[int(r, 0, TACTICS.length - 1)], style: STYLES[int(r, 0, STYLES.length - 1)], confidence: 60},
            form: [], season: {played: 0, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0},
            records: {seasons: 0, promotions: 0, relegations: 0}, loans: [], nextPlayerSerial: 11,
            transferActivity: 0, history: []
        };
        for (let i = 0; i < 11; i++) {
            const age = int(r, 17, 34);
            const p = makePlayer(club, i, target, age, r, season);
            p.wage = Math.max(1000, Math.round((club.annualWageCap / 22 / 12) * (0.52 + p.level / 300)));
            club.players.push(p);
        }
        return club;
    }
    function clubBudgetMirror(state, club) {
        const lists = state.leagueClubsByKey || {};
        (lists[club.leagueKey] || []).forEach(c => {
            if (c && (c.aiId === club.id || (!c.aiId && c.name === club.name))) {
                c.aiId = club.id; c.budget = club.budget; c.emoji = club.emoji;
            }
        });
    }
    function migrate(state, leagueDefs) {
        if (!state || !leagueDefs) throw new Error('AIWorld.ensure requires save state and LEAGUES.');
        const w = ensureShape(state);
        if (!state.leagueClubsByKey || typeof state.leagueClubsByKey !== 'object') state.leagueClubsByKey = {};
        Object.keys(leagueDefs).forEach(key => {
            if (!Array.isArray(state.leagueClubsByKey[key]) || !state.leagueClubsByKey[key].length)
                state.leagueClubsByKey[key] = (leagueDefs[key].clubs || []).map(club => ({...club}));
        });
        const season = Number(state.seasonYear) || w.seasonYear || 2025;
        const entries = allLeagueClubEntries(leagueDefs, state.leagueClubsByKey);
        const seen = new Set();
        entries.forEach(entry => {
            const name = entry.club && entry.club.name;
            if (!name || (name === state.clubName && entry.leagueKey === state.leagueKey && !entry.club.aiId)) return;
            const key = clubKey(entry.leagueKey,name);
            const tagged = entry.club.aiId && w.clubs[entry.club.aiId];
            let id = tagged && tagged.name === name && tagged.leagueKey === entry.leagueKey
                ? entry.club.aiId : findClubId(w,entry.leagueKey,name);
            // Migrate the prior name-only map when its club still belongs to this division.
            if (!id && w.byName[name] && w.clubs[w.byName[name]] && w.clubs[w.byName[name]].leagueKey === entry.leagueKey)
                id = w.byName[name];
            if (!id) id = clubId(entry.leagueKey,name);
            if (!w.clubs[id]) w.clubs[id] = createClub({leagueKey: entry.leagueKey, club: entry.club}, season, id);
            const c = w.clubs[id];
            c.name = name; c.id = id; c.emoji = entry.club.emoji || c.emoji || '⚽';
            c.leagueKey = entry.leagueKey;
            entry.club.aiId = id;
            if (!Number.isFinite(c.budget) || c.budget <= 0) c.budget = Math.max(250000, Number(entry.club.budget) || 1e7);
            c.annualRevenue = Math.max(Number(c.annualRevenue) || 0, Math.round(c.budget * 0.08));
            c.annualWageCap = Math.max(Number(c.annualWageCap) || 0, Math.round(c.budget * 0.2));
            c.players = Array.isArray(c.players) ? c.players : [];
            c.players.forEach((p, i) => {
                attachPlayerCodec(p);
                if (!p.id) p.id = playerId(id, i);
                p.level = clamp(Number(p.level) || 50, 30, 99);
                p.age = clamp(Number(p.age) || 25, 16, 45);
                p.potential = clamp(Number(p.potential) || p.level, p.level, 99);
                p.wage = Math.max(0, Number(p.wage) || 0);
                p.contractEndSeason = Number(p.contractEndSeason) || season + 1;
            });
            if (!c.manager) c.manager = {name: 'Entraîneur ' + name.split(' ').slice(-1)[0], tactic: '4-3-3', style: 'equilibre', confidence: 60};
            if (!Array.isArray(c.form)) c.form = [];
            if (!c.season) c.season = {played: 0, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0};
            if (!c.records) c.records = {seasons: 0, promotions: 0, relegations: 0};
            if (!Array.isArray(c.history)) c.history = [];
            if (!Array.isArray(c.loans)) c.loans = [];
            if (!Number.isFinite(c.nextPlayerSerial)) c.nextPlayerSerial = c.players.length;
            registerClub(w,entry.leagueKey,name,id); seen.add(id);
            clubBudgetMirror(state, c);
        });
        w.seasonYear = season;
        return seal(w);
    }
    function ensure(state, leagueDefs) { return migrate(state, leagueDefs); }
    function getClub(state, leagueDefs, name, leagueKey) {
        const w = ensure(state, leagueDefs);
        const clubName = typeof name === 'object' && name ? name.name : name;
        const id = findClubId(w,leagueKey || state.leagueKey,clubName,typeof name === 'object' && name ? name.aiId : null);
        return id ? w.clubs[id] : null;
    }
    function detachClub(state, leagueKey, name) {
        const w = ensureShape(state);
        const id = findClubId(w, leagueKey, name);
        if (id) {
            unregisterClub(w, leagueKey, name, id);
            delete w.clubs[id];
        }
        const rows = state.leagueClubsByKey && state.leagueClubsByKey[leagueKey];
        const row = Array.isArray(rows) && rows.find(c => c.name === name);
        if (row) delete row.aiId;
        return id || null;
    }
    function adoptManagedClub(state, leagueDefs, leagueKey, name, players, budget) {
        const w = ensure(state, leagueDefs);
        const rows = state.leagueClubsByKey && state.leagueClubsByKey[leagueKey];
        const row = Array.isArray(rows) && rows.find(c => c.name === name);
        if (!row) return null;
        const id = clubId(leagueKey, name);
        const club = createClub({leagueKey, club: row}, Number(state.seasonYear) || w.seasonYear || 2025, id);
        club.players = (players || []).map((p, i) => ({
            id: p.careerId || p.id || playerId(id, i), name: p.name, pos: p.pos,
            level: clamp(Number(p.level) || 50, 30, 99), potential: clamp(Number(p.pot || p.potential) || p.level || 50, Number(p.level) || 50, 99),
            age: clamp(Number(p.age) || 25, 16, 45), wage: Math.max(0, Number(p.wage) || 0),
            contractEndSeason: Number(p.contractEndSeason) || (Number(state.seasonYear) || 2025) + 1
        }));
        club.budget = Math.max(250000, Number(budget) || Number(row.budget) || 10000000);
        w.clubs[id] = club;
        registerClub(w, leagueKey, name, id);
        row.aiId = id; row.budget = club.budget;
        return club;
    }
    function moveClubLeague(state, oldLeagueKey, newLeagueKey, name, id) {
        const w = ensureShape(state);
        const clubIdValue = id && w.clubs[id] ? id : findClubId(w, oldLeagueKey, name);
        if (!clubIdValue || !w.clubs[clubIdValue]) return false;
        const c = w.clubs[clubIdValue];
        unregisterClub(w, oldLeagueKey, name, clubIdValue);
        c.leagueKey = newLeagueKey;
        registerClub(w, newLeagueKey, name, clubIdValue);
        const oldRows = state.leagueClubsByKey && state.leagueClubsByKey[oldLeagueKey];
        const newRows = state.leagueClubsByKey && state.leagueClubsByKey[newLeagueKey];
        const oldRow = Array.isArray(oldRows) && oldRows.find(x=>x.name===name);
        const newRow = Array.isArray(newRows) && newRows.find(x=>x.name===name);
        if (oldRow) delete oldRow.aiId;
        if (newRow) { newRow.aiId=clubIdValue; newRow.budget=c.budget; }
        return true;
    }
    function averageLevel(c) {
        if (!c || !c.players || !c.players.length) return ratingForBudget(c && c.budget);
        const starters = c.players.slice().sort((a,b) => b.level - a.level).slice(0, 11);
        return Math.round(starters.reduce((s,p) => s + p.level, 0) / Math.max(1, starters.length));
    }
    function teamStrength(state, leagueDefs, name, leagueKey) {
        const c = getClub(state, leagueDefs, name, leagueKey);
        return c ? averageLevel(c) : 60;
    }
    function posCount(c, pos) { return c.players.filter(p => p.pos === pos).length; }
    function payroll(c) { return c.players.reduce((s,p) => s + (p.wage || 0), 0); }
    function buildFixtures(clubs) {
        const list = clubs.map((_,i)=>i), n=list.length;
        const padded = n % 2 ? list.concat([-1]) : list.slice(), count=padded.length, rounds=count-1;
        const rotating=padded.slice(1), first=[];
        for (let round=0; round<rounds; round++) {
            const current=[padded[0],...rotating];
            for (let i=0;i<count/2;i++) {
                const h=current[i], a=current[count-1-i];
                if (h>=0 && a>=0) first.push({matchDay:round+1,homeClub:clubs[h],awayClub:clubs[a]});
            }
            rotating.push(rotating.shift());
        }
        const second=first.map(f=>({matchDay:f.matchDay+rounds,homeClub:f.awayClub,awayClub:f.homeClub}));
        return first.concat(second);
    }
    function mark(w, bucket, key) { if (w.processed[bucket][key]) return false; w.processed[bucket][key] = 1; return true; }
    function pushLog(w, item) { w.transferLog.unshift(item); if (w.transferLog.length > 120) w.transferLog.length = 120; }

    function onMonth(state, leagueDefs, date) {
        const w = ensure(state, leagueDefs), key = String(date).slice(0, 7);
        if (!key || !mark(w, 'months', key)) return {processed: false};
        Object.values(w.clubs).forEach(c => {
            const wageBill = payroll(c);
            const income = Math.round((c.annualRevenue || c.budget * 0.1) / 12);
            c.budget = Math.max(0, c.budget + income - wageBill);
            c.transferActivity = 0;
            clubBudgetMirror(state, c);
        });
        seal(w);
        return {processed: true, month: key};
    }

    function endContracts(c, season, w) {
        const kept = [];
        c.players.forEach(p => {
            if (p.status === 'loan' || p.status === 'loaned-out') { kept.push(p); return; }
            if (p.contractEndSeason > season) { kept.push(p); return; }
            if (kept.length < 16 || payroll(c) < (c.annualWageCap || c.budget * .34) / 12) {
                p.contractEndSeason = season + 1;
                // Renewal is affordable only if it fits the wage budget.
                if (payroll(c) + p.wage <= (c.annualWageCap || c.budget * .34) / 12) kept.push(p);
                else w.freeAgents.push({...p, status: 'free'});
            } else w.freeAgents.push({...p, status: 'free'});
        });
        c.players = kept;
    }
    function createRegen(c, season, random) {
        const serial = c.nextPlayerSerial++;
        const target = Math.max(42, averageLevel(c) - 7);
        const p = makePlayer(c, serial, target, int(random, 16, 18), random, season);
        p.id = playerId(c.id, serial); p.contractEndSeason = season + int(random, 2, 4);
        p.wage = Math.max(1000, Math.round((c.annualWageCap / 22 / 12) * 0.45));
        c.players.push(p);
    }
    function onTransferWindow(state, leagueDefs, date) {
        const w = ensure(state, leagueDefs), d = String(date), monthDay = d.slice(5);
        if (!['07-01','01-01'].includes(monthDay)) return {processed: false, reason: 'closed'};
        if (!mark(w, 'windows', d)) return {processed: false, reason: 'already-processed'};
        const season = Number(state.seasonYear) || w.seasonYear;
        const r = rng('window:' + d);
        const clubs = Object.values(w.clubs).sort((a,b) => a.id.localeCompare(b.id));
        if (monthDay === '07-01') {
            // Return completed loans to their owning clubs before the next market.
            clubs.forEach(borrower => {
                (borrower.loans || []).forEach(loan => {
                    const owner = w.clubs[loan.ownerId];
                    const borrowed = borrower.players.find(p => p.id === loan.playerId && p.status === 'loan');
                    if (borrowed) borrower.players = borrower.players.filter(p => p.id !== loan.playerId);
                    const returning = borrowed || loan.playerSnapshot;
                    if (owner && returning && !owner.players.some(p => p.id === loan.playerId))
                        owner.players.push({...returning, status:'squad', loanOwner:undefined, loanEndSeason:undefined});
                });
                borrower.loans = [];
            });
        }
        clubs.forEach(c => {
            endContracts(c, season, w);
            const cap = Math.round((c.annualWageCap || c.budget * .34) / 12);
            const currentPayroll = payroll(c);
            const positionTargets = {GK:2,DEF:5,MID:4,ATT:3};
            const needs = ['GK','DEF','MID','ATT'].filter(pos => posCount(c, pos) < positionTargets[pos]);
            const available = w.freeAgents.concat(clubs.filter(other => other.id !== c.id).flatMap(other => other.players.map(p => ({player:p, seller:other}))));
            const want = needs.length ? 1 : (c.players.length < 14 ? 1 : 0);
            const candidates = want ? available.map(item => item.player ? item : {player:item, seller:null})
                .filter(item => item.player && (!needs.length || needs.includes(item.player.pos)))
                .filter(item => item.player.status !== 'loan' && item.player.status !== 'loaned-out')
                .filter(item => item.seller ? item.seller.players.length > 11 : true)
                .filter(item => item.player.contractEndSeason > season || !item.seller)
                .sort((a,b) => (b.player.level - a.player.level) || a.player.age - b.player.age) : [];
            if (want && !candidates.length && c.players.length < 14) {
                createRegen(c, season, r);
            } else if (candidates.length) {
                const item = candidates[0], p = item.player, price = item.seller ? valueOf(p) : 0;
                const affordableWage = currentPayroll + (p.wage || 0) <= cap;
                if (affordableWage && (price === 0 || c.budget - price >= c.budget * 0.12)) {
                    if (item.seller) {
                        item.seller.players = item.seller.players.filter(x => x.id !== p.id);
                        item.seller.budget += price; clubBudgetMirror(state, item.seller);
                    } else w.freeAgents = w.freeAgents.filter(x => x.id !== p.id);
                    const newP = {...p, contractEndSeason: season + 3, status: 'squad'};
                    c.players.push(newP); c.budget = Math.max(0, c.budget - price); c.transferActivity++;
                    pushLog(w, {date:d, type:item.seller ? 'transfer' : 'free-agent', player:p.name, from:item.seller ? item.seller.name : 'Sans club', to:c.name, fee:price});
                    clubBudgetMirror(state, c);
                } else if (item.seller && p.age <= 22 && item.seller.players.length > 11 && c.players.length < 24 && affordableWage) {
                    // A loan is free in this first pass, preserves ownership, and has a one-season term.
                    item.seller.players = item.seller.players.filter(x => x.id !== p.id);
                    p.status = 'loaned-out'; p.loanEndSeason = season + 1;
                    c.players.push({...p, status:'loan', loanOwner:item.seller.id});
                    c.loans.push({playerId:p.id, ownerId:item.seller.id, endSeason:season+1, playerSnapshot:{...p,status:'squad'}});
                    c.transferActivity++;
                    pushLog(w, {date:d, type:'loan', player:p.name, from:item.seller.name, to:c.name, fee:0});
                }
            }
            // Clubs actively sell surplus veterans or players in an overfilled role.
            const surplus = c.players.filter(p => p.status !== 'loan' && p.status !== 'loaned-out' && posCount(c,p.pos) > (positionTargets[p.pos] || 4))
                .sort((a,b) => (b.age-a.age) || (a.level-b.level));
                const sale = surplus.find(p => p.age >= 29 || c.budget < c.annualWageCap * .12);
            if (sale && c.players.length > 11) {
                const buyer = clubs.filter(other => other.id !== c.id && posCount(other,sale.pos) < (positionTargets[sale.pos] || 4)
                    && other.budget > valueOf(sale)
                    && payroll(other) + sale.wage <= Math.round((other.annualWageCap || other.budget*.34)/12))
                    .sort((a,b)=>b.budget-a.budget)[0];
                if (buyer) {
                    const fee = Math.max(50000,Math.round(valueOf(sale) * (sale.age >= 32 ? .55 : .82)));
                    c.players = c.players.filter(p=>p.id!==sale.id); c.budget += fee;
                    buyer.players.push({...sale,contractEndSeason:season+2}); buyer.budget -= fee;
                    pushLog(w,{date:d,type:'sale',player:sale.name,from:c.name,to:buyer.name,fee});
                    clubBudgetMirror(state,c); clubBudgetMirror(state,buyer);
                }
            }
            while (c.players.length > 25) {
                const sellable = c.players.filter(x => x.age > 29 || posCount(c,x.pos) > (positionTargets[x.pos] || 4)).sort((a,b) => a.level - b.level)[0];
                if (!sellable) break;
                c.players = c.players.filter(x => x.id !== sellable.id);
                const fee = Math.round(valueOf(sellable) * .8); c.budget += fee;
                w.freeAgents.push({...sellable,status:'free',contractEndSeason:season});
                pushLog(w,{date:d,type:'sale',player:sellable.name,from:c.name,to:'Sans club',fee});
            }
            // A low-budget club can lose several expiring contracts and fail
            // every market bid. Keep enough registered players to field an XI.
            while (c.players.length < 11) createRegen(c, season, r);
        });
        seal(w);
        return {processed:true, date:d, transfers:w.transferLog.filter(x => x.date === d)};
    }

    function simulateMatchday(state, leagueDefs, leagueKey, matchDay, fixtures) {
        const w = ensure(state, leagueDefs), season = Number(state.seasonYear) || w.seasonYear;
        const key = season + ':' + leagueKey + ':' + matchDay;
        if (!mark(w,'matchdays',key)) return {processed:false, results:[]};
        const r = rng('match:' + key), result = [];
        const leagueClubs = state.leagueClubsByKey && state.leagueClubsByKey[leagueKey]
            ? state.leagueClubsByKey[leagueKey] : (leagueDefs[leagueKey].clubs || []);
        const schedule = Array.isArray(fixtures) && fixtures.length ? fixtures : buildFixtures(leagueClubs);
        schedule.filter(f => f.matchDay === matchDay).forEach(f => {
            const h = f.homeClub || f.home, a = f.awayClub || f.away;
            const hn = typeof h === 'string' ? h : h && h.name, an = typeof a === 'string' ? a : a && a.name;
            if (!hn || !an) return;
            const homeId = hn === state.clubName && !(h && h.aiId) ? null : findClubId(w,leagueKey,hn,h && h.aiId);
            const awayId = an === state.clubName && !(a && a.aiId) ? null : findClubId(w,leagueKey,an,a && a.aiId);
            const home = w.clubs[homeId], away = w.clubs[awayId];
            if (!home || !away) return;
            const hs = averageLevel(home), as = averageLevel(away);
            const gap = clamp((hs - as + 3) / 55, -0.38, 0.38);
            const tacticFactor = c => {
                const style = c.manager.style === 'offensif' ? 1.1 : c.manager.style === 'defensif' ? .91 : 1;
                const shape = c.manager.tactic === '3-5-2' ? 1.04 : c.manager.tactic === '4-3-3' ? 1.025 : c.manager.tactic === '4-2-3-1' ? 1.015 : 1;
                return style * shape;
            };
            const homeX = clamp(1.35 * (1 + gap) * tacticFactor(home), .25, 2.8), awayX = clamp(1.2 * (1 - gap) * tacticFactor(away), .25, 2.8);
            // Small deterministic Poisson sampler without global Math.random.
            const poisson = lambda => { const limit = Math.exp(-lambda); let k=0, product=1; do { k++; product *= r(); } while (product > limit && k < 8); return k-1; };
            let hg = poisson(homeX), ag = poisson(awayX);
            const formHome = home.form.slice(-5).filter(x => x === 'W').length - home.form.slice(-5).filter(x => x === 'L').length;
            const formAway = away.form.slice(-5).filter(x => x === 'W').length - away.form.slice(-5).filter(x => x === 'L').length;
            if (r() < clamp(.035 * (formHome - formAway), -.14, .14)) { if (formHome > formAway && hg <= ag) hg++; else if (formAway > formHome && ag <= hg) ag++; }
            function record(c, gf, ga) {
                c.season.played++; c.season.gf += gf; c.season.ga += ga;
                const outcome = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
                if (outcome === 'W') { c.season.wins++; c.season.points += 3; c.manager.confidence = clamp(c.manager.confidence + 2,0,100); }
                else if (outcome === 'L') { c.season.losses++; c.manager.confidence = clamp(c.manager.confidence - 3,0,100); }
                else { c.season.draws++; c.season.points++; c.manager.confidence = clamp(c.manager.confidence - 0.5,0,100); }
                c.form.push(outcome); if (c.form.length > 10) c.form.shift();
                const losingStreak = c.form.slice(-3).length === 3 && c.form.slice(-3).every(x=>x==='L');
                if (losingStreak && c.manager.confidence < 38 && r() < .35) {
                    c.manager.name = playerName(r); c.manager.confidence = 52;
                    c.manager.tactic = TACTICS[int(r,0,TACTICS.length-1)];
                    c.manager.style = STYLES[int(r,0,STYLES.length-1)];
                } else if (c.form.slice(-4).filter(x=>x==='W').length >= 3 && r() < .16) {
                    c.manager.tactic = TACTICS[int(r,0,TACTICS.length-1)];
                    c.manager.style = STYLES[int(r,0,STYLES.length-1)];
                }
            }
            record(home,hg,ag); record(away,ag,hg);
            result.push({home:hn,away:an,homeGoals:hg,awayGoals:ag});
        });
        seal(w);
        return {processed:true,results:result};
    }

    function seasonMatchdays(state, leagueDefs, leagueKey) {
        const clubs = state.leagueClubsByKey && state.leagueClubsByKey[leagueKey]
            ? state.leagueClubsByKey[leagueKey] : (leagueDefs[leagueKey] && leagueDefs[leagueKey].clubs) || [];
        const count = clubs.length;
        if (count < 2) return 0;
        return count % 2 ? count * 2 : (count - 1) * 2;
    }

    function synchronizedMatchday(playerMatchday, playerSeasonLength, otherSeasonLength) {
        const day = Math.max(0, Math.trunc(Number(playerMatchday) || 0));
        const ownLength = Math.max(0, Math.trunc(Number(playerSeasonLength) || 0));
        const otherLength = Math.max(0, Math.trunc(Number(otherSeasonLength) || 0));
        if (!ownLength || !otherLength || !day) return 0;
        if (day >= ownLength) return otherLength;
        return Math.min(otherLength, Math.floor(day * otherLength / ownLength));
    }

    function advanceWorld(state, leagueDefs, playerLeagueKey, playerMatchday, playerSeasonLength, leagueLengths) {
        const w = ensure(state, leagueDefs);
        const year = Number(state.seasonYear) || w.seasonYear || 2025;
        if (Number(w.progressSeasonYear) !== year) {
            const legacy = Number(w.progressSeasonYear) ? {} : (state.worldStandings || {});
            w.matchdayProgress = {};
            Object.keys(leagueDefs).forEach(key => {
                if (key === playerLeagueKey) return;
                const oldCursor = legacy[key] && Number(legacy[key].matchDay);
                if (Number.isFinite(oldCursor) && oldCursor > 0) w.matchdayProgress[key] = oldCursor;
            });
            w.progressSeasonYear = year;
        }
        const advanced = {};
        Object.keys(leagueDefs).forEach(key => {
            if (key === playerLeagueKey) return;
            const length = Math.max(0, Math.trunc(Number(leagueLengths && leagueLengths[key]) || seasonMatchdays(state, leagueDefs, key)));
            const target = synchronizedMatchday(playerMatchday, playerSeasonLength, length);
            let cursor = Math.min(length, Math.max(0, Math.trunc(Number(w.matchdayProgress[key]) || 0)));
            while (cursor < target) {
                const nextDay = cursor + 1;
                simulateMatchday(state, leagueDefs, key, nextDay, null);
                cursor = nextDay;
            }
            w.matchdayProgress[key] = cursor;
            advanced[key] = {matchDay: cursor, seasonLength: length};
        });
        seal(w);
        return {seasonYear: year, leagues: advanced};
    }

    function finishSeason(state, leagueDefs, tableByLeague, nextSeason) {
        const w = ensure(state, leagueDefs), season = Number(state.seasonYear) || w.seasonYear;
        const key = String(season);
        if (!mark(w,'seasons',key)) return {processed:false};
        // Snapshot all leagues before resetting NPC season counters below.
        const tables = {};
        Object.keys(leagueDefs).forEach(key => {
            const supplied = tableByLeague && tableByLeague[key];
            tables[key] = Array.isArray(supplied) && supplied.length
                ? supplied.map(row=>({...row,aiId:row.aiId || (key === state.leagueKey && row.name === state.clubName ? undefined : findClubId(w,key,row.name))}))
                : Object.values(w.clubs).filter(c=>c.leagueKey===key)
                    .sort((a,b)=>b.season.points-a.season.points || (b.season.gf-b.season.ga)-(a.season.gf-a.season.ga))
                    .map(c=>({name:c.name,aiId:c.id,points:c.season.points,gf:c.season.gf,ga:c.season.ga}));
        });
        Object.values(w.clubs).forEach(c => {
            const table = tables[c.leagueKey] || [];
            const row = table.find(x => x.aiId === c.id) || table.find(x => x.name === c.name);
            const rank = row ? table.indexOf(row) + 1 : null;
            c.records.seasons++;
            c.records.last = {season, leagueKey:c.leagueKey, rank, points:row ? row.points : c.season.points};
            c.history.push({season,leagueKey:c.leagueKey,rank,points:row ? row.points : c.season.points,
                wins:c.season.wins,draws:c.season.draws,losses:c.season.losses,
                strength:averageLevel(c),manager:c.manager.name,tactic:c.manager.tactic,style:c.manager.style});
            if (c.history.length > 25) c.history.shift();
            const seed = rng(c.id + ':season:' + season);
            // Deterministic season development, age curve, retirement and regeneration.
            const retained = [];
            c.players.forEach(p => {
                p.age++;
                if (p.age <= 23 && p.level < p.potential) p.level = Math.min(p.potential,p.level + int(seed,1,3));
                else if (p.age >= 30) p.level = Math.max(35,p.level - (p.age >= 34 ? int(seed,1,3) : int(seed,0,2)));
                const retireChance = p.age >= 39 ? .85 : p.age >= 37 ? .45 : p.age >= 35 ? .14 : 0;
                if (seed() < retireChance) { pushLog(w,{date:String(season)+'-05-31',type:'retirement',player:p.name,from:c.name,to:'Retraite',fee:0}); return; }
                if (p.contractEndSeason <= season) {
                    if (p.age > 31 || payroll(c) > (c.annualWageCap || c.budget*.34)/12) { w.freeAgents.push({...p,status:'free'}); return; }
                    p.contractEndSeason = season + 1;
                }
                retained.push(p);
            });
            c.players = retained;
            while (c.players.length < 14) createRegen(c, Number(nextSeason)||season+1, seed);
            c.budget = Math.max(0,c.budget + Math.round((c.annualRevenue || c.budget*.1) * (rank && rank <= 3 ? .18 : rank && rank >= table.length-3 ? -.08 : .04)));
            c.annualRevenue = Math.max(200000,Math.round(c.budget*.33));
            c.annualWageCap = Math.round(c.budget*.34);
            c.season = {played:0,points:0,wins:0,draws:0,losses:0,gf:0,ga:0};
            c.form = [];
            clubBudgetMirror(state,c);
        });

        // Exchange the ranked NPCs in paired batches. This avoids undoing a
        // promotion when several spots are configured and division names repeat.
        const originalDivision = Object.fromEntries(Object.values(w.clubs).map(c=>[c.id,c.leagueKey]));
        const pairKeys = new Set();
        Object.keys(leagueDefs).forEach(fromKey => {
            const def = leagueDefs[fromKey], toKey = def.promotesTo;
            if (!toKey || !leagueDefs[toKey]) return;
            const pairKey = fromKey + '>' + toKey;
            pairKeys.add(pairKey); pairKeys.add(toKey + '>' + fromKey);
            const upCount = Math.max(0,Number(def.promotionSpots)||1);
            const downCount = Math.max(0,Number(leagueDefs[toKey].relegationSpots)||1);
            const up = (tables[fromKey]||[]).filter(row=>row.aiId && originalDivision[row.aiId]===fromKey).slice(0,upCount);
            const down = (tables[toKey]||[]).filter(row=>row.aiId && originalDivision[row.aiId]===toKey).slice(-downCount).reverse();
            const exchanges = Math.min(up.length,down.length);
            for (let i=0;i<exchanges;i++)
                moveNpc(state,w,leagueDefs,fromKey,toKey,up[i].name,'promotion',up[i].aiId,down[i].aiId);
        });
        // Handle one-way relegation definitions that have no reciprocal promotion edge.
        Object.keys(leagueDefs).forEach(fromKey => {
            const def = leagueDefs[fromKey], toKey = def.relegatesTo;
            if (!toKey || !leagueDefs[toKey] || pairKeys.has(fromKey+'>'+toKey)) return;
            const count=Math.max(0,Number(def.relegationSpots)||1);
            const down=(tables[fromKey]||[]).filter(row=>row.aiId && originalDivision[row.aiId]===fromKey).slice(-count);
            down.forEach(row=>moveNpc(state,w,leagueDefs,fromKey,toKey,row.name,'relegation',row.aiId));
        });
        w.freeAgents = w.freeAgents.filter(p => (p.age || 0) < 36).slice(-500);
        w.seasonYear = Number(nextSeason) || season+1;
        w.progressSeasonYear = w.seasonYear;
        w.matchdayProgress = {};
        seal(w);
        return {processed:true, season, nextSeason:w.seasonYear};
    }
    function moveNpc(state,w,leagueDefs,fromKey,toKey,name,kind,preferredId,replacementId) {
        const c = w.clubs[findClubId(w,fromKey,name,preferredId)]; if (!c || c.leagueKey !== fromKey) return;
        const source = state.leagueClubsByKey && state.leagueClubsByKey[fromKey];
        const dest = state.leagueClubsByKey && state.leagueClubsByKey[toKey];
        if (!source || !dest) return;
        const candidates = (dest || []).filter(x=>x.aiId && x.aiId!==c.id && w.clubs[x.aiId] && w.clubs[x.aiId].leagueKey===toKey);
        if (!candidates.length) return;
        const replacement = (replacementId && candidates.find(x=>x.aiId===replacementId))
            || (kind === 'promotion' ? candidates[candidates.length-1] : candidates[0]);
        const displacedName = replacement.name, other = w.clubs[replacement.aiId];
        const si = source.findIndex(x=>x.aiId===c.id), di = dest.findIndex(x=>x.aiId===replacement.aiId);
        if (si<0 || di<0) return;
        const promoted = source[si], displaced = dest[di];
        source[si] = {...displaced}; dest[di] = {...promoted};
        unregisterClub(w,fromKey,c.name,c.id); registerClub(w,toKey,c.name,c.id);
        c.leagueKey = toKey;
        if (other) { unregisterClub(w,toKey,other.name,other.id); registerClub(w,fromKey,other.name,other.id); other.leagueKey = fromKey; }
        if (kind === 'promotion') { c.records.promotions++; if (other) other.records.relegations++; }
        else { c.records.relegations++; if (other) other.records.promotions++; }
        clubBudgetMirror(state,c); if (other) clubBudgetMirror(state,other);
    }

    const API = {version:VERSION, ensure, getClub, detachClub, adoptManagedClub, moveClubLeague, teamStrength, onMonth, onTransferWindow, simulateMatchday, seasonMatchdays, synchronizedMatchday, advanceWorld, finishSeason};
    root.AIWorld = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
