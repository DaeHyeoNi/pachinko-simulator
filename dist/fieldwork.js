/* Brass playfield hardware, in the same 600-unit coordinate system as the balls. */
function createFieldwork() {
  const pegs = [];
  const rails = [];
  function nail(x, y, radius = 2.25, cant = 0) {
    const index = pegs.length;
    const grain = Math.sin(index * 47.6 + x * .12);
    pegs.push({x, y, r: radius, light: 0, dx: 1.8 + cant + grain * .42, dy: -4.9 + grain * .58});
  }
  function road(x, y, dx, dy, count, cant = 0) {
    const spanX=dx*(count-1),spanY=dy*(count-1);
    // Loose groups have more than a ball diameter of daylight between shafts.
    const looseCount=Math.max(2,1+Math.floor(Math.hypot(spanX,spanY)/16.2));
    const guided=y>=358;
    const n=guided?count:looseCount;
    for(let i=0;i<n;i++)nail(x+spanX*i/(n-1),y+spanY*i/(n-1),2.18,cant);
    if(guided)rails.push([x,y-1.15,x+spanX,y+spanY-1.15]);
  }
  function divider(x, y, flip = 1) {
    nail(x,y); nail(x-8*flip,y+15); nail(x+9*flip,y+21);
  }
  // Short nail roads leave breaks for the ball to fall from one level to the next.
  road(70,136,10,-7,5); road(130,109,12,-5,5);
  road(196,88,13,-3,4); divider(262,91);
  road(305,95,12,4,5); road(381,101,10,6.5,5);
  road(452,134,9,8,4);
  road(96,182,11,-4,5); divider(179,128);
  road(207,136,10,4,4); road(270,147,13,-2,4);
  road(348,138,11,3,5); divider(423,133,-1);
  road(58,210,7,9,5); divider(120,226);
  road(72,275,11,4,6);
  road(72,318,8,-6,3); divider(103,331);
  road(68,358,9.5,5.7,7); road(162,409,10.8,4.5,9);
  road(467,200,10,6.5,5); road(467,235,7,9,3);
  road(527,254,-9,6,5); divider(475,292,-1);
  road(525,307,-8,7,5); road(484,338,-7,8,3);
  road(511,359,-10,5,6); divider(441,396,-1);
  // The two independently pitched banks below the LCD feed the start-pocket area.
  road(89,399,11.2,5.4,7); divider(104,437);
  road(139,459,11.4,4.9,6);
  road(210,478,11.75,3,6);
  road(493,406,-11,5.4,6); road(414,432,-10.5,3.8,6);
  road(465,457,-11,5.1,5); road(395,478,-11.7,3,6);
  divider(242,397); divider(349,406,-1);
  nail(280,459); nail(317,449); nail(294,423);
  // Two actual brass nails frame the narrow mouth above the single heso.
  nail(287.5,511,2.85,-.8); nail(312.5,511,2.85,.8);
  rails.push([35,237,51,270],[27,340,51,374],[62,446,92,466],[529,421,505,445]);
  const wheel={x:143,y:397,angle:-.46,speed:0,inertia:147};
  return {pegs,rails,wheel};
}

// The four swept vanes are capsules around these same center lines in both passes.
function windmillBlades(wheel,visit) {
  for(let i=0;i<4;i++) {
    const a=wheel.angle+i*Math.PI/2, tip=a+.28;
    visit(wheel.x+Math.cos(a)*3.3,wheel.y+Math.sin(a)*3.3,
      wheel.x+Math.cos(tip)*12.9,wheel.y+Math.sin(tip)*12.9,i);
  }
}
function advanceFieldwork(field,dt) {
  const wheel=field.wheel;
  wheel.angle=(wheel.angle+wheel.speed*dt)%(Math.PI*2);
  wheel.speed*=Math.exp(-1.18*dt);
  if(Math.abs(wheel.speed)<.015)wheel.speed=0;
}
function collideWindmill(ball,field,dt) {
  const w=field.wheel, ox=ball.x-w.x,oy=ball.y-w.y;
  if(ox*ox+oy*oy>22*22)return false;
  let hit=false;
  function resolve(x,y,r,spins) {
    const dx=ball.x-x, dy=ball.y-y, d=Math.hypot(dx,dy);
    if(d>=5+r)return;
    const nx=d>1e-6?dx/d:0, ny=d>1e-6?dy/d:-1;
    ball.x=x+nx*(5+r);ball.y=y+ny*(5+r);
    const lever=spins?(x-w.x)*ny-(y-w.y)*nx:0;
    const approach=ball.vx*nx+ball.vy*ny-w.speed*lever;
    if(approach>=0)return;
    const impulse=-(1+.43)*approach/(1+lever*lever/w.inertia);
    ball.vx+=impulse*nx;ball.vy+=impulse*ny;
    w.speed-=impulse*lever/w.inertia;hit=true;
  }
  windmillBlades(w,(x,y,a,b)=>{
    const dx=a-x,dy=b-y;
    const u=Math.max(0,Math.min(1,((ball.x-x)*dx+(ball.y-y)*dy)/(dx*dx+dy*dy)));
    resolve(x+u*dx,y+u*dy,2.65,true);
  });
  resolve(w.x,w.y,4.2,false);return hit;
}

