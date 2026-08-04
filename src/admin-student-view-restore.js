const USER_KEY='mayfit_user';
const ADMIN_RETURN_KEY='mayfit_admin_return';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function installStyle(){
  if(document.getElementById('mayfit-admin-view-student-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-admin-view-student-style';
  style.textContent=`
    #mayfit-students .ms-view{background:#78d532!important;color:#07110c!important;border:0!important}
  `;
  document.head.appendChild(style);
}

function addViewButtons(){
  if(currentUser()?.role!=='admin')return;
  installStyle();
  document.querySelectorAll('#mayfit-students .ms-card').forEach(card=>{
    const actions=card.querySelector('.ms-card-actions');
    if(!actions||actions.querySelector('[data-action="view"]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='ms-view';
    button.dataset.action='view';
    button.textContent='Ver aluno';
    actions.prepend(button);
  });
}

function openStudent(card){
  const admin=currentUser();
  if(admin?.role!=='admin'||!card)return;
  const id=card.dataset.id;
  const name=card.querySelector('.ms-name')?.textContent?.trim()||'Aluno';
  if(!id)return;
  sessionStorage.setItem(ADMIN_RETURN_KEY,JSON.stringify(admin));
  sessionStorage.setItem(USER_KEY,JSON.stringify({id,name,role:'student',viewedByAdmin:true}));
  location.reload();
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#mayfit-students [data-action="view"]');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openStudent(button.closest('.ms-card'));
},true);

const observer=new MutationObserver(()=>requestAnimationFrame(addViewButtons));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',addViewButtons);
addViewButtons();
