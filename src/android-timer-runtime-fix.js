import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";
const DESCANSO_SOURCE = "/audio/descanso.base64.txt?v=1";
const INICIANDO_SOURCE = "/audio/iniciando-treino.base64.txt?v=1";

let lastForegroundSeconds = null;
let lastForegroundPhase = null;
let lastForegroundRunning = false;
let foregroundCancelTimers = [];
let voicePlayers = null;
let voicePlayersPromise = null;
let voicesUnlocked = false;

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function currentTimerPhase() {
  return document
    .querySelector(".workout-screen .time-strip span")
    ?.textContent?.trim()
    .toUpperCase();
}

function currentNativePhase() {
  return currentTimerPhase() === "PAUSA" ? "pause" : "exercise";
}

function currentTimerSeconds() {
  const value = document
    .querySelector(".workout-screen .time-strip input")
    ?.value?.trim();
  if (!value) return null;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  return parts.length > 1
    ? Math.max(0, (parts[0] || 0) * 60 + (parts[1] || 0))
    : Math.max(0, parts[0] || 0);
}

function timerIsRunning() {
  return document
    .querySelector(".workout-screen .timer-control")
    ?.classList?.contains("running");
}

function currentExerciseName() {
  return (
    document
      .querySelector(".workout-screen .sheet-row.mayfit-selected .exercise-col>strong")
      ?.textContent?.trim() || ""
  );
}

function suppressObsoleteAlarmWarning() {
  const originalAlert = window.alert.bind(window);
  window.alert = (message) => {
    if (String(message || "").trim() === BLOCKED_WARNING) return;
    originalAlert(message);
  };
}

function validBase64(value) {
  const clean = String(value || "").trim();
  return /^[A-Za-z0-9+/]+={0,2}$/.test(clean) ? clean : "";
}

async function loadVoice(source) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error("Falha ao carregar voz do cronômetro");
  const base64 = validBase64(await response.text());
  if (!base64) throw new Error("Áudio de voz inválido");
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  audio.preload = "auto";
  audio.volume = 1;
  audio.setAttribute("playsinline", "");
  return audio;
}

function prepareVoicePlayers() {
  if (voicePlayers) return Promise.resolve(voicePlayers);
  if (voicePlayersPromise) return voicePlayersPromise;
  voicePlayersPromise = Promise.all([
    loadVoice(DESCANSO_SOURCE),
    loadVoice(INICIANDO_SOURCE),
  ])
    .then(([descanso, iniciando]) => {
      voicePlayers = { descanso, iniciando };
      return voicePlayers;
    })
    .catch(() => null)
    .finally(() => {
      voicePlayersPromise = null;
    });
  return voicePlayersPromise;
}

function unlockEmbeddedVoices() {
  if (voicesUnlocked || !voicePlayers) return;
  const attempts = Object.values(voicePlayers).map(async (audio) => {
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

function playEmbeddedVoice(phase) {
  if (!voicePlayers) {
    void prepareVoicePlayers();
    if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
    return;
  }
  const target = phase === "PAUSA" ? voicePlayers.iniciando : voicePlayers.descanso;
  const other = phase === "PAUSA" ? voicePlayers.descanso : voicePlayers.iniciando;
  try {
    other.pause();
    other.currentTime = 0;
    target.pause();
    target.currentTime = 0;
    target.muted = false;
    target.volume = 1;
    void target.play().catch(() => {
      if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
    });
    if (navigator.vibrate) navigator.vibrate([350, 120, 350]);
  } catch {
    if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
  }
}

function clearForegroundCancelTimers() {
  foregroundCancelTimers.forEach((timer) => clearTimeout(timer));
  foregroundCancelTimers = [];
}

function suppressNativeAlertWhileForeground() {
  if (document.hidden) return;
  clearForegroundCancelTimers();
  void cancelTimerNotification({ delivered: true });
  foregroundCancelTimers = [100, 300, 700, 1200, 2000, 3000].map((delay) =>
    setTimeout(() => {
      if (!document.hidden) void cancelTimerNotification({ delivered: true });
    }, delay),
  );
}

function scheduleNativeAlertForBackground() {
  clearForegroundCancelTimers();
  const seconds = currentTimerSeconds();
  if (!timerIsRunning() || seconds == null || seconds <= 0) return;
  void scheduleTimerNotification({
    deadline: Date.now() + seconds * 1000,
    phase: currentNativePhase(),
    exerciseName: currentExerciseName(),
  });
}

function syncForegroundTimerState({ allowAlert = true } = {}) {
  if (document.hidden) return;
  const seconds = currentTimerSeconds();
  const phase = currentTimerPhase();
  const running = timerIsRunning();

  if (seconds == null || !phase) {
    lastForegroundSeconds = null;
    lastForegroundPhase = null;
    lastForegroundRunning = false;
    return;
  }

  if (running && !lastForegroundRunning && seconds > 0) {
    suppressNativeAlertWhileForeground();
  }

  if (
    allowAlert &&
    lastForegroundRunning &&
    lastForegroundSeconds > 0 &&
    seconds === 0
  ) {
    // TEMPO terminou -> "Descanso"; PAUSA terminou -> "Iniciando treino".
    playEmbeddedVoice(lastForegroundPhase || phase);
    void cancelTimerNotification({ delivered: true });
  }

  lastForegroundSeconds = seconds;
  lastForegroundPhase = phase;
  lastForegroundRunning = running;
}

function muteLegacyForegroundTimerTones(AudioContextCtor) {
  const prototype = AudioContextCtor?.prototype;
  const originalCreateOscillator = prototype?.createOscillator;
  if (!prototype || !originalCreateOscillator) return;
  if (originalCreateOscillator.__mayfitAndroidVoiceAlerts) return;

  function createOscillatorWithoutLegacyTimerTone(...args) {
    const oscillator = originalCreateOscillator.apply(this, args);
    const frequency = oscillator?.frequency;
    const originalSetValueAtTime = frequency?.setValueAtTime?.bind(frequency);
    if (!originalSetValueAtTime) return oscillator;
    frequency.setValueAtTime = (value, startTime) => {
      const legacyTimerTone =
        oscillator.type === "square" && (value === 760 || value === 980);
      return originalSetValueAtTime(legacyTimerTone ? 0 : value, startTime);
    };
    return oscillator;
  }

  createOscillatorWithoutLegacyTimerTone.__mayfitAndroidVoiceAlerts = true;
  prototype.createOscillator = createOscillatorWithoutLegacyTimerTone;
}

function installForegroundVoiceAlerts() {
  void prepareVoicePlayers();
  const unlock = () => unlockEmbeddedVoices();
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });
  document.addEventListener("click", unlock, { capture: true, passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      scheduleNativeAlertForBackground();
      lastForegroundSeconds = null;
      lastForegroundPhase = null;
      lastForegroundRunning = false;
      return;
    }
    suppressNativeAlertWhileForeground();
    syncForegroundTimerState({ allowAlert: false });
  });

  window.addEventListener("pagehide", scheduleNativeAlertForBackground);
  window.addEventListener("pageshow", () => {
    suppressNativeAlertWhileForeground();
    syncForegroundTimerState({ allowAlert: false });
  });

  setInterval(() => syncForegroundTimerState(), 100);
}

if (isAndroidDevice()) {
  suppressObsoleteAlarmWarning();
  muteLegacyForegroundTimerTones(window.AudioContext);
  if (window.webkitAudioContext !== window.AudioContext) {
    muteLegacyForegroundTimerTones(window.webkitAudioContext);
  }
  installForegroundVoiceAlerts();
}
