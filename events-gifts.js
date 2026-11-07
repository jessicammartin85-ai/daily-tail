(()=>{
'use strict';
const key='daily_tails_events_gifts_v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const webLink=value=>{try{const url=new URL(value);return url.protocol==='https:'||url.protocol==='http:'?url.href:'';}catch{return '';}};
function encode(value){
 return btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)),byte=>String.fromCharCode(byte)).join(''));
}
function readShare(hash){
 if(!hash||hash.length>24000)return null;
 try{
  const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(decodeURIComponent(hash.slice(1))),char=>char.charCodeAt(0))));
  if(data.type==='event'&&typeof data.id==='string'&&typeof data.title==='string'&&typeof data.date==='string'){
   if(!data.id||!data.title||!Number.isFinite(Date.parse(data.date)))return null;
   return {type:'event',id:data.id.slice(0,100),title:data.title.slice(0,100),date:data.date,place:String(data.place||'').slice(0,200),details:String(data.details||'').slice(0,800)};
  }
  if(data.type==='gifts'&&Array.isArray(data.items)){
   return {type:'gifts',title:String(data.title||'Gift list').slice(0,100),items:data.items.slice(0,20).filter(item=>item&&typeof item.name==='string').map(item=>({name:item.name.slice(0,120),url:webLink(item.url)}))};
  }
 }catch{}
 return null;
}
function eventDetails(event){
 return '<p><strong>'+esc(new Date(event.date).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}))+'</strong></p>'+
 (event.place?'<p>'+esc(event.place)+'</p>':'')+(event.details?'<p style="white-space:pre-wrap">'+esc(event.details)+'</p>':'');
}
function giftItems(list){
 return '<ul class="dt-eg-gift-items">'+list.items.map(item=>'<li>'+(webLink(item.url)?'<a href="'+esc(webLink(item.url))+'" target="_blank" rel="noopener noreferrer">'+esc(item.name)+'</a>':esc(item.name))+'</li>').join('')+'</ul>';
}
function startShared(root){
 const shared=readShare(location.hash);
 if(!shared){root.textContent='This sharing link is incomplete or invalid.';return;}
 root.innerHTML='<h1>'+esc(shared.title)+'</h1>'+(shared.type==='gifts'?giftItems(shared):eventDetails(shared)+
 '<p>Save this invitation in Daily Tails to keep it handy.</p><a id="dtJoinSharedEvent">Open in Daily Tails</a>');
 if(shared.type==='event')root.querySelector('a').href='./index.html#dtJoinEvent='+encodeURIComponent(location.hash.slice(1));
}
const sharedRoot=document.getElementById('dtSharedEventsGifts');
if(sharedRoot){startShared(sharedRoot);return;}
const store=()=>window.DailyTalesEventsGiftsStore;
const content=()=>document.getElementById('content');
function screen(title,body){store().show(title,'<div class="dt-events-gifts">'+body+'</div>');}
function share(item,back){
 const url=new URL('./events-gifts-share.html',location.href);
 url.hash=encodeURIComponent(encode(item));
 screen('Share '+(item.type==='event'?'event':'gift list'),
  '<p>Anyone with this link can view these details. Share a new link after making changes.</p>'+
  '<label>Sharing link<input id="dtEventShareLink" readonly value="'+esc(url.href)+'"></label>'+
  '<button type="button" id="dtCopyEventShare">Copy link</button> <button type="button" id="dtEventShareBack">Back</button><p id="dtEventMessage" role="status"></p>');
 content().querySelector('#dtEventShareBack').onclick=back;
 content().querySelector('#dtCopyEventShare').onclick=async()=>{
  try{await navigator.clipboard.writeText(url.href);content().querySelector('#dtEventMessage').textContent='Link copied.';}
  catch{const field=content().querySelector('#dtEventShareLink');field.focus();field.select();}
 };
}
function localDate(value){
 const date=new Date(value);
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function openEvents(){
 const data=store().read(), dogId=store().dogId(), events=data.events||[];
 let invitation='';
 if(location.hash.startsWith('#dtJoinEvent=')){try{invitation=decodeURIComponent(location.hash.slice(13));}catch{}}
 screen('Events',
  '<p>Create an event or paste an invitation to add it to this dog’s events.</p>'+
  '<form id="dtJoinEventForm"><label>Event link<input name="link" required value="'+esc(invitation?'#'+invitation:'')+'"></label><button>Review invitation</button></form>'+
  '<button type="button" id="dtCreateEvent">Create event</button><p id="dtEventMessage" role="status"></p>'+
  (events.length?events.map((event,index)=>'<article class="dt-event-entry"><h3>'+esc(event.title)+'</h3>'+eventDetails(event)+
   (event.joined?'<small>Joined</small>':'<button type="button" data-edit-event="'+index+'">Edit</button> <button type="button" data-share-event="'+index+'">Share invitation</button>')+
   ' <button type="button" data-remove-event="'+index+'">'+(event.joined?'Leave event':'Remove event')+'</button></article>').join(''):'<p>No events yet.</p>'));
 const root=content();
 root.querySelector('#dtCreateEvent').onclick=()=>editEvent();
 root.querySelector('#dtJoinEventForm').onsubmit=submit=>{
  submit.preventDefault();
  const input=submit.currentTarget.elements.link.value.trim();
  const event=readShare(input.includes('#')?'#'+input.split('#').pop():'');
  if(event?.type!=='event'){root.querySelector('#dtEventMessage').textContent='Enter a valid Daily Tails event link.';return;}
  screen('Join event','<h3>'+esc(event.title)+'</h3>'+eventDetails(event)+
   '<p>Joining adds the event to your list.</p><button type="button" id="dtConfirmEventJoin">Join event</button> <button type="button" id="dtCancelEventJoin">Back</button><p id="dtEventMessage" role="status"></p>');
  content().querySelector('#dtCancelEventJoin').onclick=openEvents;
  content().querySelector('#dtConfirmEventJoin').onclick=()=>saveAndReturn(dogId,latest=>{
   latest.events=latest.events||[];
   const existing=latest.events.find(item=>item.id===event.id);
   if(existing?.joined)Object.assign(existing,event);
   else if(!existing)latest.events.push({...event,joined:true});
  },()=>{if(location.hash.startsWith('#dtJoinEvent='))history.replaceState(null,'',location.pathname+location.search);openEvents();});
 };
 root.querySelectorAll('[data-edit-event]').forEach(button=>button.onclick=()=>editEvent(events[Number(button.dataset.editEvent)]));
 root.querySelectorAll('[data-share-event]').forEach(button=>button.onclick=()=>share(events[Number(button.dataset.shareEvent)],openEvents));
 root.querySelectorAll('[data-remove-event]').forEach(button=>button.onclick=()=>{
  const event=events[Number(button.dataset.removeEvent)];
  if(confirm(event.joined?'Leave this event?':'Remove this event from your list?'))saveAndReturn(dogId,latest=>{
   latest.events=(latest.events||[]).filter(item=>item.id!==event.id);
  },openEvents);
 });
}
function saveAndReturn(dogId,update,back){
 try{
  const latest=store().read();
  update(latest);
  store().save(dogId,latest);
  back();
 }catch(error){const status=content().querySelector('#dtEventMessage');if(status)status.textContent=error.message;}
}
function editEvent(event){
 const dogId=store().dogId();
 screen(event?'Edit event':'Create event','<form id="dtEventEditor">'+
  '<label>Event name<input name="title" required maxlength="100" value="'+esc(event?.title)+'"></label>'+
  '<label>Date and time<input name="date" required type="datetime-local" value="'+esc(event?localDate(event.date):'')+'"></label>'+
  '<label>Location<input name="place" maxlength="200" value="'+esc(event?.place)+'"></label>'+
  '<label>Details<textarea name="details" maxlength="800">'+esc(event?.details)+'</textarea></label>'+
  '<button>Save event</button> <button type="button" id="dtEventCancel">Back</button></form><p id="dtEventMessage" role="status"></p>');
 content().querySelector('#dtEventCancel').onclick=openEvents;
 content().querySelector('#dtEventEditor').onsubmit=submit=>{
  submit.preventDefault();
  const values=new FormData(submit.currentTarget);
  const title=values.get('title').trim(), date=new Date(values.get('date'));
  if(!title||!Number.isFinite(date.getTime())){content().querySelector('#dtEventMessage').textContent='Enter an event name, date, and time.';return;}
  const saved={type:'event',id:event?.id||crypto.randomUUID(),title,date:date.toISOString(),place:values.get('place').trim(),details:values.get('details').trim()};
  saveAndReturn(dogId,latest=>{
   latest.events=latest.events||[];
   const index=latest.events.findIndex(item=>item.id===saved.id);
   if(index<0)latest.events.push(saved);else latest.events[index]=saved;
  },openEvents);
 };
}
function openGifts(){
 const list=store().read().gifts, dogId=store().dogId();
 screen('Gift List','<form id="dtGiftsEditor">'+
  '<label>List name<input name="title" maxlength="100" required value="'+esc(list?.title||'Gift list')+'"></label>'+
  '<label>Gift ideas, one per line<textarea name="items" maxlength="4000" required>'+esc(list?.items.map(item=>item.name+(item.url?' | '+item.url:'')).join('\n')||'')+'</textarea></label>'+
  '<p>To add a shopping link, write the item name, then |, then the link.</p>'+
  '<button>Save gift list</button></form><p id="dtEventMessage" role="status"></p>'+
  (list?giftItems(list)+'<button type="button" id="dtShareGifts">Share saved gift list</button>':''));
 const shareButton=content().querySelector('#dtShareGifts');
 if(shareButton)shareButton.onclick=()=>share(list,openGifts);
 content().querySelector('#dtGiftsEditor').onsubmit=submit=>{
  submit.preventDefault();
  const values=new FormData(submit.currentTarget), title=values.get('title').trim();
  const lines=values.get('items').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const items=lines.map(line=>{const [name,...url]=line.split('|');return {name:name.trim().slice(0,120),url:webLink(url.join('|').trim())};});
  if(!title||!items.length||items.length>20||items.some(item=>!item.name)){
   content().querySelector('#dtEventMessage').textContent='Enter a name and 1–20 gift ideas.';return;
  }
  saveAndReturn(dogId,latest=>{latest.gifts={type:'gifts',title,items};},openGifts);
 };
}
function init(){
 const anchor=document.querySelector('.dog-friends-section');
 if(!anchor||!store())return;
 const section=document.createElement('section');section.id='dtEventsGiftsHome';section.className='dog-friends-section';
 section.innerHTML=`<h2>Events &amp; Gifts</h2>
 <div class="dt-eg-tiles">
  <button type="button" class="dt-eg-tile"><span class="dt-eg-icon" aria-hidden="true">📅</span><span><strong>Events</strong><small>Create or join an event</small></span><span aria-hidden="true">›</span></button>
  <button type="button" class="dt-eg-tile"><span class="dt-eg-icon" aria-hidden="true">🎁</span><span><strong>Gift List</strong><small>Save and share gift ideas</small></span><span aria-hidden="true">›</span></button>
 </div>`;
 anchor.after(section);
 const [events,gifts]=section.querySelectorAll('button');
 events.onclick=openEvents;gifts.onclick=openGifts;
 const style=document.createElement('style');
 style.textContent=`
 body:not(.dt-role-adult) #dtEventsGiftsHome,body.friend-view #dtEventsGiftsHome,body.dt-locked #dtEventsGiftsHome{display:none}
 #dtEventsGiftsHome h2{font:700 clamp(23px,5vw,29px)/1.2 Georgia,serif;color:#6b4935;margin:0 0 13px}
 .dt-eg-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 #dtEventsGiftsHome .dt-eg-tile{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;padding:12px 10px;text-align:left;background:#fff9ef;color:#25475d;border:1px solid #aabecb;border-radius:14px;cursor:pointer}
 .dt-eg-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#e1edf3;font-size:18px}
 .dt-eg-tile strong,.dt-eg-tile small{display:block}
 .dt-eg-tile small{margin-top:3px;font:12px/1.3 Arial,sans-serif;color:#4d6474}
 .dt-eg-tile:focus-visible,.dt-events-gifts button:focus-visible{outline:2px solid #265a7b;outline-offset:2px}
 .dt-events-gifts form,.dt-event-entry{margin:12px 0;padding:14px;border:1px solid #b8cbd7;border-radius:15px;background:#fff9ef}
 .dt-events-gifts label{display:block;margin:8px 0;color:#294c63;font-weight:700}
 .dt-events-gifts input,.dt-events-gifts textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #9bb5c7;border-radius:9px;background:#fffefa;color:#263b4a;font:16px Arial,sans-serif}
 .dt-events-gifts textarea{min-height:100px;resize:vertical}
 .dt-events-gifts button{min-height:40px;padding:8px 12px;margin:4px 0;border:1px solid #91afc2;border-radius:10px;background:#e1edf3;color:#25475d;font-weight:700;cursor:pointer}
 .dt-events-gifts form button:not([type=button]),#dtCreateEvent,#dtShareGifts,#dtCopyEventShare{background:#335c74;color:#fff;border-color:#335c74}
 .dt-event-entry h3{margin:0 0 6px;color:#6b4935;font-family:Georgia,serif}
 .dt-event-entry p{margin:6px 0}
 .dt-events-gifts p,.dt-events-gifts li{overflow-wrap:anywhere}
 .dt-eg-gift-items{list-style:none;padding:0;display:grid;gap:8px}
 .dt-eg-gift-items li{background:#fff9ef;border:1px solid #b8cbd7;border-radius:10px;padding:10px 12px}
 @media(max-width:400px){.dt-eg-tiles{grid-template-columns:1fr}}
 `;
 document.head.append(style);
 const resume=()=>{
  if(location.hash.startsWith('#dtJoinEvent=')&&window.dtRole==='adult'&&!document.body.classList.contains('friend-view')&&!document.body.classList.contains('dt-locked'))openEvents();
 };
 new MutationObserver(resume).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('hashchange',resume);
 resume();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();