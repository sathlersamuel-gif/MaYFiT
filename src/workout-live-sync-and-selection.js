const STORE = "mayfit_v8";
let activeTab = "all";

const exactTranslations = {
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

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "null");
  } catch {
    return null;
  }
}
function writeStore(store) {
  localStorage.setItem(STORE, JSON.stringify(store));
  window.dispatchEvent(new Event("mayfit-store-updated"));
}
function normalizeName(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}
function isCorrupted(value) {
  const text = String(value || "");
  return (
    text.length > 90 ||
    /(?:ÃO|Ãƒ|Ã‚|PRESSÃO){4,}/i.test(text) ||
    /(.{2,6})\1{5,}/i.test(text)
  );
}
function repairedName(item) {
  const current = normalizeName(item?.name);
  const type = normalizeName(item?.type);
  if (isCorrupted(current))
    return exactTranslations[type] || type || "Exercício";
  return (
    exactTranslations[current] ||
    current ||
    exactTranslations[type] ||
    type ||
    "Exercício"
  );
}

function repairStoredNames() {
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) return;
  let changed = false;
  const seen = new Set();
  const exercises = store.exercises.flatMap((item) => {
    const type = String(item?.type || "")
      .trim()
      .toLowerCase();
    if (!type || seen.has(type)) {
      changed = true;
      return [];
    }
    seen.add(type);
    const name = repairedName(item);
    if (name !== item.name) {
      changed = true;
      return [{ ...item, name }];
    }
    return [item];
  });
  if (changed) writeStore({ ...store, exercises });
}

function ensureStyles() {
  document.getElementById("mayfit-selected-workouts-style")?.remove();
  if (document.getElementById("mayfit-workout-tabs-style")) return;
  const style = document.createElement("style");
  style.id = "mayfit-workout-tabs-style";
  style.textContent = `
  #mse-modal .mse-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 15px 0;padding:4px;border:1px solid #334d3a;border-radius:14px;background:#0a120d}
  #mse-modal .mse-tab{height:42px;padding:0 10px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#aab8ae!important;font-size:14px!important;font-weight:900!important}
  #mse-modal .mse-tab.active{background:#78d532!important;color:#07110c!important;box-shadow:0 3px 12px rgba(120,213,50,.24)!important}
  #mse-modal .mse-item.mse-hidden-by-tab{display:none!important}
  #mse-modal .mse-load-more[hidden]{display:none!important}
  #mse-modal .mse-tab-empty{padding:26px 16px;text-align:center;color:#9cac9f;font-size:14px}
  #mse-modal .mse-action.mse-saving{opacity:.72;pointer-events:none}
  @media(max-width:620px){#mse-modal .mse-tabs{margin:10px 12px 0}.mse-card .mse-search{margin-top:10px!important}}
  `;
  document.head.appendChild(style);
}

function exerciseTypeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function selectedExercises() {
  const store = readStore();
  const source = Array.isArray(store?.exercises) ? store.exercises : [];
  const seen = new Set();
  return source.filter((item) => {
    const key = exerciseTypeKey(item?.type);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectedTypes() {
  return new Set(selectedExercises().map((item) => exerciseTypeKey(item.type)));
}

function applyTab(modal) {
  if (typeof document === "undefined" || !modal?.isConnected) return;
  const list = modal.querySelector(".mse-list");
  if (!list) return;
  const selected = selectedTypes();
  let visible = 0;
  list.querySelectorAll(".mse-item").forEach((item) => {
    const show =
      activeTab === "all" || selected.has(exerciseTypeKey(item.dataset.type));
    item.classList.toggle("mse-hidden-by-tab", !show);
    if (show) visible++;
  });
  const loadMore = list.querySelector(".mse-load-more,[data-load-more]");
  if (loadMore) loadMore.hidden = activeTab === "selected";
  let empty = list.querySelector(".mse-tab-empty");
  if (activeTab === "selected" && visible === 0) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "mse-tab-empty";
      empty.textContent = "Nenhum exercício selecionado.";
      list.appendChild(empty);
    }
  } else empty?.remove();
  modal
    .querySelector('[data-tab="selected"]')
    ?.replaceChildren(
      document.createTextNode(`Selecionados (${selected.size})`),
    );
  modal
    .querySelectorAll(".mse-tab")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.tab === activeTab),
    );
  refreshFooter(modal);
}

