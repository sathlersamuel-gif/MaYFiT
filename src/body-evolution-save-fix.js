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
    const maxSide=1100;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.76));
    return blob?new File([blob],`foto-evolucao-${Date.now()}.jpg`,{type:'image/jpeg',lastModified:Date.now()}):file;
  }catch{return file}
}

async function uploadWithRetry(file,uid,kind){
  const prepared=await compressImage(file);
  const path=`${uid}/${Date.now()}-${kind}-${Math.random().toString(36).slice(2,8)}.jpg`;
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    const {error}=await supabase.storage.from('body-progress').upload(path,prepared,{upsert:false,contentType:prepared.type||'image/jpeg',cacheControl:'31536000'});
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

async function uploadAndAttachPhotos(files,userId,recordId,message){
  if(!files.length)return {};
  setMessage(message,'Enviando fotos...');
  const uploaded={};
  const pathsToRemove=[];
  try{
    for(const item of files){
      const path=await uploadWithRetry(item.file,userId,item.kind);
      uploaded[item.column]=path;
      pathsToRemove.push(path);
    }
    const {error}=await supabase
      .from('body_progress')
      .update(uploaded)
      .eq('id',recordId)
      .eq('user_id',userId);
    if(error)throw error;
    return uploaded;
  }catch(error){
    if(pathsToRemove.length)await supabase.storage.from('body-progress').remove(pathsToRemove);
    throw error;
  }
}

function resetPhotoHolders(form){
  form.querySelectorAll('.be-photo').forEach(holder=>{
    const input=holder.querySelector('input[type="file"]');
    const preview=holder.querySelector('[data-photo-preview="true"]');
    preview?.remove();
    holder.querySelectorAll('span').forEach(span=>span.remove());
    const label=document.createElement('span');
    label.textContent='Adicionar foto';
    holder.prepend(label);
    if(input){
      input.value='';
      input.style.cssText='';
      holder.appendChild(input);
    }
  });
}

async function handleSave(form){
  if(form.dataset.fastSaving==='true')return;
  form.dataset.fastSaving='true';
  const user=currentUser();
  const button=form.querySelector('button[type="submit"]');
  const message=form.querySelector('.be-msg');
  const original=button?.textContent||'Salvar avaliação';
  try{
    if(!user?.id)throw new Error('Sessão do aluno não encontrada. Saia e entre novamente.');
    const photos=selectedPhotos(form);
    const fd=new FormData(form);
    const row={user_id:user.id,measured_at:fd.get('measured_at'),notes:fd.get('notes')||null,photo_front:null,photo_side:null,photo_back:null};
    for(const field of BODY_FIELDS)row[field]=numeric(fd.get(field));

    if(button){button.disabled=true;button.textContent='Salvando...'}
    setMessage(message,'Salvando avaliação...');
    const {data,error}=await supabase.from('body_progress').insert(row).select('id').single();
    if(error)throw error;

    try{
      await uploadAndAttachPhotos(photos,user.id,data.id,message);
    }catch(photoError){
      await supabase.from('body_progress').delete().eq('id',data.id).eq('user_id',user.id);
      throw new Error(`As fotos não foram salvas: ${photoError.message||'falha no envio'}`);
    }

    setMessage(message,photos.length?'Avaliação e fotos salvas com sucesso.':'Avaliação salva com sucesso.','success');
    if(button){button.textContent='✓ Salvo';button.style.background='#8df20b'}

    document.dispatchEvent(new CustomEvent('mayfit:evolution-saved',{detail:{recordId:data.id,userId:user.id,hasPhotos:photos.length>0}}));
    window.dispatchEvent(new Event('mayfit-body-progress-updated'));

    await wait(900);
    form.reset();
    resetPhotoHolders(form);
  }catch(error){
    setMessage(message,`Não foi possível salvar: ${error.message||'erro desconhecido'}`,'error');
  }finally{
    if(button){button.disabled=false;button.textContent=original;button.style.background=''}
    delete form.dataset.fastSaving;
  }
}

function installFastForm(form){
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

async function addDeleteButtons(modal){
  const user=currentUser();
  if(user?.role!=='student'||!user.id||modal.dataset.photoDeleteReady==='true')return;
  const entries=[...modal.querySelectorAll('.be-entry')];
  if(!entries.length)return;
  const {data}=await supabase.from('body_progress').select('id,photo_front,photo_side,photo_back').eq('user_id',user.id).order('measured_at',{ascending:false}).order('created_at',{ascending:false});
  if(!data?.length)return;
  modal.dataset.photoDeleteReady='true';
  entries.forEach((entry,index)=>{
    const record=data[index];if(!record)return;
    const images=[...entry.querySelectorAll('.be-gallery img')];
    const paths=[record.photo_front,record.photo_side,record.photo_back].filter(Boolean);
    images.forEach((img,imageIndex)=>{
      const path=paths[imageIndex];if(!path)return;
      img.loading='lazy';img.decoding='async';
      const wrap=document.createElement('div');wrap.style.cssText='position:relative;min-width:0';
      img.parentNode.insertBefore(wrap,img);wrap.appendChild(img);
      const remove=document.createElement('button');remove.type='button';remove.textContent='Excluir foto';remove.style.cssText='width:100%;margin-top:5px;padding:8px;background:#3a1b1b;color:#ffb6b6;border:1px solid #693232;border-radius:9px;font-weight:850';
      remove.onclick=async()=>{
        if(!confirm('Excluir esta foto da evolução?'))return;
        remove.disabled=true;remove.textContent='Excluindo...';
        const column=Object.entries(record).find(([,value])=>value===path)?.[0];
        const storageResult=await supabase.storage.from('body-progress').remove([path]);
        if(storageResult.error){alert('Não foi possível excluir a foto: '+storageResult.error.message);remove.disabled=false;remove.textContent='Excluir foto';return}
        if(column)await supabase.from('body_progress').update({[column]:null}).eq('id',record.id).eq('user_id',user.id);
        wrap.remove();
        document.dispatchEvent(new CustomEvent('mayfit:evolution-saved'));
      };
      wrap.appendChild(remove);
    });
  });
}

function scan(){
  document.querySelectorAll('.be-modal form').forEach(installFastForm);
  document.querySelectorAll('.be-modal').forEach(modal=>addDeleteButtons(modal));
}

const observer=new MutationObserver(()=>requestAnimationFrame(scan));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('mayfit:evolution-saved',()=>setTimeout(()=>{
  document.querySelectorAll('.be-modal').forEach(modal=>delete modal.dataset.photoDeleteReady);
  scan();
},300));
scan();
