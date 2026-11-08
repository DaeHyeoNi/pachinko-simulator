/* Brass playfield hardware, in the same 600-unit coordinate system as the balls. */
function createFieldwork() {
  const pegs = [];
  const rails = [];
  const shaftRadius=0.85; // 1.85 mm shaft relative to an 11 mm ball (10 board units).
  // Centers of visible nail heads in the 941 x 1672 front photograph.
  // Keep the survey in photo pixels so it can be checked against the cabinet.
  const referenceHeads=[
    [55,384],[54,399],[52,413],[50,427],[49,441],[15,443],[47,454],[12,456],
    [75,464],[46,467],[74,476],[45,481],[5,489],[84,490],[88,506],[26,511],
    [58,514],[103,521],[104,534],[1,539],[41,541],[71,541],[9,550],[1,560],
    [30,570],[39,581],[87,587],[46,591],[88,601],[16,614],[61,621],[92,624],
    [24,625],[91,638],[42,651],[85,651],[0,656],[8,665],[95,671],[16,676],
    [61,676],[95,686],[32,689],[64,689],[105,690],[31,700],[40,710],[86,717],
    [48,720],[94,726],[58,727],[8,745],[63,748],[906,752],[108,754],[932,754],
    [69,757],[901,765],[109,766],[35,769],[79,770],[922,777],[111,779],[35,780],
    [82,782],[874,784],[112,792],[85,795],[928,795],[899,796],[872,798],[60,805],
    [114,806],[899,808],[927,808],[88,809],[871,811],[115,819],[89,821],[920,827],
    [26,829],[939,830],[59,835],[886,835],[915,835],[870,845],[61,866],[41,883],
    [48,903],[129,911],[138,918],[148,924],[68,929],[160,930],[170,937],[181,944],
    [208,958],[219,964],[230,970],[240,977],[217,980],[253,984],[733,988],[166,989],
    [263,989],[227,990],[110,992],[272,994],[177,995],[722,996],[118,1003],[219,1004],
    [714,1007],[287,1010],[171,1012],[204,1013],[126,1014],[703,1014],[300,1017],[214,1018],
    [181,1020],[284,1020],[741,1021],[692,1022],[134,1024],[224,1024],[725,1024],[314,1025],
    [680,1028],[235,1030],[191,1031],[325,1032],[703,1032],[732,1032],[669,1035],[715,1035],
    [143,1036],[245,1036],[656,1040],[337,1041],[191,1042],[256,1044],[347,1046],[645,1047],
    [873,1050],[265,1052],[638,1052],[688,1052],[358,1054],[696,1054],[846,1054],[297,1056],
    [791,1056],[814,1056],[858,1056],[742,1057],[629,1058],[672,1061],[351,1063],[721,1064],
    [619,1065],[691,1065],[845,1066],[606,1070],[387,1071],[595,1079],[685,1079],[275,1080],
    [396,1080],[677,1080],[317,1081],[585,1084],[633,1085],[839,1085],[408,1086],[732,1086],
    [326,1092],[573,1092],[775,1094],[800,1095],[437,1099],[471,1099],[513,1099],[542,1099],
    [789,1100],[713,1103],[365,1108],[355,1110],[362,1122],[341,1126],[375,1128],[417,1130],
    [552,1130]
  ];
  const scale=600/941;
  const wheel={x:96*scale-13,y:880*scale-234,angle:-.46,speed:0,inertia:147};
  const heso={x:492*scale-13,y:1099*scale-234,halfSpacing:20*scale,nailRadius:shaftRadius};
  for(const [px,py] of referenceHeads){
    pegs.push({x:px*scale-13,y:py*scale-234,r:shaftRadius,headRadius:1.8,light:0});
  }
  // This single open-ended chain goes up the left wall, around the glass and
  // down the right wall. Its only opening is the bottom drain throat.
  const drain={x:300, y:586, halfWidth:19};
  const leftSkirt=[[281,594],[281,576],[265,566],[194,550],[123,530],
    [66,509],[32,487],[18,462],[10,424],[-5,347],[-5,176]];
  const perimeter=[...leftSkirt];
  for(let i=1;i<20;i++) {
    const a=i*Math.PI/20;
    perimeter.push([300-305*Math.cos(a),176-400*Math.sin(a)]);
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

function drawFieldwork(ctx,field){
  const w=field.wheel;
  ctx.save();
  if(Math.abs(w.speed)>.02){
    ctx.strokeStyle='#f9df9d9c';ctx.lineWidth=1.4;
    windmillBlades(w,(x,y,a,b)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();});
  }
  for(const p of field.pegs){
    if(!p.light)continue;
    ctx.beginPath();ctx.arc(p.x,p.y,p.headRadius,0,Math.PI*2);
    ctx.fillStyle='rgba(255,226,153,'+Math.min(.85,p.light*4)+')';ctx.fill();
  }
  ctx.restore();
}
