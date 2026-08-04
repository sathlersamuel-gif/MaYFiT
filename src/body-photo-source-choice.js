function showPreview(input){
  const file=input?.files?.[0];
  if(!file||!file.type?.startsWith('image/'))return;
  const holder=input.closest('.be-photo,label')||input.parentElement;
  if(!holder)return;

  const oldUrl=holder.dataset.previewUrl;
  if(oldUrl)URL.revokeObjectURL(oldUrl);
  const url=URL.createObjectURL(file);
  holder.dataset.previewUrl=url;

  let image=holder.querySelector('img[data-photo-preview="true"]');
  if(!image){
    image=document.createElement('img');
    image.dataset.photoPreview='true';
    image.alt='Prévia da foto selecionada';
    image.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:1';
    holder.style.position='relative';
    holder.appendChild(image);
  }
  image.src=url;

  const label=holder.querySelector('span');
  if(label){
    label.textContent='Trocar foto';
    label.style.position='relative';
    label.style.zIndex='2';
    label.style.padding='6px 8px';
    label.style.borderRadius='8px';
    label.style.background='rgba(0,0,0,.62)';
    label.style.color='#fff';
  }
  input.style.position='absolute';
  input.style.inset='0';
  input.style.width='100%';
  input.style.height='100%';
  input.style.opacity='0';
  input.style.zIndex='3';
  input.style.cursor='pointer';
}

function preparePhotoInput(input){
  if(!input)return;
  input.type='file';
  input.accept='image/*';
  input.removeAttribute('capture');
  input.removeAttribute('webkitdirectory');

  const holder=input.closest('.be-photo,label')||input.parentElement;
  if(holder){
    holder.setAttribute('title','Tirar uma foto ou escolher uma imagem da galeria');
    const label=holder.querySelector('span');
    if(label&&/adicionar foto/i.test(label.textContent||''))label.textContent='Adicionar foto';
  }

  if(input.dataset.photoSourceChoice==='1')return;
  input.dataset.photoSourceChoice='1';
  input.addEventListener('change',()=>showPreview(input));
}

function applyPhotoChoices(){
  document.querySelectorAll('.be-modal input[type="file"][data-photo],.be-modal .be-photo input[type="file"]').forEach(preparePhotoInput);
}

const observer=new MutationObserver(()=>requestAnimationFrame(applyPhotoChoices));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',applyPhotoChoices);
window.addEventListener('focus',applyPhotoChoices);
applyPhotoChoices();
