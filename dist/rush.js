'use strict';

// Right-start tickets stay separate from the four stored heso tickets.
class RushSession {
  constructor(random=Math.random){
    this.random=random;
    this.queue=[];
    this.remaining=0;
    this.chain=0;
    this.earned=0;
  }
  beginFirst(force=false){
    this.chain=1;
    this.earned=0;
    this.remaining=0;
    this.queue.length=0;
    this.kind=force || this.random()<.59 ? 'st' : 'chance';
  }
  startSupport(){
    this.remaining=this.kind==='st'?163:100;
  }
  canAccept(){
    return this.queue.length<4 && this.queue.length<this.remaining;
  }
  admit(force=false){
    if(!this.canAccept())return false;
    const odds=this.kind==='st'?99.4:319.7;
    this.queue.push({won:force || this.random()<1/odds});
    return true;
  }
  next(){
    if(!this.remaining || !this.queue.length)return null;
    this.remaining--;
    return this.queue.shift();
  }
  renew(){
    this.chain++;
    this.kind='st';
  }
}
