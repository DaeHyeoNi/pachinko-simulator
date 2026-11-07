'use strict';

// Time is counted from heso entry, including the battle before the reels appear.
const reelTiming = {
  begin: 6.4, leftStop: 8.85, rightStop: 10.4,
  pushDeadline: 14.25, normalStop: 15.15, luckyRun: 5.6, hold: 3.5
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

function drawReelReveal(ctx, ticket) {
  const t=ticket.elapsed, finish=reelStopTime(ticket);
  ctx.save();
  const panel=ctx.createRadialGradient(300,269,20,300,300,335);
  panel.addColorStop(0,ticket.lucky?'#572748':'#323849');
  panel.addColorStop(.62,ticket.lucky?'#21162e':'#1b2030');
  panel.addColorStop(1,'#090d16');
  ctx.fillStyle=panel;ctx.fillRect(0,0,600,600);
  ctx.lineWidth=1;
  for(let i=0;i<38;i++){
    const x=(i*83.7+t*(8+i%5))%610;
    const y=145+(i*59.6)%295;
    ctx.fillStyle=i%4?'#cda46b65':'#fee1a3';ctx.fillRect(x,y,1.5,1.5);
  }
  const outer=[reelTiming.leftStop,finish,reelTiming.rightStop];
  const centerY=294, height=155, width=130, gap=13;
  const text=(word,x,y,size,color)=>{
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold '+size+'px "Malgun Gothic",sans-serif';ctx.fillText(word,x,y);
  };
  for(let i=0;i<3;i++){
    const x=300+(i-1)*(width+gap), locked=t>=outer[i];
    const caseTint=ticket.lucky&&i===1?'#95614e':'#917853';
    ctx.fillStyle='#080b10';ctx.strokeStyle=locked?'#efc78a':caseTint;ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(x-width/2,centerY-height/2,width,height,9);ctx.fill();ctx.stroke();
    ctx.save();ctx.clip();
    const back=ctx.createLinearGradient(0,centerY-height/2,0,centerY+height/2);
    back.addColorStop(0,'#171621');back.addColorStop(.46,ticket.lucky?'#6a3049':'#593329');back.addColorStop(1,'#211923');
    ctx.fillStyle=back;ctx.fillRect(x-width/2,centerY-height/2,width,height);
    const digit=ticket.digits[i];
    function printDigit(n,offset){
      const y=centerY+offset;
      const ink=ctx.createLinearGradient(0,y-64,0,y+55);
      if(ticket.won&&t>=finish){
        const hue=(t-finish)*100+i*35;
        ink.addColorStop(0,'#ffffed');
        for(let band=1;band<=6;band++)ink.addColorStop(band/7,'hsl('+(hue+band*49)+' 92% 69%)');
        ink.addColorStop(1,'#fff0b2');
      }else{
        ink.addColorStop(0,'#ffffed');ink.addColorStop(.48,'#f8d788');ink.addColorStop(.52,'#c38344');ink.addColorStop(1,'#fae7be');
      }
      ctx.font='900 italic 119px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.lineWidth=4;ctx.strokeStyle='#31181e';ctx.strokeText(n,x-2,y+4);ctx.fillStyle=ink;ctx.fillText(n,x-2,y+4);
    }
    if(i===1&&chanceIsReady(ticket)){
      printDigit('X',0);
    } else if(i===1&&ticket.lucky&&ticket.pushTime!=null){
      const remaining=Math.max(0,finish-t);
      // Integer crossings alternate 6 and 7; the last one lands on the ticket.
      const phase=1.1*remaining+1.45*remaining*remaining;
      const step=Math.floor(phase), frac=phase-step;
      const alternate=n=>(n%2===0?digit:(digit===7?6:7));
      printDigit(alternate(step),frac*height);printDigit(alternate(step+1),(frac-1)*height);
    } else {
      const remaining=Math.max(0,outer[i]-t);
      const phase=remaining<1.8?1.15*remaining*remaining:3.726+(remaining-1.8)*4.14;
      const step=Math.floor(phase),frac=phase-step;
      const wrap=n=>(digit-1+n)%9+1;
      printDigit(wrap(step),frac*height);printDigit(wrap(step+1),(frac-1)*height);
    }
    ctx.restore();
  }
  if(ticket.lucky&&t>=reelTiming.rightStop && t<finish){
    text('LUCKY CHANCE',300,183,30,'#ffe5a6');
    if(chanceIsReady(ticket)){
      text('중앙 PUSH를 누르세요',300,402,25,'#fff1ce');
      ctx.fillStyle='#51433c';ctx.fillRect(218,428,164,4);
      ctx.fillStyle='#ffd074';ctx.fillRect(218,428,164*(reelTiming.pushDeadline-t)/(reelTiming.pushDeadline-reelTiming.rightStop),4);
    }else if(ticket.pushTime!=null){
      text('PUSH!',300,405,25,'#ffd689');
    }
  }else if(t>=finish){
    text(ticket.won?'대당첨':'추첨 종료',300,402,ticket.won?41:26,ticket.won?'#ffe39a':'#e5d9c3');
  }
  if(ticket.won && t>=finish+1.55)drawJackpotAward(ctx,t-finish-1.55);
  // Crossfade out of the last combat frame instead of snapping to the reels.
  if(t<reelTiming.begin+.45){
    ctx.globalAlpha=1-(t-reelTiming.begin)/.45;
    drawBattle(ctx,reelTiming.begin-.05,ticket.variant,ticket.digits,ticket.won);
  }
  ctx.restore();
}
