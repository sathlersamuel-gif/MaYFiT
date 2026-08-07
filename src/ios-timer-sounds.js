const IOS_USER_AGENT = /iPad|iPhone|iPod/i;
const EXERCISE_TONES = [980, 760, 980, 760, 980, 760];
const REST_TONES = [520, 660, 780, 920, 1040, 1180];

function isIOSDevice() {
  return (
    IOS_USER_AGENT.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function currentTimerPhase() {
  return document
    .querySelector(".workout-screen .time-strip span")
    ?.textContent?.trim()
    .toUpperCase();
}

function patchAudioContext(AudioContextCtor) {
  const prototype = AudioContextCtor?.prototype;
  const originalCreateOscillator = prototype?.createOscillator;
  if (!prototype || !originalCreateOscillator) return;
  if (originalCreateOscillator.__mayfitIOSDistinctSounds) return;

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

  createOscillatorWithMayfitSounds.__mayfitIOSDistinctSounds = true;
  prototype.createOscillator = createOscillatorWithMayfitSounds;
}

if (isIOSDevice()) {
  patchAudioContext(window.AudioContext);
  if (window.webkitAudioContext !== window.AudioContext) {
    patchAudioContext(window.webkitAudioContext);
  }
}
