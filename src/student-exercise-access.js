import "./body-evolution-direct-fix.js?v=2";
import { displayName } from "./exercise-rename-translate.js";
import {
  readWorkoutData,
  writeWorkoutData,
} from "./lib/workout-state.js";

const DB =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const USER_KEY = "mayfit_user";
const CATALOG_KEY = "mayfit_exercise_catalog_v1";
const NAME_PREFIX = "mayfit_workout_name_";
let loading = false,
  allExercises = [];

const css = `
#mayfit-student-exercises{margin:0 0 18px;padding:16px;border:1px solid #31523d;border-radius:22px;background:#0d1711;color:#fff}
#mayfit-student-exercises .mse-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
#mayfit-student-exercises h2{margin:0;font-size:21px}#mayfit-student-exercises p{margin:5px 0 0;color:#9cac9f;font-size:13px}
#mayfit-student-exercises button{border:0;border-radius:12px;padding:11px 14px;background:#78d532;color:#07110c;font-weight:900;cursor:pointer}
#mse-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:14px;background:rgba(0,0,0,.82)}
#mse-modal .mse-card{width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;border:1px solid #3d6249;border-radius:22px;background:#0b130e;color:#fff;overflow:hidden}
#mse-modal .mse-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px;border-bottom:1px solid #263d2d}
#mse-modal h2{margin:0;font-size:21px}.mse-back{min-width:92px;height:40px;padding:0 12px!important;border:1px solid #385442!important;border-radius:12px!important;background:#17231b!important;color:#fff!important;font-size:15px!important;font-weight:900!important}
#mse-modal .mse-search{margin:12px 15px;padding:12px;border:1px solid #3a5743;border-radius:12px;background:#07100a;color:#fff;font-size:16px}
#mse-modal .mse-list{display:grid;gap:8px;padding:0 15px 15px;overflow:auto}
#mse-modal .mse-item{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px;border:1px solid #263d2d;border-radius:13px;background:#101a14}
#mse-modal .mse-thumb{width:72px;height:58px;display:block;object-fit:cover;border:1px solid #36513f;border-radius:10px;background:#07100a;cursor:zoom-in}
#mse-modal .mse-info{min-width:0;display:grid;gap:3px}.mse-info strong{font-weight:850;line-height:1.2}.mse-info small{color:#9cac9f;font-size:12px}
#mse-modal .mse-action{min-width:92px;padding:10px 12px;border-radius:11px;background:#78d532;color:#07110c;font-weight:950}
#mse-modal .mse-action.remove{background:#3b1c1c;color:#ffb5b5;border:1px solid #713737}
#mse-modal .mse-footer{padding:11px 15px;border-top:1px solid #263d2d;background:#0d1711;color:#9cac9f;font-size:13px}
.mse-image-zoom{position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.92)}.mse-image-zoom img{max-width:min(920px,96vw);max-height:86vh;object-fit:contain;border-radius:16px}.mse-image-zoom button{position:fixed;top:max(18px,env(safe-area-inset-top));left:18px;min-width:92px;height:44px;border:1px solid #49664f;border-radius:14px;background:#132018;color:#fff;font-size:15px;font-weight:900}
.mayfit-workout-name{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px}.mayfit-workout-name input{min-width:130px;max-width:100%;flex:1;border:0;border-bottom:2px solid #78d532;border-radius:0;background:transparent;color:inherit;font:inherit;font-weight:inherit;line-height:1.15;padding:0 2px 2px;outline:none}
@media(max-width:620px){#mayfit-student-exercises{padding:13px;border-radius:18px}#mayfit-student-exercises .mse-head{align-items:flex-start;flex-direction:column}#mayfit-student-exercises .mse-head>button{width:100%}#mse-modal{padding:0;align-items:end}#mse-modal .mse-card{max-height:94vh;border-radius:22px 22px 0 0}#mse-modal .mse-item{grid-template-columns:62px minmax(0,1fr);gap:8px}#mse-modal .mse-thumb{width:62px;height:52px}#mse-modal .mse-action{grid-column:1/-1;width:100%;min-width:0;padding:11px;font-size:14px}}
`;

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}
function readStore() {
  return readWorkoutData();
}
function writeStore(data) {
  writeWorkoutData(data);
}
function esc(value) {
  return String(value ?? "").replace(
    /[&<>'\"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '\"': "&quot;",
      })[char],
  );
}
function imageFor(item) {
  return item.image ? IMAGE_BASE + item.image : "";
}
function workoutNameKey() {
  return NAME_PREFIX + (currentUser()?.id || "student");
}

function ensureStyle() {
  if (document.getElementById("mse-style")) return;
  const style = document.createElement("style");
  style.id = "mse-style";
  style.textContent = css;
  document.head.appendChild(style);
}

