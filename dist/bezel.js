// The glass opening is traced from the molded side cheeks down to the
// shallow lower apron. Sampled curves also form the physical rail surface.
const bezelTopLeft=[163,87], bezelTopRight=[427,85];
function makeDisplayOutline(){
  const outline=[bezelTopLeft];
  const curves=[
    [211,67,277,67,303,77], [345,65,392,70,...bezelTopRight],
    [450,91,477,104,476,128], [476,147,470,152,465,160],
    [458,170,466,184,462,201], [457,220,469,241,466,266],
    [464,298,431,313,400,323], [358,340,333,345,297,345],
    [254,345,213,333,190,324], [159,313,123,302,121,280],
    [119,248,139,227,139,207], [138,188,122,167,122,145],
    [120,120,131,101,...bezelTopLeft]
  ];
  for(const [cx,cy,dx,dy,x,y] of curves){
    const [a,b]=outline[outline.length-1];
    for(let i=1;i<=5;i++){
      const t=i/5,u=1-t;
      outline.push([u*u*u*a+3*u*u*t*cx+3*u*t*t*dx+t*t*t*x,
        u*u*u*b+3*u*u*t*cy+3*u*t*t*dy+t*t*t*y]);
    }
  }
  outline.pop();
  return outline;
}
// Stretch the original photographed housing into the newly exposed area.
// The texture is generated once. Pins and balls remain independent of it.
function makeBezelBacking(outline){
  if(typeof Image==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=900;
  const c=canvas.getContext('2d'),image=new Image();
  const source=[[175,59],[419,73],[489,112],[489,308],[420,357],[169,354],[105,308],[105,109]];
  function radius(poly,dx,dy){
    for(let i=0;i<poly.length;i++){
      const [x,y]=poly[i],[u,v]=poly[(i+1)%poly.length];
      const ex=u-x,ey=v-y,den=dx*ey-dy*ex;
      if(Math.abs(den)<1e-8)continue;
      const ax=x-297,ay=y-207,s=(ax*dy-ay*dx)/den;
      const r=(ax*ey-ay*ex)/den;
      if(r>0&&s>=0&&s<=1)return r;
    }
    return 0;
  }
  image.onload=()=>{
    const src=document.createElement('canvas');src.width=src.height=900;
    const ctx=src.getContext('2d');ctx.drawImage(image,0,0,900,900);
    let pixels;
    try{pixels=ctx.getImageData(0,0,900,900).data;}catch{return;}
    const out=c.createImageData(900,900),rays=2048,bands=[];
    for(let i=0;i<rays;i++){
      const theta=i*Math.PI*2/rays,dx=Math.cos(theta),dy=Math.sin(theta);
      bands.push([radius(source,dx,dy),radius(outline,dx,dy)]);
    }
    for(let row=70;row<550;row++)for(let col=140;col<755;col++){
      const x=col/1.5-297,y=row/1.5-207,r=Math.hypot(x,y);
      const angle=Math.atan2(y,x)/(2*Math.PI);
      const [oldR,newR]=bands[Math.round((angle+1)*rays)%rays];
      const outer=Math.max(oldR,newR)+10;
      if(r<newR-2||r>outer)continue;
      const fraction=(r-newR+2)/(outer-newR+2);
      const sampled=(oldR+4+(outer-oldR-4)*fraction)/r;
      const from=(Math.round((207+y*sampled)*1.5)*900+Math.round((297+x*sampled)*1.5))*4;
      const to=(row*900+col)*4;
      out.data[to]=pixels[from];out.data[to+1]=pixels[from+1];out.data[to+2]=pixels[from+2];
      out.data[to+3]=Math.min(255,(outer-r)*110);
    }
    c.putImageData(out,0,0);
  };
  image.src='machine-face.webp';return canvas;
}
