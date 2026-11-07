'use strict';

const reelTiming = {
  leftStop: 3.6, rightStop: 5.8, pushDeadline: 9.65,
  normalStop: 13.6, luckyRun: 5.6, hold: 3.5
};

function reelStopTime(ticket) {
  if (!ticket.lucky) return reelTiming.normalStop;
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
    ticket.elapsed >= reelTiming.rightStop && ticket.elapsed < reelStopTime(ticket));
}

function reelEase(value) {
  const u = Math.max(0, Math.min(1, value));
  return u * u * (3 - 2 * u);
}

// Each episode is authored in camera time. The camera and symbols share the
// finishing strike even when the player chooses a different moment to PUSH.
function battleCameraTime(ticket) {
  const t = ticket.elapsed, finish = reelStopTime(ticket);
  if (t < reelTiming.rightStop) return t / reelTiming.rightStop * 3.68;
  const launch = ticket.lucky ? ticket.pushTime ?? reelTiming.pushDeadline : reelTiming.rightStop;
  if (t < launch) return 3.68 + (t - reelTiming.rightStop) * .15;
  const launchFrame = 3.68 + (launch - reelTiming.rightStop) * .15;
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
  const stop = [reelTiming.leftStop,finish,reelTiming.rightStop][index];
  const remaining = Math.max(0,stop-t), age = t-stop;
  const pop = age >= 0 && age < .36 ? 1+.13*Math.sin(Math.PI*age/.36) : 1;
  c.save();
  c.translate(x,y); c.scale(pop,pop);
  c.beginPath(); c.rect(-size*.69,-size*.58,size*1.38,size*1.16); c.clip();
  function print(value, offset) {
    c.save(); c.translate(0,offset);
    const win = ticket.won && t >= finish;
    const palette = win ? ['#fff6cb','#ffd34d','#ff653c','#bd2559','#ffe7a0'] :
      value === 7 ? ['#fff1cb','#ffbd6b','#fb5735','#a41a2c','#fff3ad'] :
      value % 2 === 0 ? ['#f4ffff','#b9f1ff','#529de3','#303c93','#b8fbff'] :
      ['#fffbd7','#ffe59b','#ffc35d','#a64c21','#ffe7a2'];
    const ink = c.createLinearGradient(0,-size*.43,0,size*.43);
    [0,.32,.48,.53,1].forEach((at,i)=>ink.addColorStop(at,palette[i]));
    c.font='italic 900 '+size+'px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle';
    c.lineJoin='round'; c.strokeStyle='#0c0c19'; c.lineWidth=size*.12;
    c.strokeText(value,-size*.035,size*.069);
    c.strokeStyle=palette[1]; c.lineWidth=size*.066; c.strokeText(value,-size*.035,size*.028);
    c.strokeStyle='#552c36'; c.lineWidth=size*.035; c.strokeText(value,-size*.035,size*.028);
    c.fillStyle=ink; c.fillText(value,-size*.035,size*.028);
    c.restore();
  }
  if (index === 1 && chanceIsReady(ticket)) {
    print('×',0);
  } else {
    const alternate = index===1 && ticket.lucky && ticket.pushTime!=null;
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
  drawBattle(c,battleCameraTime(ticket),ticket.variant,ticket.digits,ticket.won);
  // Side symbols travel away from the pilots during the fight, then meet the
  // final center symbol on the impact beat. Their faces never cover the LCD.
  const spread = reelEase((t-.32)/1.34), converge = reelEase((t-(finish-1.6))/1.6);
  const sideDistance = 105 + spread*112 - converge*82;
  const sideY = 420 - spread*146 + converge*28;
  const centerY = 420 - converge*118;
  const sideSize = 72 + spread*20 + converge*66;
  const centerSize = 72 + reelEase((t-reelTiming.rightStop)/1.2)*21 + converge*65;
  drawSpinningSymbol(c,ticket,0,300-sideDistance,sideY,sideSize,finish);
  drawSpinningSymbol(c,ticket,2,300+sideDistance,sideY,sideSize,finish);
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
    if(t>=finish+1.75) drawJackpotAward(c,t-finish-1.75);
  }
  c.restore();
}
