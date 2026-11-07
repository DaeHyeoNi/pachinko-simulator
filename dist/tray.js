// Balls fall from the payout chute, bounce on the pile and roll into the feed.
class BallTray {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.count = 0;
    this.balls = [];
    this.accumulator = 0;
    this.awake = 0;
    this.columns = 61;
    this.cells = Array.from({length: 61 * 12}, () => []);
    this.feed = [];
    this.capacity = 540;
    this.sprite = document.createElement('canvas');
    this.sprite.width = this.sprite.height = 20;
    const ctx = this.sprite.getContext('2d');
    const steel = ctx.createRadialGradient(7, 5, 0, 10, 10, 9);
    [[0,'#fff'],[.22,'#f2f5ed'],[.47,'#98aaa8'],[.63,'#51585a'],[.8,'#242a2c'],[1,'#c2c7b8']].forEach(([p,c])=>steel.addColorStop(p,c));
    ctx.fillStyle = steel;
    ctx.beginPath(); ctx.arc(10,10,9,0,Math.PI*2); ctx.fill();
  }
  deposit() {
    this.count++;
    if(this.balls.length>=this.capacity)return;
    this.dropBall();
  }
  dropBall() {
    this.balls.push({x:72+Math.random()*8-4,y:4,vx:65+Math.random()*330,vy:25+Math.random()*50});
    this.awake=5;
  }
  take() {
    if(!this.count)return false;
    this.count--;
    // The ball nearest the lower feed lip rolls out first.
    let nearest=0, distance=Infinity;
    this.balls.forEach((ball,index)=>{
      const d=(590-ball.x)**2+4*(103-ball.y)**2;
      if(d<distance){nearest=index;distance=d}
    });
    const [ball]=this.balls.splice(nearest,1);
    this.feed.push({x:ball.x,y:ball.y,t:0});
    if(this.count>this.balls.length)this.dropBall();
    this.awake=5;
    return true;
  }
  integrate(dt) {
    const balls=this.balls;
    for(const ball of balls){
      ball.vy+=920*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x<6||ball.x>594){ball.x=Math.max(6,Math.min(594,ball.x));ball.vx*=-.52}
      const floor=94+ball.x*.012;
      if(ball.y>=floor){
        ball.y=floor;
        ball.vy=ball.vy>24?-ball.vy*.32:0;
        ball.vx=ball.vx*.96+7*dt;
      }
    }
    for(let pass=0;pass<3;pass++){
      for(const cell of this.cells)cell.length=0;
      for(const ball of balls){
      ball.x=Math.max(5,Math.min(595,ball.x));
      ball.y=Math.min(94+ball.x*.012,ball.y);
      const col=Math.max(0,Math.min(60,Math.floor(ball.x/10)));
      const row=Math.max(0,Math.min(11,Math.floor(ball.y/10)));
      for(let cy=Math.max(0,row-1);cy<=Math.min(11,row+1);cy++){
        for(let cx=Math.max(0,col-1);cx<=Math.min(60,col+1);cx++){
          for(const other of this.cells[cy*this.columns+cx]){
            const dx=ball.x-other.x,dy=ball.y-other.y,dd=dx*dx+dy*dy;
            if(dd>=86.49||dd<.000001)continue;
            const distance=Math.sqrt(dd),nx=dx/distance,ny=dy/distance;
            const offset=(9.3-distance)*.49;
            ball.x+=nx*offset;ball.y+=ny*offset;other.x-=nx*offset;other.y-=ny*offset;
            const normal=(ball.vx-other.vx)*nx+(ball.vy-other.vy)*ny;
            if(normal>=0)continue;
            const impulse=-normal*.56;
            ball.vx+=impulse*nx;ball.vy+=impulse*ny;
            other.vx-=impulse*nx;other.vy-=impulse*ny;
          }
        }
      }
      this.cells[row*this.columns+col].push(ball);
      }
    }
  }
  advance(dt) {
    if(this.awake>0){
      this.awake-=dt;this.accumulator+=dt;
      while(this.accumulator>=1/90){this.integrate(1/90);this.accumulator-=1/90}
    }
    this.feed.forEach(p=>p.t+=dt);
    this.feed=this.feed.filter(p=>p.t<.36);
  }
  draw() {
    const ctx = this.context;
    const width = Math.round(this.canvas.clientWidth * Math.min(devicePixelRatio,2));
    if (!width) return;
    if (width !== this.canvas.width) {
      this.canvas.width = width;
      this.canvas.height = Math.round(width*108/600);
    }
    ctx.setTransform(width/600,0,0,width/600,0,0);
    ctx.clearRect(0,0,600,108);
    const paint=(x,y)=>ctx.drawImage(this.sprite,x-5.3,y-5.3,10.6,10.6);
    this.balls.forEach(ball=>paint(ball.x,ball.y));
    this.feed.forEach(p=>{
      const f=Math.min(1,p.t/.36);
      paint(p.x+(590-p.x)*f*f,p.y+(102-p.y)*f);
    });
    if(this.count>this.capacity){
      ctx.fillStyle='#171714df';ctx.fillRect(458,4,136,18);ctx.fillStyle='#f2d7aa';
      ctx.font='11px sans-serif';ctx.textAlign='right';ctx.fillText('하부 저장통 +'+(this.count-this.capacity),586,17);
    }
  }
}
