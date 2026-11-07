'use strict';
const assert=require('node:assert/strict');
const loadMachine=require('./headless-machine.cjs');

const result=loadMachine(function exercise(){
  // Drive the same 120 Hz scheduler as the cabinet with two balls in the tray.
  mode='normal';stock=2;force=80;status=()=>{};
  let available=2;
  tray.take=()=>{
    if(!available)return false;
    available--;
    return true;
  };
  const tick=()=>{
    now+=1/120;
    advanceStriker(1/120);
    advancePlayfield(1/120);
    if(available!==stock)throw Error('Tray and counter differ during loading');
  };
  for(let i=0;i<10;i++)tick();
  const wound=striker.compression;
  force=0;
  for(let i=0;i<120;i++)tick();
  const parked={shots,stock,loaded:striker.loadedAt!==null,compression:striker.compression};
  force=80;
  const releases=[];
  for(let i=0;i<240;i++){
    const previous=shots;
    tick();
    if(shots!==previous)releases.push(now);
  }
  return {wound,parked,releases,stock,loaded:striker.loadedAt!==null,compression:striker.compression};
})(Math);
assert.ok(result.wound>0);
assert.deepEqual(result.parked,{shots:0,stock:1,loaded:true,compression:0});
assert.equal(result.releases.length,2);
assert.ok(Math.abs(result.releases[1]-result.releases[0]-.6)<1e-6);
assert.equal(result.stock,0);
assert.equal(result.loaded,false);
assert.equal(result.compression,0);
console.log('Paused chamber, final ball, 600 ms cadence and empty-tray stop passed.');
