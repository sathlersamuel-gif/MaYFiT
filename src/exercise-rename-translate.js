import {
  readWorkoutData,
  writeWorkoutData,
} from "./lib/workout-state.js";

const CUSTOM_KEY = "mayfit_catalog_custom_names_v1";

const translations = {
  "3/4 Sit-Up": "Abdominal 3/4",
  "90/90 Hamstring": "Alongamento posterior 90/90",
  "Ab Crunch Machine": "Abdominal na máquina",
  "Ab Roller": "Roda abdominal",
  "Barbell Bench Press - Medium Grip": "Supino reto com barra",
  "Barbell Bench Press": "Supino reto com barra",
  "Dumbbell Bench Press": "Supino reto com halteres",
  "Incline Barbell Bench Press": "Supino inclinado com barra",
  "Incline Dumbbell Press": "Supino inclinado com halteres",
  "Decline Barbell Bench Press": "Supino declinado com barra",
  "Barbell Squat": "Agachamento com barra",
  "Front Barbell Squat": "Agachamento frontal com barra",
  "Leg Press": "Prensa de pernas",
  "Leg Extensions": "Cadeira extensora",
  "Lying Leg Curls": "Mesa flexora",
  "Seated Leg Curl": "Cadeira flexora",
  "Standing Calf Raises": "Panturrilha em pé",
  "Seated Calf Raise": "Panturrilha sentado",
  "Barbell Deadlift": "Levantamento terra com barra",
  "Romanian Deadlift": "Levantamento terra romeno",
  "Seated Cable Rows": "Remada baixa na polia",
  "Bent Over Barbell Row": "Remada curvada com barra",
  "Wide-Grip Lat Pulldown": "Puxada frontal aberta",
  "Close-Grip Front Lat Pulldown": "Puxada frontal fechada",
  Pullups: "Barra fixa",
  "Chin-Up": "Barra fixa supinada",
  "Dumbbell Shoulder Press": "Desenvolvimento com halteres",
  "Military Press": "Desenvolvimento militar",
  "Side Lateral Raise": "Elevação lateral",
  "Front Dumbbell Raise": "Elevação frontal com halteres",
  "Barbell Curl": "Rosca direta com barra",
  "Dumbbell Bicep Curl": "Rosca bíceps com halteres",
  "Hammer Curls": "Rosca martelo",
  "Preacher Curl": "Rosca Scott",
  "Triceps Pushdown": "Tríceps na polia",
  "Dips - Triceps Version": "Mergulho para tríceps",
  "Skull Crusher": "Tríceps testa",
  "Barbell Hip Thrust": "Elevação pélvica com barra",
  Crunches: "Abdominal",
  Plank: "Prancha abdominal",
  Pushups: "Flexão de braços",
};

