const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const start = script.indexOf('const LEAGUES = ');
const end = script.indexOf('\n};\nconst FIRST_NAMES', start);
assert.notEqual(start, -1, 'static league definitions must be present');
assert.notEqual(end, -1, 'static league definitions must have a stable end marker');
const leagueLiteral = script.slice(start + 'const LEAGUES = '.length, end + 2).trim().replace(/;$/, '');
const allLeagues = vm.runInNewContext(`(${leagueLiteral})`);
const LEAGUES = { pl: allLeagues.pl, championship: allLeagues.championship };
const AIWorld = require(path.join(root, 'ai-world.js'));

function seasonLength(key, state) {
  const clubs = state.leagueClubsByKey[key];
  return clubs.length % 2 ? clubs.length * 2 : (clubs.length - 1) * 2;
}

function tablesFor(state) {
  const tables = {};
  for (const key of Object.keys(LEAGUES)) {
    tables[key] = state.leagueClubsByKey[key].map(entry => {
      const club = AIWorld.getClub(state, LEAGUES, entry, key);
      return { name: club.name, aiId: club.id, points: club.season.points, gf: club.season.gf, ga: club.season.ga };
    }).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  }
  return tables;
}

function assertWorldInvariants(state, year, requireFullSeason = true) {
  const clubs = Object.values(state.aiWorld.clubs);
  assert.equal(clubs.length, 44, `world club count in ${year}`);
  for (const key of Object.keys(LEAGUES)) {
    const division = clubs.filter(c => c.leagueKey === key);
    assert.equal(division.length, LEAGUES[key].clubs.length, `${key} club count in ${year}`);
  }
  const seenPlayers = new Map();
  for (const club of clubs) {
    assert.ok(Number.isFinite(club.budget) && club.budget >= 0, `valid budget for ${club.name} in ${year}`);
    assert.ok(club.players.length >= 11, `${club.name} has fewer than 11 players in ${year}: ${club.players.length}`);
    assert.ok(club.players.length <= 25, `${club.name} has over 25 players in ${year}: ${club.players.length}`);
    if (requireFullSeason) {
      const required = seasonLength(club.leagueKey, state);
      assert.equal(club.season.played, required, `${club.name} played ${club.season.played}/${required} in ${year}`);
      assert.equal(club.season.wins + club.season.draws + club.season.losses, required, `complete W/D/L for ${club.name} in ${year}`);
    }
    for (const player of club.players) {
      assert.ok(player.level >= 30 && player.level <= 99, `valid rating for ${player.name}`);
      assert.ok(player.potential >= player.level && player.potential <= 99, `valid potential for ${player.name}`);
      const prior = seenPlayers.get(player.id);
      assert.equal(prior, undefined, `${player.name} (${player.id}) appears at both ${prior} and ${club.name} in ${year}`);
      seenPlayers.set(player.id, club.name);
    }
  }
}

function assertFieldableRosters(state, year, label) {
  for (const club of Object.values(state.aiWorld.clubs)) {
    assert.ok(club.players.length >= 11, `${club.name} cannot field an XI after ${label} in ${year}: ${club.players.length}`);
  }
}

function makeEnglishWorld(year) {
  const state = {
    seasonYear: year,
    leagueKey: 'test-manager',
    clubName: 'Club humain hors des divisions testées',
    leagueClubsByKey: Object.fromEntries(Object.entries(LEAGUES).map(([key, league]) => [key, league.clubs.map(c => ({ ...c }))]))
  };
  AIWorld.ensure(state, LEAGUES);
  return state;
}

test('world calendars finish both league lengths from either player division', () => {
  for (const [playerLeague, otherLeague] of [['pl', 'championship'], ['championship', 'pl']]) {
    const state = makeEnglishWorld(2025);
    const playerLength = seasonLength(playerLeague, state);
    const otherLength = seasonLength(otherLeague, state);
    const lengths = { pl: seasonLength('pl', state), championship: seasonLength('championship', state) };
    for (let day = 1; day <= playerLength; day++) {
      AIWorld.simulateMatchday(state, LEAGUES, playerLeague, day, null);
      AIWorld.advanceWorld(state, LEAGUES, playerLeague, day, playerLength, lengths);
    }
    const other = Object.values(state.aiWorld.clubs).filter(c => c.leagueKey === otherLeague);
    assert.ok(other.every(c => c.season.played === otherLength), `${otherLeague} completes ${otherLength} rounds when managing ${playerLeague}`);
  }
});

