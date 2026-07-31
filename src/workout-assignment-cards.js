import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const STORE='mayfit_v8';
const BASE='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let overlay=null;
let busy=false;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data))}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

const templates=[
 {id:'treino-a',name:'Treino A',subtitle:'Peito, ombros e tríceps',cover:'Barbell_Bench_Press_-_Medium_Grip/0.jpg',exercises:[
  {type:'supino',name:'Supino reto',sets:4,reps:12,load:60,previousLoad:56,rest:59,tip:'Pés firmes, escápulas encaixadas e barra descendo até a linha média do peito.'},
  {type:'Dumbbell_Shoulder_Press',name:'Desenvolvimento com halteres',sets:3,reps:12,load:20,previousLoad:18,rest:60,tip:'Mantenha o tronco firme e controle a descida.'},
  {type:'Side_Lateral_Raise',name:'Elevação lateral',sets:3,reps:12,load:8,previousLoad:7,rest:45,tip:'Eleve os braços sem ultrapassar a linha dos ombros.'},
  {type:'Triceps_Pushdown',name:'Tríceps na polia',sets:3,reps:12,load:25,previousLoad:22,rest:45,tip:'Mantenha os cotovelos junto ao corpo.'}
 ]},
 {id:'treino-b',name:'Treino B',subtitle:'Costas e bíceps',cover:'Wide-Grip_Lat_Pulldown/0.jpg',exercises:[
  {type:'Wide-Grip_Lat_Pulldown',name:'Puxada frontal',sets:4,reps:12,load:45,previousLoad:40,rest:60,tip:'Puxe até a parte superior do peito sem balançar o tronco.'},
  {type:'Seated_Cable_Rows',name:'Remada baixa',sets:4,reps:12,load:45,previousLoad:40,rest:60,tip:'Mantenha o peito aberto e aproxime as escápulas.'},
  {type:'Barbell_Curl',name:'Rosca direta',sets:3,reps:10,load:20,previousLoad:18,rest:45,tip:'Evite movimentar os ombros e controle a descida.'},
  {type:'Hammer_Curls',name:'Rosca martelo',sets:3,reps:12,load:10,previousLoad:9,rest:45,tip:'Mantenha os punhos neutros e os cotovelos fixos.'}
 ]},
 {id:'treino-c',name:'Treino C',subtitle:'Pernas e glúteos',cover:'Barbell_Squat/0.jpg',exercises:[
  {type:'agachamento',name:'Agachamento com barra',sets:4,reps:10,load:60,previousLoad:55,rest:90,tip:'Joelhos alinhados com os pés e coluna neutra.'},
  {type:'legpress',name:'Leg Press 90°',sets:4,reps:12,load:120,previousLoad:110,rest:90,tip:'Mantenha a lombar apoiada durante todo o movimento.'},
  {type:'flexora',name:'Cadeira flexora',sets:4,reps:10,load:45,previousLoad:40,rest:60,tip:'Faça o movimento controlado e sem tirar o quadril do banco.'},
  {type:'pelvica',name:'Elevação pélvica',sets:4,reps:12,load:80,previousLoad:75,rest:60,tip:'Contraia os glúteos no topo e mantenha o abdômen firme.'},
  {type:'panturrilha',name:'Panturrilha em pé',sets:4,reps:15,load:50,previousLoad:45,rest:45,tip:'Use amplitude completa e desça devagar.'}
 ]}
];

const css=`
#mwa-cards-overlay{position:fixed;inset:0;z-index:10000;background:#050706;color:#fff;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 14px max(90px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box}
.mwa-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}.mwa-close{width:46px;height:46px;border:1px solid #3c5b45;border-radius:15px;background:#0b1710;color:#fff;font-size:27px}.mwa-head h1{margin:0;font-size:25px}.mwa-target-wrap{margin-bottom:14px}.mwa-target-wrap label{display:block;margin-bottom:6px;color:#aab8af;font-size:12px;font-weight:850}.mwa-target-wrap select{width:100%;height:46px;border:1px solid #41634d;border-radius:13px;background:#0b1510;color:#fff;padding:0 12px;font-size:15px;font-weight:850}
.mwa-grid{display:grid;gap:14px}.mwa-card{display:grid;grid-template-columns:118px minmax(0,1fr);gap:13px;align-items:stretch;padding:0;border:1px solid #36513f;border-radius:20px;background:#0d1711;color:#fff;overflow:hidden;text-align:left}.mwa-card img{width:118px;height:100%;min-height:132px;object-fit:cover;background:#111}.mwa-card-body{padding:14px 12px 14px 0}.mwa-card h2{margin:0 0 4px;font-size:21px}.mwa-card p{margin:0 0 9px;color:#a8b5ad;font-size:13px}.mwa-card ul{margin:0;padding-left:18px;color:#dfe7e2;font-size:12px;line-height:1.45}.mwa-card strong{display:inline-block;margin-top:10px;color:#8df20b;font-size:13px}.mwa-status{min-height:22px;margin:14px 2px;color:#b9c5bd;font-size:13px}.mwa-open{border:0;border-radius:14px;background:#8df20b;color:#071108;font-weight:950;padding:12px 16px}
@media(max-width:430px){.mwa-card{grid-template-columns:104px minmax(0,1fr)}.mwa-card img{width:104px;min-height:145px}.mwa-card h2{font-size:19px}}
`;

