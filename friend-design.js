/* Daily Tails Friend View: reference-inspired read-only shared profile.
   Display-only layer. Uses existing photo, recent memory and published dog facts. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function start(){
 const anchor=$('dtConceptHome');
 if(!anchor||$('dtFriendDesignHome'))return;
 const panel=document.createElement('section');
 panel.id='dtFriendDesignHome';
 panel.setAttribute('aria-label','Shared dog profile and latest post');
 panel.innerHTML='<div class="dt-friend-art-paws" aria-hidden="true"></div>'+
 '<div class="dt-friend-design-grid">'+
  '<div class="dt-friend-design-left">'+
   '<img class="dt-friend-design-photo" id="dtFriendDesignPhoto" alt="Dog profile photo">'+
   '<div class="dt-friend-design-logo" role="img" aria-label="Daily Tails leather nameplate with hanging silver bone"></div>'+
  '</div>'+
  '<div class="dt-friend-design-right">'+
   '<button class="dt-friend-design-recent" type="button" id="dtFriendDesignRecent" aria-label="Read recent shared posts"><span class="dt-friend-design-eyebrow">✦ RECENT POST</span><strong id="dtFriendDesignTitle">Recent post</strong><em id="dtFriendDesignSummary">Tap to read shared memories</em><span class="dt-friend-design-chevron" aria-hidden="true">›</span></button>'+
   '<div class="dt-friend-design-facts" aria-label="About this dog"><h2><span aria-hidden="true">🐾</span> About <span id="dtFriendDesignName">My Dog</span></h2><div class="dt-friend-design-factgrid"><div><small>BREED</small><strong id="dtFriendDesignBreed">Not added yet</strong></div><div><small>BIRTHDAY & AGE</small><strong id="dtFriendDesignBirthday">Not added yet</strong></div></div><p id="dtFriendDesignQuote"></p></div>'+
  '</div>'+
 '</div>';
 anchor.before(panel);
 $('dtFriendDesignRecent').onclick=()=>$('recent')?.click();
 const styles=document.createElement('style');styles.id='dtFriendDesignStyles';
 styles.textContent=[
 '#dtFriendDesignHome{display:none}',
 'body.friend-view:not(.dt-locked) #dtConceptHome{display:none!important}',
 'body.friend-view:not(.dt-locked) #dtFriendFacts{display:none!important}',
 'body.friend-view:not(.dt-locked) #dtFriendDesignHome{display:block;position:relative;isolation:isolate;overflow:hidden;margin:12px 14px 8px;padding:18px 16px 16px;background:#bd8e62;border:3px solid #281c15;border-radius:26px;box-shadow:0 3px 0 #8199a7;color:#253d50;font-family:Arial,sans-serif}',
 '#dtFriendDesignHome .dt-friend-design-grid{display:grid;grid-template-columns:30% minmax(0,1fr);gap:12px;position:relative;z-index:2}',
 '#dtFriendDesignHome:before{content:"";position:absolute;inset:9px;border:2px dashed #e3c49e;border-radius:19px;pointer-events:none;z-index:0}',
 '#dtFriendDesignHome .dt-friend-design-left{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:3}',
 '#dtFriendDesignHome .dt-friend-design-photo{display:block;width:100%;aspect-ratio:1;border:3px solid #201911;object-fit:cover;background:#e5d4b8;border-radius:50%;box-shadow:0 2px 3px #33251a44}',
 '#dtFriendDesignHome .dt-friend-design-logo{width:110%;aspect-ratio:780/586;margin:-16% 0 -13%;background:url("./daily-tails-logo.webp") center/contain no-repeat;position:relative;pointer-events:none;z-index:4}',
 '#dtFriendDesignHome .dt-friend-design-right{display:flex;flex-direction:column;gap:12px;min-width:0;position:relative;z-index:3}',
 '#dtFriendDesignHome .dt-friend-design-recent{position:relative;display:flex;flex-direction:column;min-height:113px;text-align:left;background:#fffaf1;border:2px solid #e3cfb4;box-shadow:0 2px 5px #4b31202c;border-radius:18px;padding:24px 27px 12px 14px;color:#294b63;cursor:pointer;max-width:100%;min-width:0}',
 '#dtFriendDesignHome .dt-friend-design-eyebrow{position:absolute;top:-14px;left:10px;border-radius:999px;background:#35617b;color:white;padding:5px 11px;font:700 12px Arial,sans-serif;box-shadow:0 2px 3px #2c43514a}',
 '#dtFriendDesignHome .dt-friend-design-recent strong{font:700 clamp(17px,3.1vw,23px)/1.12 Georgia,serif;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;max-width:100%;overflow-wrap:break-word}',
 '#dtFriendDesignHome .dt-friend-design-recent em{font:italic clamp(11px,2.1vw,16px)/1.3 Georgia,serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;margin-top:5px}',
 '#dtFriendDesignHome .dt-friend-design-chevron{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:27px;color:#365f79}',
 '#dtFriendDesignHome .dt-friend-design-facts{background:#cbd3db;border:2px solid #304e63;border-radius:17px;padding:10px 12px 11px;color:#25425a}',
 '#dtFriendDesignHome .dt-friend-design-facts h2{font:700 clamp(16px,3vw,23px)/1.1 Georgia,serif;margin:0 0 9px;color:#244761}',
 '#dtFriendDesignHome .dt-friend-design-facts h2 span[aria-hidden]{font-size:17px}',
 '#dtFriendDesignHome .dt-friend-design-factgrid{display:grid;grid-template-columns:1fr 1.4fr;gap:8px}',
 '#dtFriendDesignHome .dt-friend-design-factgrid>div{padding:9px 10px;border-radius:10px;background:#fffaf2;min-width:0}',
 '#dtFriendDesignHome .dt-friend-design-factgrid small{display:block;color:#647a8a;font:700 9px Arial,sans-serif;letter-spacing:.04em;margin-bottom:4px}',
 '#dtFriendDesignHome .dt-friend-design-factgrid strong{display:block;font:700 11px/1.35 Arial,sans-serif;overflow-wrap:normal}',
 '#dtFriendDesignHome #dtFriendDesignBirthday{font-size:11px;line-height:1.35;overflow-wrap:normal}',
 '#dtFriendDesignHome .dt-friend-design-facts p{font:italic 13px/1.25 Georgia,serif;text-align:center;background:#fffaf1;border-radius:12px;margin:9px 0 0;padding:8px 10px;overflow-wrap:anywhere}',
 '#dtFriendDesignHome .dt-friend-art-paws{position:absolute;inset:0;z-index:1;pointer-events:none}',
 '#dtFriendDesignHome .dt-friend-paw{position:absolute;width:44px;height:49px;object-fit:contain;opacity:.9}',
 '#dtFriendDesignHome .dt-friend-paw.a{left:12px;top:16px;transform:rotate(-12deg)}',
 '#dtFriendDesignHome .dt-friend-paw.b{left:14px;bottom:19px;transform:rotate(15deg)}',
 '#dtFriendDesignHome .dt-friend-paw.c{right:12px;top:17px;transform:rotate(10deg)}',
 '#dtFriendDesignHome .dt-friend-paw.d{right:11px;bottom:18px;transform:rotate(-16deg)}',
 '#dtFriendDesignHome button:focus-visible{outline:3px solid #f6cf8e;outline-offset:3px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-grid{grid-template-columns:1fr;gap:14px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-left{width:min(65%,240px);margin:2px auto -4px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-logo{width:110%;margin:-17% 0 -12%}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-recent{min-height:90px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-recent strong{font-size:20px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-recent em{font-size:13px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-facts h2{font-size:21px}',
 '#dtFriendDesignHome.dt-friend-narrow .dt-friend-design-factgrid strong{font-size:12px}',
 '@media(max-width:360px){#dtFriendDesignHome .dt-friend-design-factgrid{grid-template-columns:1fr}}'
 ].join('\n');
 document.head.append(styles);
 // Reuse a complete extracted paw from the existing design art. No partial crops.
 function copyPaws(){
  const source=$('dtImageDesignedHome')?.querySelector('.dt-design-paw');
  if(!source?.src||panel.querySelector('.dt-friend-paw'))return;
  for(const cls of ['a','b','c','d']){
   const img=document.createElement('img');img.className='dt-friend-paw '+cls;img.src=source.src;img.alt='';
   panel.querySelector('.dt-friend-art-paws').append(img);
  }
 }
 const sync=()=>{
  const photo=$('profileThumb')?.getAttribute('src')||$('dtRefPhoto')?.getAttribute('src');
  if(photo&&$('dtFriendDesignPhoto').getAttribute('src')!==photo)$('dtFriendDesignPhoto').src=photo;
  const values={
   dtFriendDesignTitle:$('recentPostTitle')?.textContent?.trim()||'Recent post',
   dtFriendDesignSummary:$('recentPostSummary')?.textContent?.trim()||'Tap to read shared memories',
   dtFriendDesignName:$('dtFactsDogName')?.textContent?.trim()||$('publicDogName')?.textContent?.trim()||'My Dog',
   dtFriendDesignBreed:$('dtFactsBreed')?.textContent?.trim()||'Not added yet',
   dtFriendDesignBirthday:$('dtFactsBirthday')?.textContent?.trim()||'Not added yet',
   dtFriendDesignQuote:$('dtFactsQuote')?.textContent?.trim()||''
  };
  for(const [id,value] of Object.entries(values)){const el=$(id);if(el&&el.textContent!==value)el.textContent=value;}
  copyPaws();
 };
 sync();
 const tracked=['profileThumb','recentPostTitle','recentPostSummary','dtFactsDogName','dtFactsBreed','dtFactsBirthday','dtFactsQuote'];
 const observer=new MutationObserver(sync);
 for(const id of tracked){const el=$(id);if(el)observer.observe(el,{childList:true,characterData:true,attributes:id==='profileThumb',subtree:true});}
 const artPaw=$('dtImageDesignedHome')?.querySelector('.dt-design-paws');
 if(artPaw)observer.observe(artPaw,{childList:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 const resize=()=>panel.classList.toggle('dt-friend-narrow',panel.getBoundingClientRect().width<490);
 resize();if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();