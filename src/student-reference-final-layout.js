const style=document.createElement('style');
style.id='mayfit-reference-final-layout';
style.textContent=`
/* Layout final compacto, proporcional à referência enviada */
.app{width:100%!important;max-width:768px!important;min-height:100dvh!important;overflow-x:hidden!important}
.app>header.mayfit-reference-header{
  min-height:96px!important;
  padding:max(18px,env(safe-area-inset-top)) 24px 16px!important;
  box-sizing:border-box!important;
}
.mayfit-reference-logo{font-size:clamp(34px,7vw,44px)!important;line-height:1!important}
.mayfit-header-actions{gap:14px!important}
.mayfit-header-actions button{width:42px!important;height:42px!important;padding:6px!important}

.app>main.mayfit-reference-home{
  padding:0 24px calc(104px + env(safe-area-inset-bottom))!important;
  display:block!important;
}
#mayfit-motivation-banner{
  min-height:260px!important;
  height:260px!important;
  margin:0 0 22px!important;
  border-radius:24px!important;
}
#mayfit-motivation-banner>div{left:42px!important;top:46px!important}
#mayfit-motivation-banner strong{font-size:27px!important}
#mayfit-motivation-banner h2{font-size:56px!important}
#mayfit-motivation-banner p{font-size:18px!important;white-space:nowrap!important}

#mayfit-feature-grid{
  grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
  gap:16px!important;
  margin:0 0 20px!important;
}
#mayfit-feature-grid>.mayfit-feature-card{
  min-height:376px!important;
  height:376px!important;
  padding:22px 24px 20px!important;
  border-radius:24px!important;
}
#mayfit-feature-grid .mayfit-feature-icon{width:102px!important;height:102px!important;margin-bottom:18px!important}
#mayfit-feature-grid .mayfit-feature-icon svg{width:55px!important;height:55px!important}
#mayfit-feature-grid h2,#mayfit-feature-grid h3,#mayfit-feature-grid strong{
  font-size:24px!important;
  line-height:1.15!important;
  margin-bottom:12px!important;
}
#mayfit-feature-grid p{font-size:17px!important;line-height:1.42!important;margin-bottom:14px!important}
#mayfit-feature-grid button{
  min-height:64px!important;
  height:64px!important;
  font-size:18px!important;
  line-height:1.1!important;
  padding:10px 12px!important;
}

.mayfit-reference-hero{
  min-height:420px!important;
  height:420px!important;
  margin:0 0 18px!important;
  padding:36px 30px 24px!important;
  border-radius:25px!important;
  background-position:center!important;
}
.mayfit-reference-hero>span{font-size:18px!important}
.mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{
  width:60%!important;
  max-width:60%!important;
  margin:14px 0 18px!important;
}
.mayfit-reference-hero .mayfit-workout-name>span{font-size:22px!important}
.mayfit-reference-hero .mayfit-workout-name input{
  font-size:clamp(34px,6vw,48px)!important;
  line-height:1.02!important;
  padding-bottom:8px!important;
}
.mayfit-workout-meta{gap:12px!important;margin:0 0 16px!important}
.mayfit-workout-meta>div{min-width:142px!important;min-height:68px!important;padding:10px 14px!important}
.mayfit-reference-hero button.primary{
  min-height:76px!important;
  height:76px!important;
  font-size:25px!important;
}

.mayfit-reference-summary{gap:16px!important;margin:0!important}
.mayfit-reference-summary article{
  min-height:128px!important;
  height:128px!important;
  padding:18px 20px!important;
  border-radius:22px!important;
}
.mayfit-reference-summary strong{font-size:38px!important}
.mayfit-reference-summary span{font-size:17px!important}

.app>nav{
  min-height:92px!important;
  height:auto!important;
  padding:10px 16px max(10px,env(safe-area-inset-bottom))!important;
}
.app>nav button{min-height:64px!important;font-size:16px!important}
.app>nav svg{width:27px!important;height:27px!important}

/* Remove qualquer altura ou margem residual que criou o grande espaço preto */
body.mayfit-tab-inicio .app>main>*:last-child{margin-bottom:0!important}
body.mayfit-tab-inicio .app>main{min-height:0!important;height:auto!important}

@media(max-width:620px){
  .app>header.mayfit-reference-header{min-height:86px!important;padding:max(14px,env(safe-area-inset-top)) 18px 12px!important}
  .mayfit-reference-logo{font-size:clamp(30px,9vw,39px)!important}
  .mayfit-header-actions button{width:38px!important;height:38px!important}
  .app>main.mayfit-reference-home{padding-left:14px!important;padding-right:14px!important}
  #mayfit-motivation-banner{height:210px!important;min-height:210px!important;margin-bottom:16px!important}
  #mayfit-motivation-banner>div{left:24px!important;top:32px!important}
  #mayfit-motivation-banner strong{font-size:clamp(18px,5vw,24px)!important}
  #mayfit-motivation-banner h2{font-size:clamp(40px,12vw,53px)!important}
  #mayfit-motivation-banner p{font-size:clamp(13px,3.8vw,17px)!important}
  #mayfit-feature-grid{gap:10px!important;margin-bottom:14px!important}
  #mayfit-feature-grid>.mayfit-feature-card{height:330px!important;min-height:330px!important;padding:17px 14px 15px!important;border-radius:20px!important}
  #mayfit-feature-grid .mayfit-feature-icon{width:78px!important;height:78px!important;margin-bottom:14px!important}
  #mayfit-feature-grid .mayfit-feature-icon svg{width:42px!important;height:42px!important}
  #mayfit-feature-grid .mayfit-feature-arrow{right:13px!important;top:13px!important;font-size:34px!important}
  #mayfit-feature-grid h2,#mayfit-feature-grid h3,#mayfit-feature-grid strong{font-size:clamp(17px,5.2vw,22px)!important}
  #mayfit-feature-grid p{font-size:clamp(13px,4vw,16px)!important;line-height:1.35!important}
  #mayfit-feature-grid button{height:56px!important;min-height:56px!important;font-size:clamp(14px,4.2vw,17px)!important}
  .mayfit-reference-hero{height:365px!important;min-height:365px!important;padding:27px 18px 20px!important;margin-bottom:14px!important;background-position:58% center!important}
  .mayfit-reference-hero>span{font-size:15px!important}
  .mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{width:64%!important;max-width:64%!important;margin:10px 0 14px!important}
  .mayfit-reference-hero .mayfit-workout-name>span{font-size:18px!important}
  .mayfit-reference-hero .mayfit-workout-name input{font-size:clamp(27px,8vw,37px)!important}
  .mayfit-workout-meta{gap:8px!important}
  .mayfit-workout-meta>div{min-width:0!important;min-height:58px!important;padding:8px 10px!important;font-size:13px!important}
  .mayfit-reference-hero button.primary{height:62px!important;min-height:62px!important;font-size:20px!important}
  .mayfit-reference-summary{gap:10px!important}
  .mayfit-reference-summary article{height:100px!important;min-height:100px!important;padding:14px!important}
  .mayfit-reference-summary strong{font-size:31px!important}
  .mayfit-reference-summary span{font-size:14px!important}
  .app>nav{min-height:82px!important;padding-top:8px!important}
  .app>nav button{min-height:58px!important;font-size:14px!important}
  .app>nav svg{width:24px!important;height:24px!important}
}

@media(max-width:360px){
  #mayfit-feature-grid>.mayfit-feature-card{height:310px!important;min-height:310px!important;padding-left:12px!important;padding-right:12px!important}
  #mayfit-feature-grid .mayfit-feature-icon{width:68px!important;height:68px!important}
  #mayfit-feature-grid h2,#mayfit-feature-grid h3,#mayfit-feature-grid strong{font-size:17px!important}
  #mayfit-feature-grid p{font-size:13px!important}
  #mayfit-feature-grid button{font-size:14px!important}
  .mayfit-reference-hero h1,.mayfit-reference-hero .mayfit-workout-name{width:70%!important;max-width:70%!important}
}
`;
document.head.appendChild(style);
