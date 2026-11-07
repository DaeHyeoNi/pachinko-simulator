/* Nine-second illustrated cut-in. Coordinates are local to the 600px playfield. */
const drawBattle = (() => {
  const paths = new Map();
  const ivory = { shell:'#d6d5be', light:'#fff8d8', mid:'#7a8b91', dark:'#34465a', ink:'#142234', seam:'#495864', trim:'#dba95a', shine:'#ffdc89', eye:'#7afcff', core:'#14c7fb' };
  const crimson = { shell:'#913d50', light:'#f18975', mid:'#64344d', dark:'#332942', ink:'#1c192d', seam:'#49293c', trim:'#b98a71', shine:'#ffc29b', eye:'#ff8cce', core:'#ff316d' };
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x=clamp(x); return x*x*(3-2*x); };
  const noise = n => { const f=Math.sin(n*137.71+7.12)*32768.5; return f-Math.floor(f); };
  function part(c, d, fill, line=null, width=1) {
    if (!paths.has(d)) paths.set(d,new Path2D(d));
    const path=paths.get(d);
    if(fill){c.fillStyle=fill;c.fill(path);}
    if(line){c.strokeStyle=line;c.lineWidth=width;c.stroke(path);}
  }
  function segment(c,x1,y1,x2,y2,color,w=1) {
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();
  }
  function circle(c,x,y,r,color) {
    if(r<=0)return;
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  function glow(c,x,y,r,color) {
    if(r<=0)return;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'transparent');
    c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
  }
  function text(c,label,x,y,size,color,align='left',face='Arial, sans-serif') {
    c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
    c.font='900 '+size+'px '+face;c.fillText(label,x,y);
  }
  function joint(c,x,y,r,p) {
    circle(c,x,y,r,p.ink);circle(c,x,y,r*.76,p.mid);circle(c,x,y,r*.53,p.dark);circle(c,x,y,r*.27,p.trim);
  }
  function wing(c,p,enemy) {
    part(c,enemy?'M-25 -74L-102 -139L-84 -78L-98 -94L-67 -36L-45 -19L-41 -45Z':'M-20 -69L-70 -102L-95 -123L-86 -80L-66 -47L-74 -53L-52 -13L-33 -19Z',p.dark,p.ink,2);
    part(c,'M-31 -71L-86 -112L-73 -78L-49 -47Z',p.mid,p.ink);
    part(c,'M-41 -69L-80 -101L-68 -77L-56 -64Z',p.shell);
    part(c,'M-44 -46L-63 -68L-54 -45L-42 -28Z',p.shell);
    segment(c,-72,-93,-50,-70,p.trim,2);
  }
  function leg(c,p,x,y,thigh,bend,enemy) {
    c.save();c.translate(x,y);c.rotate(thigh);
    part(c,'M-10 0L9 -4L15 11L10 37L4 46L-9 40L-15 17Z',p.mid,p.ink,2);
    part(c,'M-7 3L8 1L10 13L5 33L-3 32L-9 15Z',p.shell);
    part(c,'M8 2L11 10L7 27L4 29L8 11Z',p.light);
    c.translate(0,39);c.rotate(bend);joint(c,0,0,9,p);
    part(c,'M-9 6L3 -7L13 -3L16 10L10 24L7 51L-7 54L-11 38L-17 17Z',p.mid,p.ink,2);
    part(c,'M-9 10L1 0L10 -1L12 8L3 21L0 42L-5 48L-6 26Z',p.shell);
    part(c,'M-9 10L1 0L9 0L5 4L0 5L-5 13Z',p.light);
    part(c,'M-15 18L-9 25L-7 40L-12 34Z',p.dark);
    segment(c,7,15,3,21,p.trim,2);segment(c,3,24,1,37,p.trim);
    part(c, enemy?'M-8 46L7 46L12 52L31 58L19 61L4 58L-12 60Z':'M-8 46L8 46L12 52L24 55L28 60L-11 60L-14 57Z',p.dark,p.ink,1.5);
    part(c,'M-3 48L6 48L12 54L20 55L23 57L1 55Z',p.shell);c.restore();
  }
  function arm(c,p,x,y,angle,elbow,weapon) {
    c.save();c.translate(x,y);c.rotate(angle);joint(c,0,0,12,p);
    part(c,'M-10 4L8 2L13 13L7 30L0 35L-11 25L-14 15Z',p.mid,p.ink,1.8);
    part(c,'M-8 5L5 5L9 13L3 24L-4 25L-10 14Z',p.shell);
    c.translate(0,29);c.rotate(elbow);joint(c,0,0,8,p);
    part(c,'M-12 -4L4 -6L12 0L11 19L6 37L-6 38L-14 23L-16 5Z',p.dark,p.ink,1.7);
    part(c,'M-12 -3L4 -5L9 1L7 15L1 26L-5 31L-10 18Z',p.shell);
    part(c,'M-12 -3L4 -5L8 -1L-1 -1L-9 3Z',p.light);
    part(c,'M1 7L7 3L5 12L1 18L-4 19Z',p.mid);
    segment(c,-8,8,-5,22,p.trim,1.8);
    part(c,'M-7 35L7 32L10 40L5 47L-6 46L-9 40Z',p.ink,p.seam,2);
    for(let i=0;i<3;i++)segment(c,-4+i*3,38,-3+i*3,44,p.mid,1.4);
    c.translate(0,38);
    if(weapon==='blade'){
      part(c,'M-8 -7L-3 -8L3 0L9 -2L11 2L3 6L4 13L0 14L-4 6L-11 8L-13 4L-6 1Z',p.trim,p.ink,1.5);
      c.shadowColor=p.core;c.shadowBlur=9;
      part(c,'M0 2L4 -1L17 -31L21 -68L26 -88L24 -44L20 -22L7 6Z',p.eye,p.core,1.8);
      c.shadowBlur=0;part(c,'M4 1L18 -33L23 -70L19 -29L7 1Z','#fffce4');
    } else if(weapon==='cannon'){
      part(c,'M-14 -8L-17 -16L-10 -28L2 -31L12 -23L16 -6L15 44L10 62L-10 62L-17 48Z',p.dark,p.ink,2);
      part(c,'M-13 -13L-6 -24L3 -24L10 -18L10 32L4 45L-8 45Z',p.shell,p.seam);
      part(c,'M-12 47L12 47L10 60L-9 60Z',p.mid,p.ink);
      part(c,'M-7 54H8L6 59H-5Z',p.eye);
      for(let k=0;k<4;k++)segment(c,-6,4+k*6,5,k*6,p.dark,2.2);
    }
    c.restore();
  }
  function head(c,p,enemy,tilt) {
    c.save();c.translate(0,-76);c.rotate(tilt);
    part(c,enemy?'M-22 7L-22 -13L-10 -29L8 -34L22 -25L26 -13L19 -4L13 15L2 24L-9 16Z':'M-22 8L-23 -11L-14 -26L-2 -31L13 -29L23 -20L24 -11L21 -2L14 15L4 23L-8 17Z',p.dark,p.ink,2);
    part(c,'M-19 -8L-12 -23L-2 -29L9 -26L16 -18L22 -14L13 -12L-1 -14L-11 -6Z',p.shell,p.ink,1.1);
    part(c,'M-13 -22L-3 -29L7 -25L10 -22L-2 -25Z',p.light);
    part(c,'M-19 -7L-9 -14L0 -12L-3 -1L-12 10L-19 7Z',p.mid,p.ink);
    part(c,'M-8 -9L2 -14L13 -12L23 -14L19 -5L9 0L-3 -2Z',p.ink);
    c.shadowColor=p.core;c.shadowBlur=6;
    part(c,'M0 -8L11 -6L21 -10L17 -5L10 -3L3 -5Z',p.eye);
    c.shadowBlur=0;
    part(c,'M-6 -1L1 -4L7 1L12 1L18 -4L17 5L10 14L3 17L-5 10Z',p.shell,p.ink);
    part(c,'M1 1L6 3L14 1L10 7L4 7Z',p.mid);part(c,'M4 11L10 9L8 17L4 19L1 16Z',p.trim);
    part(c,'M-17 -7L-10 -8L-9 4L-13 15L-18 19L-21 12Z',p.shell,p.ink);
    part(c,enemy?'M-3 -17L-32 -41L-52 -52L-34 -25L-20 -16L-31 -18L-21 -9L1 -8L10 -11L27 -48L11 -29L6 -20Z':'M1 -15L-22 -33L-42 -49L-28 -28L-6 -10L4 -7L10 -13L25 -46L6 -20Z',p.trim,p.ink,1.1);
    part(c,'M-32 -40L-6 -20L1 -15L-8 -18Z',p.shine);
    part(c,'M0 -18L6 -21L10 -16L6 -10L2 -11Z',p.core,p.ink,1);
    c.restore();
  }
  function machine(c,x,y,size,dir,p,pose,enemy,weapon) {
    c.save();c.translate(x,y);c.scale(size*dir,size);c.rotate(pose.lean||0);
    wing(c,p,enemy);
    arm(c,p,-24,-52,pose.back||.1,.35,'');
    leg(c,p,-11,12,pose.farLeg||.26,-.14,enemy);
    leg(c,p,12,16,pose.leg||-.20,pose.knee||.20,enemy);
    part(c,'M-26 -59L-12 -70L6 -66L18 -72L32 -55L24 -26L13 -12L14 2L-2 11L-19 1L-28 -27Z',p.dark,p.ink,2);
    part(c,'M-25 -60L-10 -65L0 -59L13 -65L23 -60L28 -52L15 -36L-2 -28L-19 -37L-30 -50Z',p.shell,p.ink,1.7);
    part(c,'M-25 -58L-11 -64L1 -58L15 -64L21 -59L15 -60L0 -54L-12 -59Z',p.light);
    part(c,'M-24 -49L-13 -51L-2 -44L0 -33L-16 -39Z',p.dark);
    part(c,'M5 -45L21 -54L16 -43L6 -36Z',p.trim);
    for(let k=0;k<3;k++)segment(c,-19+k*3,-47,-15+k*3,-40,p.trim,1.3);
    part(c,'M-10 -25L3 -21L15 -26L11 -15L2 -11L-10 -15Z',p.mid,p.ink);
    part(c,'M-11 -13L1 -9L13 -13L10 -5L2 0L-9 -4Z',p.mid,p.ink);
    part(c,'M-21 -3L-5 0L0 8L-8 29L-24 22L-29 10Z',p.shell,p.ink,2);
    part(c,'M1 2L17 -2L25 11L20 25L7 29L1 17Z',p.shell,p.ink,2);
    part(c,'M4 8L15 4L21 12L16 22L10 24Z',p.mid);
    part(c,'M-21 4L-8 6L-10 10L-24 9Z',p.mid);
    c.save();c.translate(19,-52);c.rotate(pose.arm*.25);
    part(c,enemy?'M-14 -9L-10 -25L3 -25L14 -47L15 -23L30 -31L24 -12L33 -18L27 0L14 10L-3 8Z':'M-15 -11L-10 -24L6 -28L23 -21L33 -5L27 7L11 10L-2 5Z',p.shell,p.ink,2.1);
    part(c,'M-10 -17L6 -25L20 -19L28 -8L10 -14L-1 -10Z',p.light);
    part(c,'M8 -11L27 -4L24 4L11 6L2 1Z',p.mid);
    segment(c,13,0,23,-1,p.trim,2);c.restore();
    arm(c,p,23,-41,pose.arm,pose.elbow,weapon);
    head(c,p,enemy,pose.head||0);c.restore();
  }
  function landscape(c,t,cannon) {
    const g=c.createLinearGradient(0,0,0,600);
    g.addColorStop(0,'#101c34');g.addColorStop(.48,cannon?'#643b5b':'#88403d');g.addColorStop(.68,'#cc825b');g.addColorStop(1,'#182334');c.fillStyle=g;c.fillRect(0,0,600,600);
    circle(c,392,231,74,'#df8f63');glow(c,392,231,128,'#f6a26e48');
    for(let i=0;i<32;i++){let x=(noise(i)*830+t*(2+i%4))%830-140;let y=54+noise(i+42)*243;segment(c,x,y,x+24+noise(i+93)*125,y-3,'#29233155',1+noise(i+122)*5);}
    for(let k=0;k<3;k++){
      c.beginPath();c.moveTo(-25,640);
      for(let i=0;i<36;i++){let x=i*20-40;let y=343+k*59+Math.sin(i*.56+k*5)*27+noise(i+18*k)*29;c.lineTo(x,y);}
      c.lineTo(660,640);c.closePath();c.fillStyle=['#534554','#3b3946','#282935'][k];c.fill();
    }
    for(let i=0;i<42;i++){let x=noise(i+199)*630-15;let y=463-22*Math.cos(x*.016);let h=18+noise(i+301)*83;
      c.fillStyle='#272b38';c.fillRect(x,y-h,6+noise(i+27)*17,h+25);
      if(i%3===0){segment(c,x+4,y-h,x+4,y-h-17,'#272b38');segment(c,x,y-h+8,x+10,y-h+8,'#b8835790',1);}
    }
    for(let i=0;i<43;i++){let y=507+noise(i+88)*89;let x=noise(i+69)*625;segment(c,x,y,x+noise(i)*50,y-2,'#8a69534f',1);}
    for(let i=0;i<38;i++){let x=(noise(i+90)*800+t*(8+i%9))%800-100,y=560-(noise(i+147)*586+t*(6+i%7))%560;circle(c,x,y,.5+noise(i+111)*1.2,'#ffc48ba6');}
  }
  const idle={arm:-.35,elbow:-.60,leg:-.21,knee:.23,farLeg:.24};
  function portrait(c,t,p,enemy) {
    c.save();c.beginPath();
    if(!enemy){c.moveTo(0,0);c.lineTo(386,0);c.lineTo(190,600);c.lineTo(0,600);}
    else{c.moveTo(386,0);c.lineTo(600,0);c.lineTo(600,600);c.lineTo(190,600);}
    c.closePath();c.clip();
    const g=c.createLinearGradient(0,100,600,550);g.addColorStop(0,enemy?'#ae4f59':'#365d70');g.addColorStop(1,enemy?'#302137':'#1b263a');c.fillStyle=g;c.fillRect(0,0,600,600);
    for(let i=0;i<25;i++){let y=i*27-110;segment(c,-20,y,620,y+125,enemy?'#d1837940':'#b1e3e638',i%5===0?4:1);}
    machine(c,(enemy?437:148)+(enemy?1:-1)*18*(1-ease(t*2)),487,2.8+t*.05,enemy?-1:1,p,idle,enemy,'');
    c.restore();
  }
  function streaks(c,t,amount) {
    c.save();c.globalAlpha=clamp(amount);
    for(let i=0;i<47;i++){let a=noise(i)*Math.PI*2;let radius=128+(noise(i+23)*450+t*180)%410;let n=25+noise(i+113)*65;segment(c,300+Math.cos(a)*radius,293+Math.sin(a)*radius,300+Math.cos(a)*(radius+n),293+Math.sin(a)*(radius+n),'#fff0ca86',i%4===0?2.5:1);}
    c.restore();
  }
  function blast(c,x,y,t,strength,color) {
    if(strength<=0)return;
    c.save();c.globalAlpha=clamp(strength);
    glow(c,x,y,100*strength+12,color);glow(c,x,y,35*strength+4,'#fff7da');
    for(let k=0;k<22;k++){let a=noise(k+3)*6.29+t*.15;let l=(17+noise(k+75)*104)*strength;let r=5+(t*120+noise(k)*53)%47;
      segment(c,x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+l),y+Math.sin(a)*(r+l),'#ffca80',1+2.7*noise(k+35));}
    c.restore();
  }
  function beam(c,x,y,x2,y2,color,amplitude) {
    if(amplitude<=0)return;
    c.save();c.globalAlpha=clamp(amplitude*2);c.shadowColor=color;c.shadowBlur=20;
    segment(c,x,y,x2,y2,color,15*amplitude);segment(c,x,y,x2,y2,'#fffded',6.5*amplitude);c.restore();
  }
  function slash(c,time,right,amplitude) {
    if(amplitude<=0)return;
    c.save();c.translate(300,296);c.scale(right?-1:1,1);c.rotate(-.04+time*.055);
    c.globalAlpha=clamp(amplitude);c.shadowColor='#7cf6ff';c.shadowBlur=14;
    part(c,'M-140 89Q-72 -14 99 -102Q45 -71 -2 -28Q-71 32 -140 89Z','#d8ffff');
    c.restore();
  }
  // The wrist tapers back to the pilot; the near finger plates overlap the silhouette.
  function thrust(c,t,won) {
    const approach=ease((t-5.63)/.48), opacity=ease((t-5.62)/.12);
    c.save();c.globalAlpha=opacity;
    const p=won?ivory:crimson;
    glow(c,60,275,380,'#00d5ff88');glow(c,550,180,360,'#9c21ff9c');glow(c,500,460,300,'#ff254a97');
    streaks(c,Math.min(t,6.13),.98);
    c.translate(300+(won?-52:52)*(1-approach),288-16*(1-approach));
    c.scale((won?1:-1)*(.35+1.61*approach),.35+1.61*approach);c.rotate(-.26+.17*approach);
    part(c,'M-36 1L-13 1L27 32L121 102L113 123L29 94L-20 68L-43 30Z',p.dark,p.ink,3);
    part(c,'M-19 25L15 19L106 97L96 100L23 66Z',p.mid,p.ink,2);
    part(c,'M37 58L56 68L102 105L85 99Z',p.light);
    part(c,'M-74 -13L-61 -42L-32 -54L18 -57L55 -44L70 -16L64 19L44 47L16 58L-13 54L-48 43L-67 22Z',p.dark,p.ink,3);
    part(c,'M-64 -9L-48 -37L-13 -45L22 -47L49 -36L57 -22L46 -9L4 -1L-29 17L-50 13Z',p.shell,p.ink,1.8);
    part(c,'M-54 11L-35 18L-5 4L32 -3L41 4L16 21L-16 37L-44 26Z',p.mid,p.ink,2);
    part(c,'M-36 29L-12 33L15 17L31 14L22 28L-4 46L-24 42Z',p.dark,p.ink,1.5);
    for(let k=0;k<4;k++){
      c.save();c.translate(-51+29*k,-25-[0,11,12,2][k]);c.rotate([-.24,-.12,.04,.21][k]);
      part(c,'M-18 -12L-10 -25L8 -25L17 -15L20 4L12 15L-4 18L-17 6Z',p.mid,p.ink,2.4);
      part(c,'M-16 -13L-8 -23L6 -23L14 -14L13 -2L2 7L-12 2Z',p.shell,p.ink,1);
      part(c,'M-15 -13L-8 -23L6 -23L12 -16L5 -18L-6 -17Z',p.light);
      part(c,'M-9 6L4 10L15 1L15 8L6 14L-6 13Z',p.dark);
      segment(c,-6,-11,6,-13,p.trim,2.3);segment(c,-4,-8,3,-9,p.eye,1.15);c.restore();
    }
    part(c,'M51 -19L64 -21L79 -13L86 0L83 15L67 29L52 33L38 24L34 14L39 1Z',p.shell,p.ink,2.3);
    part(c,'M41 4L53 -16L64 -18L73 -13L60 -11L49 7Z',p.light);
    part(c,'M43 13L54 19L68 15L80 3L78 15L62 28L50 28L41 22Z',p.mid);
    part(c,'M-55 6L-41 14L-47 21L-57 16Z',p.core,p.ink,1.4);
    for(let i=0;i<3;i++) segment(c,2+i*5,35-i*3,10+i*5,33-i*3,p.trim,1.4);
    c.restore();
  }
  function metal(c,label,x,y,size) {
    const g=c.createLinearGradient(x-size*.15,y-size*.41,x+size*.1,y+size*.38);
    for(const [stop,color] of [[0,'#fff9db'],[.14,'#4ef3ff'],[.33,'#5269ec'],[.46,'#e249ed'],[.495,'#fff8fc'],[.51,'#c42454'],[.69,'#ff6746'],[.80,'#ffe580'],[.94,'#f3bf43'],[1,'#fff8d0']]) g.addColorStop(stop,color);
    c.save();c.textAlign='center';c.textBaseline='middle';c.font='900 '+size+'px "Arial Black", Arial, sans-serif';
    c.lineWidth=size*.095;c.strokeStyle='#201538';c.strokeText(label,x+3,y+6);
    c.lineWidth=size*.067;c.strokeStyle='#ac5c29';c.strokeText(label,x,y+2);
    c.lineWidth=size*.036;c.strokeStyle='#fff4ad';c.strokeText(label,x,y);
    c.fillStyle=g;c.fillText(label,x,y);c.restore();
  }
  function reward(c,t) {
    const enter=ease((t-7.82)/.28);
    c.save();c.globalAlpha=enter;c.fillStyle='#171323';c.fillRect(0,58,600,484);
    glow(c,300,284,315,'#8b2568');glow(c,26,287,195,'#007dc9');glow(c,593,270,205,'#ea2645');
    streaks(c,t,.7*enter);c.globalAlpha=enter;
    c.translate(300,304);const scale=1+(.09*(1-enter));c.scale(scale,scale);
    text(c,'대당첨',0,-114,37,'#ffdfa9','center','Georgia, "Malgun Gothic", serif');
    metal(c,'450',0,-2,175);
    text(c,'賞 球',0,94,33,'#ffdda4','center','Georgia, "Malgun Gothic", serif');
    text(c,'우타 모드 완료 시 획득',0,140,18,'#fff2ce','center');
    c.restore();
  }
  function verdict(c,t,digits,won) {
    const start=6.4, age=t-start;
    c.save();c.globalAlpha=ease(age/.22)*.88;c.fillStyle='#0a1020';c.fillRect(0,0,600,600);c.restore();
    const seq=Array.from(String(Array.isArray(digits)?digits.join(''):digits??'').replace(/[^0-9]/g,'').padStart(3,'0').slice(-3));
    if(won){glow(c,100,290,200,'#1251b599');glow(c,305,260,200,'#97189788');glow(c,515,312,200,'#da343888');}
    text(c,'B A T T L E   R E S U L T',300,178,12,'#d2b384','center');
    for(let k=0;k<3;k++){
      const a=clamp((age-k*.23)/.25);if(a===0)continue;
      c.save();c.translate(won?148+k*152:177+k*123,286);const scale=1+(1-ease(a))*.7;c.scale(scale,scale);c.globalAlpha=a;
      const g=c.createLinearGradient(0,-51,0,54);g.addColorStop(0,'#5a4d42');g.addColorStop(.48,'#282936');g.addColorStop(1,'#131b2a');
      part(c,'M-48 -58H47L53 -51V49L46 58H-47L-53 51V-50Z',g,won?'#dfb564':'#8c929e',2);
      part(c,'M-45 -52H45M-46 52H46','none','#ad8e66',1);
      c.shadowColor=won?'#e89132':'#75a6c5';c.shadowBlur=won?10:3;
      if(won)metal(c,seq[k],0,0,146);
      else text(c,seq[k],0,0,91,'#e2e6e8','center','Georgia, serif');c.restore();
    }
    c.save();c.globalAlpha=ease((age-.68)/.32);
    text(c,won?'대당첨':'전투 종료',300,390,won?43:32,won?'#ffda83':'#e9e2d6','center','Georgia, "Malgun Gothic", serif');
    if(won){for(let i=0;i<37;i++){let x=(noise(i+119)*700+t*(9+i%5))%690-45,y=520-(age*60+noise(i+76)*552)%540;circle(c,x,y,.8+noise(i+8)*2,'#ffcf75');}}
    c.restore();
    if(won&&t>=7.82)reward(c,t);
  }
  return function drawBattle(ctx,elapsed,variant,digits,won) {
    const t=Math.max(0,Number(elapsed)||0); if(t>=9)return;
    const cannon=variant===1||/cannon|beam|포격|포탄/i.test(String(variant));
    const c=ctx;c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();c.rect(0,0,600,600);c.clip();
    landscape(c,t,cannon);
    if(t<1.66){
      portrait(c,t,ivory,false);portrait(c,t,crimson,true);
      segment(c,386,0,190,600,'#f1c48b',3);
      c.save();c.translate(292,303);c.rotate(-.09);part(c,'M-36 -21H29L38 -13L31 16L-29 23L-36 15Z','#192034','#dbbd8d',1.4);text(c,'VS',1,1,30,'#ffe4b1','center','Georgia, serif');c.restore();
      text(c,'백야',46,436,31,'#fff4d5');text(c,'적월',553,160,31,'#ffdece','right');
    }else{
      const u=t-1.66, dash=ease((u-.38)/.58), retreat=ease((u-2.05)/.70);
      const final=ease((t-5.05)/.59),impact=Math.sin(Math.PI*clamp((t-5.6)/.65));
      const clash=(u>=1&&u<2.12)?Math.pow(Math.max(0,Math.cos((u-1)*16)),4):0;
      const shake=clash*4+impact*8;
      c.save();c.translate(Math.sin(t*88)*shake,Math.cos(t*69)*shake);
      let lx=130+dash*(cannon?24:90)-retreat*45,rx=480-dash*(cannon?27:101)+retreat*23;
      let ly=348-Math.sin(Math.PI*dash)*49,ry=341-Math.sin(Math.PI*dash)*34;
      if(won){lx+=final*(cannon?12:91);rx+=impact*27;}else{rx-=final*(cannon?15:76);lx-=impact*26;}
      const motion=clash*.47;
      let a={arm:-.4-dash*.65-final*.31,elbow:-.65-motion-final*.1,lean:dash*.10,farLeg:.35+dash*.48,leg:-.3-dash*.26,knee:.21+dash*.27,head:-.06};
      let b={arm:-.4-dash*.85-final*.28,elbow:-.48-motion-final*.10,lean:dash*.10,farLeg:.42+dash*.33,leg:-.37-dash*.20,knee:.25+dash*.20,head:-.06};
      if(cannon){a.arm=-.94-dash*.23;a.elbow=-.5;b.arm=-.94-dash*.19;b.elbow=-.55;}
      machine(c,rx,ry,1.13,-1,crimson,b,true,cannon?'cannon':'blade');machine(c,lx,ly,1.16,1,ivory,a,false,cannon?'cannon':'blade');
      if(cannon&&u>.93&&u<2.2){let f=.36+clash*.64;beam(c,lx+118,ly-64,304,281,'#48e8ff',f);beam(c,rx-118,ry-64,304,281,'#ff477c',f);blast(c,304,281,t,.5+clash*.55,'#ffe7a8');}
      if(!cannon&&u>.91&&u<2.2){slash(c,t,Math.floor(u*8)%2,clash);blast(c,300,287,t,.23+clash*.8,'#ffbc64');}
      if(final>.2&&t<6.4){
        if(cannon)beam(c,won?lx+112:rx-111,won?ly-56:ry-55,won?rx:lx,won?ry-46:ly-45,won?'#4beaff':'#ff416c',Math.sin(Math.PI*clamp((t-5.15)/1.23))*1.5);
        else slash(c,t,!won,Math.sin(Math.PI*clamp((t-5.19)/.9)));
        blast(c,won?rx:lx,won?ry-43:ly-45,t,impact*1.45,won?'#aafaff':'#ff9472');
      }
      streaks(c,t,Math.sin(dash*Math.PI)*.85+impact*.8+clash*.4);c.restore();
      const flash=(1-clamp((t-1.66)/.13))*.76+clash*.15+impact*.37;
      if(flash>.01){c.fillStyle='rgba(255,240,205,'+flash+')';c.fillRect(0,0,600,600);}
    }
    if(t>=5.62&&t<6.4)thrust(c,t,won);
    c.fillStyle='#0c111ce0';c.fillRect(0,0,600,57);c.fillRect(0,543,600,57);
    segment(c,0,57,600,57,'#aa856680');segment(c,0,543,600,543,'#aa856680');
    text(c,cannon?'ENERGY CANNON':'BLADE DUEL',34,32,13,'#dec7a6');
    text(c,'GINKYO  /  COMBAT',565,32,11,'#d8c4a7','right');
    if(t<6.4){text(c,t<1.66?'대치':t<4.3?'교전':t<5.45?'최후의 일격':'결착',300,569,18,'#f6dfba','center');}
    else verdict(c,t,digits,won);
    c.restore();
  };
})();
