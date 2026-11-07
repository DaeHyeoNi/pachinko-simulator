'use strict';

// The note is drawn flat once. Projecting narrow strips lets the paper curl
// towards the viewer while its leading edge disappears behind the metal lip.
class BanknoteAcceptor {
  constructor() {
    this.duration = 2.8;
    this.overlay = document.createElement('div');
    this.overlay.className = 'cash-reader-preview';
    this.overlay.hidden = true;
    this.overlay.setAttribute('aria-hidden','true');
    this.canvas = document.createElement('canvas');
    this.overlay.append(this.canvas);
    document.body.append(this.overlay);
    this.ctx = this.canvas.getContext('2d');
    this.paper = this.makeNote();
    this.lastFrame = -1;
  }

  makeNote() {
    const flat = document.createElement('canvas');
    flat.width = 580; flat.height = 270;
    const c = flat.getContext('2d');
    const tint = c.createLinearGradient(0,0,575,260);
    [[0,'#b8c6ab'],[.28,'#eee6c8'],[.51,'#d4d9c3'],[.8,'#dccfb5'],[1,'#afbdaf']].forEach(([p,v])=>tint.addColorStop(p,v));
    c.fillStyle=tint;c.fillRect(0,0,580,270);
    c.strokeStyle='#507e7652';c.lineWidth=.8;
    for(let k=-5;k<84;k++){
      c.beginPath();
      for(let x=0;x<=580;x+=3){
        const y=k*3.65+5*Math.sin(x*.055+k*.17)+2.2*Math.sin(x*.13-k*.19);
        if(!x)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.stroke();
    }
    const rose=(x,y,rx,ry,color)=>{
      c.strokeStyle=color;c.lineWidth=.72;
      for(let j=0;j<24;j++){
        c.beginPath();
        for(let i=0;i<=460;i++){
          const a=i*Math.PI/230, f=.65+.13*Math.sin(13*a+j*.19)+.09*Math.cos(19*a-j*.17)+j*.005;
          const px=x+rx*f*Math.cos(a), py=y+ry*f*Math.sin(a);
          if(!i)c.moveTo(px,py);else c.lineTo(px,py);
        }
        c.closePath();c.stroke();
      }
    };
    rose(110,137,98,88,'#39756a85');rose(465,140,107,112,'#71678a9c');
    for(const gap of [7,10,15,23]){
      c.strokeStyle=gap===15?'#33685f':'#59776b';c.lineWidth=gap===15?2:.8;
      c.strokeRect(gap,gap,580-2*gap,270-2*gap);
    }
    c.save();c.beginPath();c.ellipse(301,152,110,64,0,0,Math.PI*2);c.clip();
    c.fillStyle='#d6dbbf';c.fillRect(184,80,233,146);
    for(let j=0;j<40;j++){
      c.strokeStyle=j<18?'#647965aa':'#37665caa';c.lineWidth=1;c.beginPath();
      for(let x=175;x<425;x++){
        const peak=123+Math.abs(x-304)*.57+Math.cos(x*.14+j*.38)*2.5;
        const y=peak+j*1.8+Math.sin(x*.09+j*.35)*(2+j*.055);
        if(x===175)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.stroke();
    }
    c.restore();
    const text=(v,x,y,font,color,align='left')=>{c.fillStyle=color;c.font=font;c.textAlign=align;c.fillText(v,x,y)};
    text('銀京遊技券',287,59,'bold 30px serif','#365951','center');
    text('G I N K Y O   A R C A D E',288,78,'12px Georgia','#426a65','center');
    text('千円',111,151,'bold 33px serif','#345951','center');
    text('1000',466,159,'bold italic 47px Georgia','#415d58','center');
    text('1000',33,54,'bold 33px Georgia','#3a675d');
    text('壱千円',547,239,'bold 22px serif','#465e53','right');
    text('GK  716250  A',32,241,'14px monospace','#573f38');
    c.strokeStyle='#8d4536';c.lineWidth=1.5;c.strokeRect(392,188,33,33);
    text('銀京',408,210,'bold 12px serif','#8d4536','center');
    const tall=document.createElement('canvas');
    tall.width=270;tall.height=580;
    const t=tall.getContext('2d');t.translate(270,0);t.rotate(Math.PI/2);t.drawImage(flat,0,0);
    return tall;
  }

  open(){
    this.lastFrame=-1;this.overlay.hidden=false;this.render(0);
  }
  close(){this.overlay.hidden=true}
  motor(audio){
    if(!audio)return;
    const start=audio.currentTime, motor=audio.createOscillator(), lowpass=audio.createBiquadFilter(), gain=audio.createGain();
    motor.type='sawtooth';motor.frequency.setValueAtTime(63,start);
    motor.frequency.exponentialRampToValueAtTime(113,start+.12);
    motor.frequency.exponentialRampToValueAtTime(78,start+1.31);
    lowpass.frequency.value=560;
    gain.gain.setValueAtTime(.001,start);gain.gain.linearRampToValueAtTime(.026,start+.09);
    gain.gain.exponentialRampToValueAtTime(.001,start+1.37);
    motor.connect(lowpass);lowpass.connect(gain);gain.connect(audio.destination);
    motor.start(start);motor.stop(start+1.38);
  }

  render(time){
    const frame=Math.floor(time*60);
    if(frame===this.lastFrame)return;
    this.lastFrame=frame;
    const c=this.ctx, d=Math.min(2,window.devicePixelRatio||1);
    if(this.canvas.width!==Math.round(500*d)){this.canvas.width=Math.round(500*d);this.canvas.height=Math.round(370*d)}
    c.setTransform(d,0,0,d,0,0);
    const gradient=(y,h,colors)=>{
      const gr=c.createLinearGradient(0,y,0,y+h);
      colors.forEach(([p,v])=>gr.addColorStop(p,v));return gr;
    };
    const rect=(x,y,w,h,r,fill,stroke)=>{
      c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
      if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}
    };
    const text=(s,x,y,font,color,align='left')=>{c.textAlign=align;c.fillStyle=color;c.font=font;c.fillText(s,x,y)};
    const clamp=x=>Math.max(0,Math.min(1,x));
    const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
    c.fillStyle=gradient(0,370,[[0,'#363936'],[.37,'#202422'],[.61,'#151716'],[1,'#202321']]);c.fillRect(0,0,500,370);
    for(let y=1;y<370;y+=3){c.fillStyle=y%2?'#fff1':'#0002';c.fillRect(0,y,500,.45)}
    rect(22,18,456,334,14,'#252927','#737369');
    rect(30,26,440,318,11,gradient(26,318,[[0,'#373b39'],[.14,'#1d211f'],[.53,'#111514'],[1,'#323633']]),'#151715');
    for(const [x,y] of [[41,39],[459,39],[41,330],[459,330]]){
      rect(x-4,y-4,8,8,4,gradient(y-4,8,[[0,'#9b9c8f'],[.5,'#51564e'],[1,'#73756c']]),'#131513');
      c.fillStyle='#212521';c.fillRect(x-2.5,y-.65,5,1.3);
    }
    text('紙幣挿入口',65,71,'bold 21px serif','#e8e5d4');
    const done=time>=2.31;
    text(done?'인식 완료':time<.8?'지폐 투입':'지폐 인식 중',433,70,'bold 14px sans-serif',done?'#9cd8a1':'#d6c498','right');
    rect(58,91,384,103,12,gradient(91,103,[[0,'#9a9b8e'],[.08,'#555a54'],[.13,'#2c302d'],[.46,'#171b19'],[.76,'#494e46'],[1,'#77786d']]),'#131512');
    rect(140,111,220,56,8,gradient(111,56,[[0,'#515650'],[.12,'#20251f'],[.59,'#060906'],[1,'#505449']]),'#111410');
    rect(167,130,166,26,4,'#070a08','#242b23');
    for(const x of [187,295]){
      rect(x,134,18,14,3,'#393b34');
      for(let j=0;j<4;j++){const y=135+(j*3+Math.floor(time*65))%12;c.fillStyle='#161a16';c.fillRect(x+1,y,16,1)}
    }
    const led=done?'#81f2a0':time>.8?'#ffc46b':'#8ed8a4';
    for(const x of [63,430]){c.shadowBlur=8;c.shadowColor=led;rect(x,124,6,23,2,led);c.shadowBlur=0}
    text('¥1,000',68,223,'18px Georgia','#a3a89b');
    const align=smooth(time/.85), feed=smooth((time-.93)/1.21);
    const top=151+(1-align)*67-192*feed;
    const noteTop=top;
    c.save();c.beginPath();c.rect(42,144,416,191);c.clip();
    c.translate(250+(1-align)*34,0);c.transform(1,(1-align)*-.035,0,1,0,0);
    const tail=(1-feed), projectedLength=181;
    for(let i=0;i<96;i++){
      const u=i/96, v=(i+1)/96;
      const y=noteTop+projectedLength*u;
      const curl=Math.sin(u*Math.PI)*tail;
      const bend=8*curl*Math.sin(time*4.2+u*1.4);
      const width=128+54*u+11*(1-align);
      const drift=(1-align)*u*16+bend;
      const height=(v-u)*projectedLength+.62;
      if(y+height<144)continue;
      c.drawImage(this.paper,0,Math.floor(u*580),270,Math.ceil(580/96)+1,drift-width/2,y,width,height);
      c.fillStyle='rgba(20,25,22,'+(.18*(1-u)+.09*curl)+')';c.fillRect(drift-width/2,y,width,height);
    }
    c.restore();
    rect(166,133,168,11,3,gradient(133,11,[[0,'#51574e'],[.3,'#292e29'],[.78,'#121712'],[1,'#060805']]));
    c.fillStyle='#c7c8af55';c.fillRect(170,133,160,1);
    c.fillStyle=gradient(144,9,[[0,'#080b0acc'],[1,'#080b0a00']]);c.fillRect(167,144,166,9);
    if(done){
      text('¥1,000',250,256,'bold 38px Georgia','#c9edc5','center');
      text('구슬 250개 지급',250,282,'14px sans-serif','#d4dccf','center');
    }
  }
}