function drawFieldwork(ctx, field, now) {
  function stroke(c,x,y,a,b,ink,width) {
    c.beginPath();c.moveTo(x,y);c.lineTo(a,b);
    c.strokeStyle=ink;c.lineWidth=width;c.stroke();
  }
  function oval(c,x,y,rx,ry,rot,ink) {
    c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);
    c.fillStyle=ink;c.fill();
  }
  if(!field.art) {
    const art = document.createElement('canvas');
    art.width=art.height=1200;
    const c=art.getContext('2d');c.scale(2,2);c.lineCap='round';
    for(const [x,y,a,b] of field.rails) {
      stroke(c,x+2,y+4,a+2,b+4,'#160e0ac7',5.1);
      stroke(c,x,y,a,b,'#3d3024',4.5);
      stroke(c,x-.25,y-.6,a-.25,b-.6,'#927658',3.35);
      stroke(c,x-.55,y-1.3,a-.55,b-1.3,'#e4cbaa',1);
      for(const [u,v] of [[x,y],[a,b]]) {
        oval(c,u,v,2.8,2,-.27,'#46392b');
        stroke(c,u-1,v-.5,u+1,v-.6,'#c7af86',.8);
      }
    }
    for(const p of field.pegs) {
      const x=p.x,y=p.y,footX=x-p.dx*.38,footY=y-p.dy*.38;
      const tipX=x+p.dx*.62,tipY=y+p.dy*.62;
      stroke(c,footX+.8,footY+.7,tipX+2.8,tipY+4.5,'#0e0909a8',3);
      oval(c,footX,footY,1.62,1.15,-.24,'#302117');
      stroke(c,footX,footY,tipX,tipY,'#4e3927',2.7);
      stroke(c,footX-.27,footY-.27,tipX-.31,tipY-.29,'#b18a56',1.65);
      stroke(c,footX-.45,footY-.57,tipX-.57,tipY-.2,'#ebc991',.67);
      oval(c,tipX+.22,tipY+.52,p.r*.96,p.r*.71,.19,'#443124');
      oval(c,tipX,tipY,p.r*.95,p.r*.62,.19,'#ae8751');
      oval(c,tipX-.16,tipY-.33,p.r*.78,p.r*.38,.13,'#eed29b');
      stroke(c,tipX-p.r*.52,tipY-.55,tipX+.2,tipY-.6,'#fff0c3',.7);
    }
    field.art=art;
  }
  ctx.drawImage(field.art,0,0,600,600);
  ctx.save();
  const w=field.wheel;
  ctx.lineCap='round';
  oval(ctx,w.x+1.7,w.y+3.1,8,7.6,0,'#0c0b0b9c');
  oval(ctx,w.x,w.y,7.5,7.5,0,'#dfedf3');
  oval(ctx,w.x,w.y,6.6,6.6,0,'#43617b');
  windmillBlades(w,(x,y,a,b,index)=>{
    stroke(ctx,x+1.7,y+2.8,a+1.7,b+2.8,'#090709a3',5.6);
    stroke(ctx,x,y,a,b,'#18344c',5.3);
    stroke(ctx,x-.15,y-.3,a-.15,b-.3,index%2?'#57b4d3':'#438dc4',4.3);
    stroke(ctx,x-.6,y-.75,a-.6,b-.75,index%2?'#c3f9ff':'#9bdcff',1.35);
  });
  oval(ctx,w.x,w.y,4.2,4.2,0,'#567383');
  oval(ctx,w.x-.25,w.y-.6,3.3,3.3,0,'#edfaff');
  oval(ctx,w.x-.35,w.y-.65,2.05,2.05,0,'#97b1b8');
  stroke(ctx,w.x-1.3,w.y-.2,w.x+.65,w.y-1.1,'#3e3429',.8);
  for(const p of field.pegs) {
    if(p.light<=0)continue;
    ctx.globalAlpha=Math.min(.85,p.light*7);
    oval(ctx,p.x+p.dx*.62,p.y+p.dy*.62,p.r,p.r*.65,.19,'#fff0b8');
  }
  ctx.restore();
}
