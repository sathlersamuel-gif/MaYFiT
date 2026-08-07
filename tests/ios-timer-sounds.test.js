import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("iPhone usa o mesmo motor de sons do Android e só inicia som no START", async () => {
  const [entry, mobileSounds] = await Promise.all([
    readFile("src/student-area-entry.js", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
  ]);

  assert.match(entry, /mobile-workout-sounds\.js\?v=1/);
  assert.doesNotMatch(entry, /ios-timer-sounds/);
  assert.doesNotMatch(entry, /android-workout-sounds/);

  assert.match(mobileSounds, /iPad\|iPhone\|iPod/);
  assert.match(mobileSounds, /Android/);
  assert.match(mobileSounds, /isSupportedMobileDevice/);
  assert.match(mobileSounds, /classList\?\.contains\("timer-control"\)/);
  assert.match(mobileSounds, /normalizeText\(button\.textContent\) === "START"/);
  assert.match(mobileSounds, /confirmTimerActuallyStarted/);
  assert.match(mobileSounds, /button\.classList\.contains\("running"\)/);
  assert.doesNotMatch(mobileSounds, /closest\("\.hero"\)/);
  assert.doesNotMatch(mobileSounds, /complete-button/);
  assert.match(mobileSounds, /playCue\("rest"\)/);
  assert.match(mobileSounds, /playCue\("finish"\)/);
  assert.doesNotMatch(mobileSounds, /lastPhase === "PAUSA" && phase === "TEMPO"/);
  assert.match(mobileSounds, /Voz natural \(assistente\)/);
  assert.match(mobileSounds, /Bip esportivo/);
  assert.match(mobileSounds, /Sinos/);
  assert.match(mobileSounds, /Apito/);
});
