'use strict';
const $ = id => document.getElementById(id);
const cv = $('board'), g = cv.getContext('2d'), rand = Math.random, TAU = 2*Math.PI;
const tray = new BallTray($('tray'));
const cabinet = document.querySelector('.cabinet');
const STACK_LIMIT = 5, ODDS = 319.7;
const ROUND_CAPACITY=10, ROUND_SECONDS=29.5, ROUND_GAP=1.5;
const rush=new RushSession();
let bonusRounds=3, supportSpin=null, supportStartedAt=0, supportEndedAt=null;
const attacker={round:0,hits:0,inTransit:0,open:false,transitionAt:0};
let stock=0, shots=0, hits=0, wins=0, now=0, lastShot=-1;
let sound=false, ac, force=0, mode='empty', insertion=0, payout=0, payoutClock=0, rightHits=0;
let warningUntil=0, warningMessage='', activeDraw=null, waiting=[];
let balls=[];
const field=createFieldwork();
const pegs=field.pegs;
const bank=new BanknoteAcceptor();
const standby=document.createElement('canvas');
let bonusStartedAt=0;
standby.width=standby.height=600;
drawBattle(standby.getContext('2d'),1.05,0,[0,0,0],false);
// One outline drives both collisions and the molded display surround.
const displayOutline=makeDisplayOutline();
const bezelBacking=makeBezelBacking(displayOutline);
// The LCD glass stays flat inside its gasket. A separate clear molded hood
// above it has a crown and two downhill shoulders, visible at their contact lines.
const roofCap=[bezelTopLeft,[294,36],[301,35.5],[308,36],bezelTopRight];
const roofEdges=roofCap.slice(1).map((v,i)=>[...roofCap[i],...v]);
const rails = [...field.rails, ...roofEdges, ...displayOutline.map(([x,y],i)=>{
  const [u,v] = displayOutline[(i+1)%displayOutline.length];
  return [x,y,u,v];
}),[receiver.x,receiver.clearanceY+7,571,153],
  ...rightTrough.common.slice(1).map(([x,y,w],i)=>{
    const [startX,startY,startWidth]=rightTrough.common[i];
    return [startX-startWidth,startY,x-w,y];
  })];
// An even chrome gasket separates the upper LCD from the surrounding pin lanes.
const lcd = {
  glass:displayOutline.map(([x,y])=>[297+(x-297)*.973,207+(y-207)*.968]),
  centerX:297,centerY:207,width:344
};
const handle = new RotaryHandle($('handle'), value => {force=value;});

