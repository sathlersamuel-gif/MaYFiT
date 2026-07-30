const VIEW_STUDENT_KEY='mayfit_view_student';

function selectedId(){
  try{return JSON.parse(sessionStorage.getItem(VIEW_STUDENT_KEY)||'null')?.id||''}catch{return ''}
}

function install(){
  document.querySelectorAll('#mayfit-students .ms-card').forEach(card=>{
    const id=card.dataset.id;
    const name=(card.querySelector('.ms-name')?.textContent||'Aluno').trim();
    if(!id)return;

    card.classList.toggle('mayfit-workout-selected',selectedId()===id);
    if(card.querySelector('[data-select-workout]'))return;

    const actions=card.querySelector('.ms-card-actions');
    if(!actions)return;

    const button=document.createElement('button');
    button.type='button';
    button.className='ms-primary';
    button.dataset.selectWorkout='true';
    button.textContent='Atribuir treino';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      sessionStorage.setItem(VIEW_STUDENT_KEY,JSON.stringify({id,name}));
      sessionStorage.setItem('mayfit_selected_student_notice',name);
      location.reload();
    });
    actions.prepend(button);
  });
}

const style=document.createElement('style');
style.textContent=`
#mayfit-students .ms-card.mayfit-workout-selected{border-color:#8df20b!important;box-shadow:0 0 0 1px #8df20b,inset 0 0 20px rgba(141,242,11,.08)}
#mayfit-students .ms-card.mayfit-workout-selected .ms-name::after{content:' • treino selecionado';color:#8df20b;font-size:11px}
`;
document.head.appendChild(style);

const observer=new MutationObserver(install);
observer.observe(document.documentElement,{childList:true,subtree:true});
install();

const notice=sessionStorage.getItem('mayfit_selected_student_notice');
if(notice){
  sessionStorage.removeItem('mayfit_selected_student_notice');
  setTimeout(()=>alert(`Aluno selecionado: ${notice}. Agora os exercícios atribuídos serão salvos para este aluno em todos os aparelhos.`),500);
}
