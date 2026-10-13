const assert = require('node:assert/strict');
const test = require('node:test');
const Playoffs = require('../playoffs.js');

test('four qualified clubs play two-legged semifinals and a neutral final', () => {
  const teams = [
    { name: 'Club A', seed: 3, rating: 80 },
    { name: 'Club B', seed: 4, rating: 70 },
    { name: 'Club C', seed: 5, rating: 65 },
    { name: 'Club D', seed: 6, rating: 60 }
  ];
  const result = Playoffs.simulate(teams, { seed: '2025:championship', playerClubName: 'Club A' });
  assert.equal(result.rounds.length, 2);
  assert.equal(result.rounds[0].matches.length, 2);
  assert.ok(result.rounds[0].matches.every(match => match.legs.length === 2));
  assert.equal(result.rounds[1].name, 'Finale');
  assert.equal(result.rounds[1].matches.length, 1);
  assert.equal(result.rounds[1].matches[0].legs.length, 1);
  assert.equal(result.promoted, result.champion === 'Club A');
  assert.deepEqual(Playoffs.simulate(teams, { seed: '2025:championship', playerClubName: 'Club A' }), result);
});

test('squad quality influences repeatable playoff outcomes', () => {
  let strongTeamWins = 0;
  for (let seed = 0; seed < 120; seed++) {
    const result = Playoffs.simulate([
      { name: 'Strong', seed: 3, rating: 94 },
      { name: 'Weak', seed: 6, rating: 48 }
    ], { seed: `trial:${seed}`, playerClubName: 'Strong' });
    if (result.champion === 'Strong') strongTeamWins++;
  }
  assert.ok(strongTeamWins > 80, `stronger club won ${strongTeamWins}/120 trials`);
});

test('a single playoff place meets the supplied opponent without a free promotion', () => {
  const result = Playoffs.simulate([
    { name: 'Second division contender', seed: 3, rating: 68 },
    { name: 'Top division survivor', seed: 16, rating: 72 }
  ], { seed: 'relegation-playoff', playerClubName: 'Second division contender' });
  assert.equal(result.rounds[0].matches[0].legs.length, 1);
  assert.equal(result.champion === 'Second division contender', result.promoted);
});
