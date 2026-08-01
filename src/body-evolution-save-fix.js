import { supabase } from './lib/supabase.js';

const BODY_FIELDS=[
  'weight_kg','height_cm','body_fat_pct','muscle_mass_kg','visceral_fat','metabolic_age',
  'neck_cm','shoulders_cm','chest_cm','waist_cm','abdomen_cm','hips_cm',
  'arm_left_cm','arm_right_cm','thigh_left_cm','thigh_right_cm','calf_left_cm','calf_right_cm'
];

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}
}

function numeric(value){
  return value===''||value==null?null:Number(value);
}

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

async function compressImage(file){
  if(!file||!file.type?.startsWith('image/'))return file;
  try{
    const bitmap=await createImageBitmap(file);
    const maxSide=1600;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale));
    const height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d',{alpha:false});
    context.drawImage(bitmap,0,0,width,height);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.82));
    if(!blob)return file;
    return new File([blob],'foto-evolucao.jpg',{type:'image/jpeg',lastModified:Date.now()});
  }catch{
    return file;
  }
}

async function uploadWithRetry(file,uid,kind){
  if(!file)return null;
  const prepared=await compressImage(file);
  const extension=prepared.type==='image/jpeg'?'jpg':((prepared.name?.split('.').pop()||'jpg').toLowerCase());
  const path=`${uid}/${Date.now()}-${kind}.${extension}`;
  let lastError;
  for(let attempt=1;attempt<=2;attempt++){
    const {error}=await supabase.storage.from('body-progress').upload(path,prepared,{upsert:false,contentType:prepared.type||undefined});
    if(!error)return path;
    lastError=error;
    if(attempt<2)await wait(900);
  }
  throw lastError||new Error(`Falha ao enviar a foto ${kind}.`);
}

async function saveEvolution(form){
  const user=currentUser();
  if(!user?.id)throw new Error('Sessão do aluno não encontrada. Saia e entre novamente.');

  const {data:sessionData}=await supabase.auth.getSession();
  if(!sessionData.session?.user)throw new Error('Sua sessão expirou. Saia e entre novamente no aplicativo.');

  const fd=new FormData(form);
  const row={
    user_id:user.id,
    measured_at:fd.get('measured_at'),
    notes:fd.get('notes')||null,
    photo_front:null,
    photo_side:null,
    photo_back:null
  };
  for(const field of BODY_FIELDS)row[field]=numeric(fd.get(field));

  const {data:created,error:insertError}=await supabase
    .from('body_progress')
    .insert(row)
    .select('id')
    .single();
  if(insertError)throw insertError;

  const photoPaths={};
  const failed=[];
  for(const kind of ['front','side','back']){
    const file=form.querySelector(`[data-photo="${kind}"]`)?.files?.[0];
    if(!file)continue;
    try{photoPaths[`photo_${kind}`]=await uploadWithRetry(file,user.id,kind)}
    catch(error){failed.push(`${kind}: ${error.message||'falha no envio'}`)}
  }

  if(Object.keys(photoPaths).length){
    const {error:updateError}=await supabase.from('body_progress').update(photoPaths).eq('id',created.id);
    if(updateError)failed.push(`atualização das fotos: ${updateError.message}`);
  }

  return {failed};
}

document.addEventListener('submit',async event=>{
  const form=event.target.closest?.('.be-modal form');
  if(!form||form.dataset.mayfitSafeSave==='running')return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  form.dataset.mayfitSafeSave='running';
  const button=form.querySelector('button[type="submit"]');
  const message=form.querySelector('.be-msg');
  const original=button?.textContent||'Salvar avaliação';
  if(button){button.disabled=true;button.textContent='Salvando...'}
  if(message)message.textContent='Salvando medidas e preparando fotos...';
  try{
    const result=await saveEvolution(form);
    if(message)message.textContent=result.failed.length
      ?'Medidas salvas. Algumas fotos não foram enviadas; tente adicioná-las novamente.'
      :'Avaliação e fotos salvas com sucesso.';
    form.reset();
    setTimeout(()=>location.reload(),1200);
  }catch(error){
    if(message)message.textContent=`Não foi possível salvar: ${error.message||'erro desconhecido'}`;
  }finally{
    delete form.dataset.mayfitSafeSave;
    if(button){button.disabled=false;button.textContent=original}
  }
},true);