test('an AI club cannot sell a borrowed player and the loan returns exactly once', () => {
  const state = makeEnglishWorld(2025);
  const owner = AIWorld.getClub(state, LEAGUES, 'Liverpool', 'pl');
  const borrower = AIWorld.getClub(state, LEAGUES, 'Arsenal', 'pl');
  const prospect = owner.players.find(p => p.age <= 22);
  assert.ok(prospect, 'fixture contains a young player to loan');
  owner.players = owner.players.filter(p => p.id !== prospect.id);
  const snapshot = { ...prospect, status: 'squad' };
  borrower.players.push({ ...prospect, status: 'loan', loanOwner: owner.id });
  borrower.loans.push({ playerId: prospect.id, ownerId: owner.id, endSeason: 2026, playerSnapshot: snapshot });

  AIWorld.onTransferWindow(state, LEAGUES, '2026-01-01');
  let holders = Object.values(state.aiWorld.clubs).filter(c => c.players.some(p => p.id === prospect.id));
  assert.equal(holders.length, 1);
  assert.equal(holders[0].id, borrower.id, 'borrower retains the player until the loan ends');

  state.seasonYear = 2026;
  AIWorld.onTransferWindow(state, LEAGUES, '2026-07-01');
  holders = Object.values(state.aiWorld.clubs).filter(c => c.players.some(p => p.id === prospect.id));
  assert.equal(holders.length, 1, 'the active player identity exists at only one club after loan return');
  assert.equal(holders[0].id, owner.id, 'player returns to the owning club');
  assert.equal(borrower.players.some(p => p.id === prospect.id), false);
});

test('English AI world stays complete through ten season and save cycles', () => {
  const state = makeEnglishWorld(2025);

  for (let offset = 0; offset < 10; offset++) {
    const year = 2025 + offset;
    state.seasonYear = year;
    for (let month = 0; month < 12; month++) {
      const absoluteMonth = 6 + month;
      const dateYear = year + Math.floor(absoluteMonth / 12);
      const dateMonth = String(absoluteMonth % 12 + 1).padStart(2, '0');
      const date = `${dateYear}-${dateMonth}-01`;
      AIWorld.onMonth(state, LEAGUES, date);
      if (date.endsWith('-07-01') || date.endsWith('-01-01')) {
        AIWorld.onTransferWindow(state, LEAGUES, date);
        assertFieldableRosters(state, year, `transfer window ${date}`);
      }
    }

    for (const key of Object.keys(LEAGUES)) {
      const requiredRounds = seasonLength(key, state);
      for (let day = 1; day <= requiredRounds; day++) {
        const result = AIWorld.simulateMatchday(state, LEAGUES, key, day, null);
        assert.equal(result.processed, true, `${key} matchday ${day} processes in ${year}`);
        assert.equal(result.results.length, LEAGUES[key].clubs.length / 2, `${key} matchday ${day} has a full slate in ${year}`);
      }
    }

    const tables = tablesFor(state);
    AIWorld.finishSeason(state, LEAGUES, tables, year + 1);
    assertWorldInvariants(state, year, false);
    const roundTrip = JSON.parse(JSON.stringify(state));
    AIWorld.ensure(roundTrip, LEAGUES);
    assertWorldInvariants(roundTrip, year + 1, false);
    state.aiWorld = roundTrip.aiWorld;
    state.leagueClubsByKey = roundTrip.leagueClubsByKey;
  }

  const clubs = Object.values(state.aiWorld.clubs);
  assert.ok(clubs.every(c => c.records.seasons === 10), 'all AI clubs archived ten seasons');
  assert.ok(clubs.every(c => c.history.length <= 25), 'club history remains bounded');
  assert.ok(state.aiWorld.transferLog.length <= 120, 'transfer log remains bounded');
});
