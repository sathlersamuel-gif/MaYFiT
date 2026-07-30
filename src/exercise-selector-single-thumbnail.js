const DB_URL='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

let databasePromise;
let modal;

function normalize(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function database(){
  if(!databasePromise){
    databasePromise=fetch(DB_URL,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  }
  return databasePromise;
}

function cardFor(input){
  let node=input.parentElement;
  while(node&&node!==document.body){
    if(/dispon[ií]vel para atribuir/i.test(node.textContent||''))return node;
    node=node.parentElement;
  }
  return null;
}

function cardName(card){
  const nodes=[...card.querySelectorAll('strong,b,h3,h4,.exercise-name,span')];
  const node=nodes.find(el=>{
    const text=(el.childNodes[0]?.textContent||el.textContent||'').trim();
    return text.length>2&&!/dispon[ií]vel para atribuir|selecionado/i.test(text);
  });
  return (node?.childNodes[0]?.textContent||node?.textContent||'').trim();
}

function candidateId(card,input){
  const nodes=[input,card,...card.querySelectorAll('[data-id],[data-exercise-id],[data-exercise]')];
  for(const node of nodes){
    for(const value of [node?.dataset?.exerciseId,node?.dataset?.exercise,node?.dataset?.id,node?.value]){
      const clean=String(value||'').trim();
      if(clean&&clean.length>2&&!/^(on|true|false)$/i.test(clean))return clean;
    }
  }
  return '';
}

async function resolveExercise(card,input){
  const list=await database();
  const id=normalize(candidateId(card,input));
  const name=normalize(cardName(card));
  return list.find(x=>normalize(x.id)===id)
    ||list.find(x=>normalize(x.name)===name)
    ||list.find(x=>name&&[normalize(x.name),normalize(x.id)].some(v=>v.includes(name)||name.includes(v)))
    ||null;
}

function imageUrl(exercise){
  const first=Array.isArray(exercise.images)&&exercise.images[0];
  if(first){
    const clean=String(first).replace(/^\/+/, '');
    return IMAGE_BASE+(clean.includes('/')?clean:`${exercise.id}/${clean}`);
  }
  return IMAGE_BASE+exercise.id+'/0.jpg';
}

function ensureModal(){
  if(modal)return;
  modal=document.createElement('div');
  modal.id='mayfit-single-image-modal';
  modal.hidden=true;
  modal.innerHTML='<div class="mayfit-single-image-card" role="dialog" aria-modal="true"><button type="button" aria-label="Fechar">×</button><img alt="Exercício ampliado"><strong></strong></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('button'))closeModal()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
}

function openModal(exercise){
  ensureModal();
  modal.querySelector('img').src=imageUrl(exercise);
  modal.querySelector('strong').textContent=exercise.name||'Exercício';
  modal.hidden=false;
  document.body.style.overflow='hidden';
}

function closeModal(){
  if(!modal)return;
  modal.hidden=true;
  document.body.style.overflow='';
}

async function enhance(card,input){
  if(card.dataset.mayfitSingleThumb)return;
  card.dataset.mayfitSingleThumb='loading';
  const exercise=await resolveExercise(card,input);
  if(!exercise){card.dataset.mayfitSingleThumb='not-found';return}
  const button=document.createElement('button');
  button.type='button';
  button.className='mayfit-single-thumb';
  button.setAttribute('aria-label','Ampliar foto de '+(exercise.name||'exercício'));
  const img=document.createElement('img');
  img.alt=exercise.name||'Exercício';
  img.loading='lazy';
  img.src=imageUrl(exercise);
  img.onerror=()=>{button.remove();card.dataset.mayfitSingleThumb='error'};
  button.appendChild(img);
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openModal(exercise)});
  input.insertAdjacentElement('afterend',button);
  card.dataset.mayfitSingleThumb='ready';
}

function scan(){
  document.querySelectorAll('input[type="checkbox"]').forEach(input=>{
    const card=cardFor(input);
    if(card)enhance(card,input);
  });
}

const style=document.createElement('style');
style.textContent=`
.mayfit-single-thumb{flex:0 0 58px;width:58px;height:58px;margin:0 10px 0 8px;padding:0;border:1px solid #42604c;border-radius:12px;background:#08100b;overflow:hidden;cursor:zoom-in}
.mayfit-single-thumb img{display:block;width:100%;height:100%;object-fit:cover;background:#050706}
#mayfit-single-image-modal[hidden]{display:none!important}
#mayfit-single-image-modal{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.92);box-sizing:border-box}
.mayfit-single-image-card{position:relative;width:min(680px,100%);max-height:92vh;padding:56px 16px 18px;border:1px solid #42604c;border-radius:22px;background:#07100a;box-sizing:border-box;overflow:auto}
.mayfit-single-image-card button{position:absolute;top:10px;right:10px;width:42px;height:42px;border:1px solid #5f7867;border-radius:14px;background:#111a14;color:#fff;font-size:30px;line-height:1}
.mayfit-single-image-card img{display:block;width:100%;max-height:72vh;object-fit:contain;border:1px solid #314638;border-radius:14px;background:#020302}
.mayfit-single-image-card strong{display:block;margin-top:14px;color:#fff;text-align:center;font:900 18px system-ui,-apple-system,sans-serif}
`;
document.head.appendChild(style);
ensureModal();
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
scan();
