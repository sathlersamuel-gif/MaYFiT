import './student-area-entry.js?v=5';
import './body-evolution-runtime.js?v=1';
import './exercise-rename-translate.js?v=2';

const STORAGE_KEY='mayfit_body_field_labels_v2';

function readSaved(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}
}
function writeSaved(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch{}}
function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}
function fieldKey(control,index){return control?.name||`field_${index}`}
function originalLabel(label){return clean([...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join(' '))}

function installStyles(){
  if(document.getElementById('mayfit-body-direct-fix-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-body-direct-fix-style';
  style.textContent=`
    .be-modal{overflow:hidden!important;padding:0!important}
    .be-modal .be-wrap{width:min(900px,100%)!important;height:100dvh!important;max-height:100dvh!important;margin:0 auto!important;padding:0 14px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important}
    .be-modal .be-top{position:relative!important;flex:0 0 auto!important;width:100%!important;margin:0!important;padding:max(18px,env(safe-area-inset-top)) 0 14px!important;box-sizing:border-box!important;background:#050806!important;border-bottom:1px solid #23382a!important;z-index:2!important}
    .be-modal .be-scroll{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:14px 0 max(24px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important}
    .be-modal .be-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:12px!important;row-gap:10px!important;width:100%!important}
    .be-modal .be-grid label{display:block!important;min-width:0!important;max-width:100%!important;overflow:visible!important}
    .be-modal .be-grid input{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
    .be-modal .be-label-editor{display:inline-flex!important;align-items:center!important;gap:5px!important;max-width:100%!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;font:inherit!important;font-weight:800!important;text-align:left!important;cursor:pointer!important}
    .be-modal .be-label-editor::after{content:'✎';color:#78d532;font-size:11px}
  `;
  document.head.appendChild(style);
}

function organizeModal(modal){
  if(modal.dataset.scrollOrganized==='1')return;
  const wrap=modal.querySelector('.be-wrap');
  const top=wrap?.querySelector(':scope > .be-top');
  if(!wrap||!top)return;
  const scroll=document.createElement('div');
  scroll.className='be-scroll';
  [...wrap.children].filter(child=>child!==top).forEach(child=>scroll.appendChild(child));
  wrap.appendChild(scroll);
  modal.dataset.scrollOrganized='1';
}

function makeLabelEditable(label,index,saved){
  if(label.dataset.directEditable==='1')return;
  if(label.querySelector('input[data-photo]')||label.closest('.be-photo-grid'))return;
  const control=label.querySelector('input[name],textarea[name],select[name]');
  if(!control)return;
  const original=originalLabel(label);
  if(!original)return;
  const key=fieldKey(control,index);
  const editor=document.createElement('button');
  editor.type='button';
  editor.className='be-label-editor';
  editor.textContent=saved[key]||original;
  [...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&clean(node.textContent)).forEach(node=>node.remove());
  label.insertBefore(editor,label.firstChild);
  label.dataset.directEditable='1';
  editor.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const next=window.prompt('Digite o novo nome deste campo:',editor.textContent);
    if(next===null)return;
    const value=clean(next)||original;
    editor.textContent=value;
    const updated=readSaved();updated[key]=value;writeSaved(updated);
  });
}

function apply(){
  installStyles();const saved=readSaved();
  document.querySelectorAll('.be-modal').forEach(modal=>{
    organizeModal(modal);
    modal.querySelectorAll('form label').forEach((label,index)=>makeLabelEditable(label,index,saved));
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();