async function activeStudents(){
 const {data,error}=await supabase.from('profiles').select('id,full_name,role,status').order('full_name');
 if(error)throw error;
 return (data||[]).filter(item=>item.role!=='admin'&&item.status==='active');
}

function normalizeExercises(list){return list.map((item,index)=>({...item,id:`template-${Date.now()}-${index}`}))}

async function assign(template,targetId,targetName,status){
 if(busy)return;busy=true;status.textContent=`Atribuindo ${template.name} para ${targetName}...`;
 try{
  const user=current();
  const exercises=normalizeExercises(template.exercises);
  const payload={user_id:targetId,plan_data:{name:template.name,exercises},updated_at:new Date().toISOString()};
  const {error}=await supabase.from('workout_plans').upsert(payload,{onConflict:'user_id'});
  if(error)throw error;
  if(targetId===user.id){const local=readStore()||{};local.exercises=exercises;writeStore(local);localStorage.setItem('mayfit_current_workout_name',template.name)}
  status.textContent=`${template.name} atribuído para ${targetName}.`;
  setTimeout(()=>{closeOverlay();location.reload()},700);
 }catch(error){status.textContent='Não foi possível atribuir: '+error.message}
 finally{busy=false}
}

async function openOverlay(){
 const user=current();if(!user||!supabase)return;
 if(!document.getElementById('mwa-cards-style')){const style=document.createElement('style');style.id='mwa-cards-style';style.textContent=css;document.head.appendChild(style)}
 overlay=document.createElement('section');overlay.id='mwa-cards-overlay';
 overlay.innerHTML='<div class="mwa-head"><button class="mwa-close" type="button">‹</button><div><h1>Escolher treino</h1><small style="color:#9baa9f">Selecione um treino pela foto</small></div></div><div class="mwa-target-wrap"></div><div class="mwa-grid"></div><div class="mwa-status"></div>';
 document.body.appendChild(overlay);overlay.querySelector('.mwa-close').onclick=closeOverlay;
 const targetWrap=overlay.querySelector('.mwa-target-wrap');
 let targets=[{id:user.id,name:user.role==='admin'?'Meu treino (Samuel)':'Meu treino'}];
 if(user.role==='admin'){
  try{const list=await activeStudents();targets=targets.concat(list.map(item=>({id:item.id,name:item.full_name||'Aluno'})))}catch(error){overlay.querySelector('.mwa-status').textContent='Não foi possível carregar os alunos: '+error.message}
 }
 targetWrap.innerHTML=`<label>ATRIBUIR PARA</label><select>${targets.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select>`;
 const grid=overlay.querySelector('.mwa-grid');
 grid.innerHTML=templates.map(template=>`<button class="mwa-card" type="button" data-template="${template.id}"><img src="${BASE+template.cover}" alt="${esc(template.name)}"><span class="mwa-card-body"><h2>${esc(template.name)}</h2><p>${esc(template.subtitle)} • ${template.exercises.length} exercícios</p><ul>${template.exercises.slice(0,4).map(item=>`<li>${esc(item.name)}</li>`).join('')}</ul><strong>Escolher este treino ›</strong></span></button>`).join('');
 grid.onclick=event=>{const card=event.target.closest('[data-template]');if(!card)return;const template=templates.find(item=>item.id===card.dataset.template);const select=targetWrap.querySelector('select');const option=select.options[select.selectedIndex];assign(template,select.value,option.textContent,overlay.querySelector('.mwa-status'))};
}

function closeOverlay(){overlay?.remove();overlay=null}

function installButtons(){
 const user=current();if(!user)return;
 document.querySelectorAll('.section-title .small').forEach(button=>{if(button.textContent.includes('Adicionar exercícios')&&!button.dataset.mwaCards){button.dataset.mwaCards='true';button.textContent='Escolher treino';button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openOverlay()},true)}});
 if(user.role!=='admin'){
  const hero=document.querySelector('.hero');
  if(hero&&!hero.querySelector('[data-mwa-student]')){const button=document.createElement('button');button.type='button';button.className='small';button.dataset.mwaStudent='true';button.textContent='Escolher outro treino';button.style.marginTop='10px';button.onclick=openOverlay;hero.appendChild(button)}
  const title=document.querySelector('.section-title');
  if(title&&!title.querySelector('[data-mwa-student]')){const button=document.createElement('button');button.type='button';button.className='small';button.dataset.mwaStudent='true';button.textContent='Escolher treino';button.onclick=openOverlay;title.appendChild(button)}
 }
}

const observer=new MutationObserver(installButtons);observer.observe(document.documentElement,{childList:true,subtree:true});installButtons();
