'use strict';

// All readouts share one smoked-glass face. Segment cuts, pitch and lean
// stay in the same proportions at phone and cabinet sizes.
const lampSegments=[
  '2,1 15,1 17,3 14,5 5,5 1,2',
  '15,5 18,3 18,14 15.7,16 14,14 14,7',
  '15.7,17 18,19 18,30 15.5,32 14,30 14,20',
  '4,29 14,29 16,32 14,33 2,33 0,31',
  '2,17 4,19 4,28 1.6,31 0,29 0,20',
  '2,3 4,6 4,14 2,16 0,14 0,5',
  '4,15 14,15 16,16.5 14,18.4 4,18.4 2,16.5'
];
const lampMasks=[63,6,91,79,102,109,125,7,127,111];
const counterColors={green:'#92ef59',red:'#ff423c',amber:'#ffb54e'};
const silkLabels=new Map();

function matrixLabel(text,x,y,color,size=1){
  if(!silkLabels.has(text)){
    const canvas=document.createElement('canvas');
    canvas.width=120;canvas.height=17;
    const ctx=canvas.getContext('2d');
    ctx.font='bold 13px "Malgun Gothic",sans-serif';ctx.fillText(text,0,13);
    const pixels=ctx.getImageData(0,0,120,17).data;
    const dots=[];
    for(let row=0;row<16;row++)for(let col=0;col<120;col++){
      if(pixels[(row*120+col)*4+3]>85)dots.push('M'+col+' '+row+'h.86v.86h-.86z');
    }
    silkLabels.set(text,dots.join(''));
  }
  return '<path transform="translate('+x+' '+y+') scale('+size+')" fill="'+color+'" d="'+silkLabels.get(text)+'"/>';
}

function ledNumber(value,places,x,y,width,height,color){
  const digits=value==null?' '.repeat(places):String(value).padStart(places,' ');
  const scale=Math.min(height/34,width/(digits.length*22+3));
  const left=x+width-(digits.length*22+3)*scale;
  let svg='<g transform="translate('+left+' '+y+') scale('+scale+')">';
  for(let i=0;i<digits.length;i++){
    const mask=digits[i]===' '?0:lampMasks[Number(digits[i])];
    svg+='<g transform="translate('+(i*22+3.5)+' 0) skewX(-7)">';
    for(let j=0;j<7;j++){
      const lit=Boolean(mask&(1<<j));
      svg+='<polygon points="'+lampSegments[j]+'" fill="'+(lit?color:'#222728')+'" opacity="'+(lit?1:.78)+'"'+(lit?' filter="url(#segment-bloom)"':'')+'/>';
    }
    svg+='</g>';
  }
  return svg+'</g>';
}

function renderCounter(spins,wins,history){
  const face=document.getElementById('dataFace');
  const state=[spins,wins,...history].join(',');
  if(face.dataset.state===state)return;
  face.dataset.state=state;
  const previous=history.at(-1);
  face.setAttribute('aria-label','일반 '+spins+'회전, 대당첨 '+wins+'회, 최근 초당첨 회전 이력 '+(history.join(', ')||'없음'));
  let ink='<defs><filter id="segment-bloom" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur in="SourceGraphic" stdDeviation=".52"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  ink+=matrixLabel('일반',3,10,'#56953e',.93)+matrixLabel('회전',3,25,'#80cb59',.93);
  ink+=ledNumber(String(spins).padStart(3,'0'),3,31,0,148,54,counterColors.green);
  ink+=matrixLabel('대당첨',196,2,'#e57161',.8)+ledNumber(wins,3,195,15,127,42,counterColors.red);
  ink+=matrixLabel('직전 초당첨',343,2,'#d0a25e',.8)+ledNumber(previous,3,337,15,140,42,counterColors.amber);

  ink+=matrixLabel('초당첨 이력',4,58,'#8cb853',.9);
  const maximum=Math.max(1,...history);
  for(let i=0;i<8;i++){
    const value=history[i],lit=value===undefined?0:Math.max(1,Math.round(value/maximum*7));
    ink+='<g><title>'+(value===undefined?'기록 없음':value+'회전')+'</title>';
    for(let row=0;row<7;row++){
      const color=row<4?'#69d951':row<6?'#dca744':'#ee5b3e';
      for(let col=0;col<3;col++)
        ink+='<rect x="'+(4+i*22+col*6.4)+'" y="'+(125-row*7.1)+'" width="5.1" height="5" fill="'+(row<lit?color:'#202a24')+'"/>';
    }
    ink+='</g>';
  }
  // Four preceding first-hit records sit below the live red and amber banks.
  for(let i=0;i<4;i++){
    const x=i%2?341:197,y=i<2?62:96;
    const color=i%2?counterColors.amber:counterColors.red;
    ink+=matrixLabel('-'+(i+2),x,y+10,'#88956f',.84);
    ink+=ledNumber(history.at(-2-i),3,x+20,y,98,30,color);
  }
  face.innerHTML=ink;
}
