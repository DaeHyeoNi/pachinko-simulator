const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const flow = fs.readFileSync(path.join(__dirname, '../dist/flow.js'), 'utf8');
const {springShot, runLaunchGuide, resolveCrownContacts} = new Function(
  flow + '; return {springShot, runLaunchGuide, resolveCrownContacts};'
)();

function simulate(strokes, scatter) {
  const active = [];
  const results = [];
  for (let frame = 0; frame < 120 * 10 + 72 * strokes.length; frame++) {
    const index = frame / 72;
    if (Number.isInteger(index) && index < strokes.length) {
      active.push(springShot(strokes[index], scatter, 'return'));
    }
    for (let i = active.length - 1; i >= 0; i--) {
      const ball = active[i];
      ball.t += 1 / 120;
      const foul = runLaunchGuide(ball, 1 / 120);
      if (foul || !ball.launch) {
        results.push({route: foul ? 'foul' : ball.route, x: ball.x, y: ball.y});
        active.splice(i, 1);
      }
    }
    resolveCrownContacts(active);
    for (let i = 1; i < active.length; i++) {
      const a = active[i - 1], b = active[i];
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 9.999, 'guide balls interpenetrated');
    }
    if (results.length === strokes.length) return results;
  }
  assert.fail('ball remained on launch guide');
}

for (const scatter of [0, .5, 1]) {
  assert.equal(simulate([11], scatter)[0].route, 'foul');
  const releases = [12, 30, 55, 80, 94].map(stroke => simulate([stroke], scatter)[0]);
  assert.ok(releases.every(ball => ball.route === 'field'));
  assert.ok(releases.every((ball, i) => !i || ball.x > releases[i - 1].x));
  for (const stroke of [95, 100]) {
    const [release] = simulate([stroke], scatter);
    assert.equal(release.route, 'return');
    assert.ok(Math.abs(release.x - 580) < 1 && Math.abs(release.y - 150) < 1);
  }
  const alternating = Array.from({length: 40}, (_, i) => i % 2 ? 100 : 94);
  const shots = simulate(alternating, scatter);
  assert.equal(shots.filter(shot => shot.route === 'field').length, 20);
  assert.equal(shots.filter(shot => shot.route === 'return').length, 20);
}
console.log('Weak returns, stroke-dependent releases, crown transfers and guide collisions passed.');
