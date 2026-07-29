/* Fluxo da tela de treino: editar -> selecionar exercício -> START. */
(function(){
  let selectedButton=null;
  let bypassComplete=false;
  let blockNextClick=false;
  let blankInput=null;

  const inputSelector='.workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input';
  const nativeValueSetter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;

  const style=document.createElement('style');
  style.textContent=`
    .workout-screen .exercise-photo{height:auto!important;aspect-ratio:1.58/1!important}
    .workout-screen .exercise-photo img{object-fit:cover!important;object-position:center!important;background:#050706!important}
    .workout-screen .sheet-row{height:auto!important}
    .workout-screen .timer-control{box-sizing:border-box!important;max-width:100%!important;overflow:hidden!important;text-overflow:clip!important}
    .workout-screen input{user-select:text!important;-webkit-user-select:text!important;touch-action:manipulation!important}
    @media(max-width:620px){
      .workout-screen .sheet-row{min-height:0!important}
      .workout-screen .exercise-photo{aspect-ratio:1.55/1!important}
      .workout-screen .timer-control{min-width:0!important;width:100%!important;padding:0 5px!important;font-size:clamp(14px,4.2vw,18px)!important;letter-spacing:-.4px!important;white-space:nowrap!important}
    }
  `;
  document.head.appendChild(style);

  function setNativeValue(input,value,notify=true){
    if(nativeValueSetter)nativeValueSetter.call(input,String(value));
    else input.value=String(value);
    if(notify){
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function prepareInputs(){
    document.querySelectorAll(inputSelector).forEach(input=>{
      input.setAttribute('inputmode','numeric');
      input.setAttribute('pattern','[0-9]*');
      input.setAttribute('autocomplete','off');
    });
  }

  function clearSelection(){
    document.querySelectorAll('.sheet-row.mayfit-selected').forEach(row=>row.classList.remove('mayfit-selected'));
    document.querySelectorAll('.complete-button.mayfit-selected').forEach(btn=>btn.classList.remove('mayfit-selected'));
  }

  function selectExercise(button){
    const row=button.closest('.sheet-row');
    if(!row)return;
    const already=button===selectedButton&&button.classList.contains('mayfit-selected');
    clearSelection();
    if(already){selectedButton=null;return;}
    selectedButton=button;
    row.classList.add('mayfit-selected');
    button.classList.add('mayfit-selected');
  }

  function makeInputBlank(input){
    if(!input||input.disabled)return;
    blankInput=input;
    input.dataset.mayfitBlank='1';
    setNativeValue(input,'');
    requestAnimationFrame(()=>{
      if(input.dataset.mayfitBlank==='1')setNativeValue(input,'',false);
    });
  }

  document.addEventListener('focusin',event=>{
    const input=event.target.closest?.(inputSelector);
    if(!input||input.disabled)return;
    input.setAttribute('inputmode','numeric');
  },true);

  document.addEventListener('beforeinput',event=>{
    const input=event.target.closest?.(inputSelector);
    if(!input||input.disabled)return;
    if(!String(event.inputType||'').startsWith('delete'))return;
    event.preventDefault();
    event.stopPropagation();
    makeInputBlank(input);
  },true);

  document.addEventListener('keydown',event=>{
    const input=event.target.closest?.(inputSelector);
    if(!input||input.disabled||!['Backspace','Delete'].includes(event.key))return;
    event.preventDefault();
    event.stopPropagation();
    makeInputBlank(input);
  },true);

  document.addEventListener('input',event=>{
    const input=event.target.closest?.(inputSelector);
    if(!input)return;
    if(input.value!==''){
      delete input.dataset.mayfitBlank;
      if(blankInput===input)blankInput=null;
    }
  },true);

  document.addEventListener('focusout',event=>{
    const input=event.target.closest?.(inputSelector);
    if(!input||input.dataset.mayfitBlank!=='1')return;
    const isSeriesOrReps=!!input.closest('.series-pair');
    delete input.dataset.mayfitBlank;
    blankInput=null;
    setNativeValue(input,isSeriesOrReps?'1':'0');
  },true);

  window.setInterval(()=>{
    prepareInputs();
    if(blankInput&&blankInput.isConnected&&document.activeElement===blankInput&&blankInput.dataset.mayfitBlank==='1'&&blankInput.value!==''){
      setNativeValue(blankInput,'',false);
    }
  },300);

  document.addEventListener('pointerdown',event=>{
    const complete=event.target.closest?.('.workout-screen .complete-button');
    if(complete&&!bypassComplete){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      blockNextClick=true;
      selectExercise(complete);
    }
  },true);

  document.addEventListener('click',event=>{
    const complete=event.target.closest?.('.workout-screen .complete-button');
    if(complete){
      if(bypassComplete){bypassComplete=false;return;}
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if(blockNextClick){blockNextClick=false;return;}
      selectExercise(complete);
      return;
    }

    const start=event.target.closest?.('.workout-screen .timer-control');
    if(!start||start.textContent.trim().toUpperCase()!=='START')return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if(!selectedButton){
      start.classList.add('mayfit-attention');
      start.textContent='SELECIONE';
      window.setTimeout(()=>{
        start.classList.remove('mayfit-attention');
        if(start.textContent.trim().toUpperCase()==='SELECIONE')start.textContent='START';
      },900);
      return;
    }

    const button=selectedButton;
    selectedButton=null;
    clearSelection();
    bypassComplete=true;
    button.click();
  },true);

  prepareInputs();
})();