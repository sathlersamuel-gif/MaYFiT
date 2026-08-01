import './body-evolution.js?v=3';
import './body-evolution-save-fix.js?v=3';
import './body-evolution-delete-record.js?v=2';
import './student-performance-fix.js?v=2';

const MAYFIT_EXERCISE_DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const MAYFIT_IMAGE_BASE='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let mayfitExerciseMap=null;
let mayfitLoading=false;

const style=document.createElement('style');
style.textContent=`
.exercise-picker .picker-item{display:grid!important;grid-template-columns:auto 76px minmax(0,1fr)!important;align-items:center!important;gap:10px!important}
.exercise-picker .picker-item .mayfit-picker-thumb{width:76px;height:60px;display:block;object-fit:cover;border:1px solid #36513f;border-radius:10px;background:#07100a;cursor:zoom-in}
.exercise-picker .picker-item>span:not(.mayfit-picker-thumb){min-width:0}
.mayfit-image-zoom{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.9)}
.mayfit-image-zoom img{max-width:min(920px,96vw);max-height:86vh;object-fit:contain;border-radius:16px;background:#050706}
.mayfit-image-zoom button{position:fixed;top:max(18px,env(safe-area-inset-top));right:18px;width:44px;height:44px;border:1px solid #49664f;border-radius:14px;background:#132018;color:#fff;font-size:26px}
@media(max-width:620px){.exercise-picker .picker-item{grid-template-columns:auto 68px minmax(0,1fr)!important}.exercise-picker .picker-item .mayfit-picker-thumb{width:68px;height:56px}}
`;
document.head.appendChild(style);

function openZoom(src,alt){
  document.querySelector('.mayfit-image-zoom')?.remove();
  const zoom=document.createElement('div');
  zoom.className='mayfit-image-zoom';
  zoom.innerHTML=`<button type="button" aria-label="Fechar">×</button><img src="${src}" alt="${alt||''}">`;
  zoom.querySelector('button').onclick=()=>zoom.remove();
  zoom.onclick=event=>{if(event.target===zoom)zoom.remove()};
  document.body.appendChild(zoom);
}

async function loadExerciseMap(){
  if(mayfitExerciseMap)return mayfitExerciseMap;
  if(mayfitLoading)return null;
  mayfitLoading=true;
  try{
    const response=await fetch(MAYFIT_EXERCISE_DB,{cache:'force-cache'});
    if(!response.ok)throw new Error('Falha ao carregar catálogo');
    const list=await response.json();
    mayfitExerciseMap=new Map((Array.isArray(list)?list:[]).map(item=>[
      String(item.name||'').trim().toLowerCase(),
      {id:item.id,image:Array.isArray(item.images)?item.images[0]:''}
    ]));
    return mayfitExerciseMap;
  }catch{
    mayfitExerciseMap=new Map();
    return mayfitExerciseMap;
  }finally{mayfitLoading=false}
}

async function applyAdminExerciseThumbnails(){
  const items=[...document.querySelectorAll('.exercise-picker .picker-list .picker-item')];
  if(!items.length)return;
  const map=await loadExerciseMap();
  if(!map)return;
  for(const item of items){
    if(item.querySelector('.mayfit-picker-thumb'))continue;
    const name=item.querySelector('strong')?.textContent?.trim()||'';
    const data=map.get(name.toLowerCase());
    const image=data?.image?MAYFIT_IMAGE_BASE+data.image:'';
    const thumb=document.createElement(image?'img':'span');
    thumb.className='mayfit-picker-thumb';
    if(image){
      thumb.src=image;
      thumb.alt=name;
      thumb.loading='lazy';
      thumb.decoding='async';
      thumb.onclick=event=>{event.preventDefault();event.stopPropagation();openZoom(image,name)};
      thumb.onerror=()=>{thumb.style.visibility='hidden'};
    }else thumb.setAttribute('aria-hidden','true');
    const text=item.querySelector('span');
    item.insertBefore(thumb,text||null);
  }
}

const observer=new MutationObserver(()=>requestAnimationFrame(applyAdminExerciseThumbnails));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',event=>{if(event.target.closest('.exercise-picker'))requestAnimationFrame(applyAdminExerciseThumbnails)},true);
applyAdminExerciseThumbnails();
