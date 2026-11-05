/* Daily Tail: single mobile navigation and consolidated utilities.\n * Nov 4: compact redundant owner actions; keep them in More; safe bottom spacing.
 * Does not modify saved profile data or intercept authentication. */
(function(){
 const $=id=>document.getElementById(id);
 const css=document.createElement('style');
 css.textContent=[
 '#dtBottomNav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,590px);z-index:17990;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:#fffaf1;border:2px solid #aabecd;border-bottom:0;border-radius:20px 20px 0 0;box-shadow:0 -5px 18px #1f364322;padding:7px 7px max(8px,env(safe-area-inset-bottom))}',
 '#dtBottomNav button{display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;border:0;background:transparent;color:#405b70;font:700 11px/1.2 Arial,sans-serif;padding:8px 2px;border-radius:12px;min-height:50px;cursor:pointer}',
 '#dtBottomNav button[aria-current=page]{background:#365c76;color:#fff}',
 '#dtBottomNav .dt-nav-icon{font-size:21px;line-height:1}',
 'body:not(.dt-locked){padding-bottom:110px!important}',
 'body:not(.dt-locked) .shell{padding-bottom:105px!important}',
 'body:not(.dt-locked) .snapshot-wrap{scroll-margin-bottom:112px}',
 'body:has(#dtBottomNav):not(.dt-locked) #dtRoleStrip{padding:8px 14px!important;gap:0!important;min-height:36px}',
 'body:has(#dtBottomNav):not(.dt-locked) #dtRoleStrip>div{display:none!important}',
 'body:has(#dtBottomNav):not(.dt-locked) #dtRoleLabel{font-size:12px!important;line-height:1.35}',
 '#dtBottomNav button{touch-action:manipulation}',
 'body.friend-view #dtBottomNav [data-dt-tab=plan],body.friend-view #dtBottomNav [data-dt-tab=more]{display:none!important}',
 'body.friend-view #dtBottomNav{grid-template-columns:repeat(2,minmax(0,1fr))}',
 'body.friend-view #dtBottomNav button{min-height:54px}',
 '#dtBottomNav button:focus-visible,.dt-nav-menu button:focus-visible{outline:3px solid #b6784a;outline-offset:2px}',
 'body.dt-locked #dtBottomNav,body.dt-locked #dtNavSheet{display:none!important}',
 'body:has(#dtBottomNav) #cloudLaunch,body:has(#dtBottomNav) #shareLaunch,body:has(#dtBottomNav) #findLaunch{display:none!important}',
 '#dtNavSheet[hidden]{display:none!important}',
 '#dtNavSheet{position:fixed;inset:0;z-index:22003;display:flex;align-items:flex-end;justify-content:center;background:#142c3b99;padding:0 0 env(safe-area-inset-bottom);box-sizing:border-box}',
 '.dt-nav-menu{width:min(100%,590px);max-height:86vh;overflow:auto;padding:18px 16px 25px;background:#fff9ef;border:2px solid #b1c7d4;border-radius:24px 24px 0 0;box-shadow:0 -4px 25px #0003;font-family:Arial,sans-serif;color:#31485a}',
 '.dt-nav-menu-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}.dt-nav-menu h2{font:700 25px Georgia,serif;color:#754d35;margin:0}',
 '.dt-nav-menu button.dt-nav-action{display:flex;width:100%;align-items:center;justify-content:space-between;margin:6px 0;padding:13px 14px;border:1px solid #b2c7d3;border-radius:13px;background:#e6eff4;color:#304f62;text-align:left;font:700 14px Arial,sans-serif;cursor:pointer}',
 '.dt-nav-menu button.dt-nav-action:disabled{opacity:.45}',
 '.dt-nav-menu #dtNavClose{border:0;background:transparent;font-size:28px;cursor:pointer}',
 '.dt-nav-menu small{display:block;color:#587083;line-height:1.5;margin:12px 2px}',
 "@media(max-width:590px){#viewSwitch{padding:8px 11px!important}#viewSwitch .view-switch-actions button{min-height:40px;padding:7px 9px!important}#dtRoleStrip{background:#e1ebf0!important}body:not(.friend-view) .snapshot-wrap{position:relative;z-index:4;margin-top:-28px!important;padding-top:0!important}}",
 "@media(max-width:590px){body:not(.friend-view) .art .art-details.up-next-card{top:71.8%!important;height:11.7%!important;left:20%!important;width:60%!important;background:rgba(250,244,234,.90)!important;border:1px solid #ac8c70!important;border-radius:14px!important;box-shadow:0 3px 8px #3d2a1f30!important;padding:6px!important;box-sizing:border-box!important;text-shadow:none!important}}",
 "@media(max-width:590px){body:not(.friend-view) .art .up-next-card .next-activity{font-size:clamp(14px,3.6vw,21px)!important;color:#34271f!important}body:not(.friend-view) .art .art-nav{top:84.7%!important;height:3.2%!important;left:17%!important;width:66%!important}body:not(.friend-view) .art .art-nav-btn{border-radius:12px!important;background:#d9e7ee!important;color:#274459!important}body:not(.friend-view) .art .art-nav-btn:first-child{background:#365c76!important;color:white!important}}",
 '@media(min-width:700px){#dtBottomNav{border-radius:20px;margin-bottom:10px;border-bottom:2px solid #aabecd}}'
 ].join('\n');document.head.appendChild(css);
 function init(){
  if($('dtBottomNav'))return;
  const nav=document.createElement('nav');nav.id='dtBottomNav';nav.setAttribute('aria-label','Daily Tail main navigation');
  nav.innerHTML='<button type="button" data-dt-tab="home" aria-current="page"><span class="dt-nav-icon">⌂</span>Home</button>'+
   '<button type="button" data-dt-tab="plan"><span class="dt-nav-icon">▣</span>Daily Plan</button>'+
   '<button type="button" data-dt-tab="friends"><span class="dt-nav-icon">🐾</span>Friends</button>'+
   '<button type="button" data-dt-tab="more"><span class="dt-nav-icon">☰</span>More</button>';
  document.body.appendChild(nav);
  const shade=document.createElement('div');shade.id='dtNavSheet';shade.hidden=true;
  shade.innerHTML='<section class="dt-nav-menu" role="dialog" aria-modal="true" aria-label="More Daily Tail options">'+
   '<div class="dt-nav-menu-top"><h2>More options</h2><button id="dtNavClose" type="button" aria-label="Close menu">×</button></div>'+
   '<button class="dt-nav-action" id="dtNavShare" type="button">Share & invitations <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavFind" type="button">Find Dog Friends <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavCloud" type="button">Cloud Sync & account <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavSettings" type="button">Appearance settings <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavAccess" type="button">Access & approvals <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavBackup" type="button">Back up my data <span>›</span></button>'+
   '<button class="dt-nav-action" id="dtNavSignOut" type="button">Sign out <span>›</span></button>'+
   '<small>Private settings are available only to authorized owners. Friend View remains read-only.</small></section>';
  document.body.appendChild(shade);
  const close=()=>{shade.hidden=true;nav.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));nav.querySelector('[data-dt-tab=home]').setAttribute('aria-current','page')};
  const open=()=>{shade.hidden=false;const owner=window.dtRole==='adult',friend=window.dtRole==='friend';$('dtNavShare').hidden=friend;$('dtNavSettings').hidden=friend;$('dtNavAccess').hidden=friend;$('dtNavBackup').hidden=!owner;$('dtNavSignOut').hidden=friend||!$('dtRoleSignOut');};
  const fire=id=>{close();const btn=$(id);if(btn)btn.click();else alert('This feature is still loading. Please wait a moment and try again.')};
  $('dtNavClose').onclick=close;shade.addEventListener('click',e=>{if(e.target===shade)close()});
  const links={dtNavShare:'shareLaunch',dtNavFind:'dtFindDogFriends',dtNavCloud:'cloudLaunch',dtNavSettings:'themeSettingsBtn',dtNavAccess:'dtRoleManage',dtNavBackup:'dtBackupBtn',dtNavSignOut:'dtRoleSignOut'};
  for(const [id,target] of Object.entries(links))$(id).onclick=()=>fire(target);
  nav.addEventListener('click',e=>{
   const btn=e.target.closest('[data-dt-tab]');if(!btn)return;
   const tab=btn.dataset.dtTab;
   if(document.body.classList.contains('friend-view')&&(tab==='more'||tab==='plan'))return;
   if(tab==='more'){open();return}
   nav.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));btn.setAttribute('aria-current','page');
   if(tab==='home'){window.scrollTo({top:0,behavior:'smooth'});return}
   if(tab==='plan'){const plan=$('scheduleArt');if(plan)plan.click();return}
   if(tab==='friends'){const section=document.querySelector('.dog-friends-section');if(section)section.scrollIntoView({behavior:'smooth',block:'start'});}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shade.hidden)close()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Home layout refresh: illustrated profile stays intact, with easy care actions
   and a compact friend-discovery section. Existing handlers and records are reused. */
