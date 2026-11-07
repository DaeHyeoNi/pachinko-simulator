'use strict';
// node tests/shot-trace.cjs --shots=250 --strengths=15,30,45,60,75,85,90,94,95,100
// --revision=<commit> runs precisely the same shots against an earlier machine.
// --trace=<filename.json> saves the first 3 trajectories for each strength.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const args = Object.fromEntries(process.argv.slice(2).map(arg=>arg.slice(2).split('=')));
const strengths = (args.strengths || '10,15,30,45,60,75,85,90,94,95,100').split(',').map(Number);
const sample = Number(args.shots || 250);
const seed = Number(args.seed || 918733);
const cadence = Number(args.cadence || .6);
if (!Number.isFinite(cadence) || cadence <= 0 || !Number.isFinite(seed)) throw Error('Invalid cadence or seed');
if (!Number.isInteger(sample) || sample<1 || strengths.some(s=>s<=0 || s>100 || !Number.isFinite(s))) throw Error('Invalid shots or strength');
function read(file) {
  return args.revision
    ? execFileSync('git',['show',args.revision+':dist/'+file],{cwd:root,encoding:'utf8'})
    : fs.readFileSync(path.join(root,'dist',file),'utf8');
}
const source=['fieldwork.js','contacts.js','flow.js','game.js'].map(read).join('\n');
const empty = ()=>{};
const element = {getContext:empty,querySelectorAll:()=>[],setAttribute:empty};
const environment = {
  document:{querySelector:()=>element,getElementById:()=>element,createElement:()=>element,addEventListener:empty},
  BallTray:class {take(){return true;}},RotaryHandle:class {},BanknoteAcceptor:class {},RushSession:class {},
  Path2D:class {moveTo(){}lineTo(){}ellipse(){}},drawBattle:empty,BallAudio:{pin:empty,wheel:empty,launch:empty},
  requestAnimationFrame:empty
};
// Run the actual fire / advancePlayfield with simultaneous shots at cabinet rate.
// Only external drawing, UI and the subsequent lottery are bypassed.
function measure(sample,strength,includeTrace,cadence) {
  mode='normal'; stock=sample; force=strength;
  status=()=>{}; msg=()=>{}; score=()=>{hits++;};
  const result={strength,shots:sample,heso:0,out:0,weak:0,right:0,service:0,timeout:0,escaped:0,
    wheel:0,nudged:0,nearMouth:0,medianSeconds:0,p95Seconds:0,hesoPercent:0};
  const roofEvents=[], timeoutLocations=[], durations=[], lanes=Array(12).fill(0), paths=[], recoveries=new Map();
  const observed = new WeakMap();
  const oldWheel=collideWindmill, oldFinish=finishBallStep, oldAdvance=advanceBall;
  collideWindmill=(b,f,dt)=>{
    const contact=oldWheel(b,f,dt);
    if(contact&&f===field&&observed.has(b)) observed.get(b).wheel=true;
    return contact;
  };
  function done(b,outcome) {
    const item=observed.get(b);
    result[outcome]++;durations.push(b.t);
    for(const flag of ['wheel','nudged','nearMouth','escaped'])if(item[flag]) result[flag]++;
    if(item.samples)paths.push({shot:item.shot,outcome,points:item.samples});
  }
  finishBallStep=(b,dt)=>{
    const before=hits, previous=b.restContact?.attempts||0;
    const beforeVx=b.vx,beforeVy=b.vy;
    const complete=oldFinish(b,dt), item=observed.get(b);
    if((b.restContact?.attempts||0)>previous){
      item.nudged=true;
      if(b.y<85 && roofEvents.length<8)roofEvents.push({shot:item.shot,x:b.x,y:b.y,vx:beforeVx,vy:beforeVy,age:b.t});
      const cell=Math.floor(b.x/20)*20+','+Math.floor(b.y/20)*20;
      recoveries.set(cell,(recoveries.get(cell)||0)+1);
    }
    const mouthY=field.heso ? field.heso.y-6 : 505;
    if(b.freeStep&&b.route==='field'&&b.previousY<mouthY&&b.y>=mouthY) {
      const x=b.previousX+(b.x-b.previousX)*(mouthY-b.previousY)/(b.y-b.previousY);
      if(Math.abs(x-(field.heso?.x??300))<=20)item.nearMouth=true;
      if(!item.seenLane){lanes[Math.max(0,Math.min(11,Math.floor(x/50)))]++;item.seenLane=true;}
    }
    if(complete)done(b,b.route==='field' ? (hits>before?'heso':'out') : 'right');
    return complete;
  };
  advanceBall=(b,dt)=>{
    const complete=oldAdvance(b,dt);
    if(complete) done(b,b.route==='service'?'service':'weak');
    return complete;
  };
  let tick=0;
  while(shots<sample||balls.length){
    now=++tick/120;
    if(shots<sample && now-lastShot>=cadence){
      const previous=shots; fire();
      if(shots>previous)observed.set(balls.at(-1),{shot:shots,samples:includeTrace&&shots<=3?[]:null});
    }
    advancePlayfield(1/120);
    for(let i=balls.length-1;i>=0;i--){
      const b=balls[i],item=observed.get(b);
      if(b.x < -5 || b.x > 605 || (b.y>605 && b.route!=='service') || b.y< -5) item.escaped=true;
      if(item.samples&&tick%10===0)item.samples.push([+b.x.toFixed(1),+b.y.toFixed(1)]);
      if(b.t>40){timeoutLocations.push([b.x,b.y,b.vx,b.vy]);done(b,'timeout');balls.splice(i,1);}
    }
  }
  durations.sort((a,b)=>a-b);
  result.hesoPercent=+(result.heso*100/sample).toFixed(2);
  result.medianSeconds=+durations[Math.floor(sample*.5)].toFixed(2);
  result.p95Seconds=+durations[Math.floor(sample*.95)].toFixed(2);
  return {result,lanes,roofEvents,timeoutLocations,recoveries:[...recoveries].sort((a,b)=>b[1]-a[1]).slice(0,8),paths,
    geometry:{pegs:pegs.length,rails:rails.length,wheel:[field.wheel.x,field.wheel.y],drain:field.drain}};
}
const execute=new Function(...Object.keys(environment),'Math',source+'\nreturn ('+measure.toString()+');');
const report=strengths.map(strength=>{
  let state=seed;
  const random=Object.create(Math);
  random.random=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296);
  return execute(...Object.values(environment),random)(sample,strength,Boolean(args.trace),cadence);
});
if(args.json)fs.writeFileSync(args.json,JSON.stringify({revision:args.revision||'working',seed,cadence,report},null,2));
if(args.trace)fs.writeFileSync(args.trace,JSON.stringify(report.map(v=>({strength:v.result.strength,paths:v.paths}))));
console.table(report.map(v=>v.result));
for(const {result} of report) {
  if(result.shots!==result.heso+result.out+result.weak+result.right+result.service+result.timeout || result.timeout || result.escaped)process.exitCode=1;
}
