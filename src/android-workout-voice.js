import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const VOICE_SOURCES = {
  start: "/audio/iniciando-treino.base64.txt?v=2",
  rest: "/audio/descanso.base64.txt?v=2",
  finish: "/audio/fim-treino.base64.txt?v=1",
};

let players = null;
let playersPromise = null;
let voicesUnlocked = false;
let activeAudio = null;
let lastScreen = null;
let lastPhase = null;
let lastAllDone = false;
let pauseCycleActive = false;
let lastRunning = false;
let cancelTimers = [];

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function validBase64(value) {
  const clean = String(value || "").trim();
  return /^[A-Za-z0-9+/]+={0,2}$/.test(clean) ? clean : "";
}

async function loadVoice(source) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error("Falha ao carregar voz do treino");
  const base64 = validBase64(await response.text());
  if (!base64) throw new Error("Arquivo de voz inválido");
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  audio.preload = "auto";
  audio.volume = 1;
  audio.setAttribute("playsinline", "");
  return audio;
}

function prepareVoicePlayers() {
  if (players) return Promise.resolve(players);
  if (playersPromise) return playersPromise;

  playersPromise = Promise.all([
    loadVoice(VOICE_SOURCES.start),
    loadVoice(VOICE_SOURCES.rest),
    loadVoice(VOICE_SOURCES.finish),
  ])
    .then(([start, rest, finish]) => {
      players = { start, rest, finish };
      return players;
    })
    .catch(() => null)
    .finally(() => {
      playersPromise = null;
    });

  return playersPromise;
}

function unlockVoicePlayers() {
  if (voicesUnlocked || !players) return;
  const attempts = Object.values(players).map(async (audio) => {
    try {
      audio.muted = true;
      audio.currentTime = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      return true;
    } catch {
      audio.muted = false;
      return false;
    }
  });

  void Promise.all(attempts).then((results) => {
    voicesUnlocked = results.some(Boolean);
  });
}

async function playVoice(cue) {
  if (!isAndroidDevice()) return false;
  const ready = players || (await prepareVoicePlayers());
  const audio = ready?.[cue];
  if (!audio) {
    if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
    return false;
  }

  try {
    if (activeAudio && activeAudio !== audio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudio = audio;
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 1;
    await audio.play();
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    return true;
  } catch {
    if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
    return false;
  }
}

function workoutScreen() {
  return document.querySelector(".workout-screen");
}

function timerPhase(screen = workoutScreen()) {
  return normalizeText(screen?.querySelector(".time-strip span")?.textContent);
}

function timerSeconds(screen = workoutScreen()) {
  const value = screen?.querySelector(".time-strip input")?.value?.trim();
  if (!value) return null;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  return parts.length > 1
    ? Math.max(0, (parts[0] || 0) * 60 + (parts[1] || 0))
    : Math.max(0, parts[0] || 0);
}

function timerRunning(screen = workoutScreen()) {
  return Boolean(screen?.querySelector(".timer-control")?.classList.contains("running"));
}

function allWorkoutRowsDone(screen = workoutScreen()) {
  if (!screen) return false;
  const rows = [...screen.querySelectorAll(".sheet-row")];
  return rows.length > 0 && rows.every((row) => row.classList.contains("done"));
}

function clearCancelTimers() {
  cancelTimers.forEach((timer) => clearTimeout(timer));
  cancelTimers = [];
}

function keepNativeAlertSilentWhileVisible() {
  if (document.hidden) return;
  clearCancelTimers();
  void cancelTimerNotification({ delivered: true });

  // O agendamento do Capacitor é assíncrono. Estes cancelamentos cobrem apenas
  // a janela em que o alerta nativo pode terminar de ser criado pelo cronômetro.
  cancelTimers = [100, 300, 700, 1200, 2000].map((delay) =>
    setTimeout(() => {
      if (!document.hidden) void cancelTimerNotification({ delivered: true });
    }, delay),
  );
}

function scheduleNativeAlertForBackground() {
  clearCancelTimers();
  const screen = workoutScreen();
  const seconds = timerSeconds(screen);
  if (!timerRunning(screen) || seconds == null || seconds <= 0) return;

  void scheduleTimerNotification({
    deadline: Date.now() + seconds * 1000,
    phase: timerPhase(screen) === "PAUSA" ? "pause" : "exercise",
    exerciseName: "",
  });
}

function resetScreenState(screen) {
  lastScreen = screen;
  lastPhase = timerPhase(screen);
  lastAllDone = allWorkoutRowsDone(screen);
  lastRunning = timerRunning(screen);
  pauseCycleActive = lastPhase === "PAUSA";
}

function syncWorkoutState() {
  if (document.hidden) return;
  const screen = workoutScreen();

  if (screen !== lastScreen) {
    resetScreenState(screen);
    if (screen && timerRunning(screen)) keepNativeAlertSilentWhileVisible();
    return;
  }
  if (!screen) return;

  const phase = timerPhase(screen);
  const allDone = allWorkoutRowsDone(screen);
  const running = timerRunning(screen);

  if (running && !lastRunning) keepNativeAlertSilentWhileVisible();

  if (lastPhase && phase && phase !== lastPhase) {
    if (lastPhase === "TEMPO" && phase === "PAUSA") {
      pauseCycleActive = true;
      void playVoice("rest");
    } else if (
      lastPhase === "PAUSA" &&
      phase === "TEMPO" &&
      pauseCycleActive &&
      !allDone
    ) {
      pauseCycleActive = false;
      void playVoice("start");
    }
  }

  if (!lastAllDone && allDone) {
    pauseCycleActive = false;
    void playVoice("finish");
  }

  lastPhase = phase;
  lastAllDone = allDone;
  lastRunning = running;
}

function isMainStartWorkoutButton(target) {
  const button = target?.closest?.("button");
  if (!button || !button.closest(".hero")) return false;
  return normalizeText(button.textContent).includes("INICIAR TREINO");
}

function handlePointerDown(event) {
  unlockVoicePlayers();
  if (isMainStartWorkoutButton(event.target)) {
    // A fala acontece no mesmo gesto do usuário, evitando bloqueio de áudio.
    void playVoice("start");
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    scheduleNativeAlertForBackground();
    return;
  }
  keepNativeAlertSilentWhileVisible();
  syncWorkoutState();
}

function installAndroidWorkoutVoice() {
  if (!isAndroidDevice()) return;

  void prepareVoicePlayers();
  document.addEventListener("pointerdown", handlePointerDown, {
    capture: true,
    passive: true,
  });
  document.addEventListener("touchstart", unlockVoicePlayers, {
    capture: true,
    passive: true,
  });
  document.addEventListener("click", unlockVoicePlayers, {
    capture: true,
    passive: true,
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", scheduleNativeAlertForBackground);
  window.addEventListener("pageshow", () => {
    keepNativeAlertSilentWhileVisible();
    syncWorkoutState();
  });

  const observer = new MutationObserver(() => syncWorkoutState());
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  syncWorkoutState();
}

installAndroidWorkoutVoice();
