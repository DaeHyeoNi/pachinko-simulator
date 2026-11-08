'use strict';
const segmentShapes=[
  '3,1 14,1 16,3 13,5 4,5 1,3','15,5 17,3 17,13 15,15 13,13 13,7',
  '15,16 17,18 17,28 15,30 13,28 13,19','3,28 13,28 15,31 13,32 3,32 1,30',
  '2,16 4,19 4,27 2,30 0,28 0,18','2,4 4,7 4,13 2,15 0,13 0,5',
  '3,14 13,14 15,16 13,18 3,18 1,16'
];
const digitMasks=[63,6,91,79,102,109,125,7,127,111];
function renderCounter(spins,wins,chain,history){
  for(const [id,value,width] of [['normalSpins',spins,4],['jackpots',wins,2],['chain',chain,2]]){
    const panel=document.getElementById(id);
    if(panel.dataset.value===String(value))continue;
    const digits=String(value).padStart(width,' ');
    const groups=Array.from(digits,(digit,i)=>{
      const bits=digit===' '?0:digitMasks[Number(digit)];
      return '<g transform="translate('+i*22+' 0)">'+segmentShapes.map((shape,j)=>
        '<polygon points="'+shape+'" opacity="'+(bits&(1<<j)?1:.09)+'"/>').join('')+'</g>';
    });
    panel.innerHTML='<svg viewBox="0 0 '+(digits.length*22)+' 34" aria-hidden="true">'+groups.join('')+'</svg>';
    panel.setAttribute('aria-label',String(value));panel.dataset.value=value;
  }
  const chart=document.getElementById('history'), key=history.join(',');
  if(chart.dataset.history===key)return;
  chart.dataset.history=key;
  chart.setAttribute('aria-label',key?'최근 초당첨까지 걸린 회전수 '+key:'초당첨 기록 없음');
  chart.innerHTML=Array.from({length:8},(_,i)=>{
    const n=history[i];
    return '<i '+(n===undefined?'':'title="'+n+'회" style="--fill:'+Math.max(8,100*n/Math.max(...history,1))+'%"')+'></i>';
  }).join('');
}
