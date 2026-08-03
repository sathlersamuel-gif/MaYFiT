const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
.exercise-modal{position:fixed!important;inset:0!important;z-index:300000!important;display:grid!important;place-items:center!important;padding:8px!important;background:rgba(0,0,0,.96)!important;overflow:auto!important;box-sizing:border-box!important}
.exercise-modal-card{position:relative!important;width:min(760px,100%)!important;max-height:calc(100dvh - 16px)!important;overflow:auto!important;padding:54px 8px 12px!important;border:1px solid #385442!important;border-radius:16px!important;background:#07100a!important;color:#fff!important;box-sizing:border-box!important}
.exercise-modal-card h2{margin:0 50px 12px 0!important;font-size:clamp(20px,5vw,30px)!important;line-height:1.1!important}
.exercise-modal-card .modal-close{position:absolute!important;top:10px!important;right:10px!important;z-index:5!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;margin:0!important;padding:0!important;border:1px solid #49664f!important;border-radius:13px!important;background:#17231b!important;color:#fff!important}
.exercise-modal-card .modal-pose-pair{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:1fr!important;width:100%!important;overflow:hidden!important;border:1px solid #3b5142!important;border-radius:14px!important;background:#050706!important}
.exercise-modal-card .modal-pose-pair figure{position:relative!important;display:block!important;min-width:0!important;width:auto!important;margin:0!important;overflow:hidden!important;background:#fff!important}
.exercise-modal-card .modal-pose-pair figure+figure{border-left:1px solid #3b5142!important}
.exercise-modal-card .modal-pose-pair b{position:absolute!important;inset:0 0 auto 0!important;z-index:2!important;display:grid!important;place-items:center!important;height:32px!important;background:#111512!important;color:#fff!important;font-size:11px!important;font-weight:950!important}
.exercise-modal-card .modal-pose-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.exercise-modal-card .modal-pose-pair img{display:block!important;width:100%!important;height:min(55vh,430px)!important;min-height:180px!important;padding-top:32px!important;object-fit:contain!important;object-position:center!important;background:#fff!important;box-sizing:border-box!important}
.exercise-modal-card p{margin:12px 0 0!important;color:#c7d0ca!important;font-size:13px!important;line-height:1.4!important}
body:has(.exercise-modal){overflow:hidden!important}
`;
document.head.appendChild(style);

function forcePhotoModal(){
  const modal=document.querySelector('.exercise-modal');
  if(!modal)return;
  const card=modal.querySelector('.exercise-modal-card');
  const pair=modal.querySelector('.modal-pose-pair');
  const figures=pair?[...pair.querySelectorAll(':scope > figure')]:[];
  modal.style.setProperty('position','fixed','important');
  modal.style.setProperty('inset','0','important');
  modal.style.setProperty('z-index','300000','important');
  modal.style.setProperty('display','grid','important');
  modal.style.setProperty('place-items','center','important');
  modal.style.setProperty('background','rgba(0,0,0,.96)','important');
  if(card){
    card.style.setProperty('position','relative','important');
    card.style.setProperty('width','min(760px,100%)','important');
    card.style.setProperty('max-height','calc(100dvh - 16px)','important');
    card.style.setProperty('overflow','auto','important');
    card.style.setProperty('background','#07100a','important');
  }
  if(pair){
    pair.style.setProperty('display','grid','important');
    pair.style.setProperty('grid-template-columns','minmax(0,1fr) minmax(0,1fr)','important');
    pair.style.setProperty('grid-template-rows','1fr','important');
    pair.style.setProperty('width','100%','important');
    pair.style.setProperty('height','auto','important');
  }
  figures.forEach(figure=>{
    figure.style.setProperty('display','block','important');
    figure.style.setProperty('width','auto','important');
    figure.style.setProperty('min-width','0','important');
    figure.style.setProperty('margin','0','important');
  });
  pair?.querySelectorAll('img').forEach(img=>{
    img.style.setProperty('display','block','important');
    img.style.setProperty('width','100%','important');
    img.style.setProperty('height','min(55vh,430px)','important');
    img.style.setProperty('object-fit','contain','important');
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(forcePhotoModal));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',()=>requestAnimationFrame(forcePhotoModal),true);
forcePhotoModal();
