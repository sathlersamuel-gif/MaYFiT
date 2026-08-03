const style=document.createElement('style');
style.id='mayfit-reference-mobile-exact';
style.textContent=`
@media (max-width:620px){
  body.mayfit-tab-inicio{overflow-x:hidden!important}
  body.mayfit-tab-inicio .app{width:100%!important;max-width:none!important;min-height:100dvh!important}
  body.mayfit-tab-inicio .app>header.mayfit-reference-header{
    min-height:58px!important;
    padding:max(10px,env(safe-area-inset-top)) 18px 8px!important;
    box-sizing:border-box!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-logo{
    font-size:30px!important;
    letter-spacing:-2px!important;
  }
  body.mayfit-tab-inicio .mayfit-header-actions{gap:10px!important}
  body.mayfit-tab-inicio .mayfit-header-actions button{
    width:32px!important;height:32px!important;min-width:32px!important;padding:4px!important
  }
  body.mayfit-tab-inicio .app>main.mayfit-reference-home{
    padding:0 12px 76px!important;
  }
  body.mayfit-tab-inicio #mayfit-motivation-banner{
    min-height:132px!important;height:132px!important;
    margin:4px 0 12px!important;
    border-radius:14px!important;
    background-position:64% center!important;
  }
  body.mayfit-tab-inicio #mayfit-motivation-banner>div{
    left:18px!important;top:23px!important;max-width:58%!important
  }
  body.mayfit-tab-inicio #mayfit-motivation-banner strong{font-size:14px!important;line-height:1!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner h2{font-size:32px!important;line-height:.92!important;margin:4px 0!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner span{width:32px!important;height:2px!important;margin:10px 0 12px!important}
  body.mayfit-tab-inicio #mayfit-motivation-banner p{font-size:10px!important;line-height:1.25!important;white-space:nowrap!important}

  body.mayfit-tab-inicio #mayfit-feature-grid{
    display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0 0 10px!important
  }
  body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{
    min-height:190px!important;height:190px!important;
    padding:12px 12px 10px!important;border-radius:14px!important
  }
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon{
    width:54px!important;height:54px!important;margin:0 0 9px!important
  }
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon svg{width:30px!important;height:30px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-arrow{right:9px!important;top:8px!important;font-size:25px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid h2,
  body.mayfit-tab-inicio #mayfit-feature-grid h3,
  body.mayfit-tab-inicio #mayfit-feature-grid strong{
    font-size:14px!important;line-height:1.12!important;margin:0 0 6px!important
  }
  body.mayfit-tab-inicio #mayfit-feature-grid p{
    font-size:10.5px!important;line-height:1.35!important;margin:0 0 8px!important
  }
  body.mayfit-tab-inicio #mayfit-feature-grid button{
    min-height:34px!important;height:34px!important;padding:4px 6px!important;
    border-radius:7px!important;font-size:11px!important;line-height:1.05!important
  }

  body.mayfit-tab-inicio .mayfit-reference-hero{
    min-height:228px!important;height:228px!important;
    margin:0 0 10px!important;padding:18px 16px 12px!important;
    border-radius:14px!important;background-position:66% center!important;
    display:flex!important;flex-direction:column!important
  }
  body.mayfit-tab-inicio .mayfit-reference-hero>span{font-size:11px!important;letter-spacing:1.2px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero h1,
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name{
    width:62%!important;max-width:62%!important;margin:8px 0 8px!important;gap:2px!important
  }
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name>span{font-size:12px!important;line-height:1!important}
  body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name input{
    font-size:22px!important;line-height:1!important;padding:1px 0 4px!important;border-bottom-width:2px!important
  }
  body.mayfit-tab-inicio .mayfit-hero-stats{
    width:58%!important;grid-template-columns:1fr 1fr!important;gap:5px!important;margin:0 0 8px!important
  }
  body.mayfit-tab-inicio .mayfit-hero-stat{
    min-height:35px!important;height:35px!important;grid-template-columns:20px minmax(0,1fr)!important;
    gap:4px!important;padding:4px 6px!important;border-radius:8px!important
  }
  body.mayfit-tab-inicio .mayfit-hero-stat svg{width:18px!important;height:18px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat strong{font-size:11px!important}
  body.mayfit-tab-inicio .mayfit-hero-stat span{font-size:8px!important;margin-top:1px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero button.primary{
    min-height:39px!important;height:39px!important;margin-top:auto!important;
    border-radius:8px!important;font-size:15px!important;flex:0 0 auto!important
  }

  body.mayfit-tab-inicio .mayfit-reference-summary{
    gap:8px!important;margin:0!important
  }
  body.mayfit-tab-inicio .mayfit-reference-summary article{
    min-height:66px!important;height:66px!important;padding:9px 11px!important;border-radius:13px!important
  }
  body.mayfit-tab-inicio .mayfit-reference-summary article svg{width:27px!important;height:27px!important}
  body.mayfit-tab-inicio .mayfit-reference-summary strong{font-size:22px!important;line-height:1!important}
  body.mayfit-tab-inicio .mayfit-reference-summary span{font-size:10px!important;line-height:1.15!important}

  body.mayfit-tab-inicio .app>nav{
    width:calc(100% - 24px)!important;
    min-height:62px!important;height:auto!important;
    padding:6px 10px max(6px,env(safe-area-inset-bottom))!important;
    border-radius:14px 14px 0 0!important
  }
  body.mayfit-tab-inicio .app>nav button{
    min-height:48px!important;font-size:10px!important;gap:2px!important
  }
  body.mayfit-tab-inicio .app>nav svg{width:21px!important;height:21px!important}
  body.mayfit-tab-inicio .app>nav button.active::after{width:22px!important;height:2px!important;bottom:1px!important}
}
@media (max-width:360px){
  body.mayfit-tab-inicio .app>main.mayfit-reference-home{padding-left:9px!important;padding-right:9px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid{gap:6px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{padding-left:9px!important;padding-right:9px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid h2,
  body.mayfit-tab-inicio #mayfit-feature-grid h3,
  body.mayfit-tab-inicio #mayfit-feature-grid strong{font-size:13px!important}
  body.mayfit-tab-inicio #mayfit-feature-grid p{font-size:9.5px!important}
  body.mayfit-tab-inicio .mayfit-reference-hero{height:220px!important;min-height:220px!important}
}
`;
document.head.appendChild(style);
