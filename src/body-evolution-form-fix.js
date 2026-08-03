const LABELS_KEY='mayfit_body_field_labels_v1';

function readLabels(){
  try{return JSON.parse(localStorage.getItem(LABELS_KEY)||'{}')||{}}catch{return {}}
}
function saveLabels(labels){
  try{localStorage.setItem(LABELS_KEY,JSON.stringify(labels))}catch{}
}
function normalize(text){return String(text||'').replace(/\s+/g,' ').trim()}

const style=document.createElement('style');
style.id='mayfit-body-evolution-form-fix-style';
style.textContent=`
.be-modal .be-top{
  position:sticky!important;
  top:0!important;
  z-index:50!important;
  padding:10px 0 14px!important;
  margin-bottom:14px!important;
  background:#050806!important;
}
.be-modal .be-grid{
  display:grid!important;
  grid-template-columns:calc((100% - 10px)/2) calc((100% - 10px)/2)!important;
  column-gap:10px!important;
  row-gap:10px!important;
}
.be-modal .be-grid label{
  width:100%!important;
  min-width:0!important;
  max-width:100%!important;
  overflow:visible!important;
}
.be-modal .be-grid input{
  display:block!important;
  width:100%!important;
  min-width:0!important;
  max-width:100%!important;
  inline-size:100%!important;
  min-inline-size:0!important;
  max-inline-size:100%!important;
  box-sizing:border-box!important;
}
.be-modal .be-grid input[type="date"]{
  -webkit-appearance:none!important;
  appearance:none!important;
  width:100%!important;
  min-width:0!important;
  max-width:100%!important;
  font-size:14px!important;
  line-height:1.2!important;
  text-align:left!important;
  padding-left:10px!important;
  padding-right:10px!important;
}
.be-modal .be-editable-label{
  display:inline!important;
  max-width:100%!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  color:inherit!important;
  font:inherit!important;
  line-height:inherit!important;
  outline:none!important;
  cursor:text!important;
  overflow-wrap:anywhere!important;
  -webkit-user-select:text!important;
  user-select:text!important;
}
.be-modal .be-editable-label:focus{
  text-decoration:underline!important;
  text-decoration-color:#78d532!important;
  text-underline-offset:3px!important;
}
`;
document.head.appendChild(style);

function makeEditable(label,index,labels){
  const control=label.querySelector('input[name],textarea[name],select[name],input[data-photo]');
  if(!control||label.querySelector('.be-editable-label'))return;

  const key=control.name||control.dataset.photo||`label_${index}`;
  const textNodes=[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&normalize(node.textContent));
  const original=normalize(textNodes.map(node=>node.textContent).join(' '));
  if(!original)return;
  textNodes.forEach(node=>node.remove());

  const title=document.createElement('span');
  title.className='be-editable-label';
  title.contentEditable='true';
  title.spellcheck=false;
  title.dataset.field=key;
  title.dataset.defaultLabel=original;
  title.textContent=labels[key]||original;
  label.insertBefore(title,label.firstChild);

  title.addEventListener('click',event=>event.stopPropagation());
  title.addEventListener('pointerdown',event=>event.stopPropagation());
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
}

function prepareEditableLabels(root){
  if(!root||root.dataset.labelsPrepared==='true')return;
  const labels=readLabels();
  root.querySelectorAll('form label').forEach((label,index)=>makeEditable(label,index,labels));
  root.dataset.labelsPrepared='true';
}

function apply(){
  document.querySelectorAll('.be-modal').forEach(prepareEditableLabels);
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
