// Run with: node tests/tray-payout.cjs [seed]. 809 reproduces the left pile;
// 1 also exercises the last pair of balls stacked against the discharge lip.
// Reproduces a busy receiving tray while the handle is held above 90%.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const math = Object.create(Math);
let seed = Number(process.argv[2] ?? 809) >>> 0;
math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
const source = fs.readFileSync(path.join(__dirname, '../dist/tray.js'), 'utf8');
const Tray = new Function('Math', source + '\nreturn BallTray;')(math);
Tray.prototype.makeSteel = Tray.prototype.makeShell = () => null;
const tray = new Tray({ getContext: () => null });
const pulse = () => tray.advance(1 / 60);
function add(count, stride) {
  for (let i = 0; i < count; i++) { tray.deposit(); if (i % stride === 0) pulse(); }
}
add(250, 1);
for (let i = 0; i < 540; i++) pulse();
add(450, 3); add(172, 3);
let delay = 0, misses = 0, maxWait = 0;
for (let shots = 0; shots < 872;) {
  pulse();
  if (--delay > 0) continue;
  if (!tray.take()) {
    assert(++misses < 400, 'Feed jam at ' + shots + ' shots, ' + tray.count + ' balls left');
    continue;
  }
  maxWait = Math.max(maxWait, misses);
  misses = 0;
  delay = 36;
  assert.equal(tray.count, 872 - ++shots);
}
assert.equal(tray.balls.length, 0);
assert.equal(tray.take(), false);
console.log('All 872 balls fired; longest wait beyond the firing interval: ' + (maxWait / 60).toFixed(2) + ' s.');
