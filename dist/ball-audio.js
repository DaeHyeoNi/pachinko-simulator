/* Real-time contacts select short pre-rendered impulses. Each material has
   its own resonances and contact noise, all driven by the same impact. */
(() => {
  'use strict';

  // Modes are [frequency (Hz), relative amplitude, decay in seconds].
  const materials = {
    pin: {length: .125, noise: .63, scrape: .0017, minimum: 35, interval: .023,
      modes: [[1120,.26,.009],[2544,.63,.015],[4163,.5,.023],[6782,.27,.012],[9327,.15,.008]]},
    wheel: {length: .096, noise: .78, scrape: .0033, minimum: 34, interval: .032,
      modes: [[328,.52,.012],[793,.44,.01],[1968,.53,.014],[3740,.25,.009],[5404,.15,.012]]},
    steel: {length: .092, noise: .75, scrape: .0012, minimum: 27, interval: .022,
      modes: [[1740,.19,.007],[3265,.60,.009],[5471,.61,.014],[8177,.35,.009],[10318,.14,.006]]},
    rail: {length: .078, noise: 1, scrape: .017, minimum: 24, interval: .050,
      modes: [[710,.06,.016],[1730,.05,.012],[3610,.03,.008]]},
    launch: {length: .136, noise: 1, scrape: .007, minimum: 0, interval: .09,
      modes: [[105,.70,.015],[293,.58,.018],[899,.41,.013],[2678,.29,.013],[4360,.18,.012]]}
  };

  const states = new WeakMap();
  const clamp = (n,low,high) => Math.min(high,Math.max(low,n));

  function getState(context) {
    let state = states.get(context);
    if (state) return state;
    const master=context.createGain();
    master.gain.value=.66;
    const limiter=context.createDynamicsCompressor();
    limiter.threshold.value=-12;
    limiter.knee.value=7;
    limiter.ratio.value=5;
    limiter.attack.value=.002;
    limiter.release.value=.065;
    master.connect(limiter).connect(context.destination);
    state={master,bank:new Map(),samples:new Map(),loading:null,last:new Map(),voices:0,windowStart:0,events:0};
    states.set(context,state);
    return state;
  }

  function makeImpulse(context, type, variant) {
    const profile=materials[type];
    // Cap the offline synthesis rate; native playback handles interpolation.
    const rate=Math.min(context.sampleRate,32000);
    const length=Math.ceil(profile.length*rate);
    const buffer=context.createBuffer(1,length,rate);
    const wave=buffer.getChannelData(0);
    let seed=137+variant*8191+type.charCodeAt(0)*251;
    const random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    const modes=profile.modes.map(([frequency,amplitude,decay])=>{
      const omega=2*Math.PI*Math.min(rate*.46,frequency*(.94+.12*random()))/rate;
      const damping=Math.exp(-1/(rate*decay));
      return {a:2*damping*Math.cos(omega),b:-damping*damping,previous:0,
        current:Math.sin(omega)*amplitude*(.87+.26*random())};
    });
    const delayedTick=type==='launch' || type==='wheel';
    const secondAt=Math.floor((type==='launch' ? .034 : .014)*rate);
    const secondLength=.002*rate;
    const transientDecay=Math.exp(-1/(rate*profile.scrape));
    let previousNoise=0,brightness=1,peak=0;
    for(let i=0;i<length;i++){
      const white=2*random()-1;
      const high=white-previousNoise*.69;
      previousNoise=white;
      let sample=profile.noise*brightness*high;
      brightness*=transientDecay;
      for(const mode of modes){
        sample+=mode.current;
        const next=mode.a*mode.current+mode.b*mode.previous;
        mode.previous=mode.current;
        mode.current=next;
      }
      if(delayedTick && i>=secondAt && i<secondAt+secondLength*6){
        sample+=high*.51*Math.exp(-(i-secondAt)/secondLength);
      }
      sample*=Math.min(1,(i+1)/5,(length-i)/24);
      wave[i]=sample;
      peak=Math.max(peak,Math.abs(sample));
    }
    for(let i=0;i<length;i++)wave[i]*=.92/peak;
    return buffer;
  }

  async function prepare(context) {
    if(!context || context.state==='closed')return;
    const state=getState(context);
    if(state.loading)return state.loading;
    state.loading=Promise.all([
      ['tick','audio/steel-tick.ogg'],['roll','audio/rail-roll.ogg']
    ].map(async ([name,url])=>{
      if(state.samples.has(name))return;
      try{
        const response=await fetch(url);
        if(!response.ok)return;
        const audio=await context.decodeAudioData(await response.arrayBuffer());
        state.samples.set(name,audio);
      }catch{
        // Local file previews and unsupported codecs use the modal impulses.
      }
    })).finally(()=>{state.loading=null;});
    return state.loading;
  }

  function strike(context,type,speed,x) {
    const profile=materials[type];
    if(!context || context.state!=='running' || !Number.isFinite(speed) || speed<profile.minimum)return;
    const state=getState(context), time=context.currentTime;
    if(time-state.windowStart>=.1){state.windowStart=time;state.events=0;}
    if(state.voices>=10 || state.events>=7 || time-(state.last.get(type)??-1)<profile.interval)return;
    const rolling=type==='rail';
    const recorded=state.samples.get(rolling?'roll':'tick');
    const variant=Math.floor(Math.random()*4);
    const key=type+variant;
    if(!recorded && !state.bank.has(key))state.bank.set(key,makeImpulse(context,type,variant));
    const source=context.createBufferSource();
    const gain=context.createGain(), pan=context.createStereoPanner?.();
    const energy=clamp((speed-profile.minimum)/300,0,1);
    source.buffer=recorded || state.bank.get(key);
    const pitch=rolling ? .72+energy*.55 : (.93+energy*.08+Math.random()*.07)*(type==='wheel'?.81:1);
    source.playbackRate.value=pitch;
    const level=(.045+.21*Math.sqrt(energy))*(rolling?.58:type==='launch'?.57:1);
    const duration=Math.min(source.buffer.duration,rolling?.091:.12);
    const offset=rolling && recorded ? Math.random()*Math.max(0,source.buffer.duration-duration) : 0;
    const stop=time+duration/pitch;
    gain.gain.setValueAtTime(rolling?.0001:level,time);
    if(rolling)gain.gain.linearRampToValueAtTime(level,time+Math.min(.008,(stop-time)*.14));
    gain.gain.setValueAtTime(level,Math.max(time+(stop-time)*.2,stop-(rolling?.022:.006)));
    gain.gain.linearRampToValueAtTime(.0001,stop);
    source.connect(gain);
    if(pan){
      pan.pan.value=clamp((x-300)/300,-1,1)*.43;
      gain.connect(pan).connect(state.master);
    }else gain.connect(state.master);
    state.events++;
    state.voices++;
    state.last.set(type,time);
    source.onended=()=>{
      source.disconnect();gain.disconnect();pan?.disconnect();state.voices--;
    };
    source.start(time,offset,duration);
  }

  window.BallAudio=Object.freeze({
    prepare,
    output:context=>getState(context).master,
    pin:(context,speed,x=300)=>strike(context,'pin',speed,x),
    wheel:(context,speed,x=300)=>strike(context,'wheel',speed,x),
    launch:context=>strike(context,'launch',155,530),
    steel:(context,speed,x=300)=>strike(context,'steel',speed,x),
    rail:(context,tangentialSpeed,x=300)=>strike(context,'rail',Math.abs(tangentialSpeed),x)
  });
})();
