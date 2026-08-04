import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const PHOTO_COLUMNS=['photo_front','photo_side','photo_back'];
const LABELS={
  weight_kg:'Peso',height_cm:'Altura',body_fat_pct:'Gordura corporal',muscle_mass_kg:'Massa muscular',
  visceral_fat:'Gordura visceral',metabolic_age:'Idade metabólica',neck_cm:'Pescoço',shoulders_cm:'Ombros',
  chest_cm:'Peito',waist_cm:'Cintura',abdomen_cm:'Abdômen',hips_cm:'Quadril',arm_left_cm:'Braço esquerdo',
  arm_right_cm:'Braço direito',thigh_left_cm:'Coxa esquerda',thigh_right_cm:'Coxa direita',calf_left_cm:'Panturrilha esquerda',calf_right_cm:'Panturrilha direita'
};
let loading=false;
let lastSignature='';

function currentUser(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function formatDate(value){
  if(!value)return '';
  const date=new Date(`${String(value).slice(0,10)}T12:00:00`);
  return Number.isNaN(date.getTime())?String(value):date.toLocaleDateString('pt-BR');
}
function formatValue(key,value){
  if(value===null||value===undefined||value==='')return '';
  const unit=key.endsWith('_cm')?' cm':key.endsWith('_kg')?' kg':key.endsWith('_pct')?'%':'';
  return `${String(value).replace('.',',')}${unit}`;
}

async function photoUrl(path){
  if(!path)return null;
  const signed=await supabase.storage.from('body-progress').createSignedUrl(path,60*60);
  if(!signed.error&&signed.data?.signedUrl)return signed.data.signedUrl;
  const publicResult=supabase.storage.from('body-progress').getPublicUrl(path);
  return publicResult.data?.publicUrl||null;
}

function findHistoryContainer(modal){
  const headings=[...modal.querySelectorAll('h2,h3,strong')];
  const heading=headings.find(node=>/histórico|antes\/depois/i.test(node.textContent||''));
  return heading?.parentElement||modal.querySelector('.be-history')||modal.querySelector('.be-scroll')||modal.querySelector('.be-wrap');
}

function ensurePanel(modal){
  let panel=modal.querySelector('[data-mayfit-restored-history]');
  if(panel)return panel;
  panel=document.createElement('section');
  panel.dataset.mayfitRestoredHistory='true';
  panel.style.cssText='margin:16px 0;padding:14px;border:1px solid #31543c;border-radius:18px;background:#0b140e;color:#fff';
  panel.innerHTML='<h2 style="margin:0 0 12px;font-size:20px">Histórico e antes/depois</h2><div data-restored-content style="color:#aebbb2">Carregando evolução...</div>';
  const host=findHistoryContainer(modal);
  host?.appendChild(panel);
  return panel;
}

async function renderRecords(modal,records){
  const panel=ensurePanel(modal);
  const content=panel.querySelector('[data-restored-content]');
  if(!content)return;
  if(!records.length){content.innerHTML='<div style="padding:8px 0;color:#aebbb2">Nenhuma avaliação registrada ainda.</div>';return}

  const cards=[];
  for(const record of records){
    const photoEntries=[];
    for(const [index,column] of PHOTO_COLUMNS.entries()){
      const url=await photoUrl(record[column]);
      if(url)photoEntries.push({url,label:['Frente','Lateral','Costas'][index]});
    }
    const measures=Object.keys(LABELS).filter(key=>record[key]!==null&&record[key]!==undefined&&record[key]!=='')
      .map(key=>`<div style="padding:8px;border:1px solid #294233;border-radius:10px;background:#101a14"><small style="display:block;color:#96a79b">${esc(LABELS[key])}</small><b>${esc(formatValue(key,record[key]))}</b></div>`).join('');
    const photos=photoEntries.length?`<div style="display:grid;grid-template-columns:repeat(${Math.min(3,photoEntries.length)},minmax(0,1fr));gap:8px;margin-top:10px">${photoEntries.map(photo=>`<figure style="margin:0;min-width:0"><img src="${esc(photo.url)}" alt="${esc(photo.label)}" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px;border:1px solid #395b43"><figcaption style="margin-top:4px;text-align:center;color:#aebbb2;font-size:12px">${esc(photo.label)}</figcaption></figure>`).join('')}</div>`:'';
    cards.push(`<article style="margin-bottom:12px;padding:12px;border:1px solid #294233;border-radius:15px;background:#0f1913"><div style="font-weight:900;color:#8df20b">${esc(formatDate(record.measured_at))}</div>${measures?`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px">${measures}</div>`:''}${photos}${record.notes?`<div style="margin-top:10px;color:#c5d0c8"><b>Observações:</b> ${esc(record.notes)}</div>`:''}</article>`);
  }
  content.innerHTML=cards.join('');
}

async function loadForModal(modal){
  const user=currentUser();
  if(!user?.id||!modal||loading)return;
  loading=true;
  try{
    const {data,error}=await supabase.from('body_progress').select('*').eq('user_id',user.id).order('measured_at',{ascending:false}).order('created_at',{ascending:false});
    if(error)throw error;
    const signature=JSON.stringify((data||[]).map(item=>[item.id,item.photo_front,item.photo_side,item.photo_back,item.weight_kg,item.measured_at]));
    if(signature!==lastSignature||!modal.querySelector('[data-mayfit-restored-history]')){
      lastSignature=signature;
      await renderRecords(modal,data||[]);
    }
  }catch(error){
    const panel=ensurePanel(modal);
    const content=panel.querySelector('[data-restored-content]');
    if(content)content.textContent=`Não foi possível carregar a evolução: ${error.message||'erro desconhecido'}`;
  }finally{loading=false}
}

function scan(){document.querySelectorAll('.be-modal').forEach(loadForModal)}
const observer=new MutationObserver(()=>requestAnimationFrame(scan));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('mayfit:evolution-saved',()=>{lastSignature='';setTimeout(scan,150)});
window.addEventListener('mayfit-body-progress-updated',()=>{lastSignature='';setTimeout(scan,150)});
window.addEventListener('pageshow',scan);
scan();