const VIEW_STUDENT_KEY='mayfit_view_student';

function readJson(key){
  try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}
}

function isEmptyHistoryOverlay(){
  const overlay=document.querySelector('.mayfit-history-overlay');
  if(!overlay)return false;
  const empty=overlay.querySelector('.mayfit-history-empty');
  return !!empty&&/nenhum treino salvo|carregando histórico/i.test(empty.textContent||'');
}

function retryAdminHistory(){
  const viewed=readJson(VIEW_STUDENT_KEY);
  if(!viewed?.id||typeof window.mayfitOpenWorkoutHistory!=='function')return;
  if(!isEmptyHistoryOverlay())return;
  window.mayfitOpenWorkoutHistory(viewed.id,viewed.name||'Aluno');
}

document.addEventListener('click',event=>{
  const card=event.target.closest?.('.summary article');
  if(!card)return;
  const isHistory=[...card.querySelectorAll('span')].some(span=>/treinos salvos/i.test(span.textContent||''));
  if(!isHistory)return;
  setTimeout(retryAdminHistory,700);
  setTimeout(retryAdminHistory,1600);
},true);
