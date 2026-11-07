/* Brass playfield hardware, in the same 600-unit coordinate system as the balls. */
function createFieldwork() {
  const pegs = [];
  const rails = [];
  const shaftRadius=0.85; // 1.85 mm shaft relative to an 11 mm ball (10 board units).
  function nail(x, y, headRadius = 2.0, cant = 0) {
    const index = pegs.length;
    const grain = Math.sin(index * 47.6 + x * .12);
    pegs.push({x, y, r: shaftRadius, headRadius, light: 0, dx: 1.8 + cant + grain * .42, dy: -4.9 + grain * .58});
  }
  // Coordinates describe shaft centers in the collision plane. Each group
  // is an actual set of pins; the gaps between groups are open to the drain.
  function row(x,y,dx,dy,count,cant=0){
    // For a touching row, the tops of successive contact circles must always
    // fall downhill. Otherwise a stationary ball can balance in their valley.
    // Isolated pins with a full ball of daylight retain their original pitch.
    const pitch2=dx*dx+dy*dy,contactRadius=5+shaftRadius;
    const length=count-1;
    const intervals=pitch2>=4*contactRadius*contactRadius ? length :
      Math.max(length,Math.ceil(length*pitch2/(1.94*contactRadius*Math.abs(dy))));
    for(let i=0;i<=intervals;i++){
      const along=length*i/intervals;
      nail(x+dx*along,y+dy*along,1.85,cant);
    }
  }
  const wheel={x:79,y:327,angle:-.46,speed:0,inertia:147};
  const heso={x:300,y:464,halfSpacing:8.2,nailRadius:shaftRadius};
  // Incoming fan narrows to two three-pin columns directly above the rotor.
  row(49,130,12,-8,4); row(90,148,-11,8,3);
  row(40,183,13,-6,3); nail(89,191);
  row(44,215,12,6,3); nail(91,234);
  row(36,245,6,9,3); row(66,253,5,7,3);
  row(73,281,0,8,3,-.3); row(91,281,0,8,3,.3);
  // Catch a portion of the inward wheel exits on the road. Each run has a
  // different pitch; the last single jump nail stands clear of the mouth.
  row(58,354,7,4.1,5); row(105,374,7.4,3.6,6);
  row(155,393,7.4,3.45,5); row(196,414,7.6,3.3,6);
  row(246,435,7.6,3.25,5);
  nail(280,460.8,1.95,-.25);
  nail(heso.x-heso.halfSpacing,heso.y,1.96,-.55);
  nail(heso.x+heso.halfSpacing,heso.y,1.96,.55);
  nail(320,460.8,1.95,.25);
  // Short right-side banks are interspersed with the independent acrylic
  // transfer hardware. The lower outside nails disperse misses toward OUT.
  row(508,144,11,6,4); row(550,181,-9,8,3);
  row(513,219,9,6,4); row(557,261,-8,9,3); row(509,292,8,7,3);
  row(514,321,-8,8,4); row(498,366,-8,4,4);
  row(467,391,-8,4,4); row(425,414,-8,3.4,4);
  row(379,433,-8,3.1,5);
  row(53,378,-5,11,3); row(74,418,6,9,3);
  row(121,439,-7,9,3); row(159,470,8,4,3);
  row(209,492,8,3.7,3); row(413,479,-8,5,3);
  row(457,449,5,9,3); row(353,504,-8,4,3);
  rails.push([27,340,51,374],[62,446,92,466],[529,421,505,445]);
  // This single open-ended chain goes up the left wall, around the glass and
  // down the right wall. Its only opening is the bottom drain throat.
  const drain={x:300, y:586, halfWidth:19};
  const leftSkirt=[[281,594],[281,576],[265,566],[194,550],[123,530],
    [66,509],[32,487],[18,462],[10,424],[9,347],[9,176]];
  const perimeter=[...leftSkirt];
  for(let i=1;i<20;i++) {
    const a=i*Math.PI/20;
    perimeter.push([300-291*Math.cos(a),176-167*Math.sin(a)]);
  }
  for(const [x,y] of leftSkirt.slice().reverse())perimeter.push([600-x,y]);
  const hardwareRailCount=rails.length;
  for(let i=1;i<perimeter.length;i++)rails.push([...perimeter[i-1],...perimeter[i]]);

  return {pegs,rails,wheel,heso,perimeter,leftSkirt,hardwareRailCount,drain};
}

