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
    .be-modal{
      overflow:hidden!important;
      padding:0!important;
    }
    .be-modal .be-wrap{
      width:min(900px,100%)!important;
      height:100dvh!important;
      max-height:100dvh!important;
      margin:0 auto!important;
      padding:0 14px!important;
      box-sizing:border-box!important;
      display:flex!important;
      flex-direction:column!important;
    }
    .be-modal .be-top{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      width:100%!important;
      min-height:0!important;
      margin:0!important;
      padding:max(18px,env(safe-area-inset-top)) 0 14px!important;
      box-sizing:border-box!important;
      background:#050806!important;
      border-bottom:1px solid #23382a!important;
      box-shadow:none!important;
      z-index:2!important;
    }
    .be-modal .be-top h1{margin:0!important}
    .be-modal .be-scroll{
      flex:1 1 auto!important;
      min-height:0!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      -webkit-overflow-scrolling:touch!important;
      padding:14px 0 max(24px,env(safe-area-inset-bottom))!important;
      box-sizing:border-box!important;
    }
    .be-modal .be-grid{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      column-gap:12px!important;
      row-gap:10px!important;
      width:100%!important;
    }
    .be-modal .be-grid label{
      display:block!important;
      min-width:0!important;
      max-width:100%!important;
      overflow:hidden!important;
    }
    .be-modal .be-grid input{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
    }
    .be-modal .be-grid input[type='date']{
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      font-size:13px!important;
      line-height:1.2!important;
      padding-left:8px!important;
      padding-right:8px!important;
    }
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
      overflow-wrap:anywhere!important;
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

    .exercise-modal{
      position:fixed!important;
      inset:0!important;
      z-index:300000!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom))!important;
      background:rgba(0,0,0,.95)!important;
      overflow-y:auto!important;
      box-sizing:border-box!important;
    }
    .exercise-modal-card{
      position:relative!important;
      width:min(760px,100%)!important;
      max-height:calc(100dvh - 36px)!important;
      overflow-y:auto!important;
      padding:58px 16px 18px!important;
      border:1px solid #385442!important;
      border-radius:22px!important;
      background:#07100a!important;
      color:#fff!important;
      box-sizing:border-box!important;
      box-shadow:0 24px 70px rgba(0,0,0,.55)!important;
    }
    .exercise-modal-card h2{
      margin:0 0 14px!important;
      padding:0!important;
      font-size:clamp(22px,5vw,32px)!important;
      line-height:1.1!important;
      color:#fff!important;
    }
    .exercise-modal-card .modal-close{
      position:absolute!important;
      top:12px!important;
      right:12px!important;
      z-index:2!important;
      display:grid!important;
      place-items:center!important;
      width:42px!important;
      height:42px!important;
      padding:0!important;
      border:1px solid #49664f!important;
      border-radius:13px!important;
      background:#17231b!important;
      color:#fff!important;
    }
    .exercise-modal-card .modal-close svg{
      width:24px!important;
      height:24px!important;
    }
    .exercise-modal-card .modal-pose-pair{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      width:100%!important;
      overflow:hidden!important;
      border:1px solid #3b5142!important;
      border-radius:16px!important;
      background:#050706!important;
    }
    .exercise-modal-card .modal-pose-pair figure{
      position:relative!important;
      min-width:0!important;
      margin:0!important;
      overflow:hidden!important;
      background:#050706!important;
    }
    .exercise-modal-card .modal-pose-pair figure+figure{
      border-left:1px solid #3b5142!important;
    }
    .exercise-modal-card .modal-pose-pair b{
      position:absolute!important;
      top:0!important;
      left:0!important;
      right:0!important;
      z-index:2!important;
      display:grid!important;
      place-items:center!important;
      height:34px!important;
      background:#111512!important;
      color:#fff!important;
      font-size:12px!important;
      font-weight:950!important;
    }
    .exercise-modal-card .modal-pose-pair figure:first-child b{
      background:#83e400!important;
      color:#071108!important;
    }
    .exercise-modal-card .modal-pose-pair img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      min-height:280px!important;
      max-height:62vh!important;
      padding-top:34px!important;
      object-fit:contain!important;
      background:#fff!important;
      box-sizing:border-box!important;
    }
    .exercise-modal-card p{
      margin:14px 0 0!important;
      color:#c7d0ca!important;
      font-size:15px!important;
      line-height:1.45!important;
    }

    @media(max-width:620px){
      .exercise-modal{padding:0!important;align-items:stretch!important}
      .exercise-modal-card{
        width:100%!important;
        min-height:100dvh!important;
        max-height:100dvh!important;
        border:0!important;
        border-radius:0!important;
        padding:calc(max(14px,env(safe-area-inset-top)) + 48px) 12px max(18px,env(safe-area-inset-bottom))!important;
      }
      .exercise-modal-card .modal-close{top:max(10px,env(safe-area-inset-top))!important}
      .exercise-modal-card .modal-pose-pair img{min-height:220px!important;max-height:52vh!important}
    }
    @media(max-width:380px){
      .be-modal .be-wrap{padding-left:10px!important;padding-right:10px!important}
      .be-modal .be-grid{column-gap:8px!important}
      .be-modal .be-grid input[type='date']{font-size:12px!important;padding-left:6px!important;padding-right:6px!important}
    }
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
    organizeModal(modal);
    modal.querySelectorAll('form label').forEach((label,index)=>makeLabelEditable(label,index,saved));
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
