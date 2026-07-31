const STORE='mayfit_v8';

const DEFAULT_EXERCISES=[
  {id:1,type:'supino',name:'Supino reto',sets:4,reps:12,load:60,previousLoad:56,rest:59,tip:'Pés firmes, escápulas encaixadas e barra descendo até a linha média do peito.'},
  {id:2,type:'pelvica',name:'Elevação pélvica',sets:3,reps:10,load:80,previousLoad:75,rest:60,tip:'Queixo levemente recolhido, abdômen firme e extensão completa do quadril.'},
  {id:3,type:'legpress',name:'Leg Press 90°',sets:4,reps:12,load:120,previousLoad:110,rest:90,tip:'Joelhos alinhados com os pés e lombar apoiada durante todo o movimento.'},
  {id:4,type:'flexora',name:'Cadeira flexora',sets:4,reps:8,load:45,previousLoad:40,rest:60,tip:'Quadril apoiado, movimento controlado e sem tirar o tronco do banco.'},
  {id:5,type:'panturrilha',name:'Panturrilha',sets:4,reps:15,load:50,previousLoad:45,rest:45,tip:'Amplitude completa, subindo na ponta dos pés e descendo devagar.'}
];

const DEFAULT_USERS=[
  {id:'admin',name:'Samuel',email:'admin@mayfit.com',password:'123456',role:'admin'},
  {id:'aluno',name:'Aluno Teste',email:'aluno@mayfit.com',password:'123456',role:'student'}
];

function text(value,fallback){
  const result=String(value??'').trim();
  return result||fallback;
}

function number(value,fallback,min=0){
  const parsed=Number(value);
  return Number.isFinite(parsed)?Math.max(min,parsed):fallback;
}

function normalizeExercise(item,index){
  const source=item&&typeof item==='object'?item:{};
  const type=text(source.type||source.exercise_id||source.slug,'supino');
  return {
    ...source,
    id:source.id??`exercise-${Date.now()}-${index}`,
    type,
    name:text(source.name||source.label,type.replaceAll('_',' ').replaceAll('-',' ')),
    sets:number(source.sets,3,1),
    reps:number(source.reps,12,1),
    load:number(source.load,0),
    previousLoad:number(source.previousLoad,0),
    rest:number(source.rest,60),
    tip:text(source.tip,'Mantenha a execução controlada e a postura correta.')
  };
}

try{
  const parsed=JSON.parse(localStorage.getItem(STORE)||'null');
  const source=parsed&&typeof parsed==='object'?parsed:{};
  const exercises=Array.isArray(source.exercises)
    ?source.exercises.map(normalizeExercise)
    :DEFAULT_EXERCISES;
  const normalized={
    ...source,
    users:Array.isArray(source.users)?source.users:DEFAULT_USERS,
    exercises,
    sessions:Array.isArray(source.sessions)?source.sessions:[]
  };
  localStorage.setItem(STORE,JSON.stringify(normalized));
}catch{
  localStorage.setItem(STORE,JSON.stringify({users:DEFAULT_USERS,exercises:DEFAULT_EXERCISES,sessions:[]}));
}
