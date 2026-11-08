'use strict';

// The note is drawn flat once. Projecting narrow strips lets the paper curl
// towards the viewer while its leading edge disappears behind the metal lip.
class BanknoteAcceptor {
  constructor() {
    this.duration = 2.8;
    this.canvas = document.createElement('canvas');
    document.getElementById('readerWindow').append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.paper = this.makeNote();
    this.lastFrame = -1;
    this.render(-1);
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
    return flat;
  }

  open(){
    this.lastFrame=-1;this.render(0);
  }
  close(){this.render(-1)}
  render(time){
    const frame=Math.floor(time*60);
    if(frame===this.lastFrame)return;
    this.lastFrame=frame;
    const c=this.ctx,d=Math.min(2,window.devicePixelRatio||1);
    if(this.canvas.width!==Math.round(220*d)){
      this.canvas.width=Math.round(220*d);this.canvas.height=Math.round(220*d);
    }
    c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,220,220);
    const edge=183;
    if(time>=0 && time<2.45){
      const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
      const align=ease(time/.8),feed=ease((time-.84)/1.52);
      c.save();c.beginPath();c.rect(0,0,edge+1,220);c.clip();
      c.translate(edge-30*(1-align)+feed*119,43+30*(1-align));
      c.transform(1,-.2*(1-align)-.08,0,1,0,0);
      c.drawImage(this.paper,-115,0,115,133);
      c.restore();
    }
    if(time<0)return;
    c.fillStyle='#9d9f875c';c.fillRect(edge+2,24,1,173);
    c.fillStyle=time>=2.38?'#aff5b2':time>=0?'#ffc786':'#81ad8e';
    c.fillRect(edge+9,62,2,29);
  }
}
