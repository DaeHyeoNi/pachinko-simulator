// The handle compresses one spring. Its available energy is expressed as
// the height a ball could climb on the guide before coming to rest.
const launcher = {startY:533, bendY:176, radiusX:284, radiusY:150, gravity:2600};
const riseToBend=launcher.startY-launcher.bendY;
const transferAngle=Math.PI-Math.asin((launcher.bendY-150)/launcher.radiusY);
function launchEnergy(stroke,scatter) {
  const variation=(2*scatter-1)*Math.min(3.5,Math.abs(stroke-94.5)*.45,Math.abs(stroke-11.5)*.6);
  if(stroke<11.5)return 80+277*stroke/11.5+variation;
  return riseToBend+launcher.radiusY*(stroke-11.5)/(94.5-11.5)+variation;
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
  const exit=crest ? transferAngle : Math.asin(height/launcher.radiusY);
  const sin=Math.sin(ball.angle),cos=Math.cos(ball.angle);
  const speed=Math.sqrt(2*gravity*Math.max(0,height-launcher.radiusY*sin));
  const tangentLength=Math.hypot(launcher.radiusX*sin,launcher.radiusY*cos);
  placeOnCrown(ball,Math.min(exit,ball.angle+speed*arcTime/tangentLength));
  if(ball.angle>=exit){
    ball.launch=false;
    if(crest)ball.route=ball.rightRoute;
  }
  return false;
}

// A steel ball may balance between two contact normals even on a sloping nail road.
// Probe short, collision-resolved rolls and change only the ball's initial velocity.
function advanceUnsticking(ball, dt, field, rails = field.rails) {
  if (ball.route !== 'field' || ball.launch) return;
  const rest = ball.restContact ??= {
    x: ball.x, y: ball.y, age: 0,
    releasedAtY: ball.y, attempts: 0, lastDirection: 0
  };
  if (ball.y > rest.releasedAtY + 20) {
    rest.releasedAtY = ball.y;
    rest.attempts = 0;
  }
  if (Math.abs(ball.x-rest.x) > 2.2 || Math.abs(ball.y-rest.y) > 2.2) {
    rest.x = ball.x;
    rest.y = ball.y;
    rest.age = 0;
    return;
  }
  rest.age += dt;
  if (rest.age < .44) return;
  rest.age = 0;

  const nearbyPegs = field.pegs.filter(p => Math.abs(p.x-ball.x)<75 && Math.abs(p.y-ball.y)<95);
  const nearbyRails = rails.filter(([x,y,u,v]) =>
    ball.x >= Math.min(x,u)-75 && ball.x <= Math.max(x,u)+75 &&
    ball.y >= Math.min(y,v)-95 && ball.y <= Math.max(y,v)+95);
  const wheel = field.wheel;
  const nearWheel = wheel && Math.hypot(wheel.x-ball.x,wheel.y-ball.y)<72;
  if (!nearbyPegs.length && !nearbyRails.length && !nearWheel) return;

  rest.attempts++;
  // A persistently enclosed ball drops through a visible backplate release before
  // joining the behind-glass OUT channel. It never crosses the heso scoring plane.
  if (rest.attempts > 7) {
    ball.route = 'service';
    ball.service = {x: ball.x, y: ball.y, railX: ball.x < 300 ? 20 : 580, time: 0};
    ball.vx = ball.vy = 0;
    return;
  }
  const towardEdge = ball.x < 300 ? -1 : 1;
  const first = rest.lastDirection ? -rest.lastDirection : towardEdge;
  let best = null;
  for (const strength of [19, 40, 68]) {
    for (const direction of [first,-first]) {
      const vx = direction * strength;
      const vy = -Math.min(50, 5 + 5*rest.attempts + strength*.18);
      const probe = {x:ball.x, y:ball.y, vx, vy};
      const probeField = nearWheel ? {wheel:{...wheel}} : null;
      for (let i=0; i<60; i++) {
        const tick = 1/120;
        probe.vy += 510*tick;
        probe.x += probe.vx*tick;
        probe.y += probe.vy*tick;
        if (probe.x<10 || probe.x>590) {
          probe.x = Math.max(10,Math.min(590,probe.x));
          probe.vx *= -.66;
        }
        for (const pin of nearbyPegs) {
          if (Math.abs(pin.x-probe.x)>10 || Math.abs(pin.y-probe.y)>10) continue;
          resolveRestProbe(probe, pin.x, pin.y, pin.r+5, .56);
        }
        for (const [x,y,u,v] of nearbyRails) {
          if (probe.y < Math.min(y,v)-8 || probe.y > Math.max(y,v)+8) continue;
          const dx=u-x, dy=v-y;
          const t=Math.max(0,Math.min(1,((probe.x-x)*dx+(probe.y-y)*dy)/(dx*dx+dy*dy)));
          resolveRestProbe(probe,x+t*dx,y+t*dy,7,.48);
        }
        if (probeField) {
          advanceFieldwork(probeField,tick);
          collideWindmill(probe,probeField,tick);
        }
      }
      const drop=probe.y-ball.y;
      const rollout=Math.abs(probe.x-ball.x);
      // Flat moldings and nail shoulders can require a lateral roll before descent.
      const merit=drop + .29*rollout - .04*strength;
      if (!best || merit>best.merit) best={vx,vy,direction,merit};
    }
    if (best.merit>11) break;
  }
  ball.vx = best.vx;
  ball.vy = best.vy;
  rest.lastDirection = best.direction;
}

