const LABELS_KEY='mayfit_body_field_labels_v1';

function readLabels(){
  try{return JSON.parse(localStorage.getItem(LABELS_KEY)||'{}')||{}}catch{return {}}
}
function saveLabels(labels){
  try{localStorage.setItem(LABELS_KEY,JSON.stringify(labels))}catch{}
}

const style=document.createElement('style');
style.id='mayfit-body-evolution-form-fix-style';
style.textContent=`
.be-modal .be-wrap{width:min(760px,100%)!important}
.be-modal .be-top{position:sticky;top:0;z-index:10;padding:8px 0 14px;background:#050806}
.be-modal .be-card{padding:18px!important;border-radius:18px!important}
.be-modal .be-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px 18px!important}
.be-modal .be-grid label{display:flex!important;flex-direction:column!important;min-width:0!important;gap:7px!important;font-size:15px!important;line-height:1.25!important}
.be-modal .be-grid input{height:52px!important;margin:0!important;padding:10px 12px!important;border-radius:12px!important;font-size:16px!important}
.be-modal .be-editable-label{display:inline-flex!important;align-items:center!important;min-height:24px!important;padding:2px 5px!important;margin-left:-5px!important;border-radius:6px!important;outline:none!important;cursor:text!important}
.be-modal .be-editable-label:focus{background:#17251c!important;color:#fff!important;box-shadow:0 0 0 1px #78d532 inset!important}
.be-modal .be-label-hint{display:block;margin:-4px 0 14px;color:#8fa095;font-size:12px}
@media(max-width:620px){
  .be-modal{padding-left:12px!important;padding-right:12px!important}
  .be-modal .be-top{align-items:flex-start!important}
  .be-modal .be-top h1{font-size:clamp(26px,8vw,36px)!important}
  .be-modal .be-card{padding:14px!important}
  .be-modal .be-grid{grid-template-columns:1fr!important;gap:13px!important}
  .be-modal .be-grid label{font-size:14px!important}
  .be-modal .be-grid input{height:50px!important}
  .be-modal .be-photo-grid{grid-template-columns:1fr!important;gap:12px!important}
  .be-modal .be-photo{aspect-ratio:16/9!important}
}
`;
document.head.appendChild(style);

function normalize(text){return String(text||'').replace(/\s+/g,' ').trim()}

function prepareEditableLabels(root){
  if(!root||root.dataset.labelsPrepared==='true')return;
  const labels=readLabels();
  const grid=root.querySelector('.be-grid');
  if(!grid)return;

  if(!root.querySelector('.be-label-hint')){
    const hint=document.createElement('small');
    hint.className='be-label-hint';
    hint.textContent='Toque no nome de qualquer campo para editar.';
    grid.before(hint);
  }

  grid.querySelectorAll('label').forEach(label=>{
    const input=label.querySelector('input[name]');
    if(!input||label.querySelector('.be-editable-label'))return;
    const key=input.name;
    const textNodes=[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE);
    const original=normalize(textNodes.map(node=>node.textContent).join(' '));
    textNodes.forEach(node=>node.remove());

    const title=document.createElement('span');
    title.className='be-editable-label';
    title.contentEditable='true';
    title.spellcheck=false;
    title.dataset.field=key;
    title.dataset.defaultLabel=original;
    title.textContent=labels[key]||original;
    label.insertBefore(title,input);

    title.addEventListener('keydown',event=>{
      if(event.key==='Enter'){
        event.preventDefault();
        title.blur();
      }
    });
    title.addEventListener('blur',()=>{
      const value=normalize(title.textContent)||original;
      title.textContent=value;
      const updated=readLabels();
      updated[key]=value;
      saveLabels(updated);
    });
  });
  root.dataset.labelsPrepared='true';
}

function apply(){
  document.querySelectorAll('.be-modal').forEach(prepareEditableLabels);
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