Object.assign(translations, {
  "Ankle Circles": "Círculos com os tornozelos",
  "Anterior Tibialis-SMR": "Liberação do tibial anterior",
  "Atlas Stone Trainer": "Treino com pedra Atlas",
  "Atlas Stones": "Pedras Atlas",
  "Battling Ropes": "Cordas navais",
  Bicycling: "Pedalada",
  "Bicycling, Stationary": "Bicicleta ergométrica",
  "Brachialis-SMR": "Liberação do braquial",
  "Butt-Ups": "Elevação do quadril",
  Butterfly: "Borboleta",
  "Car Drivers": "Giro com anilha",
  "Child's Pose": "Postura da criança",
  "Circus Bell": "Halter circense",
  Cocoons: "Abdominal casulo",
  "Conan's Wheel": "Roda de Conan",
  Crucifix: "Crucifixo",
  "Dead Bug": "Abdominal inseto morto",
  "Elliptical Trainer": "Elíptico",
  "Farmer's Walk": "Caminhada do fazendeiro",
  "Fast Skipping": "Salto rápido",
  "Flutter Kicks": "Tesoura abdominal",
  "Foot-SMR": "Liberação dos pés",
  "Gironda Sternum Chins": "Barra Gironda no esterno",
  "Good Morning": "Bom dia",
  "Good Morning off Pins": "Bom dia partindo dos pinos",
  Groiners: "Alongamento dinâmico da virilha",
  "Heavy Bag Thrust": "Empurrada de saco pesado",
  "Iliotibial Tract-SMR": "Liberação do trato iliotibial",
  Inchworm: "Caminhada com as mãos",
  "Iron Cross": "Cruz de ferro",
  "Jogging, Treadmill": "Trote na esteira",
  "Keg Load": "Levantamento de barril",
  "Kettlebell Figure 8": "Peso russo em oito",
  "Kettlebell Pirate Ships": "Navio pirata com peso russo",
  "Kettlebell Thruster": "Agachamento e desenvolvimento com peso russo",
  "Kettlebell Windmill": "Moinho com peso russo",
  "Landmine 180's": "Rotação 180° na barra ancorada",
  "Landmine Linear Jammer": "Empurrada linear na barra ancorada",
  "Lateral Bound": "Salto lateral",
  "Latissimus Dorsi-SMR": "Liberação do grande dorsal",
  "Leg Press": "Prensa de pernas",
  "Linear 3-Part Start Technique": "Técnica de largada linear em 3 partes",
  "London Bridges": "Ponte londrina",
  "Looking At Ceiling": "Olhar para o teto",
  "Monster Walk": "Caminhada monstro",
  "Mountain Climbers": "Escalador",
  "Moving Claw Series": "Série garra em movimento",
  "Peroneals-SMR": "Liberação dos fibulares",
  "Piriformis-SMR": "Liberação do piriforme",
  "Prowler Sprint": "Corrida com trenó",
  Pyramid: "Pirâmide",
  "Quick Leap": "Salto rápido",
  "Rack Delivery": "Colocação no suporte",
  "Rack Pulls": "Levantamento parcial no suporte",
  "Rhomboids-SMR": "Liberação dos romboides",
  "Rickshaw Carry": "Caminhada com riquixá",
  "Rowing, Stationary": "Remo ergométrico",
  "Running, Treadmill": "Corrida na esteira",
  "Sandbag Load": "Levantamento de saco de areia",
  Skating: "Patinação",
  "Spell Caster": "Giro com anilha",
  "Spider Crawl": "Caminhada aranha",
  Stairmaster: "Simulador de escada",
  "Stomach Vacuum": "Vácuo abdominal",
  Superman: "Superman",
  "Tire Flip": "Virada de pneu",
  "Toe Touchers": "Toque nos pés",
  "Walking, Treadmill": "Caminhada na esteira",
  "Wind Sprints": "Tiros de corrida",
  Windmills: "Moinhos",
  "Yoke Walk": "Caminhada com jugo",
});

