import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("remove apenas credenciais de teste e preserva autocomplete real", async () => {
  const source = await readFile("src/supabase-auth-bridge.js", "utf8");

  assert.match(source, /setControlledInputValue/);
  assert.match(source, /new Event\('input', \{ bubbles: true \}\)/);
  assert.match(source, /'aluno@mayfit\.com'/);
  assert.match(source, /'admin@mayfit\.com'/);
  assert.match(source, /passwordInput\?\.value === '123456'/);
  assert.match(source, /if \(hasTestCredentials\)/);

  assert.match(source, /emailInput\.autocomplete = 'username'/);
  assert.match(source, /passwordInput\.autocomplete = 'current-password'/);
  assert.match(source, /emailInput\.name = 'email'/);
  assert.match(source, /passwordInput\.name = 'password'/);

  // Nao deve limpar qualquer credencial real de forma incondicional.
  assert.doesNotMatch(source, /emailInput\.value = ''/);
  assert.doesNotMatch(source, /passwordInput\.value = ''/);

  // Autenticacao real continua sendo feita pelo Supabase.
  assert.match(source, /supabase\.auth\.signInWithPassword/);
  assert.match(source, /profileFor\(data\.user\)/);
});
