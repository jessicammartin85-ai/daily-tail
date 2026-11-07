(()=>{
const cardOptions={cardShape:{"original":"Original","rounded":"Soft rounded","compact":"Rounded rectangle","ticket":"Ticket","folder":"Folder tab","asymmetric":"Asymmetric corners","clipped":"Clipped corners"},cardBorder:{"original":"Original","classic":"Classic outline","stitched":"Stitched","double":"Double frame","accent":"Accent edge","shadow":"Shadow only","top":"Top accent","weighted":"Weighted bottom edge","beveled":"Beveled rim","cream":"Cream outline","stacked":"Stacked paper","brackets":"Corner brackets","rails":"Side rails","bands":"Cream side bands","piping":"Collar piping","perforated":"Perforated edges","rivets":"Corner rivets"}};
cardOptions.mainCardShape=cardOptions.cardShape;
cardOptions.mainCardBorder=cardOptions.cardBorder;
function cardStyles(value){
 const styles={};
 for(const [key,options] of Object.entries(cardOptions)){
  if(value?.[key]&&value[key]!=='original'&&Object.hasOwn(options,value[key]))styles[key]=value[key];
 }
 return styles;
}
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
const trainerTopics=new Set([
 'owner responsibilities and class preparation',
 'clicker training and learning basics',
 'plan short practice sessions',
 'understand canine body language',
 'use cues, shaping, and targeting',
 'apply rewards in everyday life',
 'review progress and next steps'
]);
function isDogSkill(title){
 const normalized=text(title,100).toLowerCase();
 return normalized!==''&&!trainerTopics.has(normalized);
}
function build(extras={}){
 const prefs=parse(extras[preferenceKey]), result={};
 const appearance=cardStyles(parse(extras.dailytail_appearance_v1));
 if(Object.keys(appearance).length)result.appearance=appearance;
 if(prefs.training===true){
  const training=parse(extras.daily_tales_training_plan_v1), program=training.program;
  const lessons=list(program?.lessons);
  if(lessons.length){
   const levels=['Learning with help','Can do it in a quiet setting','Reliable in different settings'];
   const badges=lessons.flatMap(lesson=>{
    if(!isDogSkill(lesson?.title))return [];
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
const badgeCategories=[
 ["social",["Comfort around people and puppies","Petting by another person","Handle mild distractions","Brief handoff to another person","Greet a friendly stranger","Sit politely for petting","Pass another dog politely","Respond calmly to distractions","Supervised separation"]],
 ["handling",["Comfort wearing a collar or harness","Gentle handling and holding","Ear and paw handling","Accept a grooming and handling check"]],
 ["walking",["Walk 15 steps on leash","Pass people on leash","Walk on a loose leash","Walk through a crowd"]],
 ["cues",["Giving up a toy or treat","Sit","Lie down","Come when called from five feet","Sit, down, and stay","Come when called","Build foundation behaviors"]]
];
const badgeIcons={
 "social": "<ellipse cx=\"5\" cy=\"10\" rx=\"2\" ry=\"2.7\"/><ellipse cx=\"9.5\" cy=\"6.5\" rx=\"2\" ry=\"2.7\"/><ellipse cx=\"14.5\" cy=\"6.5\" rx=\"2\" ry=\"2.7\"/><ellipse cx=\"19\" cy=\"10\" rx=\"2\" ry=\"2.7\"/><path d=\"M12 11c-2.4 0-3.1 2.1-5 3.6-3.4 2.7-.9 6.7 2.8 5.2 1.7-.7 2.7-.7 4.4 0 3.7 1.5 6.2-2.5 2.8-5.2-1.9-1.5-2.6-3.6-5-3.6Z\"/>",
 "handling": "<path d=\"M6 12V6a1.25 1.25 0 0 1 2.5 0v5h1V4a1.25 1.25 0 0 1 2.5 0v7h1V5a1.25 1.25 0 0 1 2.5 0v6h1V7a1.25 1.25 0 0 1 2.5 0v7a7 7 0 0 1-13 3.6l-2.4-3.5A1.4 1.4 0 0 1 6 12Z\"/>",
 "walking": "<path d=\"M13 4l8 8-8 8-2-2 4.6-4.5H3v-3h12.6L11 6z\"/>",
 "cues": "<path d=\"m12 2 3.1 6.3 7 .9-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-.9z\"/>",
 "general": "<path d=\"m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z\"/>"
};
const badgeLevels=new Map([
 ['Learning with help','blue'],
 ['Can do it in a quiet setting','yellow'],
 ['Reliable in different settings','green'],
 ['Completed','green']
]);
function render(details,requestDetails){
 const appearance=cardStyles(details?.appearance);
 for(const key of Object.keys(cardOptions)){
  const attribute='friend'+key[0].toUpperCase()+key.slice(1);
  document.body.dataset[attribute]=appearance[key]||'original';
 }
 const previous=document.getElementById('dtSharedExtras');
 const trainingOpen=previous?.querySelector('.dt-shared-training')?.open||false;
 previous?.remove();
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
 if(details.training){
  const t=details.training, badges=list(t.badges).filter(badge=>isDogSkill(badge?.skill));
  const section=element(panel,'details','');
  section.className='dt-shared-detail-card dt-shared-training';
  section.open=trainingOpen;
  const summary=element(section,'summary','');
  element(summary,'strong','🎓 Training');
  if(badges.length)element(summary,'small',badges.length+' '+(badges.length===1?'skill':'skills'));
  if(t.name)element(section,'p',t.name);
  if(badges.length){
   const items=element(section,'ul','');items.className='dt-shared-skill-badges';
   for(const badge of badges){
    const item=element(items,'li','');
    const [category]=badgeCategories.find(([, titles])=>titles.includes(badge.skill))||['general'];
    const medal=element(item,'span','');
    medal.innerHTML=`<svg viewBox="0 0 24 24" focusable="false">${badgeIcons[category]}</svg>`;
    medal.className='dt-skill-medal '+category+' '+(badgeLevels.get(badge.level)||'blue');
    medal.setAttribute('aria-hidden','true');
    element(item,'strong',badge.skill);
    element(item,'span',badge.level);
   }
  }else if(t.mastered)element(section,'p',t.mastered+' skills mastered');
  else element(section,'p','No skill badges shared yet.');
 }
 const hasEvents=['hosting','attending'].some(key=>list(details[key]).some(event=>Date.parse(event.date)>=Date.now()));
 const gift=details.gifts;
 const giftUrl=url(gift?.externalUrl);
 const giftItems=list(gift?.items);
 if(hasEvents||giftUrl||giftItems.length){
  const section=element(panel,'section','');
  section.className='dt-shared-detail-card';
  const header=element(section,'div','');
  header.className='dt-shared-events-header';
  element(header,'h2','Events');
  if(giftItems.length){
   const button=element(header,'button','🎁 Gift List');
   button.type='button';
   button.className='dt-shared-gift-button';
   button.setAttribute('aria-haspopup','dialog');

   const dialog=element(section,'dialog','');
   dialog.className='dt-shared-gift-dialog';
   dialog.setAttribute('aria-labelledby','dtSharedGiftTitle');
   const title=element(dialog,'h2',text(gift.title,100)||'Gift List');
   title.id='dtSharedGiftTitle';
   const close=element(dialog,'button','Close');
   close.type='button';
   close.className='dt-shared-gift-button';
   close.onclick=()=>dialog.close();
   button.onclick=()=>dialog.showModal();

   if(giftUrl)link(dialog,'Open external gift list ↗',giftUrl,'dt-shared-gift-action');
   const items=element(dialog,'ul','');
   for(const item of giftItems)link(element(items,'li',''),item.name,item.url);
  }else if(giftUrl){
   link(header,'🎁 Gift List ↗',giftUrl,'dt-shared-gift-button');
  }
  for(const [key,label] of fields.filter(([key])=>key==='hosting'||key==='attending')){
   const events=list(details[key]).filter(event=>Date.parse(event.date)>=Date.now());
   if(!events.length)continue;
   element(section,'h3',label);
   const items=element(section,'ul','');
   for(const event of events){
    const row=element(items,'li',event.title+' · '+new Date(event.date).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}));
    if(key==='hosting'&&event.id&&requestDetails){
     const button=element(row,'button','Request Details');button.type='button';button.className='small';button.style.marginInlineStart='8px';button.onclick=()=>requestDetails(event);
    }
   }
  }
  if(!hasEvents)element(section,'p','No upcoming events shared.');
 }
 if(panel.children.length)anchor.after(panel);
}
window.DailyTailsFriendSections={preferenceKey,fields,parse,build,render,cardOptions};
})();