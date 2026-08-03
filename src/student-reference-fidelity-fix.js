const style=document.createElement('style');
style.id='mayfit-reference-fidelity-fix';
style.textContent=`
body.mayfit-tab-inicio .app>header.mayfit-reference-header{
  padding:max(26px,env(safe-area-inset-top)) 24px 22px!important;
}
body.mayfit-tab-inicio .mayfit-reference-logo{
  font-size:clamp(34px,9vw,44px)!important;
  line-height:1!important;
}
body.mayfit-tab-inicio .mayfit-header-actions{
  gap:14px!important;
}
body.mayfit-tab-inicio .mayfit-header-actions button{
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  padding:6px!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner{
  min-height:250px!important;
  margin-bottom:24px!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner>div{
  left:clamp(22px,6vw,42px)!important;
  top:clamp(30px,8vw,48px)!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner strong{
  font-size:clamp(21px,5vw,28px)!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner h2{
  font-size:clamp(46px,12vw,58px)!important;
}
body.mayfit-tab-inicio #mayfit-motivation-banner p{
  font-size:clamp(15px,4vw,18px)!important;
}
body.mayfit-tab-inicio #mayfit-feature-grid{
  gap:14px!important;
}
body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{
  min-height:360px!important;
  padding:22px 22px 20px!important;
}
body.mayfit-tab-inicio #mayfit-feature-grid h2,
body.mayfit-tab-inicio #mayfit-feature-grid h3,
body.mayfit-tab-inicio #mayfit-feature-grid strong{
  font-size:clamp(20px,4.8vw,25px)!important;
}
body.mayfit-tab-inicio #mayfit-feature-grid p{
  font-size:clamp(15px,3.8vw,18px)!important;
}
body.mayfit-tab-inicio #mayfit-feature-grid button{
  min-height:62px!important;
  font-size:clamp(16px,4vw,19px)!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero{
  min-height:420px!important;
  padding:34px 28px 24px!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero>span{
  font-size:clamp(16px,4vw,19px)!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name>span{
  color:var(--mayfit-green)!important;
  font-size:clamp(18px,4.8vw,24px)!important;
  font-weight:900!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero .mayfit-workout-name input{
  font-size:clamp(30px,8vw,50px)!important;
  line-height:1.02!important;
}
body.mayfit-tab-inicio .mayfit-reference-hero button.primary{
  min-height:74px!important;
  font-size:clamp(21px,5.5vw,27px)!important;
}
body.mayfit-tab-inicio .mayfit-hero-stats{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:10px!important;
  width:min(100%,360px)!important;
  margin:4px 0 18px!important;
}
body.mayfit-tab-inicio .mayfit-hero-stat{
  display:grid!important;
  grid-template-columns:38px minmax(0,1fr)!important;
  align-items:center!important;
  gap:8px!important;
  min-height:68px!important;
  padding:10px 12px!important;
  border:1px solid #242925!important;
  border-radius:14px!important;
  background:rgba(7,10,8,.86)!important;
  color:#fff!important;
}
body.mayfit-tab-inicio .mayfit-hero-stat svg{
  width:32px!important;
  height:32px!important;
  stroke:var(--mayfit-green)!important;
  fill:none!important;
  stroke-width:2!important;
}
body.mayfit-tab-inicio .mayfit-hero-stat strong{
  display:block!important;
  font-size:20px!important;
  line-height:1!important;
}
body.mayfit-tab-inicio .mayfit-hero-stat span{
  display:block!important;
  margin-top:4px!important;
  color:#d7d7d7!important;
  font-size:13px!important;
}
body.mayfit-tab-inicio .mayfit-reference-summary article{
  min-height:120px!important;
}
body.mayfit-tab-inicio .app>nav{
  padding:12px 14px max(12px,env(safe-area-inset-bottom))!important;
}
body.mayfit-tab-inicio .app>nav button{
  min-height:68px!important;
  font-size:14px!important;
}
@media(max-width:620px){
  body.mayfit-tab-inicio #mayfit-feature-grid{
    grid-template-columns:1fr 1fr!important;
    gap:10px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{
    min-height:330px!important;
    padding:18px 14px 16px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon{
    width:82px!important;
    height:82px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-icon svg{
    width:46px!important;
    height:46px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid .mayfit-feature-arrow{
    right:12px!important;
    top:12px!important;
    font-size:34px!important;
  }
  body.mayfit-tab-inicio .mayfit-reference-hero{
    min-height:400px!important;
    padding:28px 18px 20px!important;
  }
  body.mayfit-tab-inicio .mayfit-hero-stats{
    width:100%!important;
  }
}
@media(max-width:390px){
  body.mayfit-tab-inicio .app>header.mayfit-reference-header{
    padding-left:16px!important;
    padding-right:16px!important;
  }
  body.mayfit-tab-inicio .mayfit-header-actions button{
    width:38px!important;
    height:38px!important;
    min-width:38px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid>.mayfit-feature-card{
    min-height:310px!important;
  }
  body.mayfit-tab-inicio #mayfit-feature-grid button{
    min-height:56px!important;
    padding:10px 6px!important;
  }
  body.mayfit-tab-inicio .mayfit-hero-stat{
    grid-template-columns:32px minmax(0,1fr)!important;
    padding:8px 9px!important;
  }
  body.mayfit-tab-inicio .mayfit-hero-stat svg{
    width:27px!important;
    height:27px!important;
  }
}
`;
document.head.appendChild(style);

function exerciseCount(){
  try{
    const store=JSON.parse(localStorage.getItem('mayfit_v8')||'null');
    return Array.isArray(store?.exercises)?store.exercises.length:0;
  }catch{return 0}
}

function ensureHeroStats(){
  const hero=document.querySelector('.mayfit-reference-hero');
  if(!hero||document.querySelector('.workout-screen'))return;
  let stats=hero.querySelector('.mayfit-hero-stats');
  if(!stats){
    stats=document.createElement('div');
    stats.className='mayfit-hero-stats';
    stats.innerHTML=`
      <div class="mayfit-hero-stat">
        <svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>
        <div><strong data-exercise-count>0</strong><span>exercícios</span></div>
      </div>
      <div class="mayfit-hero-stat">
        <svg viewBox="0 0 24 24"><path d="m8 3 1.5 3L13 7l-2.5 2.5.7 3.5L8 11.5 4.8 13l.7-3.5L3 7l3.5-1L8 3Z"/><path d="m16 11 1.2 2.4 2.8.8-2 2 .6 2.8-2.6-1.3-2.6 1.3.6-2.8-2-2 2.8-.8L16 11Z"/></svg>
        <div><strong>Tudo</strong><span>editável</span></div>
      </div>`;
    const button=hero.querySelector('button.primary');
    if(button)hero.insertBefore(stats,button);
    else hero.appendChild(stats);
  }
  const count=stats.querySelector('[data-exercise-count]');
  if(count)count.textContent=String(exerciseCount());
}

let scheduled=false;
function apply(){
  scheduled=false;
  if(document.body.classList.contains('mayfit-tab-inicio'))ensureHeroStats();
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>requestAnimationFrame(apply));
}
const observer=new MutationObserver(schedule);
observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('focus',schedule);
window.addEventListener('mayfit-store-updated',schedule);
document.addEventListener('click',event=>{if(event.target.closest('.app>nav button'))setTimeout(schedule,0)},true);
schedule();
