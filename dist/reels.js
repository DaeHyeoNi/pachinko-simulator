'use strict';

const patrolPlate=new Image();
patrolPlate.src="patrol.webp";

const reelTiming = {
  leftStop: 3.6, rightStop: 5.8, pushDeadline: 9.65,
  normalStop: 10.0, luckyRun: 4.0, hold: 3.5
};

const shortTiming = {leftStop:1.7, rightStop:2.5, normalStop:3.65, hold:.85};
const normalReachTiming = {leftStop:2.7, rightStop:4.2, normalStop:8.4, hold:1.25};

function drawTiming(ticket) {
  if (ticket.stage === 'short') return shortTiming;
  if (ticket.stage === 'reach') return normalReachTiming;
  return reelTiming;
}

function reelStopTime(ticket) {
  if (!ticket.lucky) return drawTiming(ticket).normalStop;
  return ticket.pushTime == null
    ? reelTiming.pushDeadline + 2.7
    : ticket.pushTime + reelTiming.luckyRun;
}

function chanceIsReady(ticket) {
  return Boolean(ticket?.lucky && ticket.pushTime == null &&
    ticket.elapsed >= reelTiming.rightStop && ticket.elapsed < reelTiming.pushDeadline);
}

function isReachLive(ticket) {
  return Boolean(ticket && ticket.digits[0] === ticket.digits[2] &&
    ticket.elapsed >= drawTiming(ticket).rightStop && ticket.elapsed < reelStopTime(ticket));
}

function reelEase(value) {
  const u = Math.max(0, Math.min(1, value));
  return u * u * (3 - 2 * u);
}

// Each episode is authored in camera time. The camera and symbols share the
// finishing strike even when the player chooses a different moment to PUSH.
function battleCameraTime(ticket) {
  const t = ticket.elapsed, finish = reelStopTime(ticket);
  const entry = reelTiming.leftStop;
  if (t < reelTiming.rightStop) return Math.max(0,(t-entry)/(reelTiming.rightStop-entry))*1.7;
  const launch = ticket.lucky ? ticket.pushTime ?? reelTiming.pushDeadline : reelTiming.rightStop;
  if (t < launch) return 1.7 + (t - reelTiming.rightStop) * .36;
  const launchFrame = 1.7 + (launch - reelTiming.rightStop) * .36;
  if (t < finish) return launchFrame + (5.83 - launchFrame) * (t - launch) / (finish - launch);
  return Math.min(6.395, 5.83 + (t - finish) * .55);
}

function symbolRibbon(c, label, y, size, color, alpha=1) {
  c.save();
  c.globalAlpha *= alpha;
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  c.font = '900 ' + size + 'px "Malgun Gothic", sans-serif';
  const half = c.measureText(label).width / 2 + 22;
  const wash = c.createLinearGradient(300-half-20,0,300+half+20,0);
  for (const [at,ink] of [[0,'#050a1500'],[.16,'#081222df'],[.84,'#081222df'],[1,'#050a1500']]) wash.addColorStop(at,ink);
  c.fillStyle = wash; c.fillRect(280-half,y-size*.78,half*2+40,size*1.56);
  c.fillStyle = color; c.fillText(label,300,y);
  c.restore();
}

