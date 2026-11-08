// LCD gasket traced in the same photograph coordinate space as the nails.
function makeDisplayOutline(){
  const outline=[[173,376],[268,349],[331,335],[340,377],[453,342],[507,360],
    [574,344],[722,348],[807,313],[809,827],[790,849],[709,841],[675,826],
    [636,856],[591,861],[551,849],[529,858],[459,857],[435,849],[403,870],
    [357,875],[318,853],[279,859],[248,846],[212,840],[179,820]];
  return outline.map(([x,y])=>[x*600/941-13,y*600/941-234]);
}
/* Two physical cast pieces travel on a carriage in front of the LCD. The
   silhouettes and rest positions use the same photo pixels as the playfield. */
const castingOutlines=[
  [[183,252],[223,216],[262,158],[276,137],[337,146],[344,161],[345,139],
   [407,137],[456,122],[487,155],[481,170],[472,237],[482,265],[458,284],
   [514,308],[472,325],[450,365],[423,356],[390,329],[320,375],[304,340],
   [224,382],[207,353],[186,321],[218,304],[210,277],[180,265],[207,257]],
  [[495,239],[539,207],[526,184],[552,171],[581,136],[622,145],[678,141],
   [706,146],[747,134],[759,125],[799,152],[776,175],[781,201],[764,229],
   [787,244],[817,291],[763,308],[742,336],[725,353],[565,367],[574,313],
   [529,317],[516,292],[497,274],[538,261],[549,243]]
];
let castingMask;
function drawTitleLift(c,photo,recess,motion){
  if(!photo?.naturalWidth)return;
  if(!castingMask){
    castingMask=new Path2D();
    for(const ring of castingOutlines){
      ring.forEach(([x,y],i)=>i?castingMask.lineTo(x,y):castingMask.moveTo(x,y));
      castingMask.closePath();
    }
  }
  c.save();c.translate(-13,-234);c.scale(600/941,600/941);
  if(motion.travel>0 && recess?.naturalWidth){
    c.save();c.clip(castingMask);c.drawImage(recess,0,0,941,404);c.restore();
    c.translate(0,motion.travel);
    c.shadowColor='#100608';c.shadowBlur=9;c.shadowOffsetY=5;
    c.fillStyle='#26191b';c.fill(castingMask);c.shadowBlur=0;c.shadowOffsetY=0;
  }
  if(motion.light){
    c.save();c.globalAlpha=motion.light*.85;c.lineWidth=3.2;
    c.shadowColor=c.strokeStyle='hsl('+motion.hue+' 100% 66%)';c.shadowBlur=12;
    c.stroke(castingMask);c.restore();
  }
  // This casting is in front of both ball layers, including when its LEDs are off.
  c.clip(castingMask);
  c.drawImage(photo,0,0,941,404,0,0,941,404);
  if(motion.light){
    const rainbow=c.createLinearGradient(175,130,810,326);
    for(let i=0;i<=8;i++)rainbow.addColorStop(i/8,'hsl('+((motion.hue+i*49)%360)+' 100% 52%)');
    c.fillStyle=rainbow;c.globalCompositeOperation='color';c.fillRect(175,117,650,272);
    c.globalCompositeOperation='screen';c.globalAlpha=.68*motion.light;c.fillRect(175,117,650,272);
    const beamX=125+motion.hue/360*810;
    const beam=c.createLinearGradient(beamX-55,340,beamX+52,308);
    beam.addColorStop(0,'#ffffff00');beam.addColorStop(.5,'#fffcdb');beam.addColorStop(1,'#ffffff00');
    c.fillStyle=beam;c.globalAlpha=.73*motion.light;c.fillRect(175,117,650,272);
  }
  c.restore();
}
function prepareAcrylicLamps(canvas,photo){
  // The facets follow the photographed arch, two molded rails and lower lip.
  // Harvest their reflections once; the live cabinet only changes hue and gain.
  const panels=[
    [[14,322],[37,210],[114,119],[237,49],[388,15],[608,13],[761,53],[853,115],[926,220],[940,313],[872,210],[800,144],[722,106],[612,77],[483,70],[337,86],[219,125],[108,201],[61,275]],
    [[156,208],[182,192],[139,302],[116,402],[141,485],[135,643],[156,720],[201,776],[208,833],[304,882],[371,923],[341,954],[251,907],[168,879],[131,839],[124,761],[91,721],[95,635],[91,510],[76,449],[86,347]],
    [[817,177],[895,227],[937,320],[938,784],[914,807],[890,885],[875,935],[813,962],[717,973],[644,986],[611,1023],[547,1047],[490,1059],[424,1052],[374,1031],[352,1000],[310,976],[244,942],[169,903],[132,856],[133,802],[160,833],[202,867],[288,909],[399,952],[473,973],[557,967],[620,934],[677,925],[775,911],[812,885],[816,792],[828,713],[834,618],[824,510],[815,415],[828,350],[855,315],[839,277]],
    [[874,287],[923,344],[928,432],[909,507],[920,589],[891,662],[871,731],[849,758],[863,679],[889,599],[882,535],[870,476],[894,421],[884,360]],
    [[218,884],[314,927],[410,976],[478,994],[551,988],[613,962],[641,953],[637,991],[606,1024],[546,1053],[493,1077],[435,1054],[391,1027],[318,985]]
  ];
  canvas.width=720;canvas.height=Math.round(1260*720/941);
  const c=canvas.getContext('2d',{willReadFrequently:true});
  const scale=canvas.width/941;
  c.scale(scale,scale);c.beginPath();
  for(const points of panels){
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  }
  c.save();c.clip();c.drawImage(photo,0,0);c.restore();
  let pixels;
  try{pixels=c.getImageData(0,0,canvas.width,canvas.height);}
  catch{return;}
  const data=pixels.data;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    if(!data[i+3])continue;
    const facet=(Math.max(data[i],data[i+1],data[i+2])*.65+data[i+1]*.35)/255;
    const angle=Math.atan2(x-485*scale,525*scale-y)+Math.PI;
    const hue=angle;
    for(let channel=0;channel<3;channel++){
      const band=Math.max(0,Math.min(1,Math.cos(hue-channel*2*Math.PI/3)*1.32+.48));
      data[i+channel]=Math.min(255,24+230*band+75*facet**3);
    }
    data[i+3]*=.30+.70*Math.min(1,facet*1.75);
  }
  c.putImageData(pixels,0,0);
}
