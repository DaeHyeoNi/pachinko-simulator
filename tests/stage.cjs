const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const stage=new Function(fs.readFileSync(path.join(__dirname,'../dist/stage.js'),'utf8')+
  ';return {warpMouth,tryStageEntry,moveStageBall,enterStage,resolveStageContacts};')();
const {x,y,halfWidth}=stage.warpMouth;
function arriving(at,vx,vy){
  return {x:at,y:y+1,previousX:at,previousY:y-1,vx,vy,route:'field',freeStep:true};
}
const outside=arriving(x+halfWidth,0,140);
stage.tryStageEntry(outside,[outside]);assert.equal(outside.route,'field');
const outcomes=new Set();let reversed=0;
for(const vx of [-120,-70,-30,0,45,90,140]){
  for(const vy of [90,170,230]){
    const ball=arriving(x,vx,vy),balls=[ball];
    stage.tryStageEntry(ball,balls);assert.equal(ball.route,'warp');
    let travelled=false,turned=false,min=Infinity,max=-Infinity,frames=0;
    while(ball.route!=='field' && frames++<120*10){
      const lastX=ball.x,lastY=ball.y;
      stage.moveStageBall(ball,1/120,balls);
      assert(Math.hypot(lastX-ball.x,lastY-ball.y)<4,'jump along tube or stage');
      if(ball.route==='stage'){
        travelled=true;min=Math.min(min,ball.x);max=Math.max(max,ball.x);if(ball.vx< -5)turned=true;
      }
    }
    assert(travelled && frames<1200 && max-min>100);
    assert(ball.y<464,'ball returns to free play ABOVE the heso');
    outcomes.add(ball.inGroove);reversed+=Number(turned);
  }
}
assert.equal(reversed,21);assert.equal(outcomes.size,2);
// A full-speed warp discharge with forward roll reaches the flared inlet
// on the return pass. A steeper forward discharge carries on over the front lip.
for(const [forwardSpeed,expectGroove] of [[12,true],[19,false]]){
  const ball={};
  stage.enterStage(ball,188,0,207.5,forwardSpeed);
  for(let step=0;step<1200 && ball.route==='stage';step++)stage.moveStageBall(ball,1/120,[ball]);
  assert.equal(ball.route,'field');
  assert.equal(ball.inGroove,expectGroove);
  if(expectGroove)assert(Math.abs(ball.x-300)<1 && Math.abs(ball.vx)<1);
  else assert(Math.abs(ball.vx)>50);
}
const a={},b={};
stage.enterStage(a,285,11,50,1);
stage.enterStage(b,294,11,-50,1);
stage.resolveStageContacts([a,b]);
assert(a.vx<0 && b.vx>0);
assert(Math.hypot(a.x-b.x,a.z-b.z)>=10);
console.log('21 continuous warp journeys, roll reversals, both exits, and stage collisions passed.');