function installWorkoutName() {
  const user = currentUser();
  if (user?.role !== "student") return;
  const title = document.querySelector(".app main .hero h1");
  if (!title || title.dataset.workoutNameReady === "true") return;
  if (title.querySelector("[data-workout-name-input]")) {
    title.dataset.workoutNameReady = "true";
    return;
  }
  title.dataset.workoutNameReady = "true";
  title.classList.add("mayfit-workout-name");
  const store = readStore();
  const legacy = localStorage.getItem(workoutNameKey());
  const saved = String(
    store?.workoutName || legacy || user.name || user.full_name || "Treino A",
  ).trim();
  title.innerHTML = "";
  const input = document.createElement("input");
  input.type = "text";
  input.value = saved;
  input.placeholder = "Nome do treino";
  input.setAttribute("aria-label", "Nome do treino");
  const saveName = () => {
    const value = input.value.trim() || "Treino A";
    const current = readStore();
    if (current) writeStore({ ...current, workoutName: value });
    localStorage.setItem(workoutNameKey(), value);
  };
  ["click", "pointerdown", "touchstart"].forEach((type) =>
    input.addEventListener(type, (event) => event.stopPropagation()),
  );
  input.addEventListener("input", saveName);
  input.addEventListener("blur", saveName);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
  title.append(input);
}

function installEvolutionLabel() {
  if (currentUser()?.role !== "student") return;
  const cards = [...document.querySelectorAll(".app main .summary article")];
  const card = cards.find((item) =>
    /treinos salvos/i.test(item.textContent || ""),
  );
  if (!card) return;
  const strong = card.querySelector("strong");
  if (strong) strong.remove();
  const label = [...card.querySelectorAll("span")].find((item) =>
    /treinos salvos/i.test(item.textContent || ""),
  );
  if (label) label.textContent = "Evolução de cargas";
  card.setAttribute("aria-label", "Abrir evolução de cargas");
}

function openImage(src, name) {
  document.querySelector(".mse-image-zoom")?.remove();
  const zoom = document.createElement("div");
  zoom.className = "mse-image-zoom";
  zoom.innerHTML = `<button type="button">← Voltar</button><img src="${esc(src)}" alt="${esc(name)}">`;
  zoom.querySelector("button").onclick = () => zoom.remove();
  zoom.onclick = (e) => {
    if (e.target === zoom) zoom.remove();
  };
  document.body.appendChild(zoom);
}

function prewarmImages(items) {
  const urls = items.map(imageFor).filter(Boolean).slice(0, 100);
  const run = () =>
    urls.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  if ("requestIdleCallback" in window)
    requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 200);
}

function renderList(modal) {
  const query = (modal.querySelector(".mse-search").value || "")
    .trim()
    .toLowerCase();
  const store = readStore();
  const exercises = Array.isArray(store?.exercises) ? store.exercises : [];
  const used = new Map(exercises.map((item) => [item.type, item]));
  const filtered = allExercises.filter(
    (item) => !query || item.name.toLowerCase().includes(query),
  );
  modal.querySelector(".mse-list").innerHTML =
    filtered
      .map((item) => {
        const existing = used.get(item.id),
          image = imageFor(item);
        const thumb = image
          ? `<img class="mse-thumb" data-image="${esc(image)}" src="${esc(image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">`
          : '<span class="mse-thumb" aria-hidden="true"></span>';
        return `<article class="mse-item" data-type="${esc(item.id)}">${thumb}<span class="mse-info"><strong>${esc(item.name)}</strong><small>${existing ? "Já está no seu treino" : "Disponível para adicionar"}</small></span><button type="button" class="mse-action ${existing ? "remove" : ""}" data-action="${existing ? "remove" : "add"}" data-id="${existing?.id ?? ""}">${existing ? "Remover" : "Adicionar"}</button></article>`;
      })
      .join("") ||
    '<div style="padding:20px;text-align:center;color:#96a49a">Nenhum exercício encontrado.</div>';
  modal.querySelector(".mse-footer").textContent =
    `${exercises.length} exercício(s) no seu treino • ${filtered.length} exibido(s)`;
}