function drawSpinningSymbol(c, ticket, index, x, y, size, finish) {
  const t = ticket.elapsed, digit = ticket.digits[index];
  const timing=drawTiming(ticket);
  const stop = [timing.leftStop,finish,timing.rightStop][index];
  const remaining = Math.max(0,stop-t), age = t-stop;
  const pop = age >= 0 && age < .36 ? 1+.13*Math.sin(Math.PI*age/.36) : 1;
  c.save();
  c.translate(x,y); c.scale(pop,pop);
  c.beginPath(); c.rect(-size*.69,-size*.58,size*1.38,size*1.16); c.clip();
  function print(value, offset) {
    c.save(); c.translate(0,offset); c.rotate((index-1)*.095+(Number.isInteger(value)?value%3-1:0)*.035);
    const win = ticket.won && t >= finish;
    const palette = win ? ['#fff6cb','#ffd34d','#ff653c','#bd2559','#ffe7a0'] :
      value === 7 || value === 5 ? ['#fff1cb','#ffbd6b','#fb5735','#a41a2c','#fff3ad'] :
      value % 2 === 0 ? ['#f4ffff','#b9f1ff','#529de3','#303c93','#b8fbff'] :
      ['#fffbd7','#ffe59b','#ffc35d','#a64c21','#ffe7a2'];
    const ink = c.createLinearGradient(0,-size*.43,0,size*.43);
    [0,.32,.48,.53,1].forEach((at,i)=>ink.addColorStop(at,palette[i]));
    const face=value===4||value===7?'Arial Black, sans-serif':'Georgia, serif';
    c.font='italic 900 '+size+'px '+face; c.textAlign='center'; c.textBaseline='middle';
    c.lineJoin='round'; c.strokeStyle='#0c0c19'; c.lineWidth=size*(value%2 ? .13 : .10);
    c.strokeText(value,-size*.035,size*.069);
    c.strokeStyle=palette[1]; c.lineWidth=size*.066; c.strokeText(value,-size*.035,size*.028);
    c.strokeStyle='#552c36'; c.lineWidth=size*.035; c.strokeText(value,-size*.035,size*.028);
    c.fillStyle=ink; c.fillText(value,-size*.035,size*.028);
    c.restore();
  }
  if (index === 1 && chanceIsReady(ticket)) {
    print('×',0);
  } else {
    const alternate = index===1 && ticket.lucky && t>=timing.rightStop;
    const phase = alternate ? 1.1*remaining+1.45*remaining*remaining :
      remaining<1.8 ? 1.15*remaining*remaining : 3.726+(remaining-1.8)*4.14;
    const step=Math.floor(phase), offset=(phase-step)*size*1.16;
    const symbol=n=>alternate ? (n%2===0?digit:digit===7?6:7) : (digit-1+n)%9+1;
    print(symbol(step),offset);
    if(offset>0) print(symbol(step+1),offset-size*1.16);
  }
  c.restore();
}

