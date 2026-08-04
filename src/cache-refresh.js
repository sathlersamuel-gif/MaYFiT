const VERSION='mayfit-cache-clean-20260804-1';
const KEY='mayfit_cache_cleanup_version';

(async()=>{
  try{
    if(localStorage.getItem(KEY)===VERSION)return;
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }
    if('serviceWorker' in navigator){
      const registrations=await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration=>registration.update().catch(()=>{})));
    }
    localStorage.setItem(KEY,VERSION);
  }catch(error){
    console.warn('Não foi possível limpar todos os caches antigos.',error);
  }
})();
