const style=document.createElement('style');
style.id='mayfit-reference-gap-fix';
style.textContent=`
/* Ajuste final: mantém a composição compacta e coloca o rodapé logo após os cards */
body.mayfit-tab-inicio .app{
  min-height:0!important;
  height:auto!important;
  padding-bottom:0!important;
}
body.mayfit-tab-inicio .app>main.mayfit-reference-home{
  min-height:0!important;
  height:auto!important;
  padding-bottom:14px!important;
}
body.mayfit-tab-inicio .mayfit-reference-summary{
  margin-bottom:14px!important;
}
body.mayfit-tab-inicio .app>nav{
  position:relative!important;
  left:auto!important;
  right:auto!important;
  bottom:auto!important;
  transform:none!important;
  width:auto!important;
  max-width:none!important;
  margin:0 24px max(10px,env(safe-area-inset-bottom))!important;
  border-radius:22px!important;
  z-index:20!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero{
  display:flex!important;
  flex-direction:column!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero button.primary{
  margin-top:auto!important;
  margin-bottom:0!important;
}
@media(max-width:620px){
  body.mayfit-tab-inicio .app>main.mayfit-reference-home{
    padding-bottom:10px!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-summary{
    margin-bottom:10px!important;
  }
  body.mayfit-tab-inicio .app>nav{
    width:auto!important;
    min-height:72px!important;
    margin:0 12px max(8px,env(safe-area-inset-bottom))!important;
    padding:8px 12px max(8px,env(safe-area-inset-bottom))!important;
    border-radius:16px!important;
  }
  body.mayfit-tab-inicio .app>nav button{
    min-height:54px!important;
    font-size:12px!important;
  }
  body.mayfit-tab-inicio .app>nav svg{
    width:23px!important;
    height:23px!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-hero{
    min-height:226px!important;
    height:226px!important;
    padding-bottom:12px!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-hero button.primary{
    min-height:42px!important;
    height:42px!important;
  }
}
`;
document.head.appendChild(style);
