import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const IOS_USER_AGENT = /iPad|iPhone|iPod/i;
const SETTINGS_KEY = "mayfit_workout_sound_settings_v2";
const LEGACY_SETTINGS_KEY = "mayfit_workout_sound_settings_v1";

const VOICE_TEXT = {
  start: "Iniciando treino",
  rest: "Descanso",
  finish: "Fim de treino",
};

const DEFAULT_SETTINGS = {
  start: "voice",
  rest: "voice",
  finish: "voice",
  voiceName: "auto",
};

const SOUND_OPTIONS = [
  ["voice", "Voz natural do aparelho"],
  ["beep", "Bip esportivo"],
  ["bells", "Sinos"],
  ["whistle", "Apito"],
  ["digital", "Alerta digital"],
  ["silent", "Sem som"],
];

const PRESETS = {
  voice: {
    label: "Voz completa",
    settings: { start: "voice", rest: "voice", finish: "voice" },
  },
  sport: {
    label: "Esportivo",
    settings: { start: "beep", rest: "bells", finish: "digital" },
  },
  bells: {
    label: "Sinos",
    settings: { start: "bells", rest: "bells", finish: "bells" },
  },
  whistle: {
    label: "Apito",
    settings: { start: "whistle", rest: "whistle", finish: "whistle" },
  },
  discreet: {
    label: "Discreto",
    settings: { start: "digital", rest: "digital", finish: "digital" },
  },
};

let settings = loadSettings();
let audioContext = null;
let lastScreen = null;
let lastPhase = null;
let lastAllDone = false;
let syncQueued = false;
let settingsModal = null;
let cancelTimers = [];
let speechToken = 0;
let pendingStartButton = null;
let pendingStartTimer = null;

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function isIOSDevice() {
  return (
    IOS_USER_AGENT.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isSupportedMobileDevice() {
  return isAndroidDevice() || isIOSDevice();
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function readStoredSettings() {
  for (const key of [SETTINGS_KEY, LEGACY_SETTINGS_KEY]) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && typeof saved === "object") return saved;
    } catch {}
  }
  return null;
}

function loadSettings() {
  const saved = readStoredSettings();
  if (!saved) return { ...DEFAULT_SETTINGS };
  const valid = new Set(SOUND_OPTIONS.map(([value]) => value));
  return {
    start: valid.has(saved.start) ? saved.start : DEFAULT_SETTINGS.start,
    rest: valid.has(saved.rest) ? saved.rest : DEFAULT_SETTINGS.rest,
    finish: valid.has(saved.finish) ? saved.finish : DEFAULT_SETTINGS.finish,
    voiceName:
      typeof saved.voiceName === "string" && saved.voiceName.trim()
        ? saved.voiceName
        : DEFAULT_SETTINGS.voiceName,
  };
}

function saveSettings(next) {
  settings = { ...DEFAULT_SETTINGS, ...settings, ...next };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function getAudioContext() {
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = audioContext || new AudioContextCtor();
    return audioContext;
  } catch {
    return null;
  }
}

function unlockAudio() {
  const context = getAudioContext();
  if (!context) return;
  try {
    if (context.state === "suspended") void context.resume();
  } catch {}
}

function voiceScore(voice) {
  let score = 0;
  const lang = String(voice?.lang || "");
  const name = String(voice?.name || "");
  if (/^pt-BR$/i.test(lang)) score += 100;
  else if (/^pt/i.test(lang)) score += 60;
  if (voice?.localService) score += 20;
  if (/luciana|joana|francisca|camila|vit[oó]ria|maria|google.*portugu|microsoft.*portugu|samsung.*portugu/i.test(name)) {
    score += 35;
  }
  return score;
}

function portugueseVoices() {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return voices
      .filter((voice) => /^pt(?:-|_)/i.test(String(voice.lang || "")))
      .sort((a, b) => voiceScore(b) - voiceScore(a));
  } catch {
    return [];
  }
}

function preferredPortugueseVoice() {
  const voices = portugueseVoices();
  if (!voices.length) return null;
  if (settings.voiceName && settings.voiceName !== "auto") {
    const selected = voices.find((voice) => voice.name === settings.voiceName);
    if (selected) return selected;
  }
  return voices[0];
}

