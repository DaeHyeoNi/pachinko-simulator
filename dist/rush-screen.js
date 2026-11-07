'use strict';

// The LCD works in the game's 600×600 scene coordinates. Keep critical
// readouts inside the molded glass, clear of the physical ball lanes.
globalThis.drawRushScreen = function drawRushScreen(c, state) {
  const {kind,remaining,chain,earned,elapsed,spinAge,hit,ending} = state;
  const st = kind === 'st', active = spinAge >= 0;
  const color = st ? '#8cf7ff' : '#ffd190';
  const phase = Math.max(0,spinAge);
  function type(label,x,y,size,ink,align='center',italic=false) {
    c.font=(italic?'italic ':'')+'900 '+size+'px Arial, "Malgun Gothic", sans-serif';
    c.textAlign=align; c.textBaseline='middle';
    c.strokeStyle='#071222'; c.lineWidth=Math.max(2,size*.08);
    c.strokeText(label,x,y); c.fillStyle=ink; c.fillText(label,x,y);
  }
  c.save();
  if(ending){
    drawPatrol(c,elapsed*.43,6.1);
    const panel=c.createLinearGradient(0,110,0,490);
    panel.addColorStop(0,'#0a19234a');panel.addColorStop(.45,'#0a1923e8');panel.addColorStop(1,'#101322e8');
    c.fillStyle=panel;c.fillRect(0,0,600,600);
    type(st?'ST RUSH 종료':'찬스 타임 종료',300,185,35,color);
    type(earned.toLocaleString()+'개',300,280,73,'#fff3c4', 'center',true);
    type('획득 상구  ·  '+chain+'연속 당첨',300,355,25,'#f3f6fa');
    c.restore();return;
  }
  if(active && hit) {
    const capture = Math.min(1,phase/2.35);
    drawBattle(c,1.72+capture*4.48,2+(chain%4),[7,7,7],true);
  } else {
    drawPatrol(c,elapsed*(st?1.3:.68),st?7.5:1.1);
    c.fillStyle=st?'#134e7f70':'#6b374352';c.fillRect(0,0,600,600);
  }
  const cover=c.createLinearGradient(0,68,0,507);
  cover.addColorStop(0,'#031225dc');cover.addColorStop(.38,'#08152700');
  cover.addColorStop(.6,'#08152703');cover.addColorStop(1,'#071324ed');
  c.fillStyle=cover;c.fillRect(0,60,600,470);
  type(st?'ST RUSH':'찬스 타임',300,131,36,color,'center',st);
  type(chain+'연속',469,452,21,'#fcf0c9');

  // A single blue/amber sweep responds to each right-start admission.
  // A winning admission continues from the scanner into a combat impact.
  const targetX=300+33*Math.sin(elapsed*.89), targetY=278+13*Math.cos(elapsed*1.17);
  const tracking=active && (!hit || phase<1.7);
  if(tracking){
    const f=Math.min(1,phase/(hit?1.7:.6)), radius=100-52*f;
    c.save();c.translate(targetX,targetY);c.rotate(f*.62);
    c.lineWidth=2.5;c.strokeStyle=color;c.globalAlpha=Math.sin(Math.PI*f)*.9;
    for(let i=0;i<4;i++){
      const a=Math.PI/2*i+.12;
      c.beginPath();c.arc(0,0,radius,a,a+.84);c.stroke();
      c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);
      c.lineTo(Math.cos(a)*(radius-9),Math.sin(a)*(radius-9));c.stroke();
    }
    c.restore();
  }
  if(active && hit && phase>=1.7){
    const u=Math.min(1,(phase-1.7)/.22);
    c.save();c.translate(300,298);c.scale(1.12-.12*u,1.12-.12*u);
    type('777',0,0,116,'#ffdc7b','center',true);c.restore();
    type('재당첨',300,400,35,'#fff4bf');
  } else {
    const warning=remaining<=10;
    type('남은 변동',300,392,22,'#ecf6fb');
    type(String(remaining),300,447,70,warning?'#ffb690':color,'center',true);
  }
  c.restore();
};
