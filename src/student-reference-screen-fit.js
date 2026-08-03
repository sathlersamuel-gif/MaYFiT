const style=document.createElement('style');
style.id='mayfit-reference-screen-fit';
style.textContent=`
@media (max-width:620px){
  html,body{min-height:0!important;height:auto!important;background:#000!important}
  body.mayfit-tab-inicio{padding:0!important;overflow-x:hidden!important}
  body.mayfit-tab-inicio .app{
    min-height:0!important;
    height:auto!important;
    padding-bottom:0!important;
  }
  body.mayfit-tab-inicio .app>main.mayfit-reference-home{
    padding-bottom:10px!important;
    min-height:0!important;
    height:auto!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-summary{
    margin-bottom:10px!important;
  }
  body.mayfit-tab-inicio .app>nav{
    position:relative!important;
    left:auto!important;
    right:auto!important;
    bottom:auto!important;
    transform:none!important;
    width:calc(100% - 24px)!important;
    min-height:66px!important;
    height:66px!important;
    margin:0 12px 8px!important;
    padding:5px 10px!important;
    border-radius:14px!important;
    box-sizing:border-box!important;
  }
  body.mayfit-tab-inicio .app>nav button{
    min-height:54px!important;
    height:54px!important;
    padding:3px 4px!important;
    gap:2px!important;
    font-size:11px!important;
  }
  body.mayfit-tab-inicio .app>nav svg{
    width:22px!important;
    height:22px!important;
  }
  body.mayfit-tab-inicio .app>nav button.active::after{
    bottom:1px!important;
    width:24px!important;
    height:2px!important;
  }
  body.mayfit-tab-inicio .app::after,
  body.mayfit-tab-inicio main::after{
    display:none!important;
    content:none!important;
  }
}
`;
document.head.appendChild(style);