function playNaturalVoice(cue) {
  const token = ++speechToken;
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      playSynthetic("digital", cue);
      resolve(false);
      return;
    }

    let settled = false;
    let started = false;
    const finish = (worked) => {
      if (settled || token !== speechToken) return;
      settled = true;
      resolve(worked);
    };

    try {
      const utterance = new SpeechSynthesisUtterance(VOICE_TEXT[cue]);
      utterance.lang = "pt-BR";
      utterance.rate = 0.98;
      utterance.pitch = 1.02;
      utterance.volume = 1;
      const voice = preferredPortugueseVoice();
      if (voice) utterance.voice = voice;

      const fallbackTimer = setTimeout(() => {
        if (started || settled || token !== speechToken) return;
        try {
          window.speechSynthesis.cancel();
        } catch {}
        playSynthetic("digital", cue);
        finish(false);
      }, 900);

      utterance.onstart = () => {
        started = true;
        clearTimeout(fallbackTimer);
        finish(true);
      };
      utterance.onerror = () => {
        clearTimeout(fallbackTimer);
        playSynthetic("digital", cue);
        finish(false);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      playSynthetic("digital", cue);
      resolve(false);
    }
  });
}

function tone({ frequency, start, duration, type = "sine", volume = 0.28 }) {
  const context = getAudioContext();
  if (!context) return;
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(volume, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + start + duration,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.03);
  } catch {}
}

function playSynthetic(kind, cue) {
  unlockAudio();

  if (kind === "beep") {
    const frequencies = cue === "rest" ? [680, 820, 960] : [1040, 1180, 1320];
    frequencies.forEach((frequency, index) =>
      tone({
        frequency,
        start: index * 0.16,
        duration: 0.1,
        type: "square",
        volume: 0.22,
      }),
    );
    return;
  }

  if (kind === "bells") {
    [0, 0.2, 0.44].forEach((start, index) =>
      tone({
        frequency: [620, 830, 1110][index],
        start,
        duration: 0.62,
        type: "sine",
        volume: 0.24,
      }),
    );
    return;
  }

  if (kind === "whistle") {
    [0, 0.24].forEach((start, index) =>
      tone({
        frequency: index ? 1580 : 1360,
        start,
        duration: 0.19,
        type: "sine",
        volume: 0.2,
      }),
    );
    return;
  }

  [0, 0.13, 0.28].forEach((start, index) =>
    tone({
      frequency: [540, 810, 1080][index],
      start,
      duration: 0.15,
      type: "triangle",
      volume: 0.2,
    }),
  );
}

async function playCue(cue, forcedSound = null) {
  if (!isSupportedMobileDevice()) return;
  unlockAudio();
  const selected = forcedSound || settings[cue] || DEFAULT_SETTINGS[cue];
  if (selected === "silent") return;

  if (selected === "voice") await playNaturalVoice(cue);
  else playSynthetic(selected, cue);

  try {
    if (navigator.vibrate) navigator.vibrate([180, 70, 180]);
  } catch {}
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
  if (!isAndroidDevice() || document.hidden) return;
  clearCancelTimers();
  void cancelTimerNotification({ delivered: true });
  cancelTimers = [80, 220, 500, 900, 1500, 2500].map((delay) =>
    setTimeout(() => {
      if (!document.hidden) void cancelTimerNotification({ delivered: true });
    }, delay),
  );
}

function scheduleNativeAlertForBackground() {
  if (!isAndroidDevice()) return;
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
}

function syncWorkoutState() {
  if (document.hidden) return;
  confirmPendingTimerStart();
  const screen = workoutScreen();

  if (screen !== lastScreen) {
    resetScreenState(screen);
    return;
  }
  if (!screen) return;

  const phase = timerPhase(screen);
  const allDone = allWorkoutRowsDone(screen);

  if (lastPhase && phase && phase !== lastPhase) {
    if (lastPhase === "TEMPO" && phase === "PAUSA") {
      void playCue("rest");
    }
  }

  if (!lastAllDone && allDone) {
    void playCue("finish");
  }

  lastPhase = phase;
  lastAllDone = allDone;
}

function queueSyncWorkoutState() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncWorkoutState();
    ensureSettingsTrigger();
    ensureProfileSoundSettings();
  });
}

function isRealTimerStartButton(button) {
  return Boolean(
    button?.classList?.contains("timer-control") &&
      normalizeText(button.textContent) === "START",
  );
}

function clearPendingStart() {
  if (pendingStartTimer) clearTimeout(pendingStartTimer);
  pendingStartTimer = null;
  pendingStartButton = null;
}

