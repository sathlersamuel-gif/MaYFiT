const STYLE_ID='mayfit-admin-mobile-viewport-fix';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}
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
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
  padding-left:max(12px,env(safe-area-inset-left,0px))!important;
  padding-right:max(12px,env(safe-area-inset-right,0px))!important;
  gap:8px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-logo{
  flex:0 1 auto!important;
  min-width:0!important;
  font-size:clamp(27px,7.4vw,32px)!important;
  letter-spacing:-2.5px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  flex:1 1 auto!important;
  min-width:0!important;
  gap:6px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return]{
  width:auto!important;
  min-width:66px!important;
  max-width:76px!important;
  height:38px!important;
  min-height:38px!important;
  flex:0 0 auto!important;
  padding:0 7px!important;
  gap:4px!important;
  font-size:12px!important;
  border-radius:11px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return] span:first-child{
  font-size:15px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions button:not([data-admin-return]){
  width:32px!important;
  height:32px!important;
  min-width:32px!important;
  min-height:32px!important;
  flex:0 0 32px!important;
  padding:4px!important;
}
body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>main.mayfit-reference-home{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
  overflow-x:hidden!important;
  padding-left:max(12px,env(safe-area-inset-left,0px))!important;
  padding-right:max(12px,env(safe-area-inset-right,0px))!important;
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
@media(max-width:390px){
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .app>header.mayfit-reference-header{
    padding-left:9px!important;
    padding-right:9px!important;
    gap:5px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-reference-logo{
    font-size:27px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions{
    gap:4px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions>[data-admin-return]{
    min-width:61px!important;
    max-width:68px!important;
    padding:0 5px!important;
    font-size:11px!important;
  }
  body.mayfit-admin-preview-mobile.mayfit-tab-inicio .mayfit-header-actions button:not([data-admin-return]){
    width:30px!important;
    height:30px!important;
    min-width:30px!important;
    min-height:30px!important;
    flex-basis:30px!important;
  }
}
`;
  document.head.appendChild(style);
}

function normalizeAdminPreview(){
  const adminReturn=document.querySelector('[data-admin-return]');
  const header=document.querySelector('.app>header.mayfit-reference-header');
  const actions=header?.querySelector('.mayfit-header-actions');
  const isPreview=Boolean(adminReturn&&header&&currentUser()?.role!=='admin');

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
