'use strict';
const SceneAudio=(()=>{
  const noiseBuffers=new WeakMap();
  function tone(c,type,from,to,duration,level,delay=0){
    const start=c.currentTime+delay,end=start+duration;
    const voice=c.createOscillator(),env=c.createGain();
    voice.type=type;voice.frequency.setValueAtTime(from,start);
    voice.frequency.exponentialRampToValueAtTime(to,end);
    env.gain.setValueAtTime(.0001,start);
    env.gain.exponentialRampToValueAtTime(level,start+.007);
    env.gain.exponentialRampToValueAtTime(.0001,end);
    voice.connect(env).connect(BallAudio.output(c));
    voice.onended=()=>{voice.disconnect();env.disconnect()};
    voice.start(start);voice.stop(end+.005);
  }
  function burst(c,from,to,duration,level){
    let noise=noiseBuffers.get(c);
    if(!noise){
      noise=c.createBuffer(1,Math.ceil(c.sampleRate*.5),c.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      noiseBuffers.set(c,noise);
    }
    const start=c.currentTime,end=start+duration;
    const voice=c.createBufferSource(),filter=c.createBiquadFilter(),env=c.createGain();
    voice.buffer=noise;filter.type='bandpass';filter.Q.value=.8;
    filter.frequency.setValueAtTime(from,start);filter.frequency.exponentialRampToValueAtTime(to,end);
    env.gain.setValueAtTime(level,start);env.gain.exponentialRampToValueAtTime(.0001,end);
    voice.connect(filter).connect(env).connect(BallAudio.output(c));
    voice.onended=()=>{voice.disconnect();filter.disconnect();env.disconnect()};
    voice.start(start);voice.stop(end);
  }
  function weapon(c,kind){
    switch(kind){
      case 'bell':tone(c,'triangle',784,784,.21,.13);tone(c,'sine',1175,1175,.24,.065,.03);break;
      case 'jump':tone(c,'square',294,880,.135,.052);break;
      case 'clap':burst(c,1900,1150,.085,.23);tone(c,'sine',200,105,.105,.16);break;
      case 'blade':burst(c,800,5700,.17,.25);tone(c,'triangle',1450,470,.20,.10,.06);break;
      case 'beam':tone(c,'sawtooth',740,68,.34,.10);burst(c,2500,620,.29,.12);break;
      case 'rocket':burst(c,650,2700,.27,.24);tone(c,'triangle',105,370,.24,.11);break;
      case 'arc':tone(c,'square',315,1100,.12,.048);tone(c,'triangle',1360,230,.22,.10,.07);break;
      case 'cannon':tone(c,'sine',149,35,.36,.32);burst(c,1800,190,.39,.27);break;
    }
  }
  // Seconds on the animation camera clock (also used by the winning ST cut).
  const strikes=[
    [[2.58,'blade'],[3.18,'blade'],[5.19,'blade']],
    [[2.59,'beam'],[3.25,'beam'],[5.15,'beam']],
    [[.09,'rocket'],[1.03,'rocket'],[1.97,'rocket'],[3.35,'rocket'],[4.38,'beam'],[5.18,'cannon']],
    [[1.20,'beam'],[2.00,'beam'],[3.03,'rocket'],[4.77,'blade']],
    [[.80,'arc'],[1.68,'arc'],[2.35,'arc'],[4.66,'arc']],
    [[1.10,'cannon'],[3.36,'rocket'],[4.37,'cannon'],[4.90,'beam']],
    [[1.40,'beam'],[3.05,'bell'],[5.15,'beam']],
    [[.65,'rocket'],[1.53,'rocket'],[2.41,'rocket'],[3.29,'rocket'],[4.8,'rocket']],
    [[.55,'jump'],[1.55,'bell'],[2.02,'jump'],[3.05,'bell'],[4.64,'jump']],
    Array.from({length:12},(_,i)=>[.48*(i+1),i%4===3?'bell':'clap']),
    [[1.05,'blade'],[2.16,'blade'],[3.22,'blade'],[4.28,'blade']]
  ];
  function battle(c,variant,previous,now){
    if(c?.state!=='running')return;
    for(const [at,kind] of strikes[variant]||strikes[0])
      if(previous<at && at<=now)weapon(c,kind);
  }
  const spinNotes=[523.25,659.25,783.99,1046.50,659.25,783.99,987.77,1174.66];
  const stopNotes=[523.25,587.33,659.25,783.99,880,1046.50,1174.66,1318.51,1567.98];
  function reels(c,ticket,previous){
    if(c?.state!=='running')return;
    const t=ticket.elapsed,timing=drawTiming(ticket),finish=reelStopTime(ticket);
    const crosses=at=>previous<at && at<=t;
    if(t<finish && !chanceIsReady(ticket)){
      const alternate=ticket.lucky && t>=timing.rightStop;
      const before=symbolPhase(finish-previous,alternate),after=symbolPhase(finish-t,alternate);
      if(Math.floor(before)!==Math.floor(after) && t-(ticket.lastChime??-1)>.085){
        const beat=(ticket.chimeStep??0)%spinNotes.length,hz=spinNotes[beat];
        tone(c,'triangle',hz*.99,hz,.105,.13);
        tone(c,'sine',hz*2,hz*2,.14,.045,.009);
        if(beat%4===0)tone(c,'sine',beat===0?130.81:196,beat===0?130.81:196,.12,.11);
        if(beat%4===3)tone(c,'triangle',hz*1.25,hz*1.25,.095,.073,.072);
        ticket.chimeStep=beat+1;ticket.lastChime=t;
      }
    }
    for(const [index,time] of [[0,timing.leftStop],[2,timing.rightStop],[1,finish]]){
      if(!crosses(time))continue;
      const pitch=stopNotes[ticket.digits[index]-1];
      tone(c,'triangle',pitch*.985,pitch,.18,.18);
      tone(c,'sine',pitch*2,pitch*2,.23,.09,.028);
    }
    if(ticket.digits[0]===ticket.digits[2]){
      if(crosses(timing.rightStop)){
        const cue=['beam','blade','arc'][ticket.reachVariant];
        if(cue)weapon(c,cue);
      }
      if(crosses(timing.rightStop+1.05) && t<finish){
        tone(c,'triangle',660,990,.2,.13);
        if(ticket.reachVariant===1)burst(c,3400,400,.25,.20);
      }
    }
    if(ticket.stage==='battle' && t>=timing.leftStop)
      battle(c,ticket.variant,battleCameraTime(ticket,previous),battleCameraTime(ticket,t));
    else if(ticket.location>0 && t<finish){
      const camera=t%4.8,prior=previous%4.8;
      battle(c,ticket.location+5,prior>camera?0:prior,camera);
    }
    if(crosses(finish) && ticket.stage==='battle'){
      impact(c);
      if(ticket.won)[523,659,784,1047].forEach((hz,i)=>tone(c,'triangle',hz,hz,.39,.16,.08+i*.095));
    }
  }
  function push(c){
    if(c?.state!=='running')return;
    tone(c,'sine',210,95,.10,.21);tone(c,'triangle',480,1050,.29,.18,.04);
  }
  function impact(c){
    if(c?.state!=='running')return;
    tone(c,'sine',142,41,.39,.28);burst(c,3100,260,.30,.23);
  }
  return {reels,battle,push,impact};
})();
