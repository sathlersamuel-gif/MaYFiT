/* Interações da tela de treino — seleção, START exclusivo, reset pausado e persistência por aluno. */
(function(){
  let selectedButton=null,bypassComplete=false,blankInput=null,editingRow=null;
  let pauseRunning=false,pauseTimer=null,pauseDeadline=0,lastPhase='';
  const inputSelector='.workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input';
  const nativeValueSetter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;

  const style=document.createElement('style');
  style.textContent=`
    .workout-screen input{user-select:text!important;-webkit-user-select:text!important;touch-action:manipulation!important}
    .workout-screen .sheet-row.mayfit-editing{box-shadow:inset 0 0 0 2px #e2b32c!important}
    .workout-screen .sheet-row.mayfit-editing input{opacity:1!important;pointer-events:auto!important}
    .workout-screen .sheet-row.mayfit-selected{box-shadow:inset 0 0 0 2px #9df20f!important}
    .workout-screen .complete-button.mayfit-selected{background:#9df20f!important;color:#071008!important;border-color:#9df20f!important;box-shadow:0 0 16px rgba(157,242,15,.35)!important}
    .workout-screen.mayfit-pause-phase .time-strip input{visibility:hidden!important}
    .workout-screen.mayfit-pause-phase .time-strip span{color:#9aa39d!important}
    #mayfit-pause-control .pause-stepper{position:relative!important}
    #mayfit-pause-control .mayfit-pause-display{display:none;align-items:center;justify-content:center;width:82px;height:38px;border:1px solid #8b9b90;border-radius:12px;background:#071008;color:#9df20f;text-align:center;font:950 20px system-ui,-apple-system,sans-serif;box-sizing:border-box;font-variant-numeric:tabular-nums}
    #mayfit-pause-control.mayfit-counting input{display:none!important}
    #mayfit-pause-control.mayfit-counting .mayfit-pause-display{display:flex!important}
  `;
  document.head.appendChild(style);

  function setNativeValue(input,value,notify=true){
    if(nativeValueSetter)nativeValueSetter.call(input,String(value));else input.value=String(value);
    if(notify){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function currentUserId(){try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')?.id||'aluno'}catch{return'aluno'}}
  function storageKey(){return`mayfit_workout_${currentUserId()}`}
  function readSaved(){try{return JSON.parse(localStorage.getItem(storageKey())||'{}')}catch{return{}}}
  function writeSaved(data){localStorage.setItem(storageKey(),JSON.stringify(data))}
  function rowIndex(row){return Array.from(document.querySelectorAll('.workout-screen .sheet-row')).indexOf(row)}
  function inputField(input){
    if(input.closest('.load-cell'))return input.closest('label')?.textContent.includes('Anterior')?'previousLoad':'load';
    if(input.closest('.series-pair'))return input.closest('label')?.textContent.includes('Reps')?'reps':'sets';
    if(input.closest('.rest-label'))return'rest';
    return null
  }
  function saveInput(input){
    const row=input.closest('.sheet-row'),index=rowIndex(row),field=inputField(input);if(index<0||!field)return;
    const saved=readSaved();saved[index]={...(saved[index]||{}),[field]:input.value};writeSaved(saved)
  }
  function restoreInputs(){
    const saved=readSaved();
    document.querySelectorAll('.workout-screen .sheet-row').forEach((row,index)=>{
      const data=saved[index];if(!data||row.dataset.mayfitRestored==='1')return;
      row.querySelectorAll('input').forEach(input=>{const field=inputField(input);if(field&&data[field]!==undefined&&String(input.value)!==String(data[field]))setNativeValue(input,data[field])});
      row.dataset.mayfitRestored='1'
    })
  }
  function prepareInputs(){document.querySelectorAll(inputSelector).forEach(input=>{input.setAttribute('inputmode','numeric');input.setAttribute('pattern','[0-9]*');input.setAttribute('autocomplete','off');if(editingRow&&editingRow.contains(input))input.disabled=false})}
  function clearSelection(){document.querySelectorAll('.sheet-row.mayfit-selected,.complete-button.mayfit-selected').forEach(el=>el.classList.remove('mayfit-selected'))}
  function enterEditMode(button){const row=button.closest('.sheet-row');if(!row)return;clearSelection();selectedButton=null;if(editingRow&&editingRow!==row)editingRow.classList.remove('mayfit-editing');editingRow=row;row.classList.add('mayfit-editing');row.querySelectorAll('input').forEach(input=>input.disabled=false)}
  function selectExercise(button){const row=button.closest('.sheet-row');if(!row)return;if(editingRow){editingRow.classList.remove('mayfit-editing');editingRow=null}clearSelection();selectedButton=button;row.classList.add('mayfit-selected');button.classList.add('mayfit-selected')}
  function makeInputBlank(input){if(!input||input.disabled)return;blankInput=input;input.dataset.mayfitBlank='1';setNativeValue(input,'');requestAnimationFrame(()=>{if(input.dataset.mayfitBlank==='1')setNativeValue(input,'',false)})}

  function getPauseParts(){const box=document.getElementById('mayfit-pause-control'),stepper=box?.querySelector('.pause-stepper'),input=stepper?.querySelector('input');if(box&&stepper&&!stepper.querySelector('.mayfit-pause-display')){const display=document.createElement('span');display.className='mayfit-pause-display';display.setAttribute('aria-live','polite');display.textContent='0';stepper.insertBefore(display,stepper.querySelector('button[data-step="5"]'))}return{box,input,display:stepper?.querySelector('.mayfit-pause-display'),buttons:box?.querySelectorAll('button')}}
  function configuredPause(){return Math.max(0,parseInt(localStorage.getItem('mayfit_pause_seconds')||'0',10)||0)}
  function stopPauseCounter(){if(pauseTimer){clearInterval(pauseTimer);pauseTimer=null}pauseRunning=false;pauseDeadline=0;const{box,input,display,buttons}=getPauseParts();box?.classList.remove('mayfit-counting');document.querySelector('.workout-screen')?.classList.remove('mayfit-pause-phase');if(display)display.textContent=String(configuredPause());if(input)input.disabled=false;buttons?.forEach(button=>button.disabled=false)}
  function startPauseCounter(){if(pauseRunning)return;const{box,input,display,buttons}=getPauseParts();if(!box||!input||!display)return;const total=configuredPause();pauseRunning=true;pauseDeadline=Date.now()+total*1000;document.querySelector('.workout-screen')?.classList.add('mayfit-pause-phase');box.classList.add('mayfit-counting');input.disabled=true;buttons?.forEach(button=>button.disabled=true);const render=()=>{const remaining=Math.max(0,Math.ceil((pauseDeadline-Date.now())/1000));display.textContent=String(remaining);if(remaining<=0)stopPauseCounter()};render();if(total>0)pauseTimer=setInterval(render,200)}
  function syncPausePhase(){const phase=document.querySelector('.workout-screen .time-strip span')?.textContent.trim().toUpperCase()||'';if(!phase||phase===lastPhase)return;lastPhase=phase;if(phase==='PAUSA')startPauseCounter();else stopPauseCounter()}
  function forceTimerStopped(){
    let checks=0;
    const guard=setInterval(()=>{
      const timer=document.querySelector('.workout-screen .timer-control');
      const label=timer?.textContent.replace(/\s+/g,' ').trim().toUpperCase()||'';
      if(label==='PAUSAR')timer.click();
      checks+=1;
      if(checks>=20)clearInterval(guard)
    },100)
  }

  document.addEventListener('beforeinput',event=>{const input=event.target.closest?.(inputSelector);if(!input||input.disabled||!String(event.inputType||'').startsWith('delete'))return;event.preventDefault();event.stopPropagation();makeInputBlank(input)},true);
  document.addEventListener('keydown',event=>{const input=event.target.closest?.(inputSelector);if(!input||input.disabled||!['Backspace','Delete'].includes(event.key))return;event.preventDefault();event.stopPropagation();makeInputBlank(input)},true);
  document.addEventListener('input',event=>{const input=event.target.closest?.(inputSelector);if(!input)return;if(input.value!==''){delete input.dataset.mayfitBlank;if(blankInput===input)blankInput=null}saveInput(input)},true);
  document.addEventListener('change',event=>{const input=event.target.closest?.(inputSelector);if(input)saveInput(input)},true);
  document.addEventListener('focusout',event=>{const input=event.target.closest?.(inputSelector);if(!input)return;if(input.dataset.mayfitBlank==='1'){const isSeriesOrReps=!!input.closest('.series-pair');delete input.dataset.mayfitBlank;blankInput=null;setNativeValue(input,isSeriesOrReps?'1':'0')}saveInput(input)},true);

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.workout-screen .complete-button');
    if(button){
      if(bypassComplete){bypassComplete=false;return}
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const row=button.closest('.sheet-row');
      const label=button.textContent.replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
      const alreadySelected=button===selectedButton&&button.classList.contains('mayfit-selected');
      if(!alreadySelected){selectExercise(button);return}
      const wasStarted=label.includes('EM ANDAMENTO')||label.includes('CONCLUÍDO')||!!row?.querySelector('.series-cell input:disabled');
      stopPauseCounter();lastPhase='';clearSelection();selectedButton=null;
      if(wasStarted){bypassComplete=true;button.click();forceTimerStopped()}
      requestAnimationFrame(()=>enterEditMode(button));
      return
    }
    const start=event.target.closest?.('.workout-screen .timer-control');
    if(!start||start.textContent.trim().toUpperCase()!=='START')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(!selectedButton){start.classList.add('mayfit-attention');start.textContent='SELECIONE';setTimeout(()=>{start.classList.remove('mayfit-attention');if(start.textContent.trim().toUpperCase()==='SELECIONE')start.textContent='START'},900);return}
    if(editingRow){editingRow.classList.remove('mayfit-editing');editingRow=null}
    const selected=selectedButton;selectedButton=null;clearSelection();bypassComplete=true;selected.click()
  },true);

  setInterval(()=>{prepareInputs();restoreInputs();getPauseParts();syncPausePhase();if(blankInput&&blankInput.isConnected&&document.activeElement===blankInput&&blankInput.dataset.mayfitBlank==='1'&&blankInput.value!=='')setNativeValue(blankInput,'',false)},100);
  prepareInputs();restoreInputs();getPauseParts();
})();