const phrases = {
  "body weight": "peso corporal",
  "close grip": "pegada fechada",
  "wide grip": "pegada aberta",
  "medium grip": "pegada média",
  overhead: "acima da cabeça",
  "straight arm": "braço estendido",
  "single arm": "um braço",
  "one arm": "um braço",
  "single leg": "uma perna",
  "one leg": "uma perna",
  "upper body": "parte superior do corpo",
  "lower body": "parte inferior do corpo",
  "range of motion": "amplitude de movimento",
  "on the floor": "no chão",
  "behind the neck": "atrás da nuca",
};
const words = {
  ab: "abdominal",
  adductor: "adutor",
  advanced: "avançado",
  alternate: "alternado",
  alternating: "alternado",
  arm: "braço",
  arms: "braços",
  back: "costas",
  backward: "para trás",
  balance: "equilíbrio",
  ball: "bola",
  band: "elástico",
  bands: "elásticos",
  bar: "barra",
  barbell: "barra",
  bench: "banco",
  bent: "inclinado",
  biceps: "bíceps",
  bike: "bicicleta",
  body: "corpo",
  bodyweight: "peso corporal",
  box: "caixa",
  bridge: "ponte",
  cable: "polia",
  calf: "panturrilha",
  calves: "panturrilhas",
  chair: "cadeira",
  chest: "peito",
  chin: "queixo",
  clean: "arremesso",
  close: "fechada",
  concentration: "concentrada",
  crossover: "cruzamento",
  crunch: "abdominal",
  crunches: "abdominais",
  curl: "rosca",
  curls: "roscas",
  deadlift: "levantamento terra",
  deadlifts: "levantamentos terra",
  decline: "declinado",
  delt: "deltoide",
  deltoid: "deltoide",
  dip: "mergulho",
  dips: "mergulhos",
  double: "duplo",
  down: "para baixo",
  dumbbell: "halteres",
  dynamic: "dinâmico",
  elbow: "cotovelo",
  elbows: "cotovelos",
  elevated: "elevado",
  extension: "extensão",
  extensions: "extensões",
  external: "externa",
  face: "rosto",
  flat: "reto",
  flexor: "flexor",
  floor: "chão",
  fly: "voador",
  flye: "voador",
  flyes: "voador",
  front: "frontal",
  glute: "glúteo",
  grip: "pegada",
  groin: "virilha",
  hammer: "martelo",
  hamstring: "posterior de coxa",
  hang: "suspenso",
  hanging: "suspenso",
  head: "cabeça",
  high: "alto",
  hip: "quadril",
  hips: "quadris",
  hops: "saltos",
  incline: "inclinado",
  inner: "interno",
  internal: "interna",
  isometric: "isométrico",
  jump: "salto",
  kick: "chute",
  kickback: "coice",
  knee: "joelho",
  kneeling: "ajoelhado",
  knees: "joelhos",
  lat: "dorsal",
  leg: "perna",
  legged: "perna",
  legs: "pernas",
  lift: "elevação",
  low: "baixo",
  lower: "inferior",
  lunge: "avanço",
  lying: "deitado",
  machine: "máquina",
  medicine: "medicinal",
  military: "militar",
  narrow: "estreita",
  neck: "pescoço",
  oblique: "oblíquo",
  open: "aberta",
  palms: "palmas",
  parallel: "paralelo",
  pelvic: "pélvica",
  plate: "anilha",
  plank: "prancha",
  power: "potência",
  preacher: "scott",
  press: "desenvolvimento",
  presses: "desenvolvimentos",
  prone: "pronado",
  pulldown: "puxada",
  pulldowns: "puxadas",
  pulley: "polia",
  pull: "puxada",
  pullover: "pulôver",
  push: "empurrada",
  pushdown: "tríceps na polia",
  pushups: "flexões",
  quad: "quadríceps",
  quadriceps: "quadríceps",
  raise: "elevação",
  raises: "elevações",
  rear: "posterior",
  resistance: "resistência",
  reverse: "inverso",
  romanian: "romeno",
  rope: "corda",
  rotation: "rotação",
  row: "remada",
  rows: "remadas",
  running: "corrida",
  seated: "sentado",
  shoulder: "ombro",
  shoulders: "ombros",
  shrug: "encolhimento",
  shrugs: "encolhimentos",
  side: "lateral",
  single: "único",
  sit: "abdominal",
  sled: "trenó",
  smith: "smith",
  snatch: "arranco",
  split: "dividido",
  squat: "agachamento",
  squats: "agachamentos",
  standing: "em pé",
  step: "passada",
  straight: "estendido",
  stretch: "alongamento",
  sumo: "sumô",
  supine: "supinado",
  suspended: "suspenso",
  swing: "balanço",
  swings: "balanços",
  thigh: "coxa",
  throw: "arremesso",
  tricep: "tríceps",
  triceps: "tríceps",
  twist: "rotação",
  twists: "rotações",
  upright: "vertical",
  upper: "superior",
  walking: "caminhando",
  wall: "parede",
  weighted: "com peso",
  wide: "aberta",
  wrist: "punho",
  with: "com",
  without: "sem",
  one: "um",
  two: "dois",
  the: "",
  of: "de",
  and: "e",
  on: "em",
  from: "a partir de",
  to: "para",
  up: "",
  version: "versão",
};

