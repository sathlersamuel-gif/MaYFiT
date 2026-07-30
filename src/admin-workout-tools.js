const STORE_KEY='mayfit_v8';
const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';

function readJson(storage,key){try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}}
function selectedStudent(){return readJson(sessionStorage,VIEW_STUDENT_KEY)}
function isAdmin(){return readJson(sessionStorage,USER_KEY)?.role==='admin'}

function clearAllAssignedExercises(){
 const student=selectedStudent();
 if(!student?.id){alert('Selecione primeiro um aluno em Configurações > Alunos > Atribuir treino.');return}
 const data=readJson(localStorage,STORE_KEY);
 if(!data||!Array.isArray(data.exercises)){alert('Não foi possível localizar o treino deste aluno.');return}
 if(!data.exercises.length){alert('Este aluno já está sem exercícios atribuídos.');return}
 if(!confirm(`Excluir todos os ${data.exercises.length} exercícios atribuídos a ${student.name||'este aluno'}?`))return;
 localStorage.setItem(STORE_KEY,JSON.stringify({...data,exercises:[]}));
 alert('Todos os exercícios deste aluno foram excluídos.');
 setTimeout(()=>location.reload(),900);
}

function mount(){
 if(!isAdmin()||document.getElementById('mayfit-delete-all-exercises'))return;
 const title=[...document.querySelectorAll('.section-title h1')].find(node=>node.textContent?.trim()==='Gerenciar treino');
 const container=title?.closest('.section-title');
 if(!container||!selectedStudent()?.id)return;
 const button=document.createElement('button');
 button.id='mayfit-delete-all-exercises';
 button.type='button';
 button.className='small';
 button.textContent='Excluir todos';
 button.style.background='#3a1b1b';
 button.style.color='#ffb6b6';
 button.style.border='1px solid #6c3030';
 button.onclick=clearAllAssignedExercises;
 container.appendChild(button);
}

const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',mount);
setTimeout(mount,500);