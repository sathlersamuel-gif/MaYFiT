const selectedNames = new Set();
let deleting = false;

function normalizeName(value) {
  return String(value || '').trim();
}

function getAdminList() {
  return document.querySelector('.admin-list');
}

function getCards() {
  return [...document.querySelectorAll('.admin-list .admin-card')];
}

function getCardName(card) {
  return normalizeName(card.querySelector('.admin-head strong')?.textContent);
}

function ensureStyles() {
  if (document.getElementById('mayfit-bulk-delete-style')) return;
  const style = document.createElement('style');
  style.id = 'mayfit-bulk-delete-style';
  style.textContent = `
    .mayfit-bulk-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px;border:1px solid #31543b;border-radius:16px;background:#0d1711;color:#fff}
    .mayfit-bulk-left{display:flex;align-items:center;gap:10px;font-weight:850}
    .mayfit-bulk-left input,.mayfit-card-select input{width:20px;height:20px;accent-color:#8df20b}
    .mayfit-bulk-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .mayfit-bulk-count{color:#9daaa1;font-size:13px;font-weight:800}
    .mayfit-delete-selected{border:1px solid #884646;border-radius:12px;padding:10px 13px;background:#3a1717;color:#ffb2b2;font-weight:900;cursor:pointer}
    .mayfit-delete-selected:disabled{opacity:.45;cursor:not-allowed}
    .mayfit-card-select{display:flex;align-items:center;justify-content:center;flex:0 0 34px;align-self:stretch;min-height:42px}
    .admin-card.mayfit-selected-for-delete{box-shadow:inset 0 0 0 2px #ef5d5d!important;background:#1a0d0d!important}
    @media(max-width:620px){.mayfit-bulk-toolbar{align-items:stretch}.mayfit-bulk-actions{width:100%;justify-content:space-between}.mayfit-delete-selected{flex:1}.mayfit-card-select{flex-basis:30px}}
  `;
  document.head.appendChild(style);
}

function updateToolbar() {
  const toolbar = document.querySelector('.mayfit-bulk-toolbar');
  if (!toolbar) return;
  const cards = getCards();
  const count = selectedNames.size;
  const allSelected = cards.length > 0 && cards.every(card => selectedNames.has(getCardName(card)));
  const selectAll = toolbar.querySelector('[data-bulk-select-all]');
  const countLabel = toolbar.querySelector('[data-bulk-count]');
  const deleteButton = toolbar.querySelector('[data-bulk-delete]');
  if (selectAll) {
    selectAll.checked = allSelected;
    selectAll.indeterminate = count > 0 && !allSelected;
  }
  if (countLabel) countLabel.textContent = `${count} selecionado(s)`;
  if (deleteButton) deleteButton.disabled = count === 0 || deleting;
}

function syncCards() {
  const cards = getCards();
  cards.forEach(card => {
    const name = getCardName(card);
    if (!name) return;
    let holder = card.querySelector('.mayfit-card-select');
    if (!holder) {
      holder = document.createElement('label');
      holder.className = 'mayfit-card-select';
      holder.title = `Selecionar ${name}`;
      holder.innerHTML = '<input type="checkbox" aria-label="Selecionar exercício para exclusão">';
      const head = card.querySelector('.admin-head');
      if (head) head.insertBefore(holder, head.firstChild);
      holder.querySelector('input').addEventListener('change', event => {
        if (event.target.checked) selectedNames.add(name);
        else selectedNames.delete(name);
        card.classList.toggle('mayfit-selected-for-delete', event.target.checked);
        updateToolbar();
      });
    }
    const checkbox = holder.querySelector('input');
    const checked = selectedNames.has(name);
    checkbox.checked = checked;
    card.classList.toggle('mayfit-selected-for-delete', checked);
  });
  for (const name of [...selectedNames]) {
    if (!cards.some(card => getCardName(card) === name)) selectedNames.delete(name);
  }
  updateToolbar();
}

function mountToolbar() {
  const list = getAdminList();
  if (!list || document.querySelector('.mayfit-bulk-toolbar')) return;
  ensureStyles();
  const toolbar = document.createElement('div');
  toolbar.className = 'mayfit-bulk-toolbar';
  toolbar.innerHTML = `
    <label class="mayfit-bulk-left">
      <input type="checkbox" data-bulk-select-all>
      <span>Selecionar todos</span>
    </label>
    <div class="mayfit-bulk-actions">
      <span class="mayfit-bulk-count" data-bulk-count>0 selecionado(s)</span>
      <button type="button" class="mayfit-delete-selected" data-bulk-delete disabled>Excluir selecionados</button>
    </div>
  `;
  list.parentElement.insertBefore(toolbar, list);
  toolbar.querySelector('[data-bulk-select-all]').addEventListener('change', event => {
    const cards = getCards();
    selectedNames.clear();
    if (event.target.checked) cards.forEach(card => selectedNames.add(getCardName(card)));
    syncCards();
  });
  toolbar.querySelector('[data-bulk-delete]').addEventListener('click', deleteSelected);
  syncCards();
}

function waitForAdminListChange(previousCount) {
  return new Promise(resolve => {
    const started = Date.now();
    const timer = setInterval(() => {
      const current = getCards().length;
      if (current < previousCount || Date.now() - started > 1500) {
        clearInterval(timer);
        resolve();
      }
    }, 60);
  });
}

async function deleteSelected() {
  if (deleting || !selectedNames.size) return;
  const names = [...selectedNames];
  if (!window.confirm(`Excluir definitivamente ${names.length} exercício(s) selecionado(s)?`)) return;
  deleting = true;
  updateToolbar();
  let removed = 0;
  try {
    for (const name of names) {
      const card = getCards().find(item => getCardName(item) === name);
      if (!card) continue;
      const button = card.querySelector('.delete-exercise');
      if (!button) continue;
      const previousCount = getCards().length;
      const originalConfirm = window.confirm;
      window.confirm = () => true;
      try {
        button.click();
      } finally {
        window.confirm = originalConfirm;
      }
      await waitForAdminListChange(previousCount);
      selectedNames.delete(name);
      removed += 1;
    }
    syncCards();
    alert(`${removed} exercício(s) excluído(s) com sucesso.`);
  } finally {
    deleting = false;
    syncCards();
  }
}

function refresh() {
  mountToolbar();
  syncCards();
}

const observer = new MutationObserver(refresh);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', refresh);
refresh();