function drawReelReveal(c,ticket,retained=false) {
  const t=ticket.elapsed, finish=reelStopTime(ticket);
  c.save();
  const timing=drawTiming(ticket);
  const inBattle=timing===reelTiming && t>=timing.leftStop;
  if (inBattle) {
    drawBattle(c,battleCameraTime(ticket),ticket.variant,ticket.digits,ticket.won);
    const flash=1-reelEase((t-timing.leftStop)/.36);
    if(flash>0){c.fillStyle='rgba(218,242,255,'+flash*.72+')';c.fillRect(0,0,600,600);}
  } else if(patrolPlate.naturalWidth){
    const age=t+(ticket.patrolOffset||0);
    c.drawImage(patrolPlate,-18+8*Math.sin(age*.67),-18+8*Math.cos(age*.48),636,636);
  } else {
    drawPatrol(c,t,ticket.patrolOffset);
  }
  if(!inBattle){
    const reach = isReachLive(ticket);
    const travel=timing===normalReachTiming ? reelEase((t-timing.rightStop)/.6)*(1-reelEase((t-finish+.8)/.8)) : 0;
    for(let i=0;i<3;i++){
      const distance=134+travel*40, y=360+(i-1)*29-travel*(i===1?55:8)+Math.sin(t*1.6+i)*9;
      drawSpinningSymbol(c,ticket,i,300+(i-1)*distance,y,i===1 ? 144+travel*18 : i===0?119:134,finish);
    }
    if(reach)symbolRibbon(c,'리치',145,30,'#ffdf9e',1-reelEase((t-timing.rightStop-1.3)/.7));
    c.restore();return;
  }
  // Side symbols travel away from the pilots during the fight, then meet the
  // final center symbol on the impact beat. Their faces never cover the LCD.
  const spread = reelEase((t-timing.leftStop)/.82), converge = reelEase((t-(finish-1.6))/1.6);
  const sideDistance = 134 + spread*83 - converge*82;
  const sideY = 385 - spread*111 + converge*28;
  const centerY = 385 + spread*35 - converge*118;
  const sideSize = 112 - spread*20 + converge*66;
  const centerSize = 112 - spread*40 + reelEase((t-reelTiming.rightStop)/1.2)*21 + converge*65;
  drawSpinningSymbol(c,ticket,0,300-sideDistance,sideY,sideSize,finish);
  drawSpinningSymbol(c,ticket,2,300+sideDistance,sideY+14*(1-converge),sideSize*1.08,finish);
  drawSpinningSymbol(c,ticket,1,300,centerY,centerSize,finish);
  if (isReachLive(ticket)) {
    const age=t-reelTiming.rightStop;
    if(ticket.lucky) {
      symbolRibbon(c,'LUCKY CHANCE',147,26,'#ffe6a0');
      if(chanceIsReady(ticket)){
        symbolRibbon(c,'중앙 PUSH를 누르세요',475,23,'#fff3d4');
        const left=(reelTiming.pushDeadline-t)/(reelTiming.pushDeadline-reelTiming.rightStop);
        c.fillStyle='#19202c';c.fillRect(220,495,160,4);
        c.fillStyle='#ffd077';c.fillRect(220,495,160*left,4);
      } else if(ticket.pushTime!=null && t-ticket.pushTime<.62) {
        symbolRibbon(c,'PUSH!',475,27,'#fff1bd',1-reelEase((t-ticket.pushTime-.28)/.34));
      }
    } else if(age<2.0) {
      symbolRibbon(c,'리치',150,36,'#ffdc91',1-reelEase((age-1.35)/.65));
    }
  }
  if(t>=finish && !retained && ticket.won){
    symbolRibbon(c,'대당첨',427,37,'#fff0aa',reelEase((t-finish)/.18));
    if(t>=finish+2.5 && t<finish+7) drawJackpotAward(c,t-finish-2.5);
  }
  c.restore();
}
function drawScreenCount(c,count,chain,t){
  c.save();c.textAlign='right';c.textBaseline='alphabetic';c.lineJoin='round';
  const label=(value,x,y,font,ink)=>{
    c.font=font;c.lineWidth=3.5;c.strokeStyle='#201321';c.strokeText(value,x,y);
    c.fillStyle=ink;c.fillText(value,x,y);
  };
  if(chain){
    const gold=c.createLinearGradient(0,448,0,485);
    gold.addColorStop(0,'#fffcea');gold.addColorStop(.49,'#ffe49b');gold.addColorStop(.58,'#d5843a');gold.addColorStop(1,'#fff5b7');
    label(String(chain),502,481,'italic 900 49px Georgia',gold);
    label('연속',552,477,'900 20px sans-serif','#ffe7a1');
  }
  label('보류',461,514,'bold 17px sans-serif','#f8dfae');
  for(let i=0;i<5;i++){
    const x=474+i*17,y=507;
    const glint=i===0 && count ? Math.sin(t*4) : 0;
    const shine=c.createRadialGradient(x-2+glint,y-3,.3,x,y,7);
    if(i<count){
      shine.addColorStop(0,'#fff');shine.addColorStop(.22,'#ecfcff');
      shine.addColorStop(.45,i===0?'#ffbd48':'#7ccbef');shine.addColorStop(.73,'#29384e');shine.addColorStop(1,'#f5f3df');
    }else{shine.addColorStop(0,'#73829696');shine.addColorStop(1,'#182435a6');}
    c.fillStyle=shine;c.beginPath();c.arc(x,y,6.2,0,Math.PI*2);c.fill();
    c.strokeStyle=i<count?'#fff1c5':'#c4cede66';c.lineWidth=.8;c.stroke();
  }
  c.restore();
}
