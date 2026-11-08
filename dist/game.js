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
let loanRemaining=0;
let warningUntil=0, warningMessage='', activeDraw=null, waiting=[];
let balls=[];
const striker={loadedAt:null,compression:0,release:null};
const shotInterval=.60,releaseTime=5/120;
const field=createFieldwork();
const pegs=field.pegs;
const freeFieldMask=new Path2D();
field.perimeter.forEach(([x,y],i)=>i?freeFieldMask.lineTo(x,y):freeFieldMask.moveTo(x,y));
const nailPhoto=typeof Image==='undefined'?null:new Image();
if(nailPhoto){
  nailPhoto.onload=()=>prepareAcrylicLamps($('guideGlow'),nailPhoto);
  nailPhoto.src='cabinet-photo.webp?v=22';
}
const titleRecess=typeof Image==='undefined'?null:new Image();
if(titleRecess)titleRecess.src='title-recess.webp';
const titleMotion={travel:0,light:0,hue:0};
const bank=new BanknoteAcceptor();
const standby=document.createElement('canvas');
let bonusStartedAt=0, roundStartedAt=0, normalSpins=0;
const firstHitHistory=[];
standby.width=standby.height=600;
const idleTicket={stage:'short',digits:[4,5,1],elapsed:5,patrolOffset:0};
drawReelReveal(standby.getContext('2d'),idleTicket,true);
// One outline drives both collisions and the molded display surround.
const displayOutline=makeDisplayOutline();
// A sloped molded roof carries crest misses back to the left nail lane.
const roofCap=[[169,379],[165,267],[203,211],[270,131],[327,108],[459,61],
  [490,47],[572,67],[688,97],[763,117],[808,146],[829,303],[817,376]]
  .map(([px,py])=>[px*600/941-13,py*600/941-234]);
