/* The tray uses horizontal X, depth Z and height Y. Gravity and contact are in
   tray space; only projection, reflections and shadows depend on the camera. */
class BallTray {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.count = 0;
    this.capacity = 540;
    this.balls = [];
    this.feed = [];
    this.cells = new Map();
    this.outlet = {x: 529, z: 117};
    this.race=[];
    this.accumulator = 0;
    this.awake = 0;
    this.dirty = true;
    this.ballRadius = 6.35;
    this.binSize = this.ballRadius*3.25;
    this.sequence = 0;
    this.sprites = Array.from({length: 12}, (_, index) => this.makeSteel(index));
    this.shell = this.makeShell();
    if(typeof Image!=='undefined'){
      const hardware=new Image();
      hardware.onload=()=>this.useHardware(hardware);
      hardware.src='receiving-tray.webp';
    }
  }

  useHardware(image) {
    this.shell=image;
    const thumb=document.createElement('canvas');
    thumb.width=128;thumb.height=40;
    const ctx=thumb.getContext('2d');
    ctx.drawImage(image,0,0,128,40);
    // file:// previews may allow drawing the asset but restrict pixel reads.
    try{
      const reflection=ctx.getImageData(0,0,128,40).data;
      this.sprites=this.sprites.map((_,index)=>this.makeSteel(index,reflection));
    }catch{}
    this.dirty=true;
  }

  makeSteel(index,reflection) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const ctx = sprite.getContext('2d');
    const pixels = ctx.createImageData(64, 64);
    const clamp = n => Math.max(0, Math.min(1, n));
    for (let row = 0; row < 64; row++) {
      for (let col = 0; col < 64; col++) {
        const nx = (col - 31.5) / 30.8, ny = (31.5 - row) / 30.8;
        const r2 = nx*nx + ny*ny;
        if (r2 >= 1) continue;
        const nz = Math.sqrt(1 - r2);
        // Reflection of the ceiling strips, window, dark screen and red basin.
        const rx = 2*nz*nx, ry = 2*nz*ny, rz = 2*nz*nz - 1;
        const longitude = Math.atan2(rx, rz) + .58*Math.sin(index*2.4);
        const latitude = Math.asin(ry) + .10*Math.cos(index*2.1+nx);
        const horizon = .02 + .09 * Math.sin(longitude * 3);
        let rgb;
        if (latitude > horizon) {
          const ceiling = .56 + .28*Math.cos(longitude*2.5)*Math.cos(latitude*1.8);
          rgb = [165*ceiling,177*ceiling,182*ceiling];
          if (latitude>.28 && latitude<.71 && Math.abs(longitude+.73)<.77) rgb=[233,243,241];
          if (latitude>.43 && latitude<.51 && Math.abs(longitude+.73)<.77) rgb=[116,135,136];
          if (latitude>.7 && latitude<.91 && Math.abs(longitude-.65)<1.2) rgb=[235,228,204];
          if (latitude<.25 && Math.cos(longitude*5)>.02) rgb=[31,36,37];
        } else {
          const desk = .36+.25*Math.sin(longitude*2.1+.3);
          rgb = [96+55*desk,44+45*desk,46+44*desk];
          if (latitude>horizon-.28) rgb=[24,27,26];
          if (latitude<-.66) rgb=[113,111,105];
          if (Math.abs(latitude+.47+.09*Math.sin(longitude*2))<.065) rgb=[205,150,143];
          if(reflection){
            const px=Math.max(0,Math.min(127,Math.floor(64+53*Math.sin(longitude+index*.18))));
            const py=Math.max(0,Math.min(39,Math.floor(19+17*Math.sin(-latitude*2+longitude))));
            const sample=(py*128+px)*4;
            rgb=rgb.map((v,c)=>v*.63+reflection[sample+c]*.37);
          }
        }
        const rim = clamp((.25-nz)*4);
        const specular = Math.exp(-105*((nx+.31+.09*Math.sin(index))**2+(ny-.54)**2));
        const shading = .55 + .42*nz + .24*ny;
        const broadLight = 80*Math.exp(-4.4*((nx+.30)**2+(ny-.46)**2));
        const offset = (row*64+col)*4;
        for(let c=0;c<3;c++) pixels.data[offset+c] = rgb[c]*shading*(1-.55*rim)+100*rim+broadLight+150*specular;
        pixels.data[offset+3] = 255*clamp((1-r2)*28);
      }
    }
    ctx.putImageData(pixels,0,0);
    return sprite;
  }

  makeShell() {
    const shell = document.createElement('canvas');
    shell.width = 1200; shell.height = 328;
    const c = shell.getContext('2d');
    c.scale(2,2);
    const vertical = (top,bottom,stops) => {
      const gradient=c.createLinearGradient(0,top,0,bottom);
      stops.forEach(([p,color])=>gradient.addColorStop(p,color));
      return gradient;
    };
    const path = (shape, fill, stroke, width=1) => {
      const p = new Path2D(shape);
      if(fill){c.fillStyle=fill;c.fill(p);}
      if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}
    };
    const back = 'M2 8 Q4 2 20 2 L580 2 Q595 2 598 9 L595 44 Q590 50 582 52 L18 52 Q8 48 4 40 Z';
    path(back,vertical(0,52,[[0,'#242829'],[.07,'#b8babc'],[.13,'#343c3e'],[.19,'#100f10'],[.53,'#37383b'],[.62,'#12171a'],[.83,'#1d171a'],[1,'#77404a']]),'#0a0908',2);
    path('M13 8 Q90 5 158 8 L203 11 Q112 10 16 13 Z','#e5e6db40');
    path('M367 8 Q465 6 579 8 L574 10 Q460 9 367 10 Z','#ebffff5e');
    path('M34 20 Q86 19 180 21 M395 21 Q481 18 565 21',null,'#bccfcd28');
    // Deep, chromed payout throat; its lower red bevel sits behind the balls.
    path('M66 10 L127 10 Q132 11 132 15 L127 28 Q124 31 120 31 L74 31 Q68 31 67 27 L62 16 Q60 11 66 10 Z',vertical(10,31,[[0,'#d0c9bb'],[.15,'#8c8479'],[.31,'#242422'],[.8,'#100e0e'],[1,'#c3847a']]),'#28211f');
    path('M69 15 L125 15 L120 25 L74 25 Z','#080707');
    path('M71 24 L124 24',null,'#ce716c',1.5);
    const outer = 'M9 33 C42 28 108 31 163 31 L457 31 Q552 29 590 35 Q597 37 597 48 L589 124 Q586 145 569 151 Q524 163 452 162 L133 162 Q68 161 32 153 Q13 149 10 133 L3 49 Q2 37 9 33 Z';
    path(outer,vertical(31,163,[[0,'#e26569'],[.045,'#7e1720'],[.085,'#360811'],[.22,'#8b1e2e'],[.52,'#650918'],[.74,'#a42232'],[.86,'#bf4850'],[.91,'#841725'],[.98,'#420716'],[1,'#280709']]),'#26090d',2);
    const well = 'M35 42 Q91 36 166 37 L454 37 Q515 36 567 41 Q575 42 574 51 L566 110 Q562 127 548 133 Q505 146 441 146 L145 146 Q84 145 50 134 Q36 130 32 112 L23 54 Q22 44 35 42 Z';
    path(well,vertical(36,149,[[0,'#3a0a13'],[.13,'#410813'],[.31,'#6b1020'],[.52,'#801928'],[.68,'#711322'],[.85,'#500b16'],[1,'#380711']]),'#e35e6b',1.5);
    const floor = 'M56 60 Q99 51 160 52 L455 52 Q520 51 551 57 L543 110 Q538 125 525 129 Q473 139 433 138 L156 138 Q99 139 67 129 Q57 126 53 112 L46 73 Q45 64 56 60 Z';
    path(floor,vertical(51,139,[[0,'#66121d'],[.32,'#9b2a37'],[.64,'#8d2330'],[1,'#781722']]),'#5d0c1788',1.2);
    for(let i=0;i<8;i++){
      const y=61+i*8;
      path('M79 '+y+' Q210 '+(y+1)+' 382 '+(y+9)+' Q471 '+(y+13)+' 522 '+(y+11),null,'#f07e841c',1.4);
    }
    path('M32 45 Q69 34 149 37 M458 37 Q529 35 569 42 M8 54 L16 122 Q19 144 37 149 Q76 161 151 159 M449 158 Q534 159 570 145 Q583 138 585 124',null,'#ff999d9c',1.3);
    path('M23 86 Q29 124 36 131 Q45 142 71 146 L112 151 Q65 148 44 142 Q29 137 26 121 Z','#fba1a52d');
    path('M569 98 Q566 127 548 135 Q529 141 495 145 Q557 142 568 126 Z','#ffadb442');
    path('M72 153 Q174 160 395 156 M443 155 Q491 155 535 150',null,'#ff909544');
    // Lower right intake. Balls disappear only after rolling through this lip.
    path('M520 115 Q533 111 548 116 Q554 118 551 124 Q546 131 529 132 Q518 132 514 128 Q510 123 520 115 Z',vertical(112,132,[[0,'#e56b71'],[.2,'#550b13'],[.47,'#1a0608'],[.8,'#110506'],[1,'#b93846']]),'#8b222d');
    return shell;
  }

  deposit() {
    this.dirty = true;
    this.count++;
    if (this.balls.length < this.capacity) this.dropBall();
  }

  dropBall() {
    // A congested chute delays the next release until there is clear space.
    // Never start two physical balls inside one another.
    for(let attempt=0;attempt<9;attempt++){
      const ball={
        x:80+Math.random()*44,z:8+Math.random()*22,y:29+Math.random()*13,
        vx:35+Math.random()**1.5*345,vz:18+Math.random()*145,vy:-12-Math.random()*30,
        finish:this.sequence%this.sprites.length
      };
      if(!this.hasClearance(ball))continue;
      this.sequence++;
      this.balls.push(ball);
      this.putInBin(ball);
      this.awake=7;
      return true;
    }
    return false;
  }

  take() {
    if(!this.count || this.feed.length)return false;
    const lead=this.race[0];
    const ready=lead && lead.entry===1 && lead.x>=this.outlet.x-.45;
    const ball=ready ? lead : this.balls.find(candidate=>!candidate.race &&
      candidate.y<this.ballRadius+1 && Math.hypot(candidate.x-this.outlet.x,candidate.z-this.outlet.z)<8);
    if(!ball){
      this.awake=Math.max(this.awake,1);
      return false;
    }
    if(ready)this.race.shift();
    this.balls.splice(this.balls.indexOf(ball),1);
    this.removeFromBin(ball);
    this.feed.push({...this.project(ball),finish:ball.finish,t:0});
    this.count--;this.dirty=true;this.awake=7;
    if(this.balls.length<Math.min(this.capacity,this.count))this.dropBall();
    return true;
  }

  project(ball) {
    const depth=Math.max(0,Math.min(1,ball.z/124));
    const scale=.91+.14*depth;
    const x=300+(ball.x-300)*scale-17*Math.max(0,(ball.x-165)/364);
    if(ball.race){
      const t=ball.entry;
      const targetX=522+(ball.x-this.outlet.x)*1.015;
      const targetY=127+(ball.x-this.outlet.x)*.029;
      return {x:ball.entryX+(targetX-ball.entryX)*t,y:ball.entryY+(targetY-ball.entryY)*t*t,scale};
    }
    return {x,y:61+ball.z*.54-ball.y*.57-(532-ball.x)*.012+4.5*depth,scale};
  }

  floorAt(x,z) {
    // The molded final race drops into the throat. Unlike a flat pocket,
    // its downhill face lets the leading sphere roll clear of a lateral arch.
    const behindLip=this.frontLip(x)-z;
    return this.ballRadius+Math.max(0,Math.min(2.8,(behindLip-18)*.06));
  }

  key(ball) {
    const size=this.binSize;
    return Math.floor(ball.x/size)+Math.floor(ball.z/size)*64+Math.floor(ball.y/size)*1024;
  }

  putInBin(ball) {
    ball.bin=this.key(ball);
    if(!this.cells.has(ball.bin))this.cells.set(ball.bin,[]);
    this.cells.get(ball.bin).push(ball);
  }

  removeFromBin(ball) {
    const bin=this.cells.get(ball.bin);
    const i=bin.indexOf(ball);
    bin[i]=bin[bin.length-1];bin.pop();
  }

  hasClearance(ball,ignore=null) {
    const diameter=this.ballRadius*2+(ignore?.00005:.002);
    const key=this.key(ball);
    for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){
      const bin=this.cells.get(key+y*1024+z*64+x);
      if(!bin)continue;
      for(const other of bin){
        if(other===ignore)continue;
        const dx=ball.x-other.x,dy=ball.y-other.y,dz=ball.z-other.z;
        if(dx*dx+dy*dy+dz*dz < diameter*diameter)return false;
      }
    }
    return true;
  }

  move(ball,dt) {
    const radius=this.ballRadius,diameter=2*radius+.0003;
    const startX=ball.x,startY=ball.y,startZ=ball.z;
    let contacted=false;
    // World Y is measured normal to the inclined floor. Its downhill gravity
    // component carries the steel balls toward the right-hand discharge.
    ball.vy-=760*dt;
    const gx=this.outlet.x-ball.x,gz=this.outlet.z-ball.z;
    const distance=Math.max(1,Math.hypot(gx,gz));
    const acceleration=distance<85 ? 180 : 84;
    ball.vx+=acceleration*gx/distance*dt;
    ball.vz+=acceleration*gz/distance*dt;
    if(ball.y<this.floorAt(ball.x,ball.z)+.14){
      const friction=Math.exp(-.54*dt);
      ball.vx*=friction;ball.vz*=friction;
    }
    const steps=Math.max(1,Math.ceil(Math.hypot(ball.vx,ball.vy,ball.vz)*dt/(.65*radius)));
    for(let n=0;n<steps;n++){
      const tick=dt/steps;
      let dx=ball.vx*tick,dy=ball.vy*tick,dz=ball.vz*tick;
      for(let iteration=0;iteration<3;iteration++){
        // Project proposed travel onto the molded chamber's boundary.
        const front=117.6+Math.min(0,(ball.x-529)*.043);
        const z=Math.max(radius,Math.min(front,ball.z+dz));
        const wall=33+18*((z-62)/62)**2+radius;
        // The guide widens slightly toward the outlet, preventing a stable
        // arch between an inward-sloping wall and the last ball in a row.
        const right=Math.min(600-wall,529+(z-117)*.085);
        const x=Math.max(wall,Math.min(right,ball.x+dx));
        const y=Math.max(this.floorAt(x,z),ball.y+dy);
        if(z!==ball.z+dz)ball.vz*=-.18;
        if(x!==ball.x+dx)ball.vx*=-.18;
        if(y!==ball.y+dy)ball.vy=ball.vy < -32 ? -ball.vy*.29 : 0;
        dx=x-ball.x;dy=y-ball.y;dz=z-ball.z;
        const travel=dx*dx+dy*dy+dz*dz;
        if(travel<1e-10)break;
        let fraction=1,obstacle=null;
        const key=this.key(ball);
        for(let cy=-1;cy<=1;cy++)for(let cz=-1;cz<=1;cz++)for(let cx=-1;cx<=1;cx++){
          const bin=this.cells.get(key+cy*1024+cz*64+cx);
          if(!bin)continue;
          for(const other of bin){
            if(other===ball)continue;
            const ox=ball.x-other.x,oy=ball.y-other.y,oz=ball.z-other.z;
            const approach=dx*ox+dy*oy+dz*oz;
            if(approach>=0)continue;
            const clearance=ox*ox+oy*oy+oz*oz-diameter*diameter;
            const discriminant=approach*approach-travel*clearance;
            if(discriminant<0)continue;
            const hit=Math.max(0,(-approach-Math.sqrt(discriminant))/travel);
            if(hit<fraction){fraction=hit;obstacle=other;}
          }
        }
        // Sweep against static positions before committing. Later movers see
        // this position through the same spatial index in the very same step.
        const safe=Math.max(0,fraction-.000001);
        ball.x+=dx*safe;ball.y+=dy*safe;ball.z+=dz*safe;
        if(this.key(ball)!==ball.bin){this.removeFromBin(ball);this.putInBin(ball);}
        if(!obstacle)break;
        contacted=true;
        const ox=ball.x-obstacle.x,oy=ball.y-obstacle.y,oz=ball.z-obstacle.z;
        const distance=Math.hypot(ox,oy,oz);
        const nx=ox/distance,ny=oy/distance,nz=oz/distance;
        const relative=(ball.vx-obstacle.vx)*nx+(ball.vy-obstacle.vy)*ny+(ball.vz-obstacle.vz)*nz;
        if(relative<0){
          const impulse=-relative*(relative < -32 ? .58 : .50);
          ball.vx+=nx*impulse;ball.vy+=ny*impulse;ball.vz+=nz*impulse;
          obstacle.vx-=nx*impulse;obstacle.vy-=ny*impulse;obstacle.vz-=nz*impulse;
        }
        const tangent=dx*nx+dy*ny+dz*nz;
        dx=(dx-nx*tangent)*(1-fraction);
        dy=(dy-ny*tangent)*(1-fraction);
        dz=(dz-nz*tangent)*(1-fraction);
      }
    }
    if(contacted){
      // A supported ball has no falling speed. Retaining velocity that the
      // contact actually prevented lets an idle pile accumulate false energy.
      const observed=.45/dt;
      ball.vx=ball.vx*.55+(ball.x-startX)*observed;
      ball.vy=ball.vy*.55+(ball.y-startY)*observed;
      ball.vz=ball.vz*.55+(ball.z-startZ)*observed;
    }
  }

  frontLip(x) {
    return 117.6+Math.min(0,(x-529)*.043);
  }

  fillRace() {
    if(this.race.length>=6)return;
    const spacing=2*this.ballRadius+.35;
    let chosen=null;
    for(const ball of this.balls){
      if(ball.race || ball.x>this.outlet.x+.4 || ball.y>this.ballRadius+.10)continue;
      if(ball.z<this.frontLip(ball.x)-this.ballRadius*1.35)continue;
      if(this.race.some(other=>Math.abs(other.x-ball.x)<spacing))continue;
      if(!chosen || ball.x>chosen.x)chosen=ball;
    }
    if(!chosen)return;
    const p=this.project(chosen);
    chosen.race=true;chosen.entry=0;chosen.entryX=p.x;chosen.entryY=p.y;
    chosen.entryZ=chosen.z;chosen.entryHeight=chosen.y;chosen.vx=Math.max(0,Math.min(100,chosen.vx));
    this.race.push(chosen);
    this.race.sort((a,b)=>b.x-a.x);
  }

  settleFront(dt) {
    // Resolve static friction against the tray's crossfall when a sparse
    // residual pile interlocks. The frontmost ball has unobstructed downhill
    // space ahead; roll it incrementally along the surface toward the rim.
    if(this.race.length>2)return;
    let leader=null,front=-Infinity;
    for(const ball of this.balls){
      if(ball.race)continue;
      const z=ball.z-this.frontLip(ball.x);
      if(z>front){front=z;leader=ball;}
    }
    if(!leader || front>=-this.ballRadius*.4)return;
    const vz=Math.max(0,leader.crossfallSpeed||0);
    const speed=Math.min(78,vz+95*dt);
    const z=Math.min(this.frontLip(leader.x),leader.z+speed*dt);
    const y=Math.max(this.floorAt(leader.x,z),leader.y-.12);
    const next={x:leader.x,y,z};
    if(!this.hasClearance(next,leader))return;
    this.removeFromBin(leader);
    leader.z=z;leader.y=y;leader.crossfallSpeed=speed;
    this.putInBin(leader);
  }

  advanceRace(dt) {
    // A recessed single-file channel spans the front rim. A sphere has to
    // physically roll over that rim before gravity carries it to the gate.
    // Settled balls queue a full diameter apart; removing the lead ball
    // simply frees that length of channel for the next one to roll into.
    let limit=this.outlet.x;
    const spacing=2*this.ballRadius+.35;
    for(const ball of this.race){
      const entry=Math.min(1,ball.entry+dt/.21);
      let x=ball.x;
      if(entry===1){
        ball.vx=Math.min(188,ball.vx+360*dt);
        x=Math.min(limit,x+ball.vx*dt);
        if(x===limit)ball.vx=0;
      }
      const destZ=this.frontLip(x)+this.ballRadius*1.75;
      const fall=Math.min(1,entry*1.65);
      const y=ball.entryHeight+(-this.ballRadius-1-ball.entryHeight)*fall*fall;
      const z=ball.entryZ+(destZ-ball.entryZ)*Math.max(0,(entry-.61)/.39);
      const target={x,y,z};
      if(this.hasClearance(target,ball)){
        this.removeFromBin(ball);
        ball.x=x;ball.y=y;ball.z=z;ball.entry=entry;
        this.putInBin(ball);
      }
      limit=ball.x-spacing;
    }
    this.fillRace();
  }

  advance(dt) {
    if(this.awake>0 || this.feed.length)this.dirty=true;
    if(this.awake>0){
      this.awake-=dt;this.accumulator+=Math.min(dt,.1);
      while(this.accumulator>=1/60){
        if(this.balls.length<Math.min(this.count,this.capacity))this.dropBall();
        this.advanceRace(1/60);
        for(let i=this.balls.length-1;i>=0;i--){
          if(!this.balls[i].race)this.move(this.balls[i],1/60);
        }
        this.settleFront(1/60);
        this.accumulator-=1/60;
      }
    }
    for(const ball of this.feed)ball.t+=dt;
    this.feed=this.feed.filter(ball=>ball.t<.16);
  }

  drawPlayfieldBall(ctx, ball) {
    ctx.fillStyle='#100a0b99';
    ctx.beginPath();
    ctx.ellipse(ball.x+1.4,ball.y+2.2,4.8,4.3,0,0,2*Math.PI);
    ctx.fill();
    ctx.drawImage(this.sprites[0],ball.x-5.2,ball.y-5.2,10.4,10.4);
  }

  draw() {
    const ctx=this.context;
    const width=Math.round(this.canvas.clientWidth*Math.min(devicePixelRatio,2));
    if(!width)return;
    const height=Math.round(width*164/600);
    if(width!==this.canvas.width||height!==this.canvas.height){
      this.canvas.width=width;this.canvas.height=height;
    }else if(!this.dirty){
      return;
    }
    this.dirty=false;
    ctx.setTransform(width/600,0,0,height/164,0,0);
    ctx.clearRect(0,0,600,164);
    ctx.drawImage(this.shell,0,0,600,164);
    // The clear acrylic lip separates the single-file race at the front
    // from the reservoir. The channel converges on the dark outlet at right.
    ctx.beginPath();
    ctx.moveTo(48,109);ctx.bezierCurveTo(173,111,394,120,510,123);
    ctx.strokeStyle='#39081270';ctx.lineWidth=2.4;ctx.stroke();
    ctx.strokeStyle='#f1a3aa59';ctx.lineWidth=.7;ctx.stroke();
    const sorted=this.balls.slice().sort((a,b)=>(a.z+a.y*.72)-(b.z+b.y*.72));
    ctx.fillStyle='#2508134d';
    ctx.beginPath();
    for(const ball of sorted){
      const p=this.project(ball);
      const foot=61+ball.z*.54-(532-ball.x)*.012+4.5*ball.z/124;
      ctx.moveTo(p.x+8*p.scale,foot+2);
      ctx.ellipse(p.x+2,foot+2,5.7*p.scale,2.1*p.scale,-.12,0,2*Math.PI);
    }
    ctx.fill();
    const paint=(x,y,scale,finish)=>{
      const edge=(2*this.ballRadius+.5)*scale;
      ctx.drawImage(this.sprites[finish],x-edge/2,y-edge/2,edge,edge);
    };
    for(const ball of sorted){
      const p=this.project(ball);
      paint(p.x,p.y,p.scale,ball.finish);
    }
    for(const ball of this.feed){
      const t=ball.t/.16;
      const ease=t*t;
      paint(ball.x+(522-ball.x)*ease,ball.y+(127-ball.y)*ease,ball.scale*(1-.65*ease),ball.finish);
    }
    const stored=this.count-this.balls.length;
    if(stored>0){
      ctx.fillStyle='#161313db';ctx.fillRect(445,10,136,16);
      ctx.fillStyle='#e6cfc2';ctx.textAlign='right';ctx.font='11px sans-serif';
      ctx.fillText('저장통 +'+stored,575,22);
    }
  }
}
