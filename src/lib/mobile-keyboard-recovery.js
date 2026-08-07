const ANDROID_USER_AGENT = /Android/i;
const IOS_USER_AGENT = /iPad|iPhone|iPod/i;
const WORKOUT_INPUT_SELECTOR =
  ".workout-screen .load-cell input,.workout-screen .series-cell input,.workout-screen .rest-label input";

function isIOSDevice() {
  return (
    IOS_USER_AGENT.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function isSupportedMobileDevice() {
  return isIOSDevice() || isAndroidDevice();
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function installMobileKeyboardRecovery() {
  if (!isSupportedMobileDevice()) return;

  let focusedWorkoutInput = null;
  let restoreUntil = 0;
  let restoreTimer = null;

  const clearRestoreTimer = () => {
    if (!restoreTimer) return;
    clearTimeout(restoreTimer);
    restoreTimer = null;
  };

  const workoutIsWaitingForStart = (screen) => {
    const button = screen?.querySelector(".timer-control");
    const label = normalizeText(button?.textContent);
    return label === "START" || label === "SELECIONE";
  };

  const anotherWorkoutInputHasFocus = () =>
    Boolean(document.activeElement?.matches?.(WORKOUT_INPUT_SELECTOR));

  const restoreWorkoutTop = () => {
    if (Date.now() > restoreUntil || anotherWorkoutInputHasFocus()) return;
    const screen = document.querySelector(".workout-screen");
    if (!screen || !workoutIsWaitingForStart(screen)) return;

    try {
      screen.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      screen.scrollTop = 0;
    }

    // O WebKit pode manter também o layout viewport deslocado após o teclado.
    // Reaplicar o topo após a animação ajuda Safari/PWA e não altera o treino.
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    } catch {}
  };

  const scheduleRecoveryPasses = () => {
    clearRestoreTimer();
    const passes = [40, 160, 320, 520];
    let index = 0;
    const run = () => {
      restoreTimer = null;
      restoreWorkoutTop();
      index += 1;
      if (index >= passes.length || Date.now() > restoreUntil) return;
      restoreTimer = setTimeout(run, passes[index] - passes[index - 1]);
    };
    restoreTimer = setTimeout(run, passes[0]);
  };

  document.addEventListener(
    "focusin",
    (event) => {
      const input = event.target?.closest?.(WORKOUT_INPUT_SELECTOR);
      if (!input) return;
      focusedWorkoutInput = input;
      restoreUntil = 0;
      clearRestoreTimer();
    },
    true,
  );

  document.addEventListener(
    "focusout",
    (event) => {
      const input = event.target?.closest?.(WORKOUT_INPUT_SELECTOR);
      if (!input || input !== focusedWorkoutInput) return;
      focusedWorkoutInput = null;
      restoreUntil = Date.now() + 1400;
      scheduleRecoveryPasses();
    },
    true,
  );

  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", () => {
    if (restoreUntil > Date.now()) scheduleRecoveryPasses();
  });
  viewport?.addEventListener("scroll", () => {
    if (restoreUntil > Date.now()) scheduleRecoveryPasses();
  });

  window.addEventListener("pagehide", clearRestoreTimer);
}

installMobileKeyboardRecovery();
