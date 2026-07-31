/* MaYFiT — estrutura aprovada da tela de treino, sem código de alunos. */
(function(){
  'use strict';
  const STYLE_ID='mayfit-approved-workout-style';
  const PAUSE_KEY='mayfit_pause_seconds';
  const clean=t=>String(t||'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toUpperCase();

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .workout-screen{padding-top:max(12px,env(safe-area-inset-top))!important;padding-bottom:calc(112px + env(safe-area-inset-bottom))!important}
      .workout-screen .workout-top{position:relative!important;display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;gap:8px!important;align-items:stretch!important}
      .workout-screen .back-button{display:grid!important;place-items:center!important;min-height:62px!important;border-radius:16px!important}
      .workout-screen .time-strip{display:grid!important;grid-template-columns:auto minmax(0,1fr) 126px!important;align-items:center!important;gap:8px!important;min-height:62px!important;padding:7px 8px!important;border:2px solid #ff4b4b!important;border-radius:16px!important;background:#171b18!important;color:#fff!important;overflow:hidden!important}
      .workout-screen .time-strip>span{font-size:12px!important;font-weight:900!important;color:#fff!important}
      .workout-screen .time-strip input{min-width:0!important;border:0!important;background:transparent!important;color:#ff3b3b!important;text-align:center!important;font-size:34px!important;font-weight:1000!important;font-variant-numeric:tabular-nums!important;text-shadow:0 0 12px rgba(255,45,45,.28)!important}
      .workout-screen .timer-control{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;height:46px!important;margin:0!important;padding:0 8px!important;border-radius:13px!important;box-sizing:border-box!important;white-space:nowrap!important;text-align:center!important;font:900 11px/1 system-ui,-apple-system,sans-serif!important}
      .workout-screen .timer-control.running{animation:mayfitApprovedPulse 1s infinite alternate!important;box-shadow:0 0 24px rgba(84,255,17,.9)!important}
      .workout-screen .timer-control.mayfit-paused{background:#54e600!important;border-color:#9dff45!important;color:#071108!important;box-shadow:0 0 20px rgba(84,230,0,.7)!important}
      .workout-screen .timer-control.mayfit-start{background:#cf252d!important;border-color:#ff6268!important;color:#fff!important}
      .workout-screen .sheet-head{display:grid!important;grid-template-columns:minmax(200px,2fr) minmax(110px,.8fr) minmax(130px,1fr) minmax(110px,.8fr)!important;padding:10px 12px!important;background:#101511!important;border:1px solid #303b33!important;border-radius:14px 14px 0 0!important;color:#9eaaa2!important;font:900 10px system-ui,-apple-system,sans-serif!important;letter-spacing:.7px!important;text-align:center!important}
      .workout-screen .sheet-head span:first-child{text-align:left!important}
      #mayfit-pause-control{display:flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;width:calc(100% - 62px)!important;margin:0 0 14px 62px!important;padding:10px 14px!important;border:1px solid #41634d!important;border-radius:16px!important;background:#101a14!important;color:#fff!important;box-sizing:border-box!important}
      #mayfit-pause-control strong{font:900 13px system-ui,-apple-system,sans-serif!important;white-space:nowrap!important}
      #mayfit-pause-control .pause-stepper{display:flex!important;align-items:center!important;gap:8px!important}
      #mayfit-pause-control button{display:grid!important;place-items:center!important;width:38px!important;height:38px!important;padding:0!important;border:1px solid #3f6749!important;border-radius:12px!important;background:#17341f!important;color:#86e044!important;font:950 22px system-ui,-apple-system,sans-serif!important}
      #mayfit-pause-control input{width:82px!important;height:38px!important;border:1px solid #8b9b90!important;border-radius:12px!important;background:#f7faf8!important;color:#d9262e!important;text-align:center!important;font:950 20px system-ui,-apple-system,sans-serif!important;box-sizing:border-box!important}
      #mayfit-pause-control small{color:#b9c8be!important;font:750 11px system-ui,-apple-system,sans-serif!important;white-space:nowrap!important}
      #mayfit-pause-control.mayfit-counting,#mayfit-pause-control.counting{border-color:#9df20f!important;box-shadow:0 0 18px rgba(141,242,11,.35)!important}
      .workout-screen .sheet-row{transition:background .18s ease,box-shadow .18s ease!important}
      .workout-screen .sheet-row.mayfit-selected{box-shadow:inset 0 0 0 2px #8df20b,inset 0 0 24px rgba(141,242,11,.16)!important}
      .workout-screen .complete-button.mayfit-selected{background:#8df20b!important;border-color:#caff63!important;box-shadow:0 0 18px rgba(141,242,11,.75)!important}
      .workout-screen .sheet-row.done{background:rgba(95,190,55,.13)!important;box-shadow:inset 0 0 0 1px rgba(126,216,50,.5)!important}
      .workout-screen .mayfit-kg{display:block!important;text-align:center!important;color:#aab6ae!important;font-size:11px!important;font-weight:900!important}
      .workout-screen .mayfit-progress{display:block!important;margin:0 0 8px!important;text-align:center!important;font-size:14px!important;font-weight:1000!important}
      .workout-screen .mayfit-progress.positive{color:#8df20b!important}.workout-screen .mayfit-progress.negative{color:#ff666b!important}
      @keyframes mayfitApprovedPulse{from{filter:brightness(1)}to{filter:brightness(1.25)}}
      @media(max-width:620px){
        .workout-screen .workout-top{grid-template-columns:42px minmax(0,1fr)!important;gap:5px!important}
        .workout-screen .back-button{width:42px!important;height:56px!important;min-height:56px!important}
        .workout-screen .time-strip{height:56px!important;min-height:56px!important;grid-template-columns:auto minmax(0,1fr) 116px!important;padding:5px 6px!important;gap:4px!important}
        .workout-screen .time-strip input{font-size:30px!important}
        .workout-screen .timer-control{height:44px!important;max-width:116px!important;padding:0 4px!important;font-size:10px!important}
        #mayfit-pause-control{width:100%!important;margin:0 0 12px!important;min-height:56px!important;gap:6px!important;padding:6px 7px!important;border-radius:0 0 24px 24px!important}
        #mayfit-pause-control strong{font-size:10px!important}#mayfit-pause-control input{width:58px!important;height:34px!important;font-size:22px!important}#mayfit-pause-control button{width:32px!important;height:32px!important;font-size:20px!important}#mayfit-pause-control small{font-size:9px!important}
        .workout-screen .sheet-head{grid-template-columns:minmax(148px,1.55fr) 84px 104px 86px!important;padding:8px 6px!important;font-size:8px!important}
        .workout-screen .exercise-col{justify-content:flex-start!important;padding:8px 6px 12px!important}.workout-screen .exercise-col>strong{font-size:15px!important;line-height:1.08!important;margin:0 0 10px!important}
      }
    `;
    document.head.appendChild(style);
  }

  const configuredPause=()=>Math.max(0,Number(localStorage.getItem(PAUSE_KEY))||60);

  function installPauseControl(){
    const top=document.querySelector('.workout-screen .workout-top');
    if(!top||document.getElementById('mayfit-pause-control'))return;
    const box=document.createElement('div');
    box.id='mayfit-pause-control';
    box.innerHTML=`<strong>TEMPO DE PAUSA</strong><div class="pause-stepper"><button type="button" data-step="-5">−</button><input type="number" min="0" step="5" value="${configuredPause()}"><button type="button" data-step="5">+</button></div><small>segundos</small>`;
    top.insertAdjacentElement('afterend',box);
    const input=box.querySelector('input');
    const save=()=>{const value=Math.max(0,Number(input.value)||0);input.value=String(value);localStorage.setItem(PAUSE_KEY,String(value))};
    input.addEventListener('change',save);input.addEventListener('blur',save);
    box.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{input.value=String(Math.max(0,(Number(input.value)||0)+Number(button.dataset.step)));save()}));
  }

  function installSheetStructure(){
    const sheet=document.querySelector('.workout-screen .sheet');
    if(!sheet)return;
    if(!sheet.querySelector('.sheet-head')){
      const head=document.createElement('div');head.className='sheet-head';head.innerHTML='<span>EXERCÍCIO</span><span>CARGA</span><span>SÉRIES</span><span>PROGRESSÃO</span>';sheet.prepend(head);
    }
    sheet.querySelectorAll('.sheet-row').forEach(row=>{
      const load=row.querySelector('.load-cell');
      if(load&&!load.querySelector('.mayfit-kg')){const kg=document.createElement('span');kg.className='mayfit-kg';kg.textContent='kg';load.appendChild(kg)}
      const progress=row.querySelector('.progress-cell');
      if(progress&&!progress.querySelector('.mayfit-progress')){
        const current=Number(row.querySelector('.load-cell label:first-child input')?.value)||0;
        const previous=Number(row.querySelector('.load-cell label:nth-child(2) input')?.value)||0;
        const value=current-previous;const label=document.createElement('strong');label.className=`mayfit-progress ${value>=0?'positive':'negative'}`;label.textContent=`${value>=0?'+':''}${value} kg`;progress.prepend(label)
      }
    });
  }

  function syncState(){
    const button=document.querySelector('.workout-screen .timer-control');if(!button)return;
    const label=clean(button.textContent);const hasSelected=!!document.querySelector('.workout-screen .complete-button.mayfit-selected');
    if(!hasSelected&&label==='CONTINUAR'&&!button.classList.contains('running'))button.textContent='START';
    const current=clean(button.textContent);
    button.classList.toggle('mayfit-paused',current==='CONTINUAR');
    button.classList.toggle('mayfit-start',current==='START');
    button.classList.toggle('running',current==='PAUSAR'||button.classList.contains('running'));
  }

  function refresh(){installStyle();installPauseControl();installSheetStructure();syncState()}
  installStyle();
  const root=document.getElementById('root')||document.documentElement;
  new MutationObserver(()=>requestAnimationFrame(refresh)).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',refresh);setInterval(refresh,300);refresh();
})();
