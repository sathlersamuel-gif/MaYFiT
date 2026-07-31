(function(){
'use strict';
const OLD_KEY='mayfit_v8';
const NEW_KEY='mayfit_v9';
const MARKER='mayfit_legacy_workouts_recovered_v1';

function read(key){
  try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}
}
function objectSize(value){return value&&typeof value==='object'?Object.keys(value).length:0}
function exerciseCount(data){
  if(!data||typeof data!=='object')return 0;
  let total=Array.isArray(data.exercises)?data.exercises.length:0;
  if(data.workouts&&typeof data.workouts==='object'){
    for(const list of Object.values(data.workouts)){
      if(!Array.isArray(list))continue;
      for(const workout of list)total+=Array.isArray(workout?.exercises)?workout.exercises.length:0;
    }
  }
  return total;
}
function hasUsefulData(data){
  return exerciseCount(data)>0||objectSize(data?.workouts)>0||objectSize(data?.sessions)>0;
}
function merge(oldData,newData){
  const merged={...(oldData||{}),...(newData||{})};
  const oldExercises=Array.isArray(oldData?.exercises)?oldData.exercises:[];
  const newExercises=Array.isArray(newData?.exercises)?newData.exercises:[];
  if(oldExercises.length>newExercises.length)merged.exercises=oldExercises;

  merged.workouts={...(oldData?.workouts||{}),...(newData?.workouts||{})};
  for(const [id,list] of Object.entries(oldData?.workouts||{})){
    const current=merged.workouts[id];
    const oldCount=Array.isArray(list)?list.reduce((n,w)=>n+(w?.exercises?.length||0),0):0;
    const currentCount=Array.isArray(current)?current.reduce((n,w)=>n+(w?.exercises?.length||0),0):0;
    if(oldCount>currentCount)merged.workouts[id]=list;
  }

  for(const key of ['sessions','measurements','photos']){
    merged[key]={...(oldData?.[key]||{}),...(newData?.[key]||{})};
  }
  if(Array.isArray(oldData?.users)&&(!Array.isArray(newData?.users)||oldData.users.length>newData.users.length))merged.users=oldData.users;
  return merged;
}

const oldData=read(OLD_KEY);
const newData=read(NEW_KEY);
if(hasUsefulData(oldData)&&exerciseCount(oldData)>exerciseCount(newData)){
  const recovered=merge(oldData,newData);
  localStorage.setItem(NEW_KEY,JSON.stringify(recovered));
  localStorage.setItem(MARKER,new Date().toISOString());
  console.info('MaYFiT: treinos antigos recuperados do armazenamento local.');
}
})();