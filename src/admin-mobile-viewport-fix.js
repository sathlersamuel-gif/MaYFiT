const STYLE_ID='mayfit-admin-mobile-viewport-fix';

function isIosStandalone(){
  const isiOS=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  return isiOS&&(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true);
}

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
body.mayfit-admin-preview-mobile.mayfit-tab-inicio{
  width:100%!important;
  max-width:100vw!important;
  overflow-x:hidden!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app{
  width:100%!important;
  max-width:100vw!important;
  min-width:0!important;
  margin:0 auto!important;
  overflow-x:hidden!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>header.mayfit-reference-header{
  width:100%!important;
  max-width:100vw!important;
  min-width:0!important;
  box-sizing:border-box!important;
  padding-top:calc(max(12px,var(--mayfit-safe-top,env(safe-area-inset-top,0px))) + 6px)!important;
  padding-left:max(10px,env(safe-area-inset-left,0px))!important;
  padding-right:max(10px,env(safe-area-inset-right,0px))!important;
  padding-bottom:10px!important;
  gap:6px!important;
  overflow:hidden!important;
}
html[data-mayfit-ios-standalone="1"] body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>header.mayfit-reference-header{
  padding-top:max(64px,calc(env(safe-area-inset-top,0px) + 8px))!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-logo{
  flex:0 1 auto!important;
  min-width:0!important;
  max-width:30%!important;
  font-size:clamp(25px,7vw,31px)!important;
  letter-spacing:-2.5px!important;
  white-space:nowrap!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  flex:1 1 auto!important;
  min-width:0!important;
  max-width:70%!important;
  gap:4px!important;
  overflow:hidden!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return]{
  width:auto!important;
  min-width:58px!important;
  max-width:68px!important;
  height:36px!important;
  min-height:36px!important;
  flex:0 0 auto!important;
  padding:0 5px!important;
  gap:3px!important;
  font-size:11px!important;
  border-radius:10px!important;
  white-space:nowrap!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return] span:first-child{
  font-size:14px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions button:not([data-admin-return]){
  width:30px!important;
  height:30px!important;
  min-width:30px!important;
  min-height:30px!important;
  flex:0 0 30px!important;
  padding:3px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>main.mayfit-reference-home{
  width:100%!important;
  max-width:100vw!important;
  min-width:0!important;
  box-sizing:border-box!important;
  overflow-x:hidden!important;
  padding-left:max(10px,env(safe-area-inset-left,0px))!important;
  padding-right:max(10px,env(safe-area-inset-right,0px))!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio #mayfit-feature-grid,
body.mayfit-admin-preview-mobile.mayfit-tab-inicio #mayfit-motivation-banner,
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-hero,
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-summary{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio #mayfit-feature-grid>* ,
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-summary>*{
  min-width:0!important;
  max-width:100%!important;
  box-sizing:border-box!important;
}
@media(max-width:390px){
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>header.mayfit-reference-header{
    padding-left:8px!important;
    padding-right:8px!important;
    gap:3px!important;
  }
  html[data-mayfit-ios-standalone="1"] body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>header.mayfit-reference-header{
    padding-top:max(64px,calc(env(safe-area-inset-top,0px) + 8px))!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-logo{
    max-width:28%!important;
    font-size:24px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions{
    max-width:72%!important;
    gap:3px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return]{
    min-width:55px!important;
    max-width:62px!important;
    height:34px!important;
    min-height:34px!important;
    padding:0 4px!important;
    font-size:10px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions button:not([data-admin-return]){
    width:28px!important;
    height:28px!important;
    min-width:28px!important;
    min-height:28px!important;
    flex-basis:28px!important;
  }
}
`;
  document.head.appendChild(style);
}

function normalizeAdminPreview(){
  const adminReturn=document.querySelector('[data-admin-return]');
  const header=document.querySelector('.app>header.mayfit-reference-header');
  const actions=header?.querySelector('.mayfit-header-actions');
  const isPreview=Boolean(adminReturn&&header);

  document.documentElement.dataset.mayfitIosStandalone=isIosStandalone()?'1':'0';
  document.body.classList.toggle('mayfit-admin-preview-mobile',isPreview);
  if(!isPreview||!actions)return;

  if(adminReturn.parentElement!==actions){
    const settings=actions.querySelector('[data-mayfit-settings]');
    if(settings)actions.insertBefore(adminReturn,settings);
    else actions.appendChild(adminReturn);
  }
}

installStyle();
normalizeAdminPreview();

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    normalizeAdminPreview();
  });
}

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('resize',schedule,{passive:true});
