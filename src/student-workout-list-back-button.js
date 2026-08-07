const USER_KEY = "mayfit_user";
const BUTTON_ID = "mayfit-workout-list-back";
let scheduled = false;

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function navButtons() {
  return [...document.querySelectorAll(".app > nav button")];
}

function buttonText(button) {
  return [
    button?.textContent,
    button?.getAttribute?.("aria-label"),
    button?.getAttribute?.("title"),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();
}

function workoutTabIsActive() {
  if (document.body.classList.contains("mayfit-tab-treinos")) return true;
  const active = navButtons().find((button) => button.classList.contains("active"));
  return /treino/.test(buttonText(active));
}

function workoutListIsOpen() {
  if (currentUser()?.role !== "student") return false;
  if (document.querySelector(".workout-screen")) return false;
  return Boolean(
    workoutTabIsActive() &&
      document.querySelector(".app main .preview-list") &&
      document.querySelector(".app main .section-title"),
  );
}

function goToHome() {
  const buttons = navButtons();
  const home =
    buttons.find((button) => /in[ií]cio/.test(buttonText(button))) || buttons[0];
  home?.click();
}

function createBackButton() {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.setAttribute("aria-label", "Voltar para o início");
  button.innerHTML = '<span aria-hidden="true">←</span><span>Voltar</span>';
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    goToHome();
  });
  return button;
}

function apply() {
  scheduled = false;
  const existing = document.getElementById(BUTTON_ID);
  if (!workoutListIsOpen()) {
    existing?.remove();
    return;
  }

  if (existing) return;
  const main = document.querySelector(".app main");
  const title = main?.querySelector(".section-title");
  if (!main || !title) return;
  main.insertBefore(createBackButton(), title);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(apply));
}

if (!document.getElementById("mayfit-workout-list-back-style")) {
  const style = document.createElement("style");
  style.id = "mayfit-workout-list-back-style";
  style.textContent = `
#${BUTTON_ID}{
  position:sticky;
  top:max(8px,env(safe-area-inset-top));
  z-index:90;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:44px;
  margin:0 0 12px;
  padding:10px 16px;
  border:1px solid #3d6249;
  border-radius:13px;
  background:#17231b;
  color:#fff;
  font:900 15px/1 system-ui,-apple-system,sans-serif;
  box-shadow:0 8px 22px rgba(0,0,0,.28);
  cursor:pointer;
}
#${BUTTON_ID}:active{transform:scale(.98)}
`;
  document.head.appendChild(style);
}

const observer = new MutationObserver(schedule);
observer.observe(document.getElementById("root") || document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class"],
});

document.addEventListener(
  "click",
  (event) => {
    if (event.target.closest(".app > nav button")) {
      schedule();
      setTimeout(schedule, 80);
    }
  },
  true,
);
window.addEventListener("pageshow", schedule);
window.addEventListener("focus", schedule);
schedule();
