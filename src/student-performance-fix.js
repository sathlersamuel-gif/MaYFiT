const CATALOG_KEY='mayfit_exercise_catalog_v1';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
let evolutionImporting=false;
let lastEvolutionAttempt=0;

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

function isStudentHome(){
  const user=currentUser();
  const main=document.querySelector('.app main');
  if(user?.role!=='student'||!main)return false;
  if(document.querySelector('.workout-screen'))return false;
  return Boolean(main.querySelector('.hero,.summary,#mayfit-student-exercises'));
}

async function restoreBodyEvolution(){
  if(!isStudentHome())return;
  if(document.getElementById('mayfit-body-evolution'))return;
  const now=Date.now();
  if(evolutionImporting||now-lastEvolutionAttempt<350)return;
  evolutionImporting=true;
  lastEvolutionAttempt=now;
  try{
    await import(`./body-evolution.js?student-remount=${now}`);
  }catch(error){
    console.error('MaYFiT: falha ao restaurar evolução corporal',error);
  }finally{
    evolutionImporting=false;
  }
}

function scheduleRestore(){
  requestAnimationFrame(()=>requestAnimationFrame(restoreBodyEvolution));
}

function scheduleWarmup(){
  if('requestIdleCallback'in window)requestIdleCallback(warmCatalog,{timeout:1200});
  else setTimeout(warmCatalog,250);
}

const observer=new MutationObserver(scheduleRestore);
observer.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',event=>{
  if(event.target.closest('button,a,[role="button"]')){
    setTimeout(scheduleRestore,0);
    setTimeout(scheduleRestore,120);
    setTimeout(scheduleRestore,350);
  }
},true);

window.addEventListener('load',()=>{scheduleWarmup();scheduleRestore()},{once:true});
window.addEventListener('pageshow',()=>{scheduleWarmup();scheduleRestore()});
window.addEventListener('focus',scheduleRestore);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleRestore()});

setInterval(()=>{if(isStudentHome()&&!document.getElementById('mayfit-body-evolution'))restoreBodyEvolution()},700);

scheduleWarmup();
scheduleRestore();
