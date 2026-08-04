function openPhotoInput(event){
  const holder=event.target.closest?.('.be-photo');
  if(!holder)return;
  const input=holder.querySelector('input[type="file"][data-photo]');
  if(!input||event.target===input)return;
  event.preventDefault();
  event.stopPropagation();
  input.click();
}

document.addEventListener('click',openPhotoInput,true);
document.addEventListener('touchend',event=>{
  const holder=event.target.closest?.('.be-photo');
  if(!holder)return;
  const input=holder.querySelector('input[type="file"][data-photo]');
  if(!input||event.target===input)return;
  event.preventDefault();
  event.stopPropagation();
  input.click();
},{capture:true,passive:false});

const style=document.createElement('style');
style.id='mayfit-photo-input-fix-style';
style.textContent=`
.be-modal .be-photo{cursor:pointer!important;touch-action:manipulation!important;pointer-events:auto!important}
.be-modal .be-photo>*:not(input){pointer-events:none!important}
`;
document.head.appendChild(style);
