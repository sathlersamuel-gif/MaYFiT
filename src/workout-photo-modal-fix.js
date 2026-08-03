const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
html.mayfit-workout-zoom-open,html.mayfit-workout-zoom-open body{overflow:hidden!important;overscroll-behavior:none!important}
.mayfit-workout-image-zoom{position:fixed!important;inset:0!important;z-index:400000!important;display:grid!important;place-items:center!important;width:100vw!important;height:100dvh!important;padding:max(14px,env(safe-area-inset-top)) 12px max(14px,env(safe-area-inset-bottom))!important;background:rgba(0,0,0,.96)!important;overflow:hidden!important;box-sizing:border-box!important;overscroll-behavior:none!important;touch-action:none!important}
.mayfit-workout-image-card{position:relative!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;width:min(920px,100%)!important;height:min(760px,100%)!important;max-height:100%!important;padding:54px 8px 8px!important;border:1px solid #49664f!important;border-radius:18px!important;background:#07100a!important;overflow:hidden!important;box-sizing:border-box!important}
.mayfit-workout-image-title{position:absolute!important;top:16px!important;left:16px!important;right:72px!important;margin:0!important;color:#fff!important;font:900 18px/1.2 system-ui,-apple-system,sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.mayfit-workout-image-close{position:absolute!important;top:10px!important;right:10px!important;z-index:2!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;margin:0!important;padding:0!important;border:1px solid #49664f!important;border-radius:13px!important;background:#17231b!important;color:#fff!important;font:900 24px/1 system-ui,-apple-system,sans-serif!important;touch-action:manipulation!important}
.mayfit-workout-image-pair{min-height:0!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;height:100%!important;border:1px solid #3b5142!important;border-radius:14px!important;background:#050706!important;overflow:hidden!important}
.mayfit-workout-image-pair figure{position:relative!important;min-width:0!important;min-height:0!important;height:100%!important;margin:0!important;background:#fff!important;overflow:hidden!important}
.mayfit-workout-image-pair figure+figure{border-left:1px solid #3b5142!important}
.mayfit-workout-image-pair b{position:absolute!important;inset:0 0 auto 0!important;z-index:2!important;display:grid!important;place-items:center!important;height:32px!important;background:#111512!important;color:#fff!important;font:950 11px/1 system-ui,-apple-system,sans-serif!important}
.mayfit-workout-image-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.mayfit-workout-image-pair img{display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;padding-top:32px!important;object-fit:contain!important;object-position:center!important;background:#fff!important;box-sizing:border-box!important;pointer-events:none!important;user-select:none!important;-webkit-user-drag:none!important}
@media(max-width:620px){.mayfit-workout-image-zoom{padding:0!important}.mayfit-workout-image-card{width:100%!important;height:100dvh!important;max-height:100dvh!important;border:0!important;border-radius:0!important;padding:max(54px,calc(env(safe-area-inset-top) + 44px)) 6px max(6px,env(safe-area-inset-bottom))!important}.mayfit-workout-image-title{top:max(16px,env(safe-area-inset-top))!important;font-size:17px!important}.mayfit-workout-image-close{top:max(8px,env(safe-area-inset-top))!important;right:8px!important}}
`;
document.head.appendChild(style);

let savedScrollY=0;

function lockPage(){
  savedScrollY=window.scrollY||0;
  document.documentElement.classList.add('mayfit-workout-zoom-open');
  document.body.style.setProperty('position','fixed','important');
  document.body.style.setProperty('top',`-${savedScrollY}px`,'important');
  document.body.style.setProperty('left','0','important');
  document.body.style.setProperty('right','0','important');
  document.body.style.setProperty('width','100%','important');
}

function unlockPage(){
  document.documentElement.classList.remove('mayfit-workout-zoom-open');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('left');
  document.body.style.removeProperty('right');
  document.body.style.removeProperty('width');
  window.scrollTo(0,savedScrollY);
}

function closeZoom(){
  document.querySelector('.mayfit-workout-image-zoom')?.remove();
  document.querySelector('.exercise-modal')?.remove();
  unlockPage();
}

function openZoom(photo){
  const images=[...photo.querySelectorAll('.pose-pair img')].slice(0,2);
  if(images.length<2)return;
  closeZoom();
  const row=photo.closest('.sheet-row');
  const title=row?.querySelector('.exercise-col>strong')?.textContent?.trim()||'Exercício';
  const zoom=document.createElement('div');
  zoom.className='mayfit-workout-image-zoom';
  zoom.innerHTML=`<div class="mayfit-workout-image-card"><h2 class="mayfit-workout-image-title"></h2><button type="button" class="mayfit-workout-image-close" aria-label="Fechar">×</button><div class="mayfit-workout-image-pair"><figure><b>INÍCIO</b><img alt="Início do exercício"></figure><figure><b>FINAL</b><img alt="Final do exercício"></figure></div></div>`;
  zoom.querySelector('.mayfit-workout-image-title').textContent=title;
  const targetImages=zoom.querySelectorAll('img');
  targetImages[0].src=images[0].currentSrc||images[0].src;
  targetImages[1].src=images[1].currentSrc||images[1].src;
  zoom.querySelector('.mayfit-workout-image-close').addEventListener('click',closeZoom);
  zoom.addEventListener('click',event=>{if(event.target===zoom)closeZoom()});
  zoom.addEventListener('touchmove',event=>event.preventDefault(),{passive:false});
  document.body.appendChild(zoom);
  lockPage();
}

function interceptWorkoutPhoto(event){
  const photo=event.target.closest?.('.workout-screen .exercise-photo');
  if(!photo)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openZoom(photo);
}

document.addEventListener('click',interceptWorkoutPhoto,true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.mayfit-workout-image-zoom'))closeZoom()});
