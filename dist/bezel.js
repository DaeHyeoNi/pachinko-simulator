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
function drawTitleLift(c,photo,recess,motion){
  if(!motion.light || !photo?.naturalWidth || !recess?.naturalWidth)return;
  c.save();c.translate(-13,-234);c.scale(600/941,600/941);
  c.beginPath();
  for(const ring of castingOutlines){
    ring.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  }
  c.save();c.clip();c.drawImage(recess,0,0,941,404);c.restore();
  c.translate(0,motion.travel);
  c.beginPath();
  for(const ring of castingOutlines){
    ring.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  }
  c.shadowColor='#090609';c.shadowBlur=9;c.shadowOffsetY=6;c.fillStyle='#18131b';c.fill();
  c.shadowBlur=0;c.shadowOffsetY=0;c.clip();
  c.drawImage(photo,0,0,941,404,0,0,941,404);
  const rainbow=c.createLinearGradient(180,125,815,335);
  for(let i=0;i<=8;i++)rainbow.addColorStop(i/8,'hsl('+((motion.hue+i*48)%360)+' 100% 56%)');
  c.fillStyle=rainbow;c.globalCompositeOperation='color';c.globalAlpha=motion.light;c.fillRect(175,117,650,272);
  c.globalCompositeOperation='screen';c.globalAlpha=.33*motion.light;c.fillRect(175,117,650,272);
  c.restore();
}
