'use strict';
const assert=require('node:assert/strict');
const loadMachine=require('./headless-machine.cjs');

// Reproduce sustained 85% left-field shots during bonus rounds, when the
// heso is inactive. Check the entire visible ball against the cabinet photo.
const exercise=loadMachine(function(){
  mode='right';stock=400;status=msg=()=>{};
  let checked=0,deepest=0;
  for(let tick=0;tick<120*280 && (shots<400 || balls.length);tick++){
    now=tick/120;
    if(shots<400 && now-lastShot>=.6)fire([85,45,93,68][shots%4]);
    advancePlayfield(1/120);
    for(const b of balls){
      if(b.launch || b.route!=='field')continue;
      checked++;
      deepest=Math.max(deepest,(b.y+5+234)*941/600);
    }
  }
  return {shots,remaining:balls.length,checked,deepest};
});
let state=711;
const random=Object.create(Math);
random.random=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296);
const result=exercise(random);
assert.equal(result.shots,400);
assert.equal(result.remaining,0);
assert.ok(result.checked>0 && result.deepest<1200,'Free ball reached the gold PUSH housing');
console.log('400 bonus-mode shots drained above PUSH; lowest ball edge at photo y='+result.deepest.toFixed(1));

const inspectLanes=loadMachine(function(){
  mode='normal';stock=400;status=msg=()=>{};score=()=>hits++;
  const outer=[[2,418],[37,320],[72,253],[114,257],[91,300],[59,444]];
  const inner=[[95,354],[124,267],[146,252],[119,343],[101,370]];
  const leftCover=[[14,931],[101,935],[159,953],[159,1135],[103,1135],[58,1043]];
  const rightTrim=[[665,1146],[752,1129],[823,1113],[864,1099],[845,1143],[724,1166]];
  function inside(x,y,poly){
    let crossings=0;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const [a,b]=poly[i],[u,v]=poly[j];
      if((b>y)!==(v>y) && x<(u-a)*(y-b)/(v-b)+a)crossings++;
    }
    return crossings%2===1;
  }
  const blue=new Set(),purple=new Set(),blocked=new Set();
  for(let k=0;k<120*270 && (shots<400||balls.length);k++){
    now=k/120;if(shots<400&&now-lastShot>=.6)fire(20+shots%76);
    advancePlayfield(1/120);
    for(const b of balls){
      const x=(b.x+13)*941/600,y=(b.y+234)*941/600;
      if(inside(x,y,leftCover)||inside(x,y,rightTrim))blocked.add(b);
      if(b.launch||b.route!=='field')continue;
      if(inside(x,y,outer))blue.add(b);
      if(inside(x,y,inner))purple.add(b);
    }
  }
  return {blue:blue.size,purple:purple.size,blocked:blocked.size,remaining:balls.length};
});
state=77611;
const lanes=inspectLanes(random);
assert(lanes.blue>0 && lanes.purple>0);
assert.equal(lanes.blocked,0);
assert.equal(lanes.remaining,0);
console.log('400 lane shots:',lanes);
