import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("safe area universal permanece conectada do Android nativo ao rodape", async () => {
  const [mainActivity, safeArea, mobileCss, studentEntry, adminThumbs, history, index] =
    await Promise.all([
      readFile("android/app/src/main/java/com/mayfit/app/MainActivity.java", "utf8"),
      readFile("src/system-safe-area.js", "utf8"),
      readFile("src/mobile-audit.css", "utf8"),
      readFile("src/student-area-entry.js", "utf8"),
      readFile("src/admin-exercise-thumbnails.js", "utf8"),
      readFile("src/workout-history.js", "utf8"),
      readFile("index.html", "utf8"),
    ]);

  // Android mede a area do sistema pelo proprio SO, sem lista de marcas/modelos.
  assert.match(mainActivity, /WindowInsetsCompat\.Type\.navigationBars\(\)/);
  assert.match(mainActivity, /WindowInsetsCompat\.Type\.tappableElement\(\)/);
  assert.match(mainActivity, /WindowInsetsCompat\.Type\.mandatorySystemGestures\(\)/);
  assert.match(mainActivity, /--mayfit-native-bottom/);
  assert.match(mainActivity, /onConfigurationChanged/);
  assert.match(mainActivity, /onWindowFocusChanged/);

  // A camada web combina inset nativo, safe area CSS e viewport dinamico.
  assert.match(safeArea, /--mayfit-native-bottom/);
  assert.match(safeArea, /env\(safe-area-inset-bottom,0px\)/);
  assert.match(safeArea, /visualViewport/);
  assert.match(safeArea, /--mayfit-runtime-bottom/);
  assert.match(safeArea, /orientationchange/);
  assert.match(safeArea, /mayfit-native-insets/);

  // O rodape e o conteudo reservam exatamente a area segura calculada.
  assert.match(mobileCss, /--mayfit-safe-bottom:\s*max\(/);
  assert.match(mobileCss, /padding-bottom:calc\(11px \+ var\(--mayfit-safe-bottom\)\)/);
  assert.match(mobileCss, /padding-bottom:calc\(88px \+ var\(--mayfit-safe-bottom\)\)/);

  // Garante que o modulo de safe area continua realmente carregado pelo app.
  assert.match(studentEntry, /import '\.\/system-safe-area\.js\?v=1'/);
  assert.match(adminThumbs, /import '\.\/student-area-entry\.js\?v=4'/);
  assert.match(history, /import '\.\/admin-exercise-thumbnails\.js\?v=4'/);
  assert.match(index, /src\/workout-history\.js\?v=3/);

  // iOS precisa de viewport-fit=cover para expor os safe-area-insets.
  assert.match(index, /viewport-fit=cover/);
});
