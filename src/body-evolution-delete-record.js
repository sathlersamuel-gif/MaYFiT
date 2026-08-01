import { supabase } from './lib/supabase.js';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}
}

async function installDeleteEvaluationButtons(modal){
  const user=currentUser();
  if(user?.role!=='student'||!user.id||modal.dataset.evaluationDeleteReady==='true')return;
  const entries=[...modal.querySelectorAll('.be-entry')];
  if(!entries.length)return;

  const {data,error}=await supabase
    .from('body_progress')
    .select('id,photo_front,photo_side,photo_back')
    .eq('user_id',user.id)
    .order('measured_at',{ascending:false})
    .order('created_at',{ascending:false});

  if(error||!data?.length)return;
  modal.dataset.evaluationDeleteReady='true';

  entries.forEach((entry,index)=>{
    const record=data[index];
    if(!record||entry.querySelector('[data-delete-evaluation]'))return;

    const button=document.createElement('button');
    button.type='button';
    button.dataset.deleteEvaluation='true';
    button.textContent='Excluir avaliação completa';
    button.style.cssText='width:100%;margin-top:12px;padding:10px 12px;border:1px solid #753737;border-radius:11px;background:#3a1717;color:#ffb3b3;font-weight:900';

    button.onclick=async()=>{
      if(!confirm('Excluir esta avaliação completa? As medidas, observações e todas as fotos serão apagadas definitivamente.'))return;
      button.disabled=true;
      button.textContent='Excluindo avaliação...';

      try{
        const paths=[record.photo_front,record.photo_side,record.photo_back].filter(Boolean);
        if(paths.length){
          const {error:storageError}=await supabase.storage.from('body-progress').remove(paths);
          if(storageError)throw storageError;
        }

        const {error:deleteError}=await supabase
          .from('body_progress')
          .delete()
          .eq('id',record.id)
          .eq('user_id',user.id);
        if(deleteError)throw deleteError;

        entry.remove();
        const remaining=modal.querySelectorAll('.be-entry').length;
        if(!remaining){
          const history=modal.querySelector('.be-history');
          if(history)history.innerHTML='<div class="be-msg">Nenhuma avaliação registrada ainda.</div>';
        }
      }catch(error){
        alert('Não foi possível excluir a avaliação: '+(error.message||'erro desconhecido'));
        button.disabled=false;
        button.textContent='Excluir avaliação completa';
      }
    };

    entry.appendChild(button);
  });
}

function scan(){
  document.querySelectorAll('.be-modal').forEach(modal=>installDeleteEvaluationButtons(modal));
}

const observer=new MutationObserver(()=>requestAnimationFrame(scan));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('mayfit:evolution-saved',()=>setTimeout(scan,350));
scan();
