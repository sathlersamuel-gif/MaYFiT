const style=document.createElement('style');
style.id='mayfit-reference-responsive-fix';
style.textContent=`
:root{--mayfit-safe-top:max(16px,env(safe-area-inset-top));--mayfit-safe-bottom:max(12px,env(safe-area-inset-bottom))}
.app{width:100%!important;min-width:0!important;overflow-x:hidden!important}
.app>header.mayfit-reference-header{
  min-height:76px!important;
  box-sizing:border-box!important;
  padding:calc(var(--mayfit-safe-top) + 8px) clamp(16px,4.5vw,28px) 18px!important;
  gap:14px!important;
}
.mayfit-reference-logo{
  min-width:0!important;
  font-size:clamp(32px,10vw,42px)!important;
  line-height:1!important;
  letter-spacing:clamp(-3px,-.6vw,-1px)!important;
}
.mayfit-header-actions{flex:0 0 auto!important;gap:clamp(8px,3vw,18px)!important}
.mayfit-header-actions button{
  width:clamp(40px,11vw,46px)!important;
  height:clamp(40px,11vw,46px)!important;
  min-width:40px!important;
  min-height:40px!important;
  padding:7px!important;
  touch-action:manipulation!important;
}
.app>main.mayfit-reference-home{
  box-sizing:border-box!important;
  width:100%!important;
  min-width:0!important;
  padding:0 clamp(12px,4vw,24px) calc(108px + var(--mayfit-safe-bottom))!important;
}
#mayfit-motivation-banner{
  min-height:clamp(190px,42vw,262px)!important;
  border-radius:clamp(18px,5vw,26px)!important;
  margin-bottom:clamp(16px,4vw,28px)!important;
}
#mayfit-motivation-banner>div{left:clamp(20px,6vw,42px)!important;top:clamp(28px,8vw,48px)!important;right:18px!important}
#mayfit-motivation-banner strong{font-size:clamp(18px,5vw,27px)!important}
#mayfit-motivation-banner h2{font-size:clamp(40px,12vw,57px)!important}
#mayfit-motivation-banner p{max-width:62%!important;font-size:clamp(13px,4vw,18px)!important;line-height:1.35!important}
#mayfit-motivation-banner span{width:clamp(42px,12vw,64px)!important;margin:clamp(14px,4vw,22px) 0 clamp(16px,5vw,28px)!important}
#mayfit-feature-grid{gap:clamp(10px,3vw,16px)!important;margin-bottom:clamp(14px,4vw,20px)!important}
#mayfit-feature-grid>.mayfit-feature-card{
  min-height:clamp(270px,48vw,360px)!important;
  padding:clamp(16px,4vw,26px) clamp(14px,4vw,26px) clamp(16px,4vw,22px)!important;
  border-radius:clamp(18px,5vw,24px)!important;
}
#mayfit-feature-grid .mayfit-feature-card .mayfit-feature-icon{width:clamp(68px,17vw,100px)!important;height:clamp(68px,17vw,100px)!important;margin-bottom:clamp(12px,4vw,18px)!important}
#mayfit-feature-grid .mayfit-feature-icon svg{width:54%!important;height:54%!important}
#mayfit-feature-grid .mayfit-feature-arrow{right:14px!important;top:14px!important;font-size:clamp(30px,9vw,42px)!important}
#mayfit-feature-grid h2,#mayfit-feature-grid h3,#mayfit-feature-grid strong{font-size:clamp(17px,5vw,24px)!important;line-height:1.18!important;margin-bottom:10px!important}
#mayfit-feature-grid p{font-size:clamp(13px,3.8vw,17px)!important;line-height:1.4!important;margin-bottom:14px!important}
#mayfit-feature-grid button{
  min-height:clamp(50px,14vw,64px)!important;
  padding:10px 12px!important;
  font-size:clamp(14px,4vw,18px)!important;
  line-height:1.15!important;
  white-space:normal!important;
  touch-action:manipulation!important;
}
.mayfit-reference-hero{
  box-sizing:border-box!important;
  min-width:0!important;
  min-height:clamp(350px,78vw,420px)!important;
  padding:clamp(24px,6vw,40px) clamp(16px,5vw,32px) clamp(20px,5vw,26px)!important;
  border-radius:clamp(18px,5vw,26px)!important;
}
.mayfit-reference-hero>span{font-size:clamp(14px,4vw,18px)!important}
.mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{
  width:min(100%,430px)!important;
  max-width:68%!important;
  min-width:0!important;
  display:flex!important;
  flex-wrap:wrap!important;
  align-items:flex-start!important;
  gap:4px 8px!important;
  overflow:visible!important;
  white-space:normal!important;
  word-break:break-word!important;
  overflow-wrap:anywhere!important;
  background:transparent!important;
  box-shadow:none!important;
}
.mayfit-reference-hero .mayfit-workout-name>span{flex:0 0 100%!important;display:block!important;color:var(--mayfit-green)!important;font-size:clamp(16px,4vw,24px)!important;line-height:1.15!important;background:transparent!important}
.mayfit-reference-hero .mayfit-workout-name input{
  display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;flex:1 1 100%!important;
  margin:0!important;padding:2px 0 8px!important;border:0!important;border-bottom:3px solid var(--mayfit-green)!important;
  border-radius:0!important;background:transparent!important;color:#fff!important;box-shadow:none!important;outline:none!important;
  font:950 clamp(26px,7vw,50px)/1.04 system-ui,-apple-system,sans-serif!important;letter-spacing:-1px!important;
  white-space:normal!important;overflow:visible!important;text-overflow:clip!important;appearance:none!important;-webkit-appearance:none!important;
}
.mayfit-reference-hero button.primary{
  min-height:clamp(58px,16vw,78px)!important;
  padding:12px 16px!important;
  font-size:clamp(18px,5.5vw,26px)!important;
  line-height:1.1!important;
  touch-action:manipulation!important;
}
.mayfit-reference-summary{gap:clamp(10px,3vw,16px)!important}
.mayfit-reference-summary article{min-height:clamp(96px,28vw,126px)!important;padding:clamp(14px,4vw,20px)!important;border-radius:clamp(16px,5vw,22px)!important;min-width:0!important}
.mayfit-reference-summary strong{font-size:clamp(28px,8vw,38px)!important}
.mayfit-reference-summary span{font-size:clamp(13px,4vw,17px)!important;line-height:1.25!important}
.app>nav{
  box-sizing:border-box!important;
  width:min(712px,calc(100% - 16px))!important;
  padding:10px clamp(8px,3vw,18px) var(--mayfit-safe-bottom)!important;
  border-radius:18px 18px 0 0!important;
}
.app>nav button{min-width:0!important;min-height:64px!important;padding:6px 4px!important;font-size:clamp(12px,3.5vw,15px)!important;touch-action:manipulation!important}
.app>nav svg{width:clamp(23px,7vw,28px)!important;height:clamp(23px,7vw,28px)!important}
@media(max-width:620px){
  #mayfit-feature-grid{grid-template-columns:1fr 1fr!important}
  .mayfit-reference-hero{background-position:62% center!important}
  .mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{max-width:72%!important;width:72%!important;margin:14px 0 20px!important}
}
@media(max-width:430px){
  #mayfit-feature-grid>.mayfit-feature-card{min-height:280px!important}
  #mayfit-feature-grid .mayfit-feature-card .mayfit-feature-icon{width:66px!important;height:66px!important}
  #mayfit-feature-grid h2,#mayfit-feature-grid h3,#mayfit-feature-grid strong{font-size:17px!important}
  #mayfit-feature-grid p{font-size:13px!important}
  #mayfit-feature-grid button{font-size:14px!important;min-height:50px!important}
  .mayfit-reference-hero{background-position:66% center!important}
  .mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{max-width:76%!important;width:76%!important}
}
@media(max-width:360px){
  .app>header.mayfit-reference-header{padding-left:12px!important;padding-right:12px!important}
  .mayfit-reference-logo{font-size:30px!important}
  .mayfit-header-actions{gap:6px!important}
  .mayfit-header-actions button{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important}
  .app>main.mayfit-reference-home{padding-left:9px!important;padding-right:9px!important}
  #mayfit-feature-grid{gap:8px!important}
  #mayfit-feature-grid>.mayfit-feature-card{padding:14px 11px!important}
  .mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{max-width:82%!important;width:82%!important}
  .mayfit-reference-summary{grid-template-columns:1fr!important}
}
`;
document.head.appendChild(style);
