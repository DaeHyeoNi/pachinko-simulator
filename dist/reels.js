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
function battleCameraTime(ticket,t=ticket.elapsed) {
  const finish = reelStopTime(ticket);
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

function symbolPhase(remaining,alternate){
  if(alternate)return 1.1*remaining+1.45*remaining*remaining;
  return remaining<1.8 ? 1.15*remaining*remaining : 3.726+(remaining-1.8)*4.14;
}
// Five-by-seven glyphs keep their stepped edges at every LCD size.
const pixelDigits=[
  [14,17,19,21,25,17,14],[4,12,4,4,4,4,14],[14,17,1,2,4,8,31],
  [30,1,1,14,1,1,30],[2,6,10,18,31,2,2],[31,16,16,30,1,1,30],
  [6,8,16,30,17,17,14],[31,1,2,4,8,8,8],[14,17,17,14,17,17,14],
  [14,17,17,15,1,2,12]
];
const pixelCross=[0,17,10,4,10,17,0];
function printPixelSymbol(c,value,size,ink,edge){
  const unit=size*.112,rows=pixelDigits[value]||pixelCross;
  c.save();c.scale(unit,unit);c.translate(-2.5,-3.5);
  for(const [offset,thickness,color] of [[.24,.18,'#18243b'],[0,.11,edge],[0,0,ink]]){
    c.fillStyle=color;
    rows.forEach((bits,y)=>{
      for(let x=0;x<5;x++)if(bits&(16>>x))
        c.fillRect(x-thickness,y+offset-thickness,1+thickness*2,1+thickness*2);
    });
  }
  c.restore();
}
const reelLooks=['metal','prism','pixel','pixel','beat','combo'];
function drawSpinningSymbol(c, ticket, index, x, y, size, finish,look) {
  const t = ticket.elapsed, digit = ticket.digits[index];
  const timing=drawTiming(ticket);
  const stop = [timing.leftStop,finish,timing.rightStop][index];
  const remaining = Math.max(0,stop-t), age = t-stop;
  const pop = age >= 0 && age < .36 ? 1+.13*Math.sin(Math.PI*age/.36) : 1;
  c.save();
  c.translate(x,y); c.scale(pop,pop);
  c.beginPath(); c.rect(-size*.69,-size*.58,size*1.38,size*1.16); c.clip();
  function print(value, offset) {
    c.save(); c.translate(0,offset); if(look!=='pixel')c.rotate((index-1)*.095+(Number.isInteger(value)?value%3-1:0)*.035);
    const win = ticket.won && t >= finish;
    const palette = win ? ['#fff6cb','#ffd34d','#ff653c','#bd2559','#ffe7a0'] :
      value === 7 || value === 5 ? ['#fff1cb','#ffbd6b','#fb5735','#a41a2c','#fff3ad'] :
      value % 2 === 0 ? ['#f4ffff','#b9f1ff','#529de3','#303c93','#b8fbff'] :
      ['#fffbd7','#ffe59b','#ffc35d','#a64c21','#ffe7a2'];
    const ink = c.createLinearGradient(0,-size*.43,0,size*.43);
    [0,.32,.48,.53,1].forEach((at,i)=>ink.addColorStop(at,palette[i]));
    if(look==='pixel'){
      printPixelSymbol(c,value,size,win?'#ffe266':value%2===0?'#8aeeff':'#ffae59','#614780');
      c.restore();return;
    }
    if(look==='beat'||look==='combo'){
      const beat=look==='beat';
      c.font=(beat?'900 ':'italic 900 ')+size+'px "Arial Black",sans-serif';
      c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
      c.strokeStyle=beat?'#1c3154':'#50263d';c.lineWidth=size*.13;c.strokeText(value,0,size*.04);
      c.strokeStyle=beat?'#fff4bb':'#ffdf8b';c.lineWidth=size*.065;c.strokeText(value,0,0);
      c.fillStyle=win?'#ffcf40':beat?(value%2?'#f37991':'#6cdbcb'):ink;c.fillText(value,0,0);
      c.restore();return;
    }
    const face=look==='prism'?'Georgia,serif':value===4||value===7?'Arial Black, sans-serif':'Georgia, serif';
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
    const phase=symbolPhase(remaining,alternate);
    const step=Math.floor(phase), offset=(phase-step)*size*1.16;
    const symbol=n=>alternate ? (n%2===0?digit:digit===7?6:7) : (digit-1+n)%9+1;
    print(symbol(step),offset);
    if(offset>0) print(symbol(step+1),offset-size*1.16);
  }
  c.restore();
}

function drawReelReveal(c,ticket,retained=false,sceneTime=ticket.elapsed) {
  const t=ticket.elapsed, finish=reelStopTime(ticket);
  c.save();
  const timing=drawTiming(ticket);
  const inBattle=timing===reelTiming && t>=timing.leftStop;
  const location=inBattle && ticket.variant>=6 ? ticket.variant-5 : ticket.location??0;
  const look=reelLooks[location]||'metal';
  if (inBattle) {
    drawBattle(c,battleCameraTime(ticket),ticket.variant,ticket.digits,ticket.won);
    const flash=1-reelEase((t-timing.leftStop)/.36);
    if(flash>0){c.fillStyle='rgba(218,242,255,'+flash*.72+')';c.fillRect(0,0,600,600);}
  } else {
    drawNormalScene(c,ticket,sceneTime,!retained);
  }
  if(isReachLive(ticket)){
    const cueAge=(t-timing.rightStop)*(inBattle && ticket.variant>=6?2:1);
    drawReachScene(c,ticket.reachVariant,cueAge,finish-t);
  }
  if(!inBattle){
    const travel=timing===normalReachTiming ? reelEase((t-timing.rightStop)/.6)*(1-reelEase((t-finish+.8)/.8)) : 0;
    for(let i=0;i<3;i++){
      const onStage=location>0 && !retained;
      const distance=(onStage?170:134)+travel*34;
      const y=(onStage?410:360)+(i-1)*29-travel*(i===1?55:8)+(retained?0:Math.sin(t*1.6+i)*9);
      drawSpinningSymbol(c,ticket,i,300+(i-1)*distance,y,i===1 ? (onStage?120:144)+travel*18 : i===0?119:134,finish,look);
    }
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
  drawSpinningSymbol(c,ticket,0,300-sideDistance,sideY,sideSize,finish,look);
  drawSpinningSymbol(c,ticket,2,300+sideDistance,sideY+14*(1-converge),sideSize*1.08,finish,look);
  drawSpinningSymbol(c,ticket,1,300,centerY,centerSize,finish,look);
  if (isReachLive(ticket)) {
    if(ticket.lucky) {
      if(chanceIsReady(ticket)){
        symbolRibbon(c,'중앙 PUSH를 누르세요',475,23,'#fff3d4');
        const left=(reelTiming.pushDeadline-t)/(reelTiming.pushDeadline-reelTiming.rightStop);
        c.fillStyle='#19202c';c.fillRect(220,495,160,4);
        c.fillStyle='#ffd077';c.fillRect(220,495,160*left,4);
      } else if(ticket.pushTime!=null && t-ticket.pushTime<.62) {
        symbolRibbon(c,'PUSH!',475,27,'#fff1bd',1-reelEase((t-ticket.pushTime-.28)/.34));
      }
    }
  }
  if(t>=finish && !retained && ticket.won){
    symbolRibbon(c,'대당첨',427,37,'#fff0aa',reelEase((t-finish)/.18));
    if(t>=finish+2.5 && t<finish+7) drawJackpotAward(c,t-finish-2.5);
  }
  c.restore();
}
const ignitionTimes=Array(5).fill(-Infinity);
let previousEmbers=0;
function drawEmber(c,x,y,index,t,lit,still){
  c.save();c.translate(x,y);
  if(lit){
    const age=Math.max(0,t-ignitionTimes[index]);
    const bloom=still?1:.42+.58*reelEase(age/.28);
    const wave=still?0:Math.sin(t*5.6+index*1.83);
    const sway=wave*3.6;
    c.scale(.95,bloom);
    const halo=c.createRadialGradient(0,-12,2,0,-12,23);
    halo.addColorStop(0,'#ffbf54aa');halo.addColorStop(.52,'#ff601760');halo.addColorStop(1,'#ff431000');
    c.fillStyle=halo;c.fillRect(-24,-36,48,48);
    const outer=c.createLinearGradient(0,-40,0,3);
    outer.addColorStop(0,'#fff6ad');outer.addColorStop(.32,'#ffbd3e');outer.addColorStop(.65,'#ff5b0c');outer.addColorStop(1,'#b51e19');
    c.fillStyle=outer;c.strokeStyle='#751f1e';c.lineWidth=1.3;
    c.beginPath();c.moveTo(-10,0);c.bezierCurveTo(-18,-10,-6,-19,-10,-28);
    c.quadraticCurveTo(-3,-25,-4,-18);c.bezierCurveTo(2,-24,-3,-35,sway+4,-42);
    c.bezierCurveTo(sway+2,-30,12,-25,7,-16);c.quadraticCurveTo(12,-18,13,-24);
    c.bezierCurveTo(16,-12,16,-4,8,0);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff094';c.beginPath();c.moveTo(-6,-2);
    c.bezierCurveTo(-10,-11,0,-14,-1,-22);c.quadraticCurveTo(5,-17,3,-12);
    c.quadraticCurveTo(7,-14,8,-17);c.quadraticCurveTo(10,-7,5,-2);c.fill();
    if(!still){
      const drift=(t*.85+index*.37)%1;
      c.globalAlpha=1-drift;c.fillStyle='#ffe88b';c.beginPath();
      c.arc(sway+drift*4,-39-12*drift,1.7-drift*.8,0,Math.PI*2);c.fill();c.globalAlpha=1;
    }
  }
  const bead=c.createRadialGradient(-2,-4,.3,1,-1,7.5);
  bead.addColorStop(0,lit?'#fffce1':'#a3998e');bead.addColorStop(.30,lit?'#ffe279':'#62574f');
  bead.addColorStop(.60,lit?'#d75b18':'#302a2a');bead.addColorStop(1,lit?'#772b19':'#151319');
  c.fillStyle=bead;c.strokeStyle=lit?'#ffe09e':'#a17d656e';c.lineWidth=1;
  c.beginPath();c.ellipse(0,-1,7.2,5.7,0,0,Math.PI*2);c.fill();c.stroke();c.restore();
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
    label(String(chain),502,468,'italic 900 49px Georgia',gold);
    label('연속',552,464,'900 20px sans-serif','#ffe7a1');
  }
  const still=Boolean(quietCabinet.matches);
  for(let i=previousEmbers;i<count;i++)ignitionTimes[i]=t;
  previousEmbers=count;
  for(let i=0;i<5;i++)drawEmber(c,423+i*31,525,i,t,i<count,still);
  c.restore();
}
