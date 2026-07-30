import { supabase } from './lib/supabase.js';

const HISTORY_PREFIX='mayfit_workout_history_';
const TRAINING_NAME_PREFIX='mayfit_training_name_';

function currentUser(){try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'{}')}catch{return{}}}
function currentUserId(){return currentUser()?.id||'guest'}
function historyKey(userId=currentUserId()){return HISTORY_PREFIX+userId}
function trainingNameKey(userId=currentUserId()){return TRAINING_NAME_PREFIX+userId}
function readLocalHistory(userId=currentUserId()){try{return JSON.parse(localStorage.getItem(historyKey(userId))||'[]')}catch{return[]}}
function writeLocalHistory(items,userId=currentUserId()){localStorage.setItem(historyKey(userId),JSON.stringify(items))}
function savedTrainingName(){return localStorage.getItem(trainingNameKey())||currentUser()?.name||''}
function esc(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function formatDate(value){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}
function numberFrom(row,labelText,fallbackIndex){const labels=[...row.querySelectorAll('label')];const label=labels.find(item=>item.textContent.toLowerCase().includes(labelText));const input=label?.querySelector('input')||row.querySelectorAll('input')[fallbackIndex];return Number(input?.value)||0}
function normalizeCloudItem(item){const payload=item.workout_data||{};const exercises=Array.isArray(payload)?payload:(Array.isArray(payload.exercises)?payload.exercises:[]);return{id:item.id,date:item.created_at,name:item.workout_name||'Treino',exercises,cloud:true}}

async function authenticatedUserId(){
  if(!supabase)return null;
  const {data,error}=await supabase.auth.getUser();
  if(error||!data?.user)return null;
  return data.user.id;
}

async function readCloudHistory(userId){
  if(!supabase||!userId||userId==='guest')return null;
  const {data,error}=await supabase.from('workout_history').select('id,user_id,workout_name,workout_data,created_at,updated_at').eq('user_id',userId).order('created_at',{ascending:false});
  if(error){console.error('Falha ao carregar histórico:',error);return null}
  return (data||[]).map(normalizeCloudItem)
}

async function migrateLocalHistory(userId){
  if(!supabase||currentUser()?.role==='admin')return;
  const authId=await authenticatedUserId();
  if(!authId||authId!==userId)return;
  const local=readLocalHistory(userId).filter(item=>!item.cloud);
  if(!local.length)return;
  const rows=local.map(item=>({id:item.id,user_id:authId,workout_name:item.name||'Treino',workout_data:{exercises:Array.isArray(item.exercises)?item.exercises:[]},created_at:item.date||new Date().toISOString(),updated_at:item.date||new Date().toISOString()}));
  const {error}=await supabase.from('workout_history').upsert(rows,{onConflict:'id'});
  if(error){console.error('Falha ao migrar histórico local:',error);return}
  writeLocalHistory(local.map(item=>({...item,cloud:true})),userId)
}

async function getHistory(userId){
  await migrateLocalHistory(userId);
  const cloud=await readCloudHistory(userId);
  const local=readLocalHistory(userId);
  if(cloud===null)return local;
  if(!cloud.length&&local.length&&userId===currentUserId()&&currentUser()?.role!=='admin')return local;
  writeLocalHistory(cloud,userId);
  return cloud
}

async function captureWorkout(){
  const rows=[...document.querySelectorAll('.workout-screen .sheet-row')];
  if(!rows.length)return;
  const exercises=rows.map((row,index)=>({id:row.dataset.historyId||String(index+1),name:row.querySelector('.exercise-col>strong')?.textContent.trim()||`Exercício ${index+1}`,load:numberFrom(row,'atual',0),previousLoad:numberFrom(row,'anterior',1),sets:numberFrom(row,'séries',2),reps:numberFrom(row,'reps',3),rest:numberFrom(row,'tempo',4)}));
  const profileId=currentUserId();
  const authId=await authenticatedUserId();
  const userId=authId||profileId;
  const person=savedTrainingName().trim();
  const session={id:crypto.randomUUID(),date:new Date().toISOString(),name:person?`Treino de ${person}`:'Treino',exercises,cloud:false};
  const local=[session,...readLocalHistory(profileId).filter(item=>item.id!==session.id)];
  writeLocalHistory(local,profileId);
  if(!supabase||!authId){alert('O treino ficou salvo neste aparelho, mas sua sessão online expirou. Entre novamente para sincronizar.');return}
  const {data,error}=await supabase.from('workout_history').insert({id:session.id,user_id:authId,workout_name:session.name,workout_data:{exercises},created_at:session.date,updated_at:session.date}).select('id,created_at').single();
  if(error){console.error('Falha ao salvar histórico:',error);alert('O treino ficou salvo neste aparelho, mas não foi enviado ao administrador: '+error.message);return}
  session.id=data.id;session.date=data.created_at;session.cloud=true;
  writeLocalHistory([session,...local.filter(item=>item.id!==session.id)],profileId)
}

function styles(){
  if(document.getElementById('mayfit-history-style'))return;
  const style=document.createElement('style');style.id='mayfit-history-style';style.textContent=`
  .mayfit-history-overlay{position:fixed;inset:0;z-index:99999;background:#030806;color:#fff;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 14px max(28px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif}
  .mayfit-history-head{display:flex;align-items:center;gap:12px;position:sticky;top:0;background:#030806;padding:4px 0 16px;z-index:2}.mayfit-history-head button{width:46px;height:46px;border:1px solid #31543b;border-radius:15px;background:#0b1710;color:#fff;font-size:25px}.mayfit-history-head h1{font-size:25px;margin:0}.mayfit-history-head small{display:block;color:#8df20b;margin-top:2px;font-weight:800}
  .mayfit-history-empty{padding:35px 18px;border:1px solid #31543b;border-radius:20px;background:#0a1710;color:#a8b4ac;text-align:center}.mayfit-session{border:1px solid #31543b;border-radius:20px;background:#0a1710;margin:0 0 14px;overflow:hidden}.mayfit-session summary{list-style:none;padding:17px;cursor:pointer}.mayfit-session summary::-webkit-details-marker{display:none}
  .mayfit-session-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.mayfit-session-title strong{font-size:18px}.mayfit-session-title span{color:#8df20b;font-weight:800;font-size:13px}.mayfit-session-body{padding:0 12px 14px}.mayfit-history-exercise{border-top:1px solid #294332;padding:14px 2px}.mayfit-history-exercise h3{margin:0 0 10px;font-size:17px;color:#fff}
  .mayfit-history-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mayfit-history-grid label{font-size:11px;font-weight:800;color:#aebbb2;text-transform:uppercase}.mayfit-history-grid input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px 8px;border:1px solid #42634c;border-radius:11px;background:#050a07;color:#fff;font-size:18px;font-weight:850}.mayfit-evolution{margin-top:10px;color:#8df20b;font-weight:900}.mayfit-history-actions{display:flex;gap:9px;margin-top:13px}.mayfit-history-actions button{flex:1;padding:12px;border-radius:12px;font-weight:900;border:1px solid #477155}.mayfit-save-session{background:#76d625;color:#071006}.mayfit-delete-session{background:#24100f;color:#ff938d}
  .mayfit-training-name{display:block!important;width:100%!important;margin:12px 0 24px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.mayfit-training-name strong{display:block!important;margin:0 0 8px!important;color:#8df20b!important;font:900 15px/1.1 system-ui,-apple-system,sans-serif!important;letter-spacing:2px!important}.mayfit-training-name input{display:block!important;width:100%!important;box-sizing:border-box!important;margin:0!important;padding:0 0 9px!important;border:0!important;border-bottom:2px solid #65c92d!important;border-radius:0!important;background:transparent!important;color:#fff!important;font:900 clamp(30px,7vw,48px)/1.08 system-ui,-apple-system,sans-serif!important;outline:none!important}.summary article[data-mayfit-history-card="true"]{cursor:pointer;touch-action:manipulation}`;
  document.head.appendChild(style)
}

async function renderHistory(userId=currentUserId(),studentName=''){
  styles();document.querySelector('.mayfit-history-overlay')?.remove();
  const overlay=document.createElement('section');overlay.className='mayfit-history-overlay';overlay.innerHTML=`<div class="mayfit-history-head"><button type="button" data-close-history>‹</button><div><h1>Treinos salvos</h1>${studentName?`<small>${esc(studentName)}</small>`:''}</div></div><div data-history-list><div class="mayfit-history-empty">Carregando histórico...</div></div>`;document.body.appendChild(overlay);overlay.querySelector('[data-close-history]').onclick=()=>overlay.remove();
  const items=await getHistory(userId);const list=overlay.querySelector('[data-history-list]');list.innerHTML=items.length?'':'<div class="mayfit-history-empty">Nenhum treino salvo ainda.</div>';
  items.forEach((session,sessionIndex)=>{
    const details=document.createElement('details');details.className='mayfit-session';if(sessionIndex===0)details.open=true;details.innerHTML=`<summary><div class="mayfit-session-title"><strong>${esc(session.name||'Treino')}</strong><span>${esc(formatDate(session.date))}</span></div></summary><div class="mayfit-session-body"></div>`;const body=details.querySelector('.mayfit-session-body');
    session.exercises.forEach((exercise,exerciseIndex)=>{const evolution=(Number(exercise.load)||0)-(Number(exercise.previousLoad)||0);const box=document.createElement('div');box.className='mayfit-history-exercise';box.dataset.exerciseIndex=exerciseIndex;box.innerHTML=`<h3>${esc(exercise.name)}</h3><div class="mayfit-history-grid"><label>Carga atual<input type="number" data-field="load" value="${Number(exercise.load)||0}"></label><label>Carga anterior<input type="number" data-field="previousLoad" value="${Number(exercise.previousLoad)||0}"></label><label>Séries<input type="number" data-field="sets" value="${Number(exercise.sets)||0}"></label><label>Repetições<input type="number" data-field="reps" value="${Number(exercise.reps)||0}"></label><label>Tempo (s)<input type="number" data-field="rest" value="${Number(exercise.rest)||0}"></label></div><div class="mayfit-evolution">Evolução: ${evolution>=0?'+':''}${evolution} kg</div>`;box.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{const load=Number(box.querySelector('[data-field="load"]').value)||0;const previous=Number(box.querySelector('[data-field="previousLoad"]').value)||0;box.querySelector('.mayfit-evolution').textContent=`Evolução: ${load-previous>=0?'+':''}${load-previous} kg`}));body.appendChild(box)});
    const actions=document.createElement('div');actions.className='mayfit-history-actions';actions.innerHTML='<button type="button" class="mayfit-save-session">Salvar alterações</button><button type="button" class="mayfit-delete-session">Excluir treino</button>';
    actions.querySelector('.mayfit-save-session').onclick=async()=>{const all=await getHistory(userId);const target=all.find(item=>item.id===session.id);if(!target)return;body.querySelectorAll('.mayfit-history-exercise').forEach(box=>{const exercise=target.exercises[Number(box.dataset.exerciseIndex)];box.querySelectorAll('input').forEach(input=>exercise[input.dataset.field]=Number(input.value)||0)});writeLocalHistory(all,userId);if(supabase&&target.cloud){const {error}=await supabase.from('workout_history').update({workout_data:{exercises:target.exercises},updated_at:new Date().toISOString()}).eq('id',target.id);if(error)return alert('Não foi possível salvar: '+error.message)}alert('Alterações salvas no histórico.')};
    actions.querySelector('.mayfit-delete-session').onclick=async()=>{if(!confirm('Excluir este treino do histórico?'))return;const remaining=(await getHistory(userId)).filter(item=>item.id!==session.id);if(supabase&&session.cloud){const {error}=await supabase.from('workout_history').delete().eq('id',session.id);if(error)return alert('Não foi possível excluir: '+error.message)}writeLocalHistory(remaining,userId);renderHistory(userId,studentName)};body.appendChild(actions);list.appendChild(details)
  })
}

