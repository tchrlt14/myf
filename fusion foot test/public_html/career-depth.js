/*
 * Career Depth — optional, versioned career layer for Football Manager.
 *
 * This file is intentionally isolated from the match engine. It never changes
 * a lineup, tactic, match rating, score, or XI selection. Integration points:
 *   CareerDepth.migrate(G)       once after loading/creating a career
 *   CareerDepth.afterMatch(data)  after the existing match has been committed
 *   CareerDepth.seasonEnd(data)   before the old season counters are reset
 *   CareerDepth.newSeason(data)   after the new season/year has been installed
 *   CareerDepth.render(container) in a career/history panel
 *
 * `afterMatch` accepts {result:'W'|'D'|'L', opponent, goalsFor, goalsAgainst}.
 * The module can also infer most values from the existing global G.
 */
(function (root) {
    'use strict';

    const SCHEMA_VERSION = 1;
    const BOARD_MIN = 0;
    const BOARD_MAX = 100;
    const CAREER_KEY = 'careerDepth';
    const CLUB_UPGRADE_DEFAULTS = { academy: 0, scouting: 0, stadium: 0, medical: 0, coaching: 0 };

    function getGame() {
        // Top-level `let G` is a global lexical binding, not window.G. This
        // accessor supports the current classic-script build and standalone use.
        try { if (typeof G !== 'undefined' && G) return G; } catch (_) { /* no lexical G */ }
        return root.G || null;
    }

    function getLeagues() {
        try { if (typeof LEAGUES !== 'undefined') return LEAGUES; } catch (_) { /* no lexical data */ }
        return root.LEAGUES || {};
    }

    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
    const safeInt = (n, fallback) => Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
    const seasonYear = g => safeInt(g && g.seasonYear, 2025);
    const seasonKey = g => `${seasonYear(g)}:${g && g.leagueKey || 'unknown'}:${g && g.clubName || 'club'}`;
    const playerId = (p, index) => p && (p.careerId || p.id || `player-${index}`);
    const resultIs = (r, g) => {
        if (r === 'W' || r === 'D' || r === 'L') return r;
        if (g && g.lastResult && ['W', 'D', 'L'].includes(g.lastResult)) return g.lastResult;
        return null;
    };
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
    function copyJson(value, fallback) {
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
    }
    function clubProfileKey(leagueKey, clubName) {
        return JSON.stringify([String(leagueKey || '').trim(), String(clubName || '').trim().normalize('NFKC').toLowerCase()]);
    }
    function defaultClubProfile(clubName) {
        return {
            upgrades: Object.assign({}, CLUB_UPGRADE_DEFAULTS),
            staff: {},
            youthPlayers: [],
            stadiumName: `${clubName || 'Club'} Arena`,
            stadiumCapacity: 15000,
            ticketRevenue: 0,
            seasonTicketRevenue: 0,
            money: 0,
            reputation: 1,
            repPoints: 0,
            morale: 60
        };
    }
    function normalizeClubProfile(profile, clubName) {
        const defaults = defaultClubProfile(clubName);
        const source = isRecord(profile) ? profile : {};
        const upgrades = isRecord(source.upgrades) ? copyJson(source.upgrades, {}) : {};
        const staff = isRecord(source.staff) ? copyJson(source.staff, {}) : {};
        return {
            upgrades: Object.assign({}, CLUB_UPGRADE_DEFAULTS, upgrades),
            staff,
            youthPlayers: Array.isArray(source.youthPlayers) ? copyJson(source.youthPlayers, []) : [],
            stadiumName: typeof source.stadiumName === 'string' && source.stadiumName.trim() ? source.stadiumName.trim() : defaults.stadiumName,
            stadiumCapacity: Math.max(1, safeInt(source.stadiumCapacity, defaults.stadiumCapacity)),
            ticketRevenue: Math.max(0, safeInt(source.ticketRevenue, defaults.ticketRevenue)),
            seasonTicketRevenue: Math.max(0, safeInt(source.seasonTicketRevenue, defaults.seasonTicketRevenue)),
            money: Math.max(0, safeInt(source.money, defaults.money)),
            reputation: clamp(source.reputation, 1, 5) || defaults.reputation,
            repPoints: Math.max(0, safeInt(source.repPoints, defaults.repPoints)),
            morale: Number.isFinite(Number(source.morale)) ? clamp(source.morale, 0, 100) : defaults.morale
        };
    }
    function saveCurrentClubProfile(g, c) {
        if (!g || !c || !g.clubName || !g.leagueKey) return null;
        if (!isRecord(c.clubProfiles)) c.clubProfiles = {};
        const key = clubProfileKey(g.leagueKey, g.clubName);
        c.clubProfiles[key] = normalizeClubProfile({
            upgrades: g.upgrades,
            staff: g.staff,
            youthPlayers: g.youthPlayers,
            stadiumName: g.stadiumName,
            stadiumCapacity: g.stadiumCapacity,
            ticketRevenue: g.ticketRevenue,
            seasonTicketRevenue: g.seasonTicketRevenue,
            money: g.money,
            reputation: g.reputation,
            repPoints: g.repPoints,
            morale: g.morale
        }, g.clubName);
        return c.clubProfiles[key];
    }
    function restoreClubProfile(g, c, leagueKey, clubName) {
        if (!isRecord(c.clubProfiles)) c.clubProfiles = {};
        const key = clubProfileKey(leagueKey, clubName);
        const existed = Object.prototype.hasOwnProperty.call(c.clubProfiles, key);
        const profile = normalizeClubProfile(c.clubProfiles[key], clubName);
        c.clubProfiles[key] = profile;
        g.upgrades = copyJson(profile.upgrades, Object.assign({}, CLUB_UPGRADE_DEFAULTS));
        g.staff = copyJson(profile.staff, {});
        g.youthPlayers = copyJson(profile.youthPlayers, []);
        g.stadiumName = profile.stadiumName;
        g.stadiumCapacity = profile.stadiumCapacity;
        g.ticketRevenue = profile.ticketRevenue;
        g.seasonTicketRevenue = profile.seasonTicketRevenue;
        g.money = existed ? profile.money : g.money;
        g.reputation = profile.reputation;
        g.repPoints = profile.repPoints;
        g.morale = profile.morale;
        return existed;
    }
    const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));

    function makeState(g) {
        return {
            schemaVersion: SCHEMA_VERSION,
            careerStartYear: seasonYear(g),
            lastSeasonEndKey: null,
            lastNewSeasonKey: null,
            history: [],
            honours: [],
            records: { points: null, wins: null, goalsFor: null, longestWinStreak: 0, topScorer: null },
            playerTotals: {},
            manager: {
                id: `manager-${Date.now().toString(36)}`,
                name: 'Entraîneur',
                reputation: 1,
                reputationPoints: 0,
                boardTrust: 65,
                status: 'in-post',
                poorRun: 0,
                offers: [],
                objectiveHistory: []
            },
            rivalries: [],
            legends: [],
            infrastructure: { seasonsDeveloped: 0, academyGenerations: 0, lastAnnualReturn: 0 },
            feed: []
        };
    }

    function announce(g, title, text, kind) {
        const c = g[CAREER_KEY];
        c.feed.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, year: seasonYear(g), kind: kind || 'club', title, text });
        c.feed = c.feed.slice(0, 30);
    }

    function ensurePlayerIds(g) {
        const seen = new Map();
        (g.squad || []).forEach((p, index) => {
            if (!p || typeof p !== 'object') return;
            let id = p.careerId || p.id;
            if (!id) {
                const base = `${String(p.name || 'player').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${p.pos || 'na'}-${safeInt(p.age, 0)}`;
                const occurrence = (seen.get(base) || 0) + 1;
                seen.set(base, occurrence);
                id = `${base}-${occurrence}`;
            }
            p.careerId = String(id);
            const d = g[CAREER_KEY].playerTotals[p.careerId] || {};
            p.careerGoals = Math.max(safeInt(p.careerGoals, 0), safeInt(d.goals, 0));
            p.careerAssists = Math.max(safeInt(p.careerAssists, 0), safeInt(d.assists, 0));
            g[CAREER_KEY].playerTotals[p.careerId] = {
                name: p.name || d.name || 'Joueur',
                pos: p.pos || d.pos || '',
                goals: p.careerGoals,
                assists: p.careerAssists,
                seasonGoalsSeen: Math.max(0, safeInt(d.seasonGoalsSeen, 0)),
                seasonAssistsSeen: Math.max(0, safeInt(d.seasonAssistsSeen, 0)),
                seasonKey: d.seasonKey || seasonKey(g),
                seasons: Array.isArray(d.seasons) ? d.seasons : []
            };
        });
    }

    function migrate(game) {
        const g = game || getGame();
        if (!g || typeof g !== 'object') return null;
        const previous = g[CAREER_KEY] && typeof g[CAREER_KEY] === 'object' ? g[CAREER_KEY] : {};
        const base = makeState(g);
        const c = Object.assign(base, previous);
        c.schemaVersion = SCHEMA_VERSION;
        c.careerStartYear = safeInt(c.careerStartYear, seasonYear(g));
        c.history = Array.isArray(c.history) ? c.history : [];
        c.honours = Array.isArray(c.honours) ? c.honours : [];
        c.rivalries = Array.isArray(c.rivalries) ? c.rivalries : [];
        c.legends = Array.isArray(c.legends) ? c.legends : [];
        c.feed = Array.isArray(c.feed) ? c.feed : [];
        c.playerTotals = c.playerTotals && typeof c.playerTotals === 'object' ? c.playerTotals : {};
        c.records = Object.assign(base.records, c.records || {});
        c.infrastructure = Object.assign(base.infrastructure, c.infrastructure || {});
        c.manager = Object.assign(base.manager, c.manager || {});
        c.clubProfiles = isRecord(c.clubProfiles) ? c.clubProfiles : {};
        c.manager.reputation = clamp(c.manager.reputation, 1, 5);
        c.manager.reputationPoints = Math.max(0, safeInt(c.manager.reputationPoints, 0));
        c.manager.boardTrust = clamp(c.manager.boardTrust, BOARD_MIN, BOARD_MAX);
        c.manager.offers = Array.isArray(c.manager.offers) ? c.manager.offers : [];
        c.manager.objectiveHistory = Array.isArray(c.manager.objectiveHistory) ? c.manager.objectiveHistory : [];
        c.careerMoves = Array.isArray(c.careerMoves) ? c.careerMoves : [];
        // Preserve the earlier lightweight season archive when upgrading a save.
        if (!c.history.length && Array.isArray(g.seasonHistory)) {
            c.history = g.seasonHistory.map((h, i) => {
                const year = safeInt(h.year || h.seasonYear, c.careerStartYear + i);
                return {
                    key: `legacy:${year}:${i}`, seasonYear: year, seasonLabel: `${year}-${year + 1}`,
                    clubName: h.clubName || g.clubName || '', leagueKey: h.leagueKey || g.leagueKey || '',
                    leagueName: h.league || g.leagueName || '', rank: safeInt(h.rank, 0) || null,
                    points: safeInt(h.points, 0), wins: safeInt(h.wins, 0), draws: safeInt(h.draws, 0), losses: safeInt(h.losses, 0),
                    goalsFor: safeInt(h.gf, 0), goalsAgainst: safeInt(h.ga, 0), objective: null,
                    cup: null, topScorer: null, boardTrust: c.manager.boardTrust, managerStatus: c.manager.status,
                    outcome: h.outcome || ''
                };
            });
        }
        if (!c.records.points || !c.records.wins || !c.records.goalsFor) {
            c.history.forEach(h => {
                if (h.points != null) recordFor(c, 'points', safeInt(h.points, 0), h.clubName || g.clubName || '', safeInt(h.seasonYear, c.careerStartYear));
                if (h.wins != null) recordFor(c, 'wins', safeInt(h.wins, 0), h.clubName || g.clubName || '', safeInt(h.seasonYear, c.careerStartYear));
                if (h.goalsFor != null) recordFor(c, 'goalsFor', safeInt(h.goalsFor, 0), h.clubName || g.clubName || '', safeInt(h.seasonYear, c.careerStartYear));
            });
        }
        g[CAREER_KEY] = c;
        ensurePlayerIds(g);
        return c;
    }

    function rankOf(g) {
        if (typeof root.getRank === 'function') {
            try { return Number(root.getRank()) || 0; } catch (_) { /* fall through */ }
        }
        const rows = (g.standings || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0) || ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0)));
        return rows.findIndex(t => t.isMe || t.name === g.clubName) + 1;
    }

    function objectiveOnTrack(g) {
        const objective = g.objective;
        if (!objective) return null;
        const rank = rankOf(g);
        if (!rank) return null;
        const leagues = getLeagues();
        const lg = leagues[g.leagueKey] || {};
        const total = (g.standings || []).length || 20;
        switch (objective.target) {
        case 'top4': return rank <= 4;
        case 'top8': return rank <= 8;
        case 'top6': return rank <= 6;
        case 'maintain': return rank <= total - (lg.relegationSpots || 3);
        case 'promotion': return rank <= (lg.promotionSpots || 2);
        default: return null;
        }
    }

    function raiseManagerReputation(g, points) {
        const m = g[CAREER_KEY].manager;
        m.reputationPoints += Math.max(0, safeInt(points, 0));
        while (m.reputation < 5 && m.reputationPoints >= m.reputation * 100) m.reputation++;
    }

    function syncPlayerTotals(g, currentKey) {
        const c = g[CAREER_KEY];
        ensurePlayerIds(g);
        (g.squad || []).forEach(p => {
            const d = c.playerTotals[p.careerId];
            if (d.seasonKey !== currentKey) {
                d.seasonKey = currentKey;
                d.seasonGoalsSeen = 0;
                d.seasonAssistsSeen = 0;
            }
            const seasonGoals = Math.max(0, safeInt(p.goals, 0));
            const seasonAssists = Math.max(0, safeInt(p.assists, 0));
            const newGoals = Math.max(0, seasonGoals - d.seasonGoalsSeen);
            const newAssists = Math.max(0, seasonAssists - d.seasonAssistsSeen);
            d.goals += newGoals;
            d.assists += newAssists;
            d.seasonGoalsSeen = seasonGoals;
            d.seasonAssistsSeen = seasonAssists;
            d.name = p.name || d.name;
            d.pos = p.pos || d.pos;
            p.careerGoals = d.goals;
            p.careerAssists = d.assists;
        });
    }

    function offerJobs(g, cause) {
        const c = g[CAREER_KEY];
        const existing = c.manager.offers.filter(o => !o.accepted);
        if (existing.length) return existing;
        const all = getLeagues();
        const currentTier = Number((all[g.leagueKey] || {}).tier) || 2;
        const candidates = [];
        Object.keys(all).forEach(key => {
            const lg = all[key];
            const dynamic = g.leagueClubsByKey && g.leagueClubsByKey[key];
            const clubs = Array.isArray(dynamic) && dynamic.length ? dynamic : (Array.isArray(lg.clubs) ? lg.clubs : []);
            clubs.forEach(club => {
                if (club.name === g.clubName) return;
                const tier = Number(lg.tier) || currentTier;
                if (tier < currentTier - (c.manager.reputation >= 3 ? 1 : 0) || tier > currentTier + 1) return;
                const rating = typeof root.budgetToRating === 'function' ? root.budgetToRating(club.budget) : 60;
                const minimumRep = rating > 80 ? 4 : rating > 72 ? 3 : 1;
                if (c.manager.reputation >= minimumRep || cause === 'dismissal' && minimumRep <= c.manager.reputation + 1) {
                    candidates.push({ id: `${key}:${club.name}`, clubName: club.name, clubEmoji: club.emoji || '', leagueKey: key, leagueName: `${lg.name} ${lg.flag || ''}`, tier, budget: Number(club.budget) || 0, rating });
                }
            });
        });
        candidates.sort((a, b) => Math.abs(a.tier - currentTier) - Math.abs(b.tier - currentTier) || b.rating - a.rating);
        c.manager.offers = candidates.slice(0, 3).map((o, i) => Object.assign(o, { id: `${seasonYear(g)}-${i}-${o.id}`, cause, accepted: false }));
        return c.manager.offers;
    }

    function afterMatch(data) {
        const g = getGame();
        const c = migrate(g);
        const input = data && typeof data === 'object' ? data : {};
        const matchKey = `${seasonKey(g)}:${input.competition || 'league'}:${input.matchId || g.matchDay || 0}`;
        if (!c || c.lastMatchKey === matchKey) return c;
        const result = resultIs(input.result, g);
        const m = c.manager;
        const currentKey = seasonKey(g);
        syncPlayerTotals(g, currentKey);
        c.lastMatchKey = matchKey;

        // Cup games remain part of the player's career story, but the board's
        // league objective, poor-run counter, and reputation are league-only.
        if ((input.competition || 'league') === 'league' && m.status === 'in-post' && result) {
            const onTrack = objectiveOnTrack(g);
            let change = result === 'W' ? 2 : result === 'D' ? 0 : -2;
            if (onTrack === true) change += 1;
            else if (onTrack === false && (g.matchDay || 0) >= 5) change -= 1;
            m.boardTrust = clamp(m.boardTrust + change, BOARD_MIN, BOARD_MAX);
            if (result === 'L') m.poorRun++;
            else m.poorRun = 0;
            if (result === 'W') raiseManagerReputation(g, 2);
            if (m.boardTrust <= 5 && m.poorRun >= 5) {
                m.status = 'dismissed';
                m.boardTrust = 0;
                announce(g, 'Fin de contrat', 'La direction vous a remercié après une série de mauvais résultats. Vous pouvez consulter les offres et choisir votre prochaine étape.', 'board');
                offerJobs(g, 'dismissal');
            }
        }

        const opponent = input.opponent || g.nextOpponent;
        if (opponent && opponent.name && g.isDerby) {
            const id = `${g.leagueKey || ''}:${opponent.name}`;
            let rivalry = c.rivalries.find(x => x.id === id);
            if (!rivalry) {
                rivalry = { id, clubName: opponent.name, leagueKey: g.leagueKey || '', meetings: 0, playerWins: 0, opponentWins: 0, draws: 0, firstYear: seasonYear(g), lastYear: seasonYear(g), intensity: 1 };
                c.rivalries.push(rivalry);
            }
            rivalry.meetings++;
            rivalry.lastYear = seasonYear(g);
            if (result === 'W') rivalry.playerWins++;
            else if (result === 'L') rivalry.opponentWins++;
            else if (result === 'D') rivalry.draws++;
            rivalry.intensity = clamp(1 + Math.floor(rivalry.meetings / 3) + Math.floor(Math.abs(rivalry.playerWins - rivalry.opponentWins) / 4), 1, 5);
            if (rivalry.meetings === 3) announce(g, 'Rivalité installée', `${g.clubName} et ${rivalry.clubName} ont désormais une rivalité suivie.`, 'rivalry');
        }

        refreshLegends(g);
        return c;
    }

    function refreshLegends(g) {
        const c = g[CAREER_KEY];
        (g.squad || []).forEach(p => {
            const totals = c.playerTotals[p.careerId];
            if (!totals || totals.goals < 30) return;
            let legend = c.legends.find(x => x.playerId === p.careerId);
            if (!legend) {
                legend = { playerId: p.careerId, name: p.name, firstYear: seasonYear(g), lastYear: seasonYear(g), goals: totals.goals, assists: totals.assists, status: 'active', honours: [] };
                c.legends.push(legend);
                announce(g, 'Une légende prend forme', `${p.name} atteint ${totals.goals} buts en carrière avec le club.`, 'legend');
            }
            legend.name = p.name || legend.name;
            legend.goals = totals.goals;
            legend.assists = totals.assists;
            legend.lastYear = seasonYear(g);
        });
    }

    function recordFor(c, key, value, label, year) {
        const current = c.records[key];
        if (!current || value > current.value) c.records[key] = { value, label, year };
    }

    function seasonEnd(facts) {
        const g = getGame();
        const c = migrate(g);
        if (!c) return null;
        const key = seasonKey(g);
        if (c.lastSeasonEndKey === key) return c.history.find(x => x.key === key) || null;
        const input = facts && typeof facts === 'object' ? facts : {};
        syncPlayerTotals(g, key);
        refreshLegends(g);
        const rank = safeInt(input.rank, rankOf(g));
        const row = {
            key, seasonYear: seasonYear(g), seasonLabel: `${seasonYear(g)}-${seasonYear(g) + 1}`,
            clubName: g.clubName || '', leagueKey: g.leagueKey || '', leagueName: g.leagueName || '',
            rank: rank || null, points: safeInt(g.points, 0), wins: safeInt(g.wins, 0), draws: safeInt(g.draws, 0), losses: safeInt(g.losses, 0),
            goalsFor: safeInt(g.goalsFor, 0), goalsAgainst: safeInt(g.goalsAgainst, 0),
            objective: g.objective ? { text: g.objective.text || '', achieved: input.objectiveAchieved === undefined ? objectiveOnTrack(g) : !!input.objectiveAchieved } : null,
            cup: input.cupResult || c.pendingCup && c.pendingCup.result || null,
            topScorer: null,
            boardTrust: c.manager.boardTrust,
            managerStatus: c.manager.status,
            outcome: input.outcome || (rank === 1 ? 'Champion' : input.promoted ? 'Promotion' : input.relegated ? 'Relégation' : 'Saison terminée')
        };
        const top = (g.squad || []).slice().sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
        if (top && (top.goals || 0) > 0) row.topScorer = { playerId: top.careerId, name: top.name, goals: top.goals };
        c.history.push(row);
        if (row.points > 0) recordFor(c, 'points', row.points, row.clubName, row.seasonYear);
        recordFor(c, 'wins', row.wins, row.clubName, row.seasonYear);
        recordFor(c, 'goalsFor', row.goalsFor, row.clubName, row.seasonYear);
        if (row.topScorer && (!c.records.topScorer || row.topScorer.goals > c.records.topScorer.value)) {
            c.records.topScorer = { value: row.topScorer.goals, label: row.topScorer.name, year: row.seasonYear, playerId: row.topScorer.playerId };
        }
        (g.squad || []).forEach(p => {
            const d = c.playerTotals[p.careerId];
            d.seasons.push({ year: seasonYear(g), clubName: g.clubName || '', goals: safeInt(p.goals, 0), assists: safeInt(p.assists, 0) });
            d.seasons = d.seasons.slice(-30);
            p.careerGoals = d.goals;
            p.careerAssists = d.assists;
        });
        if (rank === 1) addHonour(c, 'league', `${g.leagueName || g.leagueKey} champion`, g);
        if (input.promoted) addHonour(c, 'promotion', `Promotion ${g.leagueName || g.leagueKey}`, g);
        if (input.cupResult === 'winner' || c.pendingCup && c.pendingCup.result === 'winner') addHonour(c, 'cup', input.cupName || c.pendingCup && c.pendingCup.name || 'Coupe nationale', g);

        const m = c.manager;
        if (row.objective) {
            const achieved = row.objective.achieved;
            m.objectiveHistory.push({ year: row.seasonYear, text: row.objective.text, achieved });
            m.objectiveHistory = m.objectiveHistory.slice(-30);
            m.boardTrust = clamp(m.boardTrust + (achieved ? 12 : -18), BOARD_MIN, BOARD_MAX);
            if (achieved) {
                raiseManagerReputation(g, 20);
                g.morale = clamp((g.morale || 50) + 8, 0, 100);
            } else {
                g.morale = clamp((g.morale || 50) - 8, 0, 100);
                const fine = Math.min(Math.max(0, safeInt(g.money, 0)), Math.max(150000, Math.round(Math.max(0, safeInt(g.money, 0)) * 0.04)));
                g.money = Math.max(0, safeInt(g.money, 0) - fine);
                announce(g, 'Objectif manqué', `La direction retire sa confiance après l’échec de l’objectif « ${row.objective.text} ».`, 'board');
            }
        }
        if (rank === 1) raiseManagerReputation(g, 35);
        else if (row.rank && row.rank <= 4) raiseManagerReputation(g, 12);
        if (m.status === 'in-post' && m.boardTrust <= 8) {
            m.status = 'dismissed';
            m.boardTrust = 0;
            announce(g, 'Fin de contrat', 'La confiance de la direction est épuisée. Vous êtes libre de choisir une nouvelle offre.', 'board');
            offerJobs(g, 'dismissal');
        } else if (m.status === 'in-post' && m.boardTrust <= 25) {
            announce(g, 'Avertissement de la direction', 'Votre poste est menacé. Un bon début de saison sera nécessaire pour rétablir la confiance.', 'board');
        }
        if (m.status === 'in-post' && rank && rank <= 4) offerJobs(g, 'season-performance');
        c.lastSeasonEndKey = key;
        c.pendingCup = null;
        return row;
    }

    function addHonour(c, type, title, g) {
        const id = `${type}:${seasonYear(g)}:${g.clubName || ''}:${title}`;
        if (!c.honours.some(h => h.id === id)) c.honours.push({ id, type, title, year: seasonYear(g), clubName: g.clubName || '' });
    }

    function addAcademyRegeneration(g) {
        const c = g[CAREER_KEY];
        const academyLevel = safeInt(g.upgrades && g.upgrades.academy, 0);
        const youth = Array.isArray(g.youthPlayers) ? g.youthPlayers : (g.youthPlayers = []);
        const maxSlots = 2 + academyLevel;
        const active = youth.filter(y => !y.graduated).length;
        if (active >= maxSlots) return null;
        const positions = ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'];
        const first = ['Léo', 'Nassim', 'Eliott', 'Noam', 'Yanis', 'Milan', 'Ilyes', 'Sacha', 'Adam', 'Tiago', 'Maël', 'Samir'];
        const last = ['Moreau', 'Diallo', 'Martin', 'Silva', 'Petit', 'Laurent', 'Rossi', 'Benali', 'Ndiaye', 'Garcia', 'Leroy', 'Kovac'];
        const currentLevel = random(46, 62) + Math.min(8, academyLevel * 2);
        const potential = Math.min(99, currentLevel + random(12, 28) + academyLevel * 2);
        const regen = {
            careerId: `regen-${seasonYear(g)}-${c.infrastructure.academyGenerations + 1}`,
            name: `${first[random(0, first.length - 1)]} ${last[random(0, last.length - 1)]}`,
            pos: positions[random(0, positions.length - 1)], age: random(16, 18),
            pot: potential, potential, currentLevel,
            potMin: Math.max(currentLevel, potential - 6), potMax: potential,
            progress: random(0, 18), graduated: false, generation: seasonYear(g), origin: 'regen'
        };
        youth.push(regen);
        c.infrastructure.academyGenerations++;
        announce(g, 'Nouvelle génération', `${regen.name}, ${regen.pos}, rejoint le centre de formation avec un potentiel de ${potential}.`, 'academy');
        return regen;
    }

    function newSeason(data) {
        const g = getGame();
        const c = migrate(g);
        if (!c) return null;
        const key = seasonKey(g);
        if (c.lastNewSeasonKey === key) return c;
        const input = data && typeof data === 'object' ? data : {};
        c.lastNewSeasonKey = key;
        c.manager.poorRun = 0;
        c.lastMatchKey = null;
        c.infrastructure.seasonsDeveloped++;
        c.manager.offers = c.manager.offers.filter(o => !o.accepted);

        // Annual facility development gives the already-purchased stadium a
        // recurring financial return and a developed academy a fresh prospect.
        const stadiumLevel = safeInt(g.upgrades && g.upgrades.stadium, 0);
        const annualReturn = Math.max(0, stadiumLevel) * 100000;
        if (annualReturn) {
            g.money = Math.max(0, safeInt(g.money, 0) + annualReturn);
            c.infrastructure.lastAnnualReturn = annualReturn;
            announce(g, 'Rendement du stade', `Les installations améliorées génèrent ${annualReturn.toLocaleString('fr-FR')} € de revenus annuels.`, 'infrastructure');
        } else c.infrastructure.lastAnnualReturn = 0;
        if (safeInt(g.upgrades && g.upgrades.academy, 0) > 0) addAcademyRegeneration(g);
        if (input.retiredPlayers && Array.isArray(input.retiredPlayers)) {
            input.retiredPlayers.forEach(p => archiveLegend(g, p));
        }
        refreshLegends(g);
        return c;
    }

    function archiveLegend(g, player) {
        const c = g[CAREER_KEY];
        if (!player) return;
        const id = player.careerId || player.id;
        if (!id) return;
        const totals = c.playerTotals[id] || {};
        const legend = c.legends.find(x => x.playerId === id);
        if (legend) legend.status = 'retired';
        c.playerTotals[id] = Object.assign({ name: player.name || 'Joueur', goals: 0, assists: 0, seasons: [] }, totals, { status: 'retired' });
    }

    function acceptOffer(offerId) {
        const g = getGame();
        const c = migrate(g);
        if (!c) return false;
        const offer = c.manager.offers.find(o => o.id === offerId && !o.accepted);
        if (!offer) return false;
        const lg = getLeagues()[offer.leagueKey];
        const currentClubs = g.leagueClubsByKey && g.leagueClubsByKey[offer.leagueKey];
        const club = lg && (Array.isArray(currentClubs) ? currentClubs : (lg.clubs || [])).find(x => x.name === offer.clubName);
        if (!club) return false;
        offer.accepted = true;
        const oldClub = g.clubName;
        let targetAi = null;
        if (root.AIWorld && g.aiWorld) {
            try { targetAi = root.AIWorld.getClub(g, getLeagues(), offer.clubName, offer.leagueKey); } catch (_) { /* fall back to a generated squad */ }
        }
        const targetSquad = targetAi && Array.isArray(targetAi.players) ? targetAi.players.filter(p => p.status !== 'loan').map(p => ({
            careerId: p.id, name: p.name, pos: p.pos, level: p.level,
            pot: Math.max(p.level, p.potential), potMin: p.level, potMax: Math.max(p.level, p.potential),
            age: p.age, wage: p.wage, goals: 0, assists: 0, injuredGames: 0, profile: null, happy: true
        })) : null;
        saveCurrentClubProfile(g, c);
        if (root.AIWorld && g.aiWorld) {
            try {
                root.AIWorld.adoptManagedClub(g, getLeagues(), g.leagueKey, oldClub, g.squad, g.money);
                if (targetAi) root.AIWorld.detachClub(g, offer.leagueKey, offer.clubName);
            } catch (_) { /* keep the career change available if an older save has partial AI data */ }
        }
        const targetProfileKey = clubProfileKey(offer.leagueKey, club.name);
        const hasTargetProfile = Object.prototype.hasOwnProperty.call(c.clubProfiles, targetProfileKey);
        const rawBudget = targetAi && targetAi.budget != null ? targetAi.budget : (club.budget != null ? club.budget : g.money || 10000000);
        const targetBudget = Math.max(250000, safeInt(rawBudget, 10000000));
        g.clubName = club.name;
        g.clubEmoji = club.emoji || '';
        g.leagueKey = offer.leagueKey;
        g.leagueName = `${lg.name} ${lg.flag || ''}`;
        g.money = targetBudget;
        if (targetSquad && targetSquad.length) {
            g.squad = targetSquad;
        } else if (typeof root.generateSquad === 'function') g.squad = root.generateSquad(targetBudget);
        if (typeof root.generateContracts === 'function') g.contracts = root.generateContracts();
        g.lineup = null;
        restoreClubProfile(g, c, offer.leagueKey, club.name);
        // A club visited before owns its stored balance. A first-time destination
        // starts with the target club's current AI budget, set above.
        if (!hasTargetProfile) g.money = targetBudget;
        g.market = typeof root.generateMarket === 'function' ? root.generateMarket(g.upgrades && g.upgrades.scouting || 0) : g.market;
        if (typeof root.generateStandings === 'function') g.standings = root.generateStandings(g.clubName, g.leagueKey);
        if (typeof root.getSeasonLength === 'function') g.seasonLength = root.getSeasonLength(g.leagueKey);
        g.objective = null;
        g.nextOpponent = null;
        g.matchDay = 0;
        g.points = g.wins = g.draws = g.losses = g.goalsFor = g.goalsAgainst = 0;
        g.results = [];
        g._calendar = null;
        g.fixtures = null;
        c.manager.status = 'in-post';
        c.manager.boardTrust = 60;
        c.manager.poorRun = 0;
        c.manager.offers = [];
        c.rivalries = [];
        c.careerMoves.push({ year: seasonYear(g), from: oldClub, to: g.clubName, leagueKey: g.leagueKey });
        announce(g, 'Nouveau défi', `Vous prenez la tête de ${g.clubName}. Votre historique d’entraîneur est conservé.`, 'manager');
        if (typeof root.onCareerJobAccepted === 'function') {
            try { root.onCareerJobAccepted({ clubName: g.clubName, leagueKey: g.leagueKey }); } catch (_) { /* the accepted job remains valid if UI refresh fails */ }
        }
        return true;
    }

    function dismissOffer(offerId) {
        const c = migrate(getGame());
        if (!c) return false;
        const offer = c.manager.offers.find(o => o.id === offerId);
        if (!offer) return false;
        offer.declined = true;
        return true;
    }

    function render(container) {
        const g = getGame();
        const c = migrate(g);
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el || !c) return '';
        const m = c.manager;
        const history = c.history.slice(-6).reverse();
        const cards = history.length ? history.map(h => `<li><strong>${escapeHtml(h.seasonLabel)}</strong> · ${escapeHtml(h.clubName)} · ${escapeHtml(h.rank || '—')}e · ${escapeHtml(h.points)} pts · ${escapeHtml(h.outcome || '')}</li>`).join('') : '<li>Aucune saison archivée.</li>';
        const honours = c.honours.slice(-8).reverse().map(h => `<li>${escapeHtml(h.year)} · ${escapeHtml(h.title)} (${escapeHtml(h.clubName)})</li>`).join('') || '<li>Aucun trophée enregistré.</li>';
        const records = Object.keys(c.records).filter(k => c.records[k]).map(k => {
            const labels = {points: 'Points en une saison', wins: 'Victoires en une saison', goalsFor: 'Buts en une saison', topScorer: 'Meilleur buteur'};
            const r = c.records[k]; return `<li>${escapeHtml(labels[k] || k)} : <strong>${escapeHtml(r.value)}</strong> — ${escapeHtml(r.label)} (${escapeHtml(r.year)})</li>`;
        }).join('') || '<li>Les records seront établis en fin de saison.</li>';
        const rivalries = c.rivalries.slice().sort((a, b) => b.intensity - a.intensity).map(r => `<li>${'🔥'.repeat(r.intensity)} ${escapeHtml(r.clubName)} · ${r.playerWins}-${r.draws}-${r.opponentWins}</li>`).join('') || '<li>Les derbies répétés créeront des rivalités.</li>';
        const legends = c.legends.slice().sort((a, b) => b.goals - a.goals).map(p => `<li>${escapeHtml(p.name)} · ${escapeHtml(p.goals)} buts / ${escapeHtml(p.assists)} passes · ${escapeHtml(p.status)}</li>`).join('') || '<li>Un joueur devient une légende à partir de 30 buts en carrière.</li>';
        const offers = m.offers.filter(o => !o.declined && !o.accepted).map(o => `<li><span>${escapeHtml(o.clubName)} — ${escapeHtml(o.leagueName)}</span> <button type="button" data-cd-accept="${escapeHtml(o.id)}">Accepter l’offre</button> <button type="button" data-cd-decline="${escapeHtml(o.id)}">Refuser</button></li>`).join('');
        const isDismissed = m.status === 'dismissed';
        el.innerHTML = `<section class="career-depth" aria-labelledby="career-depth-title">
          <h2 id="career-depth-title">Carrière longue</h2>
          <p><strong>Entraîneur :</strong> ${escapeHtml(m.name)} · Réputation ${'⭐'.repeat(m.reputation)} · Confiance de la direction ${m.boardTrust}/100 · ${isDismissed ? 'Sans club' : 'En poste'}</p>
          <div role="progressbar" aria-label="Confiance de la direction" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.boardTrust}" style="height:8px;background:#243044;border-radius:5px"><span style="display:block;width:${m.boardTrust}%;height:100%;background:${m.boardTrust < 25 ? '#e45b65' : '#51c78a'};border-radius:5px"></span></div>
          <h3>Offres de poste</h3><ul>${offers || (isDismissed ? '<li>Pas encore d’offre. La carrière reste sauvegardée.</li>' : '<li>Aucune offre en attente.</li>')}</ul>
          <h3>Palmarès</h3><ul>${honours}</ul>
          <h3>Records du club</h3><ul>${records}</ul>
          <h3>Historique des saisons</h3><ol>${cards}</ol>
          <h3>Rivalités</h3><ul>${rivalries}</ul>
          <h3>Joueurs cultes</h3><ul>${legends}</ul>
          <h3>Académie et infrastructures</h3><p>Générations suivies : ${c.infrastructure.academyGenerations} · Rendement annuel du stade : ${Number(c.infrastructure.lastAnnualReturn || 0).toLocaleString('fr-FR')} €</p>
          <div aria-live="polite" class="career-depth-feed">${c.feed.slice(0, 3).map(x => `<p><strong>${escapeHtml(x.title)}</strong> — ${escapeHtml(x.text)}</p>`).join('')}</div>
        </section>`;
        if (el.dataset.careerDepthBound !== '1') {
            el.addEventListener('click', event => {
                const accept = event.target.closest('[data-cd-accept]');
                const decline = event.target.closest('[data-cd-decline]');
                if (accept && acceptOffer(accept.dataset.cdAccept)) render(el);
                if (decline && dismissOffer(decline.dataset.cdDecline)) render(el);
            });
            el.dataset.careerDepthBound = '1';
        }
        return el.innerHTML;
    }

    root.CareerDepth = Object.freeze({
        version: SCHEMA_VERSION,
        migrate,
        afterMatch,
        seasonEnd,
        newSeason,
        render,
        acceptOffer,
        dismissOffer,
        getState: () => migrate(getGame()),
        setManagerName(name) { const c = migrate(getGame()); if (!c) return false; c.manager.name = String(name || 'Entraîneur').slice(0, 60); return true; },
        registerRetirement(player) { const g = getGame(); const c = migrate(g); if (!c) return false; archiveLegend(g, player); return true; },
        recordCupResult(result, name) { const g = getGame(); const c = migrate(g); if (!c) return false; c.pendingCup = { result, name: name || 'Coupe nationale', year: seasonYear(g) }; if (result === 'winner') addHonour(c, 'cup', name || 'Coupe nationale', g); return true; }
    });
})(typeof window !== 'undefined' ? window : globalThis);