function installTabs(modal) {
  if (typeof document === "undefined" || !modal?.isConnected) return;
  modal.querySelector(".mse-selected-panel")?.remove();
  const search = modal.querySelector(".mse-search");
  if (!search) return;
  let tabs = modal.querySelector(".mse-tabs");
  if (!tabs) {
    tabs = document.createElement("div");
    tabs.className = "mse-tabs";
    tabs.innerHTML =
      '<button type="button" class="mse-tab" data-tab="all">Todos</button><button type="button" class="mse-tab" data-tab="selected">Selecionados (0)</button>';
    search.before(tabs);
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest(".mse-tab");
      if (!button) return;
      activeTab = button.dataset.tab;
      applyTab(modal);
    });
  }
  applyTab(modal);
}

function refreshFooter(modal) {
  const total = selectedExercises().length;
  const footer = modal.querySelector(".mse-footer");
  if (!footer) return;
  const shown = [...modal.querySelectorAll(".mse-item")].filter(
    (item) => !item.classList.contains("mse-hidden-by-tab"),
  ).length;
  footer.textContent = `${total} exercício(s) no seu treino • ${shown} exibido(s)`;
}

function updateRowInPlace(item, exercise) {
  const button = item.querySelector(".mse-action");
  const info = item.querySelector(".mse-info small");
  if (!button) return;
  if (exercise) {
    button.dataset.action = "remove";
    button.dataset.id = String(exercise.id);
    button.classList.add("remove");
    button.textContent = "Remover";
    if (info) info.textContent = "Já está no seu treino";
  } else {
    button.dataset.action = "add";
    button.dataset.id = "";
    button.classList.remove("remove");
    button.textContent = "Adicionar";
    if (info) info.textContent = "Disponível para adicionar";
  }
}

function silentToggleExercise(button, item) {
  const type = String(item?.dataset.type || "");
  if (!type) return;
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) return;
  const exercises = selectedExercises();
  button.classList.add("mse-saving");
  const existing = exercises.find(
    (exercise) =>
      exerciseTypeKey(exercise.type) === exerciseTypeKey(type) ||
      String(exercise.id) === String(button.dataset.id || ""),
  );
  let nextExercises;
  let nextExercise = null;
  if (existing) {
    if (!confirm(`Remover ${repairedName(existing)} do treino?`)) {
      button.classList.remove("mse-saving");
      return;
    }
    nextExercises = exercises.filter(
      (exercise) => String(exercise.id) !== String(existing.id),
    );
  } else {
    const name =
      normalizeName(item.querySelector(".mse-info strong")?.textContent) ||
      type;
    const nextId =
      Math.max(0, ...exercises.map((exercise) => Number(exercise.id) || 0)) + 1;
    nextExercise = {
      id: nextId,
      type,
      name,
      sets: 3,
      reps: 12,
      load: 0,
      previousLoad: 0,
      rest: 60,
      tip: "Execute o movimento com controle e postura correta.",
    };
    nextExercises = [...exercises, nextExercise];
  }
  writeStore({ ...store, exercises: nextExercises });
  updateRowInPlace(item, nextExercise);
  const modal = item.closest("#mse-modal");
  if (modal) {
    refreshFooter(modal);
    applyTab(modal);
  }
  requestAnimationFrame(() => button.classList.remove("mse-saving"));
}

function refreshManagerInPlace() {
  if (
    typeof document === "undefined" ||
    typeof requestAnimationFrame === "undefined"
  )
    return;
  const modal = document.getElementById("mse-modal");
  if (!modal) return;
  requestAnimationFrame(() => {
    if (typeof document === "undefined" || !modal.isConnected) return;
    installTabs(modal);
    applyTab(modal);
    refreshFooter(modal);
  });
}

const LEGACY_KEYS = [
  "mayfit_workout_data_dirty",
  "mayfit_open_workout_after_sync",
  "mayfit_sync_open_workout",
  "mayfit_workout_changed",
];
function markWorkoutDirty() {
  refreshManagerInPlace();
}

document.addEventListener(
  "click",
  (event) => {
    const action = event.target.closest?.(
      "#mse-modal .mse-action[data-action]",
    );
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      silentToggleExercise(action, action.closest(".mse-item"));
      return;
    }
  },
  true,
);

repairStoredNames();
LEGACY_KEYS.forEach((key) => sessionStorage.removeItem(key));
ensureStyles();
const observer = new MutationObserver(() => {
  if (
    typeof document !== "undefined" &&
    typeof requestAnimationFrame !== "undefined"
  )
    requestAnimationFrame(refreshManagerInPlace);
});
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("mayfit-store-updated", markWorkoutDirty);
window.addEventListener("storage", (event) => {
  if (event.key === STORE) markWorkoutDirty();
});
window.addEventListener("pageshow", refreshManagerInPlace);
refreshManagerInPlace();
