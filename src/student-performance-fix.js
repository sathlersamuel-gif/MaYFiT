const CATALOG_KEY='mayfit_exercise_catalog_v1';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
let evolutionLoading=false;
let evolutionAttempt=0;
let evolutionTimer=null;

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}
}

function hasValidCatalog(){
  try{
    const data=JSON.parse(localStorage.getItem(CATALOG_KEY)||'[]');
    return Array.isArray(data)&&data.length>20;
  }catch{return false}
}

async function warmCatalog(){
  if(hasValidCatalog())return;
  try{
    const response=await fetch(DB,{cache:'force-cache'});
    if(!response.ok)return;
    const data=await response.json();
    const compact=(Array.isArray(data)?data:[]).map(item=>({
      id:item.id,
      name:item.name,
      image:Array.isArray(item.images)?item.images[0]:''
    })).filter(item=>item.id&&item.name).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    if(compact.length)try{localStorage.setItem(CATALOG_KEY,JSON.stringify(compact))}catch{}
  }catch{}
}

function scheduleWarmup(){
  if('requestIdleCallback'in window)requestIdleCallback(warmCatalog,{timeout:1200});
  else setTimeout(warmCatalog,250);
}

function isHomeScreen(){
  const user=currentUser();
  const main=document.querySelector('.app main');
  return Boolean(user&&main&&!document.querySelector('.workout-screen'));
}

async function ensureBodyEvolution(){
  if(!isHomeScreen())return;
  if(document.getElementById('mayfit-body-evolution'))return;
  if(evolutionLoading)return;
  evolutionLoading=true;
  try{
    evolutionAttempt+=1;
    await import(`./body-evolution.js?screen-remount=${evolutionAttempt}`);
  }catch(error){
    console.error('Falha ao restaurar evolução corporal:',error);
  }finally{
    evolutionLoading=false;
  }
}

function scheduleEvolutionCheck(){
  clearTimeout(evolutionTimer);
  evolutionTimer=setTimeout(ensureBodyEvolution,40);
}

const navigationObserver=new MutationObserver(scheduleEvolutionCheck);
navigationObserver.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',event=>{
  if(event.target.closest('nav button,.bottom-nav button,.back-button,[data-tab]')){
    setTimeout(scheduleEvolutionCheck,0);
    setTimeout(scheduleEvolutionCheck,120);
  }
},true);

window.addEventListener('pageshow',()=>{scheduleWarmup();scheduleEvolutionCheck()});
window.addEventListener('focus',scheduleEvolutionCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleEvolutionCheck()});
window.addEventListener('load',scheduleWarmup,{once:true});

scheduleWarmup();
scheduleEvolutionCheck();
