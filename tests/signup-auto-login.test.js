import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('cadastro de aluno entra direto sem aprovacao do administrador', async () => {
  const [auth, management, migration] = await Promise.all([
    readFile('src/supabase-auth-bridge.js', 'utf8'),
    readFile('src/student-management.js', 'utf8'),
    readFile('supabase/004_auto_activate_students.sql', 'utf8'),
  ]);

  assert.doesNotMatch(auth, /aguardando aprovação/i);
  assert.doesNotMatch(auth, /Cadastro enviado/i);
  assert.match(auth, /status: 'active'/);
  assert.match(auth, /sessionStorage\.setItem\(USER_KEY, JSON\.stringify\(profile\)\)/);
  assert.match(auth, /location\.reload\(\)/);
  assert.match(auth, /activateOwnPendingProfile/);

  assert.doesNotMatch(management, /Aprovar aluno/i);
  assert.doesNotMatch(management, /data-action="approve"/i);
  assert.match(management, /Bloquear/);
  assert.match(management, /Excluir/);
  assert.match(management, /status:'active'/);

  assert.match(migration, /alter column status set default 'active'/i);
  assert.match(migration, /'student',\s*'active'/i);
  assert.match(migration, /status = 'active'/i);
  assert.match(migration, /status = 'pending'/i);
});
