import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("iPhone e Android recuperam o START apos fechar o teclado sem alterar o treino", async () => {
  const [recovery, notifications, main, workoutSounds] = await Promise.all([
    readFile("src/lib/mobile-keyboard-recovery.js", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/main.jsx", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
  ]);

  assert.match(notifications, /import "\.\/mobile-keyboard-recovery\.js"/);
  assert.match(recovery, /Android/);
  assert.match(recovery, /iPad\|iPhone\|iPod/);
  assert.match(recovery, /WORKOUT_INPUT_SELECTOR/);
  assert.match(recovery, /focusin/);
  assert.match(recovery, /focusout/);
  assert.match(recovery, /visualViewport/);
  assert.match(recovery, /screen\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.match(recovery, /label === "START" \|\| label === "SELECIONE"/);
  assert.match(recovery, /anotherWorkoutInputHasFocus/);

  // O reparo de teclado nao dispara treino nem reescreve series/cronometro.
  assert.doesNotMatch(recovery, /\.click\(/);
  assert.doesNotMatch(recovery, /setNativeValue/);
  assert.doesNotMatch(recovery, /remainingSets/);
  assert.doesNotMatch(recovery, /startCountdown/);

  // Os motores existentes continuam presentes e independentes.
  assert.match(main, /const timerLabel = running \? "PAUSAR" : started \? "CONTINUAR" : "START"/);
  assert.match(workoutSounds, /playCue\("rest"\)/);
  assert.match(workoutSounds, /playCue\("finish"\)/);
});
