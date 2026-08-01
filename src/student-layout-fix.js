const style=document.createElement('style');
style.id='mayfit-student-layout-fix';
style.textContent=`
#mse-modal{padding-top:max(12px,env(safe-area-inset-top))!important}
#mse-modal .mse-card{max-height:calc(100dvh - max(24px,env(safe-area-inset-top)))!important}
#mse-modal .mse-top{position:sticky!important;top:0!important;z-index:20!important;align-items:center!important;padding:14px 15px!important;background:#0b130e!important;box-shadow:0 5px 14px rgba(0,0,0,.32)!important}
#mse-modal .mse-top>div{min-width:0!important;flex:1!important}
#mse-modal .mse-top h2{line-height:1.12!important;overflow-wrap:anywhere!important}
#mse-modal .mse-back{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-width:106px!important;height:46px!important;padding:0 14px!important;font-size:15px!important;white-space:nowrap!important}
#mse-modal .mse-search{flex:0 0 auto!important}
#mse-modal .mse-list{overscroll-behavior:contain!important;padding-bottom:max(18px,env(safe-area-inset-bottom))!important}
#mse-modal .mse-action{display:flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;white-space:nowrap!important}
.be-modal .be-top{position:sticky!important;top:0!important;z-index:30!important;padding:10px 0!important;background:#050806!important}
.be-modal .be-close{display:flex!important;align-items:center!important;justify-content:center!important;min-width:105px!important;width:auto!important;padding:0 14px!important;font-size:15px!important;white-space:nowrap!important}
@media(max-width:620px){
  #mse-modal{padding:0!important;align-items:stretch!important}
  #mse-modal .mse-card{width:100%!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important}
  #mse-modal .mse-top{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;padding:max(14px,env(safe-area-inset-top)) 14px 12px!important}
  #mse-modal .mse-back{width:100%!important;min-width:0!important;order:2!important;background:#17341f!important;border-color:#4b7857!important;color:#a4f768!important}
  #mse-modal .mse-search{margin:12px 14px!important}
  #mse-modal .mse-list{padding:0 12px max(22px,env(safe-area-inset-bottom))!important}
  #mse-modal .mse-item{grid-template-columns:58px minmax(0,1fr)!important;gap:9px!important}
  #mse-modal .mse-thumb{width:58px!important;height:50px!important}
  #mse-modal .mse-action{grid-column:1/-1!important;width:100%!important;margin-top:2px!important;min-height:42px!important;font-size:14px!important}
  .be-modal .be-top{padding:max(10px,env(safe-area-inset-top)) 0 10px!important}
  .be-modal .be-close{min-width:100px!important;height:44px!important}
}
`;
if(!document.getElementById(style.id))document.head.appendChild(style);
