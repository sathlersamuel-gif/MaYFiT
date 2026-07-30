const ADMIN_RETURN_KEY='mayfit_admin_return';
const USER_KEY='mayfit_user';

const translations=[
  [/barbell/gi,'barra'],[/dumbbell/gi,'halter'],[/cable/gi,'polia'],[/machine/gi,'máquina'],[/bodyweight/gi,'peso corporal'],
  [/bench press/gi,'supino'],[/incline/gi,'inclinado'],[/decline/gi,'declinado'],[/chest/gi,'peitoral'],[/fly/gi,'crucifixo'],
  [/shoulder press/gi,'desenvolvimento de ombros'],[/lateral raise/gi,'elevação lateral'],[/front raise/gi,'elevação frontal'],[/rear delt/gi,'deltoide posterior'],
  [/biceps curl/gi,'rosca para bíceps'],[/barbell curl/gi,'rosca direta com barra'],[/hammer curl/gi,'rosca martelo'],
  [/triceps extension/gi,'extensão de tríceps'],[/triceps pushdown/gi,'tríceps na polia'],[/pushdown/gi,'tríceps na polia'],
  [/lat pulldown/gi,'puxada frontal'],[/pulldown/gi,'puxada'],[/pull up/gi,'barra fixa'],[/chin up/gi,'barra fixa supinada'],[/row/gi,'remada'],
  [/deadlift/gi,'levantamento terra'],[/squat/gi,'agachamento'],[/leg press/gi,'leg press'],[/leg extension/gi,'cadeira extensora'],[/leg curl/gi,'mesa flexora'],
  [/hip thrust/gi,'elevação pélvica'],[/glute bridge/gi,'ponte de glúteos'],[/calf raise/gi,'elevação de panturrilha'],[/lunge/gi,'avanço'],
  [/crunch/gi,'abdominal'],[/sit up/gi,'abdominal completo'],[/plank/gi,'prancha'],[/push up/gi,'flexão de braços'],
  [/standing/gi,'em pé'],[/seated/gi,'sentado'],[/lying/gi,'deitado'],[/single arm/gi,'unilateral'],[/one arm/gi,'unilateral'],
  [/wide grip/gi,'pegada aberta'],[/close grip/gi,'pegada fechada'],[/reverse grip/gi,'pegada invertida'],[/medium grip/gi,'pegada média']
];

function readJson(key){
  try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}
}

function translateName(value){
  let text=String(value||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim();
  if(!text)return '';
  const original=text;
  for(const [pattern,replacement] of translations)text=text.replace(pattern,replacement);
  if(text.toLowerCase()===original.toLowerCase())return '';
  return text.charAt(0).toUpperCase()+text.slice(1);
}

function addTranslation(element){
  if(!element||element.dataset.mayfitTranslationReady==='true')return;
  const original=(element.childNodes.length===1?element.textContent:element.firstChild?.textContent||element.textContent||'').trim();
  const translated=translateName(original);
  if(!translated||translated.toLowerCase()===original.toLowerCase())return;
  const line=document.createElement('small');
  line.className='mayfit-portuguese-name';
  line.textContent=translated;
  element.appendChild(line);
  element.dataset.mayfitTranslationReady='true';
}

function applyTranslations(root=document){
  root.querySelectorAll?.('.exercise-col>strong,.exercise-modal-card h2,.exercise-card strong,.exercise-name').forEach(addTranslation);
  root.querySelectorAll?.('button,label,li,option').forEach(element=>{
    const text=(element.textContent||'').trim();
    if(text.length<3||text.length>90)return;
    if(!/(barbell|dumbbell|cable|machine|bench press|shoulder press|curl|pushdown|pulldown|row|deadlift|squat|leg press|leg extension|leg curl|hip thrust|calf raise|lunge|crunch|plank|push up|pull up)/i.test(text))return;
    addTranslation(element);
  });
}

function restoreAdmin(){
  const admin=readJson(ADMIN_RETURN_KEY);
  if(!admin?.id||admin.role!=='admin')return;
  sessionStorage.setItem(USER_KEY,JSON.stringify(admin));
  sessionStorage.removeItem(ADMIN_RETURN_KEY);
  sessionStorage.removeItem('mayfit_view_student');
  location.reload();
}

function ensureAdminReturn(){
  const admin=readJson(ADMIN_RETURN_KEY);
  const user=readJson(USER_KEY);
  let button=document.getElementById('mayfit-return-admin');
  if(!admin?.id||admin.role!=='admin'||user?.role!=='student'){
    button?.remove();
    return;
  }
  if(button)return;
  button=document.createElement('button');
  button.id='mayfit-return-admin';
  button.type='button';
  button.textContent='← Voltar ao administrador';
  button.onclick=restoreAdmin;
  document.body.appendChild(button);
}

const style=document.createElement('style');
style.textContent=`
.mayfit-portuguese-name{display:block!important;margin-top:3px!important;color:#9cab9f!important;font-size:.72em!important;font-weight:700!important;line-height:1.15!important;text-transform:none!important;letter-spacing:0!important}
#mayfit-return-admin{position:fixed;z-index:12000;left:12px;bottom:max(14px,env(safe-area-inset-bottom));padding:12px 15px;border:1px solid #78d532;border-radius:14px;background:#102016;color:#a7f36b;font:900 13px system-ui,-apple-system,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)}
`;
document.head.appendChild(style);

let scheduled=false;
const observer=new MutationObserver(()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyTranslations();ensureAdminReturn()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
applyTranslations();
ensureAdminReturn();
window.setInterval(ensureAdminReturn,1000);
