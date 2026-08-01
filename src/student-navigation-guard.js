const USER_KEY='mayfit_user';
let remountingEvolution=false;
let evolutionRemountVersion=0;
let evolutionTimer=null;

function currentUser(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}}

function labelBackButtons(){
  if(currentUser()?.role!=='student')return;
  const selectors=['.be-modal .be-close','.mayfit-history-overlay [data-close-history]','#mse-modal .mse-back'];
  document.querySelectorAll(selectors.join(',')).forEach(button=>{
    if(button.dataset.mayfitBackReady)return;
    button.dataset.mayfitBackReady='1';
    button.textContent='← Voltar';
    button.setAttribute('aria-label','Voltar');
    button.style.width='auto';
    button.style.minWidth='92px';
    button.style.padding='0 12px';
    button.style.fontSize='15px';
    button.style.fontWeight='900';
  });
}

function scheduleEvolutionRemount(){
  clearTimeout(evolutionTimer);
  evolutionTimer=setTimeout(ensureEvolutionPanel,180);
}

async function ensureEvolutionPanel(){
  const user=currentUser();
  if(user?.role!=='student')return;
  if(document.querySelector('.workout-screen'))return;
  const main=document.querySelector('.app main');
  if(!main||document.getElementById('mayfit-body-evolution')||remountingEvolution)return;

  remountingEvolution=true;
  try{
    evolutionRemountVersion+=1;
    await import(`./body-evolution.js?student-remount=${evolutionRemountVersion}`);
  }catch(error){
    console.error('Não foi possível restaurar o painel Minha evolução.',error);
  }finally{
    remountingEvolution=false;
  }
}

function refreshStudentUi(){
  labelBackButtons();
  scheduleEvolutionRemount();
}

const observer=new MutationObserver(()=>requestAnimationFrame(refreshStudentUi));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',refreshStudentUi);
window.addEventListener('focus',refreshStudentUi);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshStudentUi()});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.matches('.back-button')||/voltar/i.test(button.textContent||''))setTimeout(refreshStudentUi,120);
},true);
refreshStudentUi();
