const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('function buildSeasonRolloverContracts(');
assert.notEqual(start, -1, 'contract rollover helper must exist');
const end = source.indexOf('\n}\n', start) + 2;
assert.ok(end > start, 'contract rollover helper must have a closing brace');
const context = vm.createContext({});
vm.runInContext(`${source.slice(start, end)}\nglobalThis.run = buildSeasonRolloverContracts;`, context);

test('season rollover preserves active contract terms and renews only expired or missing terms', () => {
  const squad = [
    { contractPlayerId: 'active', wage: 120000 },
    { contractPlayerId: 'expired', wage: 80000 },
    { contractPlayerId: 'missing', wage: 50000 }
  ];
  const prior = [
    { playerId: 'active', matchesLeft: 17, wage: 100000, clause: 'preserved' },
    { playerId: 'expired', matchesLeft: 0, wage: 80000 },
    { playerId: 'sold', matchesLeft: 23, wage: 30000 }
  ];
  const next = context.run(squad, prior, 46);
  assert.deepEqual(JSON.parse(JSON.stringify(next)), [
    { playerId: 'active', matchesLeft: 17, wage: 120000, clause: 'preserved' },
    { playerId: 'expired', matchesLeft: 46, wage: 80000 },
    { playerId: 'missing', matchesLeft: 46, wage: 50000 }
  ]);
  assert.equal(next.some(contract => contract.playerId === 'sold'), false, 'departed player contract is removed');
});
