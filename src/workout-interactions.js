/* Fluxo da tela de treino: editar -> selecionar exercício -> START. */
(function(){
  let selectedButton=null;
  let bypassComplete=false;

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

  function selectInputValue(input){
    if(!input||input.disabled)return;
    window.setTimeout(()=>{
      try{input.focus({preventScroll:true})}catch{input.focus()}
      try{input.select()}catch{}
    },0);
  }

  document.addEventListener('focusin',event=>{
    const input=event.target.closest?.('.workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input');
    selectInputValue(input);
  },true);

  document.addEventListener('pointerdown',event=>{
    const input=event.target.closest?.('.workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input');
    if(input)selectInputValue(input);
  },true);

  document.addEventListener('click',event=>{
    const complete=event.target.closest?.('.workout-screen .complete-button');
    if(complete){
      if(bypassComplete){bypassComplete=false;return;}
      if(complete.closest('.sheet-row')?.classList.contains('done'))return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      selectExercise(complete);
      return;
    }

    const start=event.target.closest?.('.workout-screen .timer-control');
    if(!start)return;
    const label=start.textContent.trim().toUpperCase();
    if(label!=='START')return;

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
})();