function line(x,y,a,b,color,w){g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.lineWidth=w;g.strokeStyle=color;g.stroke()}
function circle(x,y,r,c){g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=c;g.fill()}
function metal(y,h){let grd=g.createLinearGradient(0,y,0,y+h);[[0,'#f1d3a0'],[.17,'#926a3d'],[.38,'#3d291d'],[.68,'#aa8553'],[1,'#553822']].forEach(([v,c])=>grd.addColorStop(v,c));return grd}
function box(x,y,w,h,r,c,stroke){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=c;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke()}}
function txt(t,x,y,font,c){g.textAlign='center';g.font=font;g.fillStyle=c;g.fillText(t,x,y)}
function drawDisplay() {
  function traceBezel(points){
    g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
  }
  g.save();
  g.lineJoin='round';
  if(bezelBacking)g.drawImage(bezelBacking,0,0,600,600);
  g.beginPath();
  roofCap.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  g.closePath();
  const hood=g.createLinearGradient(0,35,0,72);
  hood.addColorStop(0,'#c8f8ff82');hood.addColorStop(.24,'#6f9ba961');
  hood.addColorStop(.68,'#2433475c');hood.addColorStop(1,'#bfd8e16b');
  g.fillStyle=hood;g.fill();
  for(const edge of roofEdges){
    line(...edge,'#152635c9',4);
    line(...edge,'#c9e9f4',1.2);
  }
  traceBezel(displayOutline,3);
  g.fillStyle='#364950'; g.fill();
  g.strokeStyle='#182932'; g.lineWidth=2.3; g.stroke();
  const trim=g.createLinearGradient(130,100,459,332);
  for(const [at,color] of [[0,"#e9fbff"],[.16,"#7396ae"],[.32,"#c9dde6"],[.45,"#3b5368"],[.62,"#bed8e8"],[.83,"#687791"],[1,"#e9faff"]])trim.addColorStop(at,color);
  g.fillStyle=trim;g.fill();
  traceBezel(displayOutline,3);g.strokeStyle='#e0e8e7';g.lineWidth=1.3;g.stroke();
  traceBezel(lcd.glass,3.5);g.strokeStyle='#d4edf05c';g.lineWidth=1.4;g.stroke();
  g.clip();
  g.translate(lcd.centerX,lcd.centerY);
  const sceneScale=lcd.width/600;
  g.scale(sceneScale,sceneScale);g.translate(-300,-300);
  if(activeDraw) drawReelReveal(g,activeDraw);
  else if(mode==='right'){
    const finished=attacker.round===bonusRounds && !attacker.open && !attacker.inTransit;
    drawBonusRound(g,now-bonusStartedAt,attacker.round,attacker.hits,rightHits*15,finished,bonusRounds,rush.chain);
  }
  else if(mode==='support') renderSupport(g);
  else g.drawImage(standby,0,0);
  g.restore();
}
function launchTrack(offset=0){
  const path=new Path2D();
  path.moveTo(16-offset,533);path.lineTo(16-offset,176);
  path.ellipse(300,176,284+offset,150+offset,0,Math.PI,Math.PI*1.5);
  return path;
}
const launchGroove=launchTrack(),launchGlassLip=launchTrack(5.4);
function drawCoveredLaunch(){
  g.save();g.lineCap='round';
  g.strokeStyle='#171b20b0';g.lineWidth=12;g.stroke(launchGroove);
  for(const b of balls){
    if(!b.launch)continue;
    g.globalAlpha=.84;tray.drawPlayfieldBall(g,b);
  }
  g.globalAlpha=1;
  g.lineWidth=10;g.strokeStyle='#63839824';g.stroke(launchGroove);
  g.lineWidth=1.15;g.strokeStyle='#c1d4d264';g.stroke(launchGlassLip);
  g.beginPath();g.moveTo(300,crestY+4);
  g.quadraticCurveTo((300+receiver.x)/2,crestY+4,receiver.x,receiver.clearanceY+7);
  g.lineWidth=2.5;g.strokeStyle='#364a584f';g.stroke();
  g.lineWidth=.85;g.strokeStyle='#d5eef48c';g.stroke();
  g.restore();
}
let gatePose=0, supportGatePose=0, lastGateFrame=0;
function supportDoorOpen(){
  return mode==='support'&&supportCanAccept()&&!balls.some(ball=>ball.route==='support');
}
function drawChute(){
  g.save();
  g.lineJoin='round';
  g.lineCap='round';
  for(const [route,points] of Object.entries(rightTrough)) {
    if(!Array.isArray(points))continue;
    const active=(attacker.open&&['common','lowerCommon','attacker'].includes(route))||
      (supportDoorOpen()&&(route==='common'||route==='support'));
    g.beginPath();
    points.forEach(([x,y,w],i)=>i?g.lineTo(x-w,y):g.moveTo(x-w,y));
    for(let i=points.length-1;i>=0;i--){const [x,y,w]=points[i];g.lineTo(x+w,y);}
    g.closePath();g.fillStyle='#162b359c';g.fill();
    for(const side of [-1,1]){
      // The two branch entrances meet the common trough. Taper the divider
      // into a pointed tongue at the fork instead of sealing it with an end cap.
      const branchDivider=(side===-1&&(route==='return'||route==='lowerCommon'))||
        (side===1&&(route==='attacker'||route==='support'));
      g.beginPath();
      points.forEach(([x,y,w],i)=>{
        const railX=branchDivider&&!i?x:x+side*w;
        if(i)g.lineTo(railX,y);else g.moveTo(railX,y);
      });
      g.strokeStyle='#152028';g.lineWidth=4.8;g.stroke();
      g.strokeStyle=active?'#f7c993':'#b3c8ce';g.lineWidth=2.5;g.stroke();
      g.strokeStyle='#f4ffff';g.lineWidth=.75;g.stroke();
    }
  }
  for(const [x,y] of [[578,159],[583,236],[578,323],[565,399]]){
    line(x-2,y-2,x,y+1,mode==='right'?'#f4d9a4':'#a5cbd4',1.6);
    line(x,y+1,x+2,y-2,mode==='right'?'#f4d9a4':'#a5cbd4',1.6);
  }
  // The clear transfer sleeve marks where a full-strength shot enters the lane.
  line(receiver.x,receiver.clearanceY+7,571,153,'#16303b',5);
  line(receiver.x,receiver.clearanceY+7,571,153,'#b8d5d8',2.4);
  g.translate(577,139);g.rotate(-.15);
  box(-11,-3,22,6,1.8,'#526872','#d6dfdd');
  g.fillStyle='#152831';g.fillRect(-6,-2,12,4);g.restore();
}
function drawGates(){
  const elapsed=Math.max(0,now-lastGateFrame); lastGateFrame=now;
  const target=attacker.open?1:0;
  gatePose=target+(gatePose-target)*Math.exp(-12*elapsed);
  g.save();g.lineCap='round';
  const supportTarget=supportDoorOpen()?1:0;
  supportGatePose=supportTarget+(supportGatePose-supportTarget)*Math.exp(-18*elapsed);
  // The upper tulip feeds the right start sensor independently of the lower attacker.
  box(527,383,29,15,4,'#142a31','#9abebf');
  box(532,383,20,8,2,'#0c151d',supportTarget?'#a4fff5':'#758b95');
  const paddle=-.70-supportGatePose*.9;
  const tipX2=562+20*Math.cos(paddle),tipY2=356+20*Math.sin(paddle);
  line(562,356,tipX2,tipY2,'#213740',5);
  line(562,355,tipX2,tipY2-1,supportTarget?'#91ffeb':'#b8c8cc',2.6);
  circle(562,356,3,'#d4e0dc');
  txt('電チュー',542,396,'bold 6px sans-serif',supportTarget?'#b1ffeb':'#bacacd');
  // The steel door blocks the inner fork at rest. Retracted, it forms the
  // right lip of the attacker so incoming balls drop into the inner pocket.
  box(516,474,32,16,4,'#15232c','#adbec0');
  box(520,473,23,9,3,target?'#351d0e':'#292d30',target?'#ffd08a':'#77888c');
  const angle=-.56-1.1*gatePose;
  const hingeX=539,hingeY=453;
  const tipX=hingeX+21*Math.cos(angle),tipY=hingeY+21*Math.sin(angle);
  line(hingeX,hingeY,tipX,tipY,'#152129',6);
  line(hingeX,hingeY-.7,tipX,tipY-.7,target?'#f4b670':'#a0b4ba',3.4);
  circle(hingeX,hingeY,3.8,'#2c3538');circle(hingeX-.5,hingeY-.7,2,'#e1e0cc');
  circle(544,486,1.6,target?'#ffd382':'#617575');
  txt('入賞',531,488,'bold 7px serif',target?'#ffd499':'#bbc9c6');
  // Rubber-lined outlet in the lower apron returns non-scoring right shots.
  g.translate(487,550);g.rotate(-.48);
  box(-13,-2,26,13,4,'#39444a','#9eacac');
  box(-10,0,20,7,2,'#090e10','#515e62');
  g.restore();
  txt('반환',485,570,'bold 9px sans-serif','#c6d3d0');
}
function draw(){let d=Math.min(2,devicePixelRatio||1),size=Math.max(1,Math.round(cv.clientWidth*d));if(cv.width!==size){cv.width=cv.height=size}g.setTransform(size/600,0,0,size/600,0,0);g.clearRect(0,0,600,600);
let sh=g.createRadialGradient(300,260,170,300,280,390);sh.addColorStop(0,'#0c080800');sh.addColorStop(1,'#120c09c9');g.fillStyle=sh;g.fillRect(0,0,600,600);
drawCoveredLaunch();
drawDisplay();
drawStageHardware(g);
for(const ball of balls){
  if(ball.route==='warp'||ball.route==='stage')tray.drawPlayfieldBall(g,ball);
}
drawStageGlass(g);
drawFieldwork(g,field,now);
// Only the opening between the two gold nails accepts a start ball.
const mouth=field.heso;
box(mouth.x-15,mouth.y+7,30,13,4,'#302e30','#bb935e');
line(mouth.x-8,mouth.y+8,mouth.x+8,mouth.y+8,'#080808',4);
txt('始動',mouth.x,mouth.y+29,'bold 10px serif','#f3cc81');
drawChute();drawGates();
for(const ball of balls){
  if(ball.launch||ball.route==='warp'||ball.route==='stage')continue;
  tray.drawPlayfieldBall(g,ball);
}

drawOccludingNailCaps(g,field,balls);
}
function msg(value){$('log').textContent=value}
function stackCount(){return waiting.length + Number(Boolean(activeDraw))}
function status(){
  for(const [key,value] of Object.entries({stock,shots,hits,wins})) $(key).textContent=value.toLocaleString();
  const rightLamps=mode==='support'||(mode==='right'&&rush.chain>1);
  const active=rightLamps?Boolean(supportSpin):Boolean(activeDraw);
  const count=rightLamps?rush.queue.length+Number(active):stackCount();
  const stack=$('stack');
  Array.from(stack.querySelectorAll('i')).forEach((lamp,index)=>{
    lamp.classList.toggle('lit',index<count);
    lamp.classList.toggle('active',index===0 && active);
  });
  stack.setAttribute('aria-label','추첨 스택 '+count+' / 5');
  if($('stackCount')) $('stackCount').textContent=count+' / 5';
  $('phase').textContent=insertion?'지폐 인식 중':mode==='empty'?'지폐 투입 대기':mode==='right'?
    '우타 · '+attacker.round+'/'+bonusRounds+' 라운드 · '+(attacker.open?'개방':'닫힘')+' · '+attacker.hits+'/10':
    mode==='support'?(rush.kind==='st'?'RUSH':'찬스타임')+' · 남은 '+rush.remaining+'회 · '+rush.chain+'연속':activeDraw?'헤소 추첨 중':'일반 · 헤소 노림';
  $('insert').disabled=Boolean(insertion)||stock>=250||payout>0;
  $('handle').inert=mode==='empty'||Boolean(insertion);
}
function insertNote(){
  if(insertion||payout||stock>=250)return;
  insertion=bank.duration;
  bank.open();
  $('bank').classList.add('inserting');msg('지폐를 인식하고 있습니다.');status();
}
function advanceTray(dt){
  if(insertion){
    insertion=Math.max(0,insertion-dt);
    bank.render(bank.duration-insertion);
    if(!insertion){
      bank.close();
      $('bank').classList.remove('inserting');
      if(mode==='empty')mode='normal';
      payout+=250;msg('지폐 인식 완료 · 구슬 250개를 대여합니다.');status();
    }
  }
  if(payout){
    payoutClock+=dt;
    while(payout && payoutClock>=.018){
      payoutClock-=.018;payout--;tray.deposit();stock++;
      status();
    }
    if(!payout)payoutClock=0;
  }
  tray.advance(dt);
}
function warn(message,duration=1){
  warningMessage=message;warningUntil=now+duration;
}
let directionAlert='', directionSince=0;
function updateWarning(){
  const rightPlay=mode==='right'||(mode==='support'&&supportEndedAt===null);
  const direction=rightPlay&&force<95?'right':mode==='normal'&&force>=95?'left':'';
  if(direction!==directionAlert){directionAlert=direction;directionSince=now;}
  const compact=rightPlay&&(!direction||now-directionSince>=1.65);
  const gateMessage=mode==='support'?'오른쪽 전동 입상구':attacker.open?'어태커 개방':attacker.round===bonusRounds?'어태커 닫힘 · 지급 마무리':'어태커 닫힘 · 다음 개방 대기';
  const value=compact?(direction?'▶ 우타 필요 · 끝까지 돌리세요':'▶ 우타 유지')+'  ·  '+gateMessage:
    direction==='right'?'▶ 우타 필요 · 손잡이를 끝까지 돌리세요':
    direction==='left'?'◀ 좌타로 돌리세요 · 우타 구슬 반환':now<warningUntil?warningMessage:'';
  const el=$('warning');
  if(compact!==el.classList.contains('compact'))el.classList.toggle('compact',compact);
  if(value && el.textContent!==value)el.textContent=value;
  el.hidden=!value;
}
function fire(){
  if(!stock||!force||insertion||mode==='empty'||$('guide').open)return;
  // A weak shot drops back through the launch throat before the next ball seats.
  if(balls.some(ball=>ball.launch && ball.head<riseToBend) || !tray.take())return;
  stock--;shots++;lastShot=now;
  const right=force>=95;
  if(right && mode==='normal')warn('◀ 좌타로 돌리세요 · 구슬 반환');
  balls.push(springShot(force,rand(),mode==='right'||mode==='support'?'attacker':'return'));
  BallAudio.launch(sound?ac:null);status();
}
// Each entry queues a complete presentation alongside its independently drawn outcome.
const battleScenes = ['검격 결투','에너지 포격전','궤도 미사일 요격','공중 추격전','전자기 역습','장갑열차 공성전'];
let upcomingScenes = [];
let lastScene = -1;
function nextBattleScene(){
  if (!upcomingScenes.length) {
    upcomingScenes = battleScenes.map((_,index)=>index);
    for (let end=upcomingScenes.length-1; end>0; end--) {
      const pick=Math.floor(rand()*(end+1));
      [upcomingScenes[end],upcomingScenes[pick]]=[upcomingScenes[pick],upcomingScenes[end]];
    }
    const end=upcomingScenes.length-1;
    if (upcomingScenes[end]===lastScene) {
      const pick=Math.floor(rand()*end);
      [upcomingScenes[end],upcomingScenes[pick]]=[upcomingScenes[pick],upcomingScenes[end]];
    }
  }
  lastScene=upcomingScenes.pop();
  return lastScene;
}
function drawTicket(){
  const won=rand()<1/ODDS;
  const digit=()=>1+Math.floor(rand()*9);
  const first=digit(),second=won?first:digit();
  let third=won?first:digit();
  if(!won&&first===second&&second===third)third=third%9+1;
  // Select the tease from the existing lottery result. In normal play about
  // 96% of Lucky Chances settle on 767, while overall jackpot odds stay 1/319.7.
  const lucky=rand() < (won ? 0.8 : 0.06);
  const matchingSides = first===third;
  const stage = won || lucky || (matchingSides && rand()<.38) ? 'battle' : matchingSides ? 'reach' : 'short';
  return {won,lucky,digits:lucky?[7,won?7:6,7]:[first,second,third],stage,
    variant:stage==='battle'?nextBattleScene():null,patrolOffset:rand()*18,elapsed:0,pushTime:null};
}
function forceWinningResult(ticket){
  if(!ticket||ticket.won)return;
  ticket.won=true;
  if(ticket.stage!=='battle'){ticket.stage='battle';ticket.variant=nextBattleScene();}
  ticket.digits.fill(ticket.lucky?7:ticket.digits[0]);
}
function startNext(){
  if(activeDraw||mode!=='normal'||!waiting.length)return;
  activeDraw=waiting.shift();
  if($('alwaysWin').checked)forceWinningResult(activeDraw);
  msg('헤소 추첨 · 도형 변동');
}
function score(){
  hits++;payout++;
  if(stackCount()<STACK_LIMIT){
    waiting.push(drawTicket());
    if(activeDraw)msg('헤소 입상 · 다음 추첨 보류');
    startNext();
  } else msg('헤소 입상 · 보류 만석 · 상구 1개');
  status();
}
function advanceBattle(dt){
  if(!activeDraw)return;
  activeDraw.elapsed+=dt;
  const finish=reelStopTime(activeDraw);
  if(activeDraw.elapsed<finish+drawTiming(activeDraw).hold)return;
  const result=activeDraw;
  activeDraw=null;
  drawReelReveal(standby.getContext('2d'),result,true);
  if(result.won){
    rush.beginFirst($('alwaysWin').checked);
    beginBonus(3);
    msg('대당첨! 우타로 어태커를 노리세요.');
  } else {
    msg('추첨 종료 · 다음 헤소 입상을 노리세요.');startNext();
  }
  status();
}
function beginBonus(rounds){
  bonusRounds=rounds;wins++;mode='right';rightHits=0;warningUntil=0;bonusStartedAt=now;
  openAttackerRound(1);
}
function supportCanAccept(){
  return mode==='support' && supportEndedAt===null && !supportSpin?.won && rush.canAccept();
}
function acceptSupportBall(){
  if(!supportCanAccept() || !rush.admit($('alwaysWin').checked))return false;
  payout++;
  status();
  return true;
}
function renderSupport(ctx){
  drawRushScreen(ctx,{kind:rush.kind,remaining:rush.remaining,chain:rush.chain,earned:rush.earned,
    elapsed:now-supportStartedAt,spinAge:supportSpin?now-supportSpin.started:-1,
    hit:Boolean(supportSpin?.won),ending:supportEndedAt!==null});
}
function advanceSupport(){
  if(mode!=='support')return;
  if(supportEndedAt!==null){
    if(now-supportEndedAt<2.5)return;
    renderSupport(standby.getContext('2d'));
    mode='normal';warningUntil=0;
    msg('우타 종료 · '+rush.chain+'연속 · 총 상구 '+rush.earned+'개 · 좌타로 복귀하세요.');
    startNext();status();return;
  }
  if(supportSpin){
    if(now-supportSpin.started<(supportSpin.won?3:.6))return;
    const won=supportSpin.won;supportSpin=null;
    if(won){
      rush.renew();beginBonus(10);
      msg(rush.chain+'연속 대당첨 · 우타 유지 · 10라운드');return;
    }
    status();
  }
  const next=rush.next();
  if(next){supportSpin={...next,started:now};status();}
  else if(!rush.remaining){supportEndedAt=now;status();}
}
function openAttackerRound(round){
  attacker.round=round;attacker.open=true;attacker.hits=0;
  attacker.transitionAt=now+ROUND_SECONDS;
  status();
}
function closeAttackerRound(){
  attacker.open=false;attacker.transitionAt=now+ROUND_GAP;
  msg(attacker.round===bonusRounds?'최종 라운드 마감':'라운드 마감 · 다음 개방을 기다리세요.');
  status();
}
function advanceAttacker(){
  if(mode!=='right'||now<attacker.transitionAt)return;
  if(attacker.open){closeAttackerRound();return}
  if(attacker.inTransit)return;
  if(attacker.round<bonusRounds){
    openAttackerRound(attacker.round+1);msg(attacker.round+'라운드 · 어태커 개방');
    return;
  }
  mode='support';warningUntil=0;supportStartedAt=now;supportEndedAt=null;supportSpin=null;
  rush.startSupport();
  msg((rush.kind==='st'?'RUSH 돌입 · 163회':'찬스타임 돌입 · 100회')+' · 우타를 유지하세요.');status();
}
function collectAttacker(){
  attacker.inTransit--;attacker.hits++;rightHits++;payout+=15;rush.earned+=15;
  status();
}
function bounce(b,x,y,r,coef){
  const dx=b.x-x,dy=b.y-y,dist=Math.hypot(dx,dy);
  if(dist>=r||!dist)return false;
  const nx=dx/dist,ny=dy/dist;
  b.x=x+nx*r;b.y=y+ny*r;
  const speed=b.vx*nx+b.vy*ny;
  if(speed>=0)return false;
  const restitution=speed< -18?coef:0;
  b.vx-=speed*(1+restitution)*nx;b.vy-=speed*(1+restitution)*ny;
  return true;
}
function recordPinHit(pin,speed,x){
  pin.light=.12;BallAudio.pin(sound?ac:null,speed,x);
}
function advanceBall(b,dt){
  b.previousX=b.x;b.previousY=b.y;b.freeStep=!b.launch;
  b.t+=dt;
  if(b.route==='warp'||b.route==='stage'){
    b.freeStep=false;moveStageBall(b,dt,balls);
    if(sound)BallAudio.rail(ac,b.route==='warp'?b.tubeSpeed:Math.abs(b.vx),b.x);
    return false;
  }
  if(b.launch){
    if(runLaunchGuide(b,dt)){
      payout++;
      msg('약하게 발사된 구슬이 레일을 되돌아와 반환됐습니다.');
      return true;
    }
    if(sound)BallAudio.rail(ac,Math.hypot(b.vx,b.vy),b.x);
    return false;
  }
  b.vy+=510*dt;
  if(b.route!=='field'){
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(!b.crossedSupportGate&&b.y>=rightTrough.supportGateY){
      b.crossedSupportGate=true;
      if(b.route==='attacker'&&mode==='support')b.route=supportDoorOpen()?'support':'return';
    }
    if(!b.crossedGate && b.y>=rightTrough.gateY){
      b.crossedGate=true;
      // The fork sensor closes the door on entry ten. A ball past that
      // sensor has earned its place even while the door is swinging shut.
      if(b.route==='attacker'&&attacker.open){
        attacker.inTransit++;
        if(attacker.hits+attacker.inTransit===ROUND_CAPACITY)closeAttackerRound();
      }else b.route='return';
    }
    if(containChute(b)&&sound)BallAudio.rail(ac,Math.hypot(b.vx,b.vy),b.x);
    return false;
  }
  // A cabinet crossfall of one tenth of a degree also lets a perfectly
  // centered test ball roll off a solitary pin. Acceleration is continuous.
  b.vx+=.89*dt;
  movePastPins(b,pegs,dt,recordPinHit);
  if(b.x<10||b.x>590){b.x=Math.max(10,Math.min(590,b.x));b.vx*=-.66}
  if(b.y<8){b.y=8;b.vy=Math.abs(b.vy)*.72}
  const wheelSpeed=Math.hypot(b.vx,b.vy);
  if(collideWindmill(b,field,dt))BallAudio.wheel(sound?ac:null,wheelSpeed,b.x);
  for(const [x,y,a,z] of rails){
    if(b.y<Math.min(y,z)-8||b.y>Math.max(y,z)+8)continue;
    const dx=a-x,dy=z-y,u=Math.max(0,Math.min(1,((b.x-x)*dx+(b.y-y)*dy)/(dx*dx+dy*dy)));
    const nearX=x+u*dx,nearY=y+u*dy;
    if(sound && Math.hypot(b.x-nearX,b.y-nearY)<7.25){
      const along=(b.vx*dx+b.vy*dy)/Math.hypot(dx,dy);
      BallAudio.rail(ac,along,b.x);
    }
    bounce(b,nearX,nearY,7,.48);
  }
  return false;
}
function finishBallStep(b,dt){
  if(!b.freeStep)return false;
  if(enterRightReceiver(b)){containChute(b);return false}
  if(b.route!=='field'){
    const path=rightTrough[b.route];
    if(b.y<path[path.length-1][1])return false;
    if(b.route==='return'){payout++;msg('우타 구슬이 반환구를 지나 받침대로 돌아왔습니다.')}
    else if(b.route==='support'){
      if(acceptSupportBall()===false){payout++;msg('입상 마감 · 전동 시작구의 구슬을 반환합니다.')}
    }else collectAttacker();
    return true;
  }
  const mouth=field.heso;
  tryStageEntry(b,balls);
  if(b.route!=='field')return false;
  if(b.previousY<mouth.y && b.y>=mouth.y){
    const crossingX=b.previousX+(b.x-b.previousX)*(mouth.y-b.previousY)/(b.y-b.previousY);
    if(mode==='normal' && Math.abs(crossingX-mouth.x)<=mouth.halfSpacing-mouth.nailRadius-5){score();return true}
  }
  return enteredOut(b,field);
}
function step(dt){
  now+=dt;advanceAttacker();advanceTray(dt);
  if(force && now-lastShot>=.60)fire();
  advancePlayfield(dt);
  for(const p of pegs)p.light=Math.max(0,p.light-dt);
  advanceBattle(dt);advanceSupport();updateWarning();
}
function playBallContact(speed,x){BallAudio.steel(ac,speed,x)}
function advancePlayfield(dt){
  const steps=contactSubsteps(balls,dt),tick=dt/steps;
  for(let n=0;n<steps;n++){
    advanceFieldwork(field,tick);
    for(let i=balls.length-1;i>=0;i--)if(advanceBall(balls[i],tick))balls.splice(i,1);
    resolveCrownContacts(balls);
    resolveStageContacts(balls);
    resolveBallContacts(balls,field,rails,sound?playBallContact:null);
    for(let i=balls.length-1;i>=0;i--)if(finishBallStep(balls[i],tick))balls.splice(i,1);
  }
}
let last=performance.now(),acc=0;
function frame(ms){
  acc+=Math.min(.06,(ms-last)/1000);last=ms;
  while(acc>=1/120){step(1/120);acc-=1/120}
  const winning=activeDraw?.won && activeDraw.elapsed>=reelStopTime(activeDraw) || supportSpin?.won && now-supportSpin.started>=1.7;
  const fx=winning?'jackpot':mode==='right'?'payout':'idle';
  if(cabinet.dataset.fx!==fx)cabinet.dataset.fx=fx;
  const reach=isReachLive(activeDraw)?'on':'off';
  if(cabinet.dataset.reach!==reach)cabinet.dataset.reach=reach;
  const ready=chanceIsReady(activeDraw);
  if($('chancePush').disabled===ready)$('chancePush').disabled=!ready;
  const chanceState=ready?'ready':'idle';
  if(cabinet.dataset.chance!==chanceState)cabinet.dataset.chance=chanceState;
  draw();tray.draw();requestAnimationFrame(frame);
}
$('insert').onclick=insertNote;
$('chancePush').onclick=()=>{
  if(!chanceIsReady(activeDraw))return;
  activeDraw.pushTime=activeDraw.elapsed;
  $('chancePush').disabled=true;
  msg('럭키 찬스 · 중앙 숫자를 확인하세요.');
};
$('alwaysWin').onchange=()=>{
  if($('alwaysWin').checked && activeDraw && activeDraw.elapsed<reelStopTime(activeDraw))forceWinningResult(activeDraw);
  if($('alwaysWin').checked && supportSpin)supportSpin.won=true;
  msg($('alwaysWin').checked?'디버그 · 항상 당첨 켜짐':'디버그 종료 · 일반 확률 적용');
};
$('sound').onclick=()=>{
  sound=!sound;
  if(sound){ac??=new AudioContext();ac.resume();BallAudio.prepare(ac)}
  else if(ac){ac.close();ac=null}
  $('sound').querySelector('span').textContent='사운드 '+(sound?'ON':'OFF');
};
$('help').onclick=()=>{handle.reset();$('guide').showModal()};
$('close').onclick=()=>$('guide').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)handle.reset()});
status();requestAnimationFrame(frame);
