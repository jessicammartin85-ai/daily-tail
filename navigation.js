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
  const extras=document.createElement('div');extras.className='dt-home-secondary';
  [['Training','trainingArt'],['Emergency Info','emergencyArt']].forEach(([label,target])=>{
   const b=document.createElement('button');b.type='button';b.textContent=label+' ›';
   b.addEventListener('click',()=>$(target)?.click());extras.appendChild(b);
  });
  actions.after(extras);
  // Move the original friends panel, not a copy, so profiles and request handlers stay connected.
  function positionFriends(){
   if(document.body.classList.contains('friend-view')){
    if(facts&&facts.parentNode&&facts.nextElementSibling!==friends)facts.after(friends);
   }else{
    if(actions.nextElementSibling!==friends)actions.after(friends);
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
