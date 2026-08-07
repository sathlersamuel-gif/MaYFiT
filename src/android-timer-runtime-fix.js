const ANDROID_USER_AGENT = /Android/i;
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";
const EXERCISE_TONES = [980, 760, 980, 760, 980, 760];
const REST_TONES = [520, 660, 780, 920, 1040, 1180];

let foregroundAudioContext = null;
let lastForegroundSeconds = null;
let lastForegroundPhase = null;
let lastForegroundRunning = false;

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function currentTimerPhase() {
  return document
    .querySelector(".workout-screen .time-strip span")
    ?.textContent?.trim()
    .toUpperCase();
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

function suppressObsoleteAlarmWarning() {
  const originalAlert = window.alert.bind(window);
  window.alert = (message) => {
    if (String(message || "").trim() === BLOCKED_WARNING) return;
    originalAlert(message);
  };
}

function unlockForegroundAudio() {
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    foregroundAudioContext = foregroundAudioContext || new AudioContextCtor();
    if (foregroundAudioContext.state === "suspended") {
      void foregroundAudioContext.resume();
    }
    return foregroundAudioContext;
  } catch {
    return null;
  }
}

function playForegroundTimerSound(phase) {
  const ctx = unlockForegroundAudio();
  if (!ctx || ctx.state === "closed") return;
  const tones = phase === "PAUSA" ? REST_TONES : EXERCISE_TONES;
  const start = ctx.currentTime + 0.02;

  tones.forEach((frequency, index) => {
    const offset = index * 0.24;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start + offset);
    gain.gain.setValueAtTime(0.68, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.18);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.2);
  });

  if (navigator.vibrate) {
    navigator.vibrate([450, 140, 450, 140, 650]);
  }
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

  if (
    allowAlert &&
    lastForegroundRunning &&
    lastForegroundSeconds > 0 &&
    seconds === 0
  ) {
    // Usa a fase anterior porque o React pode trocar TEMPO/PAUSA logo após zerar.
    playForegroundTimerSound(lastForegroundPhase || phase);
  }

  lastForegroundSeconds = seconds;
  lastForegroundPhase = phase;
  lastForegroundRunning = running;
}

function installForegroundTimerSound() {
  const unlock = () => unlockForegroundAudio();
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });
  document.addEventListener("click", unlock, { capture: true, passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Se o aviso nativo tocar em segundo plano, evita repetir ao voltar ao app.
      lastForegroundSeconds = null;
      lastForegroundPhase = null;
      lastForegroundRunning = false;
      return;
    }
    syncForegroundTimerState({ allowAlert: false });
  });

  setInterval(() => syncForegroundTimerState(), 100);
}

function patchAudioContext(AudioContextCtor) {
  const prototype = AudioContextCtor?.prototype;
  const originalCreateOscillator = prototype?.createOscillator;
  if (!prototype || !originalCreateOscillator) return;
  if (originalCreateOscillator.__mayfitAndroidDistinctSounds) return;

  let toneIndex = 0;
  let lastToneAt = 0;

  function createOscillatorWithMayfitSounds(...args) {
    const oscillator = originalCreateOscillator.apply(this, args);
    const frequency = oscillator?.frequency;
    const originalSetValueAtTime = frequency?.setValueAtTime?.bind(frequency);
    if (!originalSetValueAtTime) return oscillator;

    frequency.setValueAtTime = (value, startTime) => {
      const isMayfitTimerTone =
        oscillator.type === "square" && (value === 760 || value === 980);
      if (!isMayfitTimerTone) return originalSetValueAtTime(value, startTime);

      const now = performance.now();
      if (now - lastToneAt > 2000) toneIndex = 0;
      lastToneAt = now;

      const tones =
        currentTimerPhase() === "PAUSA" ? REST_TONES : EXERCISE_TONES;
      const selectedTone = tones[toneIndex % tones.length];
      toneIndex += 1;
      return originalSetValueAtTime(selectedTone, startTime);
    };

    return oscillator;
  }

  createOscillatorWithMayfitSounds.__mayfitAndroidDistinctSounds = true;
  prototype.createOscillator = createOscillatorWithMayfitSounds;
}

if (isAndroidDevice()) {
  suppressObsoleteAlarmWarning();
  patchAudioContext(window.AudioContext);
  if (window.webkitAudioContext !== window.AudioContext) {
    patchAudioContext(window.webkitAudioContext);
  }
  installForegroundTimerSound();
}
