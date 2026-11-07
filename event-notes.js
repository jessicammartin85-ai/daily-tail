/* Event-specific care notes. Uses the existing per-dog cloud extras. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const schedule=()=>window.DailyTailSchedule;
const currentDog=()=>{try{const data=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return data.activeId||''}catch{return ''}};
let active=null,draft=[],returnFocus=null;
const types=[['Potty','🚽'],['Accident','💦'],['Meal','🥣'],['Walk','🐕'],['Meds','💊'],['Training','🎓'],['Health','🩺']];
function recordFor(entry,date=today()){return schedule()?.getEventNotes?.()[date+'|'+entry.eventId]||null;}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function renderStamps(){
 const list=$('dtEventStamps');list.replaceChildren();
 draft.forEach((stamp,index)=>{
  const row=node('div',undefined,'dt-event-stamp');
  row.append(node('span',stamp.emoji+' '+stamp.kind+' · '+stamp.time));
  if(window.dtRole==='adult'){
   const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Delete '+stamp.kind+' timestamp at '+stamp.time);
   remove.onclick=()=>{draft.splice(index,1);renderStamps();};row.append(remove);
  }
  list.append(row);
 });
}
function openNote(index,trigger){
 const entry=schedule()?.getEntries?.()[index];if(!entry)return;
 active={entry,index,date:today(),dogId:currentDog()};returnFocus=trigger||document.activeElement;
 const record=recordFor(entry,active.date);
 draft=Array.isArray(record?.stamps)?record.stamps.map(s=>({...s})):[];
 $('dtEventNoteTitle').textContent='Note for '+entry.title;
 $('dtEventNoteWhen').textContent=new Date(active.date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+' · '+entry.time;
 $('dtEventNoteText').value=record?.text||'';
 const editable=window.dtRole==='adult';
 $('dtEventNoteText').readOnly=!editable;$('dtEventNoteSave').hidden=!editable;
 $('dtEventQuickAdds').hidden=!editable;
 $('dtEventNoteStatus').textContent=editable?'':'Only Adult Owners can add or edit event notes.';
 renderStamps();$('dtEventNoteDialog').showModal();
 if(editable)$('dtEventNoteText').focus();
}
function closeNote(){$('dtEventNoteDialog').close();active=null;returnFocus?.focus?.({preventScroll:true});}
function saveNote(){
 if(!active)return;
 if(currentDog()!==active.dogId){$('dtEventNoteStatus').textContent='The selected dog changed. Close this note and reopen the event.';return;}
 const text=$('dtEventNoteText').value.trim(),notes={...schedule().getEventNotes()},key=active.date+'|'+active.entry.eventId;
 if(text||draft.length)notes[key]={eventId:active.entry.eventId,date:active.date,eventTitle:active.entry.title,eventTime:active.entry.time,text,stamps:draft.map(s=>({...s})),updatedAt:new Date().toISOString()};
 else delete notes[key];
 try{schedule().saveEventNotes(notes);closeNote();syncUpNext();decorateSchedule();}
 catch(e){$('dtEventNoteStatus').textContent=e.message||'Could not save the event note. Please try again.';}
}
function addStamp(kind,emoji){
 if(!active||window.dtRole!=='adult')return;
 const now=new Date();draft.push({id:Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),kind,emoji,time:now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),createdAt:now.toISOString()});renderStamps();
}
function appendRecord(parent,record){
 const stamps=node('div',undefined,'dt-event-stamps');
 for(const stamp of record.stamps||[])stamps.append(node('span',stamp.emoji+' '+stamp.kind+' · '+stamp.time,'dt-event-stamp'));
 if(stamps.children.length)parent.append(stamps);
 if(record.text)parent.append(node('p',record.text,'dt-event-note-copy'));
}
function decorateSchedule(){
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
 window.addEventListener('daily-tail-schedule-change',syncUpNext);
 window.addEventListener('daily-tales-event-notes-changed',()=>{syncUpNext();decorateSchedule();});
 window.addEventListener('daily-tales-cloud-dogs-changed',()=>{syncUpNext();decorateSchedule();});
 window.addEventListener('focus',syncUpNext);
 syncUpNext();
}
window.DailyTalesEventNotes={open:openNote};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
