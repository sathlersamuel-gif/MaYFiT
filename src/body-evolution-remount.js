let remounting=false;
let runId=0;

function isStudentHome(){
  try{
    const user=JSON.parse(sessionStorage.getItem('mayfit_user')||'null');
    return user?.role==='student'&&!!document.querySelector('.app main')&&!document.querySelector('.workout-screen');
  }catch{return false}
}

async function ensureBodyEvolution(){
  if(remounting||!isStudentHome()||document.getElementById('mayfit-body-evolution'))return;
  remounting=true;
  try{
    runId+=1;
    await import(`./body-evolution.js?remount=${runId}`);
  }catch(error){
    console.error('Falha ao restaurar evolução corporal',error);
  }finally{
    remounting=false;
  }
}

const observer=new MutationObserver(()=>requestAnimationFrame(ensureBodyEvolution));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(ensureBodyEvolution,0),true);
window.addEventListener('pageshow',ensureBodyEvolution);
window.addEventListener('focus',ensureBodyEvolution);
ensureBodyEvolution();