function savedCard(){return [...document.querySelectorAll('.summary article')].find(article=>[...article.querySelectorAll('span')].some(span=>/treinos salvos/i.test(span.textContent||'')))||null}
function personalizeHero(){const hero=document.querySelector('main .hero');if(!hero||hero.dataset.mayfitNamed==='true'||currentUser()?.role==='admin')return;const heading=hero.querySelector('h1');if(!heading)return;const wrapper=document.createElement('div');wrapper.className='mayfit-training-name';wrapper.innerHTML='<strong>TREINO DE:</strong><input type="text" maxlength="40" placeholder="Digite seu nome" aria-label="Nome da pessoa">';const input=wrapper.querySelector('input');input.value=savedTrainingName();input.addEventListener('input',()=>localStorage.setItem(trainingNameKey(),input.value));heading.replaceWith(wrapper);hero.dataset.mayfitNamed='true'}
function prepareSavedCard(){const card=savedCard();if(!card)return;card.dataset.mayfitHistoryCard='true';card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-label','Abrir treinos salvos')}
function install(){styles();window.mayfitOpenWorkoutHistory=(userId,name)=>renderHistory(userId,name);document.addEventListener('click',event=>{const finish=event.target.closest('button.finish');if(finish)captureWorkout();const card=event.target.closest('.summary article[data-mayfit-history-card="true"]');if(!card||card.closest('.mayfit-history-overlay'))return;event.preventDefault();event.stopPropagation();renderHistory()},true);document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const card=event.target.closest?.('.summary article[data-mayfit-history-card="true"]');if(!card)return;event.preventDefault();renderHistory()},true);const refresh=()=>{prepareSavedCard();personalizeHero()};const observer=new MutationObserver(refresh);observer.observe(document.documentElement,{childList:true,subtree:true});refresh()}
install();