function armPendingTimerStart(button) {
  clearPendingStart();
  pendingStartButton = button;
  pendingStartTimer = setTimeout(clearPendingStart, 5000);
}

function confirmPendingTimerStart() {
  const button = pendingStartButton;
  if (!button) return;
  if (!document.contains(button)) {
    clearPendingStart();
    return;
  }
  if (!button.classList.contains("running")) return;

  clearPendingStart();
  void playCue("start");
  keepNativeAlertSilentWhileVisible();
}

function handlePointerDown(event) {
  unlockAudio();
  const button = event.target?.closest?.("button");
  if (!isRealTimerStartButton(button)) return;
  armPendingTimerStart(button);
}

function muteLegacyForegroundTimerTones(AudioContextCtor) {
  const prototype = AudioContextCtor?.prototype;
  const originalCreateOscillator = prototype?.createOscillator;
  if (!prototype || !originalCreateOscillator) return;
  if (originalCreateOscillator.__mayfitMobileWorkoutSoundsV2) return;

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

  createOscillatorWithoutLegacyTimerTone.__mayfitMobileWorkoutSoundsV2 = true;
  prototype.createOscillator = createOscillatorWithoutLegacyTimerTone;
}

function optionMarkup(selected) {
  return SOUND_OPTIONS.map(
    ([value, label]) =>
      `<option value="${value}"${selected === value ? " selected" : ""}>${label}</option>`,
  ).join("");
}

function voiceOptionMarkup() {
  const voices = portugueseVoices();
  const automatic = `<option value="auto"${settings.voiceName === "auto" ? " selected" : ""}>Automática (mais natural disponível)</option>`;
  return (
    automatic +
    voices
      .map(
        (voice) =>
          `<option value="${escapeHtml(voice.name)}"${settings.voiceName === voice.name ? " selected" : ""}>${escapeHtml(voice.name)} — ${escapeHtml(voice.lang)}</option>`,
      )
      .join("")
  );
}

function currentPreset() {
  for (const [key, preset] of Object.entries(PRESETS)) {
    if (
      preset.settings.start === settings.start &&
      preset.settings.rest === settings.rest &&
      preset.settings.finish === settings.finish
    ) {
      return key;
    }
  }
  return "custom";
}

function settingsMarkup() {
  const presetOptions = [
    ...Object.entries(PRESETS).map(
      ([value, preset]) =>
        `<option value="${value}"${currentPreset() === value ? " selected" : ""}>${preset.label}</option>`,
    ),
    `<option value="custom"${currentPreset() === "custom" ? " selected" : ""}>Personalizado</option>`,
  ].join("");

  const row = (cue, title, description) => `
    <div class="mayfit-sound-row" data-cue="${cue}">
      <div class="mayfit-sound-row-copy">
        <strong>${title}</strong>
        <span>${description}</span>
      </div>
      <select data-sound-select="${cue}" aria-label="${title}">${optionMarkup(settings[cue])}</select>
      <button type="button" class="mayfit-sound-preview" data-preview="${cue}">Ouvir</button>
    </div>`;

  return `
    <div class="mayfit-sound-dialog" role="dialog" aria-modal="true" aria-label="Configurações de sons do treino">
      <div class="mayfit-sound-head">
        <div>
          <small>CONFIGURAÇÕES</small>
          <h2>Sons do treino</h2>
        </div>
        <button type="button" class="mayfit-sound-close" aria-label="Fechar">×</button>
      </div>
      <label class="mayfit-sound-preset">
        <span>Perfil de sons</span>
        <select data-sound-preset>${presetOptions}</select>
      </label>
      <div class="mayfit-voice-choice">
        <div>
          <strong>Voz do aparelho</strong>
          <span>Escolha uma das vozes em português disponíveis no seu iPhone ou Android.</span>
        </div>
        <select data-voice-select aria-label="Voz do aparelho">${voiceOptionMarkup()}</select>
        <button type="button" class="mayfit-sound-preview" data-preview-voice>Ouvir voz</button>
      </div>
      ${row("start", "START", "Somente quando o botão START do cronômetro realmente iniciar.")}
      ${row("rest", "Descanso", "Quando o tempo terminar e o cronômetro entrar no descanso.")}
      ${row("finish", "Fim de treino", "Quando todas as séries e exercícios forem concluídos.")}
      <p class="mayfit-sound-note">As escolhas ficam salvas neste aparelho. A voz natural depende das vozes instaladas no sistema.</p>
      <button type="button" class="mayfit-sound-done">Concluído</button>
    </div>`;
}

