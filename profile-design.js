/* Actual uploaded profile artwork with original live app controls. */
(function(){
function init(){
 const home=document.getElementById('dtConceptHome');
 if(!home||document.getElementById('dtImageDesignedHome'))return;
 const image=new Image();
 image.onload=()=>{
  const section=document.createElement('section');section.id='dtImageDesignedHome';section.setAttribute('aria-label','Daily Tails dog profile dashboard');
  section.innerHTML='<div class="dt-design-top"><button id="dtDesignPortrait" type="button" class="dt-design-art" aria-label="Open dog profile"><img src="./daily-tails-profile-art.webp" alt="Leather Daily Tails logo, dog portrait, blank bone tag and blue pawprints"></button><div id="dtDesignPost"></div></div><div id="dtDesignNext"></div><div id="dtDesignActions"></div><div id="dtDesignSecondary"></div>';
  home.before(section);
  const recent=document.getElementById('dtRefRecent'),next=home.querySelector('.dt-concept-next'),actions=home.querySelector('.dt-quick-panel'),extras=home.querySelector('.dt-concept-extras');
  if(recent)section.querySelector('#dtDesignPost').appendChild(recent);
  if(next)section.querySelector('#dtDesignNext').appendChild(next);
  if(actions)section.querySelector('#dtDesignActions').appendChild(actions);
  if(extras)section.querySelector('#dtDesignSecondary').appendChild(extras);
  document.getElementById('dtDesignPortrait').onclick=()=>document.getElementById('portraitBtn')?.click();
  const style=document.createElement('style');style.id='dtImageDesignedStyle';
  style.textContent=[
   'body:not(.dt-locked):not(.friend-view) #dtConceptHome{display:none!important}',
   '#dtImageDesignedHome{display:none}',
   'body:not(.dt-locked):not(.friend-view) #dtImageDesignedHome{display:block!important;margin:12px 14px 4px;padding:15px 12px;background:#b98459;position:relative;border:3px solid #4d2e21;border-radius:23px;box-shadow:0 4px 0 #8199a9,0 6px 13px #263c492c;color:#31495b}',
   '#dtImageDesignedHome:before{content:"";position:absolute;inset:9px;border:2px dashed #e5bf99;border-radius:16px;pointer-events:none}',
   '#dtImageDesignedHome .dt-design-top{display:grid;grid-template-columns:42% 1fr;gap:11px;align-items:center;position:relative}',
   '#dtImageDesignedHome .dt-design-art{padding:0;margin:0;border:0;background:transparent;display:block;width:100%;cursor:pointer;aspect-ratio:450/620}',
   '#dtImageDesignedHome .dt-design-art img{width:100%;height:100%;object-fit:contain;display:block}',
   '#dtImageDesignedHome #dtDesignPost{min-width:0}',
   '#dtImageDesignedHome .dt-ref-memory{display:flex!important;flex-direction:column!important;width:100%!important;min-height:109px!important;border:2px solid #e2cbb0!important;background:#fff9f1!important;border-radius:17px!important;padding:14px 10px 12px!important;box-shadow:0 2px 5px #3c281f47!important}',
   '#dtImageDesignedHome .dt-ref-memory-label{margin:-26px 0 8px -2px!important;padding:5px 10px!important;background:#365f79!important;color:#fff!important;border-radius:999px!important;font-size:11px!important}',
   '#dtImageDesignedHome .dt-ref-memory-title{font:700 clamp(15px,3.5vw,21px)/1.16 Georgia,serif!important;white-space:normal!important;display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden!important}',
   '#dtImageDesignedHome .dt-ref-memory-thumb{width:39px!important;height:39px!important;flex-basis:39px!important}',
   '#dtImageDesignedHome #dtDesignNext,#dtImageDesignedHome #dtDesignActions{margin-top:11px;position:relative}',
   '#dtImageDesignedHome .dt-concept-next,#dtImageDesignedHome .dt-quick-panel{margin:0!important;background:#fff9f0!important;border:2px solid #e5cfb8!important;border-radius:18px!important;padding:13px!important;box-shadow:0 2px 5px #3c281f20!important}',
   '#dtImageDesignedHome .dt-concept-head h3,#dtImageDesignedHome .dt-quick-title{font:700 23px Georgia,serif!important;color:#62402c!important}',
   '#dtImageDesignedHome .dt-concept-task{margin-top:9px!important}',
   '#dtImageDesignedHome .dt-concept-actions{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important;margin:0!important}',
   '#dtImageDesignedHome .dt-concept-actions button{min-height:70px!important;border-radius:12px!important;font-size:11px!important;padding:7px 2px!important}',
   '#dtImageDesignedHome #dtDesignSecondary{position:relative}',
   '#dtImageDesignedHome #dtDesignSecondary .dt-concept-extras{display:flex!important;justify-content:center!important;margin:12px 0 0!important}',
   '#dtImageDesignedHome button:focus-visible{outline:3px solid #1b4e6c!important;outline-offset:3px}',
   'body.friend-view #dtImageDesignedHome,body.dt-locked #dtImageDesignedHome{display:none!important}',
   '@media(max-width:480px){body:not(.dt-locked):not(.friend-view) #dtImageDesignedHome{margin:10px 12px 4px;padding:12px 10px}#dtImageDesignedHome .dt-design-top{display:flex;flex-direction:column;gap:12px}#dtImageDesignedHome .dt-design-art{width:min(68%,240px)}#dtImageDesignedHome #dtDesignPost{width:100%;padding:0 5px}#dtImageDesignedHome .dt-ref-memory{min-height:86px!important}#dtImageDesignedHome .dt-concept-actions button{min-height:63px!important;font-size:10px!important}#dtImageDesignedHome .dt-concept-next,#dtImageDesignedHome .dt-quick-panel{padding:12px!important}}'
  ].join('\n');
  document.head.appendChild(style);
 };
 image.onerror=()=>console.warn('Daily Tails profile art file not available; existing header retained.');
 image.src='./daily-tails-profile-art.webp';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();