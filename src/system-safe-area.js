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
function isStandalone(){
  return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true||Boolean(window.Capacitor?.isNativePlatform?.());
}

function resolveBottomInset(){
  const native=nativeBottom();
  const cssSafe=readCssLength('env(safe-area-inset-bottom,0px)');
  const viewportGap=viewportBottomGap();
  let bottom=Math.max(native,cssSafe,viewportGap);

  // Alguns WebViews/PWAs Android não expõem a barra de navegação para CSS nem visualViewport.
  // Nesse único caso usamos uma reserva conservadora em CSS px. Não depende de marca/modelo.
  if(isAndroid()&&isStandalone()&&bottom<12)bottom=56;

  return Math.round(bottom);
}

function apply(){
  const bottom=resolveBottomInset();
  root.style.setProperty('--mayfit-runtime-bottom',`${bottom}px`);
  root.dataset.mayfitBottomInset=String(bottom);
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
