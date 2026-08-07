import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("iPhone carrega diretamente o motor novo e exibe sons configuraveis", async () => {
  const [index, entry, mobileSounds, serviceWorker] = await Promise.all([
    readFile("index.html", "utf8"),
    readFile("src/student-area-entry.js", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
    readFile("sw.js", "utf8"),
  ]);

  assert.match(index, /mobile-workout-sounds\.js\?v=3/);
  assert.match(index, /sw\.js\?v=44/);
  assert.doesNotMatch(entry, /mobile-workout-sounds/);
  assert.match(serviceWorker, /mayfit-sw-v25-mobile-sounds-direct/);

  assert.match(mobileSounds, /iPad\|iPhone\|iPod/);
  assert.match(mobileSounds, /Android/);
  assert.match(mobileSounds, /isSupportedMobileDevice/);
  assert.match(mobileSounds, /mayfit_workout_sound_settings_v2/);

  assert.match(mobileSounds, /timer-control/);
  assert.match(mobileSounds, /=== "START"/);
  assert.match(mobileSounds, /armPendingTimerStart/);
  assert.match(mobileSounds, /confirmPendingTimerStart/);
  assert.match(mobileSounds, /classList\.contains\("running"\)/);
  assert.equal((mobileSounds.match(/playCue\("start"\)/g) || []).length, 1);
  assert.doesNotMatch(mobileSounds, /closest\("\.hero"\)/);
  assert.doesNotMatch(mobileSounds, /complete-button/);

  assert.match(mobileSounds, /playCue\("rest"\)/);
  assert.match(mobileSounds, /playCue\("finish"\)/);
  assert.doesNotMatch(mobileSounds, /lastPhase === "PAUSA" && phase === "TEMPO"/);

  assert.match(mobileSounds, /Voz natural do aparelho/);
  assert.match(mobileSounds, /mais natural disponivel|mais natural disponível/);
  assert.match(mobileSounds, /data-voice-select/);
  assert.match(mobileSounds, /voiceschanged/);
  assert.doesNotMatch(mobileSounds, /VOICE_SOURCES/);
  assert.doesNotMatch(mobileSounds, /base64\.txt/);

  for (const label of ["Bip esportivo", "Sinos", "Apito", "Alerta digital", "Sem som"]) {
    assert.match(mobileSounds, new RegExp(label));
  }
  assert.match(mobileSounds, /mayfit-profile-sounds/);
  assert.match(mobileSounds, /Configurar/);
});
