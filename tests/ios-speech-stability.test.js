import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Android e iPhone acompanham todas as series com voz estavel", async () => {
  const [stability, notifications, mobileSounds] = await Promise.all([
    readFile("src/lib/mobile-speech-stability.js", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
  ]);

  assert.match(notifications, /import "\.\/mobile-speech-stability\.js"/);
  assert.match(stability, /Android/);
  assert.match(stability, /iPad\|iPhone\|iPod/);
  assert.match(stability, /isAndroidDevice/);
  assert.match(stability, /isIOSDevice/);
  assert.match(stability, /isSupportedMobileDevice/);

  // A voz usa fila real para uma frase nunca cancelar a seguinte.
  assert.match(stability, /const speechQueue = \[\]/);
  assert.match(stability, /processSpeechQueue/);
  assert.match(stability, /speechQueue\.push\(utterance\)/);
  assert.match(stability, /speechQueue\.shift\(\)/);
  assert.match(stability, /currentUtterance/);
  assert.match(stability, /originalSpeak/);
  assert.match(stability, /originalCancel/);
  assert.match(stability, /deferredCancelTimer/);
  assert.match(stability, /220/);
  assert.match(stability, /clearDeferredCancel\(\)/);
  assert.match(stability, /activeUtterances/);
  assert.match(stability, /holdSpeechAudio/);
  assert.match(stability, /releaseSpeechAudioSoon/);

  // Em cada volta do descanso para o exercicio inicia a proxima serie com voz.
  assert.match(stability, /lastPhase === "PAUSA" && phase === "TEMPO"/);
  assert.match(stability, /speakAutomaticSeriesStart/);
  assert.match(stability, /Iniciando treino/);
  assert.match(stability, /mayfit_workout_sound_settings_v2/);
  assert.match(stability, /settings\.start \|\| "voice"/);
  assert.match(stability, /MutationObserver/);
  assert.match(stability, /__mayfitMobileSpeechStability/);
  assert.match(stability, /pagehide/);

  // Descanso e fim continuam no motor original, assim como todos os efeitos.
  assert.match(mobileSounds, /lastPhase === "TEMPO" && phase === "PAUSA"/);
  assert.match(mobileSounds, /playCue\("rest"\)/);
  assert.match(mobileSounds, /playCue\("finish"\)/);
  assert.match(mobileSounds, /Bip esportivo/);
  assert.match(mobileSounds, /Sinos/);
  assert.match(mobileSounds, /Apito/);
  assert.match(mobileSounds, /Alerta digital/);
});
