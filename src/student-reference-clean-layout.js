const style=document.createElement('style');
style.id='mayfit-reference-clean-layout';
style.textContent=`
/* Único layout da tela inicial do aluno. Substitui os ajustes acumulados anteriores. */
html,body{margin:0!important;min-height:0!important;height:auto!important;background:#000!important}
body.mayfit-tab-inicio{overflow-x:hidden!important;background:#000!important}
body.mayfit-tab-inicio .app{
  width:100%!important;
  max-width:760px!important;
  min-height:0!important;
  height:auto!important;
  margin:0 auto!important;
  padding:0!important;
  background:#000!important;
  overflow:visible!important;
}
body.mayfit-tab-inicio .app>header.mayfit-reference-header{
  min-height:82px!important;
  height:auto!important;
  box-sizing:border-box!important;
  padding:calc(max(12px,env(safe-area-inset-top)) + 8px) 24px 16px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
}
body.mayfit-tab-inicio .mayfit-reference-logo{
  font-size:clamp(34px,8vw,43px)!important;
  line-height:1!important;
  letter-spacing:-3px!important;
}
body.mayfit-tab-inicio .mayfit-header-actions{gap:12px!important}
body.mayfit-tab-inicio .mayfit-header-actions button{
  width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;padding:6px!important
}
body.mayfit-tab-inicio .app>main.mayfit-reference-home{
  width:100%!important;
  min-height:0!important;
  height:auto!important;
  box-sizing:border-box!important;
  padding:0 24px 12px!important;
  background:#000!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner{
  height:260px!important;min-height:260px!important;
  margin:0 0 22px!important;border-radius:24px!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner>div{left:40px!important;top:45px!important;max-width:58%!important}
body.mayfit-tab-inicio #mayfit-motivation-banner strong{font-size:27px!important}
body.mayfit-tab-inicio #mayfit-motivation-banner h2{font-size:56px!important;line-height:.95!important}
body.mayfit-tab-inicio #mayfit-motivation-banner span{width:64px!important;margin:20px 0 25px!important}
body.mayfit-tab-inicio #mayfit-motivation-banner p{font-size:18px!important;white-space:nowrap!important}
body.mayfit-tab-inicio #mayfit-feature-grid{
  display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;margin:0 0 20px!important
}
body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{
  height:376px!important;min-height:376px!important;
  padding:22px 24px 20px!important;border-radius:24px!important;box-sizing:border-box!important
}
body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon{width:100px!important;height:100px!important;margin-bottom:18px!important}
body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon svg{width:55px!important;height:55px!important}
body.mayfit-tab-inicio #mayfit-feature-grid h2,
body.mayfit-tab-inicio #mayfit-feature-grid h3,
body.mayfit-tab-inicio #mayfit-feature-grid strong{font-size:24px!important;line-height:1.15!important;margin:0 0 12px!important}
body.mayfit-tab-inicio #mayfit-feature-grid p{font-size:17px!important;line-height:1.42!important;margin:0 0 14px!important}
body.mayfit-tab-inicio #mayfit-feature-grid button{height:64px!important;min-height:64px!important;font-size:18px!important;margin-top:auto!important}
body.mayfit-tab-inicio .mayfit-reference-hero{
  height:420px!important;min-height:420px!important;
  margin:0 0 18px!important;padding:34px 30px 24px!important;border-radius:25px!important;
  display:flex!important;flex-direction:column!important;box-sizing:border-box!important
}
body.mayfit-tab-inicio .mayfit-reference-hero>span{font-size:18px!important}
body.mayfit-tab-inicio .mayfit-reference-hero h1,
body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name{width:60%!important;max-width:60%!important;margin:14px 0 18px!important}
body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name>span{font-size:22px!important}
body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name input{font-size:clamp(34px,6vw,48px)!important;line-height:1.02!important}
body.mayfit-tab-inicio .mayfit-hero-stats{width:min(100%,360px)!important;margin:0 0 18px!important}
body.mayfit-tab-inicio .mayfit-reference-hero button.primary{
  height:76px!important;min-height:76px!important;margin-top:auto!important;margin-bottom:0!important;font-size:25px!important
}
body.mayfit-tab-inicio .mayfit-reference-summary{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;margin:0 0 14px!important}
body.mayfit-tab-inicio .mayfit-reference-summary article{height:128px!important;min-height:128px!important;padding:18px 20px!important;border-radius:22px!important;box-sizing:border-box!important}
body.mayfit-tab-inicio .mayfit-reference-summary strong{font-size:38px!important}
body.mayfit-tab-inicio .mayfit-reference-summary span{font-size:17px!important}
body.mayfit-tab-inicio .app>nav{
  position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;
  width:calc(100% - 48px)!important;max-width:712px!important;
  min-height:92px!important;height:auto!important;
  margin:0 auto max(8px,env(safe-area-inset-bottom))!important;
  padding:10px 16px max(10px,env(safe-area-inset-bottom))!important;
  border-radius:22px!important;box-sizing:border-box!important
}
body.mayfit-tab-inicio .app>nav button{min-height:64px!important;font-size:16px!important}
body.mayfit-tab-inicio .app>nav svg{width:27px!important;height:27px!important}
body.mayfit-tab-inicio .app::after,
body.mayfit-tab-inicio .app>main::after{display:none!important;content:none!important}

@media(max-width:620px){
  body.mayfit-tab-inicio .app>header.mayfit-reference-header{min-height:68px!important;padding:calc(max(8px,env(safe-area-inset-top)) + 5px) 16px 10px!important}
  body.mayfit-tab-inicio .mayfit-reference-logo{font-size:32px!important}
  body.mayfit-tab-inicio .mayfit-header-actions button{width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;padding:4px!important}
  body.mayfit-tab-inicio .app>main.mayfit-reference-home{padding:0 12px 8px!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner{height:150px!important;min-height:150px!important;margin-bottom:12px!important;border-radius:15px!important;background-position:64% center!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner>div{left:19px!important;top:25px!important;max-width:58%!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner strong{font-size:15px!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner h2{font-size:35px!important;margin:4px 0!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner span{width:35px!important;height:2px!important;margin:11px 0 13px!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner p{font-size:11px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid{gap:8px!important;margin-bottom:10px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{height:205px!important;min-height:205px!important;padding:12px 12px 10px!important;border-radius:14px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon{width:56px!important;height:56px!important;margin-bottom:9px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon svg{width:31px!important;height:31px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-arrow{right:9px!important;top:8px!important;font-size:26px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid h2,
  body.mayfit-tab-inicio #mayfit-feature-grid h3,
  body.mayfit-tab-inicio #mayfit-feature-grid strong{font-size:14px!important;line-height:1.12!important;margin-bottom:6px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid p{font-size:10.5px!important;line-height:1.35!important;margin-bottom:8px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid button{height:36px!important;min-height:36px!important;font-size:11px!important;border-radius:7px!important;padding:4px 6px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero{height:235px!important;min-height:235px!important;margin-bottom:10px!important;padding:18px 16px 12px!important;border-radius:14px!important;background-position:66% center!important}
  body.mayfit-tab-inicio .mayfit-reference-hero>span{font-size:11px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero h1,
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name{width:62%!important;max-width:62%!important;margin:8px 0!important}
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name>span{font-size:12px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name input{font-size:22px!important;line-height:1!important;padding:1px 0 4px!important}
  body.mayfit-tab-inicio .mayfit-hero-stats{width:58%!important;gap:5px!important;margin:0 0 8px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat{height:35px!important;min-height:35px!important;grid-template-columns:20px minmax(0,1fr)!important;gap:4px!important;padding:4px 6px!important;border-radius:8px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat svg{width:18px!important;height:18px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat strong{font-size:11px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat span{font-size:8px!important;margin-top:1px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero button.primary{height:44px!important;min-height:44px!important;font-size:16px!important;border-radius:8px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary{gap:8px!important;margin-bottom:8px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary article{height:70px!important;min-height:70px!important;padding:9px 11px!important;border-radius:13px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary article svg{width:27px!important;height:27px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary strong{font-size:22px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary span{font-size:10px!important}
  body.mayfit-tab-inicio .app>nav{width:calc(100% - 24px)!important;min-height:66px!important;margin:0 12px max(6px,env(safe-area-inset-bottom))!important;padding:5px 10px max(5px,env(safe-area-inset-bottom))!important;border-radius:14px!important}
  body.mayfit-tab-inicio .app>nav button{height:54px!important;min-height:54px!important;font-size:11px!important;gap:2px!important}
  body.mayfit-tab-inicio .app>nav svg{width:22px!important;height:22px!important}
}
`;
document.head.appendChild(style);
