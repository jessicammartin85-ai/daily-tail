(()=>{
const preferenceKey='daily_tails_friend_sections_v1';
const fields=[
 ['training','Training progress'],
 ['hosting','Upcoming events I’m hosting'],
 ['attending','Upcoming events I’m attending'],
 ['gifts','Gift list']
];
function parse(value){try{return JSON.parse(value||'{}')||{};}catch{return {};}}
const list=value=>Array.isArray(value)?value:[];
const text=(value,max)=>String(value??'').trim().slice(0,max);
function url(value){try{const link=new URL(value);return ['https:','http:'].includes(link.protocol)?link.href:'';}catch{return '';}}
function build(extras={}){
 const prefs=parse(extras[preferenceKey]), result={};
 if(prefs.training===true){
  const training=parse(extras.daily_tales_training_plan_v1), program=training.program;
  const lessons=list(program?.lessons);
  if(lessons.length){
   const levels=['Learning with help','Can do it in a quiet setting','Reliable in different settings'];
   const badges=lessons.flatMap(lesson=>{
    if(!lesson?.title)return [];
    const level=levels.includes(lesson.skillLevel)?lesson.skillLevel:lesson.completedAt?'Completed':list(lesson.practiceDays).length?'Practicing':'';
    return level?[{skill:text(lesson.title,100),level}]:[];
   }).slice(0,30);
   result.training={name:text(program.name,100),badges};
  }
  else{
   const mastered=Object.values(training.skills||{}).filter(skill=>skill?.masteredAt).length;
   if(mastered)result.training={name:'Training',mastered};
  }
 }
 if(prefs.hosting===true||prefs.attending===true||prefs.gifts===true){
  const data=parse(extras.daily_tails_events_gifts_v1);
  const events=list(data.events).filter(event=>event?.title&&Date.parse(event.date)>=Date.now()).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  for(const [key,joined] of [['hosting',false],['attending',true]]){
   if(prefs[key]!==true)continue;
   const entries=events.filter(event=>Boolean(event.joined)===joined).slice(0,20).map(event=>({id:text(event.id,100),title:text(event.title,100),date:new Date(event.date).toISOString()}));
   if(entries.length)result[key]=entries;
  }
  if(prefs.gifts===true&&data.gifts){
   const gift=data.gifts;
   const externalUrl=url(gift.externalUrl);
   const items=list(gift.items).filter(item=>item?.name).slice(0,20).map(item=>({name:text(item.name,120),url:url(item.url)}));
   if(externalUrl||items.length)result.gifts={title:text(gift.title,100),externalUrl,items};
  }
 }
 if(result.hosting)result.hostingIds=result.hosting.map(event=>event.id).filter(Boolean);
 return result;
}
function render(details,requestDetails){
 document.getElementById('dtSharedExtras')?.remove();
 const anchor=document.querySelector('.dog-friends-section');
 if(!anchor||!details||!Object.keys(details).length)return;
 const panel=document.createElement('section');panel.id='dtSharedExtras';panel.className='dog-friends-section';
 function element(parent,tag,value){
  const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;
 }
 function link(parent,label,value,className=''){
  const href=url(value);
  if(!href){element(parent,'span',label);return;}
  const el=element(parent,'a',label);el.className=className;el.href=href;el.target='_blank';el.rel='noopener noreferrer';
 }
 function card(title){
  const section=element(panel,'section','');section.className='dt-shared-detail-card';
  element(section,'h2',title);return section;
 }
 if(details.training){
  const t=details.training, section=card('🎓 Training progress');
  if(t.name)element(section,'p',t.name);
  const badges=list(t.badges);
  if(badges.length){
   const items=element(section,'ul','');items.className='dt-shared-skill-badges';
   for(const badge of badges){
    const item=element(items,'li','');
    element(item,'strong',badge.skill);
    element(item,'span',badge.level);
   }
  }else if(t.mastered)element(section,'p',t.mastered+' skills mastered');
  else element(section,'p','No skill badges shared yet.');
 }
 for(const [key,label] of fields.filter(([key])=>key==='hosting'||key==='attending')){
  const events=list(details[key]).filter(event=>Date.parse(event.date)>=Date.now());
  if(!events.length)continue;
  const section=card('📅 '+label);
  const items=element(section,'ul','');
  for(const event of events){
   const row=element(items,'li',event.title+' · '+new Date(event.date).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}));
   if(key==='hosting'&&event.id&&requestDetails){
    const button=element(row,'button','Request Details');button.type='button';button.className='small';button.style.marginInlineStart='8px';button.onclick=()=>requestDetails(event);
   }
  }
 }
 if(details.gifts){
  const gift=details.gifts;
  const section=card('🎁 Gift List');
  if(gift.title&&!/^gift list$/i.test(gift.title.trim()))element(section,'p',gift.title);
  if(url(gift.externalUrl))link(section,'Open gift list ↗',gift.externalUrl,'dt-shared-gift-action');
  if(list(gift.items).length){
   const items=element(section,'ul','');
   for(const item of gift.items)link(element(items,'li',''),item.name,item.url);
  }
 }
 if(panel.children.length)anchor.after(panel);
}
window.DailyTailsFriendSections={preferenceKey,fields,parse,build,render};
})();