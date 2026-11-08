// A ball is 10 board units wide. The covered launch, warp and recessed stage
// are separate depth layers from the free pin field.
const BALL_DIAMETER = 10;
function contactLayer(ball) {
  if (ball.launch || ball.route==='warp' || ball.route==='stage') return 0;

  return ball.route === 'field' ? 1 : 2;
}

function contactSubsteps(balls, dt) {
  let count = 1;
  for (let i=0; i<balls.length; i++) {
    const a=balls[i], layer=contactLayer(a);
    if (!layer) continue;
    count=Math.max(count,Math.ceil((Math.hypot(a.vx,a.vy)+510*dt)*dt/6));
    for (let j=i+1; j<balls.length; j++) {
      const b=balls[j];
      if (contactLayer(b)!==layer) continue;
      const travel=Math.hypot(a.vx-b.vx,a.vy-b.vy)*dt;
      if (travel>4 && Math.abs(a.x-b.x)<=10+travel && Math.abs(a.y-b.y)<=10+travel)
        count=Math.max(count,Math.ceil(travel/4));
    }
  }
  return count;
}

// Sweep the ball center against shafts enlarged by the ball radius. A shallow
// chord can cross the circle even when both ends of a microstep are outside.
function movePastPins(ball, pins, dt, onHit) {
  let remaining=dt;
  for(let contact=0; remaining>1e-8 && contact<8; contact++){
    const vx=ball.vx,vy=ball.vy,speed2=vx*vx+vy*vy;
    const endX=ball.x+vx*remaining,endY=ball.y+vy*remaining;
    const left=Math.min(ball.x,endX),right=Math.max(ball.x,endX);
    const top=Math.min(ball.y,endY),bottom=Math.max(ball.y,endY);
    let first=null,firstTime=remaining;
    for(const pin of pins){
      if(ball.frontPins?.has(pin))continue;
      const radius=BALL_DIAMETER*.5+pin.r;
      if(pin.x+radius<left || pin.x-radius>right || pin.y+radius<top || pin.y-radius>bottom)continue;
      const x=ball.x-pin.x,y=ball.y-pin.y;
      const gap=x*x+y*y-radius*radius;
      let entry=0;
      if(gap>=-1e-8){
        const dot=x*vx+y*vy;
        if(dot>=0 || speed2===0)continue;
        const discriminant=dot*dot-speed2*gap;
        if(discriminant<=0)continue;
        entry=Math.max(0,gap/(-dot+Math.sqrt(discriminant)));
      }
      if(entry>firstTime)continue;
      first=pin;firstTime=entry;
    }
    if(!first){ball.x=endX;ball.y=endY;return;}
    const x=ball.x+vx*firstTime-first.x,y=ball.y+vy*firstTime-first.y;
    const distance=Math.hypot(x,y),speed=Math.sqrt(speed2);
    const nx=distance>1e-9?x/distance:(speed?-vx/speed:0);
    const ny=distance>1e-9?y/distance:(speed?-vy/speed:-1);
    const clearance=BALL_DIAMETER*.5+first.r+.00001;
    ball.x=first.x+nx*clearance;ball.y=first.y+ny*clearance;
    const approach=vx*nx+vy*ny;
    if(approach<0){
      // A ball already rolling on the metal keeps its tangent velocity. Only
      // an audible impact bounces away from the surface.
      const restitution=approach< -18?.56:0;
      ball.vx-=(1+restitution)*approach*nx;ball.vy-=(1+restitution)*approach*ny;
      if(onHit)onHit(first,-approach,ball.x);
    }
    remaining-=firstTime;
  }
  // At a simultaneous multi-pin pinch the unresolved interval stays at this
  // last contact; the next microstep begins there, never beyond a shaft.
}
// Centers and inner half-widths of the clear right-side trough. The first point
// meets the launch ellipse at its release tangent; the fork shares one hinge.
function moldedLane(points){
  return points.map(([px,py,w])=>[px*600/941-13,py*600/941-234,w]);
}
const rightTrough = {
  gateY:952*600/941-234, supportGateY:811*600/941-234,
  common:moldedLane([[935,603,9],[935,665,9],[931,715,9],[920,770,9],[911,811,9]]),
  support:moldedLane([[911,811,9],[907,833,9],[897,862,9]]),
  lowerCommon:moldedLane([[911,811,9],[923,843,10],[924,883,10],[916,931,10],[900,952,10]]),
  attacker:moldedLane([[900,952,10],[881,966,11],[855,979,13]]),
  return:moldedLane([[900,952,10],[916,974,10],[919,1008,10],[913,1040,9],[905,1064,9]])
};
function containChute(ball) {
  if(ball.y<receiver.mouthY){
    // Past the tongue, the outer steel arch bends the ball into the sleeve.
    const v=(ball.y-176)/167;
    const extent=Math.sqrt(Math.max(.01,1-v*v));
    const wall=300+291*extent, slope=-291*v/(167*extent);
    const maxX=wall-5*Math.hypot(1,slope);
    if(ball.x<=maxX)return;
    ball.x=maxX;
    const vn=Math.max(0,ball.vx-slope*ball.vy)/(1+slope*slope);
    ball.vx-=vn;ball.vy+=vn*slope;
    return true;
  }
  let points=rightTrough[ball.route];
  if(ball.y<=rightTrough.supportGateY)points=rightTrough.common;
  else if(ball.y<=rightTrough.gateY&&ball.route!=='support')points=rightTrough.lowerCommon;
  let index=1;
  while(index<points.length-1 && points[index][1]<ball.y)index++;
  const [x1,y1,w1]=points[index-1], [x2,y2,w2]=points[index];
  const t=Math.max(0,Math.min(1,(ball.y-y1)/(y2-y1)));
  const center=x1+(x2-x1)*t;
  const slope=(x2-x1)/(y2-y1);
  const range=w1+(w2-w1)*t-5*Math.hypot(1,slope);
  const offset=ball.x-center;
  if(Math.abs(offset)<=range)return;
  const side=Math.sign(offset);
  ball.x=center+side*range;
  const normalVelocity=(ball.vx-slope*ball.vy)*side;
  if(normalVelocity>0) {
    const impulse=normalVelocity*1.23/(1+slope*slope);
    ball.vx-=side*impulse;
    ball.vy+=side*impulse*slope;
  }
  return true;
}

