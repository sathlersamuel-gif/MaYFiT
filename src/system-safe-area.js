const root=document.documentElement;

function px(value){
  const number=Number.parseFloat(value);
  return Number.isFinite(number)?Math.max(0,number):0;
}

function readCssLength(expression){
  const probe=document.createElement('div');
  probe.style.cssText=`position:fixed;visibility:hidden;pointer-events:none;padding-bottom:${expression};`;
  document.body.appendChild(probe);
  const value=px(getComputedStyle(probe).paddingBottom);
  probe.remove();
  return value;
}

function nativeBottom(){
  return px(getComputedStyle(root).getPropertyValue('--mayfit-native-bottom'));
}

function viewportBottomGap(){
  const viewport=window.visualViewport;
  if(!viewport)return 0;
  return Math.max(0,window.innerHeight-(viewport.height+viewport.offsetTop));
}

function isAndroid(){return /Android/i.test(navigator.userAgent||'')}
function isAndroidWebView(){
  const userAgent=navigator.userAgent||'';
  return isAndroid()&&(/\bwv\b/i.test(userAgent)||/;\s*wv\)/i.test(userAgent)||Boolean(window.Capacitor));
}
function isStandalone(){
  return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true||Boolean(window.Capacitor?.isNativePlatform?.())||isAndroidWebView();
}

function installAndroidNavInsetStyle(){
  if(document.getElementById('mayfit-android-nav-inset-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-android-nav-inset-style';
  style.textContent=`
html[data-mayfit-android="1"] .app>nav{
  bottom:var(--mayfit-safe-bottom)!important;
  margin-bottom:0!important;
  padding-bottom:11px!important;
  min-height:72px!important;
  background:#070807!important;
  border-top:1px solid #293d30!important;
}
html[data-mayfit-android="1"] body.mayfit-tab-inicio .app>nav{
  bottom:var(--mayfit-safe-bottom)!important;
  margin-bottom:0!important;
  padding-bottom:10px!important;
}
html[data-mayfit-android="1"] body.mayfit-tab-inicio .app>main{
  padding-bottom:calc(96px + var(--mayfit-safe-bottom))!important;
}
@media(max-width:620px){
  html[data-mayfit-android="1"] body.mayfit-tab-inicio .app>nav{
    bottom:var(--mayfit-safe-bottom)!important;
    margin-bottom:0!important;
    padding-bottom:7px!important;
  }
  html[data-mayfit-android="1"] body.mayfit-tab-inicio .app>main{
    padding-bottom:calc(104px + var(--mayfit-safe-bottom))!important;
  }
}`;
  document.head.appendChild(style);
}

function resolveBottomInset(){
  const native=nativeBottom();
  const cssSafe=readCssLength('env(safe-area-inset-bottom,0px)');
  const viewportGap=viewportBottomGap();
  let bottom=Math.max(native,cssSafe,viewportGap);

  // Alguns WebViews Android/MIUI/HyperOS não expõem corretamente a barra de 3 botões.
  // Reserva uma altura segura apenas no app/standalone quando a leitura nativa vier pequena.
  if(isAndroid()&&isStandalone()&&bottom<24)bottom=64;

  return Math.round(bottom);
}

function apply(){
  installAndroidNavInsetStyle();
  const bottom=resolveBottomInset();
  root.style.setProperty('--mayfit-runtime-bottom',`${bottom}px`);
  root.dataset.mayfitBottomInset=String(bottom);
  root.dataset.mayfitAndroid=isAndroid()?'1':'0';
  root.dataset.mayfitAndroidWebview=isAndroidWebView()?'1':'0';
}

let raf=0;
function schedule(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>requestAnimationFrame(apply));
}

window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('orientationchange',schedule,{passive:true});
window.addEventListener('pageshow',schedule,{passive:true});
window.addEventListener('focus',schedule,{passive:true});
window.addEventListener('mayfit-native-insets',schedule);
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('scroll',schedule,{passive:true});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
setTimeout(schedule,250);
setTimeout(schedule,1000);
