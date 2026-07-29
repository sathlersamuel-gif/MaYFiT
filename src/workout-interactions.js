/* Interações da tela de treino — exercício e pausa com visores totalmente independentes. */
(function(){
  let selectedButton=null,bypassComplete=false,blockNextClick=false,blankInput=null,editingRow=null;
  let pauseRunning=false,pauseTimer=null,pauseDeadline=0,lastPhase='';
  const inputSelector='.workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input';
  const nativeValueSetter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;

  const style=document.createElement('style');
  style.textContent=`
    .workout-screen .exercise-photo{height:auto!important;aspect-ratio:1.58/1!important}
    .workout-screen .exercise-photo img{object-fit:cover!important;object-position:center!important;background:#050706!important}
    .workout-screen .sheet-row{height:auto!important}
    .workout-screen .timer-control{box-sizing:border-box!important;max-width:100%!important;min-width:96px!important;padding:0 8px!important;overflow:visible!important;text-overflow:clip!important;font-size:13px!important;letter-spacing:-.25px!important;white-space:nowrap!important;line-height:1!important}
    .workout-screen input{user-select:text!important;-webkit-user-select:text!important;touch-action:manipulation!important}
    .workout-screen .sheet-row.mayfit-editing{box-shadow:inset 0 0 0 2px #e2b32c!important}
    .workout-screen .sheet-row.mayfit-editing input{opacity:1!important;pointer-events:auto!important}
    .workout-screen.mayfit-pause-phase .time-strip input{visibility:hidden!important}
    .workout-screen.mayfit-pause-phase .time-strip span{color:#9aa39d!important}
    #mayfit-pause-control .pause-stepper{position:relative!important}
    #mayfit-pause-control .mayfit-pause-display{display:none;align-items:center;justify-content:center;width:82px;height:38px;border:1px solid #8b9b90;border-radius:12px;background:#071008;color:#9df20f;text-align:center;font:950 20px system-ui,-apple-system,sans-serif;box-sizing:border-box;font-variant-numeric:tabular-nums}
    #mayfit-pause-control.mayfit-counting{border-color:#9df20f!important;box-shadow:0 0 18px rgba(141,242,11,.35)!important}
    #mayfit-pause-control.mayfit-counting input{display:none!important}
    #mayfit-pause-control.mayfit-counting .mayfit-pause-display{display:flex!important}
    @media(max-width:620px){
      .workout-screen .sheet-row{min-height:0!important}
      .workout-screen .exercise-photo{aspect-ratio:1.55/1!important}
      .workout-screen .time-strip{grid-template-columns:auto minmax(66px,1fr) 100px!important}
      .workout-screen .timer-control{width:100px!important;min-width:100px!important;padding:0 5px!important;font-size:12px!important;letter-spacing:-.35px!important;white-space:nowrap!important}
      #mayfit-pause-control .mayfit-pause-display{width:58px!important;height:34px!important;font-size:21px!important}
    }
  `;
  document.head.appendChild(style);

  function setNativeValue(input,value,notify=true){
    if(nativeValueSetter)nativeValueSetter.call(input,String(value));else input.value=String(value);
    if(notify){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function prepareInputs(){
    document.querySelectorAll(inputSelector).forEach(input=>{input.setAttribute('inputmode','numeric');input.setAttribute('pattern','[0-9]*');input.setAttribute('autocomplete','off');if(editingRow&&editingRow.contains(input))input.disabled=false})
  }
  function clearSelection(){document.querySelectorAll('.sheet-row.mayfit-selected,.complete-button.mayfit-selected').forEach(el=>el.classList.remove('mayfit-selected'))}
  function enterEditMode(button){
    const row=button.closest('.sheet-row');if(!row)return;
    clearSelection();selectedButton=null;if(editingRow&&editingRow!==row)editingRow.classList.remove('mayfit-editing');editingRow=row;row.classList.add('mayfit-editing');row.querySelectorAll('input').forEach(input=>input.disabled=false)
  }
  function selectExercise(button){
    const row=button.closest('.sheet-row');if(!row)return;const already=button===selectedButton&&button.classList.contains('mayfit-selected');clearSelection();
    if(already){selectedButton=null;row.classList.add('mayfit-editing');editingRow=row;return}
    if(editingRow){editingRow.classList.remove('mayfit-editing');editingRow=null}selectedButton=button;row.classList.add('mayfit-selected');button.classList.add('mayfit-selected')
  }
  function makeInputBlank(input){if(!input||input.disabled)return;blankInput=input;input.dataset.mayfitBlank='1';setNativeValue(input,'');requestAnimationFrame(()=>{if(input.dataset.mayfitBlank==='1')setNativeValue(input,'',false)})}

  function getPauseParts(){
    const box=document.getElementById('mayfit-pause-control');
    const stepper=box?.querySelector('.pause-stepper');
    const input=stepper?.querySelector('input');
    if(box&&stepper&&!stepper.querySelector('.mayfit-pause-display')){
      const display=document.createElement('span');display.className='mayfit-pause-display';display.setAttribute('aria-live','polite');display.textContent='0';stepper.insertBefore(display,stepper.querySelector('button[data-step="5"]'));
    }
    return{box,input,display:stepper?.querySelector('.mayfit-pause-display'),buttons:box?.querySelectorAll('button')};
  }
  function configuredPause(){return Math.max(0,parseInt(localStorage.getItem('mayfit_pause_seconds')||'0',10)||0)}
  function renderPauseRemaining(){
    const{display}=getPauseParts();if(!display)return;
    const remaining=Math.max(0,Math.ceil((pauseDeadline-Date.now())/1000));
    display.textContent=String(remaining);
    if(remaining<=0&&pauseTimer){clearInterval(pauseTimer);pauseTimer=null}
  }
  function stopPauseCounter(){
    if(pauseTimer){clearInterval(pauseTimer);pauseTimer=null}pauseRunning=false;pauseDeadline=0;
    const{box,input,display,buttons}=getPauseParts();box?.classList.remove('mayfit-counting');document.querySelector('.workout-screen')?.classList.remove('mayfit-pause-phase');
    if(display)display.textContent=String(configuredPause());if(input)input.disabled=false;buttons?.forEach(button=>button.disabled=false)
  }
  function startPauseCounter(){
    if(pauseRunning)return;
    const{box,input,display,buttons}=getPauseParts();if(!box||!input||!display)return;
    const total=configuredPause();pauseRunning=true;pauseDeadline=Date.now()+total*1000;
    document.querySelector('.workout-screen')?.classList.add('mayfit-pause-phase');box.classList.add('mayfit-counting');input.disabled=true;buttons?.forEach(button=>button.disabled=true);
    display.textContent=String(total);renderPauseRemaining();
    if(total>0)pauseTimer=setInterval(renderPauseRemaining,200)
  }
  function syncPausePhase(){
    const phase=document.querySelector('.workout-screen .time-strip span')?.textContent.trim().toUpperCase()||'';
    if(!phase||phase===lastPhase)return;lastPhase=phase;
    if(phase==='PAUSA')startPauseCounter();else stopPauseCounter()
  }

  document.addEventListener('focusin',event=>{const input=event.target.closest?.(inputSelector);if(input&&!input.disabled)input.setAttribute('inputmode','numeric')},true);
  document.addEventListener('beforeinput',event=>{const input=event.target.closest?.(inputSelector);if(!input||input.disabled||!String(event.inputType||'').startsWith('delete'))return;event.preventDefault();event.stopPropagation();makeInputBlank(input)},true);
  document.addEventListener('keydown',event=>{const input=event.target.closest?.(inputSelector);if(!input||input.disabled||!['Backspace','Delete'].includes(event.key))return;event.preventDefault();event.stopPropagation();makeInputBlank(input)},true);
  document.addEventListener('input',event=>{const input=event.target.closest?.(inputSelector);if(input&&input.value!==''){delete input.dataset.mayfitBlank;if(blankInput===input)blankInput=null}},true);
  document.addEventListener('focusout',event=>{const input=event.target.closest?.(inputSelector);if(!input||input.dataset.mayfitBlank!=='1')return;const isSeriesOrReps=!!input.closest('.series-pair');delete input.dataset.mayfitBlank;blankInput=null;setNativeValue(input,isSeriesOrReps?'1':'0')},true);

  document.addEventListener('pointerdown',event=>{
    const complete=event.target.closest?.('.workout-screen .complete-button');if(!complete||bypassComplete)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();blockNextClick=true;
    const row=complete.closest('.sheet-row'),activeText=complete.textContent.replace(/\s+/g,' ').trim().toUpperCase();
    if(activeText.includes('EM ANDAMENTO')){
      stopPauseCounter();lastPhase='';bypassComplete=true;complete.click();enterEditMode(complete);return;
    }
    selectExercise(complete)
  },true);
  document.addEventListener('click',event=>{
    const complete=event.target.closest?.('.workout-screen .complete-button');
    if(complete){if(bypassComplete){bypassComplete=false;return}event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();if(blockNextClick){blockNextClick=false;return}selectExercise(complete);return}
    const start=event.target.closest?.('.workout-screen .timer-control');if(!start||start.textContent.trim().toUpperCase()!=='START')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(!selectedButton){start.classList.add('mayfit-attention');start.textContent='SELECIONE';setTimeout(()=>{start.classList.remove('mayfit-attention');if(start.textContent.trim().toUpperCase()==='SELECIONE')start.textContent='START'},900);return}
    if(editingRow){editingRow.classList.remove('mayfit-editing');editingRow=null}const button=selectedButton;selectedButton=null;clearSelection();bypassComplete=true;button.click()
  },true);

  setInterval(()=>{prepareInputs();getPauseParts();syncPausePhase();if(blankInput&&blankInput.isConnected&&document.activeElement===blankInput&&blankInput.dataset.mayfitBlank==='1'&&blankInput.value!=='')setNativeValue(blankInput,'',false)},100);
  prepareInputs();getPauseParts();
})();