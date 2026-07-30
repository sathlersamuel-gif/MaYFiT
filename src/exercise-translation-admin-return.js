const ADMIN_RETURN_KEY='mayfit_admin_return';
const USER_KEY='mayfit_user';

const exactTranslations={
  'barbell bench press medium grip':'Supino reto com barra',
  'barbell bench press':'Supino reto com barra',
  'dumbbell bench press':'Supino reto com halteres',
  'incline barbell bench press':'Supino inclinado com barra',
  'incline dumbbell press':'Supino inclinado com halteres',
  'decline barbell bench press':'Supino declinado com barra',
  'pushups':'Flexão de braços',
  'push up':'Flexão de braços',
  'pullups':'Barra fixa pronada',
  'pull up':'Barra fixa pronada',
  'chin up':'Barra fixa supinada',
  'wide grip lat pulldown':'Puxada frontal com pegada aberta',
  'close grip front lat pulldown':'Puxada frontal com pegada fechada',
  'seated cable rows':'Remada baixa na polia',
  'bent over barbell row':'Remada curvada com barra',
  'one arm dumbbell row':'Remada unilateral com halter',
  'barbell deadlift':'Levantamento terra com barra',
  'romanian deadlift':'Levantamento terra romeno',
  'stiff legged barbell deadlift':'Levantamento terra com pernas estendidas',
  'barbell squat':'Agachamento com barra',
  'front barbell squat':'Agachamento frontal com barra',
  'leg press':'Leg press',
  'leg extensions':'Cadeira extensora',
  'lying leg curls':'Mesa flexora',
  'seated leg curl':'Cadeira flexora',
  'barbell hip thrust':'Elevação pélvica com barra',
  'glute bridge':'Ponte de glúteos',
  'standing calf raises':'Panturrilha em pé',
  'seated calf raise':'Panturrilha sentado',
  'walking lunge':'Avanço caminhando',
  'dumbbell lunges':'Avanço com halteres',
  'dumbbell shoulder press':'Desenvolvimento de ombros com halteres',
  'barbell shoulder press':'Desenvolvimento de ombros com barra',
  'side lateral raise':'Elevação lateral',
  'front dumbbell raise':'Elevação frontal com halteres',
  'reverse flyes':'Crucifixo inverso',
  'barbell curl':'Rosca direta com barra',
  'dumbbell bicep curl':'Rosca direta com halteres',
  'hammer curls':'Rosca martelo',
  'preacher curl':'Rosca Scott',
  'concentration curls':'Rosca concentrada',
  'triceps pushdown':'Tríceps na polia',
  'triceps pushdown rope attachment':'Tríceps corda na polia',
  'lying triceps press':'Tríceps testa deitado',
  'dips triceps version':'Mergulho para tríceps',
  'crunches':'Abdominal curto',
  'sit up':'Abdominal completo',
  'plank':'Prancha abdominal',
  'hanging leg raise':'Elevação de pernas suspenso'
};

const phrases=[
  [/medium grip/gi,'pegada média'],[/wide grip/gi,'pegada aberta'],[/close grip/gi,'pegada fechada'],[/reverse grip/gi,'pegada invertida'],
  [/single arm/gi,'unilateral'],[/one arm/gi,'unilateral'],[/straight arm/gi,'braços estendidos'],[/bent over/gi,'curvado'],
  [/bench press/gi,'supino'],[/shoulder press/gi,'desenvolvimento de ombros'],[/military press/gi,'desenvolvimento militar'],
  [/lat pulldown/gi,'puxada frontal'],[/pulldown/gi,'puxada'],[/pull up/gi,'barra fixa'],[/chin up/gi,'barra fixa supinada'],
  [/leg extension/gi,'cadeira extensora'],[/leg curl/gi,'flexora'],[/leg press/gi,'leg press'],[/hip thrust/gi,'elevação pélvica'],
  [/calf raise/gi,'elevação de panturrilha'],[/glute bridge/gi,'ponte de glúteos'],[/rear delt/gi,'deltoide posterior'],
  [/lateral raise/gi,'elevação lateral'],[/front raise/gi,'elevação frontal'],[/upright row/gi,'remada alta'],
  [/hammer curl/gi,'rosca martelo'],[/preacher curl/gi,'rosca Scott'],[/concentration curl/gi,'rosca concentrada'],
  [/triceps extension/gi,'extensão de tríceps'],[/triceps press/gi,'tríceps testa'],[/pushdown/gi,'tríceps na polia'],
  [/deadlift/gi,'levantamento terra'],[/squat/gi,'agachamento'],[/lunge/gi,'avanço'],[/row/gi,'remada'],
  [/chest fly/gi,'crucifixo peitoral'],[/reverse fly/gi,'crucifixo inverso'],[/flyes?/gi,'crucifixo'],
  [/push ups?/gi,'flexão de braços'],[/crunches?/gi,'abdominal curto'],[/sit ups?/gi,'abdominal completo'],[/leg raises?/gi,'elevação de pernas']
];

