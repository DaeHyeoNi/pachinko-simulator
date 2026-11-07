'use strict';

// The lower deck is behind the nails. x runs across the bowl and z runs
// forward, from the warp outlet to the spill lip facing the player.
const stageDeck={left:188,right:412,center:300,depth:29};
// The throat is recessed in the front third of the deck. Balls can bridge
// its flared inlet on a fast pass, or roll past it if another ball occupies it.
const stageThroat={halfWidth:6,back:15,front:27,maxCrossSpeed:239};
const warpMouth={x:94,y:270,halfWidth:8.6};
const warpPath=[[warpMouth.x,warpMouth.y],[100,279],[106,303],[118,318],[143,339],[165,355],[188,372]];
const warpLengths=warpPath.slice(1).map(([x,y],i)=>Math.hypot(x-warpPath[i][0],y-warpPath[i][1]));
const warpLength=warpLengths.reduce((sum,length)=>sum+length,0);
function deckHeight(x,z){
  const dx=x-stageDeck.center;
  return 392-dx*dx*.00165+z*.66;
}
function placeInTube(ball){
  let distance=ball.progress;
  for(let i=0;i<warpLengths.length;i++){
    const length=warpLengths[i];
    if(distance<=length || i===warpLengths.length-1){
      const fraction=Math.min(1,distance/length);
      const [x,y]=warpPath[i], [u,v]=warpPath[i+1];
      const entryOffset=i===0?(1-fraction)*ball.entryOffset:0;
      ball.x=x+(u-x)*fraction+entryOffset;ball.y=y+(v-y)*fraction;
      return;
    }
    distance-=length;
  }
}
function enterStage(ball,x,z,vx,vz){
  ball.route='stage';ball.x=x;ball.z=z;ball.vx=vx;ball.vz=vz;ball.inGroove=false;
  ball.y=deckHeight(x,z);ball.vy=0;ball.freeStep=false;
}
function stageOccupied(balls,ball,x,z){
  return balls.some(other=>other!==ball && other.route==='stage' &&
    Math.hypot(x-other.x,z-other.z)<10.05);
}
function tryStageEntry(ball,balls){
  if(ball.usedStage)return;
  const dy=ball.y-ball.previousY;
  if(dy>0 && ball.previousY<=warpMouth.y && ball.y>=warpMouth.y){
    const t=(warpMouth.y-ball.previousY)/dy;
    const x=ball.previousX+(ball.x-ball.previousX)*t;
    if(Math.abs(x-warpMouth.x)<=warpMouth.halfWidth-5 &&
      !balls.some(other=>other.route==='warp' && other.progress<11)){
      ball.route='warp';ball.usedStage=true;ball.freeStep=false;
      ball.entryOffset=x-warpMouth.x;ball.progress=0;
      ball.tubeSpeed=Math.min(205,Math.max(80,Math.hypot(ball.vx,ball.vy)*.8));
      ball.feedAngle=ball.vx;placeInTube(ball);return;
    }
  }
  // Two low shoulders face the nail roads. The raised front molding between
  // them houses the outward-facing center spout.
  const lip=deckHeight(ball.x,stageDeck.depth);
  const offset=Math.abs(ball.x-stageDeck.center);
  const lipRise=5+offset*.08;
  if(offset>47 && offset<63 && ball.vy< -Math.sqrt(2*510*lipRise) && ball.previousY>=deckHeight(ball.previousX,stageDeck.depth) &&
    ball.y<lip && !stageOccupied(balls,ball,ball.x,stageDeck.depth-1)){
    ball.usedStage=true;
    const residualSpeed=Math.sqrt(ball.vy*ball.vy-2*510*lipRise);
    enterStage(ball,ball.x,stageDeck.depth-1,ball.vx*.84,-Math.min(18,residualSpeed*.16));
  }
}
function moveStageBall(ball,dt,balls){
  if(ball.route==='warp'){
    ball.tubeSpeed=Math.min(250,ball.tubeSpeed+150*dt);
    let limit=warpLength;
    for(const other of balls)if(other!==ball && other.route==='warp' && other.progress>ball.progress)
      limit=Math.min(limit,other.progress-10.8);
    ball.progress=Math.max(ball.progress,Math.min(limit,ball.progress+ball.tubeSpeed*dt));
    placeInTube(ball);
    if(ball.progress>=warpLength && !stageOccupied(balls,ball,stageDeck.left,0)){
      enterStage(ball,stageDeck.left,0,ball.tubeSpeed*.83,3+Math.min(11,Math.abs(ball.feedAngle)*.09));
    }
    return;
  }
  const dx=ball.x-stageDeck.center;
  if(ball.inGroove){
    ball.vx+=(-115*dx-17*ball.vx)*dt;
    ball.vz+=38*dt;
  }else{
    // Gravity along the concave surface reverses the ball at each shoulder.
    ball.vx+=(-7.5*dx-.54*ball.vx)*dt;
    ball.vz+=(5.2-.18*ball.vz)*dt;
    // The center groove only catches a ball crossing its opening at the back
    // of the spout. An earlier or faster pass keeps rolling on the main deck.
    if(Math.abs(dx)<stageThroat.halfWidth && ball.z>=stageThroat.back &&
      ball.z<stageThroat.front && Math.abs(ball.vx)<stageThroat.maxCrossSpeed &&
      !balls.some(other=>other!==ball && other.route==='stage' && other.inGroove)){
      ball.inGroove=true;ball.vx*=.09;
    }
  }
  ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
  if(ball.x<stageDeck.left || ball.x>stageDeck.right){
    ball.x=Math.max(stageDeck.left,Math.min(stageDeck.right,ball.x));
    ball.vx*=-.72;
  }
  if(ball.z<0){ball.z=0;ball.vz=Math.abs(ball.vz)*.46;}
  ball.y=deckHeight(ball.x,ball.z);
  const exitDepth=ball.inGroove?stageDeck.depth+12:stageDeck.depth;
  if(ball.z>=exitDepth){
    ball.route='field';ball.restContact=null;ball.vy=26+ball.vz;
    // A ball leaving the front edge retains its sideways momentum.
    ball.freeStep=false;
  }
}
function resolveStageContacts(balls){
  const rolling=balls.filter(b=>b.route==='stage');
  for(let pass=0;pass<rolling.length;pass++){
    let touched=false;
    for(let i=0;i<rolling.length;i++)for(let j=i+1;j<rolling.length;j++){
      const a=rolling[i],b=rolling[j];
      const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
      if(d>=10)continue;
      const nx=d?dx/d:1,nz=d?dz/d:0,push=(10.001-d)/2;
      a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
      const speed=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
      if(speed<0){const impulse=-.82*speed;
        a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;
      }
      for(const ball of [a,b]){
        ball.x=Math.max(stageDeck.left,Math.min(stageDeck.right,ball.x));ball.z=Math.max(0,ball.z);
        ball.y=deckHeight(ball.x,ball.z);
      }
      touched=true;
    }
    if(!touched)break;
  }
}
function drawStageHardware(c){
  c.save();c.lineCap='round';c.lineJoin='round';
  function tube(width,color,offset=0){
    c.beginPath();warpPath.forEach(([x,y],i)=>i?c.lineTo(x+offset,y):c.moveTo(x+offset,y));
    c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  tube(15,'#132738bf');tube(12,'#9dd9f494');tube(8.8,'#27465ca8');tube(.8,'#e6ffffd9',-5);
  const {x,y,halfWidth:w}=warpMouth;
  c.beginPath();c.ellipse(x,y,w,4.6,.09,0,Math.PI*2);c.fillStyle='#101c29';c.fill();
  c.strokeStyle='#b1d5df';c.lineWidth=1.8;c.stroke();
  // Both far and near rims are sampled from the actual rolling surface.
  function rim(z,reverse=false){
    for(let i=0;i<=32;i++){
      const x=stageDeck.left+(stageDeck.right-stageDeck.left)*(reverse?1-i/32:i/32);
      c.lineTo(x,deckHeight(x,z)+5);
    }
  }
  c.beginPath();rim(0);rim(stageDeck.depth,true);c.closePath();
  const resin=c.createLinearGradient(0,372,0,417);
  resin.addColorStop(0,'#c4effb94');resin.addColorStop(.22,'#375f77b5');
  resin.addColorStop(.53,'#203a4bba');resin.addColorStop(.78,'#93cddf9c');resin.addColorStop(1,'#52677bd1');
  c.fillStyle=resin;c.fill();c.lineWidth=1.8;c.strokeStyle='#bbd7e3';c.stroke();
  c.beginPath();rim(4);c.lineWidth=.9;c.strokeStyle='#f6ffffbf';c.stroke();
  c.beginPath();rim(17);c.strokeStyle='#cff3f64f';c.stroke();
  const center=stageDeck.center;
  const inletY=deckHeight(center,stageThroat.back)+5;
  const inletWidth=stageThroat.halfWidth+2;
  c.beginPath();c.moveTo(center-inletWidth,inletY);c.lineTo(center-6,422);c.quadraticCurveTo(center,427,center+6,422);c.lineTo(center+inletWidth,inletY);
  c.fillStyle='#284451bb';c.fill();c.strokeStyle='#c5dce9';c.stroke();
  c.restore();
}
function drawStageGlass(c){
  c.save();c.lineJoin='round';c.lineCap='round';
  // The front lip has a real break at the center spout. Its two facets
  // catch the cabinet light over balls inside this deck, behind field balls.
  for(const [from,to] of [[stageDeck.left,237],[253,293],[307,347],[363,stageDeck.right]]){
    const y=x=>deckHeight(x,stageDeck.depth)+5;
    c.beginPath();c.moveTo(from,y(from)-5);
    for(let i=1;i<=16;i++){const x=from+(to-from)*i/16;c.lineTo(x,y(x)-5);}
    for(let i=0;i<=16;i++){const x=to-(to-from)*i/16;c.lineTo(x,y(x)+1);}
    c.closePath();c.fillStyle='#c4e4fa2c';c.fill();
    c.lineWidth=.75;c.strokeStyle='#d2ebf5bc';c.stroke();
    for(const x of [from+12,to-10]){
      c.beginPath();c.moveTo(x,y(x));c.lineTo(x+3,y(x)-4);
      c.strokeStyle='#ffffffa0';c.stroke();
    }
  }
  c.beginPath();warpPath.forEach(([x,y],i)=>i?c.lineTo(x+5,y):c.moveTo(x+5,y));
  c.lineWidth=1.3;c.strokeStyle='#d7effcb0';c.stroke();
  c.restore();
}
