const FLAG='mayfit_returning_from_workout';

function isStudent(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')?.role==='student'}catch{return false}
}

function install(){
  if(!isStudent())return;
  document.querySelectorAll('.workout-screen .back-button').forEach(button=>{
    if(button.dataset.mayfitReturnRefresh==='1')return;
    button.dataset.mayfitReturnRefresh='1';
    button.addEventListener('click',()=>{
      sessionStorage.setItem(FLAG,'1');
      window.setTimeout(()=>window.location.reload(),80);
    },{capture:true,once:true});
  });
}

if(sessionStorage.getItem(FLAG)==='1'){
  sessionStorage.removeItem(FLAG);
}

const observer=new MutationObserver(()=>requestAnimationFrame(install));
observer.observe(document.documentElement,{childList:true,subtree:true});
install();
