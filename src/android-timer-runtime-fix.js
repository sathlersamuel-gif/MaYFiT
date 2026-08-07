const ANDROID_USER_AGENT = /Android/i;
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";
const EXERCISE_TONES = [980, 760, 980, 760, 980, 760];
const REST_TONES = [520, 660, 780, 920, 1040, 1180];

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function currentTimerPhase() {
  return document
    .querySelector(".workout-screen .time-strip span")
    ?.textContent?.trim()
    .toUpperCase();
}

function suppressObsoleteAlarmWarning() {
  const originalAlert = window.alert.bind(window);
  window.alert = (message) => {
    if (String(message || "").trim() === BLOCKED_WARNING) return;
    originalAlert(message);
  };
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
}
