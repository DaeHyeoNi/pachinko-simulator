'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
module.exports=function loadMachine(experiment,revision){
  function read(file) {
    return revision
      ? execFileSync('git',['show',revision+':dist/'+file],{cwd:root,encoding:'utf8'})
      : fs.readFileSync(path.join(root,'dist',file),'utf8');
  }
  const files=['fieldwork.js','contacts.js','flow.js'];
  const index=read('index.html');
  for(const optional of ['bezel.js','stage.js','striker.js'])if(index.includes('src="'+optional))files.push(optional);
  const source=[...files,'game.js'].map(read).join('\n');
  const empty = ()=>{};
  const element = {getContext:empty,querySelectorAll:()=>[],setAttribute:empty};
  const environment = {
    document:{querySelector:()=>element,getElementById:()=>element,createElement:()=>element,addEventListener:empty},
    BallTray:class {take(){return true;}},RotaryHandle:class {},BanknoteAcceptor:class {},RushSession:class {},
    Path2D:class {moveTo(){}lineTo(){}ellipse(){}},drawBattle:empty,BallAudio:{pin:empty,wheel:empty,launch:empty},
    requestAnimationFrame:empty
  };
  const build=new Function(...Object.keys(environment),'Math',source+'\nreturn ('+experiment.toString()+');');
  return (random,...args)=>build(...Object.values(environment),random)(...args);
};