const roofEdges=roofCap.slice(1).map((v,i)=>[...roofCap[i],...v]);
const rails=[...field.rails,...roofEdges,...displayOutline.map(([x,y],i)=>{
  const [u,v]=displayOutline[(i+1)%displayOutline.length];
  return [x,y,u,v];
}),...rightTrough.common.slice(1).map(([x,y,w],i)=>{
  const [a,b,width]=rightTrough.common[i];return [a-width,b,x-w,y];
})];
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
  traceBezel(displayOutline);
  g.clip();
  // Cover the full gasket even at the two raised corners of the title molding.
  g.translate(299,141);g.scale(.70,.63);g.translate(-300,-300);
  if(activeDraw) drawReelReveal(g,activeDraw);
  else if(mode==='right'){
    const finished=attacker.round===bonusRounds && !attacker.open && !attacker.inTransit;
    if(attacker.round===1 && rightHits===0){
      g.drawImage(standby,0,0);
      symbolRibbon(g,'우타 ▶',301,76,'#ffde83');
    } else drawBonusRound(g,now-bonusStartedAt,attacker.round,attacker.hits,rightHits*15,finished,bonusRounds);
  }
  else if(mode==='support') renderSupport(g);
  else if(mode==='empty'||mode==='normal'){
    idleTicket.elapsed=5+now;
    drawReelReveal(g,idleTicket,true);
  } else g.drawImage(standby,0,0);
  drawScreenCount(g,displayStock(),mode==='right'||mode==='support'||activeDraw?.counted?rush.chain:0,now);
  g.restore();
}
function launchTrack(offset=0){
  const path=new Path2D();
  path.moveTo(launchGuideX(launcher.startY)-offset,launcher.startY);
  for(let i=1;i<=32;i++){
    const y=launcher.startY-(launcher.startY-launcher.bendY)*i/32;
    path.lineTo(launchGuideX(y)-offset,y);
  }
  path.ellipse(300,176,launcher.leftRadius+offset,launcher.radiusY+offset,0,Math.PI,Math.PI*1.5);
  return path;
}
const launchGroove=launchTrack(),launchGlassLip=launchTrack(5.4);
function drawCoveredLaunch(){
  g.save();g.lineCap='round';
  g.strokeStyle='#171b20b0';g.lineWidth=12;g.stroke(launchGroove);
  drawLaunchSpring(g,launcher.startY,striker,now,tray);
  for(const b of balls){
    if(!b.launch)continue;
    g.globalAlpha=.84;tray.drawPlayfieldBall(g,b);
  }
  g.globalAlpha=1;
  g.lineWidth=10;g.strokeStyle='#63839824';g.stroke(launchGroove);
  g.lineWidth=1.15;g.strokeStyle='#c1d4d264';g.stroke(launchGlassLip);
  g.beginPath();g.ellipse(300,176,284,launcher.radiusY,0,-Math.PI/2,sleeveAngle-Math.PI);
  const guideLit=attacker.open || mode==='support';
  g.lineWidth=14;g.strokeStyle=guideLit?'#ffb34672':'#7aa7bc52';g.stroke();
  for(const offset of [-6.5,6.5]){
    g.beginPath();g.ellipse(300,176,284+offset,launcher.radiusY+offset,0,-Math.PI/2,sleeveAngle-Math.PI);
    g.lineWidth=1.6;g.strokeStyle='#cae9ed';g.stroke();
  }
  for(const angle of [-1.38,-1.26,-1.14]){
    g.save();g.translate(300+284*Math.cos(angle),176+launcher.radiusY*Math.sin(angle));
    g.rotate(Math.atan2(launcher.radiusY*Math.cos(angle),-284*Math.sin(angle)));
    g.beginPath();g.moveTo(-2,-3);g.lineTo(2,0);g.lineTo(-2,3);
    g.strokeStyle=guideLit?'#fff4ac':'#bdd8d4';g.lineWidth=1.5;g.stroke();g.restore();
  }
  g.beginPath();g.moveTo(294,40);g.lineTo(300,32);g.lineTo(309,40);g.closePath();
  g.fillStyle=attacker.open||mode==='support'?'#ffca63':'#b89962';g.fill();
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
    g.closePath();g.fillStyle='#21374641';g.fill();
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
      g.strokeStyle='#26333998';g.lineWidth=3;g.stroke();
      g.strokeStyle=active?'#ffcd8d':'#c6d7d185';g.lineWidth=1.7;g.stroke();
      g.strokeStyle='#f4ffff';g.lineWidth=.75;g.stroke();
    }
  }
  for(const [x,y] of rightTrough.common.slice(1,-1)){
    line(x-2,y-2,x,y+1,mode==='right'?'#ffda9a':'#b6cdd1',1.2);
    line(x,y+1,x+2,y-2,mode==='right'?'#ffda9a':'#b6cdd1',1.2);
  }
  g.restore();
}
function drawGates(){
  const elapsed=Math.max(0,now-lastGateFrame);lastGateFrame=now;
  const support=supportDoorOpen();
  gatePose+=(Number(attacker.open)-gatePose)*(1-Math.exp(-12*elapsed));
  supportGatePose+=(Number(support)-supportGatePose)*(1-Math.exp(-18*elapsed));
  for(const [branch,pose,lit,name] of [[rightTrough.support,supportGatePose,support,'電チュー'],
    [rightTrough.attacker,gatePose,attacker.open,'入賞'],[rightTrough.return,0,false,'반환']]){
    const [x,y,w]=branch.at(-1);
    box(x-w-2,y-2,w*2+4,10,2,'#142027','#94a5a6');
    box(x-w+1,y,w*2-2,4,1,'#070d0e',lit?'#ffcd72':'#677e80');
    txt(name,x,y+14,'bold 6px sans-serif',lit?'#ffdf9f':'#d0d8d5');
    if(branch===rightTrough.return)continue;
    const [hx,hy,hw]=branch[0],angle=-.32-1.03*pose;
    line(hx-hw,hy+4,hx-hw+hw*1.9*Math.cos(angle),hy+4+hw*1.9*Math.sin(angle),lit?'#ffd482':'#a4b8bb',2.9);
    circle(hx-hw,hy+4,2.2,'#d0dbd7');
  }
  // Faceted collector lip follows the collision surface under the right nails.
  g.save();g.beginPath();for(const [x,y,u,v] of field.collectorRails){g.moveTo(x,y);g.lineTo(u,v);}
  g.lineJoin='round';g.strokeStyle='#22343c8a';g.lineWidth=4;g.stroke();
  g.strokeStyle='#d8f0efb0';g.lineWidth=1.2;g.stroke();g.restore();
  for(const {x,y,halfWidth} of field.rightOutlets){
    g.beginPath();g.ellipse(x,y,halfWidth,2.4,-.13,0,TAU);
    g.fillStyle='#0c131ae8';g.fill();g.strokeStyle='#a7c0c1b5';g.lineWidth=.9;g.stroke();
  }
}
function draw(){
  const d=Math.min(2,devicePixelRatio||1);
  const size=Math.max(1,Math.round(cv.clientWidth*d));
  const height=Math.round(size*1260/941);
  if(cv.width!==size || cv.height!==height){cv.width=size;cv.height=height;}
  const scale=size/600;
  g.setTransform(scale,0,0,scale,13*scale,234*scale);
  g.clearRect(-13,-234,600,height/scale);
  drawDisplay();
  drawStageHardware(g);
  for(const ball of balls){
    if(ball.route==='warp'||ball.route==='stage')tray.drawPlayfieldBall(g,ball);
  }
  drawStageGlass(g);
  drawFieldwork(g,field);
  drawChute();drawGates();drawCoveredLaunch();
  // The front apron covers the departing ball. The separate return and
  // attacker sleeves remain visible beyond the edge of the free field.
  g.save();g.clip(freeFieldMask);
  for(const ball of balls){
    if(!ball.launch && ball.route==='field')tray.drawPlayfieldBall(g,ball);
  }
  g.restore();
  for(const ball of balls){
    if(!ball.launch && ['return','support','attacker'].includes(ball.route))tray.drawPlayfieldBall(g,ball);
  }
  if(nailPhoto?.naturalWidth){
    for(const b of balls){
      if(b.launch || b.route!=='field')continue;
      for(const p of pegs){
        if(Math.abs(p.x-b.x)>7 || Math.abs(p.y-b.y)>7)continue;
        const r=p.headRadius, px=(p.x+13-r)*941/600,py=(p.y+234-r)*941/600;
        g.save();g.beginPath();g.arc(p.x,p.y,r,0,TAU);g.clip();
        g.drawImage(nailPhoto,px,py,2*r*941/600,2*r*941/600,p.x-r,p.y-r,2*r,2*r);g.restore();
      }
    }
  }
  drawTitleLift(g,nailPhoto,titleRecess,titleMotion);
}
function msg(value){$('log').textContent=value}
function stackCount(){return waiting.length + Number(Boolean(activeDraw))}
function displayStock(){
  const right=mode==='support' || (mode==='right' && rush.chain>1);
  return right ? rush.queue.length+Number(Boolean(supportSpin)) : stackCount();
}
function status(){
  for(const [key,value] of Object.entries({stock,shots,hits,wins})) $(key).textContent=value.toLocaleString();
  renderCounter(normalSpins,wins,firstHitHistory);
  $('stack').setAttribute('aria-label','진행 중인 변동과 보류 '+displayStock()+' / 5');
  $('phase').textContent=insertion?'지폐 인식 중':mode==='empty'?'지폐 투입 대기':mode==='right'?
    '우타 · '+attacker.round+'/'+bonusRounds+' 라운드 · '+(attacker.open?'개방':'닫힘')+' · '+attacker.hits+'/10':
    mode==='support'?(rush.kind==='st'?'RUSH':'찬스타임')+' · 남은 '+rush.remaining+'회 · '+rush.chain+'연속':activeDraw?'헤소 추첨 중':'일반 · 헤소 노림';
  const loan=$('insert');
  loan.disabled=Boolean(insertion||loanRemaining);
  loan.setAttribute('data-first',String(mode==='empty'&&!insertion));
  const label=insertion?'인식 중':loanRemaining?'지급 중':'구슬 빌리기';
  if($('loanAction').textContent!==label)$('loanAction').textContent=label;

}
function insertNote(){
  if(insertion||loanRemaining)return;
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
      loanRemaining=250;payout+=loanRemaining;msg('지폐 인식 완료 · 구슬 250개를 대여합니다.');status();
    }
  }
  if(payout){
    payoutClock+=dt;
    while(payout && payoutClock>=.018){
      payoutClock-=.018;payout--;if(loanRemaining)loanRemaining--;tray.deposit();stock++;
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
  const direction=rightPlay&&force<95?'right':'';
  if(direction!==directionAlert){directionAlert=direction;directionSince=now;}
  const compact=rightPlay&&(!direction||now-directionSince>=1.65);
  const gateMessage=mode==='support'?'오른쪽 전동 입상구':attacker.open?'어태커 개방':attacker.round===bonusRounds?'어태커 닫힘 · 지급 마무리':'어태커 닫힘 · 다음 개방 대기';
  const value=compact?(direction?'▶ 우타 필요 · 끝까지 돌리세요':'▶ 우타 유지')+'  ·  '+gateMessage:
    direction==='right'?'▶ 우타 필요 · 손잡이를 끝까지 돌리세요':
    now<warningUntil?warningMessage:'';
  const el=$('warning');
  if(compact!==el.classList.contains('compact'))el.classList.toggle('compact',compact);
  if(value && el.textContent!==value)el.textContent=value;
  el.hidden=!value;
}
function seatBall(){
  if(striker.loadedAt!==null)return true;
  if(balls.some(ball=>ball.launch && ball.head<riseToBend) || !tray.take())return false;
  striker.loadedAt=now;
  stock--;
  status();
  return true;
}
function fire(stroke=force){
  if((!stock && striker.loadedAt===null)||!stroke||mode==='empty'||$('guide').open||!seatBall())return;
  striker.loadedAt=null;
  shots++;lastShot=now;

  balls.push(springShot(stroke,rand(),mode==='right'||mode==='support'?'attacker':'return'));
  BallAudio.launch(sound?ac:null);status();
}
function advanceStriker(dt){
  if(striker.release){
    const {start,travel,stroke}=striker.release;
    const t=Math.min(1,(now-start+1e-9)/releaseTime);
    // First quarter-period of a released coil, ending in contact with the ball.
    striker.compression=travel*Math.cos(t*Math.PI/2);
    if(t===1){
      striker.release=null;
      striker.compression=0;
      fire(stroke);
    }
    return;
  }
  const canWind=(stock || striker.loadedAt!==null) && force && mode!=='empty' && !$('guide').open &&
    now-lastShot>=.15 && seatBall();
  // Compression is proportional to the square root of the ball's launch energy.
  const target=canWind?19*Math.sqrt(launchEnergy(force,.5)/launchEnergy(100,.5)):0;
  const delta=target-striker.compression;
  striker.compression+=Math.sign(delta)*Math.min(Math.abs(delta),dt*(canWind?72:52));
  if(canWind && Math.abs(target-striker.compression)<.01 && now-striker.loadedAt>=.23 &&
      now-lastShot+1e-9>=shotInterval-releaseTime){
    striker.release={start:now,travel:striker.compression,stroke:force};
  }
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
  return {won,lucky,reachVariant:Math.floor(rand()*3),digits:lucky?[7,won?7:6,7]:[first,second,third],stage,
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
  normalSpins++;
  if($('alwaysWin').checked)forceWinningResult(activeDraw);
  msg('헤소 입상 · 추첨 시작');
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
  const previous=activeDraw.elapsed;
  activeDraw.elapsed+=dt;
  if(sound)SceneAudio.reels(ac,activeDraw,previous);
  const finish=reelStopTime(activeDraw);
  if(activeDraw.won && !activeDraw.counted && activeDraw.elapsed>=finish){
    rush.beginFirst($('alwaysWin').checked);
    firstHitHistory.push(normalSpins);
    if(firstHitHistory.length>8)firstHitHistory.shift();
    normalSpins=0;wins++;activeDraw.counted=true;
    status();
  }
  if(activeDraw.elapsed<finish+(activeDraw.won?9:drawTiming(activeDraw).hold))return;
  const result=activeDraw;
  idleTicket.digits=[...result.digits];
  activeDraw=null;
  drawReelReveal(standby.getContext('2d'),result,true);
  if(result.won){
    beginBonus(3);
    msg('대당첨! 우타로 어태커를 노리세요.');
  } else {
    msg('추첨 종료 · 다음 헤소 입상을 노리세요.');startNext();
  }
  status();
}
function beginBonus(rounds){
  bonusRounds=rounds;mode='right';rightHits=0;warningUntil=0;bonusStartedAt=now;
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
  drawRushScreen(ctx,{kind:rush.kind,remaining:rush.remaining,chain:rush.chain,sceneChain:supportSpin?.sceneChain??rush.chain,earned:rush.earned,
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
    const age=now-supportSpin.started;
    if(sound && supportSpin.won){
      const camera=t=>1.72+Math.min(1,t/2.35)*4.48;
      SceneAudio.battle(ac,2+(supportSpin.sceneChain%4),camera(supportSpin.lastAge),camera(age));
    }
    supportSpin.lastAge=age;
    if(supportSpin.won && !supportSpin.counted && age>=1.7){
      rush.renew();wins++;supportSpin.counted=true;status();
    }
    if(age<(supportSpin.won?3:.6))return;
    const won=supportSpin.won;
    if(won)renderSupport(standby.getContext('2d'));
    supportSpin=null;
    if(won){
      beginBonus(10);
      msg(rush.chain+'연속 대당첨 · 우타 유지 · 10라운드');return;
    }
    status();
  }
  const next=rush.next();
  if(next){supportSpin={...next,started:now,lastAge:0,sceneChain:rush.chain};status();}
  else if(!rush.remaining){supportEndedAt=now;status();}
}
function openAttackerRound(round){
  roundStartedAt=now;
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
    if(!b.launch && b.route==='return')warn('◀ 좌타로 돌리세요 · 반환구로 이동 중',2);
    if(sound)BallAudio.rail(ac,Math.hypot(b.vx,b.vy),b.x);
    return false;
  }
  b.vy+=fieldGravity*dt;
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
  // The photographed shafts project toward the glass. A ball wedged between
  // overlapping heads can roll forward off their tips under the cabinet rake.
  // Keep integrating its position while it passes those specific shafts.
  if(b.frontPins && b.y>b.frontUntilY)b.frontPins=null;
  if(!b.restPocket || Math.hypot(b.x-b.restPocket.x,b.y-b.restPocket.y)>2)
    b.restPocket={x:b.x,y:b.y,since:b.t};
  if(b.t-b.restPocket.since>.65){
    const supporting=pegs.filter(p=>Math.hypot(p.x-b.x,p.y-b.y)<10);
    if(supporting.length){
      b.frontPins=new Set([...(b.frontPins||[]),...supporting]);
      b.frontUntilY=Math.max(...Array.from(b.frontPins,p=>p.y))+6;
    }
    b.restPocket=null;
  }
  movePastPins(b,pegs,dt,recordPinHit);
  if(b.x< -8||b.x>582){b.x=Math.max(-8,Math.min(582,b.x));b.vx*=-.66}
  if(b.y< -226){b.y=-226;b.vy=Math.abs(b.vy)*.72}
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
  advanceStriker(dt);
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
const quietCabinet=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)');
let winCycleStarted=null;
function moveWinMechanism(fx){
  const style=cabinet.style;
  titleMotion.travel=0;
  const celebrating=fx!=='idle' || mode==='support';
  const flash=quietCabinet.matches ? 0 : (.5-.5*Math.cos(now*Math.PI*4));
  titleMotion.light=celebrating?(quietCabinet.matches ? .72 : .68+.32*flash):0;
  titleMotion.hue=quietCabinet.matches?26:(now*176)%360;
  if(fx==='idle'){
    if(winCycleStarted!==null){
      for(const name of ['--win-beat','--win-phase','--prop-stroke','--prop-wing','--prop-tip'])
        style.removeProperty(name);
      winCycleStarted=null;
    }
    return;
  }
  if(winCycleStarted===null)winCycleStarted=now;
  const set=(name,value)=>style.setProperty(name,value.toFixed(4));
  if(quietCabinet.matches){
    set('--win-beat',0);set('--win-phase',0);set('--prop-stroke',0);set('--prop-wing',0);set('--prop-tip',0);
    return;
  }
  const lock=activeDraw ? activeDraw.elapsed-reelStopTime(activeDraw) :
    supportSpin ? now-supportSpin.started-1.7 : now-roundStartedAt;
  const opening=fx==='payout', renewal=Boolean(supportSpin);
  const phase=Math.min(1,Math.max(0,lock/(opening?1.8:9)));
  const rise=(a,b)=>reelEase((phase-a)/(b-a));
  const primary=rise(0,.075)*(1-rise(.28,.48));
  const wings=rise(.54,.66)*(1-rise(.8,.98));
  const strength=opening ? (attacker.round===1?0:.28) : (renewal ? .76 : 1);
  // A powered drop, two rebounds, then a second shorter stroke with the wings.
  const movement=renewal?lock/1.30:phase;
  const envelope=1-reelEase((movement-.83)/.17);
  const pulse=(start,length)=>Math.sin(Math.PI*Math.max(0,Math.min(1,(movement-start)/length)))**2;
  titleMotion.travel=strength*envelope*(87*pulse(0,.24)+61*pulse(.23,.26)+40*pulse(.50,.21)+56*pulse(.69,.23));
  const beat=strength*Math.exp(-Math.abs(phase-.075)*48);
  set('--prop-stroke',strength*(primary+.42*rise(.65,.73)*(1-rise(.78,.96))));
  set('--prop-wing',strength*(primary+wings));
  set('--prop-tip',strength*(primary+wings*.88));
  set('--win-phase',phase);
  set('--win-beat',beat);
}
function frame(ms){
  acc+=Math.min(.06,(ms-last)/1000);last=ms;
  while(acc>=1/120){step(1/120);acc-=1/120}
  const winning=activeDraw?.won && activeDraw.elapsed>=reelStopTime(activeDraw) || supportSpin?.won && now-supportSpin.started>=1.7;
  const fx=winning?'jackpot':mode==='right'?'payout':'idle';
  if(cabinet.dataset.fx!==fx)cabinet.dataset.fx=fx;
  moveWinMechanism(fx);
  if(titleMotion.light || cabinet.style.getPropertyValue('--guide-light')!=='0'){
    cabinet.style.setProperty('--guide-light',String(titleMotion.light));
    if(titleMotion.light)cabinet.style.setProperty('--guide-hue',titleMotion.hue+'deg');
  }
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
  if(sound)SceneAudio.push(ac);
  const dome=$('chancePush');dome.classList.add('pressing');
  const press=dome.querySelector('span').animate([{transform:'translateY(0)'},{transform:'translateY(5px) scale(.94)'},{transform:'translateY(0)'}],{duration:320});
  press.onfinish=()=>dome.classList.remove('pressing');
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
  $('sound').setAttribute('aria-pressed',String(sound));
  $('sound').title=sound?'사운드 끄기':'사운드 켜기';
};
$('help').onclick=()=>{handle.reset();$('guide').showModal()};
$('close').onclick=()=>$('guide').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)handle.reset()});
status();requestAnimationFrame(frame);
