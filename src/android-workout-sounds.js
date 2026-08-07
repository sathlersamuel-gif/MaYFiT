import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const ANDROID_USER_AGENT = /Android/i;
const SETTINGS_KEY = "mayfit_workout_sound_settings_v1";
const BLOCKED_WARNING =
  "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.";

const VOICE_SOURCES = {
  start: "/audio/iniciando-treino.base64.txt?v=2",
  rest: "/audio/descanso.base64.txt?v=2",
  finish: "/audio/fim-treino.base64.txt?v=1",
};

const VOICE_TEXT = {
  start: "Iniciando treino",
  rest: "Descanso",
  finish: "Fim de treino",
};

const DEFAULT_SETTINGS = {
  start: "voice",
  rest: "voice",
  finish: "voice",
};

const SOUND_OPTIONS = [
  ["voice", "Voz natural (assistente)"],
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
  discreet: {
    label: "Discreto",
    settings: { start: "digital", rest: "digital", finish: "digital" },
  },
};

let settings = loadSettings();
let audioContext = null;
let voiceBuffers = null;
let voiceBuffersPromise = null;
let lastPhase = null;
let lastAllDone = false;
let pauseCycleActive = false;
let lastRunning = false;
let lastScreen = null;
let cancelTimers = [];
let syncQueued = false;
let settingsModal = null;
let settingsTrigger = null;
let speechToken = 0;

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

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (!saved || typeof saved !== "object") return { ...DEFAULT_SETTINGS };
    const valid = new Set(SOUND_OPTIONS.map(([value]) => value));
    return {
      start: valid.has(saved.start) ? saved.start : DEFAULT_SETTINGS.start,
      rest: valid.has(saved.rest) ? saved.rest : DEFAULT_SETTINGS.rest,
      finish: valid.has(saved.finish) ? saved.finish : DEFAULT_SETTINGS.finish,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(next) {
  settings = { ...DEFAULT_SETTINGS, ...next };
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

function base64ToArrayBuffer(value) {
  const clean = String(value || "").trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
    throw new Error("Arquivo de áudio inválido");
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function loadVoiceBuffer(source) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error("Falha ao carregar voz do treino");
  const context = getAudioContext();
  if (!context) throw new Error("Áudio indisponível");
  const encoded = await response.text();
  return context.decodeAudioData(base64ToArrayBuffer(encoded));
}

function prepareVoiceBuffers() {
  if (voiceBuffers) return Promise.resolve(voiceBuffers);
  if (voiceBuffersPromise) return voiceBuffersPromise;

  voiceBuffersPromise = Promise.all([
    loadVoiceBuffer(VOICE_SOURCES.start),
    loadVoiceBuffer(VOICE_SOURCES.rest),
    loadVoiceBuffer(VOICE_SOURCES.finish),
  ])
    .then(([start, rest, finish]) => {
      voiceBuffers = { start, rest, finish };
      return voiceBuffers;
    })
    .catch(() => null)
    .finally(() => {
      voiceBuffersPromise = null;
    });

  return voiceBuffersPromise;
}

function playBuffer(buffer) {
  const context = getAudioContext();
  if (!context || !buffer) return false;
  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    return true;
  } catch {
    return false;
  }
}

function preferredPortugueseVoice() {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const portuguese = voices.filter((voice) => /^pt(?:-|_)/i.test(voice.lang));
    if (!portuguese.length) return null;
    const preferredNames = /(google|microsoft|samsung|maria|francisca|luciana|brasil)/i;
    return portuguese.find((voice) => preferredNames.test(voice.name)) || portuguese[0];
  } catch {
    return null;
  }
}

async function playEmbeddedVoice(cue) {
  const buffers = voiceBuffers || (await prepareVoiceBuffers());
  const buffer = buffers?.[cue];
  if (buffer && playBuffer(buffer)) return true;
  playSynthetic("digital", cue);
  return false;
}

