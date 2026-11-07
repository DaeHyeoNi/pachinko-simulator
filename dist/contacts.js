// A ball is 10 board units wide. Guided launches and behind-glass service
// returns do not exchange momentum with the loose balls on the playfield.
const BALL_DIAMETER = 10;
function contactLayer(ball) {
  if (ball.launch || ball.route === 'service') return 0;
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

// Centers and inner half-widths of the clear right-side trough. The first point
// meets the launch ellipse at its release tangent; the fork shares one hinge.
const rightTrough = {
  gateY: 445,
  common: [[580,150,9],[584,183,9],[584,246,9],[580,307,9.5],
    [572,365,10],[562,412,10],[552,445,10]],
  attacker: [[552,445,10],[546,457,9.5],[537,470,9],[531,481,9]],
  return: [[552,445,10],[558,456,9],[564,470,9],[564,484,9],
    [553,502,11],[532,523,12],[506,539,13],[487,550,13]]
};
function containChute(ball) {
  const points=ball.y<=rightTrough.gateY?rightTrough.common:rightTrough[ball.route];
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
    if(ball.x<10){ball.x=10;ball.vx=Math.max(0,ball.vx);}
    if(ball.x>590){ball.x=590;ball.vx=Math.min(0,ball.vx);}
    if(ball.y<8){ball.y=8;ball.vy=Math.max(0,ball.vy);}
    for(const p of field.pegs) {
      if(Math.abs(p.x-ball.x)<9&&Math.abs(p.y-ball.y)<9)project(ball,p.x,p.y,p.r+5);
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
