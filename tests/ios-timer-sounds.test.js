import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("carrega sons distintos do cronômetro no iPhone", async () => {
  const [entry, iosSounds] = await Promise.all([
    readFile("src/student-area-entry.js", "utf8"),
    readFile("src/ios-timer-sounds.js", "utf8"),
  ]);

  assert.match(entry, /ios-timer-sounds\.js\?v=1/);
  assert.match(iosSounds, /iPad\|iPhone\|iPod/);
  assert.match(iosSounds, /EXERCISE_TONES/);
  assert.match(iosSounds, /REST_TONES/);
  assert.match(iosSounds, /currentTimerPhase\(\) === "PAUSA"/);
  assert.match(iosSounds, /value === 760 \|\| value === 980/);
});