function installSettingsStyles() {
  if (document.getElementById("mayfit-workout-sound-styles")) return;
  const style = document.createElement("style");
  style.id = "mayfit-workout-sound-styles";
  style.textContent = `
    .mayfit-sound-settings-trigger{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:inherit;font-size:19px;cursor:pointer;margin-left:6px}
    .mayfit-sound-settings-trigger:active{transform:scale(.96)}
    .mayfit-profile-sounds{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box;margin:18px 0 12px;padding:14px;border:1px solid rgba(157,242,15,.28);border-radius:16px;background:rgba(157,242,15,.07);text-align:left}
    .mayfit-profile-sounds-copy{display:grid;gap:3px;min-width:0}.mayfit-profile-sounds-copy strong{font-size:15px}.mayfit-profile-sounds-copy span{font-size:12px;opacity:.65;line-height:1.35}
    .mayfit-profile-sounds button{flex:0 0 auto;border:0;border-radius:12px;background:#9df20f;color:#111;padding:10px 12px;font-weight:900}
    .mayfit-sound-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:14px}
    .mayfit-sound-dialog{width:min(560px,100%);max-height:88vh;overflow:auto;background:#141414;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.45)}
    .mayfit-sound-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.mayfit-sound-head small{font-size:11px;letter-spacing:.12em;opacity:.6}.mayfit-sound-head h2{margin:3px 0 0;font-size:23px}
    .mayfit-sound-close{border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:12px;width:38px;height:38px;font-size:27px;line-height:1;cursor:pointer}
    .mayfit-sound-preset,.mayfit-voice-choice{display:grid;gap:7px;margin-bottom:14px;padding:13px;border-radius:16px;background:rgba(157,242,15,.08);border:1px solid rgba(157,242,15,.18)}
    .mayfit-sound-preset span,.mayfit-voice-choice strong{font-size:13px;font-weight:800}.mayfit-voice-choice>div{display:grid;gap:3px}.mayfit-voice-choice>div span{font-size:11px;opacity:.62;line-height:1.35}
    .mayfit-sound-dialog select{width:100%;min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#222;color:#fff;padding:0 12px;font-size:14px}
    .mayfit-sound-row{display:grid;grid-template-columns:minmax(0,1fr) 150px 72px;gap:9px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.09)}
    .mayfit-sound-row-copy{display:grid;gap:3px;min-width:0}.mayfit-sound-row-copy strong{font-size:14px}.mayfit-sound-row-copy span{font-size:12px;opacity:.62;line-height:1.35}
    .mayfit-sound-preview{min-height:42px;border:0;border-radius:11px;background:#9df20f;color:#111;font-weight:800;cursor:pointer;padding:0 10px}
    .mayfit-sound-note{font-size:11px;line-height:1.45;opacity:.58;margin:14px 0 0}.mayfit-sound-done{width:100%;height:48px;border:0;border-radius:14px;background:#9df20f;color:#111;font-weight:900;font-size:15px;cursor:pointer;margin-top:14px}
    @media(max-width:520px){.mayfit-sound-row{grid-template-columns:1fr 76px}.mayfit-sound-row-copy{grid-column:1/-1}.mayfit-sound-dialog select{min-width:0}.mayfit-sound-overlay{padding:8px}.mayfit-sound-dialog{border-radius:20px 20px 12px 12px}}
  `;
  document.head.appendChild(style);
}

function closeSettings() {
  settingsModal?.remove();
  settingsModal = null;
}

function refreshVoiceSelector() {
  if (!settingsModal) return;
  const voiceSelect = settingsModal.querySelector("[data-voice-select]");
  if (!voiceSelect) return;
  voiceSelect.innerHTML = voiceOptionMarkup();
  voiceSelect.value = settings.voiceName || "auto";
}

function refreshSettingsControls() {
  if (!settingsModal) return;
  for (const cue of ["start", "rest", "finish"]) {
    const select = settingsModal.querySelector(`[data-sound-select="${cue}"]`);
    if (select) select.value = settings[cue];
  }
  const preset = settingsModal.querySelector("[data-sound-preset]");
  if (preset) preset.value = currentPreset();
  refreshVoiceSelector();
}

