'use strict';
const $ = id => document.getElementById(id);
const cv = $('board'), g = cv.getContext('2d'), rand = Math.random, TAU = 2*Math.PI;
const tray = new BallTray($('tray'));
const cabinet = document.querySelector('.cabinet');
const STACK_LIMIT = 5, ODDS = 319.7, ATTACKER_CAPACITY = 30, BATTLE_DURATION = 9;
let stock=0, shots=0, hits=0, wins=0, now=0, lastShot=-1;
let sound=false, ac, force=0, mode='empty', insertion=0, payout=0, payoutClock=0, rightHits=0;
let warningUntil=0, warningMessage='', activeDraw=null, waiting=[], reels=[7,7,7], gateOpened=0;
let balls=[], pegs=[], sparks=[], hasResult=false;
const standby=document.createElement('canvas');
standby.width=standby.height=600;
drawBattle(standby.getContext('2d'),1.05,0,[0,0,0],false);
const guideRails=[[33,356,84,423],[567,356,516,423],[60,470,93,493],[505,470,472,493]];
const rails=[...guideRails,[196,267,204,239],[204,239,230,224],[230,224,370,224],[370,224,396,239],[396,239,404,267],[196,267,196,340],[404,267,404,340],[196,340,217,359],[217,359,300,375],[300,375,383,359],[383,359,404,340]];
function peg(x,y,r=3.7){pegs.push({x,y,r,light:0})}
for(let row=0;row<10;row++){
  const y=78+row*43;
  for(let col=0;col<12;col++){
    const x=41+col*47+(row%2)*22;
    if(x>562||((x-300)/285)**2+((y-265)/259)**2>1.07||(x>177&&x<424&&y>208&&y<385)) continue;
    peg(x+Math.sin(col*2+row)*7,y+Math.cos(row+col)*6);
  }
}
peg(289,511,3.6); peg(311,511,3.6);
const handle = new RotaryHandle($('handle'), value => {force=value;});

