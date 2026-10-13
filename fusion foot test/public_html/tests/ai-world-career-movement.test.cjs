const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const start = script.indexOf('const LEAGUES = ');
const end = script.indexOf('\n};\nconst FIRST_NAMES', start);
const all = vm.runInNewContext(`(${script.slice(start + 'const LEAGUES = '.length, end + 2)})`);
const LEAGUES = { pl: all.pl, championship: all.championship };
const AIWorld = require(path.join(root, 'ai-world.js'));

function fixture() {
  const state = { seasonYear: 2025, leagueKey: 'pl', clubName: 'Test Manager', leagueClubsByKey: Object.fromEntries(Object.entries(LEAGUES).map(([k,l]) => [k,l.clubs.map(c=>({...c}))])) };
  AIWorld.ensure(state, LEAGUES);
  return state;
}

test('promotion or relegation moves the displaced AI club without duplicating it', () => {
  const state = fixture();
  const human = state.leagueClubsByKey.pl.find(c=>c.name==='Manchester City');
  const displaced = state.leagueClubsByKey.championship.at(-1);
  state.leagueClubsByKey.pl = state.leagueClubsByKey.pl.filter(c=>c.name!=='Manchester City');
  state.leagueClubsByKey.pl.push({...displaced});
  state.leagueClubsByKey.championship[state.leagueClubsByKey.championship.length-1] = {...human};
  delete state.leagueClubsByKey.championship.at(-1).aiId;
  state.clubName = 'Manchester City';
  assert.equal(AIWorld.moveClubLeague(state, 'championship', 'pl', displaced.name, displaced.aiId), true);
  AIWorld.ensure(state, LEAGUES);
  const moved = Object.values(state.aiWorld.clubs).filter(c=>c.name===displaced.name);
  assert.equal(moved.length, 1);
  assert.equal(moved[0].leagueKey, 'pl');
  assert.equal(state.leagueClubsByKey.pl.filter(c=>c.name===displaced.name).length, 1);
  assert.equal(state.leagueClubsByKey.championship.filter(c=>c.name==='Manchester City').length, 1);
});

test('changing manager detaches the new human club and registers the outgoing squad as AI', () => {
  const state = fixture();
  const original = AIWorld.getClub(state, LEAGUES, 'Manchester City', 'pl');
  assert.ok(original);
  const humanSquad = original.players.map(p=>({careerId:p.id,name:p.name,pos:p.pos,level:p.level,pot:p.potential,age:p.age,wage:p.wage}));
  const target = AIWorld.getClub(state, LEAGUES, 'Arsenal', 'pl');
  assert.ok(target);
  const targetBudget = target.budget;
  const savedName = 'Manchester City';
  AIWorld.detachClub(state, 'pl', savedName);
  state.clubName = savedName;
  AIWorld.adoptManagedClub(state, LEAGUES, 'pl', savedName, humanSquad, 9000000);
  AIWorld.detachClub(state, 'pl', 'Arsenal');
  state.clubName = 'Arsenal';
  AIWorld.ensure(state, LEAGUES);
  const outgoing = AIWorld.getClub(state, LEAGUES, savedName, 'pl');
  assert.ok(outgoing);
  assert.equal(outgoing.players.length, humanSquad.length);
  assert.equal(outgoing.players[0].id, humanSquad[0].careerId);
  assert.equal(AIWorld.getClub(state, LEAGUES, 'Arsenal', 'pl'), null);
  assert.ok(targetBudget > 0);
});
