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
   return {type:'gifts',title:String(data.title||'Gift list').slice(0,100),externalUrl:webLink(data.externalUrl),items:data.items.slice(0,20).filter(item=>item&&typeof item.name==='string').map(item=>({name:item.name.slice(0,120),url:webLink(item.url)}))};
  }
 }catch{}
 return null;
}
function eventDetails(event){
 return '<p><strong>'+esc(new Date(event.date).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}))+'</strong></p>'+
 (event.place?'<p>'+esc(event.place)+'</p>':'')+(event.details?'<p style="white-space:pre-wrap">'+esc(event.details)+'</p>':'');
}
function giftItems(list){
 const externalUrl=webLink(list.externalUrl);
 const external=externalUrl?'<p><a href="'+esc(externalUrl)+'" target="_blank" rel="noopener noreferrer">Open external gift list ↗</a></p>':'';
 if(!list.items.length)return external;
 return external+'<ul class="dt-eg-gift-items">'+list.items.map(item=>'<li>'+(webLink(item.url)?'<a href="'+esc(webLink(item.url))+'" target="_blank" rel="noopener noreferrer">'+esc(item.name)+'</a>':esc(item.name))+'</li>').join('')+'</ul>';
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
  renderUpcomingEvents();
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
 const externalUrl=webLink(list?.externalUrl);
 const preview=list?
  '<section class="dt-eg-saved-gifts"><span class="dt-eg-gift-kicker">🎁 Saved gift list</span><h3>'+esc(list.title)+'</h3>'+
  '<div class="dt-eg-gift-actions">'+
  (externalUrl?'<a class="dt-eg-open-list" href="'+esc(externalUrl)+'" target="_blank" rel="noopener noreferrer">Open gift list ↗</a>':'')+
  '<button type="button" id="dtShareGifts">Share link</button></div>'+
  giftItems({...list,externalUrl:''})+'</section>':'<p>Add a registry link or a few gift ideas to share.</p>';
 const form='<form id="dtGiftsEditor">'+
  '<label>List name<input name="title" maxlength="100" required value="'+esc(list?.title||'Gift list')+'"></label>'+
  '<label>Registry or wishlist link<input type="url" name="externalUrl" maxlength="2000" placeholder="https://" value="'+esc(list?.externalUrl||'')+'"></label>'+
  '<details class="dt-eg-ideas"'+(list?.items.length?' open':'')+'><summary>Individual gift ideas (optional with a link)</summary>'+
  '<label>One idea per line<textarea name="items" maxlength="4000">'+esc(list?.items.map(item=>item.name+(item.url?' | '+item.url:'')).join('\n')||'')+'</textarea></label>'+
  '<small>For a shopping link, use: Item name | https://…</small></details>'+
  '<button>Save gift list</button></form>';
 screen('Gift List',preview+(list?'<details class="dt-eg-edit-list"><summary>Edit gift list</summary>'+form+'</details>':form)+
  '<p id="dtEventMessage" role="status"></p>');
 const shareButton=content().querySelector('#dtShareGifts');
 if(shareButton)shareButton.onclick=()=>share(list,openGifts);
 content().querySelector('#dtGiftsEditor').onsubmit=submit=>{
  submit.preventDefault();
  const values=new FormData(submit.currentTarget), title=values.get('title').trim();
  const lines=values.get('items').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const items=lines.map(line=>{const [name,...url]=line.split('|');return {name:name.trim().slice(0,120),url:webLink(url.join('|').trim())};});
  const enteredLink=values.get('externalUrl').trim(), externalUrl=webLink(enteredLink);
  if(enteredLink&&!externalUrl){
   content().querySelector('#dtEventMessage').textContent='Enter a gift list link beginning with https:// or http://.';return;
  }
  if(!title||(!items.length&&!externalUrl)||items.length>20||items.some(item=>!item.name)){
   content().querySelector('#dtEventMessage').textContent='Enter a list name and either a gift list link or 1–20 gift ideas.';return;
  }
  saveAndReturn(dogId,latest=>{latest.gifts={type:'gifts',title,items,externalUrl};},openGifts);
 };
}
function upcomingEvents(events,now=Date.now()){
 return (events||[]).filter(event=>Date.parse(event.date)>=now)
  .sort((first,second)=>Date.parse(first.date)-Date.parse(second.date));
}
function renderUpcomingEvents(){
 const list=document.getElementById('dtUpcomingEvents');
 if(!list||window.dtRole!=='adult')return;
 const events=upcomingEvents(store().read().events);
 list.innerHTML=events.length?`<ul>${events.map(event=>`<li><strong>${esc(event.title)}</strong><small>${esc(new Date(event.date).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}))}</small></li>`).join('')}</ul>`:'<p>No upcoming events</p>';
}
function init(){
 const anchor=document.querySelector('.dog-friends-section');
 if(!anchor||!store())return;
 const section=document.createElement('section');section.id='dtEventsGiftsHome';section.className='dog-friends-section';
 section.innerHTML=`<div class="dt-eg-header">
  <div class="dt-eg-title"><h2>Events</h2><button type="button" class="dt-eg-events-link">+ Events</button></div>
  <button type="button" class="dt-eg-gift-button"><span aria-hidden="true">🎁</span> Gift List</button>
 </div><div id="dtUpcomingEvents"></div>`;
 anchor.after(section);
 const [events,gifts]=section.querySelectorAll('button');
 events.onclick=openEvents;gifts.onclick=openGifts;
 const style=document.createElement('style');
 style.textContent=`
 body:not(.dt-role-adult) #dtEventsGiftsHome,body.friend-view #dtEventsGiftsHome,body.dt-locked #dtEventsGiftsHome{display:none}
 #dtUpcomingEvents ul{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:6px}
 #dtUpcomingEvents li{padding:8px 10px;background:#fff9ef;border-radius:9px;overflow-wrap:anywhere}
 #dtUpcomingEvents small{display:block;margin-top:3px;color:#4d6474}
 #dtUpcomingEvents p{margin:8px 0 0;color:#4d6474;font-size:13px}
 .dt-eg-header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
 #dtEventsGiftsHome h2{font:700 clamp(23px,5vw,29px)/1.2 Georgia,serif;color:#6b4935;margin:0}
 #dtEventsGiftsHome button{cursor:pointer;font:700 13px Arial,sans-serif;color:#25475d;min-height:36px}
 .dt-eg-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
 .dt-eg-events-link{padding:4px 0;border:0;background:transparent;text-decoration:none;white-space:nowrap}
 .dt-eg-gift-button{flex-shrink:0;white-space:nowrap;padding:6px 10px;border:1px solid #aabecb;border-radius:10px;background:#fff9ef}
 #dtEventsGiftsHome button:focus-visible,.dt-events-gifts button:focus-visible{outline:2px solid #265a7b;outline-offset:2px}
 .dt-events-gifts form,.dt-event-entry{margin:12px 0;padding:14px;border:1px solid #b8cbd7;border-radius:15px;background:#fff9ef}
 .dt-events-gifts label{display:block;margin:8px 0;color:#294c63;font-weight:700}
 .dt-events-gifts input,.dt-events-gifts textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #9bb5c7;border-radius:9px;background:#fffefa;color:#263b4a;font:16px Arial,sans-serif}
 .dt-events-gifts textarea{min-height:100px;resize:vertical}
 .dt-events-gifts button{min-height:40px;padding:8px 12px;margin:4px 0;border:1px solid #91afc2;border-radius:10px;background:#e1edf3;color:#25475d;font-weight:700;cursor:pointer}
 .dt-events-gifts form button:not([type=button]),#dtCreateEvent,#dtShareGifts,#dtCopyEventShare{background:#335c74;color:#fff;border-color:#335c74}
 .dt-event-entry h3{margin:0 0 6px;color:#6b4935;font-family:Georgia,serif}
 .dt-event-entry p{margin:6px 0}
 .dt-events-gifts p,.dt-events-gifts li{overflow-wrap:anywhere}
 .dt-eg-saved-gifts{padding:16px;border:1px solid #a9bfce;border-radius:15px;background:#e3eef4}
 .dt-eg-gift-kicker{color:#466376;font-size:12px;font-weight:700}
 .dt-eg-saved-gifts h3{margin:5px 0 10px;font:700 24px Georgia,serif;color:#294c63;overflow-wrap:anywhere}
 .dt-eg-gift-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
 .dt-eg-gift-actions .dt-eg-open-list,.dt-eg-gift-actions #dtShareGifts{display:inline-flex;align-items:center;min-height:42px;box-sizing:border-box;padding:8px 12px;margin:0;border:1px solid #335c74;border-radius:10px;text-decoration:none;font:700 14px Arial,sans-serif}
 .dt-eg-gift-actions .dt-eg-open-list{background:#335c74;color:#fff}
 .dt-eg-gift-actions #dtShareGifts{background:#fff9ef;color:#294c63}
 .dt-eg-edit-list,.dt-eg-ideas{margin:12px 0;color:#294c63}
 .dt-eg-edit-list summary,.dt-eg-ideas summary{cursor:pointer;font-weight:700;padding:7px 0}
 #dtGiftsEditor button{color:#fff!important}
 .dt-eg-gift-items{list-style:none;padding:0;display:grid;gap:8px}
 .dt-eg-gift-items li{background:#fff9ef;border:1px solid #b8cbd7;border-radius:10px;padding:10px 12px}
 `;
 document.head.append(style);
 const resume=()=>{
  renderUpcomingEvents();
  if(location.hash.startsWith('#dtJoinEvent=')&&window.dtRole==='adult'&&!document.body.classList.contains('friend-view')&&!document.body.classList.contains('dt-locked'))openEvents();
 };
 new MutationObserver(resume).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('hashchange',resume);
 window.addEventListener('daily-tales-cloud-dogs-changed',renderUpcomingEvents);
 window.addEventListener('focus',renderUpcomingEvents);
 setInterval(renderUpcomingEvents,60000);
 resume();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();