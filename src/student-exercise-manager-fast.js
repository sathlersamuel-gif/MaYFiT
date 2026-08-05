import { displayName } from "./exercise-rename-translate.js";

const STORE = "mayfit_v8";
const CATALOG_KEY = "mayfit_exercise_catalog_v1";
const DB =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const PAGE_SIZE = 70;
const EAGER_IMAGES = 8;
let catalog = [];
let fetching = false;
const warmedImages = new Set();

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("mayfit_user") || "null");
  } catch {
    return null;
  }
}
function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "null");
  } catch {
    return null;
  }
}
function writeStore(data) {
  localStorage.setItem(STORE, JSON.stringify(data));
  window.dispatchEvent(new Event("mayfit-store-updated"));
}
function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
function imageUrl(item) {
  return item?.image ? IMAGE_BASE + item.image : "";
}
function exerciseKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function canonicalExercises(store = readStore()) {
  const source = Array.isArray(store?.exercises) ? store.exercises : [];
  const seen = new Set();
  return source.filter((item) => {
    const key = exerciseKey(item?.type);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cachedCatalog() {
  if (catalog.length) return catalog;
  try {
    const parsed = JSON.parse(localStorage.getItem(CATALOG_KEY) || "[]");
    if (Array.isArray(parsed) && parsed.length)
      catalog = parsed.map((item) => ({
        ...item,
        name: displayName(item.id, item.sourceName || item.name),
      }));
  } catch {}
  return catalog;
}

function prewarmVisibleImages(items) {
  const run = () =>
    items.slice(0, EAGER_IMAGES).forEach((item) => {
      const src = imageUrl(item);
      if (!src || warmedImages.has(src)) return;
      warmedImages.add(src);
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  if ("requestIdleCallback" in window)
    requestIdleCallback(run, { timeout: 1200 });
  else setTimeout(run, 180);
}

function installImageRecovery(root) {
  root.querySelectorAll('img.mse-thumb:not([data-image-recovery])').forEach((image) => {
    image.dataset.imageRecovery = "true";
    const original = image.getAttribute("src") || "";
    image.addEventListener("load", () => {
      image.style.visibility = "visible";
      image.classList.remove("mse-thumb-unavailable");
    });
    image.addEventListener("error", () => {
      const attempt = Number(image.dataset.imageAttempt || 0) + 1;
      image.dataset.imageAttempt = String(attempt);
      if (attempt <= 2 && original) {
        setTimeout(() => {
          const separator = original.includes("?") ? "&" : "?";
          image.src = `${original}${separator}mayfit_retry=${attempt}`;
        }, attempt * 350);
        return;
      }
      image.style.visibility = "visible";
      image.classList.add("mse-thumb-unavailable");
      image.removeAttribute("src");
    });
  });
}

async function refreshCatalog(modal) {
  if (fetching) return;
  fetching = true;
  try {
    const response = await fetch(DB, { cache: "force-cache" });
    if (!response.ok) return;
    const data = await response.json();
    catalog = (Array.isArray(data) ? data : [])
      .map((item) => ({
        id: item.id,
        sourceName: item.name,
        name: displayName(item.id, item.name),
        image: Array.isArray(item.images) ? item.images[0] : "",
      }))
      .filter((item) => item.id && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
    } catch {}
    prewarmVisibleImages(catalog);
    if (modal?.isConnected) render(modal, true);
  } catch {
  } finally {
    fetching = false;
  }
}

function addExercise(type) {
  const store = readStore();
  if (!store || !Array.isArray(store.exercises)) return false;
  const exercises = canonicalExercises(store);
  const key = exerciseKey(type);
  if (exercises.some((item) => exerciseKey(item.type) === key)) return true;
  const item = catalog.find((exercise) => exerciseKey(exercise.id) === key);
  if (!item) return false;
  const nextId =
    Math.max(0, ...exercises.map((exercise) => Number(exercise.id) || 0)) + 1;
  writeStore({
    ...store,
    exercises: [
      ...exercises,
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
  const exercises = canonicalExercises(store);
  const key = exerciseKey(type);
  const exercise = exercises.find(
    (item) => String(item.id) === String(id) || exerciseKey(item.type) === key,
  );
  if (!exercise) return true;
  if (!confirm(`Remover ${exercise.name || "este exercício"} do seu treino?`))
    return false;
  writeStore({
    ...store,
    exercises: exercises.filter(
      (item) => String(item.id) !== String(exercise.id),
    ),
  });
  return true;
}

function openImagePreview(src, alt) {
  document.getElementById("mse-image-preview")?.remove();
  const preview = document.createElement("div");
  preview.id = "mse-image-preview";
  preview.setAttribute("role", "dialog");
  preview.setAttribute("aria-label", alt || "Imagem ampliada do exercício");
  preview.style.cssText =
    "position:fixed;inset:0;z-index:200000;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.94);";
  preview.innerHTML = `<button type="button" aria-label="Fechar imagem" style="position:absolute;top:max(18px,env(safe-area-inset-top));right:18px;width:46px;height:46px;border:0;border-radius:14px;background:#17231b;color:#fff;font-size:28px;font-weight:900">×</button><img src="${esc(src)}" alt="${esc(alt || "Exercício")}" style="display:block;max-width:min(92vw,760px);max-height:84vh;width:auto;height:auto;object-fit:contain;border-radius:16px;background:#050806">`;
  const close = () => preview.remove();
  preview.querySelector("button").onclick = close;
  preview.addEventListener("click", (event) => {
    if (event.target === preview) close();
  });
  document.body.appendChild(preview);
}

function render(modal, reset = false) {
  if (!modal?.isConnected) return;
  const search = modal.querySelector(".mse-search");
  const list = modal.querySelector(".mse-list");
  const footer = modal.querySelector(".mse-footer");
  if (reset) modal.dataset.limit = String(PAGE_SIZE);
  const query = (search?.value || "").trim().toLowerCase();
  const store = readStore();
  const exercises = canonicalExercises(store);
  const used = new Map(exercises.map((item) => [exerciseKey(item.type), item]));
  const source = cachedCatalog();
  const byType = new Map(source.map((item) => [exerciseKey(item.id), item]));
  const filtered = source.filter((item) => {
    if (!query) return true;
    const existing = used.get(exerciseKey(item.id));
    return [item.name, existing?.name].some((name) =>
      String(name || "")
        .toLowerCase()
        .includes(query),
    );
  });
  const limit = Math.max(PAGE_SIZE, Number(modal.dataset.limit) || PAGE_SIZE);
  const visibleByType = new Map(
    filtered.slice(0, limit).map((item) => [exerciseKey(item.id), item]),
  );
  exercises.forEach((exercise) => {
    const key = exerciseKey(exercise.type);
    const catalogItem = byType.get(key);
    const item = catalogItem || {
      id: exercise.type,
      name: exercise.name || "Exercício",
      image: "",
    };
    const matches =
      !query ||
      [item.name, exercise.name].some((name) =>
        String(name || "")
          .toLowerCase()
          .includes(query),
      );
    if (matches && !visibleByType.has(key)) visibleByType.set(key, item);
  });
  const visible = [...visibleByType.values()];
  prewarmVisibleImages(visible);
  list.innerHTML =
    visible
      .map((item, index) => {
        const existing = used.get(exerciseKey(item.id));
        const rowName = String(existing?.name || item.name || "Exercício");
        const src = imageUrl(item);
        const thumb = src
          ? `<img class="mse-thumb" src="${esc(src)}" alt="${esc(rowName)}" loading="${index < EAGER_IMAGES ? "eager" : "lazy"}" decoding="async" fetchpriority="${index < EAGER_IMAGES ? "high" : "auto"}" data-expand-image="true" style="cursor:zoom-in">`
          : '<span class="mse-thumb" aria-hidden="true"></span>';
        return `<article class="mse-item" data-type="${esc(item.id)}">${thumb}<span class="mse-info"><strong>${esc(rowName)}</strong><small>${existing ? "Já está no seu treino" : "Disponível para adicionar"}</small></span><button type="button" class="mse-action ${existing ? "remove" : ""}" data-action="${existing ? "remove" : "add"}" data-id="${existing?.id ?? ""}">${existing ? "Remover" : "Adicionar"}</button></article>`;
      })
      .join("") ||
    '<div style="padding:20px;text-align:center;color:#96a49a">Carregando exercícios...</div>';
  const remaining = filtered.filter(
    (item) => !visibleByType.has(exerciseKey(item.id)),
  ).length;
  if (remaining > 0) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "mse-action mse-load-more";
    more.dataset.loadMore = "true";
    more.textContent = `Mostrar mais (${remaining})`;
    more.style.cssText = "width:100%;margin-top:4px";
    more.onclick = () => {
      modal.dataset.limit = String(limit + PAGE_SIZE);
      render(modal);
    };
    list.appendChild(more);
  }
  installImageRecovery(list);
  footer.textContent = `${exercises.length} exercício(s) no seu treino • ${visible.length} exibido(s)`;
}

function openFastManager() {
  document.getElementById("mse-modal")?.remove();
  cachedCatalog();
  prewarmVisibleImages(catalog);
  const modal = document.createElement("div");
  modal.id = "mse-modal";
  modal.dataset.fastManager = "1";
  modal.dataset.limit = String(PAGE_SIZE);
  modal.innerHTML =
    '<div class="mse-card"><div class="mse-top"><div><h2>Adicionar ou remover exercícios</h2><div style="color:#9cac9f;font-size:13px;margin-top:4px">Lista otimizada para abrir rapidamente.</div></div><button class="mse-back" type="button">← Voltar</button></div><input class="mse-search" placeholder="Pesquisar exercício"><div class="mse-list"></div><div class="mse-footer"></div></div>';
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".mse-back").onclick = close;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  let searchTimer;
  modal.querySelector(".mse-search").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => render(modal, true), 80);
  });
  modal.querySelector(".mse-list").addEventListener("click", (event) => {
    const image = event.target.closest('img[data-expand-image="true"]');
    if (image) {
      event.preventDefault();
      event.stopPropagation();
      openImagePreview(image.currentSrc || image.src, image.alt);
      return;
    }
    const button = event.target.closest(".mse-action[data-action]");
    if (!button) return;
    const item = button.closest(".mse-item");
    const type = item?.dataset.type;
    if (!type) return;
    button.disabled = true;
    const changed =
      button.dataset.action === "add"
        ? addExercise(type)
        : removeExercise(type, button.dataset.id);
    if (changed) render(modal);
    else button.disabled = false;
  });
  render(modal, true);
  refreshCatalog(modal);
}

document.addEventListener(
  "click",
  (event) => {
    if (currentUser()?.role !== "student") return;
    const button = event.target.closest("#mayfit-student-exercises button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openFastManager();
  },
  true,
);

cachedCatalog();
prewarmVisibleImages(catalog);
