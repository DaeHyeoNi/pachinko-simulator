// The plunger shares the launcher's x axis. Its rubber face meets the bottom
// of a seated 10-unit ball when the coil reaches its working length.
function drawLaunchSpring(ctx,seatY,striker,time,tray){
  ctx.save();
  ctx.translate(16,seatY);
  const face=5+striker.compression, collar=face+5, foot=46;
  function shell(x,y,w,h,r,fill,edge){
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill;
    ctx.fill();
    if(edge){ctx.strokeStyle=edge;ctx.lineWidth=.8;ctx.stroke();}
  }
  function metalAcross(radius){
    const gradient=ctx.createLinearGradient(-radius,0,radius,0);
    for(const [stop,color] of [[0,'#324451'],[.17,'#88a1af'],[.36,'#eef8fa'],[.56,'#9caeaf'],[.8,'#5a717d'],[1,'#273342']]){
      gradient.addColorStop(stop,color);
    }
    return gradient;
  }
  // A side-loading seat sits above a dark inspection window in the lower apron.
  shell(-9,-8,36,16,4,'#1d2d39','#90a6b2');
  shell(-7,-6.4,33,11.8,4,'#0c1721');
  shell(-9.5,4,19,46,3,'#141f2b','#879ba6');
  shell(-1.8,6,3.6,39,1,metalAcross(2));
  const turns=7, pitch=(foot-collar)/turns, wire=metalAcross(6.8);
  ctx.lineCap='round';
  for(let turn=0;turn<turns;turn++){
    const y=collar+turn*pitch;
    // Wind behind the shaft and back across its face on the next half turn.
    ctx.beginPath();
    ctx.moveTo(-6.4,y);
    ctx.bezierCurveTo(-6.4,y+1.8,6.4,y-1.5,6.4,y+pitch*.5);
    ctx.strokeStyle='#576771';ctx.lineWidth=1.8;ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6.4,y+pitch*.5);
    ctx.bezierCurveTo(6.4,y+pitch*.8,-6.4,y+pitch*.6,-6.4,y+pitch);
    ctx.strokeStyle=wire;ctx.lineWidth=2.1;ctx.stroke();
  }
  shell(-7.2,collar-2,14.4,3.4,1,wire);
  shell(-4.7,face,9.4,3.8,1.3,'#423b34','#b4a480');
  shell(-8,foot,16,4,1.3,wire);
  if(striker.loadedAt!==null){
    // The tray ball leaves its feed throat before entering this cutaway.
    const fraction=Math.min(1,Math.max(0,(time-striker.loadedAt-.16)/.07));
    if(fraction>0){
      const roll=(1-fraction)**2;
      tray.drawPlayfieldBall(ctx,{x:19*roll,y:-2.1*roll});
    }
  }
  shell(21,-7.3,6,13.3,1.5,metalAcross(25),'#b6c4ca');
  shell(-8.5,8,1.1,36,.5,'#c4ebff73');
  shell(7.2,8,1,36,.5,'#9fcce15e');
  ctx.restore();
}
