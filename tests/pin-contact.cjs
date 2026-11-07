'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const source=['fieldwork','contacts'].map(name=>fs.readFileSync(path.join(__dirname,'../dist/'+name+'.js'),'utf8')).join('\n');
const {movePastPins,resolveBallContacts}=new Function(source+';return {movePastPins,resolveBallContacts};')();
const peg=(x,y)=>({x,y,r:.85});
const ball=(x,y,vx,vy)=>({x,y,vx,vy,route:'field',launch:false});
const origin=peg(200,200);

// At 576 units/s the actual 1/120 s substep moves only 4.8 units. Both
// endpoints clear the shaft, but a 5.75-unit impact offset crosses its edge.
for(let angle=0;angle<360;angle+=5){
  const a=angle*Math.PI/180, dx=Math.cos(a),dy=Math.sin(a);
  const shot=ball(200-2.4*dx+5.75*dy,200-2.4*dy-5.75*dx,576*dx,576*dy);
  const hits=[];
  movePastPins(shot,[origin],1/120,(pin,speed)=>hits.push(speed));
  assert.equal(hits.length,1,'glancing shaft missed at '+angle);
  assert.ok(hits[0]>90 && hits[0]<115);
  assert.ok(Math.hypot(shot.x-origin.x,shot.y-origin.y)>=5.85);
}
// A nearly parallel trajectory just outside the shaft remains a clean miss.
const clear=ball(197.6,194.149,576,0);
movePastPins(clear,[origin],1/120,()=>assert.fail('false pin contact'));
assert.equal(clear.vx,576);

// Resolve the earliest contact independent of pin list order, then use the
// remaining time. A very fast shot may hit two distinct pins in the same call.
const left=peg(100,200),right=peg(120,200),b=ball(109,200,1200,0),order=[];
movePastPins(b,[left,right],.025,(pin)=>order.push(pin));
assert.deepEqual(order,[right,left]);
assert.ok(b.x>105.85 && b.x<114.15 && b.vx>0);

// A neighbor pressing against a resting ball still transmits momentum, but
// projection must keep the pair outside both each other and the hardware.
const resting=ball(205.85,200,0,0),incoming=ball(218,200,-480,0);
for(let i=0;i<6;i++){
  for(const b of [resting,incoming])movePastPins(b,[origin],1/600);
  resolveBallContacts([resting,incoming],{pegs:[origin],wheel:{x:0,y:0}},[]);
  assert.ok(resting.x>=205.849);
  assert.ok(incoming.x-resting.x>=9.998);
}
console.log('72 glancing shaft contacts, clear miss, ordered multiple impacts and ball pressure passed.');
