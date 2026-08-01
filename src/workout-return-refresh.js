let remounting=false;
let remountVersion=0;

function isStudent(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')?.role==='student'}catch{return false}
}

function shouldRestoreEvolution(){
  return isStudent()&&
    !document.querySelector('.workout-screen')&&
    Boolean(document.querySelector('.app main'))&&
    !document.getElementById('mayfit-body-evolution');
}

async function restoreEvolution(){
  if(remounting||!shouldRestoreEvolution())return;
  remounting=true;
  try{
    remountVersion+=1;
    await import(`./body-evolution.js?remount=${Date.now()}-${remountVersion}`);
  }catch(error){
    console.error('Não foi possível restaurar a evolução corporal.',error);
  }finally{
    window.setTimeout(()=>{remounting=false},120);
  }
}

let scheduled=false;
function scheduleRestore(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    restoreEvolution();
  });
}

const observer=new MutationObserver(scheduleRestore);
observer.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  const text=(button.textContent||'').trim().toLowerCase();
  if(text==='início'||text==='inicio'||text==='treinos'){
    window.setTimeout(scheduleRestore,0);
    window.setTimeout(scheduleRestore,80);
  }
},true);

window.addEventListener('pageshow',scheduleRestore);
window.addEventListener('focus',scheduleRestore);
scheduleRestore();
