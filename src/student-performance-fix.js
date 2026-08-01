const CATALOG_KEY='mayfit_exercise_catalog_v1';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

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

window.addEventListener('load',scheduleWarmup,{once:true});
window.addEventListener('pageshow',scheduleWarmup);
scheduleWarmup();
