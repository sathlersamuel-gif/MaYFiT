function ensureStyle(){
  if(document.getElementById('mayfit-evolution-photo-viewer-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-evolution-photo-viewer-style';
  style.textContent=`
    .mayfit-evolution-photo-viewer{position:fixed;inset:0;z-index:200000;display:flex;flex-direction:column;background:#020403;color:#fff}
    .mayfit-evolution-photo-viewer__top{display:flex;align-items:center;gap:12px;padding:max(14px,env(safe-area-inset-top)) 14px 12px;background:#0a110d;border-bottom:1px solid #294332}
    .mayfit-evolution-photo-viewer__back{min-width:104px;height:44px;border:1px solid #49664f;border-radius:13px;background:#17231b;color:#fff;font:900 15px system-ui,-apple-system,sans-serif}
    .mayfit-evolution-photo-viewer__title{font:850 15px system-ui,-apple-system,sans-serif;color:#c9d5cc}
    .mayfit-evolution-photo-viewer__body{flex:1;min-height:0;display:grid;place-items:center;padding:14px;overflow:auto}
    .mayfit-evolution-photo-viewer img{display:block;max-width:100%;max-height:calc(100dvh - 100px);object-fit:contain;border-radius:12px}
  `;
  document.head.appendChild(style);
}

function closeViewer(viewer){viewer?.remove()}

function openViewer(src){
  ensureStyle();
  document.querySelector('.mayfit-evolution-photo-viewer')?.remove();
  const viewer=document.createElement('section');
  viewer.className='mayfit-evolution-photo-viewer';
  viewer.innerHTML=`<div class="mayfit-evolution-photo-viewer__top"><button type="button" class="mayfit-evolution-photo-viewer__back">← Voltar</button><span class="mayfit-evolution-photo-viewer__title">Foto da evolução</span></div><div class="mayfit-evolution-photo-viewer__body"><img alt="Foto da evolução"></div>`;
  viewer.querySelector('img').src=src;
  viewer.querySelector('.mayfit-evolution-photo-viewer__back').onclick=()=>closeViewer(viewer);
  viewer.addEventListener('click',event=>{if(event.target===viewer.querySelector('.mayfit-evolution-photo-viewer__body'))closeViewer(viewer)});
  document.body.appendChild(viewer);
}

document.addEventListener('click',event=>{
  const image=event.target.closest('.be-gallery img');
  if(!image)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openViewer(image.currentSrc||image.src);
},true);
