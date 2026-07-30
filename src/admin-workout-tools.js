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
 if(!data.exercises.length){alert('Este aluno já está sem treinos atribuídos.');return}
 if(!confirm(`Remover todos os ${data.exercises.length} exercícios atribuídos a ${student.name||'este aluno'}?`))return;
 localStorage.setItem(STORE_KEY,JSON.stringify({...data,exercises:[]}));
 alert('Todos os treinos atribuídos a este aluno foram removidos.');
 setTimeout(()=>location.reload(),700);
}

function findWorkoutHeader(){
 const headings=[...document.querySelectorAll('h1,h2,h3,.section-title,strong')];
 const heading=headings.find(node=>/gerenciar\s+treino|treino\s+do\s+aluno|atribuir\s+treino/i.test(node.textContent||''));
 return heading?.closest('.section-title,.panel-header,.card-header,section,div')||null;
}

function mount(){
 if(!isAdmin()||document.getElementById('mayfit-delete-all-exercises'))return;
 if(!selectedStudent()?.id)return;
 const container=findWorkoutHeader();
 if(!container)return;
 const button=document.createElement('button');
 button.id='mayfit-delete-all-exercises';
 button.type='button';
 button.className='small';
 button.textContent='Remover todos os treinos';
 button.style.cssText='margin-left:auto;background:#3a1b1b;color:#ffb6b6;border:1px solid #6c3030;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer';
 button.onclick=clearAllAssignedExercises;
 container.appendChild(button);
}

const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',mount);
setInterval(mount,1000);
setTimeout(mount,300);