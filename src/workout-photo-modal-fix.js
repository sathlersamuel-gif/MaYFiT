const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
html.mayfit-photo-open,html.mayfit-photo-open body{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important}
.exercise-modal{position:fixed!important;inset:0!important;z-index:300000!important;display:grid!important;place-items:center!important;width:100vw!important;height:100dvh!important;padding:0!important;background:rgba(0,0,0,.96)!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;box-sizing:border-box!important}
.exercise-modal-card{position:relative!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;overflow:hidden!important;padding:max(10px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:#07100a!important;color:#fff!important;box-sizing:border-box!important;touch-action:none!important}
.exercise-modal-card h2{min-width:0!important;margin:2px 52px 8px 2px!important;font-size:20px!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.exercise-modal-card .modal-close{position:absolute!important;top:max(8px,env(safe-area-inset-top))!important;right:8px!important;z-index:5!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;margin:0!important;padding:0!important;border:1px solid #49664f!important;border-radius:13px!important;background:#17231b!important;color:#fff!important;touch-action:manipulation!important}
.exercise-modal-card .modal-pose-pair{min-height:0!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;width:100%!important;height:100%!important;overflow:hidden!important;border:1px solid #3b5142!important;border-radius:14px!important;background:#050706!important;touch-action:none!important}
.exercise-modal-card .modal-pose-pair figure{position:relative!important;display:block!important;min-width:0!important;min-height:0!important;width:auto!important;height:100%!important;margin:0!important;overflow:hidden!important;background:#fff!important}
.exercise-modal-card .modal-pose-pair figure+figure{border-left:1px solid #3b5142!important}
.exercise-modal-card .modal-pose-pair b{position:absolute!important;inset:0 0 auto 0!important;z-index:2!important;display:grid!important;place-items:center!important;height:30px!important;background:#111512!important;color:#fff!important;font-size:11px!important;font-weight:950!important}
.exercise-modal-card .modal-pose-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.exercise-modal-card .modal-pose-pair img{display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;padding-top:30px!important;object-fit:contain!important;object-position:center!important;background:#fff!important;box-sizing:border-box!important;pointer-events:none!important;user-select:none!important;-webkit-user-drag:none!important}
.exercise-modal-card p{display:none!important}
`;
document.head.appendChild(style);

let locked=false;
let savedScrollY=0;

function lockPage(){
  if(locked)return;
  locked=true;
  savedScrollY=window.scrollY||0;
  document.documentElement.classList.add('mayfit-photo-open');
  document.body.style.setProperty('position','fixed','important');
  document.body.style.setProperty('top',`-${savedScrollY}px`,'important');
  document.body.style.setProperty('left','0','important');
  document.body.style.setProperty('right','0','important');
  document.body.style.setProperty('width','100%','important');
  document.body.style.setProperty('overflow','hidden','important');
}

function unlockPage(){
  if(!locked)return;
  locked=false;
  document.documentElement.classList.remove('mayfit-photo-open');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('left');
  document.body.style.removeProperty('right');
  document.body.style.removeProperty('width');
  document.body.style.removeProperty('overflow');
  window.scrollTo(0,savedScrollY);
}

function forcePhotoModal(){
  const modal=document.querySelector('.exercise-modal');
  if(!modal){unlockPage();return}
  lockPage();
  const card=modal.querySelector('.exercise-modal-card');
  const pair=modal.querySelector('.modal-pose-pair');
  modal.style.setProperty('position','fixed','important');
  modal.style.setProperty('inset','0','important');
  modal.style.setProperty('width','100vw','important');
  modal.style.setProperty('height','100dvh','important');
  modal.style.setProperty('overflow','hidden','important');
  if(card){
    card.style.setProperty('display','grid','important');
    card.style.setProperty('grid-template-rows','auto minmax(0,1fr)','important');
    card.style.setProperty('width','100vw','important');
    card.style.setProperty('height','100dvh','important');
    card.style.setProperty('max-height','none','important');
    card.style.setProperty('overflow','hidden','important');
  }
  if(pair){
    pair.style.setProperty('display','grid','important');
    pair.style.setProperty('grid-template-columns','minmax(0,1fr) minmax(0,1fr)','important');
    pair.style.setProperty('grid-template-rows','minmax(0,1fr)','important');
    pair.style.setProperty('width','100%','important');
    pair.style.setProperty('height','100%','important');
    pair.style.setProperty('min-height','0','important');
    pair.style.setProperty('overflow','hidden','important');
  }
  pair?.querySelectorAll(':scope > figure').forEach(figure=>{
    figure.style.setProperty('height','100%','important');
    figure.style.setProperty('min-height','0','important');
    figure.style.setProperty('overflow','hidden','important');
  });
  pair?.querySelectorAll('img').forEach(img=>{
    img.style.setProperty('width','100%','important');
    img.style.setProperty('height','100%','important');
    img.style.setProperty('min-height','0','important');
    img.style.setProperty('object-fit','contain','important');
  });
  const text=card?.querySelector('p');if(text)text.style.setProperty('display','none','important');
}

function stopModalScroll(event){
  if(document.querySelector('.exercise-modal'))event.preventDefault();
}
document.addEventListener('touchmove',stopModalScroll,{passive:false,capture:true});
document.addEventListener('wheel',stopModalScroll,{passive:false,capture:true});
const observer=new MutationObserver(()=>requestAnimationFrame(forcePhotoModal));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',()=>requestAnimationFrame(forcePhotoModal),true);
forcePhotoModal();
