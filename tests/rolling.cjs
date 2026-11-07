'use strict';
const assert=require('node:assert/strict');
const loadMachine=require('./headless-machine.cjs');
function solitaryPin() {
  mode='normal';
  const pin=pegs.find(p=>p.x===89&&p.y===191);
  pegs.splice(0,pegs.length,pin);
  const startY=pin.y-pin.r-5;
  const b={x:pin.x,y:startY,vx:0,vy:0,t:0,route:'field',launch:false};
  balls=[b];
  let maxDelta=0;
  for(let n=0;n<120*6 && b.y<startY+4;n++){
    const lastX=b.vx,lastY=b.vy;
    advancePlayfield(1/120);
    maxDelta=Math.max(maxDelta,Math.hypot(b.vx-lastX,b.vy-lastY));
  }
  return {maxDelta,elapsed:b.t,drop:b.y-startY};
}
const trial=loadMachine(solitaryPin)(Math);
assert.ok(trial.drop>=4 && trial.elapsed<4,'ball stayed on pin apex');
assert.ok(trial.maxDelta<=510/120+.03,'resting ball received a kick before leaving pin');
function releaseFormerPocket(x,y){
  mode='normal'; score=()=>{hits++;};
  const b={x,y,vx:0,vy:0,t:0,route:'field',launch:false};
  balls=[b];
  for(let frame=0;frame<120*20 && balls.length;frame++)advancePlayfield(1/120);
  return {finished:balls.length===0,route:b.route,seconds:b.t};
}
const release=loadMachine(releaseFormerPocket);
for(const [x,y] of [[279,453],[288,460],[116,443],[98,143],[147,390],[224,422],[419,412],[537,232]]){
  const result=release(Math,x,y);
  assert.ok(result.finished && result.route==='field','did not drain from '+[x,y]+'; '+JSON.stringify(result));
}
console.log('Stationary ball rolled off in '+trial.elapsed.toFixed(2)+'s; maximum speed change '+trial.maxDelta.toFixed(3)+' per physics frame. Eight former pockets drained.');
