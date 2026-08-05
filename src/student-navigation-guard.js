const USER_KEY='mayfit_user';
let cachedEvolutionPanel=null;
let refreshTimer=null;

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

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

function captureEvolutionPanel(){
  const panel=document.getElementById('mayfit-body-evolution');
  if(panel)cachedEvolutionPanel=panel;
}

function restoreEvolutionPanel(){
  const account=currentUser();
  if(account?.role!=='student')return;

  captureEvolutionPanel();

  if(document.querySelector('.workout-screen'))return;
  if(document.getElementById('mayfit-body-evolution'))return;

  const main=document.querySelector('.app main');
  if(!main||!cachedEvolutionPanel)return;

  main.prepend(cachedEvolutionPanel);
}

function refreshStudentUi(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{
    labelBackButtons();
    captureEvolutionPanel();
    restoreEvolutionPanel();
  },80);
}

const observer=new MutationObserver(()=>requestAnimationFrame(refreshStudentUi));
observer.observe(document.documentElement,{childList:true,subtree:true});

window.addEventListener('pageshow',refreshStudentUi);
window.addEventListener('focus',refreshStudentUi);
window.addEventListener('mayfit-store-updated',refreshStudentUi);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshStudentUi()});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.matches('.back-button')||/voltar/i.test(button.textContent||'')){
    setTimeout(refreshStudentUi,80);
    setTimeout(refreshStudentUi,350);
  }
},true);

refreshStudentUi();
