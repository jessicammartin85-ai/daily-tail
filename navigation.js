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