function playNaturalVoice(cue) {
  const token = ++speechToken;
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      void playEmbeddedVoice(cue).then(resolve);
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
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = preferredPortugueseVoice();
      if (voice) utterance.voice = voice;

      const fallbackTimer = setTimeout(() => {
        if (started || settled || token !== speechToken) return;
        try {
          window.speechSynthesis.cancel();
        } catch {}
        void playEmbeddedVoice(cue).then((worked) => finish(worked));
      }, 450);

      utterance.onstart = () => {
        started = true;
        clearTimeout(fallbackTimer);
        finish(true);
      };
      utterance.onerror = () => {
        clearTimeout(fallbackTimer);
        void playEmbeddedVoice(cue).then((worked) => finish(worked));
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      void playEmbeddedVoice(cue).then(resolve);
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
    [0, 0.16, 0.32].forEach((start, index) =>
      tone({
        frequency: cue === "rest" ? 720 : 980 + index * 80,
        start,
        duration: 0.1,
        type: "square",
        volume: 0.22,
      }),
    );
    return;
  }

  if (kind === "bells") {
    [0, 0.18, 0.38].forEach((start, index) =>
      tone({
        frequency: [660, 880, 1100][index],
        start,
        duration: 0.52,
        type: "sine",
        volume: 0.24,
      }),
    );
    return;
  }

  if (kind === "whistle") {
    [0, 0.22].forEach((start, index) =>
      tone({
        frequency: index ? 1550 : 1320,
        start,
        duration: 0.18,
        type: "sine",
        volume: 0.2,
      }),
    );
    return;
  }

  [0, 0.12, 0.26].forEach((start, index) =>
    tone({
      frequency: [520, 780, 1040][index],
      start,
      duration: 0.14,
      type: "triangle",
      volume: 0.2,
    }),
  );
}

async function playCue(cue, forcedSound = null) {
  if (!isAndroidDevice()) return;
  unlockAudio();
  const selected = forcedSound || settings[cue] || DEFAULT_SETTINGS[cue];
  if (selected === "silent") return;

  if (selected === "voice") {
    await playNaturalVoice(cue);
  } else {
    playSynthetic(selected, cue);
  }

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
  if (document.hidden) return;
  clearCancelTimers();
  void cancelTimerNotification({ delivered: true });
  cancelTimers = [80, 220, 500, 900, 1500, 2500].map((delay) =>
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
      void playCue("rest");
    } else if (
      lastPhase === "PAUSA" &&
      phase === "TEMPO" &&
      pauseCycleActive &&
      !allDone
    ) {
      pauseCycleActive = false;
      void playCue("start");
    }
  }

  if (!lastAllDone && allDone) {
    pauseCycleActive = false;
    void playCue("finish");
  }

  lastPhase = phase;
  lastAllDone = allDone;
  lastRunning = running;
}

function queueSyncWorkoutState() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncWorkoutState();
    ensureSettingsTrigger();
  });
}

function isStartAction(button) {
  if (!button) return false;
  const label = normalizeText(button.textContent);

  if (button.closest(".hero") && label.includes("INICIAR TREINO")) return true;
  if (button.classList.contains("timer-control") && label === "START") return true;
  if (button.classList.contains("complete-button") && label.includes("INICIAR")) {
    return true;
  }
  return false;
}

function handlePointerDown(event) {
  unlockAudio();
  void prepareVoiceBuffers();
  const button = event.target?.closest?.("button");
  if (!isStartAction(button)) return;
  void playCue("start");
}

function suppressObsoleteWarning() {
  const originalAlert = window.alert.bind(window);
  window.alert = (message) => {
    if (String(message || "").trim() === BLOCKED_WARNING) return;
    originalAlert(message);
  };
}

function muteLegacyForegroundTimerTones(AudioContextCtor) {
  const prototype = AudioContextCtor?.prototype;
  const originalCreateOscillator = prototype?.createOscillator;
  if (!prototype || !originalCreateOscillator) return;
  if (originalCreateOscillator.__mayfitWorkoutSoundEngine) return;

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

  createOscillatorWithoutLegacyTimerTone.__mayfitWorkoutSoundEngine = true;
  prototype.createOscillator = createOscillatorWithoutLegacyTimerTone;
}

