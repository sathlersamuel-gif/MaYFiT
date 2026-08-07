import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";

let lastForegroundSeconds = null;
let lastForegroundPhase = null;
let lastForegroundRunning = false;
let foregroundCancelTimers = [];

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

function portugueseVoice() {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return (
      voices.find((voice) => /^pt-BR$/i.test(voice.lang)) ||
      voices.find((voice) => /^pt/i.test(voice.lang)) ||
      null
    );
  } catch {
    return null;
  }
}

function speakTimerPhase(phase) {
  try {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      if (navigator.vibrate) navigator.vibrate([500, 160, 700]);
      return;
    }

    const text = phase === "PAUSA" ? "Iniciando treino" : "Descanso";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = portugueseVoice();
    if (voice) utterance.voice = voice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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

  // O agendamento nativo e assincrono. Repete o cancelamento por um curto
  // periodo para impedir que o som da notificacao se misture com a voz.
  foregroundCancelTimers = [120, 400, 900].map((delay) =>
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
    // Usa a fase anterior: TEMPO terminou -> "Descanso";
    // PAUSA terminou -> "Iniciando treino".
    speakTimerPhase(lastForegroundPhase || phase);
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
