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
    .be-modal .be-top{
      position:sticky!important;
      top:0!important;
      z-index:999!important;
      margin:0 -14px 14px!important;
      padding:max(10px,env(safe-area-inset-top)) 14px 12px!important;
      background:#050806!important;
      border-bottom:1px solid #23382a!important;
      box-shadow:0 8px 18px rgba(0,0,0,.28)!important;
    }
    .be-modal .be-top h1{margin:0!important}
    .be-modal .be-label-editor{
      display:inline-flex!important;
      align-items:center!important;
      gap:5px!important;
      max-width:100%!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      color:inherit!important;
      font:inherit!important;
      font-weight:800!important;
      text-align:left!important;
      cursor:pointer!important;
    }
    .be-modal .be-label-editor::after{
      content:'✎';
      color:#78d532;
      font-size:11px;
      line-height:1;
      flex:0 0 auto;
    }
    .be-modal .be-label-editor:focus-visible{
      outline:1px solid #78d532!important;
      outline-offset:3px!important;
      border-radius:4px!important;
    }
  `;
  document.head.appendChild(style);
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

  [...label.childNodes]
    .filter(node=>node.nodeType===Node.TEXT_NODE&&clean(node.textContent))
    .forEach(node=>node.remove());

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
    modal.querySelectorAll('form label').forEach((label,index)=>makeLabelEditable(label,index,saved));
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
