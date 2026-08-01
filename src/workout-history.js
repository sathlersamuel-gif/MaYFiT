import './admin-exercise-thumbnails.js';

const HISTORY_PREFIX='mayfit_workout_history_';

function currentUserId(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'{}')?.id||'guest'}catch{return'guest'}
}
function historyKey(){return HISTORY_PREFIX+currentUserId()}
function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey())||'[]')}catch{return[]}}
function writeHistory(items){localStorage.setItem(historyKey(),JSON.stringify(items))}
function numberFrom(row,labelText,fallbackIndex){
  const labels=[...row.querySelectorAll('label')];
  const label=labels.find(item=>item.textContent.toLowerCase().includes(labelText));
  const input=label?.querySelector('input')||row.querySelectorAll('input')[fallbackIndex];
  return Number(input?.value)||0;
}
function captureWorkout(){
  const rows=[...document.querySelectorAll('.workout-screen .sheet-row')];
  if(!rows.length)return;
  const exercises=rows.map((row,index)=>({
    id:row.dataset.historyId||String(index+1),
    name:row.querySelector('.exercise-col>strong')?.textContent.trim()||`Exercício ${index+1}`,
    load:numberFrom(row,'atual',0),
    previousLoad:numberFrom(row,'anterior',1),
    sets:numberFrom(row,'séries',2),
    reps:numberFrom(row,'reps',3),
    rest:numberFrom(row,'tempo',4)
  }));
  const items=readHistory();
  items.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),name:'Treino',exercises});
  writeHistory(items);
}
function esc(value){return String(value??'').replace(/[&<>'\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','\"':'&quot;'}[char]))}
function formatDate(value){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}
function styles(){
  if(document.getElementById('mayfit-history-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-history-style';
  style.textContent=`
  .mayfit-history-overlay{position:fixed;inset:0;z-index:99999;background:#030806;color:#fff;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 14px max(28px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif}
  .mayfit-history-head{display:flex;align-items:center;gap:12px;position:sticky;top:0;background:#030806;padding:4px 0 16px;z-index:2}
  .mayfit-history-head button{width:46px;height:46px;border:1px solid #31543b;border-radius:15px;background:#0b1710;color:#fff;font-size:25px}.mayfit-history-head h1{font-size:25px;margin:0}
  .mayfit-history-empty{padding:35px 18px;border:1px solid #31543b;border-radius:20px;background:#0a1710;color:#a8b4ac;text-align:center}
  .mayfit-session{border:1px solid #31543b;border-radius:20px;background:#0a1710;margin:0 0 14px;overflow:hidden}.mayfit-session summary{list-style:none;padding:17px;cursor:pointer}.mayfit-session summary::-webkit-details-marker{display:none}
  .mayfit-session-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.mayfit-session-title strong{font-size:18px}.mayfit-session-title span{color:#8df20b;font-weight:800;font-size:13px}
  .mayfit-session-body{padding:0 12px 14px}.mayfit-history-exercise{border-top:1px solid #294332;padding:14px 2px}.mayfit-history-exercise h3{margin:0 0 10px;font-size:17px;color:#fff}
  .mayfit-history-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mayfit-history-grid label{font-size:11px;font-weight:800;color:#aebbb2;text-transform:uppercase}.mayfit-history-grid input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px 8px;border:1px solid #42634c;border-radius:11px;background:#050a07;color:#fff;font-size:18px;font-weight:850}
  .mayfit-evolution{margin-top:10px;color:#8df20b;font-weight:900}.mayfit-history-actions{display:flex;gap:9px;margin-top:13px}.mayfit-history-actions button{flex:1;padding:12px;border-radius:12px;font-weight:900;border:1px solid #477155}.mayfit-save-session{background:#76d625;color:#071006}.mayfit-delete-session{background:#24100f;color:#ff938d}
  `;
  document.head.appendChild(style);
}
function renderHistory(){
  styles();
  document.querySelector('.mayfit-history-overlay')?.remove();
  const items=readHistory();
  const overlay=document.createElement('section');
  overlay.className='mayfit-history-overlay';
  overlay.innerHTML=`<div class="mayfit-history-head"><button type="button" data-close-history>‹</button><h1>Evolução de cargas</h1></div><div data-history-list>${items.length?'':'<div class="mayfit-history-empty">Nenhum treino salvo ainda.</div>'}</div>`;
  const list=overlay.querySelector('[data-history-list]');
  items.forEach((session,sessionIndex)=>{
    const details=document.createElement('details');
    details.className='mayfit-session';
    if(sessionIndex===0)details.open=true;
    details.innerHTML=`<summary><div class="mayfit-session-title"><strong>${esc(session.name||'Treino')}</strong><span>${esc(formatDate(session.date))}</span></div></summary><div class="mayfit-session-body"></div>`;
    const body=details.querySelector('.mayfit-session-body');
    session.exercises.forEach((exercise,exerciseIndex)=>{
      const evolution=(Number(exercise.load)||0)-(Number(exercise.previousLoad)||0);
      const box=document.createElement('div');box.className='mayfit-history-exercise';box.dataset.exerciseIndex=exerciseIndex;
      box.innerHTML=`<h3>${esc(exercise.name)}</h3><div class="mayfit-history-grid"><label>Carga atual<input type="number" data-field="load" value="${Number(exercise.load)||0}"></label><label>Carga anterior<input type="number" data-field="previousLoad" value="${Number(exercise.previousLoad)||0}"></label><label>Séries<input type="number" data-field="sets" value="${Number(exercise.sets)||0}"></label><label>Repetições<input type="number" data-field="reps" value="${Number(exercise.reps)||0}"></label><label>Tempo (s)<input type="number" data-field="rest" value="${Number(exercise.rest)||0}"></label></div><div class="mayfit-evolution">Evolução: ${evolution>=0?'+':''}${evolution} kg</div>`;
      box.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{const load=Number(box.querySelector('[data-field="load"]').value)||0;const previous=Number(box.querySelector('[data-field="previousLoad"]').value)||0;box.querySelector('.mayfit-evolution').textContent=`Evolução: ${load-previous>=0?'+':''}${load-previous} kg`}));
      body.appendChild(box);
    });
    const actions=document.createElement('div');actions.className='mayfit-history-actions';actions.innerHTML='<button type="button" class="mayfit-save-session">Salvar alterações</button><button type="button" class="mayfit-delete-session">Excluir treino</button>';
    actions.querySelector('.mayfit-save-session').onclick=()=>{const all=readHistory();const target=all.find(item=>item.id===session.id);if(!target)return;body.querySelectorAll('.mayfit-history-exercise').forEach(box=>{const exercise=target.exercises[Number(box.dataset.exerciseIndex)];box.querySelectorAll('input').forEach(input=>exercise[input.dataset.field]=Number(input.value)||0)});writeHistory(all);alert('Alterações salvas no histórico.')};
    actions.querySelector('.mayfit-delete-session').onclick=()=>{if(!confirm('Excluir este treino do histórico?'))return;writeHistory(readHistory().filter(item=>item.id!==session.id));renderHistory()};
    body.appendChild(actions);list.appendChild(details);
  });
  overlay.querySelector('[data-close-history]').onclick=()=>overlay.remove();
  document.body.appendChild(overlay);
}
function findEvolutionCard(){
  return [...document.querySelectorAll('.app main .summary article')].find(card=>/evolução de cargas/i.test(card.textContent||''))||null;
}
function bindEvolutionCard(){
  const card=findEvolutionCard();
  if(!card||card.dataset.historyBound==='1')return;
  card.dataset.historyBound='1';
  card.style.cursor='pointer';
  card.setAttribute('role','button');
  card.setAttribute('tabindex','0');
  card.setAttribute('aria-label','Abrir evolução de cargas');
  const open=event=>{event.preventDefault();event.stopPropagation();renderHistory()};
  card.addEventListener('click',open);
  card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){open(event)}});
}
function install(){
  document.addEventListener('click',event=>{
    const finish=event.target.closest('button.finish');
    if(finish)captureWorkout();
  },true);
  const observer=new MutationObserver(()=>requestAnimationFrame(bindEvolutionCard));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bindEvolutionCard();
}
install();