function resolveBallContacts(balls,field,rails,onImpact) {
  if(balls.length<2)return;
  // Re-project moved balls against the actual hardware after every sweep.
  // Only contact participants need this extra static-geometry work.
  function project(ball,x,y,r) {
    const dx=ball.x-x,dy=ball.y-y,sq=dx*dx+dy*dy;
    if(sq>=r*r)return;
    const distance=Math.sqrt(sq),nx=distance?dx/distance:0,ny=distance?dy/distance:-1;
    ball.x=x+nx*(r+.0001);ball.y=y+ny*(r+.0001);
    const vn=ball.vx*nx+ball.vy*ny;
    if(vn<0){ball.vx-=vn*nx;ball.vy-=vn*ny;}
  }
  function reproject(ball) {
    if(ball.route!=='field'){containChute(ball);return;}
    if(ball.x< -8){ball.x=-8;ball.vx=Math.max(0,ball.vx);}
    if(ball.x>582){ball.x=582;ball.vx=Math.min(0,ball.vx);}
    if(ball.y< -226){ball.y=-226;ball.vy=Math.max(0,ball.vy);}
    for(const p of field.pegs) {
      if(!ball.frontPins?.has(p) && Math.abs(p.x-ball.x)<9&&Math.abs(p.y-ball.y)<9)project(ball,p.x,p.y,p.r+5);
    }
    for(const [x,y,a,b] of rails) {
      if(ball.x<Math.min(x,a)-7||ball.x>Math.max(x,a)+7||
         ball.y<Math.min(y,b)-7||ball.y>Math.max(y,b)+7)continue;
      const dx=a-x,dy=b-y,u=Math.min(1,Math.max(0,((ball.x-x)*dx+(ball.y-y)*dy)/(dx*dx+dy*dy)));
      project(ball,x+u*dx,y+u*dy,7);
    }
    collideWindmill(ball,field,0);
  }
  const moved=new Set();
  let impactSpeed=27,impactX=300;
  for(let iteration=0;iteration<32;iteration++){
    moved.clear();
    const reversed=iteration%2===1;
    for(let p=0;p<balls.length;p++) {
      const i=reversed?balls.length-p-1:p,a=balls[i],layer=contactLayer(a);
      if(!layer)continue;
      for(let q=p+1;q<balls.length;q++) {
        const j=reversed?balls.length-q-1:q,b=balls[j];
        if(contactLayer(b)!==layer)continue;
        const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;
        if(d2>=(BALL_DIAMETER-.001)**2)continue;
        const d=Math.sqrt(d2),rvx=b.vx-a.vx,rvy=b.vy-a.vy;
        let nx,ny;
        if(d>.00001){nx=dx/d;ny=dy/d;}
        else{
          // Coincident spawns still have a stable contact normal at rest.
          const speed=Math.hypot(rvx,rvy),angle=(i*17+j*7)*2.39996323;
          nx=speed?-rvx/speed:Math.cos(angle);ny=speed?-rvy/speed:Math.sin(angle);
        }
        const halfDepth=(BALL_DIAMETER+.001-d)*.5;
        a.x-=nx*halfDepth;a.y-=ny*halfDepth;b.x+=nx*halfDepth;b.y+=ny*halfDepth;
        const approach=rvx*nx+rvy*ny;
        if(approach<0){
          if(-approach>impactSpeed){impactSpeed=-approach;impactX=(a.x+b.x)*.5;}
          const restitution=approach < -15 ? .77 : 0;
          const impulse=-(1+restitution)*approach*.5;
          a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;
        }
        moved.add(a);moved.add(b);
      }
    }
    if(!moved.size)break;
    for(const b of moved)reproject(b);
  }
  if(onImpact&&impactSpeed>27)onImpact(impactSpeed,impactX);
}