function resolveRestProbe(probe,x,y,radius,restitution) {
  const dx=probe.x-x, dy=probe.y-y;
  const squared=dx*dx+dy*dy;
  if (squared>=radius*radius || squared<1e-12) return;
  const distance=Math.sqrt(squared);
  const nx=dx/distance, ny=dy/distance;
  probe.x=x+nx*radius;
  probe.y=y+ny*radius;
  const inward=probe.vx*nx+probe.vy*ny;
  if (inward<0) {
    probe.vx-=inward*(1+restitution)*nx;
    probe.vy-=inward*(1+restitution)*ny;
  }
}

// Returns true exactly once on reaching the bottom OUT exit.
function advanceServiceDrain(ball,dt) {
  const service=ball.service;
  service.time+=dt;
  const t=service.time;
  if (t<.28) return false;
  if (t<.82) {
    const p=(t-.28)/.54;
    const ease=p*p*(3-2*p);
    ball.x=service.x+(service.railX-service.x)*ease;
    ball.y=service.y+14*p*p;
  } else if (t<1.5) {
    const p=(t-.82)/.68;
    ball.x=service.railX;
    ball.y=service.y+14+(568-service.y-14)*p*p;
  } else {
    const p=Math.min(1,(t-1.5)/.55);
    ball.x=service.railX+(300-service.railX)*p;
    ball.y=568+45*p*p;
  }
  return t>=2.05;
}

function drawServiceDrain(ctx,ball) {
  const s=ball.service;
  if (!s) return;
  ctx.save();
  const closing=Math.max(0,1-s.time/.8);
  if (closing) {
    ctx.globalAlpha=closing;
    ctx.fillStyle='#19191c'; ctx.strokeStyle='#b99762'; ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(s.x,s.y,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  const radius=5-2*Math.min(1,s.time/.28);
  ctx.globalAlpha=s.time<.28?1:.85;
  ctx.shadowColor='#ebd291'; ctx.shadowBlur=4;
  ctx.fillStyle='#9ea7a1';ctx.beginPath();ctx.arc(ball.x,ball.y,radius,0,2*Math.PI);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#fff5db';ctx.beginPath();
  ctx.arc(ball.x-radius*.32,ball.y-radius*.38,radius*.34,0,2*Math.PI);ctx.fill();
  ctx.restore();
}
