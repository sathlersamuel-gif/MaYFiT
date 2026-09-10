import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("login preserva sessão durante falha temporária e tenta novamente", async () => {
  const auth = await readFile("src/supabase-auth-bridge.js", "utf8");
  const index = await readFile("index.html", "utf8");

  assert.match(auth, /function isTransientConnectionError/);
  assert.match(auth, /async function withTransientRetry/);
  assert.match(auth, /attempts = 3/);
  assert.match(auth, /signInWithPassword\(credentials\)/);
  assert.match(auth, /withTransientRetry\(\(\) => profileFor\(data\.user\)\)/);
  assert.match(auth, /if \(invalidCredentials \|\| blockedAccount\) await supabase\.auth\.signOut\(\)/);
  assert.match(auth, /if \(!isTransientConnectionError\(error\)\) await supabase\.auth\.signOut\(\)/);
  assert.match(index, /supabase-auth-bridge\.js\?v=5/);
  assert.match(index, /sw\.js\?v=46/);
});