function line(x,y,a,b,color,w){g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.lineWidth=w;g.strokeStyle=color;g.stroke()}
function circle(x,y,r,c){g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=c;g.fill()}
function metal(y,h){let grd=g.createLinearGradient(0,y,0,y+h);[[0,'#f1d3a0'],[.17,'#926a3d'],[.38,'#3d291d'],[.68,'#aa8553'],[1,'#553822']].forEach(([v,c])=>grd.addColorStop(v,c));return grd}
function box(x,y,w,h,r,c,stroke){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=c;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke()}}
function txt(t,x,y,font,c){g.textAlign='center';g.font=font;g.fillStyle=c;g.fillText(t,x,y)}
function draw(){let d=Math.min(2,devicePixelRatio||1),size=Math.max(1,Math.round(cv.clientWidth*d));if(cv.width!==size){cv.width=cv.height=size}g.setTransform(size/600,0,0,size/600,0,0);g.clearRect(0,0,600,600);
let sh=g.createRadialGradient(300,260,170,300,280,390);sh.addColorStop(0,'#0c080800');sh.addColorStop(1,'#120c09c9');g.fillStyle=sh;g.fillRect(0,0,600,600);
for(let [x,y,a,b] of guideRails){line(x,y+3,a,b+3,'#120d0b',8);line(x,y,a,b,'#82603d',6);line(x,y-1,a,b-1,'#dfbf87',1.6)}
g.save();
g.translate(300,297);
const bezel=[[-108,-53],[-83,-72],[83,-72],[108,-53],[108,43],[84,62],[0,78],[-84,62],[-108,43]];
g.beginPath();
bezel.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
g.closePath();g.fillStyle=metal(-72,150);g.fill();g.strokeStyle='#291a12';g.lineWidth=4;g.stroke();
box(-99,-54,198,110,9,'#201619','#d2ad72');
txt('◆   G I N K Y O   ◆',0,-39,'bold 9px Georgia','#e4bf84');
if(!hasResult){
  g.drawImage(standby,0,105,600,360,-92,-33,184,78);
} else {
  for(let j=0;j<3;j++){
    const x=-88+j*59;
    const enamel=g.createLinearGradient(0,-30,0,44);
    enamel.addColorStop(0,'#52271e');enamel.addColorStop(.45,'#9d4430');enamel.addColorStop(1,'#351a17');
    box(x,-30,55,70,3,enamel,'#92673c');
    txt(reels[j],x+27,28,'bold italic 57px Georgia','#ffdda2');
  }
}
for(let i=0;i<9;i++)circle(-72+i*18,58-Math.abs(i-4)*1.8,2.3,activeDraw||i%2?'#f5c183':'#9c7046');
g.restore();
for(let p of pegs){circle(p.x+1.5,p.y+2.5,p.r+1,'#120e0bc4');circle(p.x,p.y,p.r,p.light?'#ffce80':'#695742');circle(p.x-.6,p.y-.8,p.r*.75,'#cfbaa0');circle(p.x-1.2,p.y-1.6,1.3,'#fff1d2')}
// Only the opening between the two gold nails accepts a start ball.
box(287,521,26,12,4,'#21140f','#bb935e');
line(293,521,307,521,'#060606',4);
txt('始動',300,549,'bold 12px serif','#f3cc81');
g.save();
g.beginPath();g.moveTo(576,175);g.bezierCurveTo(596,275,575,407,561,467);
g.strokeStyle='#a595785e';g.lineWidth=3;g.stroke();
g.restore();
if (mode==='right') {
  box(519,473,62,17,4,'#752f17','#ffc474');
  const lift = Math.min(1,(now-gateOpened)*3);
  line(520,473,520+13*(1-lift),473-16*lift,'#ffd684',4);
  line(580,473,580-13*(1-lift),473-16*lift,'#ffd684',4);
  txt('▶ 入賞',550,486,'bold 13px serif','#ffdf99');
}
txt('•    O U T    •',300,583,'bold 11px Georgia','#d4b383');
for(let b of balls){circle(b.x+2,b.y+3,5,'#100e0cb0');let gr=g.createRadialGradient(b.x-1.5,b.y-2,0,b.x,b.y,5.4);gr.addColorStop(0,'#fff');gr.addColorStop(.28,'#f1f4f0');gr.addColorStop(.6,'#8b9694');gr.addColorStop(.85,'#414642');gr.addColorStop(1,'#cfd2c4');circle(b.x,b.y,5,gr)}
for(let p of sparks){g.globalAlpha=Math.min(1,p.t*2);circle(p.x,p.y,1.7,'#ffcb83')}g.globalAlpha=1;if(activeDraw) drawBattle(g,activeDraw.elapsed,activeDraw.variant,activeDraw.digits,activeDraw.won);
}
function msg(value){$('log').textContent=value}
function stackCount(){return waiting.length + Number(Boolean(activeDraw))}
function status(){
  for(const [key,value] of Object.entries({stock,shots,hits,wins})) $(key).textContent=value.toLocaleString();
  const count=stackCount();
  const stack=$('stack');
  Array.from(stack.querySelectorAll('i')).forEach((lamp,index)=>{
    lamp.classList.toggle('lit',index<count);
    lamp.classList.toggle('active',index===0 && Boolean(activeDraw));
  });
  stack.setAttribute('aria-label','추첨 스택 '+count+' / 5');
  if($('stackCount')) $('stackCount').textContent=count+' / 5';
  $('phase').textContent=insertion?'지폐 인식 중':mode==='empty'?'지폐 투입 대기':mode==='right'?
    '우타 · '+(1+Math.floor(rightHits/10))+' 라운드 · '+(rightHits%10)+'/10':activeDraw?'헤소 추첨 중':'일반 · 좌타';
  $('insert').disabled=Boolean(insertion)||stock>=250||payout>0;
  $('handle').inert=mode==='empty'||Boolean(insertion);
}
function tone(f,d=.05,vol=.045,type='sine'){
  if(!sound||!ac)return;
  const o=ac.createOscillator(),a=ac.createGain();
  o.type=type;o.frequency.value=f;a.gain.setValueAtTime(vol,ac.currentTime);
  a.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(a);a.connect(ac.destination);o.start();o.stop(ac.currentTime+d);
}
function insertNote(){
  if(insertion||payout||stock>=250)return;
  insertion=1.25;
  $('bank').classList.add('inserting');tone(140,.28,.04,'triangle');msg('지폐를 인식하고 있습니다.');status();
}
function advanceTray(dt){
  if(insertion){
    insertion=Math.max(0,insertion-dt);
    if(!insertion){
      $('bank').classList.remove('inserting');
      if(mode==='empty')mode='normal';
      payout+=250;msg('지폐 인식 완료 · 구슬 250개를 대여합니다.');status();
    }
  }
  if(payout){
    payoutClock+=dt;
    while(payout && payoutClock>=.018){
      payoutClock-=.018;payout--;tray.deposit();stock++;
      if(payout%7===0)tone(1450+rand()*550,.025,.015);
      status();
    }
    if(!payout)payoutClock=0;
  }
  tray.advance(dt);
}
function warn(message,duration=1){
  warningMessage=message;warningUntil=now+duration;
}
function updateWarning(){
  const value=mode==='right'&&force<95?'▶ 우타 필요 · 손잡이를 끝까지 돌리세요':
    mode==='normal'&&force>=95?'◀ 좌타로 돌리세요 · 우타 구슬 반환':now<warningUntil?warningMessage:'';
  const el=$('warning');
  if(value && el.textContent!==value)el.textContent=value;
  el.hidden=!value;
}
function fire(){
  if(!stock||!force||insertion||mode==='empty'||$('guide').open||!tray.take())return;
  stock--;shots++;lastShot=now;
  const right=force>=95;
  const route=right?(mode==='right'?'attacker':'return'):'field';
  if(route==='return')warn('◀ 좌타로 돌리세요 · 구슬 반환');
  balls.push({x:16,y:533,t:0,launch:true,route,vx:0,vy:0,
    end:right?1.42:.40+force*.004+rand()*.055});
  tone(170,.075,.027,'triangle');status();
}
function drawTicket(){
  const won=rand()<1/ODDS;
  const digit=()=>1+Math.floor(rand()*9);
  const first=digit(),second=won?first:digit();
  let third=won?first:digit();
  if(!won&&first===second&&second===third)third=third%9+1;
  return {won,digits:[first,second,third],variant:Math.floor(rand()*3),elapsed:0};
}
function startNext(){
  if(activeDraw||mode!=='normal'||!waiting.length)return;
  activeDraw=waiting.shift();tone(390,.2,.035,'sawtooth');
}
function score(){
  hits++;payout++;
  if(stackCount()<STACK_LIMIT){
    waiting.push(drawTicket());startNext();
    msg('헤소 입상 · 기체 전투 개시');
  } else msg('헤소 입상 · 보류 만석 · 상구 1개');
  tone(820,.2);status();
}
function advanceBattle(dt){
  if(!activeDraw)return;
  const previous=activeDraw.elapsed;
  activeDraw.elapsed+=dt;
  for(const [at,note] of [[1.4,180],[2.7,85],[3.7,120],[4.7,95],[5.8,65],[6.7,500],[7.15,620],[7.65,790]]){
    if(previous<at&&activeDraw.elapsed>=at)tone(note,.16,.05,note<200?'sawtooth':'triangle');
  }
  if(activeDraw.elapsed<BATTLE_DURATION)return;
  const result=activeDraw;
  activeDraw=null;reels=result.digits;hasResult=true;
  if(result.won){
    wins++;mode='right';rightHits=0;gateOpened=now;warningUntil=0;
    msg('대당첨! 우타로 어태커를 노리세요.');tone(960,.45);
  } else {
    msg('추첨 종료 · 다음 헤소 입상을 노리세요.');startNext();
  }
  status();
}
function collectAttacker(){
  if(mode!=='right'){payout++;return}
  rightHits++;payout+=15;tone(1250,.12);
  if(rightHits===ATTACKER_CAPACITY){
    mode='normal';warningUntil=0;msg('3라운드 완료 · 상구 450개 · 좌타로 복귀하세요.');
    startNext();
  }else if(rightHits%10===0){gateOpened=now;msg('다음 라운드 · 우타를 유지하세요.')}
  status();
}
function bounce(b,x,y,r,coef){
  const dx=b.x-x,dy=b.y-y,dist=Math.hypot(dx,dy);
  if(dist>=r||!dist)return false;
  const nx=dx/dist,ny=dy/dist;
  b.x=x+nx*r;b.y=y+ny*r;
  const speed=b.vx*nx+b.vy*ny;
  if(speed>=0)return false;
  b.vx-=speed*(1+coef)*nx;b.vy-=speed*(1+coef)*ny;
  if(Math.abs(nx)<.045)b.vx+=(rand()<.5?-1:1)*15;
  return true;
}
function advanceBall(b,dt){
  b.t+=dt;
  if(b.launch){
    const t=Math.min(b.t,b.end);
    if(t<.30){b.x=16;b.y=533-1190*t}
    else {const u=(t-.30)*2.65;b.x=300-284*Math.cos(u);b.y=176-150*Math.sin(u)}
    if(b.t>=b.end){
      b.launch=false;
      const u=(b.end-.30)*2.65;
      b.vx=240*Math.sin(u);b.vy=-200*Math.cos(u);
      if(b.route!=='field'){b.vx=-24;b.vy=150}
    }
    return false;
  }
  const previousY=b.y,previousX=b.x;
  b.vy+=510*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.route!=='field'){
    if(b.y<475)return false;
    if(b.route==='return'){payout++;msg('평상시 우타 구슬을 받침대로 반환했습니다.')}
    else if(b.x>=519 && b.x<=581)collectAttacker();
    return true;
  }
  if(b.x<10||b.x>590){b.x=Math.max(10,Math.min(590,b.x));b.vx*=-.66}
  if(b.y<8){b.y=8;b.vy=Math.abs(b.vy)*.72}
  for(const p of pegs){
    if(Math.abs(b.x-p.x)>10||Math.abs(b.y-p.y)>10)continue;
    if(bounce(b,p.x,p.y,p.r+5,.56)){p.light=.12;if(Math.abs(b.vy)+Math.abs(b.vx)>60&&rand()<.45)tone(1100+p.x,.035,.012)}
  }
  for(const [x,y,a,z] of rails){
    if(b.y<Math.min(y,z)-8||b.y>Math.max(y,z)+8)continue;
    const dx=a-x,dy=z-y,u=Math.max(0,Math.min(1,((b.x-x)*dx+(b.y-y)*dy)/(dx*dx+dy*dy)));
    bounce(b,x+u*dx,y+u*dy,7,.48);
    if(y===224&&z===224&&b.y<224&&224-b.y<9)b.vx+=(b.x<300?-1:1)*210*dt;
  }
  if(previousY<520&&b.y>=520){
    const crossingX=previousX+(b.x-previousX)*(520-previousY)/(b.y-previousY);
    if(Math.abs(crossingX-300)<3.5 && mode==='normal'){score();return true}
  }
  return b.y>610||b.t>23;
}
function step(dt){
  now+=dt;advanceTray(dt);
  if(force && now-lastShot>=.60)fire();
  for(let i=balls.length-1;i>=0;i--)if(advanceBall(balls[i],dt))balls.splice(i,1);
  for(const p of pegs)p.light=Math.max(0,p.light-dt);
  advanceBattle(dt);updateWarning();
}
let last=performance.now(),acc=0;
function frame(ms){
  acc+=Math.min(.06,(ms-last)/1000);last=ms;
  while(acc>=1/120){step(1/120);acc-=1/120}
  const fx=activeDraw?.won && activeDraw.elapsed>=6.4?'jackpot':mode==='right'?'payout':'idle';
  if(cabinet.dataset.fx!==fx)cabinet.dataset.fx=fx;
  draw();tray.draw();requestAnimationFrame(frame);
}
$('insert').onclick=insertNote;
$('sound').onclick=()=>{
  sound=!sound;
  if(sound){ac??=new AudioContext();ac.resume();tone(660,.12)}
  $('sound').querySelector('span').textContent='사운드 '+(sound?'ON':'OFF');
};
$('help').onclick=()=>{handle.reset();$('guide').showModal()};
$('close').onclick=()=>$('guide').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)handle.reset()});
status();requestAnimationFrame(frame);
