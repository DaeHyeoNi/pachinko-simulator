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
      case 'shield':burst(c,3900,600,.16,.18);tone(c,'triangle',712,706,.42,.15);tone(c,'sine',1163,1160,.32,.08);break;
      case 'prism':[784,988,1319].forEach((hz,i)=>tone(c,'sine',hz,hz,.32,.14,.053*i));break;
      case 'sonar':tone(c,'sine',850,820,.24,.13);tone(c,'sine',850,820,.22,.052,.15);break;
      case 'dive':burst(c,1250,320,.35,.18);tone(c,'sine',175,72,.28,.12);break;
      case 'token':tone(c,'square',988,988,.07,.055);tone(c,'triangle',1480,1480,.16,.16,.055);break;
      case 'land':tone(c,'sine',165,54,.145,.20);burst(c,1200,410,.09,.15);break;
      case 'skate':burst(c,2700,5300,.16,.16);break;
      case 'kick':tone(c,'sine',165,48,.16,.21);break;
      case 'combo':burst(c,1050,4600,.12,.17);tone(c,'triangle',660,840,.115,.12,.045);break;
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
    [[1.40,'shield'],[3.05,'prism'],[5.15,'beam']],
    [[.24,'sonar'],[.65,'rocket'],[1.0,'dive'],[1.53,'rocket'],[2.41,'rocket'],[2.72,'dive'],[3.29,'rocket'],[4.02,'sonar'],[4.8,'rocket']],
    [[.55,'jump'],[1.05,'token'],[1.55,'land'],[2.02,'jump'],[2.54,'token'],[3.05,'land'],[4.64,'jump'],[5.23,'token'],[5.83,'land']],
    Array.from({length:12},(_,i)=>[.48*(i+1),['kick','skate','clap','bell'][i%4]]),
    [[.93,'blade'],[1.05,'combo'],[2.04,'blade'],[2.16,'combo'],[3.10,'blade'],[3.22,'combo'],[4.16,'blade'],[4.28,'combo']]
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
    }
    if(ticket.won)award(c,previous-finish,t-finish);
  }
  // Four bars of original syncopated brass over C, F, D minor and G.
  // Advance on the visual clock, so muting or suspending never queues a backlog.
  const beatSeconds=60/128;
  const tune=[
    [0,72,.5],[.75,76,.22],[1,79,.56],[1.75,76,.22],[2,84,.62],[3,79,.25],[3.5,81,.32],
    [4,77,.60],[4.75,81,.23],[5,84,.55],[5.75,81,.20],[6,86,.70],[7,84,.24],[7.5,81,.32],
    [8,77,.50],[8.75,81,.20],[9,86,.63],[10,84,.30],[10.5,81,.32],[11,77,.26],[11.5,74,.32],
    [12,79,.30],[12.5,83,.30],[13,86,.50],[13.75,83,.21],[14,89,.40],[14.5,86,.35],[15,83,.30],[15.5,79,.34],[16,84,1.55]
  ];
  const midi=n=>440*2**((n-69)/12);
  function brass(c,n,beats){
    const hz=midi(n),length=beats*beatSeconds;
    tone(c,'sawtooth',hz*.981,hz,length,.069);
    tone(c,'triangle',hz*1.006,hz*1.003,length+.025,.12);
  }
  function award(c,previous,now,renewal=false){
    if(c?.state!=='running'||now<0||previous>(renewal?1.3:8.5))return;
    const crossed=at=>previous<at&&at<=now;
    if(renewal){
      for(const [at,n,d] of [[0,76,.35],[.17,79,.36],[.36,83,.45],[.58,84,1.15]]){
        if(crossed(at)){brass(c,n,d);tone(c,'triangle',midi(n-12),midi(n-12),.2,.13);}
      }
      if(crossed(.58))weapon(c,'clap');
      return;
    }
    const oldBeat=previous/beatSeconds,newBeat=now/beatSeconds;
    for(const [at,n,d] of tune)if(oldBeat<at&&at<=newBeat)brass(c,n,d);
    for(let eighth=Math.max(0,Math.floor(oldBeat*2)+1);eighth<=Math.min(32,Math.floor(newBeat*2));eighth++){
      const bar=Math.min(3,Math.floor(eighth/8)),step=eighth%8;
      const root=eighth===32?36:[36,41,38,43][bar];
      if(step%2===0){
        const bass=midi(root+(step===4?7:0));
        tone(c,'triangle',bass,bass,.245,.21);
        if(step%4===0)weapon(c,'kick');else burst(c,2300,860,.13,.19);
      }else{
        burst(c,7600,5500,.048,.094);
        if(step===3||step===7){
          const chord=[root+24,root+24+(bar===2?3:4),root+31];
          chord.forEach(n=>tone(c,'triangle',midi(n),midi(n),.13,.062));
        }
      }
      if(eighth===32)[60,64,67].forEach(n=>tone(c,'triangle',midi(n),midi(n),.80,.10));
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
  return {reels,battle,push,impact,award};
})();
