// The handle compresses one spring. Its available energy is expressed as
// the height a ball could climb on the guide before coming to rest.
const launcher = {startY:533, bendY:176, radiusX:284, radiusY:390, gravity:2600};
const riseToBend=launcher.startY-launcher.bendY;
const receiver={mouthY:150};
const fieldGravity=510;
const crestY=launcher.bendY-launcher.radiusY;
// The apex is an over-center divider. The same spring head determines
// whether the ball stalls on the left or rolls into the right sleeve.
const sleeveAngle=Math.PI-Math.asin((launcher.bendY-receiver.mouthY)/launcher.radiusY);
function launchEnergy(stroke,scatter) {
  const variation=(2*scatter-1)*Math.min(3.5,Math.abs(stroke-94.5)*.45,Math.abs(stroke-11.5)*.6);
  if(stroke<11.5)return 80+277*stroke/11.5+variation;
  return riseToBend+launcher.radiusY*(stroke-11.5)/83+variation;
}

function springShot(stroke,scatter,rightRoute) {
  const head=launchEnergy(stroke,scatter);
  const straightSpeed=Math.sqrt(2*launcher.gravity*head);
  const bendSpeed=Math.sqrt(2*launcher.gravity*Math.max(0,head-riseToBend));
  return {x:16,y:launcher.startY,t:0,launch:true,route:'field',vx:0,vy:-straightSpeed,
    head,straightSpeed,bendTime:(straightSpeed-bendSpeed)/launcher.gravity,
    angle:0,rightRoute};
}

function placeOnCrown(ball,angle) {
  ball.angle=angle;
  const sx=Math.sin(angle),cx=Math.cos(angle);
  ball.x=300-launcher.radiusX*cx;
  ball.y=launcher.bendY-launcher.radiusY*sx;
  const heightLeft=Math.max(0,ball.head-(launcher.startY-ball.y));
  const speed=Math.sqrt(2*launcher.gravity*heightLeft);
  const scale=speed/Math.hypot(launcher.radiusX*sx,launcher.radiusY*cx);
  ball.vx=launcher.radiusX*sx*scale;
  ball.vy=-launcher.radiusY*cx*scale;
}

function resolveCrownContacts(balls) {
  // In a single-file guide an equal-mass steel impact trades speeds along
  // the tangent. Shot age preserves their physical order through the impact.
  const guided=balls.filter(ball=>ball.launch && ball.angle>0);
  if(guided.length<2)return;
  guided.sort((a,b)=>b.t-a.t);
  for(let pass=0;pass<guided.length;pass++){
    let corrected=false;
    for(let i=1;i<guided.length;i++){
      const front=guided[i-1],back=guided[i];
      if(front.angle>back.angle && Math.hypot(front.x-back.x,front.y-back.y)>=10)continue;
      const mid=(front.angle+back.angle)/2;
      const radius=Math.hypot(launcher.radiusX*Math.sin(mid),launcher.radiusY*Math.cos(mid));
      const halfGap=Math.asin(5.001/radius);
      if(back.head>front.head)[front.head,back.head]=[back.head,front.head];
      placeOnCrown(front,mid+halfGap);
      placeOnCrown(back,Math.max(0,mid-halfGap));
      corrected=true;
    }
    if(!corrected)return;
  }
}

function runLaunchGuide(ball,dt) {
  const gravity=launcher.gravity;
  if(ball.head<riseToBend || ball.t<=ball.bendTime){
    ball.y=launcher.startY-ball.straightSpeed*ball.t+.5*gravity*ball.t*ball.t;
    ball.vy=gravity*ball.t-ball.straightSpeed;
    return ball.vy>0 && ball.y>=launcher.startY;
  }
  // Integrate speed along the ellipse, not across its chord. A ball using
  // its last energy before the crown drops into the open pin field here.
  const arcTime=Math.min(dt,ball.t-ball.bendTime);
  const height=ball.head-riseToBend;
  const crest=height>=launcher.radiusY;
  const exit=crest ? sleeveAngle : Math.asin(height/launcher.radiusY);
  const sin=Math.sin(ball.angle),cos=Math.cos(ball.angle);
  const speed=Math.sqrt(2*gravity*Math.max(0,height-launcher.radiusY*sin));
  const tangentLength=Math.hypot(launcher.radiusX*sin,launcher.radiusY*cos);
  placeOnCrown(ball,Math.min(exit,ball.angle+speed*arcTime/tangentLength));
  if(ball.angle>=exit){
    ball.launch=false;
    if(crest){
      ball.route=ball.rightRoute;
      ball.vx*=.45;ball.vy*=.45;
    }
  }
  return false;
}