const words={
  barbell:'barra',dumbbell:'halter',cable:'polia',machine:'máquina',bodyweight:'peso corporal',band:'elástico',rope:'corda',
  chest:'peitoral',back:'costas',shoulder:'ombros',biceps:'bíceps',triceps:'tríceps',forearm:'antebraço',wrist:'punho',
  leg:'perna',legs:'pernas',quad:'quadríceps',quadriceps:'quadríceps',hamstring:'posterior de coxa',hamstrings:'posteriores de coxa',
  glute:'glúteo',glutes:'glúteos',calf:'panturrilha',calves:'panturrilhas',abdominal:'abdominal',abs:'abdômen',
  standing:'em pé',seated:'sentado',lying:'deitado',incline:'inclinado',decline:'declinado',flat:'reto',front:'frontal',rear:'posterior',
  raise:'elevação',raises:'elevação',curl:'rosca',curls:'rosca',extension:'extensão',extensions:'extensão',press:'pressão',
  grip:'pegada',wide:'aberta',close:'fechada',reverse:'invertida',alternating:'alternado',alternate:'alternado',assisted:'assistido',
  smith:'Smith',rack:'suporte',bench:'banco',floor:'chão',kneeling:'ajoelhado',overhead:'acima da cabeça',walking:'caminhando'
};

function readJson(key){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
function normalize(value){return String(value||'').replaceAll('_',' ').replaceAll('-',' ').replace(/[^a-zA-ZÀ-ÿ0-9 ]/g,' ').replace(/\s+/g,' ').trim()}

function translateName(value){
  const original=normalize(value);
  if(!original)return '';
  const key=original.toLowerCase();
  if(exactTranslations[key])return exactTranslations[key];
  let text=original;
  for(const [pattern,replacement] of phrases)text=text.replace(pattern,replacement);
  text=text.split(' ').map(word=>words[word.toLowerCase()]||word).join(' ').replace(/\s+/g,' ').trim();
  if(text.toLowerCase()===original.toLowerCase())return `Exercício: ${original}`;
  return text.charAt(0).toUpperCase()+text.slice(1);
}

function addTranslation(element){
  if(!element)return;
  const old=element.querySelector(':scope > .mayfit-portuguese-name');
  const original=(element.firstChild?.textContent||element.textContent||'').trim();
  const translated=translateName(original);
  if(!translated||translated.toLowerCase()===original.toLowerCase()){old?.remove();return}
  const line=old||document.createElement('small');
  line.className='mayfit-portuguese-name';
  line.textContent=translated;
  if(!old)element.appendChild(line);
}

function applyTranslations(root=document){
  root.querySelectorAll?.('.exercise-col>strong,.exercise-modal-card h2,.exercise-card strong,.exercise-name,.exercise-option strong,.exercise-option span').forEach(addTranslation);
  root.querySelectorAll?.('li,option').forEach(element=>{
    const text=(element.textContent||'').trim();
    if(text.length>=3&&text.length<=100&&/[a-z]{3}/i.test(text))addTranslation(element);
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

function isViewingStudent(){
  const admin=readJson(ADMIN_RETURN_KEY);
  const user=readJson(USER_KEY);
  return Boolean(admin?.id&&admin.role==='admin'&&user?.role==='student');
}

function findHomeControl(){
  const candidates=[...document.querySelectorAll('button,a,[role="button"]')];
  return candidates.find(element=>{
    const text=(element.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    const aria=(element.getAttribute('aria-label')||'').toLowerCase();
    return text==='início'||text==='inicio'||aria==='início'||aria==='inicio';
  });
}

function configureHomeReturn(){
  document.getElementById('mayfit-return-admin')?.remove();
  document.querySelectorAll('[data-mayfit-admin-home="true"]').forEach(element=>{
    element.removeAttribute('data-mayfit-admin-home');
    element.removeAttribute('title');
  });
  if(!isViewingStudent())return;
  const home=findHomeControl();
  if(!home)return;
  home.dataset.mayfitAdminHome='true';
  home.title='Voltar ao administrador';
}

document.addEventListener('click',event=>{
  const control=event.target.closest('button,a,[role="button"]');
  if(!control||control.dataset.mayfitAdminHome!=='true'||!isViewingStudent())return;
  event.preventDefault();
  event.stopImmediatePropagation();
  restoreAdmin();
},true);

const style=document.createElement('style');
style.textContent=`
.mayfit-portuguese-name{display:block!important;margin-top:4px!important;color:#9cab9f!important;font-size:.72em!important;font-weight:750!important;line-height:1.2!important;text-transform:none!important;letter-spacing:0!important;white-space:normal!important}
[data-mayfit-admin-home="true"]{color:#8df20b!important}
`;
document.head.appendChild(style);

let scheduled=false;
const observer=new MutationObserver(()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyTranslations();configureHomeReturn()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
applyTranslations();
configureHomeReturn();
window.setInterval(configureHomeReturn,1000);