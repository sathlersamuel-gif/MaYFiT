import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";

const DESCANSO_AUDIO =
  "data:audio/mpeg;base64,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qIh0BQBAplKUOsYxilKUrTGKUpWzGKUpf/oYxSoJB4PGUpuVqGoYzqIh0OmUpSt//+pS1KUpUMHi1UxBTUUzLjEwMFVVVVVVVVVVVVVVVVX/8zjEFgAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEdQAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8zjEoAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

const INICIANDO_AUDIO =
  "data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8zjEoAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=";

let lastForegroundSeconds = null;
let lastForegroundPhase = null;
let lastForegroundRunning = false;
let foregroundCancelTimers = [];
let voicePlayers = null;
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

function ensureVoicePlayers() {
  if (voicePlayers) return voicePlayers;
  const descanso = new Audio(DESCANSO_AUDIO);
  const iniciando = new Audio(INICIANDO_AUDIO);
  for (const audio of [descanso, iniciando]) {
    audio.preload = "auto";
    audio.volume = 1;
    audio.setAttribute("playsinline", "");
  }
  voicePlayers = { descanso, iniciando };
  return voicePlayers;
}

function unlockEmbeddedVoices() {
  if (voicesUnlocked) return;
  const players = ensureVoicePlayers();
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

function playEmbeddedVoice(phase) {
  const players = ensureVoicePlayers();
  const target = phase === "PAUSA" ? players.iniciando : players.descanso;
  const other = phase === "PAUSA" ? players.descanso : players.iniciando;
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

  // O agendamento nativo e assincrono. Repete o cancelamento para garantir
  // que a notificacao nao toque junto com a voz enquanto o app esta aberto.
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
  ensureVoicePlayers();
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