(function(){
 function ready(){
  const $=id=>document.getElementById(id);
  const art=document.querySelector('.art'),snapshot=document.querySelector('.snapshot-wrap');
  const friends=document.querySelector('.dog-friends-section'),facts=$('dtFriendFacts');
  if(!art||!snapshot||!friends||$('dtHomeQuick'))return;
  const style=document.createElement('style');
  style.textContent=[
   'body:not(.dt-locked) .dt-home-quick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:6px 15px 0;position:relative;z-index:6}',
   '.dt-home-quick button{background:#fdf8ef;color:#30495c;border:1.5px solid #99afbd;border-radius:15px;min-height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 5px;font:700 13px Arial,sans-serif;box-shadow:0 3px 7px #273b4820;cursor:pointer}',
   '.dt-home-quick button:first-child{background:#365c76;color:#fff;border-color:#365c76}',
   '.dt-home-quick .dt-quick-symbol{font-size:25px;line-height:1}',
   '.dt-home-quick button:focus-visible{outline:3px solid #bc855c;outline-offset:2px}',
   'body.friend-view .dt-home-quick,body.dt-locked .dt-home-quick,body.friend-view .dt-home-secondary,body.dt-locked .dt-home-secondary{display:none!important}',
   '.dt-home-secondary{display:flex;justify-content:center;gap:8px;padding:9px 15px 0}',
   '.dt-home-secondary button{background:#e4edf2;border:1px solid #9caebb;border-radius:999px;color:#334f60;font:700 12px Arial,sans-serif;padding:8px 16px;min-height:36px;cursor:pointer}',
   'body:not(.friend-view):not(.dt-locked) .art .art-nav{display:none!important}',
   'body:not(.friend-view):not(.dt-locked) .snapshot-wrap{margin-top:0!important;padding-top:8px!important}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-section{width:auto;margin:13px 15px 0!important;padding:14px!important;border-radius:18px;box-shadow:0 3px 9px #273b4820}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-heading{margin-bottom:7px}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-heading h2{font-size:23px}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-empty{min-height:0;padding:9px 11px;border-radius:12px}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-empty-icon{display:none}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-empty strong{font:700 13px Arial,sans-serif;margin:0 0 4px}',
   'body:not(.friend-view):not(.dt-locked) .dog-friends-empty p{font-size:12px;margin:0}',
   'body:not(.friend-view):not(.dt-locked) #dtOwnerFriendSearch{padding:0;margin:10px 0 0;background:transparent;border:0}',
   'body:not(.friend-view):not(.dt-locked) #dtFindDogFriends{width:100%;min-height:42px;border-radius:12px;background:#365c76;color:#fff;font-weight:700}',
   'body:not(.friend-view):not(.dt-locked) .snapshot-head{position:relative}',
   'body:not(.friend-view):not(.dt-locked) #themeSettingsBtn{display:none!important}',
   '#dtBottomNav [data-dt-tab=more] .dt-nav-icon{font-size:22px}',
   "body.friend-view .art .tag-overlay-front,body.friend-view .art .tag-zone{top:58.5%!important;left:34.5%!important;width:31%!important;height:12%!important}",
   "body.friend-view .art .tag-zone .tag-name{font-size:clamp(17px,4.2vw,27px)!important}",
   "body.friend-view .dt-friend-facts{position:relative!important;display:block!important;left:auto!important;top:auto!important;right:auto!important;width:calc(100% - 30px)!important;height:auto!important;max-height:none!important;overflow:visible!important;margin:12px 15px 0!important;padding:14px!important;background:#dce7ee!important;border:1.5px solid #9eb4c3!important;border-radius:18px!important;z-index:auto!important}",
   "body.friend-view .dt-friend-facts .dt-friend-facts-head{display:flex!important;margin-bottom:10px!important}",
   "body.friend-view .dt-friend-facts .dt-friend-fact-grid{display:grid!important;grid-template-columns:1fr 1.25fr!important;gap:8px!important}",
   "body.friend-view .dt-friend-facts .dt-friend-fact-grid>div{padding:9px!important;background:#fffaf3!important;border:1px solid #c7d2da!important;border-radius:11px!important}",
   "body.friend-view .dt-friend-facts .dt-facts-quote{margin:8px 0 0!important}",
   "body.friend-view .art .dt-meet-lou{position:absolute;display:flex;align-items:center;justify-content:center;top:74%;left:31%;width:38%;min-height:42px;border:1.5px solid #b7c6ce;border-radius:999px;background:#f8f1e6;color:#35536b;font:700 clamp(11px,2.9vw,14px) Arial,sans-serif;box-shadow:0 2px 7px #35271b35;z-index:12;cursor:pointer}",
   "body:not(.friend-view) .art .dt-meet-lou{display:none!important}",
   "body.friend-view .art .dt-meet-lou:focus-visible{outline:3px solid #365c76;outline-offset:3px}",
   "body.friend-view #dtRoleStrip{display:none!important}",
   "body.friend-view .dog-friends-section{margin-top:12px!important}",
   "@media(max-width:380px){body.friend-view .dt-friend-facts .dt-friend-fact-grid{grid-template-columns:1fr!important}}",
   '@media(min-width:591px){.dt-home-quick{max-width:550px;margin-left:auto!important;margin-right:auto!important}}',
   '@media(max-width:360px){.dt-home-quick{gap:6px!important;margin-left:10px!important;margin-right:10px!important}.dt-home-quick button{font-size:12px!important}}'
  ].join('\n');
  document.head.appendChild(style);
  const actions=document.createElement('div');actions.id='dtHomeQuick';actions.className='dt-home-quick';actions.setAttribute('aria-label','Quick actions');
  const links=[
   {label:'Log Care',icon:'🐾',target:'scheduleArt'},
   {label:'Daily Plan',icon:'▣',target:'scheduleArt'},
   {label:'Memories',icon:'♡',target:'recent'}
  ];
  links.forEach(item=>{
   const b=document.createElement('button');b.type='button';b.innerHTML='<span class="dt-quick-symbol" aria-hidden="true">'+item.icon+'</span><span>'+item.label+'</span>';
   b.addEventListener('click',()=>{const target=$(item.target);if(target)target.click();});
   actions.appendChild(b);
  });
  art.after(actions);
  const meet=document.createElement('button');meet.type='button';meet.className='dt-meet-lou';
  meet.textContent='Meet Lou ↓';meet.setAttribute('aria-label','Jump to Lou’s profile details');
  meet.addEventListener('click',()=>facts?.scrollIntoView({behavior:'smooth',block:'start'}));
  art.appendChild(meet);
  const extras=document.createElement('div');extras.className='dt-home-secondary';
  [['Training','trainingArt'],['Emergency Info','emergencyArt']].forEach(([label,target])=>{
   const b=document.createElement('button');b.type='button';b.textContent=label+' ›';
   b.addEventListener('click',()=>$(target)?.click());extras.appendChild(b);
  });
  actions.after(extras);
  // Move the original friends panel, not a copy, so profiles and request handlers stay connected.
  function positionFriends(){
   if(facts&&facts.parentNode===art)art.after(facts);
   if(document.body.classList.contains('friend-view')){
    if(facts&&facts.parentNode&&facts.nextElementSibling!==friends)facts.after(friends);
   }else{
    if(extras.nextElementSibling!==friends)extras.after(friends);
   }
  }
  positionFriends();
  const observer=new MutationObserver(positionFriends);
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  // Keep all owner utilities in the final tab while using the friendlier Profile label.
  const more=document.querySelector('#dtBottomNav [data-dt-tab=more]');
  if(more){more.innerHTML='<span class="dt-nav-icon" aria-hidden="true">☰</span>Profile';more.setAttribute('aria-label','Profile and settings');}
  const menu=document.querySelector('.dt-nav-menu h2');if(menu)menu.textContent='Profile & settings';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();


/* Compact home layout inspired by the approved concept. Private app state is untouched. */
(function(){
 function build(){
  const $=id=>document.getElementById(id);
  const shell=document.querySelector('main.shell'),art=document.querySelector('.art');
  if(!shell||!art||$('dtConceptHome'))return;
  const css=document.createElement('style');
  css.textContent=[
  'body:not(.dt-locked) .art{display:none!important}',
  'body:not(.friend-view):not(.dt-locked) #dtHomeQuick,body:not(.friend-view):not(.dt-locked) .dt-home-secondary{display:none!important}',
  'body:not(.dt-locked) #dtConceptHome{display:block!important}',
  '#dtConceptHome{display:none;margin:12px 14px 2px;font-family:Arial,sans-serif;color:#2c4659}',
  '.dt-concept-profile{position:relative;overflow:hidden;min-height:172px;display:flex;align-items:center;gap:16px;padding:18px 19px;background:#ae7249;border:3px solid #1f1a17;border-radius:24px;box-shadow:0 3px 0 #708ea2,0 6px 14px #21374425;color:#fff9f0}',
  '.dt-concept-profile:before{content:"";position:absolute;inset:8px;border:2px dotted #cbd9e2;border-radius:17px;opacity:.45;pointer-events:none}',
  '.dt-concept-profile-photo{width:118px;height:118px;flex:0 0 118px;object-fit:cover;border:4px solid #c7d7e1;border-radius:50%;background:#f1e4d2;box-shadow:0 3px 8px #39281c55}',
  '.dt-concept-profile-copy{flex:1;min-width:0;position:relative;z-index:1}',
  '.dt-concept-profile-copy h2{display:none!important}',
  '.dt-concept-profile-copy p{font:14px/1.4 Arial,sans-serif;margin:94px 0 12px;color:#fff8ed}',
  '.dt-concept-open{padding:8px 12px;background:#f8f0e4;color:#355570;border:1px solid #a7c4d5;border-radius:999px;font:700 12px Arial,sans-serif;cursor:pointer}',
  '.dt-concept-tag{position:absolute;right:18%;top:15px;width:126px;height:92px;object-fit:contain;pointer-events:none;opacity:1;filter:drop-shadow(0 2px 2px #38251a55)}',
  '.dt-concept-tag-label{position:absolute;right:calc(18% + 16px);top:56px;width:94px;text-align:center;font:700 clamp(17px,4.2vw,22px)/1 Georgia,serif;color:#5a5e62;transform:rotate(-12deg);text-shadow:0 1px #fff;pointer-events:none}',
  'body.friend-view #dtConceptHome .dt-concept-next,body.friend-view #dtConceptHome .dt-concept-actions,body.friend-view #dtConceptHome .dt-concept-extras{display:none!important}',
  'body.friend-view #dtConceptHome .dt-concept-profile{min-height:170px}',
  'body.friend-view .dt-friend-facts{margin:12px 15px 0!important}',
  '.dt-concept-next{margin-top:13px;padding:15px;background:#fffaf2;border:1.5px solid #a5bac9;border-radius:18px;box-shadow:0 3px 9px #25374819}',
  '.dt-concept-head{display:flex;align-items:center;justify-content:space-between;gap:8px}',
  '.dt-concept-head h3{font:700 24px Georgia,serif;margin:0;color:#62432e}',
  '.dt-concept-time{font:700 12px Arial,sans-serif;color:#5b7080}',
  '.dt-concept-task{display:flex;align-items:center;gap:13px;margin-top:12px}',
  '#dtConceptCheck{flex:0 0 28px;width:28px;height:28px;accent-color:#365c76;cursor:pointer}',
  '#dtConceptTask{flex:1;min-width:0;text-align:left;border:0;background:none;color:#293b48;font:700 18px/1.2 Georgia,serif;padding:6px 0;cursor:pointer}',
  '.dt-concept-chev{font-size:22px;color:#365c76}',
  '.dt-concept-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}',
  '.dt-concept-actions button{min-height:80px;padding:12px 6px;border:1.5px solid #9aafbc;border-radius:15px;background:#e1eaf0;color:#2c4c63;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;font:700 13px Arial,sans-serif;cursor:pointer}',
  '.dt-concept-actions button:first-child{background:#365c76;color:white;border-color:#365c76}',
  '.dt-concept-actions .dt-icon{font-size:24px;line-height:1}',
  '.dt-concept-extras{display:flex;gap:10px;justify-content:center;margin:11px 0 0}',
  '.dt-concept-extras button{min-height:36px;padding:8px 12px;border:1px solid #9bafba;border-radius:999px;background:#f5efe7;color:#3d5b70;font:700 12px Arial,sans-serif;cursor:pointer}',
  '#dtConceptHome button:focus-visible{outline:3px solid #264e6d;outline-offset:3px}',
  'body:not(.friend-view):not(.dt-locked) .dog-friends-section{margin-top:12px!important}',
  'body:not(.friend-view):not(.dt-locked) .snapshot-wrap{margin-top:5px!important}',
  '@media(max-width:390px){.dt-concept-profile{gap:11px;padding:14px}.dt-concept-profile-photo{width:100px;height:100px;flex-basis:100px}.dt-concept-profile-copy p{font-size:12px;margin-top:88px}.dt-concept-tag{right:13%;width:112px}.dt-concept-tag-label{right:calc(13% + 11px);width:90px}}'
  ].join('\n');document.head.appendChild(css);
  const home=document.createElement('section');home.id='dtConceptHome';home.setAttribute('aria-label','Daily Tail home dashboard');
  home.innerHTML='<div class="dt-concept-profile"><img id="dtConceptPhoto" class="dt-concept-profile-photo" alt="Lou profile photo"><div class="dt-concept-profile-copy"><h2 id="dtConceptName">Lou</h2><p>My profile · Recent memories</p><button type="button" id="dtConceptProfile" class="dt-concept-open">View profile ›</button></div><img id="dtConceptTag" class="dt-concept-tag" alt="" aria-hidden="true"><span id="dtConceptTagLabel" class="dt-concept-tag-label" aria-hidden="true">Lou</span></div><div class="dt-concept-next"><div class="dt-concept-head"><h3>Up Next</h3><span class="dt-concept-time" id="dtConceptTime">Loading plan…</span></div><div class="dt-concept-task"><input type="checkbox" id="dtConceptCheck" aria-label="Complete next care task"><button type="button" id="dtConceptTask">Check the daily plan</button><span class="dt-concept-chev" aria-hidden="true">›</span></div></div><div class="dt-concept-actions"><button type="button" id="dtConceptCare"><span class="dt-icon" aria-hidden="true">🐾</span>Log Care</button><button type="button" id="dtConceptPlan"><span class="dt-icon" aria-hidden="true">▣</span>Daily Plan</button><button type="button" id="dtConceptMemory"><span class="dt-icon" aria-hidden="true">♡</span>Memory</button></div><div class="dt-concept-extras"><button type="button" id="dtConceptTraining">Training ›</button><button type="button" id="dtConceptEmergency">Emergency Info ›</button></div>';
  art.before(home);
  const action=(source,id)=>$(source)?.addEventListener('click',()=>$(id)?.click());
  $('dtConceptProfile').addEventListener('click',()=>{if(document.body.classList.contains('friend-view'))$('recent')?.click();else $('portraitBtn')?.click();});
  action('dtConceptCare','scheduleArt');
  action('dtConceptPlan','scheduleArt');
  action('dtConceptMemory','recent');
  action('dtConceptTraining','trainingArt');
  action('dtConceptEmergency','emergencyArt');
  action('dtConceptTask','upNextActivity');
  $('dtConceptCheck').addEventListener('change',e=>{
    const original=$('upNextCheck');
    if(original&&original.checked!==e.target.checked)original.click();
    requestAnimationFrame(sync);
  });
  function sync(){
    const thumb=$('profileThumb'),tag=$('tagOverlayFront');
    const image=$('dtConceptPhoto');
    if(thumb&&thumb.getAttribute('src')&&image.getAttribute('src')!==thumb.getAttribute('src'))image.src=thumb.getAttribute('src');
    if(tag&&tag.getAttribute('src')&&$('dtConceptTag').getAttribute('src')!==tag.getAttribute('src'))$('dtConceptTag').src=tag.getAttribute('src');
    const name=$('tagName')?.textContent?.trim()||$('publicDogName')?.textContent?.trim()||'My Dog';
    if($('dtConceptName').textContent!==name)$('dtConceptName').textContent=name;
    if($('dtConceptTagLabel').textContent!==name)$('dtConceptTagLabel').textContent=name;
    const originalTime=$('upNextTime')?.textContent?.trim();
    const originalTask=$('upNextActivity')?.textContent?.trim();
    $('dtConceptTime').textContent=originalTime||'Today';
    $('dtConceptTask').textContent=originalTask||'Daily Plan';
    const checked=!!$('upNextCheck')?.checked;
    if($('dtConceptCheck').checked!==checked)$('dtConceptCheck').checked=checked;
  }
  sync();
  // Reflect changes made by existing app features without duplicating their data.
  const observed=['profileThumb','tagOverlayFront','tagName','upNextTime','upNextActivity','upNextCheck'];
  const mo=new MutationObserver(sync);
  observed.forEach(id=>{const el=$(id);if(el)mo.observe(el,{attributes:true,characterData:true,childList:true,subtree:true});});
  document.addEventListener('change',e=>{if(e.target?.id==='upNextCheck')requestAnimationFrame(sync);});
  window.addEventListener('daily-tail-schedule-change',sync);
  window.addEventListener('focus',sync);
  function updateMode(){
   const friend=document.body.classList.contains('friend-view');
   home.querySelector('.dt-concept-profile-copy p').textContent=friend?'Public profile · Shared memories':'My profile · Recent memories';
   $('dtConceptProfile').textContent=friend?'View memories ›':'View profile ›';
   sync();
  }
  const modeObserver=new MutationObserver(updateMode);
  modeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  updateMode();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();


/* Phase 1-2 concept dashboard: hero, memory preview and five journal quick logs. */
(function(){
 function start(){
  const $=id=>document.getElementById(id);
  const home=$('dtConceptHome'),profile=home?.querySelector('.dt-concept-profile'),actions=home?.querySelector('.dt-concept-actions');
  if(!home||!profile||!actions||$('dtQuickLogDialog'))return;
  const style=document.createElement('style');
  style.textContent=[
   '.dt-concept-profile{min-height:205px!important;padding:14px!important;align-items:center!important;gap:11px!important;border-radius:22px!important}',
   '.dt-concept-profile:before{inset:7px!important;border-radius:17px!important}',
   '.dt-concept-profile-photo{width:118px!important;height:118px!important;flex-basis:118px!important}',
   '.dt-concept-profile-copy{align-self:stretch!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:6px!important;padding:9px 0!important}',
   '.dt-concept-profile-copy p{display:none!important}',
   '.dt-concept-open{min-height:36px!important;align-self:flex-start!important;padding:7px 12px!important}',
   '.dt-concept-tag{right:13%!important;top:5px!important;width:120px!important;height:89px!important}',
   '.dt-concept-tag-label{right:calc(13% + 15px)!important;top:45px!important;width:90px!important;font-size:19px!important}',
   '.dt-hero-heading{position:absolute;top:12px;left:0;right:0;text-align:center;font:700 21px Georgia,serif;color:#fff8ec;text-shadow:0 1px 2px #51331e}',
   '.dt-hero-paw{position:absolute;font-size:21px;top:12px;color:#d7e5ed}',
   '.dt-hero-paw.left{left:21px}.dt-hero-paw.right{right:21px}',
   '.dt-hero-memory{border:1.5px solid #9cb5c5;border-radius:11px;background:#fff8ec;color:#304658;padding:7px 9px;display:flex;align-items:center;gap:7px;min-height:47px;width:100%;max-width:240px;cursor:pointer;box-shadow:0 2px 4px #3c261b35;text-align:left}',
   '.dt-hero-memory img{width:34px;height:34px;flex:none;object-fit:cover;border-radius:6px}',
   '.dt-hero-memory span{min-width:0;flex:1}',
   '.dt-hero-memory b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 13px Georgia,serif}',
   '.dt-hero-memory small{display:block;font:11px/1.2 Arial,sans-serif;color:#526678}',
   '.dt-concept-actions{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;margin-top:12px!important}',
   '.dt-concept-actions button{min-height:72px!important;font-size:11px!important;padding:8px 2px!important;gap:6px!important}',
   '.dt-concept-actions .dt-icon{font-size:22px!important}',
   '.dt-quick-title{margin:13px 1px 0;font:700 21px Georgia,serif;color:#553b2b}',
   '.dt-quick-subtitle{font:12px Arial,sans-serif;color:#5e6e79;margin:4px 1px 0}',
   '#dtQuickLogDialog[hidden]{display:none!important}',
   '#dtQuickLogDialog{position:fixed;inset:0;z-index:25000;background:#162b3fa6;display:flex;align-items:flex-end;justify-content:center}',
   '.dt-quick-sheet{width:min(100%,590px);background:#fff9ef;border-radius:24px 24px 0 0;padding:22px 18px max(26px,env(safe-area-inset-bottom));border:2px solid #b1c3d0;color:#304b5c}',
   '.dt-quick-sheet h2{font:700 25px Georgia,serif;margin:0 0 7px;color:#704a33}',
   '.dt-quick-sheet p{font:13px/1.5 Arial,sans-serif;margin:0 0 14px;color:#566b78}',
   '.dt-quick-sheet label{font:700 13px Arial,sans-serif;display:block}',
   '.dt-quick-sheet textarea{display:block;width:100%;min-height:86px;resize:vertical;margin:7px 0 13px;border:1.5px solid #8ca5b6;border-radius:12px;background:#fff;padding:11px;font:16px Arial,sans-serif}',
   '.dt-quick-buttons{display:flex;justify-content:flex-end;gap:10px}',
   '.dt-quick-buttons button{padding:11px 16px;border-radius:11px;border:1px solid #9cb2bf;background:#e5eff4;color:#30546b;font-weight:700;cursor:pointer}',
   '.dt-quick-buttons button:last-child{background:#365c76;color:white}',
   'body.friend-view .dt-quick-title,body.friend-view .dt-quick-subtitle{display:none!important}',
   '@media(max-width:390px){.dt-concept-profile-photo{width:97px!important;height:97px!important;flex-basis:97px!important}.dt-concept-profile{min-height:193px!important}.dt-concept-tag{right:10%!important;width:106px!important}.dt-concept-tag-label{right:calc(10% + 11px)!important;width:84px!important;font-size:17px!important}.dt-concept-actions button{font-size:10px!important}}'
  ].join('\n');
  document.head.appendChild(style);
  const heading=document.createElement('div');heading.className='dt-hero-heading';heading.textContent='Daily Tail';profile.appendChild(heading);
  const paw1=document.createElement('span'),paw2=document.createElement('span');
  paw1.className='dt-hero-paw left';paw2.className='dt-hero-paw right';
  paw1.textContent='🐾';paw2.textContent='🐾';profile.append(paw1,paw2);
  const memory=document.createElement('button');memory.type='button';memory.className='dt-hero-memory';
  memory.innerHTML='<img alt="" id="dtHeroMemoryThumb" hidden><span><b id="dtHeroMemoryTitle">Recent memory</b><small>Recent post ›</small></span>';
  profile.querySelector('.dt-concept-profile-copy').insertBefore(memory,$('dtConceptProfile'));
  memory.addEventListener('click',()=>$('recent')?.click());
  function updateMemory(){
    const src=$('recentPostThumb'),dest=$('dtHeroMemoryThumb');
    if(src?.getAttribute('src')){dest.src=src.src;dest.hidden=false}else dest.hidden=true;
    $('dtHeroMemoryTitle').textContent=$('recentPostTitle')?.textContent||'Recent memory';
  }
  updateMemory();
  const mo=new MutationObserver(updateMemory);
  ['recentPostThumb','recentPostTitle'].forEach(id=>{const el=$(id);if(el)mo.observe(el,{attributes:true,childList:true,subtree:true,characterData:true});});

  const title=document.createElement('h3');title.className='dt-quick-title';title.textContent='Quick Actions';
  const subtitle=document.createElement('p');subtitle.className='dt-quick-subtitle';subtitle.textContent='Tap to save a care note for today';
  actions.before(title,subtitle);
  const quickPanel=document.createElement('section');quickPanel.className='dt-quick-panel';quickPanel.setAttribute('aria-label','Quick care actions');
  title.before(quickPanel);quickPanel.append(title,subtitle,actions);
  actions.replaceChildren();
  const types=[['Potty','🚽'],['Meal','🥣'],['Walk','🦮'],['Meds','💊'],['Training','🎓']];
  const dialog=document.createElement('div');dialog.id='dtQuickLogDialog';dialog.hidden=true;
  dialog.innerHTML='<section class="dt-quick-sheet" role="dialog" aria-modal="true" aria-labelledby="dtQuickTitle"><h2 id="dtQuickTitle">Care note</h2><p>Save a time-stamped entry to Daily Notes. This does not complete a scheduled task.</p><label for="dtQuickDetails">Details (optional)<textarea id="dtQuickDetails" placeholder="What should the family know?"></textarea></label><div class="dt-quick-buttons"><button id="dtQuickCancel" type="button">Cancel</button><button id="dtQuickSave" type="button">Save note</button></div></section>';
  document.body.appendChild(dialog);
  let active='';const close=()=>{dialog.hidden=true;active='';};
  $('dtQuickCancel').onclick=close;
  dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)close()});
  types.forEach(([label,icon])=>{
   const b=document.createElement('button');b.type='button';
   b.innerHTML='<span class="dt-icon" aria-hidden="true">'+icon+'</span>'+label;
   b.addEventListener('click',()=>{
    if(document.body.classList.contains('friend-view')||document.body.classList.contains('dt-locked'))return;
    active=label;$('dtQuickTitle').textContent='Log '+label;$('dtQuickDetails').value='';
    dialog.hidden=false;$('dtQuickDetails').focus();
   });actions.appendChild(b);
  });
  $('dtQuickSave').addEventListener('click',()=>{
   if(!active)return;
   const notes=$('journalText'),date=$('journalDate');
   if(!notes||!date){alert('Daily Notes is unavailable. No entry was saved.');return;}
   const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   if(date.value!==today){date.value=today;date.dispatchEvent(new Event('change',{bubbles:true}));}
   const detail=$('dtQuickDetails').value.trim();
   const entry='['+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+'] '+active+(detail?': '+detail:'');
   notes.value+=(notes.value.trim()?'\n':'')+entry;
   notes.dispatchEvent(new Event('input',{bubbles:true}));
   const status=$('journalStatus')?.textContent||'';
   if(status.includes('Could not save')){alert('Could not save the note on this device.');return;}
   close();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();


/* Responsive design polish: remove accidental hero height and properly feature the silver tag. */
(function(){
 function apply(){
  if(document.getElementById('dtVisualPolish'))return;
  const style=document.createElement('style');style.id='dtVisualPolish';
  style.textContent=[
   '.dt-concept-profile{min-height:225px!important;height:auto!important;padding:46px 14px 12px!important;gap:10px!important;align-items:center!important}',
   '.dt-concept-profile-photo{width:112px!important;height:112px!important;flex:0 0 112px!important}',
   '.dt-concept-profile-copy{height:152px!important;min-width:0!important;justify-content:flex-end!important;align-self:center!important;padding:0 0 0!important;gap:7px!important}',
   '.dt-concept-profile-copy p{display:none!important;margin:0!important}',
   '.dt-hero-heading{top:8px!important;font-size:22px!important;pointer-events:none}',
   '.dt-hero-paw{top:11px!important;font-size:17px!important}',
   '.dt-concept-tag{top:43px!important;right:calc(12% - 10px)!important;width:110px!important;height:83px!important;z-index:3!important}',
   '.dt-concept-tag-label{top:80px!important;right:calc(12% + 3px)!important;width:85px!important;font-size:18px!important;z-index:4!important}',
   '.dt-hero-memory{max-width:100%!important;min-height:48px!important;flex:none!important;position:relative!important;z-index:5!important}',
   '.dt-hero-memory img{width:32px!important;height:32px!important}',
   '.dt-hero-memory b{font-size:13px!important}',
   '.dt-concept-open{min-height:33px!important;align-self:flex-start!important;padding:7px 11px!important;font-size:12px!important}',
   '.dt-quick-panel{margin-top:12px;background:#fff9f0;border:1.5px solid #b6c6d0;border-radius:18px;padding:13px 12px 14px;box-shadow:0 3px 9px #263c491a}',
   '.dt-quick-title{font-size:21px!important;margin:0!important}',
   '.dt-quick-subtitle{font-size:12px!important;margin:4px 0 10px!important}',
   '.dt-concept-actions{margin-top:0!important;gap:6px!important}',
   '.dt-concept-actions button{min-height:72px!important;border-radius:12px!important}',
   '.dt-concept-extras{margin:10px 0 0!important}',
   '.dt-concept-extras button{min-height:38px!important}',
   'body.friend-view .dt-quick-panel{display:none!important}',
   '@media(max-width:390px){.dt-concept-profile{min-height:214px!important;padding:42px 11px 10px!important}.dt-concept-profile-photo{width:96px!important;height:96px!important;flex-basis:96px!important}.dt-concept-profile-copy{height:152px!important}.dt-concept-tag{right:calc(10% - 10px)!important;top:42px!important;width:104px!important;height:79px!important}.dt-concept-tag-label{right:calc(10% + 1px)!important;top:77px!important;width:82px!important;font-size:17px!important}.dt-hero-memory{padding:6px!important}.dt-quick-panel{padding:11px 8px!important}.dt-concept-actions{gap:5px!important}}'
  ].join('\n');
  document.head.appendChild(style);
  const extras=document.querySelector('.dt-concept-extras');
  if(extras){
   const training=[...extras.querySelectorAll('button')].find(b=>/^Training/.test(b.textContent.trim()));
   if(training)training.remove();
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