function optionMarkup(selected) {
  return SOUND_OPTIONS.map(
    ([value, label]) =>
      `<option value="${value}"${selected === value ? " selected" : ""}>${label}</option>`,
  ).join("");
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
      ${row("start", "Início do treino", "Quando o treino ou uma série começa.")}
      ${row("rest", "Descanso", "Quando o cronômetro entra no descanso.")}
      ${row("finish", "Fim de treino", "Quando todas as séries ficam concluídas.")}
      <p class="mayfit-sound-note">Com a tela apagada, o Android continua usando a notificação nativa para garantir o aviso.</p>
      <button type="button" class="mayfit-sound-done">Concluído</button>
    </div>`;
}

function installSettingsStyles() {
  if (document.getElementById("mayfit-workout-sound-styles")) return;
  const style = document.createElement("style");
  style.id = "mayfit-workout-sound-styles";
  style.textContent = `
    .mayfit-sound-settings-trigger{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:inherit;font-size:20px;cursor:pointer;margin-left:6px}
    .mayfit-sound-settings-trigger:active{transform:scale(.96)}
    .mayfit-sound-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:14px}
    .mayfit-sound-dialog{width:min(560px,100%);max-height:88vh;overflow:auto;background:#141414;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.45)}
    .mayfit-sound-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
    .mayfit-sound-head small{font-size:11px;letter-spacing:.12em;opacity:.6}
    .mayfit-sound-head h2{margin:3px 0 0;font-size:23px}
    .mayfit-sound-close{border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:12px;width:38px;height:38px;font-size:27px;line-height:1;cursor:pointer}
    .mayfit-sound-preset{display:grid;gap:7px;margin-bottom:14px;padding:13px;border-radius:16px;background:rgba(157,242,15,.08);border:1px solid rgba(157,242,15,.18)}
    .mayfit-sound-preset span{font-size:13px;font-weight:700}
    .mayfit-sound-dialog select{width:100%;min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#222;color:#fff;padding:0 12px;font-size:14px}
    .mayfit-sound-row{display:grid;grid-template-columns:minmax(0,1fr) 150px 68px;gap:9px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.09)}
    .mayfit-sound-row-copy{display:grid;gap:3px;min-width:0}
    .mayfit-sound-row-copy strong{font-size:14px}
    .mayfit-sound-row-copy span{font-size:12px;opacity:.62;line-height:1.35}
    .mayfit-sound-preview{height:42px;border:0;border-radius:11px;background:#9df20f;color:#111;font-weight:800;cursor:pointer}
    .mayfit-sound-note{font-size:11px;line-height:1.45;opacity:.55;margin:14px 0}
    .mayfit-sound-done{width:100%;height:48px;border:0;border-radius:14px;background:#9df20f;color:#111;font-weight:900;font-size:15px;cursor:pointer}
    @media(max-width:520px){.mayfit-sound-row{grid-template-columns:1fr 72px}.mayfit-sound-row-copy{grid-column:1/-1}.mayfit-sound-dialog select{min-width:0}.mayfit-sound-overlay{padding:8px}.mayfit-sound-dialog{border-radius:20px 20px 12px 12px}}
  `;
  document.head.appendChild(style);
}

function closeSettings() {
  settingsModal?.remove();
  settingsModal = null;
}

function refreshSettingsControls() {
  if (!settingsModal) return;
  for (const cue of ["start", "rest", "finish"]) {
    const select = settingsModal.querySelector(`[data-sound-select="${cue}"]`);
    if (select) select.value = settings[cue];
  }
  const preset = settingsModal.querySelector("[data-sound-preset]");
  if (preset) preset.value = currentPreset();
}

function openSettings() {
  closeSettings();
  unlockAudio();
  installSettingsStyles();
  const overlay = document.createElement("div");
  overlay.className = "mayfit-sound-overlay";
  overlay.innerHTML = settingsMarkup();
  document.body.appendChild(overlay);
  settingsModal = overlay;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".mayfit-sound-close") || event.target.closest(".mayfit-sound-done")) {
      closeSettings();
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

    const select = event.target.closest("[data-sound-select]");
    if (!select) return;
    saveSettings({ ...settings, [select.dataset.soundSelect]: select.value });
    refreshSettingsControls();
  });
}

function ensureSettingsTrigger() {
  if (!isAndroidDevice()) return;
  const header = document.querySelector(".app > header");
  if (!header) {
    settingsTrigger = null;
    return;
  }
  if (header.querySelector(".mayfit-sound-settings-trigger")) return;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "mayfit-sound-settings-trigger";
  trigger.setAttribute("aria-label", "Configurações de sons do treino");
  trigger.title = "Sons do treino";
  trigger.textContent = "⚙";
  trigger.addEventListener("click", openSettings);
  header.appendChild(trigger);
  settingsTrigger = trigger;
}

function handleVisibilityChange() {
  if (document.hidden) {
    scheduleNativeAlertForBackground();
    return;
  }
  keepNativeAlertSilentWhileVisible();
  queueSyncWorkoutState();
}

function installAndroidWorkoutSounds() {
  if (!isAndroidDevice()) return;

  suppressObsoleteWarning();
  installSettingsStyles();
  getAudioContext();
  void prepareVoiceBuffers();

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

  const observer = new MutationObserver(queueSyncWorkoutState);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  ensureSettingsTrigger();
  queueSyncWorkoutState();
}

installAndroidWorkoutSounds();
