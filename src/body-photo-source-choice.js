function photoHolder(input){
  return input?.closest('.be-photo')||input?.parentElement||null;
}

function applyPreview(input,dataUrl){
  const holder=photoHolder(input);
  if(!holder||!dataUrl)return;

  holder.style.position='relative';
  holder.style.overflow='hidden';
  holder.style.backgroundImage=`url("${dataUrl}")`;
  holder.style.backgroundSize='cover';
  holder.style.backgroundPosition='center';
  holder.style.backgroundRepeat='no-repeat';
  holder.dataset.hasPhotoPreview='1';

  let overlay=holder.querySelector('.mayfit-photo-preview-label');
  const originalLabel=holder.querySelector('span:not(.mayfit-photo-preview-label)');
  if(originalLabel)originalLabel.style.display='none';
  if(!overlay){
    overlay=document.createElement('span');
    overlay.className='mayfit-photo-preview-label';
    overlay.textContent='Trocar foto';
    overlay.style.cssText='position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:4;padding:7px 10px;border-radius:9px;background:rgba(0,0,0,.72);color:#fff;font-weight:900;white-space:nowrap;pointer-events:none';
    holder.appendChild(overlay);
  }

  input.style.position='absolute';
  input.style.inset='0';
  input.style.width='100%';
  input.style.height='100%';
  input.style.opacity='0';
  input.style.zIndex='5';
  input.style.cursor='pointer';
}

function showPreview(input){
  const file=input?.files?.[0];
  if(!file||!file.type?.startsWith('image/'))return;
  const reader=new FileReader();
  reader.onload=()=>applyPreview(input,String(reader.result||''));
  reader.readAsDataURL(file);
}

function preparePhotoInput(input){
  if(!input)return;
  input.type='file';
  input.accept='image/*';
  input.removeAttribute('capture');
  input.removeAttribute('webkitdirectory');

  const holder=photoHolder(input);
  if(holder){
    holder.setAttribute('title','Tirar uma foto ou escolher uma imagem da galeria');
    const label=holder.querySelector('span');
    if(label&&/adicionar foto/i.test(label.textContent||''))label.textContent='Adicionar foto';
  }

  if(input.dataset.photoSourceChoice==='2')return;
  input.dataset.photoSourceChoice='2';
  input.addEventListener('change',()=>showPreview(input));
}

function applyPhotoChoices(){
  document.querySelectorAll('.be-modal input[type="file"][data-photo],.be-modal .be-photo input[type="file"]').forEach(preparePhotoInput);
}

document.addEventListener('change',event=>{
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
  if(!input.matches('.be-modal input[data-photo],.be-modal .be-photo input[type="file"]'))return;
  showPreview(input);
},true);

const observer=new MutationObserver(()=>requestAnimationFrame(applyPhotoChoices));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',applyPhotoChoices);
window.addEventListener('focus',applyPhotoChoices);
applyPhotoChoices();
