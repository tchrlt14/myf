const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const sourcePath = path.join(__dirname, '..', 'career-depth.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function makeGame() {
    const leagues = {
        alpha: { name: 'Alpha', flag: 'A', tier: 2, clubs: [
            { name: 'Club A', emoji: '🅰️', budget: 12000000 },
            { name: 'Club B', emoji: '🅱️', budget: 8000000 }
        ] },
        beta: { name: 'Beta', flag: 'B', tier: 2, clubs: [
            { name: 'Club A', emoji: '🆎', budget: 5000000 }
        ] }
    };
    const game = {
        seasonYear: 2025,
        clubName: 'Club A',
        clubEmoji: '🅰️',
        leagueKey: 'alpha',
        leagueName: 'Alpha A',
        money: 11750000,
        squad: [{ careerId: 'a-player', name: 'A Player', pos: 'MID', age: 24, level: 70, goals: 4, assists: 2 }],
        contracts: [],
        upgrades: { academy: 3, scouting: 2, stadium: 4, medical: 1, coaching: 2 },
        staff: { physio: true, coach: true },
        youthPlayers: [{ careerId: 'youth-a', name: 'Youth A', progress: 65, graduated: false }],
        stadiumName: 'A Arena+',
        stadiumCapacity: 28400,
        ticketRevenue: 1760000,
        seasonTicketRevenue: 920000,
        reputation: 4,
        repPoints: 317,
        morale: 73,
        leagueClubsByKey: Object.fromEntries(Object.entries(leagues).map(([key, league]) => [key, league.clubs.map(club => ({ ...club }))])),
        careerDepth: {
            history: [{ seasonYear: 2024, clubName: 'Club A', rank: 3, points: 71 }],
            honours: [{ year: 2024, title: 'Alpha champion', clubName: 'Club A' }],
            manager: { name: 'Manager', reputation: 4, reputationPoints: 317, offers: [] }
        }
    };
    const sandbox = {
        G: game,
        LEAGUES: leagues,
        generateSquad: budget => [{ careerId: `generated-${budget}`, name: 'Generated', pos: 'ATT', age: 25, level: 60, goals: 0, assists: 0 }],
        generateContracts: () => [],
        generateMarket: () => [],
        generateStandings: () => [],
        getSeasonLength: () => 38
    };
    sandbox.window = sandbox;
    vm.runInNewContext(source, sandbox, { filename: sourcePath });
    return { game, sandbox };
}

function offer(game, clubName, leagueKey, id) {
    game.careerDepth.manager.offers = [{ id, clubName, leagueKey, accepted: false }];
    return game.careerDepth.manager.offers[0].id;
}

test('club profiles survive job changes while manager history stays global', () => {
    const { game, sandbox } = makeGame();
    const historyBefore = JSON.stringify(game.careerDepth.history);
    const honoursBefore = JSON.stringify(game.careerDepth.honours);
    const managerRepBefore = game.careerDepth.manager.reputation;

    assert.equal(sandbox.CareerDepth.acceptOffer(offer(game, 'Club B', 'alpha', 'to-b')), true);
    assert.deepEqual(JSON.parse(JSON.stringify(game.upgrades)), {
        academy: 0, scouting: 0, stadium: 0, medical: 0, coaching: 0
    });
    assert.deepEqual(JSON.parse(JSON.stringify(game.staff)), {});
    assert.deepEqual(JSON.parse(JSON.stringify(game.youthPlayers)), []);
    assert.equal(game.stadiumName, 'Club B Arena');
    assert.equal(game.stadiumCapacity, 15000);
    assert.equal(game.ticketRevenue, 0);
    assert.equal(game.seasonTicketRevenue, 0);
    assert.equal(game.money, 8000000);

    game.upgrades.academy = 2;
    game.upgrades.stadium = 1;
    game.staff.physio = true;
    game.youthPlayers.push({ careerId: 'youth-b', name: 'Youth B', progress: 20, graduated: false });
    game.stadiumName = 'B Arena';
    game.stadiumCapacity = 19000;
    game.ticketRevenue = 440000;
    game.seasonTicketRevenue = 150000;
    game.money = 6250000;
    game.reputation = 2;
    game.repPoints = 48;
    game.morale = 41;

    assert.equal(sandbox.CareerDepth.acceptOffer(offer(game, 'Club A', 'alpha', 'back-to-a')), true);
    assert.equal(game.money, 11750000);
    assert.equal(game.upgrades.academy, 3);
    assert.equal(game.upgrades.stadium, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(game.staff)), { physio: true, coach: true });
    assert.deepEqual(JSON.parse(JSON.stringify(game.youthPlayers)), [
        { careerId: 'youth-a', name: 'Youth A', progress: 65, graduated: false }
    ]);
    assert.equal(game.stadiumName, 'A Arena+');
    assert.equal(game.stadiumCapacity, 28400);
    assert.equal(game.ticketRevenue, 1760000);
    assert.equal(game.seasonTicketRevenue, 920000);
    assert.equal(game.reputation, 4);
    assert.equal(game.repPoints, 317);
    assert.equal(game.morale, 73);

    assert.equal(sandbox.CareerDepth.acceptOffer(offer(game, 'Club B', 'alpha', 'back-to-b')), true);
    assert.equal(game.money, 6250000);
    assert.equal(game.upgrades.academy, 2);
    assert.equal(game.upgrades.stadium, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(game.staff)), { physio: true });
    assert.deepEqual(JSON.parse(JSON.stringify(game.youthPlayers)), [
        { careerId: 'youth-b', name: 'Youth B', progress: 20, graduated: false }
    ]);
    assert.equal(game.stadiumName, 'B Arena');
    assert.equal(game.stadiumCapacity, 19000);
    assert.equal(game.ticketRevenue, 440000);
    assert.equal(game.seasonTicketRevenue, 150000);
    assert.equal(game.reputation, 2);
    assert.equal(game.repPoints, 48);
    assert.equal(game.morale, 41);

    assert.equal(JSON.stringify(game.careerDepth.history), historyBefore);
    assert.equal(JSON.stringify(game.careerDepth.honours), honoursBefore);
    assert.equal(game.careerDepth.manager.reputation, managerRepBefore);
    assert.equal(game.careerDepth.careerMoves.length, 3);
});

test('club profile keys distinguish identical club names in different leagues', () => {
    const { game } = makeGame();
    const keyA = JSON.stringify(['alpha', 'club a']);
    const keyB = JSON.stringify(['beta', 'club a']);
    game.careerDepth.clubProfiles = {
        [keyA]: { upgrades: { academy: 2 }, stadiumName: 'Alpha Ground' },
        [keyB]: { upgrades: { academy: 4 }, stadiumName: 'Beta Ground' }
    };
    const sandbox = {
        G: game,
        LEAGUES: {
            beta: { name: 'Beta', flag: 'B', tier: 2, clubs: [{ name: 'Club A', emoji: '🆎', budget: 5000000 }] }
        },
        generateSquad: () => [], generateContracts: () => [], generateMarket: () => [],
        generateStandings: () => [], getSeasonLength: () => 38
    };
    sandbox.window = sandbox;
    vm.runInNewContext(source, sandbox, { filename: sourcePath });
    assert.equal(sandbox.CareerDepth.acceptOffer(offer(game, 'Club A', 'beta', 'to-beta')), true);
    assert.equal(game.upgrades.academy, 4);
    assert.equal(game.stadiumName, 'Beta Ground');
});
