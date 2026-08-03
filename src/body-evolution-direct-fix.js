const STORAGE_KEY='mayfit_body_field_labels_v2';

function readSaved(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}
}

function writeSaved(data){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch{}
}

function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function fieldKey(control,index){
  return control?.name||control?.dataset?.photo||`field_${index}`;
}

function originalLabel(label){
  return clean([...label.childNodes]
    .filter(node=>node.nodeType===Node.TEXT_NODE)
    .map(node=>node.textContent)
    .join(' '));
}

function installStyles(){
  if(document.getElementById('mayfit-body-direct-fix-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-body-direct-fix-style';
  style.textContent=`
    .be-modal{overflow:hidden!important;padding:0!important}
    .be-modal .be-wrap{width:min(900px,100%)!important;height:100dvh!important;max-height:100dvh!important;margin:0 auto!important;padding:0 14px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important}
    .be-modal .be-top{position:relative!important;inset:auto!important;transform:none!important;flex:0 0 auto!important;width:100%!important;min-height:0!important;margin:0!important;padding:max(18px,env(safe-area-inset-top)) 0 14px!important;box-sizing:border-box!important;background:#050806!important;border-bottom:1px solid #23382a!important;box-shadow:none!important;z-index:2!important}
    .be-modal .be-top h1{margin:0!important}
    .be-modal .be-scroll{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:14px 0 max(24px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important}
    .be-modal .be-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:12px!important;row-gap:10px!important;width:100%!important}
    .be-modal .be-grid label{display:block!important;min-width:0!important;max-width:100%!important;overflow:visible!important}
    .be-modal .be-grid input{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;inline-size:100%!important;min-inline-size:0!important;max-inline-size:100%!important;box-sizing:border-box!important}
    .be-modal .be-grid input[type='date']{-webkit-appearance:none!important;appearance:none!important;width:100%!important;min-width:0!important;max-width:100%!important;inline-size:100%!important;box-sizing:border-box!important;font-size:13px!important;line-height:1.2!important;padding-left:8px!important;padding-right:8px!important;text-align:center!important}
    .be-modal .be-label-editor{display:inline-flex!important;align-items:center!important;gap:5px!important;max-width:100%!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;font:inherit!important;font-weight:800!important;text-align:left!important;cursor:pointer!important;overflow-wrap:anywhere!important}
    .be-modal .be-label-editor::after{content:'✎';color:#78d532;font-size:11px;line-height:1;flex:0 0 auto}
    .be-modal .be-label-editor:focus-visible{outline:1px solid #78d532!important;outline-offset:3px!important;border-radius:4px!important}
    @media(max-width:380px){.be-modal .be-wrap{padding-left:10px!important;padding-right:10px!important}.be-modal .be-grid{column-gap:8px!important}.be-modal .be-grid input[type='date']{font-size:12px!important;padding-left:6px!important;padding-right:6px!important}}
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
  const control=label.querySelector('input[name],textarea[name],select[name],input[data-photo]');
  if(!control)return;
  const original=originalLabel(label);
  if(!original)return;
  const key=fieldKey(control,index);
  const editor=document.createElement('button');
  editor.type='button';
  editor.className='be-label-editor';
  editor.dataset.key=key;
  editor.dataset.original=original;
  editor.textContent=saved[key]||original;
  [...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&clean(node.textContent)).forEach(node=>node.remove());
  label.insertBefore(editor,label.firstChild);
  label.dataset.directEditable='1';
  editor.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    const current=editor.textContent;
    const next=window.prompt('Digite o novo nome deste campo:',current);
    if(next===null)return;
    const value=clean(next)||original;
    editor.textContent=value;
    const updated=readSaved();
    updated[key]=value;
    writeSaved(updated);
  });
}

function apply(){
  installStyles();
  const saved=readSaved();
  document.querySelectorAll('.be-modal').forEach(modal=>{
    organizeModal(modal);
    modal.querySelectorAll('form label').forEach((label,index)=>makeLabelEditable(label,index,saved));
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
