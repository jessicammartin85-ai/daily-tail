/* Daily Tails: full original composition with real dynamic controls.
   Changes presentation only: existing data, saved notes, schedules and permissions remain authoritative. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const asset='./daily-tails-design.webp';
function start(){
 const home=$('dtConceptHome');
 if(!home||$('dtImageDesignedHome'))return;
 const test=new Image();
 test.onload=()=>{if(test.naturalWidth)build(home,test);};
 test.onerror=()=>console.warn('Full design art not uploaded yet: retaining previous working dashboard');
 test.src=asset;
}
function build(home,test){
 const source={
  post:$('dtRefRecent'),
  next:home.querySelector('.dt-concept-next'),
  actions:home.querySelector('.dt-quick-panel'),
  extras:home.querySelector('.dt-concept-extras')
 };
 if(!source.post||!source.next||!source.actions)return;
 const originalParents=new Map(Object.values(source).filter(Boolean).map(el=>[el,{parent:el.parentNode,next:el.nextSibling}]));
 const host=document.createElement('section');host.id='dtImageDesignedHome';host.setAttribute('aria-label','Daily Tails profile and care dashboard');
 host.innerHTML='<div class="dt-original-art" aria-hidden="true"></div>'+
  '<div class="dt-design-content">'+
   '<button id="dtDesignPortrait" type="button" class="dt-design-portrait" aria-label="Open dog profile"><img id="dtDesignPhoto" alt="Dog profile picture"></button>'+
   '<div class="dt-design-logo" role="img" aria-label="Daily Tails leather banner and hanging bone tag"></div>'+
   '<div class="dt-design-recent"></div>'+
   '<div class="dt-design-next"></div>'+
   '<div class="dt-design-actions"></div>'+
   '<div class="dt-design-emergency"></div>'+
  '</div>';
 home.before(host);
 const slots={post:host.querySelector('.dt-design-recent'),next:host.querySelector('.dt-design-next'),actions:host.querySelector('.dt-design-actions')};
 slots.post.append(source.post);slots.next.append(source.next);slots.actions.append(source.actions);
 const emergency=document.createElement('button');emergency.type='button';emergency.id='dtDesignEmergency';emergency.setAttribute('aria-label','Open emergency information');
 emergency.innerHTML='<span aria-hidden="true" class="dt-design-plus">✚</span><span>Emergency Info</span>';
 emergency.onclick=()=>{const target=$('dtConceptEmergency')||$('emergencyArt');target?.click();};
 host.querySelector('.dt-design-emergency').append(emergency);
 const tagButton=document.createElement('button');
 tagButton.type='button';tagButton.id='dtDesignDogName';tagButton.className='dt-design-dogname';
 tagButton.setAttribute('aria-label','Edit dog name on silver bone tag');
 const nameSpan=document.createElement('span');nameSpan.id='dtDesignDogNameText';tagButton.append(nameSpan);
 host.querySelector('.dt-design-logo').append(tagButton);
 const syncDogName=()=>{
  const dogName=$('tagName')?.textContent?.trim()||$('publicDogName')?.textContent?.trim()||'My Dog';
  nameSpan.textContent=dogName;tagButton.title='Edit name: '+dogName;
  tagButton.setAttribute('aria-label','Edit dog name: '+dogName);
  // Fit to the rendered silver tag, not viewport width or a character-count guess.
  // Actual glyph widths differ substantially (for example, "Willow" vs "Mimi").
  const fit=()=>{
   const width=tagButton.clientWidth-9,height=tagButton.clientHeight;
   if(width<=0||height<=0)return;
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
   if(!ctx)return;
   const max=Math.min(26,Math.max(12,host.querySelector('.dt-design-logo').clientWidth*.105),height*.78);
   let size=Math.max(8,max);
   while(size>8){
    ctx.font='700 '+size+'px Georgia, serif';
    if(ctx.measureText(dogName).width<=width*.94)break;
    size-=.5;
   }
   nameSpan.style.fontSize=Math.max(8,Math.round(size*10)/10)+'px';
  };
  requestAnimationFrame(fit);
 };
 syncDogName();
 const originalName=$('tagName');
 if(originalName)new MutationObserver(syncDogName).observe(originalName,{characterData:true,childList:true,subtree:true});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncDogName).observe(host.querySelector('.dt-design-logo'));
 window.addEventListener('resize',syncDogName);
 tagButton.addEventListener('click',()=>{
  if(document.body.classList.contains('dt-locked')||document.body.classList.contains('friend-view'))return;
  $('tag')?.click();
 });

 $('dtDesignPortrait').onclick=()=>{const target=$('dtConceptProfile')||$('portraitBtn');target?.click();};
 function syncPhoto(){
  const src=$('profileThumb')?.getAttribute('src')||$('dtRefPhoto')?.getAttribute('src')||'';
  const photo=$('dtDesignPhoto');if(src && photo.getAttribute('src')!==src)photo.setAttribute('src',src);
 }
 syncPhoto();
 const origPhoto=$('profileThumb');
 if(origPhoto)new MutationObserver(syncPhoto).observe(origPhoto,{attributes:true,attributeFilter:['src']});
 const paws=document.createElement('div');paws.className='dt-design-paws';paws.setAttribute('aria-hidden','true');host.insertBefore(paws,host.firstChild);
 // Sample one complete watercolor paw from the unobstructed lower-left
 // corner of the original artwork. The other corners are partly hidden by cards.
 // Reusing this intact source avoids amputated toe pads or broken paw shapes.
 try{
  const frame=document.createElement('canvas');frame.width=142;frame.height=145;
  const brush=frame.getContext('2d',{willReadFrequently:true});
  brush.drawImage(test,9,465,142,145,0,0,142,145);
  const pixels=brush.getImageData(0,0,142,145),v=pixels.data;
  for(let k=0;k<v.length;k+=4){
   const red=v[k],green=v[k+1],blue=v[k+2];
   // The original terracotta is brown; the watercolor paw is blue.
   // Keep the whole blue shape, including edges and highlights.
   const blueStrength=Math.min(blue-red-4,green-red-5);
   v[k+3]=Math.max(0,Math.min(255,blueStrength*12));
  }
  brush.putImageData(pixels,0,0);
  const completePaw=frame.toDataURL('image/png');
  for(const cls of ['tl','left-mid','left-edge','left-low','tr','right-edge','right-mid','right-low']){
   const paw=document.createElement('img');paw.className='dt-design-paw '+cls;
   paw.alt='';paw.decoding='async';paw.src=completePaw;paws.appendChild(paw);
  }
 }catch(e){console.warn('Complete watercolor paw extraction unavailable',e);}
 const style=document.createElement('style');style.id='dtFullDesignStyles';
 style.textContent=[
 'body:not(.friend-view):not(.dt-locked) #dtConceptHome{display:none!important}',
 '#dtImageDesignedHome{display:none}',
 'body:not(.friend-view):not(.dt-locked) #dtImageDesignedHome{display:block!important;position:relative;width:calc(100% - 28px);margin:12px 14px 4px;aspect-ratio:1450/627;container-type:inline-size;isolation:isolate;border-radius:18px;overflow:hidden;font-family:Arial,sans-serif}',
 '#dtImageDesignedHome .dt-original-art{position:absolute;inset:0;z-index:0;background-image:url("./daily-tails-design.webp");background-size:100% 100%;background-repeat:no-repeat}',
 '#dtImageDesignedHome .dt-design-paws{display:none}',
 '#dtImageDesignedHome .dt-design-content{position:absolute;inset:0;z-index:1}',
 '#dtImageDesignedHome .dt-design-portrait{position:absolute;left:3.7%;top:9.5%;width:26%;aspect-ratio:1;border-radius:50%;border:4px solid #1d1714;overflow:hidden;background:#ead5b6;cursor:pointer;padding:0;z-index:2}',
 '#dtImageDesignedHome .dt-design-portrait img{width:100%;height:100%;object-fit:cover;display:block}',
 '#dtImageDesignedHome .dt-design-logo{position:absolute;left:3.7%;top:48%;width:27.5%;height:48%;z-index:3;pointer-events:none;background:url("./daily-tails-design.webp") no-repeat;background-size:100cqw 43.24cqw;background-position:-3.7cqw -20.75cqw}',
 '#dtImageDesignedHome .dt-design-logo{pointer-events:auto!important}',
 '#dtImageDesignedHome .dt-design-dogname{position:absolute;top:70%;left:33%;width:40%;height:19%;display:flex;align-items:center;justify-content:center;padding:0;border:0;background:transparent;cursor:pointer;color:#52565a;text-shadow:0 1px 1px #ffffffd9;font:700 18px/1.1 Georgia,serif;z-index:7;transform:rotate(-8deg);transform-origin:center center}',
 '#dtImageDesignedHome .dt-design-dogname span{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '#dtImageDesignedHome .dt-design-dogname:focus-visible{outline:2px solid #275773!important;border-radius:40%;outline-offset:2px}',
 '#dtImageDesignedHome .dt-design-recent{position:absolute;left:32.3%;top:7%;width:58.5%;z-index:4}',
 '#dtImageDesignedHome .dt-design-next{position:absolute;left:32.3%;top:43%;width:58.5%;z-index:4}',
 '#dtImageDesignedHome .dt-design-actions{position:absolute;left:32.3%;top:66%;width:58.5%;z-index:4}',
 '#dtImageDesignedHome .dt-design-emergency{position:absolute;left:82%;top:72%;width:8%;height:19%;z-index:7}',
 '#dtImageDesignedHome .dt-ref-memory{width:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;gap:3px!important;padding:13px 13px 12px!important;background:#fffaf2!important;border:2px solid #e2cdb4!important;border-radius:18px!important;box-shadow:0 2px 4px #39241b39!important;cursor:pointer}',
 '#dtImageDesignedHome .dt-ref-memory-label{margin:-24px 0 5px -2px!important;background:#365f79!important;color:#fff!important;padding:4px 10px!important;font-size:clamp(9px,1vw,13px)!important}',
 '#dtImageDesignedHome .dt-ref-memory-line{display:flex!important;align-items:center!important}',
 '#dtImageDesignedHome .dt-ref-memory-title{font:700 clamp(14px,2.3vw,30px)/1.1 Georgia,serif!important;white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden!important}',
 '#dtImageDesignedHome .dt-ref-memory-sub{font:italic clamp(11px,1.6vw,19px)/1.2 Georgia,serif!important}',
 '#dtImageDesignedHome .dt-ref-memory-thumb{display:none!important}',
 '#dtImageDesignedHome .dt-concept-next{width:100%!important;margin:0!important;padding:10px 12px!important;background:#fffaf2!important;border:2px solid #e3ccb2!important;border-radius:18px!important}',
 '#dtImageDesignedHome .dt-concept-head h3{font:700 clamp(18px,2vw,28px) Georgia,serif!important}',
 '#dtImageDesignedHome .dt-concept-time{font-size:clamp(9px,1.1vw,14px)!important}',
 '#dtImageDesignedHome .dt-concept-task{margin-top:5px!important}',
 '#dtImageDesignedHome #dtConceptTask{font-size:clamp(12px,1.7vw,20px)!important}',
 '#dtImageDesignedHome #dtConceptCheck{width:25px!important;height:25px!important}',
 '#dtImageDesignedHome .dt-quick-panel{width:100%!important;padding:9px 12px 11px!important;margin:0!important;border:2px solid #e3ccb2!important;border-radius:18px!important;background:#fffaf2!important}',
 '#dtImageDesignedHome .dt-quick-title{font:700 clamp(17px,1.8vw,24px) Georgia,serif!important;color:#553b2b!important}',
 '#dtImageDesignedHome .dt-quick-subtitle{font-size:clamp(10px,1vw,12px)!important;margin:2px 0 7px!important}',
 '#dtImageDesignedHome .dt-concept-actions{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;margin:0!important;padding-right:13%!important}',
 '#dtImageDesignedHome .dt-concept-actions button{min-height:54px!important;padding:5px 2px!important;gap:3px!important;font-size:clamp(9px,1vw,12px)!important;border-radius:9px!important}',
 '#dtImageDesignedHome .dt-concept-actions .dt-icon{font-size:clamp(15px,2vw,24px)!important}',
 '#dtDesignEmergency{width:100%;height:100%;border:2px solid #305d78;background:#ff9687;color:#6f201e;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:700 clamp(8px,0.8vw,12px)/1.1 Arial,sans-serif;cursor:pointer;padding:4px;overflow:hidden;word-break:break-word}',
 '#dtDesignEmergency .dt-design-plus{background:#ec3c4a;color:white;border:1px solid #fff;border-radius:6px;padding:4px;font-size:clamp(18px,2.6vw,30px)}',
 '#dtImageDesignedHome button:focus-visible{outline:3px solid #214968!important;outline-offset:3px}',
 'body.friend-view #dtImageDesignedHome,body.dt-locked #dtImageDesignedHome{display:none!important}',
 // The app shell is always compact, even in a wide desktop viewport.
 'body:not(.friend-view):not(.dt-locked) #dtImageDesignedHome{width:calc(100% - 24px);height:auto!important;aspect-ratio:auto!important;margin:10px 12px 4px;overflow:hidden;background:#bd895e;border:3px solid #33251e;border-radius:24px;padding:15px 12px}',
 '#dtImageDesignedHome .dt-original-art{background:none!important}',
 '#dtImageDesignedHome .dt-design-paws{position:absolute;inset:0;display:block;pointer-events:none;overflow:hidden;z-index:1}',
 '#dtImageDesignedHome .dt-design-paw{position:absolute;width:54px;height:58px;object-fit:contain;opacity:.94;pointer-events:none;filter:drop-shadow(0 1px 1px #7b584a20)}',
 '#dtImageDesignedHome .dt-design-paw.tl{top:30px;left:25px;transform:rotate(-12deg)}',
 '#dtImageDesignedHome .dt-design-paw.left-mid{top:116px;left:19%;transform:rotate(8deg)}',
 '#dtImageDesignedHome .dt-design-paw.left-edge{top:173px;left:26px;transform:rotate(22deg)}',
 '#dtImageDesignedHome .dt-design-paw.left-low{top:249px;left:26px;transform:rotate(-16deg)}',
 '#dtImageDesignedHome .dt-design-paw.tr{top:32px;right:25px;transform:rotate(16deg)}',
 '#dtImageDesignedHome .dt-design-paw.right-edge{top:146px;right:26px;transform:rotate(-24deg)}',
 '#dtImageDesignedHome .dt-design-paw.right-mid{top:182px;right:20%;transform:rotate(18deg)}',
 '#dtImageDesignedHome .dt-design-paw.right-low{top:253px;right:28px;transform:rotate(-12deg)}',
 '#dtImageDesignedHome:before{content:"";position:absolute;inset:8px;border:2px dashed #e7c9aa;border-radius:17px;pointer-events:none}',
 '#dtImageDesignedHome .dt-design-content{position:relative;display:flex;flex-direction:column;inset:auto;align-items:stretch;gap:12px;z-index:2}',
 '#dtImageDesignedHome .dt-design-portrait{position:relative;left:auto;top:auto;align-self:center;width:min(48%,190px);border:4px solid #d1dfeb;margin:10px 0 0;z-index:3}',
 '#dtImageDesignedHome .dt-design-logo{position:relative;left:auto;top:auto;width:min(72%,260px);height:auto;aspect-ratio:780/586;margin:-35px auto -20px;background:url("./daily-tails-logo.webp") center/contain no-repeat;z-index:5}',
 '#dtImageDesignedHome .dt-design-dogname{top:70%;left:33%;width:40%;height:19%;padding:0;pointer-events:auto}',
 '#dtImageDesignedHome .dt-design-recent,#dtImageDesignedHome .dt-design-next,#dtImageDesignedHome .dt-design-actions{position:relative;left:auto;top:auto;width:100%;padding:0 3px}',
 '#dtImageDesignedHome .dt-design-emergency{position:relative;left:auto;top:auto;width:100%;height:auto;align-self:center;max-width:180px}',
 '#dtImageDesignedHome .dt-ref-memory{min-height:90px!important;padding:16px 10px 11px!important}',
 '#dtImageDesignedHome .dt-ref-memory-label{font-size:11px!important;margin-top:-25px!important}',
 '#dtImageDesignedHome .dt-ref-memory-title{font-size:clamp(18px,4.6vw,24px)!important}',
 '#dtImageDesignedHome .dt-ref-memory-sub{font-size:clamp(12px,3.2vw,15px)!important}',
 '#dtImageDesignedHome .dt-ref-memory-thumb{display:block!important;width:38px!important;height:38px!important;flex-basis:38px!important}',
 '#dtImageDesignedHome .dt-concept-next{padding:13px!important}',
 '#dtImageDesignedHome .dt-concept-head h3{font-size:23px!important}',
 '#dtImageDesignedHome .dt-concept-time{font-size:12px!important}',
 '#dtImageDesignedHome #dtConceptTask{font-size:18px!important}',
 '#dtImageDesignedHome .dt-quick-panel{padding:13px 10px!important}',
 '#dtImageDesignedHome .dt-quick-title{font-size:22px!important}',
 '#dtImageDesignedHome .dt-quick-subtitle{font-size:12px!important}',
 '#dtImageDesignedHome .dt-concept-actions{padding-right:0!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important}',
 '#dtImageDesignedHome .dt-concept-actions button{font-size:10px!important;min-height:68px!important}',
 '#dtImageDesignedHome .dt-concept-actions .dt-icon{font-size:22px!important}',
 '#dtDesignEmergency{flex-direction:row;min-height:42px;font-size:12px;padding:6px 12px}',
 '#dtDesignEmergency .dt-design-plus{font-size:19px;padding:3px}'
 ].join('\n');
 document.head.appendChild(style);
 // Maintain privacy when switching between owner and friend views.
 const originals=()=>Object.values(source).filter(Boolean);
 function relocate(){
  const friend=document.body.classList.contains('friend-view');
  for(const el of originals()){
   const saved=originalParents.get(el);if(!saved)continue;
   if(friend&&el.parentNode!==saved.parent){
    if(saved.next&&saved.next.parentNode===saved.parent)saved.parent.insertBefore(el,saved.next);
    else saved.parent.appendChild(el);
   }else if(!friend&&el.parentNode===saved.parent){
    const key=Object.keys(source).find(k=>source[k]===el);
    if(slots[key])slots[key].append(el);
   }
  }
 }
 new MutationObserver(relocate).observe(document.body,{attributes:true,attributeFilter:['class']});
 relocate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})();