const style=document.createElement('style');
style.id='mayfit-reference-responsive-fix';
style.textContent=`
.mayfit-reference-hero{box-sizing:border-box!important;min-width:0!important}
.mayfit-reference-hero h1,
.mayfit-reference-hero .mayfit-workout-name{
  width:min(100%,430px)!important;
  max-width:68%!important;
  min-width:0!important;
  display:flex!important;
  flex-wrap:wrap!important;
  align-items:flex-start!important;
  gap:4px 8px!important;
  overflow:visible!important;
  white-space:normal!important;
  word-break:break-word!important;
  overflow-wrap:anywhere!important;
  background:transparent!important;
  box-shadow:none!important;
}
.mayfit-reference-hero .mayfit-workout-name>span{
  flex:0 0 100%!important;
  display:block!important;
  color:var(--mayfit-green)!important;
  font-size:clamp(17px,3.8vw,24px)!important;
  line-height:1.15!important;
  background:transparent!important;
}
.mayfit-reference-hero .mayfit-workout-name input{
  display:block!important;
  width:100%!important;
  min-width:0!important;
  max-width:100%!important;
  flex:1 1 100%!important;
  margin:0!important;
  padding:2px 0 8px!important;
  border:0!important;
  border-bottom:3px solid var(--mayfit-green)!important;
  border-radius:0!important;
  background:transparent!important;
  color:#fff!important;
  box-shadow:none!important;
  outline:none!important;
  font:950 clamp(27px,7.2vw,50px)/1.05 system-ui,-apple-system,sans-serif!important;
  letter-spacing:-1px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  appearance:none!important;
  -webkit-appearance:none!important;
}
.mayfit-reference-hero .mayfit-workout-name input:focus{
  background:transparent!important;
  box-shadow:none!important;
}
@media(max-width:620px){
  .app>main.mayfit-reference-home{padding-left:14px!important;padding-right:14px!important}
  .mayfit-reference-hero{min-height:390px!important;padding:28px 18px 22px!important;background-position:62% center!important}
  .mayfit-reference-hero h1,
  .mayfit-reference-hero .mayfit-workout-name{max-width:72%!important;width:72%!important;margin:14px 0 20px!important}
  .mayfit-reference-hero .mayfit-workout-name input{font-size:clamp(25px,8.4vw,40px)!important;line-height:1.02!important}
  .mayfit-reference-hero button.primary{min-height:64px!important;font-size:21px!important}
}
@media(max-width:390px){
  .mayfit-reference-hero{padding-left:16px!important;padding-right:16px!important;background-position:68% center!important}
  .mayfit-reference-hero h1,
  .mayfit-reference-hero .mayfit-workout-name{max-width:76%!important;width:76%!important}
  .mayfit-reference-hero .mayfit-workout-name input{font-size:clamp(23px,8.8vw,34px)!important}
}
@media(max-width:340px){
  .mayfit-reference-hero h1,
  .mayfit-reference-hero .mayfit-workout-name{max-width:82%!important;width:82%!important}
  .mayfit-reference-hero .mayfit-workout-name input{font-size:29px!important}
}
`;
document.head.appendChild(style);