async function loadCatalog(modal) {
  if (allExercises.length) {
    renderList(modal);
    return;
  }
  if (loading) return;
  loading = true;
  modal.querySelector(".mse-list").innerHTML =
    '<div style="padding:20px;text-align:center;color:#96a49a">Carregando exercícios...</div>';
  try {
    const cached = localStorage.getItem(CATALOG_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length)
        allExercises = parsed.map((item) => ({
          ...item,
          name: displayName(item.id, item.sourceName || item.name),
        }));
    }
    if (allExercises.length) {
      renderList(modal);
      prewarmImages(allExercises);
      return;
    }
    const response = await fetch(DB, { cache: "force-cache" });
    if (!response.ok) throw new Error("Falha ao carregar catálogo");
    const data = await response.json();
    allExercises = (Array.isArray(data) ? data : [])
      .map((item) => ({
        id: item.id,
        sourceName: item.name,
        name: displayName(item.id, item.name),
        image: Array.isArray(item.images) ? item.images[0] : "",
      }))
      .filter((item) => item.id && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(allExercises));
    } catch {}
    renderList(modal);
    prewarmImages(allExercises);
  } catch (error) {
    modal.querySelector(".mse-list").innerHTML =
      `<div style="padding:20px;text-align:center;color:#ffb4b4">${esc(error.message)}. Tente novamente.</div>`;
  } finally {
    loading = false;
  }
}

function addExercise(type) {
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) {
    alert("Não foi possível acessar os treinos salvos.");
    return false;
  }
  if (store.exercises.some((item) => item.type === type)) return true;
  const item = allExercises.find((exercise) => exercise.id === type);
  if (!item) return false;
  const nextId =
    Math.max(
      0,
      ...store.exercises.map((exercise) => Number(exercise.id) || 0),
    ) + 1;
  writeStore({
    ...store,
    exercises: [
      ...store.exercises,
      {
        id: nextId,
        type: item.id,
        name: item.name,
        sets: 3,
        reps: 12,
        load: 0,
        previousLoad: 0,
        rest: 60,
        tip: "Execute o movimento com controle e postura correta.",
      },
    ],
  });
  return true;
}

function removeExercise(type, id) {
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) return false;
  const exercise = store.exercises.find(
    (item) => String(item.id) === String(id) || item.type === type,
  );
  if (!exercise) return true;
  if (!confirm(`Remover ${exercise.name || "este exercício"} do seu treino?`))
    return false;
  writeStore({
    ...store,
    exercises: store.exercises.filter(
      (item) => String(item.id) !== String(exercise.id),
    ),
  });
  return true;
}

function openManager() {
  const modal = document.createElement("div");
  modal.id = "mse-modal";
  modal.innerHTML =
    '<div class="mse-card"><div class="mse-top"><div><h2>Adicionar ou remover exercícios</h2><div style="color:#9cac9f;font-size:13px;margin-top:4px">Gerencie tudo nesta mesma tela.</div></div><button class="mse-back" type="button">← Voltar</button></div><input class="mse-search" placeholder="Pesquisar exercício"><div class="mse-list"></div><div class="mse-footer"></div></div>';
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".mse-back").onclick = close;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  modal.querySelector(".mse-search").oninput = () => renderList(modal);
  modal.querySelector(".mse-list").addEventListener("click", (event) => {
    const image = event.target.closest(".mse-thumb[data-image]");
    if (image) {
      event.preventDefault();
      openImage(image.dataset.image, image.alt);
      return;
    }
    const button = event.target.closest(".mse-action");
    if (!button) return;
    const item = button.closest(".mse-item");
    const type = item?.dataset.type;
    if (!type) return;
    button.disabled = true;
    const changed =
      button.dataset.action === "add"
        ? addExercise(type)
        : removeExercise(type, button.dataset.id);
    button.disabled = false;
    if (changed) renderList(modal);
  });
  loadCatalog(modal);
}

function mountStudentExercises() {
  if (currentUser()?.role !== "student") return false;
  if (document.querySelector(".workout-screen")) {
    document.getElementById("mayfit-student-exercises")?.remove();
    return false;
  }
  const main = document.querySelector(".app main");
  if (!main) return false;
  if (document.getElementById("mayfit-student-exercises")) return true;
  const section = document.createElement("section");
  section.id = "mayfit-student-exercises";
  section.innerHTML =
    '<div class="mse-head"><div><h2>Meus exercícios</h2><p>Adicione ou remova exercícios do seu treino.</p></div><button type="button">Adicionar/remover exercícios</button></div>';
  section.querySelector("button").onclick = openManager;
  main.prepend(section);
  return true;
}

function apply() {
  if (typeof document === "undefined") return;
  ensureStyle();
  installWorkoutName();
  installEvolutionLabel();
  mountStudentExercises();
}
const observer = new MutationObserver(() => {
  if (
    typeof document !== "undefined" &&
    typeof requestAnimationFrame !== "undefined"
  )
    requestAnimationFrame(apply);
});
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("pageshow", apply);
window.addEventListener("focus", apply);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) apply();
});
window.addEventListener("mayfit-store-updated", apply);
apply();
