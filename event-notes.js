/* Event-specific care notes. Uses the existing per-dog cloud extras. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const schedule=()=>window.DailyTailSchedule;
const currentDog=()=>{try{const data=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return data.activeId||''}catch{return ''}};
let active=null,draft=[],returnFocus=null,viewedDate=today();
const types=[['Potty','🚽'],['Accident','💦'],['Meal','🥣'],['Walk','🐕'],['Meds','💊'],['Training','🎓'],['Health','🩺']];
function recordFor(entry,date=today()){return schedule()?.getEventNotes?.()[date+'|'+entry.eventId]||null;}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function renderStamps(){
 const list=$('dtEventStamps');list.replaceChildren();
 draft.forEach((stamp,index)=>{
  const row=node('div',undefined,'dt-event-stamp');
  row.append(node('span',stamp.emoji+' '+stamp.kind+' · '+stamp.time));
  if(window.dtRole==='adult'&&active?.date===today()){
   const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Delete '+stamp.kind+' timestamp at '+stamp.time);
   remove.onclick=()=>{draft.splice(index,1);renderStamps();};row.append(remove);
  }
  list.append(row);
 });
}
function openNote(index,trigger,date=today(),savedEntry=null){
 const entry=savedEntry||schedule()?.getEntries?.()[index];if(!entry)return;
 active={entry,index,date,dogId:currentDog()};returnFocus=trigger||document.activeElement;
 const record=recordFor(entry,active.date);
 draft=Array.isArray(record?.stamps)?record.stamps.map(s=>({...s})):[];
 $('dtEventNoteTitle').textContent='Note for '+entry.title;
 $('dtEventNoteWhen').textContent=new Date(active.date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+' · '+entry.time;
 $('dtEventNoteText').value=record?.text||'';
 const editable=window.dtRole==='adult'&&active.date===today();
 $('dtEventNoteText').readOnly=!editable;$('dtEventNoteSave').hidden=!editable;
 $('dtEventQuickAdds').hidden=!editable;
 $('dtEventNoteStatus').textContent=editable?'':active.date!==today()?'Past notes are read-only.':'Only Adult Owners can add or edit event notes.';
 renderStamps();$('dtEventNoteDialog').showModal();
 if(editable)$('dtEventNoteText').focus();
}
function closeNote(){$('dtEventNoteDialog').close();active=null;returnFocus?.focus?.({preventScroll:true});}
function saveNote(){
 if(!active||active.date!==today()||window.dtRole!=='adult')return;
 if(currentDog()!==active.dogId){$('dtEventNoteStatus').textContent='The selected dog changed. Close this note and reopen the event.';return;}
 const text=$('dtEventNoteText').value.trim(),notes={...schedule().getEventNotes()},key=active.date+'|'+active.entry.eventId;
 if(text||draft.length)notes[key]={eventId:active.entry.eventId,date:active.date,eventTitle:active.entry.title,eventTime:active.entry.time,text,stamps:draft.map(s=>({...s})),updatedAt:new Date().toISOString()};
 else delete notes[key];
 try{schedule().saveEventNotes(notes);closeNote();syncUpNext();decorateSchedule();}
 catch(e){$('dtEventNoteStatus').textContent=e.message||'Could not save the event note. Please try again.';}
}
function addStamp(kind,emoji){
 if(!active||active.date!==today()||window.dtRole!=='adult')return;
 const now=new Date();draft.push({id:Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),kind,emoji,time:now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),createdAt:now.toISOString()});renderStamps();
}
function appendRecord(parent,record){
 const stamps=node('div',undefined,'dt-event-stamps');
 for(const stamp of record.stamps||[])stamps.append(node('span',stamp.emoji+' '+stamp.kind+' · '+stamp.time,'dt-event-stamp'));
 if(stamps.children.length)parent.append(stamps);
 if(record.text)parent.append(node('p',record.text,'dt-event-note-copy'));
}
function decorateSchedule(){
 decorateHistory();
 if(viewedDate!==today())return;
 document.querySelectorAll('#content [data-schedule-id]').forEach(check=>{
  const index=Number(check.dataset.scheduleId),entry=schedule()?.getEntries?.()[index],row=check.closest('.schedule-event');
  if(!entry||!row)return;
  row.dataset.eventId=entry.eventId;
  row.querySelector('.dt-event-note-control')?.remove();
  const control=node('div',undefined,'dt-event-note-control'),record=recordFor(entry),button=node('button',record?'📝 View / edit note':'📝 Add note','dt-event-note-action');
  button.type='button';button.onclick=()=>openNote(index,button);button.setAttribute('aria-label',(record?'View note for ':'Add note to ')+entry.title);
  control.append(button);
  if(record){const detail=node('details'),summary=node('summary','Saved event note');detail.append(summary);appendRecord(detail,record);control.append(detail);}
  (row.querySelector('.schedule-event-content')||row).append(control);
 });
}

function dayRecords(date){
 return Object.values(schedule()?.getEventNotes?.()||{}).filter(r=>r&&r.date===date&&r.eventId).sort((a,b)=>{
  const minute=t=>{const m=/(\d+):(\d+)\s*(AM|PM)/i.exec(t||'');return m?(Number(m[1])%12)*60+Number(m[2])+(m[3].toUpperCase()==='PM'?720:0):1440;};
  return minute(a.eventTime)-minute(b.eventTime);
 });
}
function goDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())return;
 viewedDate=date;schedule()?.render?.();
}
function decorateHistory(){
 const body=document.querySelector('#content .dt-schedule-body');if(!body)return;
 const past=viewedDate!==today(),records=dayRecords(viewedDate);
 let nav=body.querySelector('.dt-history-nav');
 if(!nav){
  nav=node('div',undefined,'dt-history-nav');
  const prev=node('button','‹'),input=node('input'),next=node('button','›'),now=node('button','Today');
  prev.type=next.type=now.type='button';prev.setAttribute('aria-label','Previous day');next.setAttribute('aria-label','Next day');
  input.type='date';input.setAttribute('aria-label','Schedule notes date');input.max=today();
  const shift=amount=>{const d=new Date(viewedDate+'T12:00:00');d.setDate(d.getDate()+amount);goDate(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));};
  prev.onclick=()=>shift(-1);next.onclick=()=>shift(1);now.onclick=()=>goDate(today());input.onchange=()=>goDate(input.value);
  nav.append(prev,input,next,now);body.prepend(nav);
 }
 nav.querySelector('input').value=viewedDate;nav.querySelectorAll('button')[1].disabled=!past;
 const topline=body.querySelector('.dt-schedule-topline');
 if(topline){topline.querySelector('strong').textContent=new Date(viewedDate+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});topline.querySelector('.schedule-meta').hidden=past;topline.querySelector('.dt-schedule-options').hidden=past;}
 for(const el of body.querySelectorAll('.dt-schedule-completed,.schedule-progress,.dt-schedule-reference'))el.hidden=past;
 for(const group of body.querySelectorAll('.schedule-group'))group.hidden=past;
 body.querySelector('.dt-history-events')?.remove();
 const old=body.querySelector('.dt-day-notes'),wasOpen=old?.open||false;old?.remove();
 const summary=node('details',undefined,'dt-day-notes');summary.open=wasOpen;
 summary.append(node('summary','📝 All notes for this day · '+records.length+' '+(records.length===1?'event':'events')));
 if(!records.length)summary.append(node('p','No saved event notes for this day.'));
 for(const record of records){
  const item=node('div',undefined,'dt-day-note-item'),link=node('button',(record.eventTime?record.eventTime+' · ':'')+record.eventTitle);
  link.type='button';link.onclick=()=>{
   const rows=body.querySelectorAll('.schedule-event'),row=Array.from(rows).find(el=>el.dataset.eventId===record.eventId);
   if(row){const detail=row.querySelector('details');if(detail)detail.open=true;row.scrollIntoView({behavior:'smooth',block:'center'});row.classList.add('dt-event-highlight');setTimeout(()=>row.classList.remove('dt-event-highlight'),2500);}
   else openNote(-1,link,viewedDate,{eventId:record.eventId,title:record.eventTitle,time:record.eventTime});
  };
  item.append(link);appendRecord(item,record);summary.append(item);
 }
 const journal=schedule()?.getJournalNotes?.()[viewedDate];
 if(journal){const item=node('div',undefined,'dt-day-note-item');item.append(node('strong','Daily Notes'),node('p',journal,'dt-event-note-copy'));summary.append(item);}
 (topline||nav).after(summary);
 if(past){
  const archive=node('section',undefined,'dt-history-events');archive.append(node('h3','Saved events'));
  if(!records.length)archive.append(node('p','No event notes were saved on this date.'));
  for(const record of records){
   const row=node('div',undefined,'schedule-event'),content=node('div',undefined,'schedule-event-content');
   row.dataset.eventId=record.eventId;row.append(node('time',record.eventTime,'schedule-time'));content.append(node('strong',record.eventTitle));
   const detail=node('details');detail.append(node('summary','📝 Saved event note'));appendRecord(detail,record);content.append(detail);row.append(content);archive.append(row);
  }
  summary.after(archive);
 }
}

function syncUpNext(){
 const container=document.querySelector('#dtImageDesignedHome .dt-concept-task')||document.querySelector('.dt-concept-task');
 if(!container)return;
 let button=$('dtUpNextEventNote');
 if(!button){
  button=node('button','📝','dt-up-next-note');button.id='dtUpNextEventNote';button.type='button';
  const arrow=$('dtConceptArrow')||container.querySelector('.dt-concept-chev');
  if(arrow)arrow.before(button);else container.append(button);
  button.onclick=()=>openNote(schedule()?.getCurrentIndex?.(),button);
 }
 const title=$('dtConceptTask'),time=$('dtConceptTime');
 if(title&&title.closest('.dt-concept-task')===container){
  let group=container.querySelector('.dt-upnext-event-group');
  if(!group){
   group=node('div',undefined,'dt-upnext-event-group');
   const line=node('div',undefined,'dt-upnext-event-line');
   title.before(group);group.append(line);line.append(title,button);
  }
  const header=container.previousElementSibling;
  if(time&&header?.classList.contains('dt-concept-head')){
   let heading=header.querySelector('.dt-upnext-heading');
   if(!heading){heading=node('div',undefined,'dt-upnext-heading');const title=header.querySelector('h3');if(title){title.before(heading);heading.append(title);}}
   if(heading&&time.parentElement!==heading)heading.append(time);
  }
  container.classList.add('dt-upnext-unified');
 }
 const index=schedule()?.getCurrentIndex?.(),entry=schedule()?.getEntries?.()[index];
 button.hidden=!entry;
 if(!entry)return;
 const record=recordFor(entry),count=record?.stamps?.length||0;
 button.textContent='📝'+(record?' '+(count||1):'');
 button.setAttribute('aria-label',(record?'View or edit event note for ':'Add event note to ')+entry.title);
}
function start(){
 if($('dtEventNoteDialog'))return;
 const style=node('style');style.textContent=[
 '#dtImageDesignedHome .dt-concept-head .dt-upnext-heading,.dt-concept-head .dt-upnext-heading{display:flex!important;align-items:baseline!important;gap:10px!important;flex-wrap:wrap;min-width:0}',
 '#dtImageDesignedHome .dt-upnext-heading #dtConceptTime,.dt-upnext-heading #dtConceptTime{display:inline!important;flex:0 1 auto!important;grid-column:auto!important;margin:0!important;padding:0!important;text-align:left!important;font:600 11px/1.3 Arial,sans-serif!important;letter-spacing:0!important;color:#647b89!important}',


 '#dtImageDesignedHome .dt-concept-task.dt-upnext-unified,.dt-concept-next .dt-concept-task.dt-upnext-unified{display:grid!important;grid-template-columns:28px minmax(0,1fr) 28px!important;gap:10px!important;margin-top:12px!important;align-items:center!important}',
 '.dt-upnext-event-group{min-width:0;display:flex;flex-direction:column;gap:3px}',
 '.dt-upnext-event-line{display:flex;align-items:center;justify-content:flex-start;gap:10px;min-width:0}',
 '#dtImageDesignedHome .dt-upnext-event-line #dtConceptTask,.dt-upnext-event-line #dtConceptTask{flex:0 1 auto!important;width:auto!important;min-width:0!important;margin:0!important;padding:0!important;line-height:1.25!important;text-align:left!important}',
 '#dtImageDesignedHome .dt-upnext-event-line #dtUpNextEventNote,.dt-upnext-event-line #dtUpNextEventNote{flex:0 0 38px!important;width:38px!important;min-width:38px!important;height:40px!important;min-height:40px!important;padding:4px!important;margin:0!important;border-radius:10px!important;background:#e7eff4!important;box-shadow:none!important}',
 '#dtImageDesignedHome .dt-upnext-event-group #dtConceptTime,.dt-upnext-event-group #dtConceptTime{display:block!important;text-align:left!important;margin:0!important;font:600 12px/1.4 Arial,sans-serif!important;color:#5c7689!important}',
 '#dtImageDesignedHome .dt-concept-head,#dtConceptHome .dt-concept-head{padding-bottom:9px!important;border-bottom:1px solid #dfd5c8!important}',
 '@media(max-width:380px){#dtImageDesignedHome .dt-concept-task.dt-upnext-unified,.dt-concept-next .dt-concept-task.dt-upnext-unified{grid-template-columns:24px minmax(0,1fr) 24px!important;gap:8px!important}.dt-upnext-event-line{gap:6px}}',

 '.dt-history-nav{display:flex;gap:7px;align-items:center;margin:0 0 15px}.dt-history-nav input{min-width:0;flex:1;width:130px;padding:9px;border:1px solid #a4bac9;border-radius:10px;background:#fff9ef;color:#294b62;font:16px Arial}.dt-history-nav button,.dt-day-note-item button{min-height:42px;border:1px solid #a4bac9;border-radius:10px;padding:7px 12px;background:#e5eef4;color:#294b62;cursor:pointer}.dt-history-nav button:disabled{opacity:.4}.dt-day-notes{padding:12px;border:1px solid #adc2d0;border-radius:13px;background:#fff9ef;margin:12px 0}.dt-day-notes>summary{cursor:pointer;font-weight:bold}.dt-day-note-item{padding:12px 0;border-bottom:1px solid #d5dfe5}.dt-day-note-item:last-child{border:0}.dt-day-note-item button{text-align:left}.dt-history-events .schedule-event{display:flex;gap:14px}.dt-schedule-body [hidden]{display:none!important}',
 '.dt-quick-panel,#dtImageDesignedHome .dt-design-actions{display:none!important}',
 '#dtImageDesignedHome .dt-concept-task,.dt-concept-task{display:grid!important;grid-template-columns:24px minmax(0,1fr) auto 28px!important;gap:8px!important;align-items:center!important}',
 '#dtImageDesignedHome #dtConceptTask,#dtConceptTask{min-width:0!important;width:auto!important;white-space:normal!important;text-align:left!important}',
 '#dtImageDesignedHome .dt-concept-chev,.dt-concept-chev{border:0!important;background:transparent!important;padding:0!important;min-width:28px!important;min-height:44px!important;cursor:pointer}',
 '.dt-up-next-note{font:16px Arial!important;min-height:40px!important;min-width:40px!important;padding:6px!important;border:1px solid #adc2d0!important;border-radius:11px!important;background:#e5eef4!important;color:#2d5068!important;cursor:pointer}',
 '.dt-up-next-note[hidden]{display:none!important}',
 '#dtEventNoteDialog{width:min(96vw,620px);max-height:90dvh;overflow:auto;padding:20px;border:2px solid #99b4c6;border-radius:23px;background:#d1dfe9;color:#294b62;box-sizing:border-box;font:15px/1.5 Arial,sans-serif}',
 '#dtEventNoteDialog::backdrop{background:#142a3baa}',
 '#dtEventNoteDialog .dt-event-heading{display:flex;align-items:start;justify-content:space-between;gap:12px}',
 '#dtEventNoteTitle{font:700 24px Georgia,serif;margin:0;overflow-wrap:anywhere}',
 '#dtEventNoteWhen{font-size:12px;margin:5px 0 12px}',
 '#dtEventNoteDialog button{min-height:42px;border:1px solid #a4bac9;border-radius:11px;padding:9px 13px;background:#fff9ef;color:#294b62;cursor:pointer}',
 '#dtEventQuickAdds{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:15px 0 10px}',
 '#dtEventQuickAdds[hidden],#dtEventNoteSave[hidden]{display:none!important}',
 '#dtEventQuickAdds button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-width:0;min-height:62px;padding:8px 1px;font:12px Arial,sans-serif}',
 '#dtEventQuickAdds .dt-event-emoji{font-size:21px;line-height:1.2}',
 '.dt-event-stamps{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}',
 '.dt-event-stamp{display:inline-flex;align-items:center;gap:5px;border-radius:11px;border:1px solid #a9bfce;background:#fff9ef;padding:6px 9px;font:13px/1.5 Arial,sans-serif;color:#2e526a;overflow-wrap:anywhere;max-width:100%}',
 '#dtEventStamps .dt-event-stamp button{min-width:34px;min-height:34px;padding:0;border:0;background:transparent;font-size:21px}',
 '#dtEventNoteText{display:block;width:100%;box-sizing:border-box;min-height:120px;resize:vertical;padding:12px;margin-top:7px;border:1px solid #91acbd;border-radius:12px;background:#fffefa;color:#294b62;font:16px/1.5 Arial,sans-serif}',
 '.dt-event-note-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}',
 '#dtEventNoteSave{background:#365e76!important;color:white!important}',
 '#dtEventNoteStatus{font-size:13px;min-height:1em}',
 '.dt-event-note-control{margin-top:9px}.dt-event-note-action{border:1px solid #a4bac9;border-radius:10px;background:#e7eff4;color:#365e76;padding:7px 10px;cursor:pointer;font:12px Arial,sans-serif}',
 '.dt-event-note-control summary{cursor:pointer;font-size:12px;margin:7px 0;color:#365e76}',
 '.dt-event-note-copy{white-space:pre-wrap!important;overflow-wrap:anywhere}',
 '.dt-event-highlight{outline:3px solid #779caf;outline-offset:3px;background:#e4eff5!important;scroll-margin:70px}',
 '@media(max-width:420px){#dtEventNoteDialog{padding:13px 9px}#dtEventQuickAdds{gap:2px}#dtEventQuickAdds button{font-size:11px;letter-spacing:-.4px;padding:8px 0}.dt-up-next-note{font-size:15px!important;min-width:35px!important}}'
 ].join('\n');document.head.append(style);
 const dialog=node('dialog');dialog.id='dtEventNoteDialog';
 dialog.innerHTML='<div class="dt-event-heading"><div><h2 id="dtEventNoteTitle">Event note</h2><p id="dtEventNoteWhen"></p></div><button type="button" id="dtEventNoteClose" aria-label="Close event note">×</button></div><div id="dtEventQuickAdds" aria-label="Add a timestamp"></div><div class="dt-event-stamps" id="dtEventStamps" aria-label="Event timestamps"></div><label for="dtEventNoteText">What would you like to remember?</label><textarea id="dtEventNoteText" maxlength="3000" placeholder="Add a note for this event…"></textarea><div class="dt-event-note-actions"><button type="button" id="dtEventNoteCancel">Cancel</button><button type="button" id="dtEventNoteSave">Save event note</button></div><p id="dtEventNoteStatus" role="status" aria-live="polite"></p>';
 document.body.append(dialog);
 for(const [kind,emoji] of types){const button=node('button');button.type='button';button.append(node('span',emoji,'dt-event-emoji'),node('span',kind));button.onclick=()=>addStamp(kind,emoji);$('dtEventQuickAdds').append(button);}
 $('dtEventNoteClose').onclick=$('dtEventNoteCancel').onclick=closeNote;
 $('dtEventNoteSave').onclick=saveNote;
 dialog.addEventListener('cancel',()=>{active=null;});
 const content=$('content');if(content)new MutationObserver(()=>decorateSchedule()).observe(content,{childList:true});
 for(const id of ['upNextActivity','upNextTime'])if($(id))new MutationObserver(syncUpNext).observe($(id),{childList:true,characterData:true,subtree:true});
 window.addEventListener('daily-tales-schedule-today',()=>{viewedDate=today();});
 window.addEventListener('daily-tail-schedule-change',syncUpNext);
 window.addEventListener('daily-tales-event-notes-changed',()=>{syncUpNext();decorateSchedule();});
 window.addEventListener('daily-tales-cloud-dogs-changed',()=>{syncUpNext();decorateSchedule();});
 window.addEventListener('focus',syncUpNext);
 syncUpNext();
}
window.DailyTalesEventNotes={open:openNote};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
