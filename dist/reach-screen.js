'use strict';
const quietScenes=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
function drawNormalScene(c,ticket,sceneTime,rolling){
  const location=ticket.location??0;
  if(!rolling){
    drawAmbientPatrol(c,location,quietScenes?.matches?2:sceneTime*.48);
    return;
  }
  drawSpinAction(c,location,quietScenes?.matches?1.15:ticket.elapsed);
  const phase=sceneTime%48;
  if(location!==0||phase<45||phase>=47||!patrolPlate.naturalWidth)return;
  c.save();c.globalAlpha=reelEase((phase-45)/.35)*(1-reelEase((phase-46.55)/.45));
  c.drawImage(patrolPlate,-11,-11,622,622);c.restore();
}
function drawTargetLock(c,t){
  const close=reelEase(t/.75),x=300+38*(1-close),y=249;
  const radius=149-close*64+4*Math.cos(t*5);
  c.fillStyle='#0817209e';c.fillRect(0,0,600,600);
  c.save();c.beginPath();c.arc(x,y,radius-4,0,Math.PI*2);c.clip();
  if(patrolPlate.naturalWidth)c.drawImage(patrolPlate,0,patrolPlate.height*.18,
    patrolPlate.width*.39,patrolPlate.height*.43,x-radius,y-radius,radius*2,radius*2);
  c.fillStyle='#60e2d124';c.fillRect(x-radius,y-radius,radius*2,radius*2);
  c.restore();c.save();c.translate(x,y);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4+(1-close)*.6;
    c.beginPath();c.arc(0,0,radius,a+.07,a+.52);
    c.strokeStyle=close>.92?'#ffad50':'#7bfff3';c.lineWidth=i%2?2:4;c.stroke();
    c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);
    c.lineTo(Math.cos(a)*(radius+8),Math.sin(a)*(radius+8));c.stroke();
  }
  for(const sign of [-1,1]){
    c.strokeStyle='#ffca83';c.lineWidth=2;c.beginPath();
    c.moveTo(sign*11,0);c.lineTo(sign*40,0);c.moveTo(0,sign*11);c.lineTo(0,sign*40);c.stroke();
  }
  c.restore();
}
function drawBladeClash(c,t){
  const meet=reelEase(t/.45),kick=Math.sin(Math.PI*reelEase((t-.79)/.45));
  c.fillStyle='#140f1fd9';c.fillRect(0,0,600,600);
  for(const side of [-1,1]){
    c.save();c.translate(side*(1-meet)*135+side*8*kick,0);c.beginPath();
    const edge=300+22*kick;
    c.moveTo(side<0?-180:780,65);c.lineTo(edge+98,65);
    c.lineTo(edge-87,517);c.lineTo(side<0?-180:780,517);c.closePath();c.clip();
    if(patrolPlate.naturalWidth){
      const image=patrolPlate;
      const sx=side<0?0:image.width*.47;
      c.drawImage(image,sx,image.height*(side<0?.23:.06),image.width*.5,image.height*.69,
        side<0?-45:215,58,440,475);
    }
    c.fillStyle=side<0?'#980c2b39':'#0089b934';c.fillRect(0,50,600,500);c.restore();
  }
  c.save();c.globalCompositeOperation='screen';c.lineCap='round';
  c.beginPath();c.moveTo(408,61);c.lineTo(200,520);
  c.strokeStyle='#ff9a2c';c.lineWidth=7+12*kick;c.stroke();c.strokeStyle='#fffbe5';c.lineWidth=2+4*kick;c.stroke();
  for(let i=0;i<21;i++){
    const age=(t*1.8+i*.139)%1,a=i*2.399,r=age*(90+i%5*17);
    c.globalAlpha=(1-age)*meet;c.strokeStyle=i%2?'#ffcc62':'#a9f9ff';c.lineWidth=2.4;
    c.beginPath();c.moveTo(301+Math.cos(a)*r,277+Math.sin(a)*r);
    c.lineTo(301+Math.cos(a)*(r+9),277+Math.sin(a)*(r+9));c.stroke();
  }
  c.restore();
}
function drawReactor(c,t){
  const x=300,y=260,charge=reelEase(t/1.3);
  c.fillStyle='#0b1030bd';c.fillRect(0,0,600,600);
  c.save();c.translate(x,y);c.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){
    const radius=59+i*29+(1-charge)*29;
    for(let j=0;j<6;j++){
      const a=j*Math.PI/3+(i%2?-1:1)*t*(.75+i*.21);
      c.strokeStyle=['#88fff0','#8da0ff','#3edffa'][i];c.lineWidth=i===0?5:2;
      c.beginPath();c.arc(0,0,radius,a,a+.55);c.stroke();
    }
  }
  for(let i=0;i<24;i++){
    const a=i*2.399,u=(i*.193+t*.88)%1,r=32+(1-u)*200;
    c.globalAlpha=.25+.68*u;c.strokeStyle=i%3?'#75eaff':'#fff';c.lineWidth=1.6;
    c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    c.lineTo(Math.cos(a+.04)*(r+18),Math.sin(a+.04)*(r+18));c.stroke();
  }
  c.globalAlpha=1;
  const radius=22+42*charge+4*Math.sin(t*7),core=c.createRadialGradient(0,0,0,0,0,radius);
  core.addColorStop(0,'#fff');core.addColorStop(.19,'#f0ffff');core.addColorStop(.45,'#62dcff');
  core.addColorStop(1,'#157cff00');c.fillStyle=core;c.fillRect(-radius,-radius,radius*2,radius*2);
  c.restore();
}
const reachScenes=[drawTargetLock,drawBladeClash,drawReactor];
function drawReachScene(c,index,age,remaining){
  if(age<0 || age>=2.45 || remaining<=0)return;
  c.save();
  c.globalAlpha=(1-reelEase((age-1.85)/.60))*Math.min(1,remaining/.24);
  const time=quietScenes?.matches ? .78 : age;
  (reachScenes[index]||reachScenes[0])(c,time);
  c.restore();
}
