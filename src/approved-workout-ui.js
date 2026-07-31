/* MaYFiT — estrutura visual aprovada da tela de treino.
   Mantém somente cronômetro, pausa, seleção e visual do treino.
   Não contém gerenciamento, cadastro ou dados de alunos. */
(function(){
  'use strict';

  const STYLE_ID='mayfit-approved-workout-style';
  const PAUSE_KEY='mayfit_pause_seconds';

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .workout-screen{padding-top:max(12px,env(safe-area-inset-top));padding-bottom:calc(112px + env(safe-area-inset-bottom))}
      .workout-screen .workout-top{position:relative;display:grid;grid-template-columns:54px minmax(0,1fr);gap:8px;align-items:stretch}
      .workout-screen .back-button{display:grid;place-items:center;min-height:62px;border-radius:16px}
      .workout-screen .time-strip{display:grid;grid-template-columns:auto minmax(0,1fr) 126px;align-items:center;gap:8px;min-height:62px;padding:7px 8px;border:2px solid #ff4b4b;border-radius:16px;background:#171b18;color:#fff;overflow:hidden}
      .workout-screen .time-strip>span{font-size:12px;font-weight:900;color:#fff}
      .workout-screen .time-strip input{min-width:0;border:0!important;background:transparent!important;color:#ff3b3b!important;text-align:center;font-size:34px!important;font-weight:1000!important;font-variant-numeric:tabular-nums;text-shadow:0 0 12px rgba(255,45,45,.28)}
      .workout-screen .timer-control{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;height:46px!important;margin:0!important;padding:0 8px!important;border-radius:13px!important;box-sizing:border-box!important;overflow:hidden!important;white-space:nowrap!important;text-align:center!important;font:900 11px/1 system-ui,-apple-system,sans-serif!important}
      .workout-screen .timer-control.running{animation:mayfitApprovedPulse 1s infinite alternate;box-shadow:0 0 24px rgba(84,255,17,.9)!important}
      .workout-screen .timer-control.mayfit-paused{background:#54e600!important;border-color:#9dff45!important;color:#071108!important;box-shadow:0 0 20px rgba(84,230,0,.7)!important}
      .workout-screen .timer-control.mayfit-attention{background:#e0a400!important;color:#101000!important}
      #mayfit-pause-control{display:flex;align-items:center;justify-content:center;gap:12px;width:calc(100% - 62px);margin:0 0 14px 62px;padding:10px 14px;border:1px solid #41634d;border-radius:16px;background:#101a14;color:#fff;box-sizing:border-box}
      #mayfit-pause-control strong{font:900 13px system-ui,-apple-system,sans-serif;white-space:nowrap}
      #mayfit-pause-control .pause-stepper{display:flex;align-items:center;gap:8px}
      #mayfit-pause-control button{display:grid;place-items:center;width:38px;height:38px;padding:0;border:1px solid #3f6749;border-radius:12px;background:#17341f;color:#86e044;font:950 22px system-ui,-apple-system,sans-serif}
      #mayfit-pause-control input{width:82px;height:38px;border:1px solid #8b9b90;border-radius:12px;background:#f7faf8;color:#d9262e;text-align:center;font:950 20px system-ui,-apple-system,sans-serif;box-sizing:border-box}
      #mayfit-pause-control small{color:#b9c8be;font:750 11px system-ui,-apple-system,sans-serif;white-space:nowrap}
      #mayfit-pause-control.mayfit-counting,#mayfit-pause-control.counting{border-color:#9df20f!important;box-shadow:0 0 18px rgba(141,242,11,.35)!important}
      .workout-screen .sheet-row{transition:background .18s ease,box-shadow .18s ease,opacity .18s ease}
      .workout-screen .sheet-row.mayfit-selected{box-shadow:inset 0 0 0 2px #8df20b,inset 0 0 24px rgba(141,242,11,.16)!important}
      .workout-screen .complete-button.mayfit-selected{background:#8df20b!important;border-color:#caff63!important;box-shadow:0 0 18px rgba(141,242,11,.75)!important}
      .workout-screen .complete-button.mayfit-selected::after{content:'✓';display:grid;place-items:center;width:100%;height:100%;color:#071108;font-size:25px;font-weight:1000}
      .workout-screen .sheet-row:has(.complete-button[aria-pressed="true"]),.workout-screen .sheet-row.completed,.workout-screen .sheet-row.done{background:rgba(95,190,55,.13)!important;box-shadow:inset 0 0 0 1px rgba(126,216,50,.5)!important}
      @keyframes mayfitApprovedPulse{from{filter:brightness(1)}to{filter:brightness(1.25)}}
      body.theme-light .workout-screen .time-strip{background:#fff;color:#111;border-color:#d64444}
      body.theme-light #mayfit-pause-control{background:#fff;color:#142018;border-color:#bfd0c4}
      body.theme-light #mayfit-pause-control small{color:#596a60}
      @media(max-width:620px){
        .workout-screen .workout-top{grid-template-columns:42px minmax(0,1fr)!important;gap:5px!important}
        .workout-screen .back-button{width:42px!important;height:56px!important;min-height:56px!important}
        .workout-screen .time-strip{height:56px!important;min-height:56px!important;grid-template-columns:auto minmax(0,1fr) 116px!important;padding:5px 6px!important;gap:4px!important}
        .workout-screen .time-strip span{font-size:12px!important}
        .workout-screen .time-strip input{font-size:30px!important}
        .workout-screen .timer-control{height:44px!important;max-width:116px!important;padding:0 4px!important;font-size:10px!important;letter-spacing:-.25px!important}
        #mayfit-pause-control{width:100%!important;margin:0 0 12px!important;min-height:56px!important;gap:6px!important;padding:6px 7px!important;border-radius:0 0 24px 24px!important}
        #mayfit-pause-control strong{font-size:10px!important}
        #mayfit-pause-control input{width:58px!important;height:34px!important;font-size:22px!important}
        #mayfit-pause-control button{width:32px!important;height:32px!important;font-size:20px!important}
        #mayfit-pause-control small{font-size:9px!important}
        .workout-screen .exercise-col{justify-content:flex-start!important;padding:8px 6px 12px!important}
        .workout-screen .exercise-col>strong{font-size:15px!important;line-height:1.08!important;margin:0 0 10px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function configuredPause(){return Math.max(0,Number(localStorage.getItem(PAUSE_KEY))||60)}

  function installPauseControl(){
    const top=document.querySelector('.workout-screen .workout-top');
    if(!top||document.getElementById('mayfit-pause-control'))return;
    const pause=document.createElement('div');
    pause.id='mayfit-pause-control';
    pause.innerHTML=`<strong>TEMPO DE PAUSA</strong><div class="pause-stepper"><button type="button" data-step="-5" aria-label="Diminuir pausa">−</button><input type="number" min="0" step="5" value="${configuredPause()}" aria-label="Tempo de pausa em segundos"><button type="button" data-step="5" aria-label="Aumentar pausa">+</button></div><small>segundos</small>`;
    top.insertAdjacentElement('afterend',pause);
    const input=pause.querySelector('input');
    const save=()=>{const value=Math.max(0,Number(input.value)||0);input.value=String(value);localStorage.setItem(PAUSE_KEY,String(value))};
    input.addEventListener('change',save);
    input.addEventListener('blur',save);
    pause.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{input.value=String(Math.max(0,(Number(input.value)||0)+Number(button.dataset.step)));save()}));
  }

  function syncButtonState(){
    const button=document.querySelector('.workout-screen .timer-control');
    if(!button)return;
    const label=button.textContent.replace(/\s+/g,' ').trim().toUpperCase();
    button.classList.toggle('mayfit-paused',label==='CONTINUAR');
    button.classList.toggle('running',label==='PAUSAR');
  }

  function refresh(){
    installStyle();
    installPauseControl();
    syncButtonState();
  }

  installStyle();
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
  const root=document.getElementById('root')||document.documentElement;
  observer.observe(root,{childList:true,subtree:true});
  window.addEventListener('load',refresh);
  setInterval(refresh,500);
  refresh();
})();
