const STORE_KEY='mayfit_v8';
const USER_KEY='mayfit_user';

function readJson(storage,key){try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}}
function currentUser(){return readJson(sessionStorage,USER_KEY)}

function clearAllExercises(){
 const user=currentUser();
 if(!user?.id){alert('Entre na sua conta primeiro.');return}
 const data=readJson(localStorage,STORE_KEY);
 if(!data||!Array.isArray(data.exercises)){alert('Não foi possível localizar seus exercícios.');return}
 if(!data.exercises.length){alert('Você já está sem exercícios cadastrados.');return}
 if(!confirm(`Remover todos os ${data.exercises.length} exercícios do seu treino?`))return;
 localStorage.setItem(STORE_KEY,JSON.stringify({...data,exercises:[]}));
 alert('Todos os exercícios foram removidos do seu treino.');
 setTimeout(()=>location.reload(),500);
}

function findWorkoutHeader(){
 const headings=[...document.querySelectorAll('h1,h2,h3')];
 const heading=headings.find(node=>/gerenciar\s+treino|meu\s+treino/i.test(node.textContent||''));
 return heading?.closest('.section-title,.panel-header,.card-header,section,div')||null;
}

function mount(){
 if(!currentUser()?.id||document.getElementById('mayfit-delete-all-exercises'))return;
 const container=findWorkoutHeader();
 if(!container)return;
 const button=document.createElement('button');
 button.id='mayfit-delete-all-exercises';
 button.type='button';
 button.className='small';
 button.textContent='Remover todos';
 button.style.cssText='margin-left:auto;background:#3a1b1b;color:#ffb6b6;border:1px solid #6c3030;border-radius:12px;padding:10px 13px;font-weight:900;cursor:pointer';
 button.onclick=clearAllExercises;
 container.appendChild(button);
}

const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',mount);
setInterval(mount,800);
setTimeout(mount,250);
