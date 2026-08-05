import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("permite rolagem vertical na imagem ampliada do treino", async () => {
  const source = await readFile("src/workout-photo-modal-fix.js", "utf8");

  assert.match(source, /overflow-y:auto!important/);
  assert.match(source, /-webkit-overflow-scrolling:touch!important/);
  assert.match(source, /touch-action:pan-y!important/);
  assert.match(source, /grid-template-columns:1fr!important/);
  assert.doesNotMatch(source, /touchmove[^\n]*preventDefault/);
  assert.doesNotMatch(source, /mayfit-workout-image-zoom[^\n]*touch-action:none/);
});
