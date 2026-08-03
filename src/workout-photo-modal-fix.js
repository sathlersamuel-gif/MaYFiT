const style=document.createElement('style');
style.id='mayfit-workout-photo-modal-style';
style.textContent=`
.exercise-modal{position:fixed!important;inset:0!important;z-index:300000!important;display:grid!important;place-items:center!important;padding:12px!important;background:rgba(0,0,0,.94)!important;overflow:auto!important;box-sizing:border-box!important}
.exercise-modal-card{position:relative!important;width:min(760px,100%)!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;padding:56px 12px 14px!important;border:1px solid #385442!important;border-radius:18px!important;background:#07100a!important;color:#fff!important;box-sizing:border-box!important}
.exercise-modal-card h2{margin:0 50px 12px 0!important;font-size:clamp(20px,5vw,30px)!important;line-height:1.1!important}
.exercise-modal-card .modal-close{position:absolute!important;top:10px!important;right:10px!important;z-index:5!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;margin:0!important;padding:0!important;border:1px solid #49664f!important;border-radius:13px!important;background:#17231b!important;color:#fff!important}
.exercise-modal-card .modal-close svg{width:24px!important;height:24px!important}
.exercise-modal-card .modal-pose-pair{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;overflow:hidden!important;border:1px solid #3b5142!important;border-radius:14px!important;background:#050706!important}
.exercise-modal-card .modal-pose-pair figure{position:relative!important;min-width:0!important;margin:0!important;overflow:hidden!important;background:#fff!important}
.exercise-modal-card .modal-pose-pair figure+figure{border-left:1px solid #3b5142!important}
.exercise-modal-card .modal-pose-pair b{position:absolute!important;inset:0 0 auto 0!important;z-index:2!important;display:grid!important;place-items:center!important;height:32px!important;background:#111512!important;color:#fff!important;font-size:11px!important;font-weight:950!important}
.exercise-modal-card .modal-pose-pair figure:first-child b{background:#83e400!important;color:#071108!important}
.exercise-modal-card .modal-pose-pair img{display:block!important;width:100%!important;height:min(58vh,520px)!important;min-height:220px!important;padding-top:32px!important;object-fit:contain!important;background:#fff!important;box-sizing:border-box!important}
.exercise-modal-card p{margin:12px 0 0!important;color:#c7d0ca!important;font-size:14px!important;line-height:1.4!important}
@media(max-width:620px){.exercise-modal{padding:8px!important}.exercise-modal-card{max-height:calc(100dvh - 16px)!important;padding:54px 8px 12px!important;border-radius:16px!important}.exercise-modal-card .modal-pose-pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.exercise-modal-card .modal-pose-pair img{height:min(55vh,430px)!important;min-height:180px!important}.exercise-modal-card p{font-size:13px!important}}
`;
document.head.appendChild(style);
