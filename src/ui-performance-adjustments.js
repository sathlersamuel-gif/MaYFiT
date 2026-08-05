const USER_KEY = "mayfit_user";
const PHOTO_CACHE = "mayfit-exercise-photos-v1";
const IMAGE_HOST = "raw.githubusercontent.com";
let warmTimer = null;

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function directTextNodes(root) {
  return [...root.childNodes].filter(
    (node) => node.nodeType === Node.TEXT_NODE,
  );
}

function adjustStudentEvolutionCard() {
  if (currentUser()?.role !== "student") return;
  const candidates = [
    ...document.querySelectorAll("button,article,div"),
  ].filter((element) => {
    const text = (element.textContent || "").trim();
    return (
      /treinos salvos/i.test(text) &&
      !element.closest(".mayfit-history-overlay")
    );
  });
  const card = candidates.sort(
    (a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width,
  )[0];
  if (!card || card.dataset.evolutionCardAdjusted === "true") return;

  const numeric = [...card.querySelectorAll("strong,b,span,div")].find(
    (element) => /^\s*\d+\s*$/.test(element.textContent || ""),
  );
  if (numeric) numeric.style.display = "none";

  const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const label = nodes.find((node) =>
    /treinos salvos/i.test(node.nodeValue || ""),
  );
  if (label)
    label.nodeValue = (label.nodeValue || "").replace(
      /treinos salvos/gi,
      "Evolução de cargas",
    );

  const hidden = document.createElement("span");
  hidden.textContent = "Treinos salvos";
  hidden.setAttribute("aria-hidden", "true");
  hidden.style.cssText =
    "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap";
  card.appendChild(hidden);
  card.setAttribute("aria-label", "Abrir evolução de cargas");
  card.dataset.evolutionCardAdjusted = "true";
}

function hideAdminWorkoutManager() {
  if (currentUser()?.role !== "admin") return;
  const headings = [...document.querySelectorAll("h1,h2,h3,strong,div")].filter(
    (element) => /^\s*gerenciar\s+treino\s*$/i.test(element.textContent || ""),
  );
  for (const heading of headings) {
    let block = heading.closest("section,article");
    if (!block) {
      block = heading.parentElement;
      for (let i = 0; i < 3 && block?.parentElement; i++) {
        if (/adicionar\s+exercícios/i.test(block.textContent || "")) break;
        block = block.parentElement;
      }
    }
    if (block && /adicionar\s+exercícios/i.test(block.textContent || "")) {
      block.style.display = "none";
      block.dataset.adminWorkoutManagerHidden = "true";
    }
  }
}

async function cacheUrl(url) {
  if (!url || !url.includes(IMAGE_HOST) || !("caches" in window)) return;
  try {
    const cache = await caches.open(PHOTO_CACHE);
    const existing = await cache.match(url);
    if (existing) return;
    const response = await fetch(url, {
      mode: "no-cors",
      cache: "force-cache",
    });
    await cache.put(url, response.clone());
  } catch {}
}

function warmVisibleExercisePhotos() {
  clearTimeout(warmTimer);
  warmTimer = setTimeout(() => {
    const urls = [
      ...document.querySelectorAll(
        "#mse-modal img.mse-thumb,.exercise-picker img.mayfit-picker-thumb",
      ),
    ]
      .map((image) => image.currentSrc || image.src)
      .filter(Boolean);
    [...new Set(urls)].slice(0, 80).forEach(cacheUrl);
  }, 120);
}

function apply() {
  adjustStudentEvolutionCard();
  warmVisibleExercisePhotos();
}

const observer = new MutationObserver(() => requestAnimationFrame(apply));
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("pageshow", apply);
window.addEventListener("focus", apply);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) apply();
});
document.addEventListener(
  "click",
  (event) => {
    if (
      event.target.closest(
        '[data-action="add"], [data-action="remove"], #mayfit-student-exercises button',
      )
    )
      setTimeout(warmVisibleExercisePhotos, 250);
  },
  true,
);
apply();
