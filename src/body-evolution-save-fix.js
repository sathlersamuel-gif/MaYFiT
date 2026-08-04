import { supabase } from './lib/supabase.js';

const BODY_FIELDS=[
  'weight_kg','height_cm','body_fat_pct','muscle_mass_kg','visceral_fat','metabolic_age',
  'neck_cm','shoulders_cm','chest_cm','waist_cm','abdomen_cm','hips_cm',
  'arm_left_cm','arm_right_cm','thigh_left_cm','thigh_right_cm','calf_left_cm','calf_right_cm'
];
const PHOTO_FIELDS=[['front','photo_front'],['side','photo_side'],['back','photo_back']];

function currentUser(){try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}}
function numeric(value){return value===''||value==null?null:Number(value)}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function setMessage(element,text,type='normal'){
  if(!element)return;
  element.textContent=text;
  element.style.color=type==='success'?'#8df20b':type==='error'?'#ff9d9d':'#a9b8af';
  element.style.fontWeight=type==='success'?'900':'700';
}

async function compressImage(file){
  if(!file||!file.type?.startsWith('image/'))return file;
  try{
    const bitmap=await createImageBitmap(file);
    const maxSide=1200;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.78));
    return blob?new File([blob],`foto-evolucao-${Date.now()}.jpg`,{type:'image/jpeg',lastModified:Date.now()}):file;
  }catch{return file}
}

async function uploadPhoto(file,userId,kind){
  const prepared=await compressImage(file);
  const path=`${userId}/${Date.now()}-${kind}-${Math.random().toString(36).slice(2,8)}.jpg`;
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    const {error}=await supabase.storage.from('body-progress').upload(path,prepared,{
      upsert:false,
      contentType:prepared.type||'image/jpeg',
      cacheControl:'31536000'
    });
    if(!error)return path;
    lastError=error;
    if(attempt<3)await wait(500*attempt);
  }
  throw lastError||new Error(`Falha ao enviar a foto ${kind}.`);
}

function selectedPhotos(form){
  return PHOTO_FIELDS.map(([kind,column])=>({
    kind,column,file:form.querySelector(`[data-photo="${kind}"]`)?.files?.[0]||null
  })).filter(item=>item.file);
}

function resetPhotoInputs(form){
  form.reset();
  form.querySelectorAll('.be-photo').forEach(holder=>{
    const input=holder.querySelector('input[type="file"]');
    holder.querySelectorAll('img').forEach(img=>img.remove());
    holder.querySelectorAll('span').forEach(span=>span.remove());
    const label=document.createElement('span');
    label.textContent='Adicionar foto';
    holder.prepend(label);
    if(input){input.value='';holder.appendChild(input)}
  });
}

async function handleSave(form){
  if(form.dataset.fastSaving==='true')return;
  form.dataset.fastSaving='true';
  const user=currentUser();
  const button=form.querySelector('button[type="submit"]');
  const message=form.querySelector('.be-msg');
  const original=button?.textContent||'Salvar avaliação';
  let createdId=null;

  try{
    if(!user?.id)throw new Error('Sessão do aluno não encontrada. Saia e entre novamente.');

    const {data:sessionData}=await supabase.auth.getSession();
    if(!sessionData?.session?.user)throw new Error('Sua sessão expirou. Saia e entre novamente.');

    const photos=selectedPhotos(form);
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

    if(button){button.disabled=true;button.textContent='Salvando...'}
    setMessage(message,'Salvando avaliação...');

    const {data,error}=await supabase.from('body_progress').insert(row).select('id').single();
    if(error)throw error;
    createdId=data.id;

    if(photos.length){
      setMessage(message,'Enviando fotos...');
      const updates={};
      const uploadedPaths=[];
      try{
        for(const photo of photos){
          const path=await uploadPhoto(photo.file,user.id,photo.kind);
          updates[photo.column]=path;
          uploadedPaths.push(path);
        }
        const {error:updateError}=await supabase.from('body_progress')
          .update(updates)
          .eq('id',createdId)
          .eq('user_id',user.id);
        if(updateError)throw updateError;
      }catch(photoError){
        if(uploadedPaths.length)await supabase.storage.from('body-progress').remove(uploadedPaths);
        await supabase.from('body_progress').delete().eq('id',createdId).eq('user_id',user.id);
        throw new Error(`As fotos não foram salvas: ${photoError.message||'erro no envio'}`);
      }
    }

    setMessage(message,photos.length?'Avaliação e fotos salvas com sucesso.':'Avaliação salva com sucesso.','success');
    if(button){button.textContent='✓ Salvo';button.style.background='#8df20b'}

    document.dispatchEvent(new CustomEvent('mayfit:evolution-saved',{detail:{recordId:createdId,userId:user.id}}));
    window.dispatchEvent(new Event('mayfit-body-progress-updated'));

    await wait(900);
    resetPhotoInputs(form);
    location.reload();
  }catch(error){
    setMessage(message,`Não foi possível salvar: ${error.message||'erro desconhecido'}`,'error');
  }finally{
    if(button){button.disabled=false;button.textContent=original;button.style.background=''}
    delete form.dataset.fastSaving;
  }
}

function installForm(form){
  if(form.dataset.fastSaveInstalled==='true')return;
  form.dataset.fastSaveInstalled='true';
  form.onsubmit=null;
  form.addEventListener('submit',event=>{
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handleSave(form);
  },true);
}

function scan(){document.querySelectorAll('.be-modal form').forEach(installForm)}
const observer=new MutationObserver(()=>requestAnimationFrame(scan));
observer.observe(document.documentElement,{childList:true,subtree:true});
scan();
