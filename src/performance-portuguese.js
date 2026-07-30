const translations=[
  [/barbell/gi,'barra'],[/dumbbell/gi,'halter'],[/cable/gi,'polia'],[/machine/gi,'máquina'],[/bodyweight/gi,'peso corporal'],
  [/bench press/gi,'supino'],[/incline/gi,'inclinado'],[/decline/gi,'declinado'],[/chest/gi,'peitoral'],[/fly/gi,'crucifixo'],
  [/shoulder press/gi,'desenvolvimento de ombros'],[/lateral raise/gi,'elevação lateral'],[/front raise/gi,'elevação frontal'],[/rear delt/gi,'deltoide posterior'],
  [/biceps curl/gi,'rosca para bíceps'],[/hammer curl/gi,'rosca martelo'],[/triceps extension/gi,'extensão de tríceps'],[/pushdown/gi,'tríceps na polia'],
  [/lat pulldown/gi,'puxada frontal'],[/pulldown/gi,'puxada'],[/pull-up/gi,'barra fixa'],[/chin-up/gi,'barra fixa supinada'],[/row/gi,'remada'],
  [/deadlift/gi,'levantamento terra'],[/squat/gi,'agachamento'],[/leg press/gi,'leg press'],[/leg extension/gi,'cadeira extensora'],[/leg curl/gi,'mesa flexora'],
  [/hip thrust/gi,'elevação pélvica'],[/glute bridge/gi,'ponte de glúteos'],[/calf raise/gi,'elevação de panturrilha'],[/lunge/gi,'avanço'],
  [/crunch/gi,'abdominal'],[/sit-up/gi,'abdominal completo'],[/plank/gi,'prancha'],[/push-up/gi,'flexão de braços'],
  [/standing/gi,'em pé'],[/seated/gi,'sentado'],[/lying/gi,'deitado'],[/single arm/gi,'unilateral'],[/one arm/gi,'unilateral'],
  [/wide grip/gi,'pegada aberta'],[/close grip/gi,'pegada fechada'],[/reverse grip/gi,'pegada invertida'],[/medium grip/gi,'pegada média']
];

function translateName(value){
  let text=String(value||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim();
  if(!text)return text;
  for(const [pattern,replacement] of translations)text=text.replace(pattern,replacement);
  return text.charAt(0).toUpperCase()+text.slice(1);
}

function translateVisibleExercises(root=document){
  const selectors=['.exercise-col>strong','.exercise-card strong','.exercise-name','option'];
  root.querySelectorAll(selectors.join(',')).forEach(element=>{
    const original=element.textContent?.trim();
    if(!original||element.dataset.mayfitTranslated==='true')return;
    const translated=translateName(original);
    if(translated!==original)element.textContent=translated;
    element.dataset.mayfitTranslated='true';
  });
}

const style=document.createElement('style');
style.id='mayfit-performance-style';
style.textContent=`
  .workout-screen,.app,#mayfit-settings-screen{transform:translateZ(0);backface-visibility:hidden}
  .sheet-row,.exercise-card,.ms-card{content-visibility:auto;contain-intrinsic-size:220px;contain:layout paint style}
  img{content-visibility:auto}
  button,.icon{touch-action:manipulation}
`;
if(!document.getElementById(style.id))document.head.appendChild(style);

let scheduled=false;
const observer=new MutationObserver(mutations=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)translateVisibleExercises(node);
      }
    }
  });
});
observer.observe(document.documentElement,{childList:true,subtree:true});

if('requestIdleCallback' in window)requestIdleCallback(()=>translateVisibleExercises(),{timeout:1000});
else setTimeout(()=>translateVisibleExercises(),100);
