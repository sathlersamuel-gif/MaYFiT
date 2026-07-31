const USER_KEY='mayfit_user';

function getCurrentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function isStudent(){
  return getCurrentUser()?.role==='student';
}

function normalizeInterface(){
  if(!isStudent())return;

  document.querySelectorAll('button').forEach(button=>{
    const text=(button.textContent||'').trim().toLowerCase();
    if(text==='ver aluno'||text==='alunos'||text.includes('aprovar usuário')||text.includes('aprovar aluno')){
      button.style.display='none';
    }
    if(text==='gerenciar')button.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim())node.textContent=' Meu treino'});
  });

  document.querySelectorAll('h1,h2,h3').forEach(title=>{
    const text=(title.textContent||'').trim();
    if(/^Gerenciar treino$/i.test(text))title.textContent='Meu treino';
  });

  document.querySelectorAll('p,small,span').forEach(node=>{
    const text=(node.textContent||'').trim();
    if(/^Escolha um ou vários exercícios para atribuir ao aluno\.?$/i.test(text)){
      node.textContent='Escolha um ou vários exercícios para montar seu treino.';
    }
    if(/^Já atribuído ao aluno$/i.test(text))node.textContent='Já adicionado ao seu treino';
    if(/^Disponível para atribuir$/i.test(text))node.textContent='Disponível para adicionar';
  });
}

const observer=new MutationObserver(normalizeInterface);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',normalizeInterface);
setInterval(normalizeInterface,1000);
normalizeInterface();
