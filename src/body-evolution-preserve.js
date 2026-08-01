const PARKING_ID='mayfit-body-evolution-parking';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}
}

function parking(){
  let box=document.getElementById(PARKING_ID);
  if(!box){
    box=document.createElement('div');
    box.id=PARKING_ID;
    box.hidden=true;
    document.body.appendChild(box);
  }
  return box;
}

function isStudentHome(){
  const user=currentUser();
  if(user?.role!=='student')return false;
  if(document.querySelector('.workout-screen'))return false;
  const active=[...document.querySelectorAll('.app nav button.active')].find(button=>/início/i.test(button.textContent||''));
  return !!active&&!!document.querySelector('.app main .hero');
}

function parkEvolution(){
  const root=document.getElementById('mayfit-body-evolution');
  if(root&&root.parentElement?.id!==PARKING_ID)parking().appendChild(root);
}

function restoreEvolution(){
  const root=document.getElementById('mayfit-body-evolution');
  const main=document.querySelector('.app main');
  if(!root||!main||!isStudentHome())return false;
  if(root.parentElement!==main)main.prepend(root);
  root.hidden=false;
  return true;
}

function sync(){
  if(isStudentHome()){
    if(!restoreEvolution())window.dispatchEvent(new CustomEvent('mayfit:body-evolution-needed'));
  }else{
    const root=document.getElementById('mayfit-body-evolution');
    if(root){root.hidden=true;parkEvolution()}
  }
}

// O React substitui o conteúdo de <main>. Retiramos o bloco antes do clique
// e o recolocamos depois, evitando que ele seja destruído na navegação.
document.addEventListener('pointerdown',event=>{
  if(event.target.closest('.app nav button,.workout-screen .back-button'))parkEvolution();
},true);
document.addEventListener('click',event=>{
  if(event.target.closest('.app nav button,.workout-screen .back-button')){
    parkEvolution();
    requestAnimationFrame(()=>requestAnimationFrame(sync));
  }
},true);

const observer=new MutationObserver(()=>requestAnimationFrame(sync));
observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',sync);
window.addEventListener('focus',sync);
sync();