Object.assign(phrases, {
  "all fours": "quatro apoios",
  "bent over": "curvado",
  "bottoms up": "de baixo para cima",
  "get up": "levantada",
  "pull up": "barra fixa",
  "pull ups": "barras fixas",
  "push up": "flexão de braços",
  "push ups": "flexões de braços",
  "sit up": "abdominal",
  "sit ups": "abdominais",
  "muscle up": "subida na barra",
  "behind back": "atrás das costas",
});

Object.assign(words, {
  abductor: "abdutor",
  above: "acima",
  acceleration: "aceleração",
  achilles: "aquiles",
  across: "transversal",
  adduction: "adução",
  adductions: "aduções",
  against: "contra",
  air: "aéreo",
  all: "todos",
  an: "um",
  ankle: "tornozelo",
  anti: "anti",
  apart: "afastado",
  around: "ao redor",
  assisted: "assistido",
  attachment: "acessório",
  axle: "eixo",
  bars: "barras",
  bear: "urso",
  behind: "atrás",
  below: "abaixo",
  bend: "flexão",
  bends: "flexões",
  between: "entre",
  bicep: "bíceps",
  blocks: "blocos",
  board: "tábua",
  bottoms: "base",
  bound: "salto",
  butt: "glúteos",
  cambered: "curvada",
  car: "volante",
  catch: "recepção",
  chain: "corrente",
  chains: "correntes",
  chins: "barra supinada",
  chop: "corte",
  circles: "círculos",
  climb: "escalada",
  clock: "relógio",
  cone: "cone",
  crawl: "rastejamento",
  cross: "cruzado",
  crosses: "cruzamentos",
  crusher: "extensão",
  cuban: "cubano",
  dancer: "dançarino",
  db: "halteres",
  dead: "morto",
  deficit: "déficit",
  depth: "profundidade",
  donkey: "burrinho",
  downward: "descendente",
  drag: "arrasto",
  drags: "arrastos",
  drill: "exercício técnico",
  drop: "queda",
  dumbbells: "halteres",
  exercise: "exercício",
  extended: "estendido",
  facing: "voltado",
  fallout: "extensão abdominal",
  feet: "pés",
  finger: "dedo",
  flexion: "flexão",
  flexors: "flexores",
  flip: "virada",
  forearm: "antebraço",
  forward: "para frente",
  fours: "apoios",
  freehand: "livre",
  frog: "sapo",
  full: "completo",
  gastrocnemius: "gastrocnêmio",
  get: "levantada",
  goblet: "cálice",
  good: "bom",
  gorilla: "gorila",
  grab: "pegada",
  gravity: "gravidade",
  greatest: "maior",
  guillotine: "guilhotina",
  half: "meio",
  ham: "posterior de coxa",
  hand: "mão",
  handed: "uma mão",
  handle: "pegador",
  hands: "mãos",
  handstand: "parada de mãos",
  harness: "arnês",
  heaving: "impulsionado",
  heel: "calcanhar",
  hop: "salto",
  hug: "abraço",
  hurdle: "barreira",
  hyperextension: "hiperextensão",
  hyperextensions: "hiperextensões",
  in: "em",
  intermediate: "intermediário",
  into: "para",
  inverted: "invertido",
  iron: "ferro",
  iso: "isométrico",
  it: "iliotibial",
  jackknife: "canivete",
  jammer: "empurrada",
  jerk: "arremesso",
  judo: "judô",
  jumping: "saltando",
  kettlebell: "peso russo",
  kettlebells: "pesos russos",
  kipping: "com balanço",
  landmine: "barra ancorada",
  laterals: "laterais",
  leap: "salto",
  leverage: "alavanca",
  locust: "gafanhoto",
  log: "tronco",
  long: "longo",
  lunges: "avanços",
  medium: "média",
  mid: "médio",
  middle: "meio",
  mill: "moinho",
  mixed: "mista",
  morning: "bom dia",
  mornings: "bons dias",
  movers: "movimentos",
  multiple: "múltiplo",
  muscle: "muscular",
  neutral: "neutra",
  no: "sem",
  off: "a partir",
  olympic: "olímpico",
  or: "ou",
  over: "sobre",
  palm: "palma",
  partials: "parciais",
  pass: "passagem",
  peroneals: "fibulares",
  physioball: "bola suíça",
  pike: "posição em V",
  pin: "pino",
  pinch: "pinça",
  pistol: "pistola",
  platform: "plataforma",
  plie: "plié",
  plyo: "pliométrico",
  point: "ponto",
  position: "posição",
  positions: "posições",
  powerlifting: "levantamento de potência",
  progression: "progressão",
  pronated: "pronada",
  pronation: "pronação",
  pullup: "barra fixa",
  quick: "rápido",
  rack: "suporte",
  range: "amplitude",
  recumbent: "reclinado",
  release: "liberação",
  renegade: "renegado",
  response: "resposta",
  return: "retorno",
  rickshaw: "riquixá",
  ring: "argolas",
  rocket: "foguete",
  rocking: "balanço",
  roller: "rolo",
  rollout: "extensão",
  rotations: "rotações",
  round: "redondo",
  run: "corrida",
  runner: "corredor",
  russian: "russo",
  saw: "serrote",
  scaption: "elevação escapular",
  scapular: "escapular",
  scissor: "tesoura",
  scissors: "tesouras",
  scoop: "arremesso baixo",
  see: "ver",
  seesaw: "gangorra",
  shotgun: "espingarda",
  shuffle: "deslocamento lateral",
  sides: "lados",
  skip: "salto",
  skull: "crânio",
  skullcrusher: "tríceps testa",
  slam: "arremesso ao chão",
  sledgehammer: "marreta",
  slides: "deslizamentos",
  smr: "liberação miofascial",
  soleus: "sóleo",
  speed: "velocidade",
  spider: "aranha",
  spinal: "espinhal",
  sprint: "corrida rápida",
  squeeze: "contração",
  squeezes: "contrações",
  stability: "estabilidade",
  stairs: "escadas",
  stance: "base",
  star: "estrela",
  stiff: "rígido",
  straddle: "afastado",
  straps: "alças",
  stride: "passada",
  style: "estilo",
  superman: "super-homem",
  supinated: "supinada",
  supination: "supinação",
  through: "através",
  tibialis: "tibial",
  tilt: "inclinação",
  toe: "ponta dos pés",
  torso: "tronco",
  touchers: "toques",
  touches: "toques",
  towel: "toalha",
  trail: "trilha",
  trap: "trapézio",
  tuck: "recolhido",
  tucks: "recolhimentos",
  turkish: "turco",
  underhand: "supinada",
  ups: "",
  upward: "ascendente",
  walk: "caminhada",
  windmill: "moinho",
  wipers: "limpadores",
  wood: "madeira",
  world: "mundo",
  worlds: "mundos",
  your: "seu",
  yoke: "jugo",
});

