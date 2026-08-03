const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
.exercise-modal{
  position:fixed!important;
  inset:0!important;
  z-index:300000!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom))!important;
  background:rgba(0,0,0,.95)!important;
  overflow-y:auto!important;
  box-sizing:border-box!important;
}
.exercise-modal-card{
  position:relative!important;
  width:min(760px,100%)!important;
  max-height:calc(100dvh - 36px)!important;
  overflow-y:auto!important;
  padding:58px 16px 18px!important;
  border:1px solid #385442!important;
  border-radius:22px!important;
  background:#07100a!important;
  color:#fff!important;
  box-sizing:border-box!important;
  box-shadow:0 24px 70px rgba(0,0,0,.55)!important;
}
.exercise-modal-card h2{margin:0 0 14px!important;padding:0!important;font-size:clamp(22px,5vw,32px)!important;line-height:1.1!important;color:#fff!important}
.exercise-modal-card .modal-close{
  position:sticky!important;
  top:0!important;
  float:right!important;
  z-index:3!important;
  display:grid!important;
  place-items:center!important;
  width:42px!important;
  height:42px!important;
  margin:-46px 0 4px!important;
  padding:0!important;
  border:1px solid #49664f!important;
  border-radius:13px!important;
  background:#17231b!important;
  color:#fff!important;
}
.exercise-modal-card .modal-close svg{width:24px!important;height:24px!important}
.exercise-modal-card .modal-pose-pair{
  clear:both!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
  width:100%!important;
  overflow:hidden!important;
  border:1px solid #3b5142!important;
  border-radius:16px!important;
  background:#050706!important;
}
.exercise-modal-card .modal-pose-pair figure{position:relative!important;min-width:0!important;margin:0!important;overflow:hidden!important;background:#050706!important}
.exercise-modal-card .modal-pose-pair figure+figure{border-left:1px solid #3b5142!important}
.exercise-modal-card .modal-pose-pair b{
  position:absolute!important;
  top:0!important;
  left:0!important;
  right:0!important;
  z-index:2!important;
  display:grid!important;
  place-items:center!important;
  height:34px!important;
  background:#111512!important;
  color:#fff!important;
  font-size:12px!important;
  font-weight:950!important;
}
.exercise-modal-card .modal-pose-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.exercise-modal-card .modal-pose-pair img{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:280px!important;
  max-height:62vh!important;
  padding-top:34px!important;
  object-fit:contain!important;
  background:#fff!important;
  box-sizing:border-box!important;
}
.exercise-modal-card p{margin:14px 0 0!important;color:#c7d0ca!important;font-size:15px!important;line-height:1.45!important}
body:has(.exercise-modal){overflow:hidden!important}
@media(max-width:620px){
  .exercise-modal{padding:0!important;align-items:stretch!important}
  .exercise-modal-card{width:100%!important;min-height:100dvh!important;max-height:100dvh!important;border:0!important;border-radius:0!important;padding:calc(max(14px,env(safe-area-inset-top)) + 48px) 12px max(18px,env(safe-area-inset-bottom))!important}
  .exercise-modal-card .modal-close{top:max(8px,env(safe-area-inset-top))!important;margin-top:-46px!important}
  .exercise-modal-card .modal-pose-pair img{min-height:220px!important;max-height:52vh!important}
}
@media(max-width:390px){
  .exercise-modal-card .modal-pose-pair{grid-template-columns:1fr!important}
  .exercise-modal-card .modal-pose-pair figure+figure{border-left:0!important;border-top:1px solid #3b5142!important}
  .exercise-modal-card .modal-pose-pair img{min-height:200px!important;max-height:42vh!important}
}
`;
document.head.appendChild(style);
