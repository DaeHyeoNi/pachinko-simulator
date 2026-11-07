// The handle compresses one spring. Its available energy is expressed as
// the height a ball could climb on the guide before coming to rest.
const launcher = {startY:533, bendY:176, radiusX:284, radiusY:150, gravity:2600};
const riseToBend=launcher.startY-launcher.bendY;
const receiver={x:550,clearanceY:127.4,mouthY:150};
const fieldGravity=510;
const crestY=launcher.bendY-launcher.radiusY;
// A ball leaving the crest horizontally must travel this far before it
// falls to the fixed sleeve. This determines the calibrated spring preload.
const receiverSpeed=(receiver.x-300)/Math.sqrt(2*(receiver.clearanceY-crestY)/fieldGravity);
const lipRadius=receiverSpeed**2/fieldGravity;
function launchEnergy(stroke,scatter) {
  const variation=(2*scatter-1)*Math.min(3.5,Math.abs(stroke-94.5)*.45,Math.abs(stroke-11.5)*.6);
  if(stroke<11.5)return 80+277*stroke/11.5+variation;
  if(stroke<=70)return riseToBend+launcher.radiusY*(stroke-11.5)/(94.5-11.5)+variation;
  const headAt70=launcher.radiusY*(70-11.5)/(94.5-11.5);
  const headAtCrest=riseToBend+launcher.radiusY;
  if(stroke<79)return riseToBend+headAt70+(launcher.radiusY-headAt70)*(stroke-70)/9+variation;
  return headAtCrest+receiverSpeed**2/(2*launcher.gravity)*(stroke-79)/(94.5-79)+variation;
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
  const exit=crest ? Math.PI/2 : Math.asin(height/launcher.radiusY);
  const sin=Math.sin(ball.angle),cos=Math.cos(ball.angle);
  const speed=Math.sqrt(2*gravity*Math.max(0,height-launcher.radiusY*sin));
  const tangentLength=Math.hypot(launcher.radiusX*sin,launcher.radiusY*cos);
  placeOnCrown(ball,Math.min(exit,ball.angle+speed*arcTime/tangentLength));
  if(ball.angle>=exit){
    ball.launch=false;
    // At the crown a fast ball keeps positive pressure against the curved
    // outer lip. A slower one drops under it into the open playfield.
    // Both leave with their actual position and tangent velocity.
    ball.awaitingReceiver=crest && ball.vx**2/lipRadius>=fieldGravity;
  }
  return false;
}

function enterRightReceiver(ball){
  if(!ball.awaitingReceiver||ball.previousX>=receiver.x||ball.x<receiver.x)return false;
  ball.awaitingReceiver=false;
  const fraction=(receiver.x-ball.previousX)/(ball.x-ball.previousX);
  const crossingY=ball.previousY+(ball.y-ball.previousY)*fraction;
  if(crossingY>receiver.clearanceY)return false;
  ball.route=ball.rightRoute;
  return true;
}
