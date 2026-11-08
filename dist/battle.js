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
    part(c,'M-3 48L6 48L12 54L20 55L23 57L1 55Z',p.shell);
    if(p.kit==='jump'){
      part(c,'M-14 43L7 42L14 50L29 52L32 61L-15 61Z',p.shell,p.ink,2);
      segment(c,-13,63,30,63,'#df9a33',4);segment(c,-10,58,26,58,p.mid,2);
    }else if(p.kit==='beat'){
      segment(c,-7,59,-7,65,p.trim,3);segment(c,15,59,15,65,p.trim,3);
      part(c,'M-17 63Q4 68 29 60Q26 69 -14 69Z','#e2ffff',p.ink,1.5);
    }
    c.restore();
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
    if(p.kit==='dive'){
      part(c,'M-44 -83Q-58 -86 -61 -70L-53 -31L-36 -28L-32 -40Z',p.mid,p.ink,2);
      segment(c,-57,-61,-38,-64,p.trim,4);circle(c,-48,-34,7,p.ink);circle(c,-48,-34,4,p.eye);
    }
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
    if(p.kit==='grove'){
      part(c,'M-24 -62L-1 -52L24 -61L12 -39L-4 -46L-36 -17L-28 -43L-44 -41Z','#34754f',p.ink,2);
      circle(c,-2,-51,4,p.trim);
    }else if(p.kit==='prism'){
      part(c,'M-13 -53L0 -63L13 -53L0 -37Z','#67f2c7',p.trim,3);
    }
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
    const enter=ease(t/.28);
    c.save();c.globalAlpha=enter;c.fillStyle='#171323';c.fillRect(0,58,600,484);
    glow(c,300,284,315,'#8b2568');glow(c,26,287,195,'#007dc9');glow(c,593,270,205,'#ea2645');
    streaks(c,t,.7*enter);c.globalAlpha=enter;
    c.translate(300,304);const scale=1+(.09*(1-enter));c.scale(scale,scale);
    text(c,'대당첨',0,-114,37,'#ffdfa9','center','Georgia, "Malgun Gothic", serif');
    metal(c,'450',0,-2,175);
    text(c,'賞 球',0,94,33,'#ffdda4','center','Georgia, "Malgun Gothic", serif');
    text(c,'3라운드 최대 상구',0,140,18,'#fff2ce','center');
    c.restore();
  }
  globalThis.drawJackpotAward = reward;
  globalThis.drawBonusRound = function(c, elapsed, round, hits, earned, complete=false, rounds=3) {
    c.save();
    sky(c,'#071827','#124b61','#090e24');
    for(let i=0;i<46;i++){
      const x=(noise(i+42)*680+elapsed*(2+i%5))%680-40;
      circle(c,x,noise(i+15)*580,.7+noise(i)*1.7,'#a6e8f0aa');
    }
    glow(c,472,259,181,'#2b88a4');
    const pose={arm:-.45,elbow:.5,head:-.08,leg:-.26,back:.2,lean:-.06};
    machine(c,490,387+3*Math.sin(elapsed*1.3),1.66,-1,ivory,pose,false,'blade');
    const shade=c.createLinearGradient(42,0,455,0);
    shade.addColorStop(0,'#071321e6');shade.addColorStop(.67,'#071321be');shade.addColorStop(1,'#07132100');
    c.fillStyle=shade;c.fillRect(0,140,600,330);
    text(c,complete?'BONUS RESULT':'ROUND  '+round+' / '+rounds,95,233,33,'#bdeff6');

    text(c,'획득 상구',98,275,21,'#ffe2a5');
    metal(c,String(earned),207,345,101);
    text(c,'개',319,371,22,'#f4e7c7');
    if(!complete){
      for(let i=0;i<10;i++){
        c.fillStyle=i<hits?'#ffd87b':'#354e62';
        c.fillRect(98+i*20,414,15,6);
      }
      text(c,'입상  '+hits+' / 10',98,447,19,'#daf7f7');
    }
    c.restore();
  };
  function sky(c,top,mid,bottom) {
    const g=c.createLinearGradient(0,80,0,510);
    g.addColorStop(0,top);g.addColorStop(.57,mid);g.addColorStop(1,bottom);
    c.fillStyle=g;c.fillRect(0,0,600,600);
  }
  function ring(c,x,y,r,color,width=2) {
    if(r<=0)return;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function rocket(c,x,y,angle,size,age) {
    c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
    const jet=20+Math.sin(age*24)*5;
    beam(c,-13,0,-13-jet,0,'#ff9f48',.46);
    part(c,'M-15 -3L-8 -3L-13 -9L-7 -8L-1 -3L10 -3L19 0L10 3L-1 3L-8 9L-13 9L-9 3L-15 3Z','#d5d3c7','#283547',1.4);
    part(c,'M10 -3L19 0L11 2L8 1Z','#d95942');
    segment(c,-4,-1,7,-1,'#fff9df',1);c.restore();
  }
  function tower(c,x,y,s,panel=true) {
    c.save();c.translate(x,y);c.scale(s,s);
    part(c,'M-6 0L-3 -66L3 -66L6 0ZM-4 -43L4 -53L-3 -64M-5 -18L5 -32L-4 -44','none','#66879a',1.7);
    if(panel){part(c,'M-28 -62Q-17 -44 4 -47L17 -69Q4 -58-28 -62Z','#284152','#8ea7ac',1.5);segment(c,-8,-50,-23,-67,'#b9bdac',1.5);}
    c.restore();
  }
  const flight={arm:-.85,elbow:-.64,farLeg:.87,leg:.32,knee:.91,lean:.66,head:-.39};
  const brace={arm:-1.10,elbow:-.53,farLeg:.49,leg:-.49,knee:.62,lean:.12,head:-.11};
  function orbitSequence(c,t,won) {
    sky(c,'#050d27','#10294d','#31627d');
    for(let i=0;i<77;i++)circle(c,(noise(i+51)*615-t*(1+i%3)+615)%615,78+noise(i+123)*347,.5+noise(i+79),i%3?'#d0dff4':'#e8be89');
    // A curved atmosphere and continental cloud bands establish the orbital horizon.
    c.save();c.translate(161-t*2,1056);c.rotate(-.18);
    circle(c,0,0,779,'#84dcfa');circle(c,0,9,783,'#37749e');circle(c,0,39,804,'#244d73');
    for(let i=0;i<18;i++){let y=-755+i*8;segment(c,-244+noise(i)*180,y,110+noise(i+66)*193,y-10,'#b7c8cb52',2.3);}c.restore();
    const pan=ease((t-.5)/1.3),fin=ease((t-4.55)/1.18);
    const stationX=73+33*pan, stationY=295+10*Math.sin(t*.7);
    c.save();c.translate(stationX,stationY);c.rotate(-.18);
    part(c,'M-93 -10L-63 -23L25 -21L54 -9L69 -5L63 3L26 10L-70 14L-98 4Z','#34465b','#9fb5b6',2);
    part(c,'M-58 -23L-35 -40H-10L5 -22Z','#53657b','#94a7ad',1.4);
    for(let i=0;i<7;i++){let xx=-68+i*13;segment(c,xx,-5,xx+6,-5,i%2?'#f39f71':'#82d4d4',2);}
    for(let i=0;i<3;i++){let xx=-46+i*25;c.fillStyle='#151f31';c.fillRect(xx,8,14,8);}
    c.restore();
    const mx=460-64*pan+15*Math.cos(t*1.4), my=321+16*Math.sin(t*1.3);
    machine(c,mx,my,1.02,-1,ivory,{...flight,lean:.18,head:-.2},false,'cannon');
    machine(c,stationX-7,stationY-18,.53,1,crimson,brace,true,'');
    for(let i=0;i<5;i++) {
      const launch=.09+i*.47, travel=clamp((t-launch)/2.30);
      if(t<launch||travel===1)continue;
      const sx=stationX+44,sy=stationY+i*3, tx=mx-82+(i-2)*11,ty=246+i*13;
      const x=sx+(tx-sx)*travel, y=sy+(ty-sy)*travel-Math.sin(travel*Math.PI)*(38+i*6);
      rocket(c,x,y,Math.atan2(ty-sy-Math.cos(travel*Math.PI)*65,tx-sx),.70+travel*.24,t+i);
      if(travel>.77){beam(c,mx-98,my-58,x,y,'#64edff',Math.sin((travel-.77)/.23*Math.PI)*.8);blast(c,x,y,t,Math.sin((travel-.77)/.23*Math.PI)*.49,'#ffc77b');}
    }
    if(t>3.35&&t<5.70){
      const u=clamp((t-3.35)/1.47), intercept=won?fin:0;
      const x=stationX+48+(mx-stationX-107)*u-(mx-stationX-105)*intercept;
      const y=stationY+8-49*u+36*intercept;
      rocket(c,x,y,won&&fin>.02?Math.PI:-.12,1.45,t);
      if(t>4.38&&t<4.88){beam(c,mx-99,my-59,x,y,'#85faff',.8);glow(c,x,y,46,'#c5feff');}
    }
    if(t>5.18)blast(c,won?stationX+8:mx,won?stationY:my-39,t,Math.sin(clamp((t-5.18)/1.28)*Math.PI)*1.65,'#ff9358');
  }
  function flyingUnit(c,x,y,s,dir,enemy,bank,t,palette=enemy?crimson:ivory) {
    c.save();c.translate(x,y);c.rotate(bank);
    const exhaust=29+Math.sin(t*17)*5;
    for(let i=0;i<2;i++)beam(c,-dir*(22+i*8)*s,(-22+i*16)*s,-dir*(exhaust+39+i*8)*s,(-21+i*18)*s,enemy?'#ff8a6c':'#93faff',.51);
    machine(c,0,0,s,dir,palette,flight,enemy,'blade');c.restore();
  }
  // The base stage keeps the pilots on patrol while the three symbols vary.
  globalThis.drawPatrol = function drawPatrol(c,t,stageOffset=0) {
    const time=t+stageOffset;
    c.save();
    landscape(c,time,false);
    const farX=430+Math.sin(time*.22)*88;
    flyingUnit(c,farX,243+Math.sin(time*.67)*6,.43,1,false,-.08,time);
    const x=216+Math.sin(time*.29)*90, y=278+Math.cos(time*.77)*12;
    flyingUnit(c,x,y,1.08,1,false,.035*Math.sin(time*.83),time);
    // The service gantry passes the camera at a different rate to the skyline.
    const column=700-time*45%850;
    segment(c,column-38,513,column+28,385,'#293442',13);
    segment(c,column-12,467,column+41,408,'#6c6467',4);
    segment(c,-12,508,612,499,'#41424c',6);
    for(let i=0;i<9;i++) {
      const lamp=(i*88-time*45%88);
      circle(c,lamp,504-lamp*.015,2.1,'#ffc886');
    }
    c.restore();
  };
  function aerialSequence(c,t,won) {
    sky(c,'#197aa4','#83cfd5','#f1c69b');
    circle(c,425,191,38,'#fff1bd');glow(c,425,191,83,'#ffdb9c56');
    c.save();const roll=-.06+.14*Math.sin(t*1.18);c.translate(300,296);c.rotate(roll);c.translate(-300,-296);
    for(let i=0;i<20;i++){let x=810-(noise(i+19)*950+t*(10+i%4*9))%950,y=210+noise(i+173)*100;
      segment(c,x,y,x+27+noise(i)*75,y-3,'#f8e3c3',2+noise(i+8)*6);}
    for(let layer=0;layer<2;layer++){
      const scroll=t*(layer?58:22),pitch=65;
      c.beginPath();c.moveTo(-140,700);
      for(let i=-3;i<15;i++){let n=i+Math.floor(scroll/pitch),x=i*pitch-scroll%pitch;
        c.lineTo(x,360+layer*50+Math.sin(n*1.63+layer)*32);c.lineTo(x+29,310+layer*54+noise(n+46)*37);}
      c.lineTo(800,700);c.closePath();c.fillStyle=layer?'#455c6a':'#72909a';c.fill();
    }
    const overtake=ease((t-3.03)/1.25), dive=Math.sin(Math.PI*clamp((t-3)/1.52));
    const ax=133+t*16+overtake*110, ay=315+18*Math.sin(t*1.97)-75*dive;
    const bx=369+t*3-overtake*32, by=283+23*Math.sin(t*1.48+.45);
    const recoil=Math.sin(Math.PI*clamp((t-5.15)/1.22))*37;
    flyingUnit(c,bx+(won?recoil:0),by+(won?recoil:0),.91,1,true,.07*Math.sin(t*2)+(won?recoil*.013:0),t);
    flyingUnit(c,ax-(won?0:recoil),ay+(won?0:recoil),1.10,1,false,-.13*Math.cos(t*1.8)-.31*dive+(won?0:recoil*.015),t+.5);
    if(t>1.20&&t<3.04){for(let i=0;i<3;i++){const u=((t-1.2)*1.3+i/3)%1;const x=bx+(ax-bx)*u,y=by-35+(ay-by)*u+12*Math.sin(u*6);segment(c,x,y,x-17,y+2,'#ffe8ba',2.3);}}
    const attack=Math.sin(Math.PI*clamp((t-4.77)/1.51));
    if(attack>0){const hx=won?bx:ax,hy=won?by:ay;
      c.save();c.translate(hx,hy-25);c.rotate(-.39);
      c.globalAlpha=attack;part(c,'M-99 36Q-22 -21 95 -34Q27 -14-26 14L-99 36Z',won?'#ccffff':'#ffdfeb');c.restore();
      blast(c,hx,hy-24,t,attack*1.12,'#ffdca4');}
    // Close bridge trusses sweep past the lens while the units bank.
    const pillar=750-(t*174)%900;
    segment(c,pillar,495,pillar+58,359,'#30424c',11);
    segment(c,pillar+31,458,pillar+80,382,'#70858a',4);
    c.restore();
  }
  function lightning(c,x,y,u,v,t,color) {
    c.save();c.beginPath();c.moveTo(x,y);
    const dx=u-x,dy=v-y,len=Math.hypot(dx,dy)||1;
    for(let i=1;i<12;i++){let f=i/12,s=(noise(i*5+Math.floor(t*14))-.5)*23*Math.sin(f*Math.PI);
      c.lineTo(x+dx*f-dy/len*s,y+dy*f+dx/len*s);}
    c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=4.8;c.shadowBlur=8;c.shadowColor=color;c.stroke();c.shadowBlur=0;c.strokeStyle='#f5fffc';c.lineWidth=1.2;c.stroke();c.restore();
  }
  function empSequence(c,t,won) {
    sky(c,'#06191e','#16433e','#2e3842');
    const blackout=ease((t-2.35)/.46)*(1-ease((t-3.58)/.58));
    for(let i=0;i<17;i++){let x=i*39-15,y=182+noise(i+66)*112,w=20+noise(i)*22;
      c.fillStyle=i%2?'#0c2028':'#102b32';c.fillRect(x,y,w,202);
      for(let j=0;j<6;j++)for(let k=0;k<2;k++)if(noise(i*13+j+k)>.31){
        c.fillStyle=blackout>.55?'#223434':i%3?'#6a9985':'#c89372';c.fillRect(x+4+k*9,y+9+j*12,4.5,2);}
    }
    for(const x of [52,123,527])tower(c,x,357,x===123?.81:1.05);
    part(c,'M0 376Q258 353 600 378V600H0Z','#182c31');
    for(let i=0;i<34;i++){const x=noise(i+72)*590,y=381+noise(i+77)*82;segment(c,x,y,x+8+noise(i+8)*55,y,blackout>.6?'#223336':'#567268',1);}
    const creep=ease(t/2.2),surge=ease((t-3.35)/.8);
    const ax=162+creep*30,bx=422-12*creep,ay=343,by=339;
    machine(c,ax,ay,1.09,1,ivory,{...brace,arm:-.33-surge*.77,head:blackout*.32},false,'');
    machine(c,bx,by,1.11,-1,crimson,{...brace,arm:-.69-.35*Math.sin(t)},true,'');
    const vane=2.4+Math.sin(t*3.8)*.55;
    for(let i=0;i<3;i++){
      let a=vane+i*2.094,x=bx+Math.cos(a)*73,y=by-44+Math.sin(a)*55;
      c.save();c.translate(x,y);c.rotate(a+.6);part(c,'M-14 0L-2 -7L14 -2L5 4L-8 6Z','#5d4b6b','#c4a5cb',1.7);
      circle(c,0,0,2.2,'#ff81d7');c.restore();
      if(t>.8&&t<2.75)lightning(c,x,y,ax+2,ay-46,t+i,'#a649d7');
    }
    if(blackout>0){c.fillStyle='rgba(0,6,9,'+(.78*blackout)+')';c.fillRect(0,0,600,600);glow(c,ax+11,ay-72,19*blackout,'#65ffec');}
    if(t>3.20){
      const cx=won?ax:bx,cy=(won?ay:by)-49,color=won?'#53ffdc':'#e15bea';
      for(let i=0;i<3;i++){const wave=clamp((t-3.24-i*.48)/1.72);if(wave<=0||wave>=1)continue;
        c.save();c.globalAlpha=1-wave;ring(c,cx,cy,wave*305,color,3+3*(1-wave));c.restore();}
      if(t>4.66&&t<6.12){lightning(c,cx,cy,won?bx:ax,(won?by:ay)-37,t,color);blast(c,won?bx:ax,(won?by:ay)-37,t,Math.sin((t-4.66)/1.46*Math.PI)*1.14,color);}
    }
    for(let i=0;i<29;i++){let x=(noise(i)*640-t*97+1280)%640,y=(noise(i+21)*600+t*192)%600;segment(c,x,y,x-4,y+10,'#afd9c84f',.9);}
  }
  function siegeSequence(c,t,won) {
    sky(c,'#332333','#b25543','#dfa264');
    circle(c,155,223,56,'#efa46c');
    for(let i=0;i<15;i++){let x=i*45-15,y=242+noise(i+84)*58;

      c.fillStyle='#604953';c.fillRect(x,y,31,117);segment(c,x+7,y,x+7,y-17,'#625060',2);}
    for(let j=0;j<3;j++){let x=73+j*206;segment(c,x,318,x,190+j*4,'#664e55',4);segment(c,x-34,207,x+51,184+j*4,'#664e55',4);segment(c,x-25,205,x-25,231,'#664e55',1);}
    c.fillStyle='#3d363c';c.fillRect(0,365,600,235);
    for(let i=0;i<15;i++)segment(c,i*50-75,394,i*61-95,451,'#906850',5);
    segment(c,0,399,600,399,'#383130',9);segment(c,0,397,600,397,'#a7896e',2);
    const arrival=ease(t/1.22),x=396+(1-arrival)*151, y=351;
    c.save();c.translate(x,y);
    for(let i=0;i<5;i++){joint(c,-62+i*30,26,12,{...crimson,trim:'#b1a187'});}
    part(c,'M-93 -14L-74 -30L-10 -34L7 -47H70L84 -34L101 -12L95 14L79 22H-82L-97 11Z','#4e5060','#272838',2.4);
    part(c,'M-85 -11L-71 -23L-17 -26L-11 -17L-45 -7Z','#a1968b');
    for(let i=0;i<4;i++){c.fillStyle='#776f74';c.fillRect(-72+i*40,-6,29,17);segment(c,-67+i*40,-2,-52+i*40,-2,'#a89683',1.7);}
    machine(c,24,-48,.56,-1,crimson,brace,true,'');
    const recoil=Math.sin(clamp((t-4.37)/.53)*Math.PI)*13;
    c.translate(recoil,0);
    part(c,'M-108 -41L-13 -48L12 -36L6 -21L-111 -25L-129 -29L-130 -36Z','#494752','#211f31',2);
    part(c,'M-129 -36L-107 -42L-10 -47L7 -39L-101 -35Z','#b5a498');
    for(let i=0;i<6;i++){let xx=-102+i*13;segment(c,xx,-39,xx+4,-28,t>1.35+i*.39?'#ff965a':'#776574',3.6);}
    c.restore();
    const ax=142+13*Math.sin(t*.61),ay=346;
    machine(c,ax,ay,1.01,1,ivory,{...brace,arm:-.39-ease((t-2.4)/1.1),elbow:-.30},false,'');
    const charging=clamp((t-1.3)/3);if(t<4.59){
      glow(c,x-128,y-32,charging*46,'#ff774b');
      ring(c,x-128,y-32,(1-charging)*24+2,'#ffe6ad',1.7);}
    if(t>=4.37&&t<5.23){
      const f=Math.sin(clamp((t-4.37)/.86)*Math.PI);beam(c,x-120,y-32,ax+48,ay-25,'#ff793f',f*1.6);
      blast(c,ax+48,ay-25,t,f*(won?.78:1.50),'#ffe49b');}
    if(won&&t>3.36&&t<5.8){
      c.save();c.translate(ax+48,ay-28);c.scale(.42,1);ring(c,0,0,46,'#7df7fd',4);
      c.globalAlpha=.25;circle(c,0,0,44,'#91fff7');c.restore();
      if(t>4.90)beam(c,ax+49,ay-26,x,y-28,'#85e9ff',Math.sin(clamp((t-4.90)/.90)*Math.PI)*1.29);}
    if(t>5.10){let f=Math.sin(clamp((t-5.10)/1.34)*Math.PI);
      blast(c,won?x-24:ax,won?y-24:ay-35,t,f*1.42,'#ffab56');}
  }
  const prismArmor={...ivory,kit:'prism',mid:'#537f72',trim:'#f5c565'};
  const diveArmor={...ivory,kit:'dive',mid:'#34638a',trim:'#88ffe2',eye:'#a6ffff'};
  const jumpArmor={...ivory,kit:'jump',shell:'#f6db98',mid:'#a65539',trim:'#ffc655'};
  const beatArmor={...ivory,kit:'beat',shell:'#fff1c5',mid:'#4b9ca7',trim:'#ed6082'};
  const groveArmor={...ivory,kit:'grove',mid:'#997860',trim:'#ffc35c'};
  const stagePlates=['shrine','trench','foundry','aurora','canyon'].map(name=>{
    const image=new Image();image.src=name+'.webp?v=24';return image;
  });
  function stagePlate(c,index,t){
    const plate=stagePlates[index],pan=6*Math.sin(t*.72);
    if(plate.naturalWidth)c.drawImage(plate,-17+pan,-15,634,634);
    else landscape(c,t,false);
  }
  // The normal rotation visits different locations without playing their combat cues.
  globalThis.drawAmbientPatrol=function(c,location,t){
    if(location===0){drawPatrol(c,t,0);return;}
    const index=location-1;
    stagePlate(c,index,t);
    if(index===1){
      flyingUnit(c,210+54*Math.sin(t*.33),306+19*Math.sin(t*.84),1.13,1,false,.07,t,diveArmor);
    }else{
      const armor=[prismArmor,diveArmor,jumpArmor,beatArmor,groveArmor][index];
      const foot=[440,0,457,445,437][index],x=230+46*Math.sin(t*.29);
      const sway=Math.sin(t*.95);
      machine(c,x,foot-98+2*sway,1.03,1,armor,{...brace,lean:.03*sway,head:.09*sway,arm:-.9+sway*.12},false,index===0||index===4?'blade':'');
    }
  };
  function impactAt(c,t,won,hx,hy,ex,ey,ink){
    const intensity=Math.max(0,1-Math.abs(t-5.83)/.40);
    blast(c,won?ex:hx,won?ey:hy,t,intensity,ink);
  }
  // A shield rotates to catch the beam and send it back through a shrine prism.
  function mirrorShrine(c,t,won){
    stagePlate(c,0,t);
    const hx=170,ex=452,hy=353,ey=326,px=306,py=185+7*Math.sin(t*2);
    machine(c,ex,ey,1.03,-1,crimson,brace,true,'cannon');
    machine(c,hx,hy,1.13,1,prismArmor,{...brace,arm:-1.1-ease((t-2)/.6)*.45},false,'blade');
    c.save();c.translate(px,py);c.scale(.4+.6*Math.abs(Math.cos(t*1.3)),1);
    part(c,'M0 -36L21 0L0 34L-21 0Z','#78e4c9','#f6ffe7',3);
    part(c,'M0 -30L0 24L-14 1Z','#2b928d');c.restore();
    const tilt=ease((t-2.7)/.7)*(won?-.57:.42);
    c.save();c.translate(hx+48,hy-48);c.rotate(tilt);
    part(c,'M-22 -37Q0 -51 21 -36L24 7L0 40L-24 10Z','#f6dda3','#332b26',3);
    part(c,'M-15 -29L15 -29L16 8L0 28L-16 8Z','#76c9dc','#fff6ce',2);c.restore();
    if(t>1.4)beam(c,ex-44,ey-48,hx+49,hy-52,'#ff976e',.58);
    if(t>3.05)beam(c,hx+49,hy-52,px,py,'#a6fff0',ease((t-3.05)/.45)*.76);
    if(t>5.15)beam(c,px,py,won?ex:hx,won?ey-40:hy-43,'#fffac0',ease((t-5.15)/.62));
    impactAt(c,t,won,hx,hy-43,ex,ey-40,'#fff4a1');
  }
  // The lead mech banks between two torpedo waves and fires at their carrier.
  function depthFormation(c,t,won){
    stagePlate(c,1,t);
    const hx=166+Math.sin(t*1.25)*39,hy=313+Math.sin(t*2.25)*46;
    const ex=438+12*Math.cos(t),ey=216+10*Math.sin(t*1.5);
    for(let i=0;i<22;i++){
      const x=(i*71+Math.sin(t+i)*7)%600,y=510-(i*41+t*(26+i%4*9))%495;
      ring(c,x,y,2+i%4,'#c1ffff85',1.1);
    }
    for(let i=0;i<6;i++){
      const x=ex-50+(i%3)*46,y=ey-65+Math.floor(i/3)*32;
      c.save();c.translate(x,y);part(c,'M-14 0L-5 -6L9 -5L16 0L8 6L-5 5Z','#596784','#c1d9d8',1.2);
      circle(c,-5,0,2.4,'#ff8c91');c.restore();
    }
    for(let i=0;i<4;i++){
      const u=(t-(.65+i*.88))/1.7;
      if(u>0&&u<1)rocket(c,ex-22-u*427,ey+i*21+u*90,2.94,.55,t+i);
    }
    flyingUnit(c,ex,ey,.88,-1,true,-.16,t);
    flyingUnit(c,hx,hy,1.03,1,false,Math.sin(t*2)*.2,t,diveArmor);
    if(t>4.8){const u=ease((t-4.8)/1.03),x=hx+(ex-hx)*u,y=hy-46+(ey-hy)*u;
      if(won)rocket(c,x,y,-.27,.82,t);else rocket(c,ex+(hx-ex)*u,ey-46+(hy-ey)*u,2.8,.82,t);}
    impactAt(c,t,won,hx,hy-46,ex,ey-46,'#89f7ff');
  }
  // Three timed jumps across molten gaps; the last jump lands on the rival.
  function foundryJump(c,t,won){
    stagePlate(c,2,t);
    const xs=[72,211,347,477],ys=[434,393,355,390];
    for(let i=0;i<4;i++){
      const x=xs[i],y=ys[i];c.save();c.translate(x,y);
      if(i<3){
        const pick=[1.05,2.54,5.23][i],age=t-pick;
        c.save();c.translate((xs[i+1]-x)*.5,-161);
        if(age<0){
          c.scale(.36+.64*Math.abs(Math.cos(t*5+i)),1);
          part(c,'M0 -13L10 -7L10 7L0 13L-10 7L-10 -7Z','#efb73a','#fff4ae',2.7);
          segment(c,0,-7,0,7,'#88612f',2);
        }else if(age<.42){ring(c,0,0,7+age*55,'#fff3a1',2); }
        c.restore();
      }
      part(c,'M-51 0L42 -6L55 3L-39 12Z','#b5b5a0','#f4bd72',2);
      part(c,'M-39 12L55 3L48 25L-39 33Z','#543c38','#241e22',2);
      for(let j=0;j<4;j++)segment(c,-33+j*21,18,-25+j*21,11,'#d3a34c',3);
      c.restore();
    }
    const starts=[.55,2.02,4.64],ends=[1.55,3.05,5.83];
    let hx=xs[0],foot=ys[0],air=0;
    for(let i=0;i<3;i++){
      if(t<starts[i])break;
      const u=clamp((t-starts[i])/(ends[i]-starts[i]));
      const target=i===2&&!won?xs[3]-76:xs[i+1];
      hx=xs[i]+(target-xs[i])*u;air=4*u*(1-u);
      foot=ys[i]+(ys[i+1]-ys[i])*u-air*(i===2?130:94);
    }
    const ex=xs[3],ey=ys[3]-65,land=ease((t-5.64)/.19);
    machine(c,ex,ey+(won?12*land:0),.84,-1,crimson,brace,true,'');
    machine(c,hx,foot-69-(won?42*land:0),.90,1,jumpArmor,{...brace,knee:.45+air,leg:-.4-air*.5,arm:-.6-air},false,'');
    impactAt(c,t,won,hx,foot-54,ex,ey-18,'#ffe997');
  }
  // Alternating two-count poses, then an answering syncopated kick on the ice.
  function auroraBeat(c,t,won){
    stagePlate(c,3,t);
    const beat=Math.floor(t/.48),phase=t/.48-beat;
    const bop=Math.sin(phase*Math.PI),left=beat%4<2;
    const kick=ease((t-5.16)/.67);
    const hx=171+kick*94,ex=433-kick*53;
    // Beat marks move into the strike circle over the skaters' heads.
    for(let j=0;j<4;j++){
      const mx=292+(j-phase)*49,my=158;
      c.save();c.translate(mx,my);c.rotate(-.15);
      c.fillStyle=j%2?'#f6c6ff':'#c5ffef';c.beginPath();c.ellipse(0,0,5,3.7,-.3,0,Math.PI*2);c.fill();
      segment(c,4,0,4,-15,c.fillStyle,2);segment(c,4,-15,10,-12,c.fillStyle,2);c.restore();
    }
    ring(c,243,157,12+bop*3,'#fff0b1',2.8);
    const dance=(active,sign)=>({...brace,lean:sign*bop*(active ? .2 : .055),
      arm:-.57-(active?1.5:.33)*bop,elbow:-.38-bop*.52,
      leg:-.32-(active ? .83 : .13)*bop,knee:.26+bop*(active?1.1:.2)});
    for(const [x,active] of [[hx,left],[ex,!left]]){
      c.save();c.translate(x,416);c.scale(1,.23);
      ring(c,0,0,52+phase*28,active?'#abfff2':'#b693ff',active?5:2);c.restore();
    }
    machine(c,hx,333-(left?21:5)*bop,.98,1,beatArmor,dance(left,1),false,'');
    machine(c,ex,333-(left?5:21)*bop,.98,-1,crimson,dance(!left,-1),true,'');
    if(t>5.16)slash(c,t,!won,Math.sin(Math.PI*clamp((t-5.16)/1.19)));
    impactAt(c,t,won,hx,305,ex,304,'#c9fff7');
  }
  // Side-scrolling raid: a small attacker dashes through a large armored boss.
  function canyonCombo(c,t,won){
    stagePlate(c,4,t);
    const strikes=[1.05,2.16,3.22,4.28,5.83];
    let recoil=0;
    for(const at of strikes)recoil=Math.max(recoil,clamp(1-Math.abs(t-at)/.24));
    const advance=ease(t/1.05),cross=ease((t-3.0)/.5)*(1-ease((t-4)/.55));
    const hx=85+advance*197+cross*175,ex=409+(won?recoil*16:0),hy=354-37*Math.abs(Math.sin(t*2.65));
    machine(c,ex,310,1.41,-1,crimson,{...brace,lean:-.10+recoil*.13},true,'cannon');
    machine(c,hx,hy,.77,cross>.5?-1:1,groveArmor,{...flight,arm:-.65-recoil*1.1},false,'blade');
    for(let i=0;i<18;i++){
      const x=630-(i*67+t*(40+i%4*16))%680,y=116+(i*39+t*28)%344;
      c.save();c.translate(x,y);c.rotate(t+i);
      part(c,'M0 -7L2 -3L5 -4L4 0L8 0L2 5L0 8L-1 4L-6 1L-3 0L-5 -4L-1 -3Z',i%2?'#db6d39':'#f7b35a');c.restore();
    }
    if(recoil>.02)slash(c,t,hx>ex,recoil);
    // Rising hit values belong to the boss sprite, clear of the main reels.
    strikes.forEach((at,i)=>{
      const age=t-at;if(age<0||age>.63||(!won&&i===4))return;
      c.save();c.globalAlpha=1-ease((age-.33)/.30);c.translate(ex-16+(i%2)*22,213-age*62);
      c.rotate(i%2 ? .09 : -.09);c.font='italic 900 29px Arial';c.textAlign='center';
      c.strokeStyle='#652f24';c.lineWidth=4;c.strokeText(128+i*147,0,0);
      c.fillStyle='#ffdf7b';c.fillText(128+i*147,0,0);c.restore();
    });
    if(t>5&&!won)beam(c,ex-63,244,hx,hy-30,'#ff8371',ease((t-5)/.83));
    impactAt(c,t,won,hx,hy-30,ex,268,'#ffd194');
  }
  const episodes=[orbitSequence,aerialSequence,empSequence,siegeSequence,mirrorShrine,depthFormation,foundryJump,auroraBeat,canyonCombo];
  return function drawBattle(ctx,elapsed,variant,digits,won) {
    const t=Math.max(0,Number(elapsed)||0); if(t>=6.4)return;
    const cannon=variant===1||/cannon|beam|포격|포탄/i.test(String(variant));
    const c=ctx;c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();c.rect(0,0,600,600);c.clip();
    const episode=episodes[Number(variant)-2];
    if(episode){
      episode(c,Math.min(t,6.399),won);
      c.restore();return;
    }
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
    c.restore();
  };
})();
