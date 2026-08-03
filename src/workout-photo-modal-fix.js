const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
.exercise-modal{
  position:fixed!important;
  inset:0!important;
  z-index:300000!important;
  display:grid!important;
  place-items:center!important;
  padding:10px!important;
  background:rgba(0,0,0,.96)!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
.exercise-modal-card{
  position:relative!important;
  display:grid!important;
  grid-template-rows:auto minmax(0,1fr) auto!important;
  width:min(760px,100%)!important;
  height:min(760px,calc(100dvh - 20px))!important;
  max-height:calc(100dvh - 20px)!important;
  overflow:hidden!important;
  padding:14px!important;
  border:1px solid #385442!important;
  border-radius:18px!important;
  background:#07100a!important;
  color:#fff!important;
  box-sizing:border-box!important;
}
.exercise-modal-card h2{
  min-width:0!important;
  margin:0 52px 10px 0!important;
  font-size:clamp(18px,4.5vw,28px)!important;
  line-height:1.1!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.exercise-modal-card .modal-close{
  position:absolute!important;
  top:10px!important;
  right:10px!important;
  z-index:5!important;
  display:grid!important;
  place-items:center!important;
  width:42px!important;
  height:42px!important;
  margin:0!important;
  padding:0!important;
  border:1px solid #49664f!important;
  border-radius:13px!important;
  background:#17231b!important;
  color:#fff!important;
}
.exercise-modal-card .modal-close svg{width:24px!important;height:24px!important}
.exercise-modal-card .modal-pose-pair{
  min-height:0!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
  width:100%!important;
  height:100%!important;
  overflow:hidden!important;
  border:1px solid #3b5142!important;
  border-radius:14px!important;
  background:#050706!important;
}
.exercise-modal-card .modal-pose-pair figure{
  position:relative!important;
  min-width:0!important;
  min-height:0!important;
  margin:0!important;
  overflow:hidden!important;
  background:#fff!important;
}
.exercise-modal-card .modal-pose-pair figure+figure{border-left:1px solid #3b5142!important}
.exercise-modal-card .modal-pose-pair b{
  position:absolute!important;
  inset:0 0 auto 0!important;
  z-index:2!important;
  display:grid!important;
  place-items:center!important;
  height:30px!important;
  background:#111512!important;
  color:#fff!important;
  font-size:11px!important;
  font-weight:950!important;
}
.exercise-modal-card .modal-pose-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.exercise-modal-card .modal-pose-pair img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  min-width:0!important;
  min-height:0!important;
  padding-top:30px!important;
  object-fit:contain!important;
  object-position:center!important;
  background:#fff!important;
  box-sizing:border-box!important;
}
.exercise-modal-card p{
  max-height:42px!important;
  margin:8px 0 0!important;
  overflow:hidden!important;
  color:#c7d0ca!important;
  font-size:13px!important;
  line-height:1.3!important;
}
body:has(.exercise-modal){overflow:hidden!important}
@media(max-width:620px){
  .exercise-modal{padding:0!important}
  .exercise-modal-card{
    width:100%!important;
    height:100dvh!important;
    max-height:100dvh!important;
    padding:max(10px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom))!important;
    border:0!important;
    border-radius:0!important;
    grid-template-rows:auto minmax(0,1fr)!important;
  }
  .exercise-modal-card h2{margin:2px 50px 8px 2px!important;font-size:20px!important}
  .exercise-modal-card .modal-close{top:max(8px,env(safe-area-inset-top))!important;right:8px!important}
  .exercise-modal-card .modal-pose-pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;height:100%!important}
  .exercise-modal-card p{display:none!important}
}
`;
document.head.appendChild(style);
