/* Promotion playoff simulator. Results are seeded from the season and the
 * qualified teams so a saved season does not reroll its promotion outcome. */
(function (root) {
    'use strict';

    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
    function createRandom(seed) {
        let value = 2166136261;
        for (const character of String(seed || 'playoffs')) {
            value ^= character.charCodeAt(0);
            value = Math.imul(value, 16777619);
        }
        return () => {
            value += 0x6D2B79F5;
            let t = value;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function poisson(lambda, random) {
        const limit = Math.exp(-clamp(lambda, 0.05, 4));
        let product = 1, goals = 0;
        do { goals++; product *= random(); } while (product > limit && goals < 8);
        return goals - 1;
    }
    function shootoutWinner(home, away, random) {
        const quality = clamp((Number(home.rating) - Number(away.rating)) / 100, -0.12, 0.12);
        return random() < 0.5 + quality ? home : away;
    }
    function scoreLeg(home, away, random, neutral) {
        const gap = clamp((Number(home.rating) - Number(away.rating)) / 55, -0.38, 0.38);
        const homeAdvantage = neutral ? 0 : 0.11;
        const homeXg = clamp(1.28 * (1 + gap + homeAdvantage), 0.25, 2.8);
        const awayXg = clamp(1.18 * (1 - gap - homeAdvantage * 0.5), 0.25, 2.8);
        return { home: home.name, away: away.name, homeGoals: poisson(homeXg, random), awayGoals: poisson(awayXg, random) };
    }
    function resolveTie(first, second, random, twoLegged, neutral) {
        let legs;
        if (twoLegged) {
            // The better seed plays the second leg at home.
            const firstHome = first.seed <= second.seed ? second : first;
            const firstAway = firstHome === first ? second : first;
            const leg1 = scoreLeg(firstAway, firstHome, random, false);
            const leg2 = scoreLeg(firstHome, firstAway, random, false);
            legs = [leg1, leg2];
        } else {
            legs = [scoreLeg(first, second, random, neutral)];
        }
        const totals = new Map([[first, 0], [second, 0]]);
        legs.forEach(leg => {
            const home = leg.home === first.name ? first : second;
            const away = home === first ? second : first;
            totals.set(home, totals.get(home) + leg.homeGoals);
            totals.set(away, totals.get(away) + leg.awayGoals);
        });
        const firstGoals = totals.get(first), secondGoals = totals.get(second);
        const winner = firstGoals === secondGoals ? shootoutWinner(first, second, random) : firstGoals > secondGoals ? first : second;
        return { first: first.name, second: second.name, winner: winner.name, firstGoals, secondGoals, penalties: firstGoals === secondGoals, legs };
    }
    function simulate(teams, options) {
        const input = Array.isArray(teams) ? teams : [];
        const qualified = input.map((team, index) => ({
            name: String(team && team.name || `Club ${index + 1}`),
            seed: Math.max(1, Math.trunc(Number(team && team.seed) || index + 1)),
            rating: clamp(team && team.rating, 25, 99),
            emoji: String(team && team.emoji || '⚽')
        })).sort((a, b) => a.seed - b.seed);
        if (qualified.length < 2) return {promoted: false, champion: null, rounds: []};
        const opts = options || {};
        const random = createRandom(opts.seed || `${qualified.map(t => `${t.name}:${t.seed}:${t.rating}`).join('|')}`);
        let roundTeams = qualified.slice();
        const rounds = [];
        let roundIndex = 0;
        while (roundTeams.length > 1) {
            const isFinal = roundTeams.length === 2;
            const current = roundTeams.slice().sort((a, b) => a.seed - b.seed);
            const byeCount = current.length % 2;
            const winners = byeCount ? [current.shift()] : [];
            const matches = [];
            while (current.length > 1) {
                const highSeed = current.shift();
                const lowSeed = current.pop();
                const tie = resolveTie(highSeed, lowSeed, random, !isFinal, isFinal);
                const winner = current.find(t => t.name === tie.winner) || (tie.winner === highSeed.name ? highSeed : lowSeed);
                winners.push(winner);
                matches.push(tie);
            }
            // The odd entrant in a future round receives a bye based on the
            // original seed, which preserves the reward for a higher finish.
            const roundName = isFinal ? 'Finale' : roundIndex === 0 ? 'Demi-finales' : `Tour ${roundIndex + 1}`;
            rounds.push({name: roundName, matches});
            roundTeams = winners.sort((a, b) => a.seed - b.seed);
            roundIndex++;
        }
        const champion = roundTeams[0];
        return {
            promoted: !!(opts.playerClubName && champion && champion.name === opts.playerClubName),
            champion: champion ? champion.name : null,
            rounds
        };
    }

    const API = Object.freeze({simulate});
    root.PromotionPlayoffs = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
