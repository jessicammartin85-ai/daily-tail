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
  if(lessons.length)result.training={name:text(program.name,100),done:lessons.filter(lesson=>lesson?.completedAt).length,total:lessons.length};
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
   const entries=events.filter(event=>Boolean(event.joined)===joined).slice(0,20).map(event=>({title:text(event.title,100),date:new Date(event.date).toISOString()}));
   if(entries.length)result[key]=entries;
  }
  if(prefs.gifts===true&&data.gifts){
   const gift=data.gifts;
   const externalUrl=url(gift.externalUrl);
   const items=list(gift.items).filter(item=>item?.name).slice(0,20).map(item=>({name:text(item.name,120),url:url(item.url)}));
   if(externalUrl||items.length)result.gifts={title:text(gift.title,100),externalUrl,items};
  }
 }
 return result;
}
function render(details){
 document.getElementById('dtSharedExtras')?.remove();
 const anchor=document.querySelector('.dog-friends-section');
 if(!anchor||!details||!Object.keys(details).length)return;
 const panel=document.createElement('section');panel.id='dtSharedExtras';panel.className='dog-friends-section';
 function element(parent,tag,value){
  const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;
 }
 function link(parent,label,value){
  const href=url(value);
  if(!href){element(parent,'span',label);return;}
  const el=element(parent,'a',label);el.href=href;el.target='_blank';el.rel='noopener noreferrer';
 }
 if(details.training){
  const t=details.training;
  element(panel,'h2','Training progress');
  element(panel,'p',t.mastered?t.mastered+' skills mastered':t.name+' · '+t.done+' of '+t.total+' lessons complete');
 }
 for(const [key,label] of fields.filter(([key])=>key==='hosting'||key==='attending')){
  const events=list(details[key]).filter(event=>Date.parse(event.date)>=Date.now());
  if(!events.length)continue;
  element(panel,'h2',label);
  const items=element(panel,'ul','');
  for(const event of events)element(items,'li',event.title+' · '+new Date(event.date).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}));
 }
 if(details.gifts){
  const gift=details.gifts;
  element(panel,'h2','Gift list');
  if(gift.title)element(panel,'p',gift.title);
  if(url(gift.externalUrl))link(panel,'Open gift list ↗',gift.externalUrl);
  if(list(gift.items).length){
   const items=element(panel,'ul','');
   for(const item of gift.items)link(element(items,'li',''),item.name,item.url);
  }
 }
 if(panel.children.length)anchor.after(panel);
}
window.DailyTailsFriendSections={preferenceKey,fields,parse,build,render};
})();