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
    this.accumulator = 0;
    this.awake = 0;
    this.dirty = true;
    this.ballRadius = 7.1;
    this.sequence = 0;
    this.sprites = Array.from({length: 12}, (_, index) => this.makeSteel(index));
    this.shell = this.makeShell();
  }

  makeSteel(index) {
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
      const y=67+i*8;
      path('M79 '+y+' Q221 '+(y-5)+' 405 '+(y-2)+' Q476 '+y+' 522 '+(y-4),null,'#f07e841c',1.4);
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
    // Fast occasional ricochets off the spout escape the dense main stream.
    const ricochet = Math.random() < .13;
    this.balls.push({
      x: 97+(Math.random()-.5)*32, z: 5+Math.random()*16, y: 39+Math.random()*4,
      vx: ricochet ? 215+Math.random()*385 : 22+Math.random()**1.6*260,
      vz: 18+Math.random()*118, vy: -10-Math.random()*35,
      finish: this.sequence++ % this.sprites.length
    });
    this.awake = 3;
  }

  take() {
    if (this.count === 0) return false;
    this.dirty = true;
    this.count--;
    let index=0, best=Infinity;
    for(let i=0;i<this.balls.length;i++){
      const ball=this.balls[i];
      const distance=(525-ball.x)**2+(93-ball.z)**2+ball.y**2;
      if(distance<best){best=distance;index=i;}
    }
    const [ball]=this.balls.splice(index,1);
    this.feed.push({...this.project(ball), finish:ball.finish, t:0});
    if(this.balls.length < Math.min(this.count,this.capacity)) this.dropBall();
    this.awake=3;
    return true;
  }

  project(ball) {
    const depth = Math.max(0,Math.min(1,ball.z/110));
    const scale = .92+.13*depth;
    return {x:300+(ball.x-300)*scale, y:49+ball.z*.76-ball.y*.78, scale};
  }

  constrain(ball,dt) {
    const radius=this.ballRadius;
    const z=Math.max(radius,Math.min(110-radius,ball.z));
    if(z!==ball.z){ball.vz*=-.42;ball.z=z;}
    // A rounded, narrower front corner keeps the pile inside the molded basin.
    const wall=41+18*(Math.abs((ball.z-55)/55)**2);
    const left=wall+radius,right=600-left;
    if(ball.x<left||ball.x>right){ball.x=Math.max(left,Math.min(right,ball.x));ball.vx*=-.42;}
    // The floor slopes into an off-center curved groove. It collects loose
    // balls toward the middle depth, so the heap does not fill wall to wall.
    const groove = 48+22*Math.sin(ball.x*.014)+8*Math.sin(ball.x*.029);
    const fromGroove = ball.z-groove;
    const floor = radius+.0045*fromGroove*fromGroove;
    if(ball.y<floor){
      ball.y=floor;
      ball.vy=ball.vy < -24 ? -ball.vy*.31 : 0;
      ball.vz-=fromGroove*.009*780*dt;
      const friction=Math.exp(-(Math.abs(ball.vx)>200 ? 1.5 : 5.4)*dt);
      ball.vx*=friction;ball.vz*=friction;
    }
  }

  integrate(dt) {
    for(const ball of this.balls){
      ball.vy-=780*dt;
      ball.vx+=4*dt;
      ball.vz+=7*dt;
      ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt;
      this.constrain(ball,dt);
    }
    const diameter=2*this.ballRadius;
    // Reuse bins each step; no all-pairs pass as the tray fills.
    for(const bin of this.cells.values()) bin.length=0;
    for(const ball of this.balls){
      const ix=Math.floor(ball.x/diameter),iz=Math.floor(ball.z/diameter),iy=Math.floor(ball.y/diameter);
      for(let dz=-1;dz<=1;dz++){
        for(let dy=-1;dy<=1;dy++){
          const row=ix+(iz+dz)*64+(iy+dy)*1024;
          for(let dx=-1;dx<=1;dx++){
            const bin=this.cells.get(row+dx);
            if(!bin)continue;
            for(const other of bin){
              const x=ball.x-other.x,y=ball.y-other.y,z=ball.z-other.z;
              const squared=x*x+y*y+z*z;
              if(squared>=diameter*diameter||squared<.000001)continue;
              const distance=Math.sqrt(squared),nX=x/distance,nY=y/distance,nZ=z/distance;
              const overlap=(diameter-distance)*.48;
              ball.x+=nX*overlap;other.x-=nX*overlap;
              ball.y+=nY*overlap;other.y-=nY*overlap;
              ball.z+=nZ*overlap;other.z-=nZ*overlap;
              const speed=(ball.vx-other.vx)*nX+(ball.vy-other.vy)*nY+(ball.vz-other.vz)*nZ;
              if(speed>=0)continue;
              const impulse=-.56*speed;
              ball.vx+=nX*impulse;other.vx-=nX*impulse;
              ball.vy+=nY*impulse;other.vy-=nY*impulse;
              ball.vz+=nZ*impulse;other.vz-=nZ*impulse;
            }
          }
        }
      }
      const cell=ix+iz*64+iy*1024;
      if(!this.cells.has(cell))this.cells.set(cell,[]);
      this.cells.get(cell).push(ball);
    }
  }

  advance(dt) {
    if(this.awake>0 || this.feed.length)this.dirty=true;
    if(this.awake>0){
      this.awake-=dt;this.accumulator+=Math.min(dt,.1);
      while(this.accumulator>=1/60){
        this.integrate(1/60);
        this.accumulator-=1/60;
      }
    }
    for(const ball of this.feed)ball.t+=dt;
    this.feed=this.feed.filter(ball=>ball.t<.34);
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
    const sorted=this.balls.slice().sort((a,b)=>(a.z+a.y*.72)-(b.z+b.y*.72));
    ctx.fillStyle='#2508134d';
    ctx.beginPath();
    for(const ball of sorted){
      const p=this.project(ball);
      const foot=49+ball.z*.76;
      ctx.moveTo(p.x+8*p.scale,foot+2);
      ctx.ellipse(p.x+2,foot+2,6.8*p.scale,2.5*p.scale,-.12,0,2*Math.PI);
    }
    ctx.fill();
    const paint=(x,y,scale,finish)=>{
      const edge=15.4*scale;
      ctx.drawImage(this.sprites[finish],x-edge/2,y-edge/2,edge,edge);
    };
    for(const ball of sorted){
      const p=this.project(ball);
      paint(p.x,p.y,p.scale,ball.finish);
    }
    for(const ball of this.feed){
      const t=ball.t/.34;
      const ease=t*t;
      paint(ball.x+(533-ball.x)*ease,ball.y+(122-ball.y)*ease,ball.scale*(1-.65*ease),ball.finish);
    }
    if(this.count>this.capacity){
      ctx.fillStyle='#161313db';ctx.fillRect(445,10,136,16);
      ctx.fillStyle='#e6cfc2';ctx.textAlign='right';ctx.font='11px sans-serif';
      ctx.fillText('하부 저장통 +'+(this.count-this.capacity),575,22);
    }
  }
}
