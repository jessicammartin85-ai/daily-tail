/* Daily Tail mobile snapshot enhancements. Visual-only controls; existing data ownership and autosave stay unchanged. */
(function(){
 'use strict';
 function init(){
  const card=document.querySelector('.journal-card');
  const notes=document.getElementById('journalText');
  const date=document.getElementById('journalDate');
  const stats=document.querySelector('.snapshot-stats');
  if(!card||!notes||!date||!stats||document.getElementById('dtNotesToggle'))return;
  const style=document.createElement('style');
  style.textContent=`
   .snapshot-wrap{scroll-margin-top:12px}
   .snapshot-stat{min-height:80px;display:flex;flex-direction:column;justify-content:center}
   .snapshot-stat span{font-size:12px}
   .snapshot-stat strong{font-size:clamp(15px,3.8vw,20px)}
   .snapshot-stat.dt-stat-button{font-family:inherit;width:100%;cursor:pointer;text-align:center;appearance:none}
   .snapshot-stat.dt-stat-button:focus-visible,#dtNotesToggle:focus-visible{outline:3px solid #365c76;outline-offset:3px}
   .snapshot-stat.dt-stat-button:active{transform:scale(.98)}
   .dt-stat-tap{font:700 10px Arial,sans-serif;color:#44677c;margin-top:5px}
   .journal-card{padding:13px 14px}
   .dt-notes-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
   .dt-notes-head .journal-title{margin:0;font-size:23px}
   #dtNotesToggle{font:700 12px Arial,sans-serif;color:#304b5e;background:#dce7ed;border:1px solid #96b0c1;border-radius:999px;min-height:37px;padding:7px 13px;cursor:pointer;white-space:nowrap}
   .dt-notes-summary{font:13px/1.45 Arial,sans-serif;color:#586674;margin:8px 0 0;overflow-wrap:anywhere}
   .journal-card.dt-notes-closed .journal-intro,.journal-card.dt-notes-closed .journal-date-row,.journal-card.dt-notes-closed .journal-quick,.journal-card.dt-notes-closed .journal-notes,.journal-card.dt-notes-closed .journal-bottom{display:none!important}
   .journal-card:not(.dt-notes-closed) .dt-notes-summary{display:none}
   .dt-progress-shade[hidden]{display:none!important}
   .dt-progress-shade{position:fixed;inset:0;z-index:23000;background:#152c3bab;display:flex;align-items:flex-end;justify-content:center}
   .dt-progress-panel{width:min(100%,590px);max-height:82dvh;overflow:auto;background:#fff9f1;border-radius:22px 22px 0 0;padding:19px 18px max(27px,env(safe-area-inset-bottom));color:#304556;box-shadow:0 -8px 28px #0002}
   .dt-progress-title{display:flex;justify-content:space-between;align-items:center;gap:15px}
   .dt-progress-title h2{font:700 25px Georgia,serif;color:#69462f;margin:0}
   .dt-progress-title button{border:0;background:#e0eaf0;border-radius:50%;width:40px;height:40px;font-size:25px;cursor:pointer}
   .dt-progress-panel p{font:13px/1.5 Arial,sans-serif;color:#536778}
   .dt-progress-list{list-style:none;padding:0;margin:12px 0;display:grid;gap:7px}
   .dt-progress-list li{border:1px solid #c9d5dc;border-radius:11px;padding:11px;display:flex;gap:10px;align-items:center;font:14px/1.4 Arial,sans-serif;background:#fff}
   .dt-progress-list li.dt-done{background:#edf4ee}
   .dt-progress-list .dt-check{font-size:19px;flex:none}
   .dt-progress-list strong{display:block}
   .dt-progress-list small{color:#60717c}
   @media(max-width:420px){.snapshot-card{padding:13px!important}.snapshot-stats{gap:7px}.snapshot-stat{padding:10px 4px}.snapshot-stat span{font-size:11px}.snapshot-stat strong{font-size:15px}}
   body:not(.dt-locked) .shell{padding-bottom:155px!important}
  `;
  document.head.appendChild(style);
  const heading=card.querySelector('.journal-title');
  const head=document.createElement('div');head.className='dt-notes-head';heading.parentNode.insertBefore(head,heading);head.appendChild(heading);
  const toggle=document.createElement('button');toggle.type='button';toggle.id='dtNotesToggle';toggle.setAttribute('aria-controls','journalText');head.appendChild(toggle);
  const summary=document.createElement('p');summary.className='dt-notes-summary';head.after(summary);
  function preview(){const value=notes.value.trim().replace(/\s+/g,' ');summary.textContent=value?('Latest note: '+(value.length>105?value.slice(0,105)+'…':value)):'No notes yet. Tap to add an update about today.';}
  function setOpen(open){card.classList.toggle('dt-notes-closed',!open);toggle.textContent=open?'Close notes':'Edit notes';toggle.setAttribute('aria-expanded',String(open));if(!open)preview();}
  toggle.addEventListener('click',()=>{const open=card.classList.contains('dt-notes-closed');setOpen(open);if(open)notes.focus({preventScroll:true});});
  notes.addEventListener('input',preview);
  date.addEventListener('change',()=>requestAnimationFrame(preview));
  document.querySelectorAll('[data-journal-quick]').forEach(btn=>btn.addEventListener('click',()=>setOpen(true)));
  setOpen(false);

  const original=stats.querySelector('.snapshot-stat');
  if(!original)return;
  const progressButton=document.createElement('button');progressButton.type='button';progressButton.className='snapshot-stat dt-stat-button';progressButton.setAttribute('aria-label','See completed and remaining Daily Plan tasks');
  while(original.firstChild)progressButton.appendChild(original.firstChild);
  const hint=document.createElement('span');hint.className='dt-stat-tap';hint.textContent='View tasks ›';progressButton.appendChild(hint);original.replaceWith(progressButton);
  const overlay=document.createElement('div');overlay.className='dt-progress-shade';overlay.hidden=true;
  overlay.innerHTML='<section class="dt-progress-panel" role="dialog" aria-modal="true" aria-labelledby="dtProgressTitle"><div class="dt-progress-title"><h2 id="dtProgressTitle">Today’s Daily Plan</h2><button type="button" id="dtProgressClose" aria-label="Close tasks">×</button></div><p id="dtProgressSummary"></p><ul class="dt-progress-list" id="dtProgressList"></ul></section>';
  document.body.appendChild(overlay);
  const close=()=>{overlay.hidden=true;progressButton.focus({preventScroll:true});};
  overlay.querySelector('#dtProgressClose').addEventListener('click',close);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
  progressButton.addEventListener('click',()=>{
   const sch=window.DailyTailSchedule;
   const list=overlay.querySelector('#dtProgressList');list.replaceChildren();
   if(!sch){overlay.querySelector('#dtProgressSummary').textContent='The daily plan is not available yet.';overlay.hidden=false;return;}
   const tasks=sch.getEntries();const done=sch.getDone();const d=new Date();const key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   let completed=0;
   tasks.forEach((task,i)=>{
    const finished=!!done[key+'|'+i];if(finished)completed++;
    const li=document.createElement('li');if(finished)li.className='dt-done';
    const mark=document.createElement('span');mark.className='dt-check';mark.textContent=finished?'☑':'□';mark.setAttribute('aria-hidden','true');
    const info=document.createElement('div');const label=document.createElement('strong');label.textContent=task.title||task.name||task.kind||'Care task';
    const time=document.createElement('small');time.textContent=task.time||'';
    info.append(label,time);li.append(mark,info);list.append(li);
   });
   overlay.querySelector('#dtProgressSummary').textContent=tasks.length?`${completed} of ${tasks.length} completed. Open Daily Plan to check off tasks.`:'No tasks scheduled for today.';
   overlay.hidden=false;overlay.querySelector('#dtProgressClose').focus();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
