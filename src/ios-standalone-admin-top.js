const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
const isStandalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

if(isIOS&&isStandalone){
  document.documentElement.dataset.mayfitIosStandalone='1';
  const style=document.createElement('style');
  style.id='mayfit-ios-standalone-admin-top-v2';
  style.textContent=`
@media(max-width:620px){
  html[data-mayfit-ios-standalone="1"] body.mayfit-tab-inicio .app:has([data-admin-return])>header.mayfit-reference-header{
    min-height:120px!important;
    padding-top:max(84px,calc(env(safe-area-inset-top,0px) + 28px))!important;
    padding-bottom:12px!important;
  }
}
`;
  document.head.appendChild(style);
}