Object.assign(words, {
  a: "um",
  cat: "gato",
  hack: "guiado inclinado",
  motion: "movimento",
  sissy: "com inclinação posterior",
  smith: "máquina guiada",
});

function clean(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/[’']s\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function translated(value) {
  const text = clean(value);
  if (!text) return "Exercício";
  if (translations[text]) return translations[text];
  let result = text.toLowerCase();
  Object.entries(phrases)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([source, target]) => {
      result = result.replace(new RegExp(`\\b${source}\\b`, "g"), target);
    });
  result = result
    .split(/(\s+|[-/()])/)
    .map((part) => words[part] ?? part)
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([/),-])/g, "$1")
    .trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}
function readStore() {
  return readWorkoutData();
}
function writeStore(data) {
  writeWorkoutData(data);
}
function readCustom() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function writeCustom(data) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(data));
}
function saved() {
  const source = readStore()?.exercises;
  if (!Array.isArray(source)) return [];
  const seen = new Set();
  return source.filter((item) => {
    const type = clean(item?.type);
    const key = type.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function displayName(type, fallback) {
  return (
    clean(readCustom()[String(type)]) ||
    translated(fallback || type) ||
    "Exercício"
  );
}

function renameExercise(type, current) {
  const answer = prompt(
    "Digite o novo nome do exercício:",
    displayName(type, current),
  );
  if (answer === null) return;
  const name = clean(answer);
  if (!name) return;
  const custom = readCustom();
  custom[String(type)] = name;
  writeCustom(custom);
  const store = readStore();
  if (store && Array.isArray(store.exercises))
    writeStore({
      ...store,
      exercises: store.exercises.map((item) =>
        String(item.type) === String(type) ? { ...item, name } : item,
      ),
    });
  apply();
}

function ensureStyle() {
  if (document.getElementById("mayfit-targeted-fixes-style")) return;
  const style = document.createElement("style");
  style.id = "mayfit-targeted-fixes-style";
  style.textContent = `#mse-modal .mse-rename,.exercise-picker .mayfit-picker-rename{grid-column:1/-1;width:100%;margin-top:6px;padding:9px 10px!important;border:1px solid #476550!important;border-radius:10px!important;background:#142219!important;color:#9bea62!important;font-size:13px!important;font-weight:900!important;box-sizing:border-box}.be-modal .be-photo{cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important}.be-modal .be-photo img{display:block;width:100%;height:100%;object-fit:cover}`;
  document.head.appendChild(style);
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function enhanceStudentManager() {
  const modal = document.getElementById("mse-modal");
  if (!modal) return;
  const exercises = saved();
  const byType = new Map(
    exercises.map((item) => [clean(item.type).toLowerCase(), item]),
  );
  modal.querySelectorAll(".mse-item").forEach((row) => {
    const type = String(row.dataset.type || "");
    if (!type) return;
    const title = row.querySelector(".mse-info strong");
    if (!title) return;
    const original = row.dataset.originalName || clean(title.textContent);
    row.dataset.originalName = original;
    setText(title, displayName(type, original));
    let rename = row.querySelector(".mse-rename");
    if (!rename) {
      rename = document.createElement("button");
      rename.type = "button";
      rename.className = "mse-rename";
      rename.textContent = "Renomear";
      row.appendChild(rename);
    }
    rename.dataset.type = type;
    const existing = byType.get(clean(type).toLowerCase());
    const action = row.querySelector(".mse-action[data-action]");
    const status = row.querySelector(".mse-info small");
    if (action) {
      action.dataset.action = existing ? "remove" : "add";
      action.dataset.id = existing ? String(existing.id) : "";
      action.classList.toggle("remove", Boolean(existing));
      setText(action, existing ? "Remover" : "Adicionar");
    }
    setText(
      status,
      existing ? "Já está no seu treino" : "Disponível para adicionar",
    );
  });
  const total = exercises.length;
  const selected = modal.querySelector('[data-tab="selected"]');
  setText(selected, `Selecionados (${total})`);
  const footer = modal.querySelector(".mse-footer");
  if (footer && !modal.querySelector(".mse-tabs"))
    setText(footer, `${total} exercício(s) no seu treino`);
}

function enhanceAdminManager() {
  document.querySelectorAll(".exercise-picker .picker-item").forEach((row) => {
    const input = row.querySelector('input[type="checkbox"]');
    const title = row.querySelector("strong");
    if (!title) return;
    const original = row.dataset.originalName || clean(title.textContent);
    const inputValue = String(input?.value || "");
    const type = inputValue && inputValue !== "on" ? inputValue : original;
    row.dataset.type = type;
    row.dataset.originalName = original;
    setText(title, displayName(type, original));
    let rename = row.querySelector(".mayfit-picker-rename");
    if (!rename) {
      rename = document.createElement("button");
      rename.type = "button";
      rename.className = "mayfit-picker-rename";
      rename.textContent = "Renomear";
      row.appendChild(rename);
    }
    rename.dataset.type = type;
  });
}

function persistAdminNames() {
  const custom = readCustom();
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) return;
  let changed = false;
  const exercises = store.exercises.map((item) => {
    const name = clean(custom[String(item.type)] || custom[clean(item.name)]);
    if (name && name !== item.name) {
      changed = true;
      return { ...item, name };
    }
    return item;
  });
  if (changed) writeStore({ ...store, exercises });
}

function translateVisible() {
  const exercises = saved();
  const custom = readCustom();
  document
    .querySelectorAll(
      ".workout-screen .exercise-col>strong,.admin-card .admin-head strong",
    )
    .forEach((title) => {
      const current = clean(title.textContent);
      const item = exercises.find(
        (exercise) =>
          clean(exercise.name) === current || clean(exercise.type) === current,
      );
      setText(
        title,
        item
          ? clean(custom[String(item.type)]) || translated(item.name || item.type)
          : translated(current),
      );
    });
}

function preparePhoto(holder) {
  if (holder.dataset.photoFixed === "1") return;
  const input = holder.querySelector('input[type="file"][data-photo]');
  if (!input) return;
  holder.dataset.photoFixed = "1";
  input.accept = "image/*";
  holder.addEventListener("click", (event) => {
    if (event.target === input) return;
    event.preventDefault();
    input.click();
  });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    holder.querySelector("img")?.remove();
    holder.querySelectorAll("span").forEach((span) => span.remove());
    const image = document.createElement("img");
    image.alt = "Prévia da foto";
    image.src = url;
    image.onload = () => URL.revokeObjectURL(url);
    holder.prepend(image);
    holder.appendChild(input);
  });
}

function restorePhotos() {
  document.querySelectorAll(".be-modal .be-photo").forEach((holder) => {
    const input = holder.querySelector('input[type="file"][data-photo]');
    if (input && !clean(holder.textContent) && !holder.querySelector("img")) {
      const label = document.createElement("span");
      label.textContent = "Adicionar foto";
      holder.prepend(label);
    }
    preparePhoto(holder);
  });
}

function apply() {
  if (typeof document === "undefined") return;
  ensureStyle();
  enhanceStudentManager();
  enhanceAdminManager();
  translateVisible();
}

if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.(
        ".mse-rename,.mayfit-picker-rename",
      );
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const row = button.closest(".mse-item,.picker-item");
      renameExercise(
        button.dataset.type,
        row?.dataset.originalName ||
          row?.querySelector("strong")?.textContent ||
          "Exercício",
      );
    },
    true,
  );
  document.addEventListener(
    "click",
    (event) => {
      const add = event.target.closest?.(
        '#mse-modal .mse-action[data-action="add"]',
      );
      if (!add) return;
      const type = String(add.closest(".mse-item")?.dataset.type || "");
      const customName = readCustom()[type];
      if (!customName) return;
      setTimeout(() => {
        const store = readStore();
        if (store && Array.isArray(store.exercises))
          writeStore({
            ...store,
            exercises: store.exercises.map((item) =>
              String(item.type) === type ? { ...item, name: customName } : item,
            ),
          });
      }, 100);
    },
    true,
  );
  document.addEventListener(
    "click",
    (event) => {
      if (event.target.closest?.(".exercise-picker .picker-footer .primary"))
        setTimeout(persistAdminNames, 100);
    },
    true,
  );
  let queued = false;
  const observer = new MutationObserver(() => {
    if (
      queued ||
      typeof document === "undefined" ||
      typeof requestAnimationFrame === "undefined"
    )
      return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("mayfit-store-updated", apply);
  window.addEventListener("pageshow", apply);
  apply();
}
