const CATALOG_KEY='mayfit_exercise_catalog_v1';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
let cachedEvolutionPanel=null;
let restoreScheduled=false;

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
  const account=currentUser();
  const main=document.querySelector('.app main');
  if(account?.role!=='student'||!main||document.querySelector('.workout-screen'))return false;
  return Boolean(main.querySelector('.hero,.summary,#mayfit-student-exercises'));
}

function findEvolutionPanel(node){
  if(!(node instanceof Element))return null;
  if(node.id==='mayfit-body-evolution')return node;
  return node.querySelector?.('#mayfit-body-evolution')||null;
}

function captureExistingPanel(){
  const panel=document.getElementById('mayfit-body-evolution');
  if(panel)cachedEvolutionPanel=panel;
}

function restoreStudentHome(){
  restoreScheduled=false;
  if(!isStudentHome())return;
  const main=document.querySelector('.app main');
  if(!main)return;

  const existing=document.getElementById('mayfit-body-evolution');
  if(existing){cachedEvolutionPanel=existing;return}

  if(cachedEvolutionPanel){
    main.prepend(cachedEvolutionPanel);
    return;
  }

  window.dispatchEvent(new CustomEvent('mayfit:student-home-ready'));
}

function scheduleRestore(){
  if(restoreScheduled)return;
  restoreScheduled=true;
  requestAnimationFrame(()=>requestAnimationFrame(restoreStudentHome));
}

function scheduleWarmup(){
  if('requestIdleCallback'in window)requestIdleCallback(warmCatalog,{timeout:1200});
  else setTimeout(warmCatalog,250);
}

const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    for(const node of mutation.removedNodes){
      const panel=findEvolutionPanel(node);
      if(panel)cachedEvolutionPanel=panel;
    }
    for(const node of mutation.addedNodes){
      const panel=findEvolutionPanel(node);
      if(panel)cachedEvolutionPanel=panel;
    }
  }
  scheduleRestore();
});
observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',event=>{
  if(event.target.closest('button,a,[role="button"]')){
    setTimeout(scheduleRestore,0);
    setTimeout(scheduleRestore,120);
  }
},true);

window.addEventListener('load',()=>{captureExistingPanel();scheduleWarmup();scheduleRestore()},{once:true});
window.addEventListener('pageshow',()=>{captureExistingPanel();scheduleWarmup();scheduleRestore()});
window.addEventListener('focus',scheduleRestore);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleRestore()});

captureExistingPanel();
scheduleWarmup();
scheduleRestore();
