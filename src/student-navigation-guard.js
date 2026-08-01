const USER_KEY='mayfit_user';

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

const observer=new MutationObserver(()=>requestAnimationFrame(labelBackButtons));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',labelBackButtons);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)labelBackButtons()});
labelBackButtons();