function enteredOut(ball,field) {
  const {x,y,halfWidth}=field.drain;
  if(ball.previousY>=y || ball.y<y)return false;
  const at=ball.previousX+(ball.x-ball.previousX)*(y-ball.previousY)/(ball.y-ball.previousY);
  return Math.abs(at-x)<halfWidth;
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
    const outline=()=> {
      c.beginPath();
      field.perimeter.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    };
    // Fill the metal below both shoulders but leave the central drain open.
    for(const mirror of [false,true]) {
      c.save();
      if(mirror){c.translate(600,0);c.scale(-1,1);}
      c.beginPath();
      field.leftSkirt.slice(0,-2).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
      c.lineTo(-2,424);c.lineTo(-2,605);c.lineTo(field.leftSkirt[0][0],605);c.closePath();
      const lip=c.createLinearGradient(0,475,0,600);
      lip.addColorStop(0,'#1c201fa8');lip.addColorStop(.45,'#3d3b35da');lip.addColorStop(1,'#171915');
      c.fillStyle=lip;c.fill();c.restore();
    }
    c.lineJoin='round';
    for(const [width,color,dy] of [[9,'#161917bc',2],[6,'#332b22',0],[4.5,'#a79479',0],[2.3,'#d5d4bb',-.55],[.9,'#f8f4dc',-1.1]]){
      c.save();c.translate(0,dy);outline();c.strokeStyle=color;c.lineWidth=width;c.stroke();c.restore();
    }
    const {x:mouthX,y:mouthY,halfWidth}=field.drain;
    c.fillStyle='#080a0a';c.fillRect(mouthX-halfWidth+2,mouthY-9,halfWidth*2-4,21);
    c.strokeStyle='#776d59';c.lineWidth=1;
    for(let i=-13;i<15;i+=5)stroke(c,mouthX+i,mouthY+3,mouthX+i-4,598,'#3c3930',1.4);
    c.fillStyle='#e4cfab';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText('OUT',mouthX,596);
    for(const [x,y,a,b] of field.rails.slice(0,field.hardwareRailCount)) {
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
      // The player looks almost straight down each shaft. Keep the head over
      // its contact coordinate and project the mounting hole behind it.
      const x=p.x,y=p.y,r=p.headRadius;
      const footX=x-p.dx*.48+(300-x)*.005,footY=y-p.dy*.73;
      stroke(c,footX+.7,footY+.6,x+2.2,y+2.3,'#0b0e14a3',r*1.15);
      oval(c,footX,footY,r*.59,r*.5,-.12,'#26282a');
      stroke(c,footX,footY,x,y,'#3c3020',r*1.02);
      stroke(c,footX-.25,footY-.1,x-.25,y,'#c4a460',r*.53);
      stroke(c,footX-.44,footY-.15,x-.44,y,'#fff2b8',r*.18);
      // A white lamp strip and a dark central reflection give the shallow
      // round cap its polished brass finish. Silver balls have a much wider highlight.
      const face=c.createLinearGradient(x-r,y-r*.2,x+r,y+r*.23);
      for(const [stop,color] of [[0,'#736039'],[.17,'#ead99a'],[.31,'#fff7c9'],
        [.40,'#a78a49'],[.55,'#765c31'],[.7,'#bf9d56'],[.89,'#f7df98'],[1,'#937039']]){
        face.addColorStop(stop,color);
      }
      oval(c,x+.15,y+.32,r*1.02,r*.96,.05,'#4b3924');
      oval(c,x,y,r*.97,r*.91,.05,face);
      oval(c,x-.22*r,y-.47*r,r*.33,r*.19,-.31,'#fffae1');
      c.beginPath();c.ellipse(x,y,r*.82,r*.72,.05,.43,1.8);
      c.lineWidth=r*.22;c.strokeStyle='#f0d48b';c.stroke();
    }
    field.art=art;
  }
  ctx.drawImage(field.art,0,0,600,600);
  ctx.save();
  const w=field.wheel;
  ctx.lineCap='round';
  // The transparent retaining cap is in front of the rotor; balls touch
  // the short molded vanes behind it. Its outer lip is visible by refraction.
  const capRadius=14.2;
  ctx.beginPath();ctx.arc(w.x+1,w.y+1.6,capRadius,0,Math.PI*2);
  ctx.lineWidth=1.6;ctx.strokeStyle='#1727358a';ctx.stroke();
  oval(ctx,w.x,w.y,capRadius,capRadius,0,'#85d8fa14');
  windmillBlades(w,(x,y,a,b,index)=>{
    stroke(ctx,x+.6,y+1,a+.6,b+1,'#19394e99',5.3);
    stroke(ctx,x,y,a,b,index%2?'#77c9e95c':'#8eb7db59',4.6);
    stroke(ctx,x-.53,y-.6,a-.53,b-.6,'#d6f4ffba',1);
  });
  const rim=ctx.createLinearGradient(w.x-12,w.y-10,w.x+11,w.y+11);
  rim.addColorStop(0,'#ccedffce');rim.addColorStop(.3,'#6687a981');
  rim.addColorStop(.62,'#2353797d');rim.addColorStop(.85,'#a5dcffcf');rim.addColorStop(1,'#efffffab');
  for(const radius of [capRadius,capRadius-1.55,8.8]){
    ctx.beginPath();ctx.arc(w.x,w.y,radius,0,Math.PI*2);
    ctx.strokeStyle=rim;ctx.lineWidth=radius===capRadius?1.15:.7;ctx.stroke();
  }
  oval(ctx,w.x,w.y,4.1,4.1,0,'#8fbed283');
  oval(ctx,w.x,w.y,2.45,2.45,0,'#6f572c');
  oval(ctx,w.x-.1,w.y-.2,1.95,1.9,0,'#c8a35e');
  oval(ctx,w.x-.65,w.y-.75,.78,.58,-.27,'#fff4c7');
  for(const p of field.pegs) {
    if(p.light<=0)continue;
    ctx.globalAlpha=Math.min(.68,p.light*5.5);
    oval(ctx,p.x-p.headRadius*.22,p.y-p.headRadius*.47,p.headRadius*.48,p.headRadius*.21,-.31,'#ffffdf');
  }
  ctx.restore();
}


// A ball can graze the narrow shaft while passing behind the wider front cap.
// Copy only that cap from the same cached artwork, leaving the shaft behind it.
function drawOccludingNailCaps(ctx,field,balls){
  if(!field.art)return;
  ctx.save();ctx.beginPath();
  let visible=false;
  for(const ball of balls){
    if(ball.launch || ball.route!=='field')continue;
    for(const p of field.pegs){
      const dx=ball.x-p.x,dy=ball.y-p.y;
      const reach=5+p.headRadius+.5;
      if(dx*dx+dy*dy>reach*reach)continue;
      ctx.moveTo(p.x+.15+p.headRadius*1.02,p.y+.32);
      ctx.ellipse(p.x+.15,p.y+.32,p.headRadius*1.02,p.headRadius*.96,.05,0,Math.PI*2);
      visible=true;
    }
  }
  if(visible){ctx.clip();ctx.drawImage(field.art,0,0,600,600);}
  ctx.restore();
}
