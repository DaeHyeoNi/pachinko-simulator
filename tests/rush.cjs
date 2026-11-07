const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dist/rush.js'), 'utf8');
const RushSession = new Function(source + '; return RushSession;')();

function session(firstRoll, forced = false) {
  let roll = firstRoll;
  const rush = new RushSession(() => roll);
  rush.beginFirst(forced);
  assert.equal(rush.chain, 1);
  assert.equal(rush.earned, 0);
  rush.startSupport();
  return {rush, setRoll: value => { roll = value; }};
}

for (const [firstRoll, kind, limit, odds] of [
  [.589999, 'st', 163, 99.4], [.59, 'chance', 100, 319.7]
]) {
  const {rush, setRoll} = session(firstRoll);
  assert.equal(rush.kind, kind);
  assert.equal(rush.remaining, limit);
  assert.equal(rush.next(), null);
  assert.equal(rush.remaining, limit, 'empty support must wait for an admission');

  // Lock the outcome at admission, including the exact boundary of the draw.
  for (const value of [0, 1 / odds, 1 / odds - 1e-9, .9]) {
    setRoll(value);
    assert.equal(rush.admit(), true);
  }
  assert.equal(rush.canAccept(), false);
  assert.equal(rush.admit(true), false);
  setRoll(.99);
  assert.deepEqual(Array.from({length: 4}, () => rush.next().won), [true, false, true, false]);
  assert.equal(rush.remaining, limit - 4);

  while (rush.remaining > 2) {
    assert.equal(rush.admit(), true);
    assert.equal(rush.next().won, false);
  }
  assert.equal(rush.admit(), true);
  assert.equal(rush.admit(true), true);
  assert.equal(rush.canAccept(), false, 'final two spins already reserved');
  assert.equal(rush.admit(), false);
  assert.equal(rush.next().won, false);
  assert.equal(rush.next().won, true, 'last eligible spin still pays');
  assert.equal(rush.remaining, 0);
  assert.equal(rush.next(), null);
  assert.equal(rush.admit(true), false);

  rush.renew();
  assert.equal(rush.chain, 2);
  assert.equal(rush.kind, 'st');
  rush.startSupport();
  assert.equal(rush.remaining, 163);
  assert.equal(rush.canAccept(), true);
}

const {rush} = session(.99, true);
assert.equal(rush.kind, 'st', 'debug first hit must enter ST even on a chance roll');
assert.equal(rush.admit(true), true);
assert.equal(rush.next().won, true);
console.log('ST and chance admission odds, ticket order, last spins, renewal and debug passed.');
