const STORE_KEY = 'mayfit_v8';
const USER_KEY = 'mayfit_user';
const VIEW_STUDENT_KEY = 'mayfit_view_student';

function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

function isAdmin() {
  return readJson(sessionStorage, USER_KEY)?.role === 'admin';
}

function selectedStudent() {
  return readJson(sessionStorage, VIEW_STUDENT_KEY);
}

function clearAllAssignedExercises() {
  const student = selectedStudent();
  if (!student?.id) {
    alert('Selecione primeiro o aluno correto em Configurações > Alunos > Atribuir treino.');
    return;
  }

  const data = readJson(localStorage, STORE_KEY);
  if (!data || !Array.isArray(data.exercises)) {
    alert('Não foi possível localizar o treino deste aluno.');
    return;
  }

  if (data.exercises.length === 0) {
    alert('Este aluno já está sem exercícios atribuídos.');
    return;
  }

  const name = student.name || 'este aluno';
  if (!confirm(`Excluir todos os ${data.exercises.length} exercícios atribuídos a ${name}?`)) return;

  localStorage.setItem(STORE_KEY, JSON.stringify({
    ...data,
    exercises: []
  }));

  alert('Todos os exercícios foram excluídos. A alteração será sincronizada com o aluno.');
  setTimeout(() => location.reload(), 1000);
}

function mountButton() {
  if (!isAdmin() || document.getElementById('mayfit-delete-all-exercises')) return;

  const title = [...document.querySelectorAll('.section-title h1')]
    .find(node => node.textContent?.trim() === 'Gerenciar treino');
  const container = title?.closest('.section-title');
  if (!container) return;

  const button = document.createElement('button');
  button.id = 'mayfit-delete-all-exercises';
  button.type = 'button';
  button.className = 'small';
  button.textContent = 'Excluir todos';
  button.style.background = '#3a1b1b';
  button.style.color = '#ffb6b6';
  button.style.border = '1px solid #6c3030';
  button.onclick = clearAllAssignedExercises;
  container.appendChild(button);
}

const observer = new MutationObserver(mountButton);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', mountButton);
setTimeout(mountButton, 500);
