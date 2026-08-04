function preparePhotoInput(input){
  if(!input||input.dataset.photoSourceChoice==='1')return;
  input.dataset.photoSourceChoice='1';
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
}

function applyPhotoChoices(){
  document.querySelectorAll('.be-modal input[type="file"][data-photo],.be-modal .be-photo input[type="file"]').forEach(preparePhotoInput);
}

const observer=new MutationObserver(()=>requestAnimationFrame(applyPhotoChoices));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',applyPhotoChoices);
window.addEventListener('focus',applyPhotoChoices);
applyPhotoChoices();
