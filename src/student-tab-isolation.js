const USER_KEY='mayfit_user';
let scheduled=false;

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function activeTab(){
  const nav=document.querySelector('.app>nav');
  if(!nav)return null;
  const active=nav.querySelector('button.active');
  const text=(active?.textContent||'').trim().toLowerCase();
  if(text.includes('perfil'))return'perfil';
  if(text.includes('treino'))return'treinos';
  if(text.includes('início')||text.includes('inicio'))return'inicio';

  const main=document.querySelector('.app main');
  if(main?.querySelector('.profile'))return'perfil';
  if(main?.querySelector('.preview-list'))return'treinos';
  if(main?.querySelector('.hero,.summary'))return'inicio';
  return null;
}

function applyTabIsolation(){
  scheduled=false;
  if(currentUser()?.role!=='student'){
    document.body.classList.remove('mayfit-tab-inicio','mayfit-tab-treinos','mayfit-tab-perfil');
    return;
  }

  const tab=activeTab();
  document.body.classList.toggle('mayfit-tab-inicio',tab==='inicio');
  document.body.classList.toggle('mayfit-tab-treinos',tab==='treinos');
  document.body.classList.toggle('mayfit-tab-perfil',tab==='perfil');

  const main=document.querySelector('.app main');
  if(!main)return;

  const extras=[
    document.getElementById('mayfit-body-evolution'),
    document.getElementById('mayfit-student-exercises')
  ].filter(Boolean);

  for(const element of extras){
    element.hidden=tab!=='inicio';
    element.setAttribute('aria-hidden',tab==='inicio'?'false':'true');
  }

  if(tab==='perfil'){
    [...main.children].forEach(child=>{
      if(child.matches('.profile')){child.hidden=false;return}
      if(child.id==='mayfit-body-evolution'||child.id==='mayfit-student-exercises')child.hidden=true;
    });
  }

  if(tab==='treinos'){
    [...main.children].forEach(child=>{
      if(child.matches('.section-title,.preview-list')){child.hidden=false;return}
      if(child.id==='mayfit-body-evolution'||child.id==='mayfit-student-exercises')child.hidden=true;
    });
  }
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>requestAnimationFrame(applyTabIsolation));
}

const style=document.createElement('style');
style.id='mayfit-student-tab-isolation-style';
style.textContent=`
body.mayfit-tab-treinos #mayfit-body-evolution,
body.mayfit-tab-treinos #mayfit-student-exercises,
body.mayfit-tab-perfil #mayfit-body-evolution,
body.mayfit-tab-perfil #mayfit-student-exercises{display:none!important}
`;
document.head.appendChild(style);

const observer=new MutationObserver(schedule);
observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',event=>{if(event.target.closest('.app>nav button')){schedule();setTimeout(schedule,60)}},true);
window.addEventListener('pageshow',schedule);
window.addEventListener('focus',schedule);
schedule();