function openSettings() {
  if (!isSupportedMobileDevice()) return;
  closeSettings();
  unlockAudio();
  installSettingsStyles();
  try {
    window.speechSynthesis?.getVoices?.();
  } catch {}

  const overlay = document.createElement("div");
  overlay.className = "mayfit-sound-overlay";
  overlay.innerHTML = settingsMarkup();
  document.body.appendChild(overlay);
  settingsModal = overlay;

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".mayfit-sound-close") ||
      event.target.closest(".mayfit-sound-done")
    ) {
      closeSettings();
      return;
    }

    if (event.target.closest("[data-preview-voice]")) {
      void playCue("start", "voice");
      return;
    }

    const preview = event.target.closest("[data-preview]");
    if (preview) {
      const cue = preview.dataset.preview;
      const selected = overlay.querySelector(`[data-sound-select="${cue}"]`)?.value;
      void playCue(cue, selected);
    }
  });

  overlay.addEventListener("change", (event) => {
    const presetSelect = event.target.closest("[data-sound-preset]");
    if (presetSelect) {
      const preset = PRESETS[presetSelect.value];
      if (preset) {
        saveSettings(preset.settings);
        refreshSettingsControls();
      }
      return;
    }

    const voiceSelect = event.target.closest("[data-voice-select]");
    if (voiceSelect) {
      saveSettings({ voiceName: voiceSelect.value || "auto" });
      return;
    }

    const select = event.target.closest("[data-sound-select]");
    if (!select) return;
    saveSettings({ [select.dataset.soundSelect]: select.value });
    refreshSettingsControls();
  });
}

function studentAreaVisible() {
  return [...document.querySelectorAll(".app > nav span")].some(
    (span) => normalizeText(span.textContent) === "PERFIL",
  );
}

function ensureSettingsTrigger() {
  if (!isSupportedMobileDevice() || !studentAreaVisible()) return;
  const header = document.querySelector(".app > header");
  if (!header || header.querySelector(".mayfit-sound-settings-trigger")) return;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "mayfit-sound-settings-trigger";
  trigger.setAttribute("aria-label", "Sons do treino");
  trigger.title = "Sons do treino";
  trigger.textContent = "🔊";
  trigger.addEventListener("click", openSettings);
  header.appendChild(trigger);
}

function ensureProfileSoundSettings() {
  if (!isSupportedMobileDevice()) return;
  const profile = document.querySelector(".profile");
  if (!profile || profile.querySelector(".mayfit-profile-sounds")) return;

  const section = document.createElement("div");
  section.className = "mayfit-profile-sounds";
  section.innerHTML = `
    <div class="mayfit-profile-sounds-copy">
      <strong>🔊 Sons do treino</strong>
      <span>Escolha voz, bip, sinos, apito ou alerta digital.</span>
    </div>
    <button type="button">Configurar</button>`;
  section.querySelector("button").addEventListener("click", openSettings);

  const logout = profile.querySelector(".danger");
  if (logout) profile.insertBefore(section, logout);
  else profile.appendChild(section);
}

function handleVisibilityChange() {
  if (document.hidden) {
    scheduleNativeAlertForBackground();
    return;
  }
  keepNativeAlertSilentWhileVisible();
  queueSyncWorkoutState();
}

function installMobileWorkoutSounds() {
  if (!isSupportedMobileDevice()) return;

  installSettingsStyles();
  getAudioContext();

  muteLegacyForegroundTimerTones(window.AudioContext);
  if (window.webkitAudioContext !== window.AudioContext) {
    muteLegacyForegroundTimerTones(window.webkitAudioContext);
  }

  document.addEventListener("pointerdown", handlePointerDown, {
    capture: true,
    passive: true,
  });
  document.addEventListener("touchstart", unlockAudio, {
    capture: true,
    passive: true,
  });
  document.addEventListener("click", unlockAudio, {
    capture: true,
    passive: true,
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", scheduleNativeAlertForBackground);
  window.addEventListener("pageshow", () => {
    keepNativeAlertSilentWhileVisible();
    queueSyncWorkoutState();
  });
  window.addEventListener("mayfit-open-workout-sound-settings", openSettings);
  window.speechSynthesis?.addEventListener?.("voiceschanged", refreshVoiceSelector);

  const observer = new MutationObserver(queueSyncWorkoutState);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  ensureSettingsTrigger();
  ensureProfileSoundSettings();
  queueSyncWorkoutState();
}

installMobileWorkoutSounds();
