
/* Android content:// and file previews may disallow localStorage; use temporary memory to load safely. */
const dtSafeStorage=(()=>{
 const memory=new Map();
 const fallback={
   getItem:k=>memory.has(String(k))?memory.get(String(k)):null,
   setItem:(k,v)=>{memory.set(String(k),String(v))},
   removeItem:k=>memory.delete(String(k)),
   clear:()=>memory.clear(),
   key:i=>Array.from(memory.keys())[i]??null,
   get length(){return memory.size}
 };
 try{
   const store=window.localStorage, key='__daily_tail_storage_probe__';
   store.setItem(key,'ok');store.removeItem(key);
   window.__dtPersistentStorage=true;
   return store;
 }catch(error){
   window.__dtPersistentStorage=false;
   console.warn('Daily Tail: browser storage unavailable; data is temporary. Use backup and open in Chrome from a stable site.');
   return fallback;
 }
})();

const KEY='loubear_memorybook_v1';let state={profile:'',posts:[]};try{const saved=JSON.parse(dtSafeStorage.getItem(KEY));if(saved&&Array.isArray(saved.posts))state={...state,...saved}}catch{};const $=id=>document.getElementById(id);let panel='';const APPMETA_KEY='dailytail_app_meta_v1';let appMeta={petName:'Lou Bear'};try{const meta=JSON.parse(dtSafeStorage.getItem(APPMETA_KEY));if(meta&&typeof meta==='object')appMeta={...appMeta,...meta}}catch{};function saveMeta(){try{dtSafeStorage.setItem(APPMETA_KEY,JSON.stringify(appMeta))}catch{}}function renderTagName(){
 const el=$('tagName'), tag=$('tag');if(!el||!tag)return;
 const name=(appMeta.petName||'Lou Bear').trim()||'Lou Bear';
 el.textContent=name;el.title=name;
 const fit=()=>{
  const tagWidth=tag.clientWidth,tagHeight=tag.clientHeight;
  if(!tagWidth||!tagHeight)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  const letters=[...name].length,availableWidth=tagWidth*.60-5;
  const availableHeight=tagHeight*.22;
  const spacing=letters>15?.004:letters>9?.015:.02;
  const maxSize=Math.min(tagWidth*.18,availableHeight*.98,30);
  let fontSize=maxSize;
  while(fontSize>5.5){
   ctx.font=`700 ${fontSize}px Georgia`;
   const textWidth=ctx.measureText(name).width+Math.max(0,letters-1)*spacing*fontSize;
   if(textWidth<=availableWidth)break;
   fontSize-=.2;
  }
  el.style.setProperty('--tag-fit-size',Math.max(5.5,fontSize).toFixed(2)+'px');
  el.style.letterSpacing=spacing+'em';
 };
 fit();requestAnimationFrame(fit);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
}
window.addEventListener('resize',renderTagName);function howToUse(){show('How to Use Daily Tail',`<p class="intro">Use this home screen as a quick snapshot of your pet’s day.</p><ul><li><strong>Up Next:</strong> Check off the next activity right from the home screen or tap the activity name to open the full Daily Plan.</li><li><strong>Daily Plan:</strong> View the full schedule for food, potty breaks, naps, training, play, and socialization.</li><li><strong>Training:</strong> See age-appropriate skills, cue guides, and tutorial videos.</li><li><strong>Emergency Info:</strong> Keep veterinary and emergency contact details in one place.</li><li><strong>Recents:</strong> Open the memory feed from the Recents box.</li><li><strong>Profile:</strong> Tap the Profile box to manage the photo, birthday, and breed.</li><li><strong>Tag:</strong> Tap the silver bone tag to change the engraved pet name.</li></ul><p class="muted">Everything saves only on this browser for now.</p>`,`howto`)}function editTagName(message=''){show('Edit Tag Name',`<p class="muted">Choose the name engraved on the silver tag.</p><form id="tagNameForm"><label class="field">Pet name<input id="petTagInput" type="text" maxlength="24" value="${safe(appMeta.petName||'Lou Bear')}" placeholder="Lou Bear" autocomplete="off"></label><button class="primary" type="submit">Save name</button><p class="muted" id="tagStatus" role="status" aria-live="polite">${safe(message)}</p></form>`,`tagedit`);$('petTagInput').focus();$('petTagInput').select();$('tagNameForm').onsubmit=e=>{e.preventDefault();const val=($('petTagInput').value||'').trim()||'Lou Bear';appMeta.petName=val;if(typeof dtAccess!=='undefined'&&dtDog()){dtDog().name=val;dtStore()}saveMeta();renderTagName();editTagName('Tag name saved.')}}renderTagName();function save(){try{dtSafeStorage.setItem(KEY,JSON.stringify(state))}catch{alert('Your browser storage is full. Try smaller photos or export the memories for safekeeping.')}}function safe(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function refresh(){const p=$('profileThumb'),placeholder=$('portraitPlaceholder');if(state.profile){p.src=state.profile;p.style.display='block';placeholder.style.display='none'}else{p.removeAttribute('src');p.style.display='none';placeholder.style.display='flex'}const latest=state.posts[0];const heading=$('recentPostTitle'),summary=$('recentPostSummary'),thumb=$('recentPostThumb');if(latest){heading.textContent=latest.title||'Recent memory';const raw=String(latest.story||'').trim();summary.textContent=raw?raw.slice(0,90):'Tap to view this memory and past posts';if(latest.photo){thumb.src=latest.photo;thumb.hidden=false;}else{thumb.hidden=true;thumb.removeAttribute('src');}}else{heading.textContent='Your first memory';summary.textContent='Tap to share or explore memories';thumb.hidden=true;thumb.removeAttribute('src');}}function show(title,body,type){
 panel=type;
 $('sheetTitle').textContent=title;
 const content=$('content'),sheet=content.closest('.sheet');
 const oldAction=sheet?.querySelector('.dt-post-sheet-actions');
 if(oldAction)oldAction.remove();
 content.innerHTML=body;
 $('overlay').classList.toggle('dt-post-overlay',type==='add');
 if(type==='add'&&sheet){
   const inlineSubmit=content.querySelector('#postForm button[type="submit"]');
   if(inlineSubmit)inlineSubmit.remove();
   const action=document.createElement('div');
   action.className='dt-post-sheet-actions';
   const submit=document.createElement('button');
   submit.type='submit';submit.className='primary dt-post-save';
   submit.setAttribute('form','postForm');
   submit.textContent='Post this memory ♡';
   action.append(submit);
   sheet.append(action);
 }
 $('overlay').classList.add('open');
 const scroller=type==='add'?content:sheet;
 if(scroller)scroller.scrollTop=0;
 $('close').focus({preventScroll:true});
}function close(){panel='';$('overlay').classList.remove('open')}function readPhoto(file,callback){if(!file)return;const fr=new FileReader;fr.onload=()=>{const im=new Image;im.onload=()=>{const c=document.createElement('canvas');const scale=Math.min(1,1100/im.width,1100/im.height);c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);callback(c.toDataURL('image/jpeg',.88),{width:c.width,height:c.height})};im.src=fr.result};fr.readAsDataURL(file)}
let profileDraft=null;
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function openProfileEditor(dataUrl){
 const wrap=$('profileEditor'), img=$('profileCropImg');
 if(!wrap||!img)return;
 wrap.hidden=false;
 wrap.scrollIntoView({block:'nearest',behavior:'smooth'});
 const loader=new Image();
 loader.onload=()=>{
  const frame=Math.min(240,Math.max(200,Math.round(Math.min(window.innerWidth||390,390)*.62)));
  profileDraft={src:dataUrl,naturalWidth:loader.width,naturalHeight:loader.height,frame,zoom:1,x:0,y:0,minZoom:1,maxZoom:3};
  $('profileZoom').value='1';
  $('profileX').value='0';
  $('profileY').value='0';
  $('profileCropCircle').style.width=frame+'px';
  $('profileCropCircle').style.height=frame+'px';
  img.src=dataUrl;
  fitProfileBounds();
  renderProfileEditor();
  setupProfileDrag();
  $('saveProfilePhoto').disabled=false;
  $('cancelProfilePhoto').disabled=false;
 };
 loader.src=dataUrl;
}
function fitProfileBounds(){
 if(!profileDraft)return;
 const base=Math.max(profileDraft.frame/profileDraft.naturalWidth,profileDraft.frame/profileDraft.naturalHeight);
 profileDraft.baseScale=base;
 const shownW=profileDraft.naturalWidth*base*profileDraft.zoom;
 const shownH=profileDraft.naturalHeight*base*profileDraft.zoom;
 const maxX=Math.max(0,(shownW-profileDraft.frame)/2);
 const maxY=Math.max(0,(shownH-profileDraft.frame)/2);
 profileDraft.maxX=maxX;profileDraft.maxY=maxY;
 profileDraft.x=clamp(profileDraft.x,-maxX,maxX);
 profileDraft.y=clamp(profileDraft.y,-maxY,maxY);
 if($('profileX'))$('profileX').max=Math.round(maxX);
 if($('profileX'))$('profileX').min=Math.round(-maxX);
 if($('profileY'))$('profileY').max=Math.round(maxY);
 if($('profileY'))$('profileY').min=Math.round(-maxY);
}
function renderProfileEditor(){
 if(!profileDraft)return;
 const img=$('profileCropImg'); if(!img)return;
 fitProfileBounds();
 const w=profileDraft.naturalWidth*profileDraft.baseScale;
 const h=profileDraft.naturalHeight*profileDraft.baseScale;
 img.style.width=w+'px'; img.style.height=h+'px';
 img.style.transform=`translate(calc(-50% + ${profileDraft.x}px), calc(-50% + ${profileDraft.y}px)) scale(${profileDraft.zoom})`;
 if($('profileZoom'))$('profileZoom').value=String(profileDraft.zoom);
 if($('profileX'))$('profileX').value=String(Math.round(profileDraft.x));
 if($('profileY'))$('profileY').value=String(Math.round(profileDraft.y));
}
function setupProfileDrag(){
 const circle=$('profileCropCircle');if(!circle||circle.dataset.dragReady==='1')return;
 circle.dataset.dragReady='1';
 let pointerId=null,startX=0,startY=0,originX=0,originY=0;
 circle.addEventListener('pointerdown',e=>{
  if(!profileDraft)return;
  e.preventDefault();pointerId=e.pointerId;
  startX=e.clientX;startY=e.clientY;
  originX=profileDraft.x;originY=profileDraft.y;
  circle.setPointerCapture(e.pointerId);
 });
 circle.addEventListener('pointermove',e=>{
  if(pointerId!==e.pointerId||!profileDraft)return;
  profileDraft.x=originX+e.clientX-startX;
  profileDraft.y=originY+e.clientY-startY;
  renderProfileEditor();
 });
 const end=e=>{if(e.pointerId===pointerId)pointerId=null};
 circle.addEventListener('pointerup',end);
 circle.addEventListener('pointercancel',end);
}
function commitProfilePhoto(){
 if(!profileDraft)return;
 const draft={...profileDraft};
 const out=700,c=document.createElement('canvas');c.width=out;c.height=out;
 const ctx=c.getContext('2d');
 const factor=out/draft.frame;
 // Draw in exactly the same coordinate system as the circular editor,
 // then scale the entire composition to the 700px exported square.
 const drawW=draft.naturalWidth*draft.baseScale*draft.zoom*factor;
 const drawH=draft.naturalHeight*draft.baseScale*draft.zoom*factor;
 const x=(out-drawW)/2+draft.x*factor;
 const y=(out-drawH)/2+draft.y*factor;
 const img=new Image();
 img.onload=()=>{
  // The image covers every pixel of this square; there are no empty black corners.
  ctx.fillStyle='#dbe4ea';ctx.fillRect(0,0,out,out);
  ctx.drawImage(img,x,y,drawW,drawH);
  const saved=c.toDataURL('image/jpeg',.9);
  if(window.dtRole==='child'){
    dtQueue({kind:'photo',image:saved,by:window.dtPerson||'Child'});
    profile('Photo submitted for adult approval. It will not appear until approved.');
    return;
  }
  state.profile=saved;
  save();refresh();profile('Profile photo saved. You can choose another photo to adjust it again.');
 };
 img.onerror=()=>{const status=$('profileStatus');if(status)status.textContent='Unable to save this photo. Please choose it again.'};
 img.src=draft.src;
}

function getProfileDetails(){
 let dog=null;try{if(typeof dtDog==='function')dog=dtDog()}catch{}
 const meta=dog?.meta||appMeta||{};
 let legacy={};try{legacy=JSON.parse(dtSafeStorage.getItem('loubear_training_v1'))||{}}catch{}
 let oldDob=legacy.dob||'';try{oldDob=dtSafeStorage.getItem('loubear_birthday_v2')||oldDob}catch{}
 // The selected dog's saved metadata always takes priority. Never use another dog's birthday.
 if(dog)return {dob:meta.dob||'',breed:meta.breed||''};
 return {dob:meta.dob||(window.LouProfile?.dob)||oldDob,breed:meta.breed||(window.LouProfile?.breed)||legacy.breed||''};
}

// Expanded breed directory: common AKC breeds and popular non-AKC mixes.
const BREED_DIRECTORY=[{"id":"affenpinscher","name":"Affenpinscher"},{"id":"afghan-hound","name":"Afghan Hound"},{"id":"airedale-terrier","name":"Airedale Terrier"},{"id":"akita","name":"Akita"},{"id":"alaskan-malamute","name":"Alaskan Malamute"},{"id":"american-eskimo-dog","name":"American Eskimo Dog"},{"id":"american-hairless-terrier","name":"American Hairless Terrier"},{"id":"american-staffordshire-terrier","name":"American Staffordshire Terrier"},{"id":"anatolian-shepherd-dog","name":"Anatolian Shepherd Dog"},{"id":"australian-cattle-dog","name":"Australian Cattle Dog"},{"id":"australian-shepherd","name":"Australian Shepherd"},{"id":"australian-terrier","name":"Australian Terrier"},{"id":"basenji","name":"Basenji"},{"id":"basset-hound","name":"Basset Hound"},{"id":"beagle","name":"Beagle"},{"id":"bearded-collie","name":"Bearded Collie"},{"id":"belgian-malinois","name":"Belgian Malinois"},{"id":"belgian-sheepdog","name":"Belgian Sheepdog"},{"id":"belgian-tervuren","name":"Belgian Tervuren"},{"id":"bernedoodle","name":"Bernedoodle"},{"id":"bernese-mountain-dog","name":"Bernese Mountain Dog"},{"id":"bichon-frise","name":"Bichon Frise"},{"id":"biewer-terrier","name":"Biewer Terrier"},{"id":"bloodhound","name":"Bloodhound"},{"id":"border-collie","name":"Border Collie"},{"id":"border-terrier","name":"Border Terrier"},{"id":"boston-terrier","name":"Boston Terrier"},{"id":"boxer","name":"Boxer"},{"id":"boykin-spaniel","name":"Boykin Spaniel"},{"id":"brittany","name":"Brittany"},{"id":"brussels-griffon","name":"Brussels Griffon"},{"id":"bull-terrier","name":"Bull Terrier"},{"id":"bulldog","name":"Bulldog"},{"id":"bullmastiff","name":"Bullmastiff"},{"id":"cairn-terrier","name":"Cairn Terrier"},{"id":"cane-corso","name":"Cane Corso"},{"id":"cardigan-welsh-corgi","name":"Cardigan Welsh Corgi"},{"id":"cavalier","name":"Cavalier King Charles Spaniel"},{"id":"cavapoo","name":"Cavapoo"},{"id":"chesapeake-bay-retriever","name":"Chesapeake Bay Retriever"},{"id":"chihuahua","name":"Chihuahua"},{"id":"chinese-crested","name":"Chinese Crested"},{"id":"chinese-shar-pei","name":"Chinese Shar-Pei"},{"id":"chiweenie","name":"Chiweenie"},{"id":"chow-chow","name":"Chow Chow"},{"id":"cockapoo","name":"Cockapoo"},{"id":"cocker","name":"Cocker Spaniel"},{"id":"collie","name":"Collie"},{"id":"coton-de-tulear","name":"Coton de Tulear"},{"id":"dachshund","name":"Dachshund"},{"id":"dalmatian","name":"Dalmatian"},{"id":"doberman-pinscher","name":"Doberman Pinscher"},{"id":"english-cocker-spaniel","name":"English Cocker Spaniel"},{"id":"english-setter","name":"English Setter"},{"id":"english-springer-spaniel","name":"English Springer Spaniel"},{"id":"english-toy-spaniel","name":"English Toy Spaniel"},{"id":"flat-coated-retriever","name":"Flat-Coated Retriever"},{"id":"frenchie","name":"French Bulldog"},{"id":"german-shepherd-dog","name":"German Shepherd Dog"},{"id":"german-shorthaired-pointer","name":"German Shorthaired Pointer"},{"id":"german-wirehaired-pointer","name":"German Wirehaired Pointer"},{"id":"giant-schnauzer","name":"Giant Schnauzer"},{"id":"golden","name":"Golden Retriever"},{"id":"doodle","name":"Goldendoodle"},{"id":"gordon-setter","name":"Gordon Setter"},{"id":"great-dane","name":"Great Dane"},{"id":"great-pyrenees","name":"Great Pyrenees"},{"id":"greyhound","name":"Greyhound"},{"id":"havanese","name":"Havanese"},{"id":"irish-setter","name":"Irish Setter"},{"id":"irish-wolfhound","name":"Irish Wolfhound"},{"id":"italian-greyhound","name":"Italian Greyhound"},{"id":"japanese-chin","name":"Japanese Chin"},{"id":"keeshond","name":"Keeshond"},{"id":"labradoodle","name":"Labradoodle"},{"id":"labrador","name":"Labrador Retriever"},{"id":"lagotto-romagnolo","name":"Lagotto Romagnolo"},{"id":"lhasa-apso","name":"Lhasa Apso"},{"id":"maltese","name":"Maltese"},{"id":"maltipoo","name":"Maltipoo"},{"id":"mastiff","name":"Mastiff"},{"id":"miniature-american-shepherd","name":"Miniature American Shepherd"},{"id":"miniature-pinscher","name":"Miniature Pinscher"},{"id":"miniature-schnauzer","name":"Miniature Schnauzer"},{"id":"mixed-breed-rescue","name":"Mixed breed / rescue"},{"id":"newfoundland","name":"Newfoundland"},{"id":"norwegian-elkhound","name":"Norwegian Elkhound"},{"id":"old-english-sheepdog","name":"Old English Sheepdog"},{"id":"other","name":"Other / not listed"},{"id":"papillon","name":"Papillon"},{"id":"pekingese","name":"Pekingese"},{"id":"pembroke-welsh-corgi","name":"Pembroke Welsh Corgi"},{"id":"pointer","name":"Pointer"},{"id":"pomeranian","name":"Pomeranian"},{"id":"pomsky","name":"Pomsky"},{"id":"poodle-miniature","name":"Poodle (Miniature)"},{"id":"poodle","name":"Poodle (Standard)"},{"id":"poodle-toy","name":"Poodle (Toy)"},{"id":"portuguese-water-dog","name":"Portuguese Water Dog"},{"id":"pug","name":"Pug"},{"id":"puggle","name":"Puggle"},{"id":"rat-terrier","name":"Rat Terrier"},{"id":"rhodesian-ridgeback","name":"Rhodesian Ridgeback"},{"id":"rottweiler","name":"Rottweiler"},{"id":"russell-terrier","name":"Russell Terrier"},{"id":"saint-bernard","name":"Saint Bernard"},{"id":"samoyed","name":"Samoyed"},{"id":"schipperke","name":"Schipperke"},{"id":"schnoodle","name":"Schnoodle"},{"id":"scottish-terrier","name":"Scottish Terrier"},{"id":"shetland-sheepdog","name":"Shetland Sheepdog"},{"id":"shiba-inu","name":"Shiba Inu"},{"id":"shih-tzu","name":"Shih Tzu"},{"id":"siberian-husky","name":"Siberian Husky"},{"id":"soft-coated-wheaten-terrier","name":"Soft Coated Wheaten Terrier"},{"id":"staffordshire-bull-terrier","name":"Staffordshire Bull Terrier"},{"id":"standard-schnauzer","name":"Standard Schnauzer"},{"id":"tibetan-terrier","name":"Tibetan Terrier"},{"id":"vizsla","name":"Vizsla"},{"id":"weimaraner","name":"Weimaraner"},{"id":"west-highland-white-terrier","name":"West Highland White Terrier"},{"id":"whippet","name":"Whippet"},{"id":"wirehaired-pointing-griffon","name":"Wirehaired Pointing Griffon"},{"id":"yorkshire-terrier","name":"Yorkshire Terrier"}];
const BREED_BY_ID=Object.fromEntries(BREED_DIRECTORY.map(b=>[b.id,b.name]));
function breedName(id){return BREED_BY_ID[id]||'Mixed breed / rescue';}
function breedOptions(selected){return `<option value="">Choose a breed</option>${BREED_DIRECTORY.map(b=>`<option value="${safe(b.id)}" ${b.id===selected?'selected':''}>${safe(b.name)}</option>`).join('')}`;}
function breedGroup(id){const n=breedName(id).toLowerCase();if(/bulldog|pug|pekingese|boston terrier|brussels griffon|shih tzu|japanese chin|dogue de bordeaux/.test(n))return 'shortnose';if(/dachshund|corgi|basset hound/.test(n))return 'longback';if(/poodle|doodle|cockapoo|cavapoo|maltipoo|schnauzer|bichon|shih tzu|yorkshire|havanese|maltese|coton|terrier|lhasa/.test(n))return 'coat';if(/border collie|australian cattle|australian shepherd|shepherd|malinois|heeler|sheepdog|collie|corgi/.test(n))return 'herding';if(/beagle|hound|spaniel|retriever|pointer|setter|vizsla|weimaraner|brittany|water dog|griffon|bloodhound/.test(n))return 'scent';if(/husky|malamute|samoyed|shiba inu|akita|spitz|elkhound|pomsky/.test(n))return 'northern';if(/great dane|mastiff|saint bernard|newfoundland|great pyrenees|bernese|cane corso|rottweiler|leonberger/.test(n))return 'large';return 'general';}
function breedAdvice(id){const name=breedName(id);const notes={shortnose:'Some short-muzzled dogs are less tolerant of heat and strenuous exercise. Favor calm indoor practice, watch breathing, and ask your vet about exercise safety.',longback:'Build calm leash manners and safe handling; avoid repeated jumping from furniture. Ask your veterinarian about appropriate weight and spine protection.',coat:'Practice gentle, reward-based brushing and handling of ears, feet and face. Grooming needs vary by coat and individual dog.',herding:'Offer short thinking games, impulse-control practice, quiet settling and low-impact play. Avoid encouraging chasing children or moving vehicles.',scent:'Use sniffing games, recall practice and reward-based leash skills. Allow safe opportunities to explore scents.',northern:'Practice recall in secure areas, reward voluntary check-ins, and provide calm enrichment; do not assume off-leash reliability.',large:'Prioritize calm greetings, cooperative handling and low-impact exercise while growing. Ask your veterinarian about size-appropriate activity.',general:'Choose short positive sessions, enrichment and calm handling, then tailor activities to your individual dog.'};return `${name}: ${notes[breedGroup(id)]} Breed patterns are guides, not guarantees.`;}

function profile(message=''){
const t=getProfileDetails();const maxDate=new Date().toLocaleDateString('en-CA');
const dogName=String(appMeta.petName||dtDog()?.name||'Your Dog').trim()||'Your Dog';
show(`${dogName}’s Profile`,`<p class="intro">Add a photo and details for ${safe(dogName)}. Saved breed, birthday, and shared facts will appear for this dog in Friend View.</p>${state.profile?`<img class="preview-img" src="${state.profile}" alt="Current profile picture">`:''}<label class="field upload">Choose ${safe(dogName)}’s photo<input id="profileFile" type="file" accept="image/*"></label><div id="profileEditor" class="profile-editor" hidden><h3>Adjust profile photo</h3><p>Drag the photo inside the circle to reposition it. Use the sliders to zoom or fine-tune the placement, then save to lock it in.</p><div class="profile-crop-wrap"><div class="profile-crop-circle" id="profileCropCircle" aria-label="Profile photo crop preview"><img id="profileCropImg" alt="Profile photo crop preview"></div></div><div class="profile-editor-grid"><label class="field-range">Zoom<input id="profileZoom" type="range" min="1" max="3" step="0.01" value="1"></label><label class="field-range">Left / right<input id="profileX" type="range" min="-120" max="120" step="1" value="0"></label><label class="field-range">Up / down<input id="profileY" type="range" min="-120" max="120" step="1" value="0"></label></div><div class="profile-editor-actions"><button class="primary" type="button" id="saveProfilePhoto" disabled>Save photo</button><button class="small" type="button" id="cancelProfilePhoto" disabled>Cancel</button></div><p class="profile-help">The circle previews exactly what will be saved. If your previous photo has black space, choose the original photo again to replace it.</p></div><form id="louDetailsForm"><label class="field">Birthday<input id="louDob" type="date" value="${safe(t.dob)}" max="${maxDate}" required></label><label class="field">Search breeds<input id="breedSearch" type="search" placeholder="e.g., Collie, Poodle, mix" autocomplete="off"></label><label class="field">Breed <small class="muted">(${BREED_DIRECTORY.length} breeds and mixes)</small><select id="louBreed" required>${breedOptions(t.breed||'')}</select></label><h3 class="profile-section-title">Details visible to friends</h3><p class="muted profile-sharing-help">Breed, birthday (with age), and a fun fact appear on the Friend View. These details are saved separately for each dog.</p><label class="field">Personality <input id="louPersonality" maxlength="85" value="${safe(appMeta.personality||'')}" placeholder="Gentle, playful, loves cuddles"></label><label class="field">Favorite things <input id="louFavorites" maxlength="85" value="${safe(appMeta.favorites||'')}" placeholder="Tennis balls, naps, neighborhood walks"></label><label class="field">Cute fact or saying (shown in Friend View) <input id="louCuteFact" maxlength="100" value="${safe(appMeta.cuteFact||'')}" placeholder="Professional napper and part-time sock thief"></label><div class="profile-save-bar"><button class="primary" id="profileSaveButton" type="submit">Save Profile Changes</button><span class="profile-save-hint">Updates Friend View when saved</span></div><p class="muted" id="profileStatus" role="status" aria-live="polite">${safe(message)}</p></form>${state.profile?'<button class="small" id="removeProfile">Remove photo</button>':''}<p class="muted">This offline version saves each dog’s details in this browser. Use Back up to keep a recovery copy.</p>`,'profile');
$('breedSearch').oninput=e=>{const term=e.target.value.trim().toLowerCase();const select=$('louBreed'),chosen=select.value;const matches=BREED_DIRECTORY.filter(b=>b.name.toLowerCase().includes(term)||b.id.includes(term));select.innerHTML=`<option value="">${matches.length?'Choose a matching breed':'No matching breeds'}</option>`+matches.map(b=>`<option value="${safe(b.id)}">${safe(b.name)}</option>`).join('');if(matches.some(b=>b.id===chosen))select.value=chosen;else if(matches.length===1)select.value=matches[0].id;};
$('profileFile').onchange=e=>{const file=e.target.files[0];if(!file)return;readPhoto(file,url=>openProfileEditor(url));};
$('profileZoom').oninput=e=>{if(!profileDraft)return;profileDraft.zoom=clamp(parseFloat(e.target.value)||1,profileDraft.minZoom,profileDraft.maxZoom);renderProfileEditor();};
$('profileX').oninput=e=>{if(!profileDraft)return;profileDraft.x=parseFloat(e.target.value)||0;renderProfileEditor();};
$('profileY').oninput=e=>{if(!profileDraft)return;profileDraft.y=parseFloat(e.target.value)||0;renderProfileEditor();};
$('saveProfilePhoto').onclick=()=>commitProfilePhoto();
$('cancelProfilePhoto').onclick=()=>{profileDraft=null;const wrap=$('profileEditor');if(wrap)wrap.hidden=true;const input=$('profileFile');if(input)input.value='';$('profileStatus').textContent='Photo adjustment canceled.';};
if($('removeProfile'))$('removeProfile').onclick=()=>{state.profile='';save();refresh();profile('Profile photo removed.');};
$('louDetailsForm').onsubmit=e=>{e.preventDefault();const dob=$('louDob').value,breed=$('louBreed').value,parsed=new Date(dob+'T12:00:00');if(!dob||!Number.isFinite(parsed.getTime())||parsed>new Date()){$('profileStatus').textContent='Please enter a valid birthday.';return;}
window.LouProfile={dob,breed};
appMeta.dob=dob;appMeta.breed=breed;
appMeta.personality=$('louPersonality').value.trim().slice(0,85);
appMeta.favorites=$('louFavorites').value.trim().slice(0,85);
appMeta.cuteFact=$('louCuteFact').value.trim().slice(0,100);
saveMeta();
let saved=false;try{const existing=JSON.parse(dtSafeStorage.getItem('loubear_training_v1'))||{};dtSafeStorage.setItem('loubear_training_v1',JSON.stringify({...existing,dob,breed}));dtSafeStorage.setItem('loubear_birthday_v2',dob);saved=dtSafeStorage.getItem('loubear_birthday_v2')===dob;}catch{}
window.dispatchEvent(new Event('lou-profile-updated'));
syncFriendView({keepModal:true});
$('profileStatus').textContent=window.__dtPersistentStorage===false?'Changes are visible for this session, but browser storage is blocked. Save a backup before closing.':'✓ Profile saved! Friend View now uses the selected dog’s breed, birthday and fun fact.';
};
}
function add(){show('Share a memory',`<p class="intro">A photo, a funny moment, or a little update about Lou Bear.</p><form id="postForm"><label class="field">Title<input name="title" maxlength="100" placeholder="Today's adventure" required></label><label class="field">Your update<textarea name="story" maxlength="2000" placeholder="What happened today?"></textarea></label><label class="field upload">Add a photo (optional)<input name="photo" type="file" accept="image/*"></label><img id="draftPhoto" class="preview-img" style="display:none" alt="Photo preview"><button class="primary" type="submit">Post this memory ♡</button></form>`,'add');let photo='';$('postForm').elements.photo.onchange=e=>readPhoto(e.target.files[0],url=>{photo=url;$('draftPhoto').src=url;$('draftPhoto').style.display='block'});$('postForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget;if(!f.elements.title.value.trim())return;const newMemory={id:Date.now().toString()+Math.random().toString(36).slice(2),title:f.elements.title.value.trim(),story:f.elements.story.value.trim(),photo,date:new Date().toISOString(),likes:0,comments:[]};if(window.dtRole==='child'){dtQueue({kind:'post',post:newMemory,by:window.dtPerson||'Child'});show('Waiting for approval','<p>Your memory was sent to the adult owner for approval. It will appear after approval.</p>','queued')}else{state.posts.unshift(newMemory);save();refresh();feed()}}}
function feed(){show('Recent memories',`<p class="muted">A shared little scrapbook for photos, updates, hearts, and comments. <button class="small" id="newPost">＋ Add a memory</button></p><div class="feed">${state.posts.length?state.posts.map(post=>`<article class="post" data-id="${safe(post.id)}">${post.photo?`<img src="${post.photo}" alt="Photo shared with this memory">`:''}<div class="post-body"><time>${new Date(post.date).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</time><h3>${safe(post.title)}</h3>${post.story?`<p>${safe(post.story)}</p>`:''}<div class="post-actions"><button class="small like" data-id="${safe(post.id)}" aria-label="Love this memory">♡ ${post.likes||0}</button><button class="small delete" data-id="${safe(post.id)}">Delete</button></div><div class="comments">${(post.comments||[]).map(c=>`<div class="comment">💬 ${safe(c)}</div>`).join('')}<form class="comment-entry" data-id="${safe(post.id)}"><input aria-label="Write a comment" placeholder="Leave a little note..." maxlength="280" required><button class="small" type="submit">Send</button></form></div></div></article>`).join(''):'<div class="empty"><strong>No memories posted yet.</strong><p>Your first photo or little update will appear here.</p></div>'}</div><p class="muted">Prototype note: Posts and pictures are saved in this browser only, not yet shared across devices.</p>`,'feed');$('newPost').onclick=add;document.querySelectorAll('.like').forEach(el=>el.onclick=()=>{let p=state.posts.find(x=>x.id===el.dataset.id);p.likes=(p.likes||0)+1;save();feed()});document.querySelectorAll('.delete').forEach(el=>el.onclick=()=>{if(confirm('Remove this memory?')){state.posts=state.posts.filter(x=>x.id!==el.dataset.id);save();refresh();feed()}});document.querySelectorAll('.comment-entry').forEach(el=>el.onsubmit=e=>{e.preventDefault();let input=el.querySelector('input'),p=state.posts.find(x=>x.id===el.dataset.id);if(input.value.trim()){p.comments.push(input.value.trim());save();feed()}})}

/* Emergency information stays on this device, separate from Recents. */
const EMERGENCY_KEY='loubear_emergency_info_v1';
function getEmergency(){try{const v=JSON.parse(dtSafeStorage.getItem(EMERGENCY_KEY));return v&&typeof v==='object'?v:{}}catch{return {}}}
function phoneLink(number){const digits=String(number||'').replace(/[^0-9+]/g,'');return digits.length>=7&&digits.length<=16?'tel:'+digits:''}
function emergencyInfo(message=''){
 const d=getEmergency();
 const fld=(id,label,placeholder='')=>`<label class="field">${label}<input id="em_${id}" value="${safe(d[id]||'')}" placeholder="${safe(placeholder)}" autocomplete="off"></label>`;
 const txt=(id,label,placeholder='')=>`<label class="field">${label}<textarea id="em_${id}" placeholder="${safe(placeholder)}">${safe(d[id]||'')}</textarea></label>`;
 const action=(number,label)=>{const href=phoneLink(number);return href?`<a href="${safe(href)}">Call ${safe(label)}</a>`:''};
 show('Emergency Info',`<p class="muted">Keep Lou’s essential information in one place for family members or pet sitters. Enter your own veterinarian and emergency clinic details.</p>
 <div class="emergency-card"><h3>Quick contacts</h3><div class="emergency-actions">${action(d.vetPhone,'Regular Vet')}${action(d.erPhone,'Emergency Vet')}${action(d.contactPhone,'Family Contact')}</div>${!d.vetPhone&&!d.erPhone&&!d.contactPhone?'<p class="muted">Save phone numbers below to add tap-to-call links.</p>':''}<p class="muted"><strong>Emergency:</strong> For collapse, breathing trouble, seizures, serious injury, or suspected poisoning, contact a veterinarian or emergency clinic immediately. Do not wait for an app response. Do not induce vomiting unless a veterinarian directs you to.</p></div>
 <form id="emergencyForm"><div class="emergency-card"><h3>Veterinary care</h3>${fld('vetName','Regular veterinarian / clinic','Clinic name')}${fld('vetPhone','Regular vet phone','Phone number')}${fld('erName','24-hour emergency clinic','Clinic name')}${fld('erPhone','Emergency vet phone','Phone number')}${fld('erAddress','Emergency clinic address','Street and city')}</div>
 <div class="emergency-card"><h3>Lou’s important details</h3>${fld('contactName','Family emergency contact','Name')}${fld('contactPhone','Family contact phone','Phone number')}${fld('microchip','Microchip number (optional)','Number')}${txt('medications','Current medications / doses','List medications and directions, if any')}${txt('allergies','Allergies or medical alerts','List known allergies or concerns, if any')}${txt('notes','Additional care instructions','Helpful notes for a pet sitter or emergency visit')}</div><button class="primary" type="submit">Save Emergency Info</button><p id="emergencyStatus" class="emergency-status" role="status">${safe(message)}</p></form><p class="muted">This information is saved only in this browser, not synced to other devices. Keep your veterinary records accessible separately.</p>`,'emergency');
 $('emergencyForm').onsubmit=e=>{e.preventDefault();const values={};['vetName','vetPhone','erName','erPhone','erAddress','contactName','contactPhone','microchip','medications','allergies','notes'].forEach(k=>values[k]=$('em_'+k).value.trim());try{dtSafeStorage.setItem(EMERGENCY_KEY,JSON.stringify(values));if(dtSafeStorage.getItem(EMERGENCY_KEY)!==JSON.stringify(values))throw Error('not saved');emergencyInfo('Saved on this device.')}catch{$('emergencyStatus').textContent='Could not save on this browser. Open the downloaded HTML in Chrome and try again.'}};
}
function about(){howToUse()}
$('recent').onclick=feed; if($('emergencyArt')) $('emergencyArt').onclick=emergencyInfo; $('portraitBtn').onclick=()=>profile();$('tag').onclick=editTagName; if($('appTitleBtn')) $('appTitleBtn').onclick=howToUse; $('close').onclick=close;$('overlay').onclick=e=>{if(e.target===$('overlay'))close()};window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});refresh();renderTagName();

/* Age- and breed-aware training planner. Local-only, no remote account required. */
(()=>{
const TKEY='loubear_training_v1';
let training={dob:'',breed:'',other:'',completed:{},notes:''};
try{const t=JSON.parse(dtSafeStorage.getItem(TKEY));if(t&&typeof t==='object')training={...training,...t,completed:t.completed||{}}}catch{}
const breeds=BREED_BY_ID;
const breedTips={
 cocker:'Cocker Spaniels often enjoy scent games and retrieving. Practice calm greetings, gentle ear handling, and relaxed grooming in tiny, rewarding steps.',
 cavalier:'Cavaliers often thrive on companionship. Reward brief, calm alone-time practice, friendly greetings, and gentle handling.',
 golden:'Goldens often love carrying and retrieving. Practice trading objects, four paws on the floor, and polite leash walking.',
 doodle:'Coat care can be intensive. Pair brushing, face and paw handling, and calm grooming-table practice with treats.',
 poodle:'Try short problem-solving games and scent searches. Pair frequent gentle coat care with rewards.',
 labrador:'Use retrieving and food puzzles to channel energy. Reinforce calm greetings and trading toys rather than grabbing.',
 frenchie:'Use low-impact, brief sessions and watch breathing and heat carefully. Focus on harness comfort and calm handling.',
 other:'Every puppy is an individual. Use gentle rewards, short sessions, and adjust for temperament, size, energy, and coat care.'};
function persist(){try{dtSafeStorage.setItem(TKEY,JSON.stringify(training))}catch{alert('Unable to save training progress in this browser.')}}
function weeks(){if(!training.dob)return null;const birth=new Date(training.dob+'T12:00:00'),today=new Date();today.setHours(12,0,0,0);const w=Math.floor((today-birth)/(7*86400000));return Number.isFinite(w)?Math.max(0,w):null}
function stage(w){if(w<12)return {label:'8–12 weeks: settling in',key:'a',focus:'Build confidence, a predictable routine, and happy associations.',items:[['Name & attention','Say Lou Bear’s name once. Reward him when he looks at you. Try 1–2 minutes.'],['Potty routine','Take him outside after waking, eating, playing, and before bedtime. Praise immediately after success.'],['Gentle handling','Pair brief ear, paw, and mouth touches with treats. Stop while he is comfortable.'],['Crate or rest space','Reward choosing a safe rest spot. Build duration very gradually; never use it as punishment.'],['Safe new experiences','Offer one positive exposure at his pace: sounds, surfaces, people, or a calm vaccinated dog.'] ],milestone:'Responds to his name, starts to settle, and is learning where to potty.'};
if(w<16)return {label:'12–16 weeks: building foundations',key:'b',focus:'Reward good choices and make everyday experiences pleasant.',items:[['Name, sit & come','Practice in quiet spaces with treats and cheerful praise for 2–4 minutes.'],['Potty routine','Track potty breaks and accidents to spot patterns. Keep cleaning calm and reward outdoor success.'],['Leash introduction','Practice following you with a comfortable harness indoors or in safe spaces.'],['Gentle mouth manners','Redirect teeth to a toy, pause play briefly when needed, and reward calm play.'],['Confidence practice','Introduce positive, controlled sights and sounds without forcing interaction.'] ],milestone:'Begins to follow simple cues, settle briefly, and respond to a cheerful recall.'};
if(w<26)return {label:'4–6 months: everyday manners',key:'c',focus:'Strengthen simple skills with mild distractions.',items:[['Come when called','Practice indoors or on a secure long line. Reward generously every time.'],['Loose-leash steps','Reward walking beside you for short stretches, then offer sniff breaks.'],['Settle on a mat','Reward calm lying down for a few seconds at a time.'],['Leave it & trade','Practice with low-value items and rewards; avoid grabbing things from his mouth.'],['Cooperative care','Pair brushing, paw checks, and brief ear care with rewards.'] ],milestone:'Can practice recall, polite walking, and a short calm settle in familiar settings.'};
if(w<52)return {label:'6–12 months: adolescence',key:'d',focus:'Expect some backsliding. Keep practice consistent, upbeat, and manageable.',items:[['Recall refresh','Return to easy recall games and use a long line in unfenced areas.'],['Polite greetings','Reward four paws down; give space if overly excited.'],['Distraction practice','Repeat sit, wait, and loose-leash skills in slightly busier settings.'],['Calm independence','Practice short, successful alone periods with enrichment and a safe rest area.'],['Enrichment & manners','Use scent games, food puzzles, and short training sessions.'] ],milestone:'Improving reliable manners amid gradually increasing distractions.'};
return {label:'12+ months: lifelong learning',key:'e',focus:'Keep skills fresh and add enjoyable activities that suit his personality.',items:[['Recall & safety','Refresh come, wait, and leave-it skills in different safe locations.'],['Leash manners','Practice relaxed walks and reward checking in with you.'],['New trick','Teach a fun cue like touch, spin, or find it using tiny steps.'],['Calm greetings','Practice settling around guests and everyday distractions.'],['Cooperative care','Keep grooming and veterinary handling pleasant and reward-based.'] ],milestone:'Reliable daily routines, ongoing confidence, and new skills.'};}
function taskId(s,i){return training.dob+'|'+training.breed+'|'+s.key+'|'+new Date().toLocaleDateString('en-CA')+'|'+i}
function ageText(w){return w<8?w+' weeks old':w<52?`${w} weeks old (about ${Math.floor(w/4.345)} months)`:`${(w/52.1775).toFixed(1)} years old`}
function settings(){show('Lou Bear’s training',`<p class="intro">Personalize a gentle, reward-based schedule for Lou Bear.</p><form id="trainSettings" class="train-form"><label class="field">Date of birth<input id="trainDob" type="date" value="${safe(training.dob)}" max="${new Date().toLocaleDateString('en-CA')}" required></label><label class="field">Breed<select id="trainBreed" required>${breedOptions(training.breed)}</select></label><label class="field" id="otherBreedLabel" style="${training.breed==='other'?'':'display:none'}">Breed or mix (optional)<input id="trainOther" maxlength="80" value="${safe(training.other)}" placeholder="Tell us about Lou Bear’s mix"></label><button class="primary" type="submit">Create training plan ✓</button></form><p class="muted">You can change these details later. This plan is a flexible guide, not a rigid timetable.</p>`,'trainingSettings');
$('trainBreed').onchange=e=>$('otherBreedLabel').style.display=e.target.value==='other'?'block':'none';
$('trainSettings').onsubmit=e=>{e.preventDefault();const dob=$('trainDob').value,b=$('trainBreed').value;const dt=new Date(dob+'T12:00:00');if(!dob||!b||Number.isNaN(dt.getTime())||dt>new Date()){alert('Please enter a valid birth date and breed.');return}training.dob=dob;training.breed=b;training.other=$('trainOther').value.trim();persist();planner()}}
// One consistent teaching system: Emily Larlham (Kikopup), reward-based puppy training.
// Each lesson is an independently verified chapter in the same published Kikopup guide,
// or a separately verified Kikopup tutorial for leash and grooming skills.
const KIKOPUP_GUIDE='https://www.youtube.com/watch?v=4dbzPoB7AKk&t=';
const KIKOPUP_LEASH='https://www.youtube.com/watch?v=NUG_J7mIHvc&t=';
const KIKOPUP_GROOMING='https://www.youtube.com/watch?v=AoM9tis3t2c';
const videoChapters={
 a:[['Teach your puppy his name',653],['House-training routine',7055],['Puppy handling and biting',1655],['Go in your crate',3177],['Introducing your puppy to other dogs',10097]],
 b:[['Name and come when called',848],['House-training routine',7055],['Getting started with harness and leash',0,'leash'],['Puppy mouthing and handling',1655],['Introducing your puppy to other dogs',10097]],
 c:[['Come with mild distractions',999],['Leash and harness foundations',646,'leash'],['Go to your bed (mat)',2842],['Teach drop and trade',4487],['Gentle grooming and cooperative handling',0,'grooming']],
 d:[['Recall with distractions',1205],['Attention game: foundation for calm greetings',393],['Recall with distractions',1205],['Settle and brief separations',5110],['Fetch and enriching play',4217]],
 e:[['Recall with distractions',1205],['Leash and harness foundations',646,'leash'],['Teach touch',2654],['Go to your bed (mat)',2842],['Gentle grooming and cooperative handling',0,'grooming']]
};
function videoFor(stage,index){const item=videoChapters[stage.key]?.[index];if(!item)return null;
 const [title,time,kind]=item;
 const url=kind==='leash'?KIKOPUP_LEASH+time+'s':kind==='grooming'?KIKOPUP_GROOMING:KIKOPUP_GUIDE+time+'s';
 return {url,title,label:'Watch Kikopup tutorial'};
}
function planner(){const p=getProfileDetails();training.dob=p.dob||'';training.breed=p.breed||'cocker';const w=training.dob?weeks():15;const s=stage(w),done=s.items.filter((_,i)=>training.completed[taskId(s,i)]).length;const pct=Math.round(done/s.items.length*100);const date=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});const b=breedName(training.breed);
show('Training with Lou Bear',`<div class="train-head"><span class="train-chip">${training.dob?safe(ageText(w)):'Example: 15-week puppy'}</span><button class="train-edit" id="trainEdit">Lou’s profile</button></div><p class="train-date">${safe(b)} · ${safe(date)}</p>${!training.dob?'<div class="train-note">This is a sample 15-week puppy plan. Enter a birthday and breed in Profile to personalize the training stage and care tips.</div>':''}${w<8?'<div class="train-note">Lou Bear is younger than eight weeks. Keep all handling gentle, and work with his breeder or veterinarian on age-appropriate care before starting formal training.</div>':''}<h3 style="font:normal 26px Georgia,serif;color:#6b432e;margin:15px 0 3px">${safe(s.label)}</h3><p class="train-tip">${safe(s.focus)} Aim for a few positive 2–5-minute practice moments rather than one long session. Stop when he seems tired or stressed.</p><section class="family-cue-guide" aria-label="Family cue guide"><div class="family-cue-header"><span class="family-cue-eyebrow">KEEP EVERYONE CONSISTENT</span><h3>Lou’s Family Cue Guide</h3><p>Same words. Same meaning. Every family member.</p></div><div class="family-cue-list"><div><strong>“Lou”</strong><span>Look at me</span></div><div><strong>“Come”</strong><span>Return to me</span></div><div><strong>“Touch”</strong><span>Nose to my hand</span></div><div><strong>“Bed”</strong><span>Go to your mat</span></div><div><strong>“Drop”</strong><span>Release the item</span></div></div><p class="family-cue-rule"><strong>Family rule:</strong> Say the cue once, help Lou succeed, then reward. Don't use punishment or switch to a competing training system.</p></section><div class="train-card"><div class="train-action"><strong>Today’s practice</strong><span><strong>${done}/${s.items.length}</strong> completed</span></div><div class="train-progress" role="progressbar" aria-label="Daily training progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>${s.items.map(([name,desc],i)=>{const vid=videoFor(s,i);return `<div class="train-check ${training.completed[taskId(s,i)]?'done':''}"><label class="train-check-core"><input type="checkbox" data-task="${i}" ${training.completed[taskId(s,i)]?'checked':''}><span><strong>${safe(name)}</strong><small>${safe(desc)}</small></span></label>${vid?`<a class="train-video" href="${vid.url}" target="_blank" rel="noopener noreferrer" aria-label="${safe(vid.label)}: ${safe(name)}">▷ ${safe(vid.title)} ↗</a>`:''}</div>`}).join('')}</div><p class="train-video-credit"><strong>One trainer, one approach:</strong> All tutorials are from <a href="https://www.youtube.com/watch?v=4dbzPoB7AKk" target="_blank" rel="noopener noreferrer">Kikopup / Emily Larlham</a>. These reward-based methods are consistent with <a href="https://avsab.org/resources/position-statements/" target="_blank" rel="noopener noreferrer">AVSAB guidance</a>, though AVSAB does not endorse individual trainers. Videos require internet.</p><div class="train-card"><h3>Growing-up milestone</h3><p class="train-tip">${safe(s.milestone)}</p></div><div class="train-card"><h3>Breed-aware care & enrichment</h3><p class="train-tip">${safe(breedAdvice(training.breed))}</p></div><div class="train-note">Keep experiences gentle and positive. Ask your veterinarian about vaccination-appropriate socialization and activity. If fear, pain, or serious behavior problems appear, seek individual veterinary or qualified positive-reinforcement training advice.</div><div class="train-action"><button class="train-edit" id="trainReset">Clear today’s checkmarks</button><span class="muted">Saved only in this browser</span></div>`,'training');
$('trainEdit').onclick=()=>profile();
document.querySelectorAll('[data-task]').forEach(el=>el.onchange=()=>{const id=taskId(s,+el.dataset.task);if(el.checked)training.completed[id]=true;else delete training.completed[id];persist();planner()});
$('trainReset').onclick=()=>{s.items.forEach((_,i)=>delete training.completed[taskId(s,i)]);persist();planner()};
}
if($('trainingArt')) $('trainingArt').onclick=planner;window.addEventListener('lou-profile-updated',()=>{const p=getProfileDetails();training.dob=p.dob;training.breed=p.breed;});
})();

// A flexible puppy day. Birth date is shared with the Training tab's existing local settings.
(()=>{
const KEY='loubear_schedule_v1', TRAIN='loubear_training_v1', DOBKEY='loubear_birthday_v2';
let sessionDOB='';
let state={done:{}};try{state={...state,...JSON.parse(dtSafeStorage.getItem(KEY))}}catch{};
const day=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const getDOB=()=>{if(window.LouProfile?.dob)return window.LouProfile.dob;if(sessionDOB)return sessionDOB;try{return dtSafeStorage.getItem(DOBKEY)||JSON.parse(dtSafeStorage.getItem(TRAIN))?.dob||''}catch{return ''}};
function weeks(){let dob=getDOB();if(!dob)return 15;return Math.max(0,Math.floor((new Date().setHours(12,0,0,0)-new Date(dob+'T12:00:00'))/(7*86400000)))}
function save(){try{dtSafeStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new Event('daily-tail-schedule-change'))}catch{alert('Could not save checklist on this browser.')}}
function event(time,title,desc,kind){return{time,title,desc,kind}}
function plan(w){
if(Array.isArray(state.customPlan))return state.customPlan;
const young=w<26;const p=[
['Morning',[
event('6:30 AM','Wake + potty','Go outside immediately after waking. Quiet praise and a treat after he finishes.','potty'),
event('7:00 AM','Breakfast + fresh water','Puppy food in a measured portion. Keep clean drinking water available.','meal'),
event('7:15 AM','Potty after breakfast','Offer a potty trip shortly after eating.','potty'),
event('7:30 AM','Short training + gentle play',young?'2–4 minutes of name, come, sit or touch; then 10–15 minutes of relaxed play.':'3–5 minutes of recall or leash manners, then relaxed play.','train'),
event('8:00 AM','Quiet time / nap','Dim, calm rest area. Let Lou sleep without interruptions.','sleep'),
event('9:30 AM','Wake + potty','Take him outside as soon as he wakes.','potty'),
event('9:45 AM','Socialization adventure','Watch cyclists from a distance, hear household sounds, or meet a calm person. Pair with treats. No forced greetings.','social'),
event('10:15 AM','Nap / settle','Quiet supervised rest, chew or safe crate/pen time.','sleep')]],
['Midday',[
event('12:00 PM','Wake + potty','Go out before lunch.','potty'),
event('12:15 PM', young?'Lunch + fresh water':'Midday enrichment + water',young?'Second of three daily puppy meals. Use some kibble as rewards if desired.':'If on two meals per your vet, offer a food puzzle using daily ration instead.','meal'),
event('12:30 PM','Potty break','Potty after food or drinking and before activity.','potty'),
event('12:45 PM','Play + scent game','Try a soft toy retrieve or scatter-feed 3–5 pieces of kibble to sniff out.','play'),
event('1:15 PM','Long nap','Protected quiet time. Potty immediately upon waking.','sleep'),
event('3:00 PM','Wake + potty','Offer a trip as soon as awake.','potty'),
event('3:15 PM','Training + grooming comfort','2–5 minutes of wait, recall or leave it; then reward gentle paw, ear and brush handling.','train'),
event('3:45 PM','Quiet rest / chew','A calm chew, then another nap as needed.','sleep')]],
['Evening',[
event('5:00 PM','Potty + outdoor sniff','Brief sniffy exploration on a safe surface or yard.','potty'),
event('5:30 PM','Dinner + fresh water','Third puppy meal if on three meals daily; otherwise the second meal.','meal'),
event('5:45 PM','Potty after dinner','Offer a potty trip shortly after dinner.','potty'),
event('6:00 PM','Family play + confidence','Short fetch, gentle tug with trades, or relaxed supervised time with the family.','play'),
event('6:45 PM','Nap / settle','Low-stimulation quiet time in Lou’s own space.','sleep'),
event('8:00 PM','Potty + calm connection','Potty, then gentle petting, a short chew, or a one-minute training review.','potty'),
event('9:15 PM','Last potty trip','Keep the outing calm, quick and boring to signal bedtime.','potty'),
event('9:30 PM','Bedtime','Consistent dark, quiet sleeping area. Respond to genuine overnight potty needs.','sleep')]]
];return p}
function activityMinutes(label){const m=label.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);if(!m)return 0;return (+m[1]%12)*60+(+m[2])+(m[3]==='PM'?720:0)}
function updateUpNext(){
 const card=$('upNextCard');if(!card)return;
 const now=new Date(),today=day(),minutes=now.getHours()*60+now.getMinutes();
 const events=plan(weeks()).flatMap(group=>group[1]);
 const pending=events.map((entry,i)=>({...entry,i,minutes:activityMinutes(entry.time)})).filter(entry=>!state.done[today+'|'+entry.i]);
 // Show the oldest unfinished past-due activity, then the next future item.
 let chosen=pending.find(entry=>entry.minutes<=minutes);
 if(!chosen)chosen=pending.find(entry=>entry.minutes>minutes);
 const time=$('upNextTime'),title=$('upNextActivity'),note=$('upNextNote'),check=$('upNextCheck'),row=$('upNextTaskRow');
 if(!chosen){
  time.textContent='All done for today';title.textContent='Great work, Lou!';
  note.textContent='Tap to view the Daily Plan';row.style.display='none';
  card.setAttribute('aria-label','All daily activities completed');check.dataset.activityId='';return;
 }
 const overdue=chosen.minutes<minutes;
 row.style.display='flex';check.checked=false;
 check.dataset.activityId=today+'|'+chosen.i;
 check.setAttribute('aria-label','Mark '+chosen.title+' complete');
 time.textContent=(overdue?'Still to do · ':'Scheduled · ')+chosen.time;
 title.textContent=chosen.title;
 note.textContent='Check off or tap for details';
 card.setAttribute('aria-label',(overdue?'Unfinished activity: ':'Next activity: ')+chosen.title+' at '+chosen.time);
}

/* Calendar export is device-driven: no background web notification service is claimed. */
function reminderLocalDateTime(date){
 return date.getFullYear()+String(date.getMonth()+1).padStart(2,'0')+String(date.getDate()).padStart(2,'0')+'T'+String(date.getHours()).padStart(2,'0')+String(date.getMinutes()).padStart(2,'0')+'00';
}
function reminderEscape(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function addDailyCalendarReminder(entry){
 const offset=Number(document.getElementById('dtReminderLead')?.value||0);
 const total=activityMinutes(entry.time),start=new Date();start.setHours(Math.floor(total/60),total%60,0,0);
 if(start.getTime()<=Date.now())start.setDate(start.getDate()+1);
 const end=new Date(start.getTime()+10*60000);
 const dog=String(document.getElementById('tagName')?.textContent||'Dog').trim();
 const label=dog+' · '+entry.title;
 const note='Daily Tail reminder: '+entry.title+'. '+(entry.desc||'');
 const ts=reminderLocalDateTime(start),te=reminderLocalDateTime(end);
 const uid='dailytail-'+Math.random().toString(36).slice(2)+'@local';
 const created=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Daily Tail//Selected Activity Reminders//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+created,'DTSTART:'+ts,'DTEND:'+te,'RRULE:FREQ=DAILY','SUMMARY:'+reminderEscape(label),'DESCRIPTION:'+reminderEscape(note),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+reminderEscape(label),'TRIGGER:-PT'+offset+'M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 const fileURL=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
 const a=document.createElement('a');a.href=fileURL;a.download='Daily-Tail-'+entry.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-reminder.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(fileURL),15000);
 const status=document.getElementById('dtReminderStatus');if(status)status.textContent='Downloaded reminder for '+entry.title+'. Import/open the calendar file, save the recurring event, and check that notifications are enabled in your calendar app.';
}

/* Schedule editor: saved changes override the template plan for this dog.
   Keep a reversible completion mapping when activities are removed or reordered. */
function editSchedule(){
 if(document.body.classList.contains('friend-view')||document.body.classList.contains('dt-locked')||(window.dtRole&&window.dtRole!=='adult')){
  alert('Only an authorized owner can edit the daily schedule.');return;
 }
 const headings=['Morning','Midday','Evening'];
 const current=plan(weeks());
 const rows=current.flatMap(([group,arr])=>arr.map((e)=>({...e,group,originalIndex:0})));
 rows.forEach((entry,i)=>entry.originalIndex=i);
 const timeToInput=(t)=>{
  const m=/^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t||'');
  if(!m)return '09:00';
  return String((Number(m[1])%12)+(m[3]==='PM'?12:0)).padStart(2,'0')+':'+m[2];
 };
 const inputToTime=(t)=>{
  const [h,m]=t.split(':').map(Number);
  return String((h%12)||12)+':'+String(m).padStart(2,'0')+(h>=12?' PM':' AM');
 };
 show('Edit Daily Schedule','<p class="muted">Edit activity names, times, and notes. Add or remove activities, then save. Changes will appear in Today’s Schedule and Up Next.</p><div class="schedule-edit-list" id="dtScheduleEditRows"></div><div class="schedule-edit-actions"><button type="button" id="dtScheduleAdd">+ Add activity</button><button type="button" id="dtScheduleCancel">Cancel</button><button class="primary" type="button" id="dtScheduleSave">Save schedule</button></div><p role="status" id="dtScheduleEditStatus" class="muted"></p>','scheduleedit');
 const container=$('dtScheduleEditRows');
 const escapeAttr=(value)=>safe(String(value||''));
 let rowId=0;
 function addRow(entry){
  const id=rowId++;
  const card=document.createElement('div');
  card.className='dt-schedule-edit-row';
  card.dataset.originalIndex=entry.originalIndex==null?'-1':String(entry.originalIndex);
  card.innerHTML='<div class="dt-schedule-edit-rowhead"><strong>Activity</strong><button type="button" class="dt-edit-remove" aria-label="Remove activity">Remove</button></div>'+
   '<label>Time<input class="dt-edit-time" type="time" required value="'+escapeAttr(timeToInput(entry.time))+'"></label>'+
   '<label>Part of day<select class="dt-edit-group">'+headings.map(h=>'<option value="'+h+'" '+(h===entry.group?'selected':'')+'>'+h+'</option>').join('')+'</select></label>'+
   '<label>Activity name<input class="dt-edit-title" maxlength="90" required value="'+escapeAttr(entry.title)+'"></label>'+
   '<label>Notes<textarea class="dt-edit-desc" maxlength="1000" rows="2"></textarea></label>';
  card.querySelector('.dt-edit-desc').value=entry.desc||'';
  card.querySelector('.dt-edit-remove').onclick=()=>card.remove();
  container.append(card);
 }
 rows.forEach(addRow);
 $('dtScheduleAdd').onclick=()=>{
  addRow({time:'9:00 AM',group:'Morning',title:'New activity',desc:'',kind:'other',originalIndex:-1});
  container.lastElementChild?.querySelector('.dt-edit-title')?.focus();
 };
 $('dtScheduleCancel').onclick=render;
 $('dtScheduleSave').onclick=()=>{
  const cards=[...container.querySelectorAll('.dt-schedule-edit-row')];
  if(cards.length>80){$('dtScheduleEditStatus').textContent='Please keep the schedule to 80 activities or fewer.';return;}
  const changed=[];
  for(const card of cards){
   const title=card.querySelector('.dt-edit-title').value.trim();
   const time=card.querySelector('.dt-edit-time').value;
   const desc=card.querySelector('.dt-edit-desc').value.trim();
   const group=card.querySelector('.dt-edit-group').value;
   if(!title||!time){$('dtScheduleEditStatus').textContent='Every activity needs a name and time.';card.querySelector(!title?'.dt-edit-title':'.dt-edit-time').focus();return;}
   const oldIndex=Number(card.dataset.originalIndex);
   changed.push({entry:{time:inputToTime(time),title,desc,kind:oldIndex>=0?rows[oldIndex]?.kind||'other':'other'},group,originalIndex:oldIndex});
  }
  const arranged=headings.flatMap(group=>changed.filter(row=>row.group===group).sort((a,b)=>activityMinutes(a.entry.time)-activityMinutes(b.entry.time)));
  const grouped=headings.map(group=>[group,arranged.filter(row=>row.group===group).map(row=>row.entry)]);
  const remap=new Map(arranged.map((row,i)=>[row.originalIndex,i]).filter(([old])=>old>=0));
  const oldDone=state.done||{},migrated={};
  for(const [key,flag] of Object.entries(oldDone)){
   const match=/^(\d{4}-\d\d-\d\d)\|(\d+)$/.exec(key);
   if(!match){migrated[key]=flag;continue;}
   const next=remap.get(Number(match[2]));
   if(next!==undefined)migrated[match[1]+'|'+next]=flag;
  }
  state.done=migrated;
  state.customPlan=grouped;
  save();
  render();
 };
}

function render(){updateUpNext();let w=weeks(),dob=getDOB(),groups=plan(w),events=groups.flatMap(g=>g[1]);let ids=events.map((e,i)=>day()+'|'+i);let total=ids.filter(id=>state.done[id]).length;
const note=w<26?'Lou is in his early puppy months. This plan assumes roughly 15 weeks if no birth date is entered. Start with three meals a day unless your veterinarian advises otherwise.':'As Lou grows, he may need fewer naps and may transition to two meals with veterinary guidance. Keep daily enrichment, reward-based practice, and frequent opportunities to potty.';
show('Lou Bear’s daily schedule',`<div class="schedule-controls"><strong>${safe(new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}))}</strong><button id="scheduleEdit">${dob?'Edit profile':'Set up profile'}</button><button id="scheduleCustomize" type="button">✎ Edit schedule</button></div><div class="schedule-meta">${safe(breedName(getProfileDetails().breed||'cocker'))} · ${dob?`${w} weeks old`:'Example for a 15-week-old puppy'}</div><div class="schedule-notice">${safe(note)} <strong>Breed note:</strong> ${safe(breedAdvice(getProfileDetails().breed||'cocker'))} <strong>Potty rule:</strong> Go out after every nap, meal, drink or energetic playtime, even between listed times. While awake, offer extra trips about every 1–2 hours as needed.</div><div class="schedule-controls"><strong>${total} of ${ids.length} activities complete</strong><button id="scheduleClear">Reset today</button></div><div class="schedule-progress"><div style="width:${Math.round(100*total/ids.length)}%"></div></div><div class="dt-push-setup" id="dtPushSetup"><strong>📱 Daily Tail phone alerts</strong><span>Allow notifications to receive Daily Tail alerts. Automatic scheduled push reminders are not available yet.</span><div class="dt-push-actions"><button type="button" id="dtPushEnable">Enable Phone Alerts</button><button type="button" id="dtPushTest" hidden>Try a test alert</button><button type="button" id="dtPushCopyToken" hidden>Copy Firebase test token</button></div><details class="dt-push-help"><summary>Advanced: Test Firebase delivery</summary><p>Copy your device token and paste it into Firebase Console → Messaging → Send test message. Keep this token private. This tests delivery only, not scheduled reminders.</p></details><span class="dt-push-status" id="dtPushStatus" role="status" aria-live="polite"></span></div><div class="schedule-reminder-bar"><strong>🔔 Calendar reminders</strong><span>Tap the bell beside an activity to add a reminder.</span><label for="dtReminderLead">Remind me <select id="dtReminderLead"><option value="0">At the scheduled time</option><option value="5">5 minutes before</option><option value="10">10 minutes before</option><option value="15">15 minutes before</option></select></label><small>Save the downloaded reminder in your phone calendar to receive alerts. If the schedule changes, update the calendar event too.</small><p id="dtReminderStatus" role="status" aria-live="polite"></p></div>${groups.map(([heading,arr],gi)=>`<section class="schedule-group"><h3>${heading}</h3>${arr.map(e=>{const i=events.indexOf(e),id=ids[i],on=!!state.done[id];return `<div class="schedule-event ${on?'checked':''}"><input type="checkbox" data-schedule-id="${i}" aria-label="Mark ${safe(e.title)} complete" ${on?'checked':''}><time class="schedule-time">${safe(e.time)}</time><div class="schedule-event-content"><strong>${safe(e.title)}</strong><p>${safe(e.desc)}</p></div><button type="button" class="schedule-reminder-action" data-remind-index="${i}" aria-label="Add daily calendar reminder for ${safe(e.title)}">🔔 Remind</button></div>`}).join('')}</section>`).join('')}<div class="schedule-notice">The times are a practical starting example, not a veterinary prescription. Adapt to Lou’s hunger, sleep, bowel patterns and your household routine. For outings before vaccinations are complete, choose lower-risk environments with your veterinarian’s advice. Keep sessions positive and stop if Lou seems tired or fearful.</div><div class="source-links"><strong>Research behind this routine</strong><a href="https://www.akc.org/expert-advice/training/setting-schedules-and-developing-a-routine-for-your-new-puppy/" target="_blank" rel="noopener noreferrer">AKC: New puppy routine and feeding</a><a href="https://www.akc.org/expert-advice/dog-care/articles/how-much-do-puppies-sleep/" target="_blank" rel="noopener noreferrer">AKC: Puppy sleep</a><a href="https://avsab.org/resources/position-statements/" target="_blank" rel="noopener noreferrer">AVSAB: Puppy socialization guidance</a><a href="https://vcahospitals.com/animal-care-associates/know-your-pet/dog-breeds/american-cocker-spaniel" target="_blank" rel="noopener noreferrer">VCA: Cocker Spaniel training and care</a></div>`,'schedule');
document.querySelectorAll('[data-remind-index]').forEach(button=>{button.onclick=()=>addDailyCalendarReminder(events[Number(button.dataset.remindIndex)])});
 if(window.DailyTailPush)window.DailyTailPush.attach();
$('scheduleEdit').onclick=()=>profile();
$('scheduleCustomize').onclick=editSchedule;
$('scheduleClear').onclick=()=>{ids.forEach(id=>delete state.done[id]);save();updateUpNext();render()};
document.querySelectorAll('[data-schedule-id]').forEach(ch=>{ch.onchange=()=>{const id=ids[Number(ch.dataset.scheduleId)];if(ch.checked)state.done[id]=true;else delete state.done[id];save();updateUpNext();const sc=$('content').scrollTop;render();$('content').scrollTop=sc}})
}
if($('scheduleArt')) $('scheduleArt').onclick=render; if($('upNextActivity')) $('upNextActivity').onclick=render;
if($('upNextCheck')) $('upNextCheck').onchange=e=>{
 const id=e.currentTarget.dataset.activityId;
 if(!id)return;
 if(e.currentTarget.checked)state.done[id]=true;else delete state.done[id];
 save();updateUpNext();
}; window.DailyTailSchedule={getEntries:()=>plan(weeks()).flatMap(g=>g[1]),getDone:()=>state.done,setDone:(index,checked)=>{const events=plan(weeks()).flatMap(g=>g[1]);if(!Number.isInteger(index)||index<0||index>=events.length)return false;const id=day()+'|'+index;if(checked)state.done[id]=true;else delete state.done[id];save();updateUpNext();return true;}};updateUpNext();window.addEventListener('focus',updateUpNext);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateUpNext()});window.setInterval(updateUpNext,60000);window.addEventListener('storage',e=>{if(e.key===KEY){try{state={done:{},...JSON.parse(e.newValue||'{}')}}catch{state={done:{}}}updateUpNext()}});
})();

/* Daily journal and snapshot. All entries are local to this browser. */
(()=>{
const JKEY='daily_tail_journal_v1', SKEY='loubear_schedule_v1';
const $j=id=>document.getElementById(id);
let entries={};try{const stored=JSON.parse(dtSafeStorage.getItem(JKEY));if(stored&&typeof stored==='object'&&!Array.isArray(stored))entries=stored}catch{}
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const toMinutes=time=>{const m=/^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time||'');return m?(Number(m[1])%12)*60+Number(m[2])+(m[3]==='PM'?720:0):0};
function saveNotes(){const date=$j('journalDate').value||today();entries[date]=$j('journalText').value;try{dtSafeStorage.setItem(JKEY,JSON.stringify(entries));$j('journalStatus').textContent='Saved automatically ✓'}catch{$j('journalStatus').textContent='Could not save. Please export your notes.'}}
function openDate(date){const selected=date||today();$j('journalDate').value=selected;$j('journalText').value=entries[selected]||'';$j('journalStatus').textContent=entries[selected]?'Saved entry loaded':'Ready for notes · autosaves as you type'}
function updateSnapshot(){const sch=window.DailyTailSchedule;if(!sch)return;
const all=sch.getEntries(), done=sch.getDone(), key=today();const completed=all.map((e,i)=>({e,i})).filter(({i})=>done[key+'|'+i]);
$j('snapshotDate').textContent=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
$j('snapshotDone').textContent=completed.length+' of '+all.length;
$j('snapshotProgress').style.width=(all.length?Math.round(completed.length/all.length*100):0)+'%';
const potty=completed.filter(({e})=>e.kind==='potty');$j('snapshotPotty').textContent=potty.length?potty[potty.length-1].e.time:'Not logged';
const now=new Date(),mins=now.getHours()*60+now.getMinutes();const remaining=all.map((e,i)=>({...e,i})).filter(e=>(e.kind==='meal'||e.kind==='sleep')&&!done[key+'|'+e.i]);
const next=remaining.find(e=>toMinutes(e.time)>=mins)||remaining[0];
$j('snapshotNext').textContent=next?next.time:'All done';
$j('snapshotNext').title=next?next.title:'All meals and rest items completed';
}
$j('journalText').addEventListener('input',saveNotes);
$j('journalDate').addEventListener('change',e=>openDate(e.target.value));
document.querySelectorAll('[data-journal-quick]').forEach(button=>button.addEventListener('click',()=>{
const label=button.dataset.journalQuick,area=$j('journalText'),stamp=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
area.value+=(area.value&&!area.value.endsWith('\n')?'\n':'')+'['+stamp+'] '+label+': ';
saveNotes();area.focus();area.setSelectionRange(area.value.length,area.value.length);
}));
$j('journalExport').addEventListener('click',()=>{
const backup={format:'Daily Tail local backup',version:1,exportedAt:new Date().toISOString(),dailyNotes:entries};
try{backup.dailySchedule=JSON.parse(dtSafeStorage.getItem(SKEY)||'{}')}catch{backup.dailySchedule={}}
const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='Daily_Tail_Backup_'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
$j('journalStatus').textContent='Backup downloaded';
});
window.addEventListener('daily-tail-schedule-change',updateSnapshot);
window.addEventListener('focus',updateSnapshot);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateSnapshot();if($j('journalDate').value===today())$j('journalStatus').textContent='Saved automatically on this device'}});
window.setInterval(()=>{updateSnapshot();if($j('journalDate').dataset.today==='1'&&$j('journalDate').value!==today())openDate(today())},60000);
openDate(today());updateSnapshot();
})();


/* Appearance settings: palette, recolored original illustration, and uploaded stripe replacement. */
(()=>{
 const KEY='dailytail_appearance_v1';
 const original={panel:'#b37344',feature:'#cbd5de',text:'#1b1b1b',page:'#f6efe5',accent:'#9bb8cf',title:'#dbe5ed',stripeBlue:'#a0aeb9',stripeCream:'#f6efe5',portraitBorder:'#cbd5de',recentBorder:'#8ea2b3',recentFill:'#d7e2ea',recentInside:'#f8f3ea',recentBadge:'#8da9bc',recentText:'#241c18',navFill:'#cbd5de',navText:'#1b1b1b',upNextText:'#1b1b1b',snapshotFill:'#cbd5de',snapshotText:'#1b1b1b',tagText:'#29313b',buttonText:'#1b1b1b',mode:'stripes',photo:''};
 let theme={...original};try{const saved=JSON.parse(dtSafeStorage.getItem(KEY));if(saved&&typeof saved==='object')theme={...theme,...saved}}catch{}
 // Undo history remains available while the app stays open, even if Settings closes.
 const themeUndoHistory=[];
 const rememberTheme=()=>{themeUndoHistory.push({...theme});if(themeUndoHistory.length>30)themeUndoHistory.shift()};
 const undoTheme=()=>{if(!themeUndoHistory.length)return;theme=themeUndoHistory.pop();saveTheme();recolorArtwork();settings('Last appearance change undone.')};
 const photoSource=document.getElementById('themeArtwork');
 const originalSrc=photoSource.src;
 const sourceImage=new Image();sourceImage.src=originalSrc;
 let task=0;
 const rgb=hex=>{const c=(hex||'#000000').replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]};
 const fmt=(hex)=>/^#[a-f0-9]{6}$/i.test(hex)?hex:'#cbd5de';
 function saveTheme(){try{dtSafeStorage.setItem(KEY,JSON.stringify(theme));return true}catch{return false}}
 function styleVars(){
  const root=document.documentElement;root.style.setProperty('--panel-color',fmt(theme.panel));root.style.setProperty('--feature-color',fmt(theme.feature));root.style.setProperty('--text-color',fmt(theme.text));root.style.setProperty('--page-color',fmt(theme.page));root.style.setProperty('--accent-color',fmt(theme.accent));root.style.setProperty('--title-color',fmt(theme.title));
  for(const [key,variable] of Object.entries({portraitBorder:'--portrait-border',recentBorder:'--recent-border',recentFill:'--recent-fill',recentInside:'--recent-inside',recentBadge:'--recent-badge',recentText:'--recent-text',navFill:'--nav-fill',navText:'--nav-text',upNextText:'--up-next-text',snapshotFill:'--snapshot-fill',snapshotText:'--snapshot-text',tagText:'--tag-text',buttonText:'--button-text'})){root.style.setProperty(variable,fmt(theme[key]));}
  document.body.classList.add('theme-on');
  const shell=document.querySelector('.shell');if(theme.mode==='photo'&&theme.photo){shell.style.backgroundImage=`url("${theme.photo}")`;shell.style.backgroundSize='cover';shell.style.backgroundRepeat='repeat-y';shell.style.backgroundPosition='center top'}
  else if(theme.mode==='solid'){shell.style.backgroundImage='none';shell.style.backgroundColor=theme.page}
  else {shell.style.backgroundImage='';shell.style.backgroundSize='';shell.style.backgroundRepeat='';shell.style.backgroundPosition='';shell.style.backgroundColor=''}
 }
 async function recolorArtwork(){
  const myTask=++task;styleVars();
  // Defer until the original illustration is ready; never modify its source pixels.
  if(!sourceImage.complete){await new Promise(resolve=>{sourceImage.addEventListener('load',resolve,{once:true});sourceImage.addEventListener('error',resolve,{once:true})})}
  if(!sourceImage.naturalWidth || myTask!==task)return;
  const unchanged=theme.panel===original.panel&&theme.feature===original.feature&&theme.page===original.page&&theme.stripeBlue===original.stripeBlue&&theme.stripeCream===original.stripeCream&&theme.mode==='stripes';
  if(unchanged){photoSource.src=originalSrc;return}
  const w=sourceImage.naturalWidth,h=sourceImage.naturalHeight,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(sourceImage,0,0);
  const data=cx.getImageData(0,0,w,h);let photo=null;
  if(theme.mode==='photo'&&theme.photo){try{photo=new Image();photo.src=theme.photo;await photo.decode();if(myTask!==task)return}catch{photo=null}}
  const newPanel=rgb(theme.panel),newFeature=rgb(theme.feature),newPage=rgb(theme.page),newStripeBlue=rgb(theme.stripeBlue),newStripeCream=rgb(theme.stripeCream);
  const background=document.createElement('canvas');background.width=w;background.height=h;const bc=background.getContext('2d',{willReadFrequently:true});
  if(photo){const scale=Math.max(w/photo.width,h/photo.height),dw=photo.width*scale,dh=photo.height*scale;bc.drawImage(photo,(w-dw)/2,(h-dh)/2,dw,dh)}
  const bg=photo?bc.getImageData(0,0,w,h).data:null;
  const pixels=data.data;
  for(let i=0;i<pixels.length;i+=4){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    // Flat-color detection protects watercolor paw prints, bone tag, typography and black trim.
    const brown=Math.max(Math.abs(r-179),Math.abs(g-115),Math.abs(b-68))<=4 || Math.max(Math.abs(r-179),Math.abs(g-115),Math.abs(b-68))<=9 && r>g*1.4 && g>b*1.35;
    const blueStripe=Math.max(Math.abs(r-160),Math.abs(g-174),Math.abs(b-185))<=6;
    const creamStripe=Math.max(Math.abs(r-246),Math.abs(g-239),Math.abs(b-229))<=5;
    const frameBlue=Math.max(Math.abs(r-200),Math.abs(g-209),Math.abs(b-217))<=7;
    if(brown){for(let k=0;k<3;k++)pixels[i+k]=Math.min(255,Math.max(0,newPanel[k]+[r-179,g-115,b-68][k]));}
    else if(frameBlue){for(let k=0;k<3;k++)pixels[i+k]=Math.min(255,Math.max(0,newFeature[k]+[r-200,g-209,b-217][k]));}
    else if(blueStripe||creamStripe){
      if(theme.mode==='photo'&&bg){pixels[i]=bg[i];pixels[i+1]=bg[i+1];pixels[i+2]=bg[i+2]}
      else if(theme.mode==='solid'){pixels[i]=newPage[0];pixels[i+1]=newPage[1];pixels[i+2]=newPage[2]}
      else {const base=blueStripe?[160,174,185]:[246,239,229],next=blueStripe?newStripeBlue:newStripeCream;for(let k=0;k<3;k++)pixels[i+k]=Math.min(255,Math.max(0,next[k]+[r-base[0],g-base[1],b-base[2]][k]));}
    }
  }
  cx.putImageData(data,0,0);if(myTask===task)photoSource.src=canvas.toDataURL('image/png');
 }
 const settingsBtn=document.getElementById('themeSettingsBtn');
 const icons={
 panel:'Main Brown Panel',stripeBlue:'Blue Background Stripes',stripeCream:'Cream Background Stripes',page:'Solid Outer Background',title:'Daily Tail Heading',tagText:'Name Engraved on Dog Tag',portraitBorder:'Profile Photo Circle Border',recentFill:'Recent Post Outer Box',recentInside:'Recent Post Inner Box',recentBorder:'Recent Post Border',recentBadge:'Recent Post Heading Tab',recentText:'Recent Post Title & Preview Text',upNextText:'Up Next Heading & Schedule Text',navFill:'Home Navigation Button Background',navText:'Home Navigation Button Text',snapshotFill:'Today’s Snapshot Card Background',snapshotText:'Today’s Snapshot Text',feature:'Other Cards & Panels',text:'General App Text',buttonText:'Other Button Text',accent:'Progress Bars & Highlights'};
 const themeDescriptions={};
 function settings(msg=''){
  const pickers=Object.entries(icons).map(([key,label])=>`<button type="button" class="theme-target" data-theme-target="${key}" aria-pressed="${key==='panel'}"><span class="theme-target-dot" data-theme-dot="${key}" style="background:${theme[key]}"></span><span class="theme-target-label">${label}</span><span class="theme-target-hex" data-theme-hex="${key}">${theme[key].toUpperCase()}</span><span class="theme-target-open" aria-hidden="true">›</span></button>`).join('');
  const hues=[0,15,30,45,60,90,120,150,180,195,210,225,240,260,285,310,335];
  const levels=[94,82,68,52,36,22];
  const palette=hues.flatMap(h=>levels.map(l=>`hsl(${h} 65% ${l}%)`));
  palette.unshift('#ffffff','#f7f3eb','#e8ded0','#aaa9a7','#57575a','#242424','#000000');
  const swatches=palette.map((color,i)=>`<button type="button" class="theme-palette-swatch" data-palette-index="${i}" style="background:${color}" aria-label="Choose color shade ${i+1}" title="Choose this shade"></button>`).join('');
  const paletteHtml=`<div id="themeColorPopup" class="theme-color-popup" hidden><div class="theme-color-dialog" role="dialog" aria-modal="true" aria-labelledby="themePopupTitle"><div class="theme-color-dialog-header"><div><div class="theme-color-dialog-kicker">EDIT COLOR</div><h3 id="themePopupTitle">Main Brown Panel</h3></div><button type="button" id="themePopupClose" class="theme-color-close" aria-label="Close color picker">✕</button></div><div class="theme-palette-tools"><div class="theme-current"><span id="themeCurrentDot" class="theme-current-dot" style="background:${theme.panel}"></span><strong id="themeCurrentLabel">Current color</strong></div><label class="theme-custom">Custom color <input id="themeCustomColor" type="color" value="${theme.panel}" aria-label="Choose any custom color"></label></div><p class="theme-help">Tap a shade to apply it. The colors range from light to dark.</p><div class="theme-palette-grid" role="group" aria-label="Color wheel shades">${swatches}</div><div class="theme-color-dialog-footer"><button id="themePopupUndo" type="button" ${themeUndoHistory.length?'':'disabled'}>↶ Undo</button><button id="themePopupDone" type="button" class="primary">Done</button></div></div></div>`;
  show('Appearance Settings',`<p class="muted">Make Daily Tail your own. Changes apply to this device and are saved automatically.</p><h3>Tap any section to choose its color</h3><div class="theme-target-grid">${pickers}</div>${paletteHtml}<h3>Background style</h3><div class="theme-choice"><label><input type="radio" name="themeMode" value="stripes" ${theme.mode==='stripes'?'checked':''}>Original stripes</label><label><input type="radio" name="themeMode" value="solid" ${theme.mode==='solid'?'checked':''}>Solid color</label><label><input type="radio" name="themeMode" value="photo" ${theme.mode==='photo'?'checked':''}>Uploaded image</label></div><label class="field upload">Upload a background photo or pattern<input id="themeUpload" type="file" accept="image/*"></label><div class="theme-preview" id="themePhotoPreview">${theme.photo?'<span class="muted">Custom background image saved</span>':''}</div><p class="theme-help">The custom image replaces the cream and blue stripes while keeping the dog tag, paw prints, and layout. Colors recolor the flat painted areas; watercolor and metal details are preserved.</p><div class="theme-actions"><button type="button" id="themeUndo" ${themeUndoHistory.length?'':'disabled'} aria-label="Undo last appearance change">↶ Undo last change</button><button type="button" id="themeRemovePhoto">Remove uploaded image</button><button type="button" id="themeReset">Restore original look</button></div><p id="themeStatus" role="status" class="muted">${safe(msg)}</p>`,'theme');
  let activeTarget='panel';
  function hexFromRgb(rgb){
    const canvas=document.createElement('canvas').getContext('2d');
    canvas.fillStyle=rgb;
    return canvas.fillStyle;
  }
  function updateSelectedTarget(){
    document.querySelectorAll('[data-theme-target]').forEach(btn=>{const selected=btn.dataset.themeTarget===activeTarget;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected))});
    document.getElementById('themeCurrentLabel').textContent='Current color';
    document.getElementById('themePopupTitle').textContent=icons[activeTarget];
    document.getElementById('themeCurrentDot').style.background=theme[activeTarget];
    document.getElementById('themeCustomColor').value=theme[activeTarget];
    document.querySelectorAll('[data-palette-index]').forEach(btn=>{
      const match=hexFromRgb(btn.style.backgroundColor).toLowerCase()===theme[activeTarget].toLowerCase();
      btn.classList.toggle('selected',match);
      btn.setAttribute('aria-pressed',String(match));
    });
  }
  function setTargetColor(color){
    const nextColor=hexFromRgb(color);
    if(theme[activeTarget]===nextColor)return;
    rememberTheme();
    theme[activeTarget]=nextColor;
    const dot=document.querySelector(`[data-theme-dot="${activeTarget}"]`);
    const hex=document.querySelector(`[data-theme-hex="${activeTarget}"]`);
    if(dot)dot.style.background=theme[activeTarget];
    if(hex)hex.textContent=theme[activeTarget].toUpperCase();
    saveTheme();recolorArtwork();updateSelectedTarget();
    document.getElementById('themeUndo').disabled=false;
    document.getElementById('themePopupUndo').disabled=false;
  }
  const colorPopup=document.getElementById('themeColorPopup');
  const closeColorPopup=()=>{colorPopup.hidden=true;document.removeEventListener('keydown',colorPopupEsc)};
  const colorPopupEsc=e=>{if(e.key==='Escape'&&!colorPopup.hidden){e.stopPropagation();closeColorPopup()}};
  document.querySelectorAll('[data-theme-target]').forEach(btn=>btn.addEventListener('click',()=>{
    activeTarget=btn.dataset.themeTarget;updateSelectedTarget();colorPopup.hidden=false;
    document.addEventListener('keydown',colorPopupEsc);
    document.getElementById('themePopupClose').focus();
  }));
  colorPopup.addEventListener('click',e=>{if(e.target===colorPopup)closeColorPopup()});
  document.getElementById('themePopupClose').onclick=closeColorPopup;
  document.getElementById('themePopupDone').onclick=closeColorPopup;
  document.getElementById('themePopupUndo').onclick=()=>{if(!themeUndoHistory.length)return;theme=themeUndoHistory.pop();saveTheme();recolorArtwork();document.querySelectorAll('[data-theme-dot]').forEach(dot=>{const key=dot.dataset.themeDot;dot.style.background=theme[key]});document.querySelectorAll('[data-theme-hex]').forEach(span=>span.textContent=theme[span.dataset.themeHex].toUpperCase());updateSelectedTarget();document.getElementById('themeUndo').disabled=!themeUndoHistory.length;document.getElementById('themePopupUndo').disabled=!themeUndoHistory.length};
  document.querySelectorAll('[data-palette-index]').forEach(btn=>btn.addEventListener('click',()=>setTargetColor(palette[Number(btn.dataset.paletteIndex)])));
  document.getElementById('themeCustomColor').addEventListener('change',e=>setTargetColor(e.target.value));
  updateSelectedTarget();
  document.querySelectorAll('[name=themeMode]').forEach(input=>input.addEventListener('change',()=>{if(input.checked&&theme.mode!==input.value){rememberTheme();theme.mode=input.value;saveTheme();recolorArtwork();document.getElementById('themeUndo').disabled=false}}));
  document.getElementById('themeUpload').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    if(!file.type.startsWith('image/')){document.getElementById('themeStatus').textContent='Please select an image.';return}
    try{const url=URL.createObjectURL(file),im=new Image();im.src=url;await im.decode();URL.revokeObjectURL(url);
      const canvas=document.createElement('canvas');const scale=Math.min(1,1100/im.width,1100/im.height);canvas.width=Math.round(im.width*scale);canvas.height=Math.round(im.height*scale);canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);
      const stored=canvas.toDataURL('image/jpeg',.72),prior={...theme};rememberTheme();theme.photo=stored;theme.mode='photo';
      if(!saveTheme()){theme=prior;themeUndoHistory.pop();document.getElementById('themeStatus').textContent='This image is too large for browser storage. Try a smaller picture.';return}
      recolorArtwork();settings('Background uploaded and saved.');
    }catch{document.getElementById('themeStatus').textContent='Could not read the selected image.'}
  });
  document.getElementById('themeUndo').onclick=undoTheme;
  document.getElementById('themeRemovePhoto').onclick=()=>{if(!theme.photo)return;rememberTheme();theme.photo='';if(theme.mode==='photo')theme.mode='stripes';saveTheme();recolorArtwork();settings('Uploaded image removed.')};
  document.getElementById('themeReset').onclick=()=>{rememberTheme();theme={...original};saveTheme();recolorArtwork();settings('Original appearance restored.')};
 }
 settingsBtn.onclick=()=>settings();
 recolorArtwork();
})();

/* Reserved display data for friend connections. No simulated connections are created. */
const DOG_FRIENDS_KEY='dailytail_connected_dog_friends_v1';
function getConnectedDogFriends(){
  try{const list=JSON.parse(dtSafeStorage.getItem(DOG_FRIENDS_KEY)||'[]');return Array.isArray(list)?list.filter(item=>item&&item.connected===true&&typeof item.name==='string'&&(!item.dogId||item.dogId===dtAccess?.activeId)):[]}catch{return []}
}
function renderDogFriends(){
  const grid=$('dogFriendsGrid'),empty=$('dogFriendsEmpty'),counter=$('dogFriendsCount');
  if(!grid||!empty||!counter)return;
  const friends=(typeof friendPreview!=='undefined'&&friendPreview)?selectedPublicFriends():getConnectedDogFriends();
  counter.textContent=`${friends.length} ${friends.length===1?'friend':'friends'}`;
  grid.replaceChildren();
  empty.hidden=friends.length>0;grid.hidden=friends.length===0;
  friends.forEach(friend=>{
    const b=document.createElement('button');b.className='dog-friend-profile';b.type='button';
    if(typeof friend.photo==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(friend.photo)){
      const img=document.createElement('img');img.src=friend.photo;img.alt='';b.appendChild(img);
    }else{const av=document.createElement('span');av.className='dog-friend-avatar';av.textContent='🐶';av.setAttribute('aria-hidden','true');b.appendChild(av)}
    const name=document.createElement('strong');name.textContent=friend.name;b.appendChild(name);
    if(friend.breed){const breed=document.createElement('small');breed.textContent=String(friend.breed);b.appendChild(breed)}
    b.addEventListener('click',()=>{
      const detail=`<div class="friend-detail" style="text-align:center;padding:16px"><h3>${safe(friend.name)}</h3><p>${safe(friend.breed||'Dog friend')}</p><p>Connected dog friend</p></div>`;
      show(`${friend.name}'s Profile`,detail,'friend');
    });grid.appendChild(b);
  });
}
renderDogFriends();

/* Export an explicitly limited, read-only public data file. No private journal fields. */
(function setupPublicShare(){
 const btn=document.getElementById('exportPublicProfile');
 if(!btn)return;
 btn.addEventListener('click',()=>{
   const includePosts=document.getElementById('shareMemories').checked;
   const includeFriends=document.getElementById('shareFriends').checked;
   const validPhoto=value=>typeof value==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(value)?value:'';
   const publicData={format:'daily-tail-public-v1',exportedAt:new Date().toISOString(),dog:{name:String(appMeta.petName||'My Dog').slice(0,70),photo:validPhoto(state.profile)},posts:includePosts?state.posts.map(p=>({title:String(p.title||'').slice(0,180),story:String(p.story||'').slice(0,2000),photo:validPhoto(p.photo),date:p.date||''})):[],friends:includeFriends?getConnectedDogFriends().map(f=>({name:String(f.name||'').slice(0,70),breed:String(f.breed||'').slice(0,100),photo:validPhoto(f.photo)})):[]};
   const blob=new Blob([JSON.stringify(publicData)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download='Daily_Tail_Public_Profile.json';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1200);
   document.getElementById('shareStatus').textContent='Downloaded a public-only profile file. Open it in the Friends View to preview. To share online later, a hosted profile or account connection will be needed.';
 });
})();

/* Single-page friend preview: same art, restricted visible controls, no account auth. */
const PUBLIC_PREF_KEY='daily_tail_public_preferences_v1';
let publicPrefs={memories:false,friends:false};
try{const saved=JSON.parse(dtSafeStorage.getItem(PUBLIC_PREF_KEY)||'{}');if(saved&&typeof saved==='object')publicPrefs={...publicPrefs,...saved}}catch{}
var friendPreview=false;
const visitorEntry= new URLSearchParams(location.search).get('view')==='friend';
function selectedPublicPosts(){return publicPrefs.memories?state.posts:[]}
function selectedPublicFriends(){return publicPrefs.friends?getConnectedDogFriends():[]}
function friendReadOnlyFeed(){window.DailyTalesSharedMemories(selectedPublicPosts(),appMeta.petName,show);}
function syncFriendView({keepModal=false}={}){
 document.body.classList.toggle('friend-view',friendPreview);
 const roleLabel=document.getElementById('dtRoleLabel');
 if(roleLabel&&window.dtRole){const dogName=String(dtDog()?.name||appMeta.petName||'Dog');roleLabel.textContent=friendPreview?(dogName+' · Friend View preview'):(String(window.dtPerson||'Owner')+' · '+dogName+' · '+({adult:'Adult Owner',child:'Child Owner',friend:'Friend View'}[window.dtRole]||'Owner'));}
 const friendAction=document.getElementById('dtFriendAction'),ownerSearch=document.getElementById('dtOwnerFriendSearch');
 if(friendAction)friendAction.hidden=!friendPreview;
 if(ownerSearch)ownerSearch.hidden=friendPreview||window.dtRole!=='adult';
 document.body.classList.toggle('visitor-entry',visitorEntry);
 $('viewModeCaption').textContent=friendPreview?(visitorEntry?'Public profile preview':'Friend View preview'):'Owner workspace';
 $('ownerModeBtn').classList.toggle('mode-active',!friendPreview);
 $('friendModeBtn').classList.toggle('mode-active',friendPreview);
 $('ownerModeBtn').setAttribute('aria-pressed',String(!friendPreview));
 $('friendModeBtn').setAttribute('aria-pressed',String(friendPreview));
 const name=appMeta.petName||'Lou Bear';
 $('publicDogName').textContent=name;
 const details=getProfileDetails();
 const breed=BREED_DIRECTORY.find(b=>b.id===details.breed)?.name||'';
 const birth=details.dob?new Date(details.dob+'T12:00:00'):null;
 let ageText='';
 if(birth&&!Number.isNaN(birth.getTime())&&birth<=new Date()){
   const now=new Date();
   let months=(now.getFullYear()-birth.getFullYear())*12+now.getMonth()-birth.getMonth();
   if(now.getDate()<birth.getDate())months--;
   months=Math.max(0,months);
   ageText=months<12?`${months} month${months===1?'':'s'} old`:`${Math.floor(months/12)} year${Math.floor(months/12)===1?'':'s'} old`;
 }
 $('publicMeetHeading').textContent='MEET MY DOG';
 $('publicDogBreed').textContent=breed?`Breed: ${breed}`:'Breed: Add in Owner View';
 const birthLabel=birth&&!Number.isNaN(birth.getTime())&&birth<=new Date()
   ?birth.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
   :'Not added yet';
 $('publicDogBirthday').textContent=`Birthday: ${birthLabel}${ageText?` (${ageText})`:''}`;
 const fact=String(appMeta.cuteFact||'').trim();
 const favorites=String(appMeta.favorites||'').trim();
 const personality=String(appMeta.personality||'').trim();
 $('publicDogCuteFact').textContent=fact?`🐾 ${fact}`:favorites?`🐾 Loves ${favorites}`:personality?`🐾 ${personality}`:'🐾 A little dog with a big personality!';
 $('dtFactsDogName').textContent=name;
 $('dtFactsBreed').textContent=breed||'Not added yet';
 $('dtFactsBirthday').textContent=birthLabel==='Not added yet'?'Not added yet':`${birthLabel}${ageText?` · ${ageText}`:''}`;
 $('dtFactsQuote').textContent=fact|| (favorites?`Loves ${favorites}`:personality||'A little dog with a big personality!');
 const posts=selectedPublicPosts(),latest=friendPreview?posts[0]:state.posts[0];
 if(friendPreview){
  $('recentPostTitle').textContent=latest?(latest.title||'Recent memory'):'Memories coming soon';
  $('recentPostSummary').textContent=latest?String(latest.story||'Tap to see our memories').slice(0,90):'See our shared moments';
  const img=$('recentPostThumb');
  const recentPhotos=posts.filter(post=>typeof post.photo==='string'&&post.photo.trim()).slice(0,3);
  const thumbs=$('friendRecentThumbs');
  thumbs.replaceChildren();
  recentPhotos.forEach((post,index)=>{const photo=document.createElement('img');photo.src=post.photo;photo.alt='Shared memory photo '+(index+1);photo.loading='lazy';thumbs.appendChild(photo)});
  thumbs.hidden=recentPhotos.length===0;
  if(latest?.photo){img.src=latest.photo;img.hidden=false;}else{img.hidden=true;img.removeAttribute('src');}

  $('portraitBtn').setAttribute('aria-label',`${name} profile photo`);
  $('tag').setAttribute('aria-label',`${name}'s dog tag`);
  $('recent').setAttribute('aria-label','View shared memories');
 }else{
  $('friendRecentThumbs').hidden=true;
  $('friendRecentThumbs').replaceChildren();
  refresh();
  $('portraitBtn').setAttribute('aria-label','Open pet profile and change photo');
  $('tag').setAttribute('aria-label','Edit engraved pet tag name');
  $('recent').setAttribute('aria-label','Open recent posts and memories');
 }
 // Dog friends section is the same physical component, filtered for the visitor.
 renderDogFriends();
 if(!keepModal)close();
}
$('ownerModeBtn').addEventListener('click',()=>{if(window.dtRole==='friend')return;friendPreview=false;syncFriendView()});
$('friendModeBtn').addEventListener('click',()=>{friendPreview=true;syncFriendView()});
$('portraitBtn').onclick=()=>{if(!friendPreview)profile()};
$('tag').onclick=()=>{if(!friendPreview)editTagName()};
$('recent').onclick=()=>friendPreview?friendReadOnlyFeed():feed();
$('appTitleBtn').onclick=()=>friendPreview?show('Welcome to Daily Tail',`<p>Meet ${safe(appMeta.petName||'Lou Bear')} and browse the moments their family shares.</p>`,'friend-help'):howToUse();
$('shareMemories').checked=!!publicPrefs.memories;
$('shareFriends').checked=!!publicPrefs.friends;
for(const [id,key] of [['shareMemories','memories'],['shareFriends','friends']]){
 $(id).addEventListener('change',()=>{
  publicPrefs[key]=$(id).checked;
  try{dtSafeStorage.setItem(PUBLIC_PREF_KEY,JSON.stringify(publicPrefs))}catch{}
  $('shareStatus').textContent='Sharing preferences saved.';
  window.DailyTalesRefreshPublic?.(dtAccess.activeId).catch(e=>console.error('Could not refresh shared memories',e));
  if(friendPreview)syncFriendView({keepModal:true});
 });
}
friendPreview=visitorEntry;
syncFriendView();

/* Offline family sharing: a password-encrypted, owner-curated public snapshot. */
const familyTemplateB64='PCFkb2N0eXBlIGh0bWw+PGh0bWwgbGFuZz0iZW4iPjxoZWFkPjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij48bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLGluaXRpYWwtc2NhbGU9MSI+PHRpdGxlPkRhaWx5IFRhaWwgwrcgRmFtaWx5IFBhc3M8L3RpdGxlPjxzdHlsZT4KOnJvb3R7Zm9udC1mYW1pbHk6QXJpYWwsc2Fucy1zZXJpZjtjb2xvcjojMmMzMDM1O2JhY2tncm91bmQ6I2Y1ZWZlNn0qe2JveC1zaXppbmc6Ym9yZGVyLWJveH1ib2R5e21hcmdpbjowO2JhY2tncm91bmQ6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg5MGRlZywjZWVlOWUwIDAgMjVweCwjOWRhZmJjIDI1cHggNDNweCwjZWVlOWUwIDQzcHggNjhweCk7bWluLWhlaWdodDoxMDB2aH1oZWFkZXJ7YmFja2dyb3VuZDojZDZlM2ViO2JvcmRlci1ib3R0b206M3B4IHNvbGlkICM4MjlhYWM7cGFkZGluZzoxMnB4IDE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjE0cHg7bGV0dGVyLXNwYWNpbmc6LjAzZW19LmNvbnRhaW5lcnttYXgtd2lkdGg6NjQwcHg7bWFyZ2luOjE4cHggYXV0bztwYWRkaW5nOjAgMTZweCA3MHB4fS5wYW5lbHtwb3NpdGlvbjpyZWxhdGl2ZTtiYWNrZ3JvdW5kOiNiNzdiNTE7Ym9yZGVyOjhweCBzb2xpZCAjMTAwZDBiO2JvcmRlci1yYWRpdXM6MjZweDtwYWRkaW5nOjMwcHggMTdweDt0ZXh0LWFsaWduOmNlbnRlcjtib3gtc2hhZG93OjAgOHB4IDI2cHggIzJiMjUxZDQwfS5icmFuZHtmb250OjcwMCBjbGFtcCgzNnB4LDl2dyw1NHB4KSBHZW9yZ2lhLHNlcmlmO2NvbG9yOiNmN2Y0ZWY7dGV4dC1zaGFkb3c6MXB4IDNweCAycHggIzRiNDEzOTttYXJnaW46MnB4IDAgN3B4fS5ib25le2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEyNWRlZywjZTJlM2UzLCNhOGFhYTksI2Y3ZjhmNywjYjZiNmI0KTtib3JkZXI6M3B4IHNvbGlkICNlNGUzZTE7Ym9yZGVyLXJhZGl1czozNHB4O2JveC1zaGFkb3c6MCAzcHggNHB4ICMwMDA1O2Rpc3BsYXk6aW5saW5lLWJsb2NrO21pbi13aWR0aDoxMzBweDt0cmFuc2Zvcm06cm90YXRlKC0xMGRlZyk7cGFkZGluZzoxMHB4IDI0cHg7Zm9udDo3MDAgMjVweCBHZW9yZ2lhLHNlcmlmO21hcmdpbjoxMnB4IDAgMThweDtjb2xvcjojMzkzNjM4fS5wb3J0cmFpdHt3aWR0aDptaW4oNjJ2dywyODBweCk7aGVpZ2h0Om1pbig2MnZ3LDI4MHB4KTtib3JkZXItcmFkaXVzOjUwJTtvYmplY3QtZml0OmNvdmVyO2JvcmRlcjo2cHggc29saWQgI2JlZDFkZjtib3gtc2hhZG93OjAgMCAwIDJweCAjNzA4YjljO2JhY2tncm91bmQ6I2RjZTRlOTtkaXNwbGF5OmJsb2NrO21hcmdpbjowIGF1dG8gMTVweH0uc2VjdGlvbntiYWNrZ3JvdW5kOiNmNmYwZTc7Ym9yZGVyOjNweCBzb2xpZCAjOTZhZWJlO2JvcmRlci1yYWRpdXM6MThweDttYXJnaW4tdG9wOjE2cHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246bGVmdH0uc2VjdGlvbiBoMntmb250OjcwMCAyNHB4IEdlb3JnaWEsc2VyaWY7bWFyZ2luOjAgMCAxMHB4fS5wb3N0e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpzdGFydDtnYXA6MTJweDtwYWRkaW5nOjEycHggMDtib3JkZXItdG9wOjFweCBzb2xpZCAjYmJjOGNmfS5wb3N0IGltZ3t3aWR0aDo2OHB4O2hlaWdodDo2OHB4O29iamVjdC1maXQ6Y292ZXI7Ym9yZGVyLXJhZGl1czoxMXB4O2ZsZXg6bm9uZX0ucG9zdCBoM3tmb250OjcwMCAxOXB4IEdlb3JnaWEsc2VyaWY7bWFyZ2luOjAgMCA1cHg7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0ucG9zdCBwe2ZvbnQ6MTRweC8xLjQ1IEFyaWFsLHNhbnMtc2VyaWY7bWFyZ2luOjA7d2hpdGUtc3BhY2U6cHJlLXdyYXA7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0uZG9ne2Rpc3BsYXk6ZmxleDtnYXA6MTBweDthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyLXRvcDoxcHggc29saWQgI2JiYzhjZjtwYWRkaW5nOjEwcHggMH0uZG9nIGltZ3t3aWR0aDo0OHB4O2hlaWdodDo0OHB4O29iamVjdC1maXQ6Y292ZXI7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDojY2NkN2RmfS5kb2cgc3Ryb25ne2Rpc3BsYXk6YmxvY2t9Lm11dGVke2NvbG9yOiM1ODYzNmU7Zm9udDoxNHB4LzEuNCBBcmlhbCxzYW5zLXNlcmlmfS5sb2Nre21heC13aWR0aDo0MjBweDttYXJnaW46MTB2aCBhdXRvIDA7cGFkZGluZzoyNHB4O2JhY2tncm91bmQ6I2ZkZjlmMztib3JkZXI6MnB4IHNvbGlkICNhOGJiYzk7Ym9yZGVyLXJhZGl1czoyMnB4O2JveC1zaGFkb3c6MCA1cHggMjVweCAjMDAwMn1pbnB1dHtmb250OjYwMCAyMHB4IEFyaWFsO3BhZGRpbmc6MTNweDtib3JkZXI6MnB4IHNvbGlkICM4ZWFhYjg7Ym9yZGVyLXJhZGl1czoxMnB4O3dpZHRoOjEwMCU7bGV0dGVyLXNwYWNpbmc6LjFlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bWFyZ2luOjhweCAwIDE0cHh9YnV0dG9ue2JhY2tncm91bmQ6IzM2NWM3Mztjb2xvcjp3aGl0ZTtib3JkZXI6MDtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxMnB4IDE4cHg7Zm9udDo3MDAgMTZweCBBcmlhbDtjdXJzb3I6cG9pbnRlcjt3aWR0aDoxMDAlfS5lcnJvcntjb2xvcjojYjIyNjI2O21pbi1oZWlnaHQ6MjBweH0jc2hhcmVkW2hpZGRlbl0sI3VubG9ja1toaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9c21hbGx7bGluZS1oZWlnaHQ6MS40O2NvbG9yOiM1MTYyNzN9Cjwvc3R5bGU+PC9oZWFkPjxib2R5PjxoZWFkZXI+RGFpbHkgVGFpbCDCtyBQcml2YXRlIEZhbWlseSBQYXNzPC9oZWFkZXI+PG1haW4gaWQ9InVubG9jayIgY2xhc3M9ImNvbnRhaW5lciI+PGRpdiBjbGFzcz0ibG9jayI+PGgxIHN0eWxlPSJmb250OjcwMCAzMHB4IEdlb3JnaWEsc2VyaWY7bWFyZ2luOjAgMCA4cHgiPvCfkL4gRmFtaWx5ICYgRnJpZW5kczwvaDE+PHA+RW50ZXIgdGhlIGFjY2VzcyBjb2RlIHlvdSByZWNlaXZlZCBmcm9tIHRoZSBkb2cncyBvd25lciB0byBzZWUgdGhlIHNoYXJlZCBwcm9maWxlLjwvcD48bGFiZWwgZm9yPSJwYXNzIj5GYW1pbHkgYWNjZXNzIGNvZGU8L2xhYmVsPjxpbnB1dCBpZD0icGFzcyIgYXV0b2NvbXBsZXRlPSJvZmYiIHNwZWxsY2hlY2s9ImZhbHNlIiBwbGFjZWhvbGRlcj0iWFhYWC1YWFhYLVhYWFgiPjxidXR0b24gaWQ9InVubG9ja0J0biI+VmlldyBQcm9maWxlPC9idXR0b24+PHAgY2xhc3M9ImVycm9yIiBpZD0iZXJyIiByb2xlPSJhbGVydCI+PC9wPjxzbWFsbD5UaGlzIGZpbGUgaXMgYSByZWFkLW9ubHkgc25hcHNob3QuIFRoZSBvd25lciBtdXN0IHNlbmQgYW4gdXBkYXRlZCBGYW1pbHkgUGFzcyB3aGVuIHRoZSBwcm9maWxlIGNoYW5nZXMuPC9zbWFsbD48L2Rpdj48L21haW4+PG1haW4gaWQ9InNoYXJlZCIgY2xhc3M9ImNvbnRhaW5lciIgaGlkZGVuPjxkaXYgY2xhc3M9InBhbmVsIj48aDEgY2xhc3M9ImJyYW5kIj5EYWlseSBUYWlsPC9oMT48ZGl2IGNsYXNzPSJib25lIiBpZD0icGV0Ij48L2Rpdj48aW1nIGNsYXNzPSJwb3J0cmFpdCIgaWQ9InBob3RvIiBhbHQ9IkRvZyBwcm9maWxlIHBvcnRyYWl0Ij48cCBzdHlsZT0iZm9udDppdGFsaWMgMTdweCBHZW9yZ2lhLHNlcmlmO2NvbG9yOiNmYmVmZTU7bWFyZ2luOjAiPkFkdmVudHVyZXMsIG1lbW9yaWVzICYgZG9nIGZyaWVuZHM8L3A+PC9kaXY+PGRpdiBjbGFzcz0ic2VjdGlvbiI+PGgyPlJlY2VudCBQb3N0czwvaDI+PGRpdiBpZD0icG9zdHMiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9InNlY3Rpb24iPjxoMj5Eb2cgRnJpZW5kcyDwn5C+PC9oMj48ZGl2IGlkPSJmcmllbmRzIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJzZWN0aW9uIj48aDI+Q29ubmVjdCBhcyBEb2cgRnJpZW5kczwvaDI+PHAgY2xhc3M9Im11dGVkIj5Xb3VsZCB5b3UgbGlrZSB5b3VyIGRvZydzIHByb2ZpbGUgdG8gYXBwZWFyIGluIHRoaXMgZG9nJ3MgRnJpZW5kcyBzZWN0aW9uPyBEb3dubG9hZCBhIGZyaWVuZCByZXF1ZXN0IGFuZCBzZW5kIGl0IHRvIHRoZSBvd25lciBmb3IgYXBwcm92YWwuPC9wPjxidXR0b24gaWQ9InJlcXVlc3RGcmllbmQiIHR5cGU9ImJ1dHRvbiI+77yLIFNlbmQgZnJpZW5kIHJlcXVlc3Q8L2J1dHRvbj48Zm9ybSBpZD0icmVxdWVzdEZyaWVuZEZvcm0iIGhpZGRlbj48bGFiZWwgZm9yPSJyZXFQZXJzb24iPllvdXIgbmFtZTwvbGFiZWw+PGlucHV0IGlkPSJyZXFQZXJzb24iIG1heGxlbmd0aD0iNDAiIHBsYWNlaG9sZGVyPSJZb3VyIG5hbWUiIHJlcXVpcmVkPjxsYWJlbCBmb3I9InJlcURvZyI+RG9nJ3MgbmFtZTwvbGFiZWw+PGlucHV0IGlkPSJyZXFEb2ciIG1heGxlbmd0aD0iNTAiIHBsYWNlaG9sZGVyPSJEb2cncyBuYW1lIiByZXF1aXJlZD48bGFiZWwgZm9yPSJyZXFCcmVlZCI+QnJlZWQgKG9wdGlvbmFsKTwvbGFiZWw+PGlucHV0IGlkPSJyZXFCcmVlZCIgbWF4bGVuZ3RoPSI4MCIgcGxhY2Vob2xkZXI9IkJyZWVkIG9yIG1peCI+PGxhYmVsIGZvcj0icmVxUGhvdG8iPkRvZyBwaG90byAob3B0aW9uYWwpPC9sYWJlbD48aW5wdXQgaWQ9InJlcVBob3RvIiB0eXBlPSJmaWxlIiBhY2NlcHQ9ImltYWdlLyoiPjxidXR0b24gdHlwZT0ic3VibWl0Ij5Eb3dubG9hZCByZXF1ZXN0IGZpbGU8L2J1dHRvbj48L2Zvcm0+PHNtYWxsIGlkPSJyZXF1ZXN0SGludCI+VGhlIG93bmVyIG11c3QgaW1wb3J0IGFuZCBhcHByb3ZlIHlvdXIgcmVxdWVzdDsgdGhpcyBvZmZsaW5lIHBhc3MgY2Fubm90IHNlbmQgaXQgYXV0b21hdGljYWxseS48L3NtYWxsPjwvZGl2PjxwIGNsYXNzPSJtdXRlZCI+U2hhcmVkIGJ5IHRoZSBvd25lciDCtyBSZWFkIG9ubHkgwrcgU25hcHNob3QgZ2VuZXJhdGVkIDxzcGFuIGlkPSJkYXRlIj48L3NwYW4+PC9wPjwvbWFpbj48c2NyaXB0Pgpjb25zdCBQQUNLPV9fRU5DUllQVEVEX187CmZ1bmN0aW9uIHVuYjY0KHMpe3JldHVybiBVaW50OEFycmF5LmZyb20oYXRvYihzKSxjPT5jLmNoYXJDb2RlQXQoMCkpfQpmdW5jdGlvbiBodG1sRXNjYXBlKHMpe3JldHVybiBTdHJpbmcoc3x8JycpLnJlcGxhY2UoL1smPD4iJ10vZyxjPT4oeycmJzonJmFtcDsnLCc8JzonJmx0OycsJz4nOicmZ3Q7JywnIic6JyZxdW90OycsIiciOicmIzM5Oyd9W2NdKSl9CmFzeW5jIGZ1bmN0aW9uIHVubG9jaygpe2NvbnN0IGVycj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXJyJyk7ZXJyLnRleHRDb250ZW50PScnO2NvbnN0IGNvZGU9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3MnKS52YWx1ZS50b1VwcGVyQ2FzZSgpLnJlcGxhY2UoL1teQS1aMi05XS9nLCcnKTtpZighY29kZSl7ZXJyLnRleHRDb250ZW50PSdFbnRlciB0aGUgYWNjZXNzIGNvZGUuJztyZXR1cm59aWYoIWNyeXB0bz8uc3VidGxlKXtlcnIudGV4dENvbnRlbnQ9J1RoaXMgYnJvd3NlciBjYW5ub3Qgb3BlbiBlbmNyeXB0ZWQgRmFtaWx5IFBhc3Nlcy4gVHJ5IG9wZW5pbmcgdGhlIGZpbGUgd2l0aCB0aGUgbGF0ZXN0IENocm9tZSBicm93c2VyLic7cmV0dXJufXRyeXtjb25zdCBrZXlSYXc9YXdhaXQgY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoJ3JhdycsbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGNvZGUpLCdQQktERjInLGZhbHNlLFsnZGVyaXZlS2V5J10pO2NvbnN0IGtleT1hd2FpdCBjcnlwdG8uc3VidGxlLmRlcml2ZUtleSh7bmFtZTonUEJLREYyJyxzYWx0OnVuYjY0KFBBQ0sucyksaXRlcmF0aW9uczoxNjAwMDAsaGFzaDonU0hBLTI1Nid9LGtleVJhdyx7bmFtZTonQUVTLUdDTScsbGVuZ3RoOjI1Nn0sZmFsc2UsWydkZWNyeXB0J10pO2NvbnN0IGRhdGE9YXdhaXQgY3J5cHRvLnN1YnRsZS5kZWNyeXB0KHtuYW1lOidBRVMtR0NNJyxpdjp1bmI2NChQQUNLLmkpfSxrZXksdW5iNjQoUEFDSy5jKSk7Y29uc3QgcHJvZmlsZT1KU09OLnBhcnNlKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShkYXRhKSk7ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BldCcpLnRleHRDb250ZW50PXByb2ZpbGUubmFtZXx8J015IERvZyc7Y29uc3QgcGhvdG89ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bob3RvJyk7aWYocHJvZmlsZS5wcm9maWxlKXtwaG90by5zcmM9cHJvZmlsZS5wcm9maWxlfWVsc2V7cGhvdG8uc3R5bGUuZGlzcGxheT0nbm9uZSd9O2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3N0cycpLmlubmVySFRNTD1wcm9maWxlLnBvc3RzLmxlbmd0aD9wcm9maWxlLnBvc3RzLm1hcChwPT5gPGFydGljbGUgY2xhc3M9InBvc3QiPiR7cC5waG90bz9gPGltZyBhbHQ9Ik1lbW9yeSB0aHVtYm5haWwiIHNyYz0iJHtwLnBob3RvfSI+YDonJ308ZGl2PjxoMz4ke2h0bWxFc2NhcGUocC50aXRsZSl9PC9oMz48cD4ke2h0bWxFc2NhcGUocC5zdG9yeSl9PC9wPjwvZGl2PjwvYXJ0aWNsZT5gKS5qb2luKCcnKTonPHAgY2xhc3M9Im11dGVkIj5ObyBzaGFyZWQgbWVtb3JpZXMgeWV0LjwvcD4nO2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmcmllbmRzJykuaW5uZXJIVE1MPXByb2ZpbGUuZnJpZW5kcy5sZW5ndGg/cHJvZmlsZS5mcmllbmRzLm1hcChmPT5gPGRpdiBjbGFzcz0iZG9nIj4ke2YucGhvdG8/YDxpbWcgYWx0PSIiIHNyYz0iJHtmLnBob3RvfSI+YDonJ308ZGl2PjxzdHJvbmc+JHtodG1sRXNjYXBlKGYubmFtZSl9PC9zdHJvbmc+PHNwYW4gY2xhc3M9Im11dGVkIj4ke2h0bWxFc2NhcGUoZi5icmVlZHx8JycpfTwvc3Bhbj48L2Rpdj48L2Rpdj5gKS5qb2luKCcnKTonPHAgY2xhc3M9Im11dGVkIj5ObyBkb2cgZnJpZW5kcyBzaGFyZWQgeWV0LjwvcD4nO2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXRlJykudGV4dENvbnRlbnQ9bmV3IERhdGUocHJvZmlsZS5kYXRlKS50b0xvY2FsZURhdGVTdHJpbmcoKTtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndW5sb2NrJykuaGlkZGVuPXRydWU7ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlZCcpLmhpZGRlbj1mYWxzZTt3aW5kb3cuc2Nyb2xsVG8oMCwwKX1jYXRjaChlKXtlcnIudGV4dENvbnRlbnQ9J1RoYXQgY29kZSBkaWQgbm90IHVubG9jayB0aGlzIEZhbWlseSBQYXNzLiBDaGVjayB0aGUgY29kZSBhbmQgdHJ5IGFnYWluLid9fQpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndW5sb2NrQnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLHVubG9jayk7ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3MnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJyxlPT57aWYoZS5rZXk9PT0nRW50ZXInKXVubG9jaygpfSk7CgovLyBPZmZsaW5lIGZyaWVuZCByZXF1ZXN0OiBkb3dubG9hZCBhIGZpbGUgdGhlIG93bmVyIGNhbiBpbXBvcnQgYW5kIGFwcHJvdmUuCmNvbnN0IHJmPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXF1ZXN0RnJpZW5kRm9ybScpOwpkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVxdWVzdEZyaWVuZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywoKT0+e3JmLmhpZGRlbj0hcmYuaGlkZGVufSk7CnJmLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsYXN5bmMgZXZlbnQ9PntldmVudC5wcmV2ZW50RGVmYXVsdCgpO2NvbnN0IHBob3RvRmlsZT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVxUGhvdG8nKS5maWxlc1swXTtsZXQgcGhvdG89Jyc7aWYocGhvdG9GaWxlKXtpZihwaG90b0ZpbGUuc2l6ZT4xNTAwMDAwKXtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVxdWVzdEhpbnQnKS50ZXh0Q29udGVudD0nUGxlYXNlIGNob29zZSBhbiBpbWFnZSBzbWFsbGVyIHRoYW4gMS41IE1CLic7cmV0dXJufXBob3RvPWF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCk9Pntjb25zdCByPW5ldyBGaWxlUmVhZGVyO3Iub25sb2FkPSgpPT5yZXNvbHZlKFN0cmluZyhyLnJlc3VsdCkpO3Iub25lcnJvcj1yZWplY3Q7ci5yZWFkQXNEYXRhVVJMKHBob3RvRmlsZSl9KX1jb25zdCBieXRlcz1uZXcgVWludDhBcnJheSg5KTtpZihjcnlwdG8/LmdldFJhbmRvbVZhbHVlcyljcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGJ5dGVzKTtlbHNlIGZvcihsZXQgaT0wO2k8OTtpKyspYnl0ZXNbaV09TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjI1Nik7Y29uc3QgaWQ9J2R0JytBcnJheS5mcm9tKGJ5dGVzLHg9PngudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsJzAnKSkuam9pbignJyk7Y29uc3QgcmVxdWVzdD17Zm9ybWF0OidkYWlseS10YWlsLWZyaWVuZC1yZXF1ZXN0LXYxJyxpZCxwZXJzb246ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcVBlcnNvbicpLnZhbHVlLnRyaW0oKSxkb2dOYW1lOmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXFEb2cnKS52YWx1ZS50cmltKCksYnJlZWQ6ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcUJyZWVkJykudmFsdWUudHJpbSgpLHBob3RvLGRhdGU6bmV3IERhdGUoKS50b0lTT1N0cmluZygpfTtjb25zdCB1cmw9VVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbSlNPTi5zdHJpbmdpZnkocmVxdWVzdCldLHt0eXBlOidhcHBsaWNhdGlvbi9qc29uJ30pKTtjb25zdCBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTthLmhyZWY9dXJsO2EuZG93bmxvYWQ9J0RhaWx5X1RhaWxfRnJpZW5kX1JlcXVlc3QuanNvbic7ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTthLmNsaWNrKCk7YS5yZW1vdmUoKTtzZXRUaW1lb3V0KCgpPT5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCksMjAwMCk7ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcXVlc3RIaW50JykudGV4dENvbnRlbnQ9J1JlcXVlc3QgZG93bmxvYWRlZC4gU2VuZCB0aGlzIEpTT04gZmlsZSB0byB0aGUgZG9nIG93bmVyOyB0aGV5IGNhbiBpbXBvcnQgYW5kIGFwcHJvdmUgaXQuJ30pOwo8L3NjcmlwdD48L2JvZHk+PC9odG1sPg==';
function familyB64(bytes){let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary)}
function familyCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const raw=new Uint8Array(12);crypto.getRandomValues(raw);let code='';for(let i=0;i<12;i++)code+=chars[raw[i]%chars.length];return code.match(/.{1,4}/g).join('-')}
function familyDownload(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function createFamilyPass(){const status=$('familyPassStatus'),result=$('familyPassResult');result.hidden=false;status.textContent='Preparing Family Pass…';if(!crypto?.subtle){status.textContent='Encrypted Family Passes need Web Crypto. Try opening the Owner View in a recent Chrome browser over HTTPS or from a local file.';return}try{
const connected=selectedPublicFriends().map(f=>({name:String(f.name||''),breed:String(f.breed||''),photo:String(f.photo||f.image||f.avatar||'')}));
const posts=selectedPublicPosts().map(p=>({title:String(p.title||''),story:String(p.story||''),photo:String(p.photo||'')}));
const payload={name:String(appMeta.petName||'My Dog'),profile:String(state.profile||''),posts,friends:connected,date:new Date().toISOString()};
const access=familyCode(), normalized=access.replace(/-/g,'');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(normalized),'PBKDF2',false,['deriveKey']);
const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:160000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt']);
const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(payload))));
const pack={s:familyB64(salt),i:familyB64(iv),c:familyB64(ciphertext)};
const original=new TextDecoder().decode(Uint8Array.from(atob(familyTemplateB64),c=>c.charCodeAt(0)));const finished=original.replace('__ENCRYPTED__',JSON.stringify(pack));
familyDownload(finished,'Daily_Tail_Family_Pass.html');$('familyAccessCode').value=access;
status.textContent='Family Pass downloaded. Send the HTML file to your family, then send them this code separately. Creating a new pass does not cancel previous ones.';
}catch(e){status.textContent='Could not create pass: '+String(e?.message||e)}}
$('makeFamilyPass').addEventListener('click',createFamilyPass);
$('copyFamilyCode').addEventListener('click',()=>{const field=$('familyAccessCode');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(field.value).then(()=>$('familyPassStatus').textContent='Code copied. Send it separately from the file.').catch(()=>{field.focus();field.select()});else{field.focus();field.select()}});


/* Three-role local family access, role-scoped interface and approval inbox. */
const DT_ACCESS_KEY='daily_tail_roles_v2',DT_QUEUE_KEY='daily_tail_pending_approvals_v2';
let dtAccess={dogs:[],activeId:null};
try{const a=JSON.parse(dtSafeStorage.getItem(DT_ACCESS_KEY)||'null');if(a&&Array.isArray(a.dogs))dtAccess=a}catch{}
window.dtRole='locked';window.dtPerson='';
let dtPending=[];try{const q=JSON.parse(dtSafeStorage.getItem(DT_QUEUE_KEY)||'[]');if(Array.isArray(q))dtPending=q}catch{}
const dtId=()=>('dt'+Date.now().toString(36)+Math.random().toString(36).slice(2,9));
function dtStore(){dtSafeStorage.setItem(DT_ACCESS_KEY,JSON.stringify(dtAccess))}
function dtSaveQueue(){try{dtSafeStorage.setItem(DT_QUEUE_KEY,JSON.stringify(dtPending))}catch{alert('Storage full. Reduce photo size and try again.')}}
function dtQueue(item){const pending={...item,id:dtId(),dogId:dtAccess.activeId,at:new Date().toISOString()};dtPending.push(pending);dtSaveQueue();if(window.DailyTalesSubmitProposal)void window.DailyTalesSubmitProposal(pending)}
function dtCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let b=new Uint8Array(12);if(crypto?.getRandomValues)crypto.getRandomValues(b);else for(let i=0;i<12;i++)b[i]=Math.floor(Math.random()*256);return Array.from(b,v=>chars[v%chars.length]).join('').replace(/(.{4})/g,'$1-').replace(/-$/,'')}
function dtCleanCode(s){return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toUpperCase()}
function dtDog(){return dtAccess.dogs.find(d=>d.id===dtAccess.activeId)}
function dtCardHtml(text){return '<p>'+safe(text)+'</p>'}
function dtGateHtml(html){
 const warning=window.__dtPersistentStorage===false?`<div class="dt-persistence-warning" role="alert"><strong>Temporary mode:</strong> This browser is blocking saved storage. Daily Tail can open, but profiles and changes will be lost when this file closes. Open the HTML in Chrome from a stable web address or use a private backup file. Do not set up a permanent account here.</div>`:'';
 $('dtGateContent').innerHTML=warning+html;
 $('dtGate').classList.toggle('dt-picker-screen',html.includes('id="dtPickerSignOut"'));
}

/* Local identity: username identifies a saved person; PIN is a convenience unlock on this browser. */
const DT_REMEMBER_KEY='daily_tail_remembered_identity_v1';
function dtUsername(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,'');}
function dtValidUser(value){return /^[a-z0-9][a-z0-9._-]{2,23}$/.test(dtUsername(value));}
function dtFindUser(name){return (dtAccess.users||[]).find(u=>u.username===dtUsername(name));}
// Backward-compatible upgrade: legacy users had one role and dogId.
function dtLinks(u){
 if(!u)return [];
 if(!Array.isArray(u.dogs))u.dogs=u.dogId?[{dogId:u.dogId,role:u.role||'friend'}]:[];
 const seen=new Set();u.dogs=u.dogs.filter(link=>{
  if(!link||!dtAccess.dogs.some(d=>d.id===link.dogId)||seen.has(link.dogId))return false;
  seen.add(link.dogId);return true;
 });return u.dogs;
}
function dtLinkDog(u,dogId,role){
 const links=dtLinks(u),existing=links.find(link=>link.dogId===dogId);
 const levels={friend:0,child:1,adult:2};
 if(existing){if(levels[role]>levels[existing.role])existing.role=role}
 else links.push({dogId,role});
 if(!u.dogId){u.dogId=dogId;u.role=role}
 dtStore();
}
let dtCurrentUsername='';

function dtPinHash(pin,salt){let h=2166136261;const str=salt+':'+pin;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function dtRegisterUser(person,username,pin,role,dogId){
 username=dtUsername(username);
 if(!dtValidUser(username))throw Error('Use a username of 3 to 24 characters: letters, numbers, dots, underscores, or dashes.');
 if(dtFindUser(username))throw Error('That username is already taken on this device. Choose another.');
 if(!/^\d{4,6}$/.test(pin))throw Error('Choose a 4–6 digit PIN.');
 const salt=dtId(),u={username,name:person,role,dogId,dogs:[{dogId,role}],salt,pinHash:dtPinHash(pin,salt)};
 dtAccess.users=dtAccess.users||[];dtAccess.users.push(u);dtStore();return u;
}
function dtRememberUser(username,remember){
 if(remember){try{dtSafeStorage.setItem(DT_REMEMBER_KEY,username)}catch{}}
 else dtSafeStorage.removeItem(DT_REMEMBER_KEY);
}
function dtEnterNamedUser(u,remember){if(!u)return;dtCurrentUsername=u.username;dtRememberUser(u.username,remember);dtDogPicker();}
function dtUnlockUser(username,pin,remember){const u=dtFindUser(username);if(!u||dtPinHash(pin,u.salt)!==u.pinHash)throw Error('Username or PIN not recognized. You can also use your invitation code.');dtEnterNamedUser(u,remember)}
function dtDownloadBackup(){
 if(window.dtRole!=='adult'){alert('Only an Adult Owner can back up all private family records.');return}
 if(window.dtRole==='adult')dtSnapshotActive();
 const data={format:'daily-tail-complete-backup-v1',createdAt:new Date().toISOString(),data:{}};
 for(let i=0;i<dtSafeStorage.length;i++){
   const key=dtSafeStorage.key(i);
   if(/^(daily.tail|dailytail|loubear|lou_bear|dt_)/i.test(key)&&key!==DT_REMEMBER_KEY){data.data[key]=dtSafeStorage.getItem(key)}
 }
 const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Daily_Tail_Private_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 alert('Backup downloaded. Keep this file private: it contains saved profiles, images, logs, and access codes.');
}
async function dtRestoreBackup(file){
 if(!file)return;
 try{
   const obj=JSON.parse(await file.text());
   if(obj.format!=='daily-tail-complete-backup-v1'||!obj.data||typeof obj.data!=='object'||!obj.data[DT_ACCESS_KEY])throw Error('This is not a complete Daily Tail backup.');
   const access=JSON.parse(obj.data[DT_ACCESS_KEY]);
   if(!Array.isArray(access.dogs))throw Error('The backup has no valid dog profiles.');
   if(!confirm('Restore this Daily Tail backup? It will replace Daily Tail data currently saved in this browser.'))return;
   const entries=Object.entries(obj.data).filter(([key,value])=>typeof value==='string'&&/^(daily.tail|dailytail|loubear|lou_bear|dt_)/i.test(key));
   // Reapply the backup in a single reversible operation where possible.
   const old={}; for(const [key] of entries)old[key]=dtSafeStorage.getItem(key);
   try{for(const [key,value] of entries)dtSafeStorage.setItem(key,value)}catch(err){for(const [key,value] of Object.entries(old)){if(value===null)dtSafeStorage.removeItem(key);else dtSafeStorage.setItem(key,value)}throw Error('Not enough browser storage to restore the backup. Try removing unneeded local files or using a different browser.');}
   dtSafeStorage.removeItem(DT_REMEMBER_KEY);alert('Backup restored. Daily Tail will reload. Use your username and PIN to open your saved profile.');location.reload();
 }catch(err){alert('Unable to restore backup: '+err.message)}
}
function dtGateWithRecover(note){dtSignInGate(note)}
function dtSignInGate(note=''){
 const setup=dtAccess.dogs.length===0;
 if(!setup&&(!Array.isArray(dtAccess.users)||dtAccess.users.length===0)){
   dtGateHtml(`<h2>Welcome Back to Daily Tail</h2><p>Your saved dog profiles were found, but this older version didn't have individual usernames yet. <strong>Don't create a new dog.</strong> Link an existing profile using its Adult Owner invitation code, or restore a private backup.</p><form id="dtClaimOldDog"><label>Your name<input name="person" required maxlength="40" placeholder="Your name"></label><label>Create a username<input name="username" required maxlength="24"  placeholder="Your username"></label><label>Create a 4–6 digit PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" required></label><label>Existing Adult Owner code<input name="code" required placeholder="XXXX-XXXX-XXXX"></label><button class="primary" type="submit">Reconnect to My Dog</button></form><p class="dt-error" id="dtGateError">${safe(note)}</p><button type="button" id="dtRecoverBackup">Restore a Previous Daily Tail Backup</button><input id="dtRecoverFile" type="file" accept=".json,application/json" hidden>`);
   $('dtClaimOldDog').onsubmit=e=>{e.preventDefault();const f=e.target,code=dtCleanCode(f.elements.code.value);const dog=dtAccess.dogs.find(d=>dtCleanCode(d.adult)===code);if(!dog){$('dtGateError').textContent='That code was not found in this browser. Restore a backup if you have one.';return;}try{const u=dtRegisterUser(f.elements.person.value.trim(),f.elements.username.value.trim(),f.elements.pin.value,'adult',dog.id);dtEnterNamedUser(u,true)}catch(err){$('dtGateError').textContent=err.message}};
   $('dtRecoverBackup').onclick=()=>$('dtRecoverFile').click();$('dtRecoverFile').onchange=e=>dtRestoreBackup(e.target.files?.[0]);
   return;
 }

 if(setup){
  dtGateHtml(`<h2>Create your Daily Tail</h2><p class="dt-helper">Create your first dog profile, join one you were invited to, or restore a backup you already saved.</p><form id="dtFirstForm" novalidate><label>Your display name<input name="person" maxlength="40" required placeholder="Your name"></label><label>Your username<input name="username" autocomplete="username" maxlength="24" required placeholder="e.g. dogparent1" ></label><label>Choose a 4–6 digit PIN<input name="pin" type="password" inputmode="numeric" autocomplete="new-password" minlength="4" maxlength="6" pattern="[0-9]{4,6}" required placeholder="4 to 6 digits"></label><label>Dog's name<input name="dog" maxlength="40" required placeholder="Lou"></label><label class="dt-remember-row"><input type="checkbox" name="remember" checked> Remember me on this device</label><button class="primary" type="submit">Create my dog profile &amp; codes</button></form><div class="dt-entry-separator">Other ways to begin</div><div class="dt-action-panel"><h3>Join a dog profile</h3><p>You do not need a dog of your own. Use a family or friend invitation instead.</p><button type="button" id="dtJoinFirst" class="secondary">Join an existing dog's profile</button></div><div class="dt-action-panel"><h3>Restore a backup</h3><p>Bring back a Daily Tail backup file that was saved on this device or shared with you.</p><button type="button" id="dtRestoreFirst" class="secondary">Restore my previous account</button></div><input id="dtRestoreFirstFile" type="file" accept=".json,application/json" hidden><p class="dt-error" id="dtGateError">${safe(note)}</p>`);
  $('dtJoinFirst').onclick=dtInvitationGate;
  $('dtRestoreFirst').onclick=()=>$('dtRestoreFirstFile').click();
  $('dtRestoreFirstFile').onchange=e=>dtRestoreBackup(e.target.files?.[0]);
  $('dtFirstForm').onsubmit=e=>{
   e.preventDefault();
   const f=e.currentTarget,err=$('dtGateError');
   const person=f.elements.person.value.trim(),name=f.elements.dog.value.trim(),username=f.elements.username.value.trim(),pin=f.elements.pin.value;
   const invalid=(message,field)=>{
     err.textContent=message;err.classList.add('dt-form-error-visible');
     if(field){const el=f.elements[field];el.classList.add('dt-invalid-field');el.focus({preventScroll:true});}
     err.scrollIntoView({block:'nearest',behavior:'smooth'});
   };
   err.textContent='';err.classList.remove('dt-form-error-visible');
   Array.from(f.querySelectorAll('input')).forEach(el=>el.classList.remove('dt-invalid-field'));
   if(!person)return invalid('Please enter your name to continue.','person');
   if(!dtValidUser(username))return invalid('Choose a username of 3–24 characters using letters, numbers, dots, underscores, or hyphens.','username');
   if(dtFindUser(username))return invalid('That username is already on this device. Sign in or choose another username.','username');
   if(!/^\d{4,6}$/.test(pin))return invalid('Enter a 4–6 digit PIN containing only numbers.','pin');
   if(!name)return invalid('Please enter your dog’s name.','dog');
   const button=f.querySelector('button[type=submit]');button.disabled=true;button.textContent='Creating your profile…';
   const oldId=dtAccess.activeId;
   try{
     const d=dtMakeDog(name,person);dtAccess.dogs.push(d);dtAccess.activeId=d.id;
     dtRegisterUser(person,username,pin,'adult',d.id);
     appMeta.petName=name;saveMeta();dtCurrentUsername=dtUsername(username);
     dtEnter('adult',person,d.id);dtRememberUser(dtCurrentUsername,f.elements.remember.checked);dtShowNewCodes();
   }catch(error){
     dtAccess.dogs=dtAccess.dogs.filter(d=>!d||d.id!==dtAccess.activeId);dtAccess.activeId=oldId;
     button.disabled=false;button.textContent='Create my dog profile & codes';
     invalid('The profile could not be created: '+(error?.message||'Please try again.'),null);
   }
  };return;
 }
 const remembered=dtSafeStorage.getItem(DT_REMEMBER_KEY),u=remembered?dtFindUser(remembered):null;
 if(u){dtEnterNamedUser(u,true);return}
 dtGateHtml(`<h2>Welcome to Daily Tail</h2><p class="dt-helper">Sign into your saved profile, join a dog you were invited to, or start a new dog profile.</p><form id="dtQuickLoginForm"><label>Username<input id="dtQuickUsername" maxlength="24" autocomplete="username" required placeholder="Your username"></label><label>PIN<input id="dtQuickPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" required placeholder="4–6 digits"></label><label class="dt-remember-row"><input id="dtQuickRemember" type="checkbox" checked> Remember me on this device</label><button class="primary" type="submit">Open My Daily Tail</button></form><div class="dt-entry-separator">More ways to enter</div><div class="dt-action-panel"><h3>Join an existing dog</h3><p>Don't have a dog of your own? Follow a family member's dog using their invitation.</p><button id="dtInvitationOpen" type="button" class="secondary">Join an existing dog's profile</button></div><div class="dt-action-panel"><h3>Restore a backup</h3><p>Use a backup file to reconnect with a Daily Tail profile you already saved.</p><button id="dtRecoverExisting" type="button" class="secondary">Restore a previous backup</button></div><input id="dtRecoverExistingFile" type="file" accept=".json,application/json" hidden><div class="dt-other-options"><button id="dtNewDog" type="button">Create my own dog profile</button></div><p class="dt-error" id="dtGateError">${safe(note)}</p>`);
 $('dtRecoverExisting').onclick=()=>$('dtRecoverExistingFile').click();$('dtRecoverExistingFile').onchange=e=>dtRestoreBackup(e.target.files?.[0]);
 $('dtQuickLoginForm').onsubmit=e=>{e.preventDefault();try{dtUnlockUser($('dtQuickUsername').value,$('dtQuickPin').value,$('dtQuickRemember').checked)}catch(err){$('dtGateError').textContent=err.message}};
 $('dtInvitationOpen').onclick=dtInvitationGate;
 $('dtNewDog').onclick=dtCreateDogGate;
}

/* Portable friend-only invitation. It contains PUBLIC snapshots, never owner codes, private notes or logs. */
function dtDownloadFriendInvitation(){
 if(window.dtRole!=='adult')return;
 const d=dtDog();if(!d)return;
 dtSnapshotActive();
 const meta=d.meta||appMeta,profile=d.profile||state;
 const packet={format:'daily-tail-friend-invitation-v1',createdAt:new Date().toISOString(),
   dog:{id:d.id,name:d.name,friend:d.friend,profile:{profile:profile.profile||'',posts:publicPrefs.memories?(profile.posts||[]):[]},
     meta:{petName:d.name,dob:meta.dob||'',breed:meta.breed||'',personality:meta.personality||'',favorites:meta.favorites||'',cuteFact:meta.cuteFact||'',birthdate:meta.dob||meta.birthdate||''}}};
 const blob=new Blob([JSON.stringify(packet)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Daily_Tail_Friend_Invitation_'+d.name.replace(/[^a-z0-9_-]/gi,'_')+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 alert('Friend Invitation downloaded. Send this file and the Friend code to your guest. This is a read-only snapshot, not a live connection.');
}
async function dtImportFriendInvitation(file){
 if(!file)return;
 try{
  const packet=JSON.parse(await file.text());
  if(packet.format!=='daily-tail-friend-invitation-v1'||!packet.dog||!packet.dog.id||!packet.dog.friend||!packet.dog.name)throw Error('That is not a valid Friend Invitation file.');
  const d=packet.dog;
  if(!dtAccess.dogs.some(x=>x.id===d.id)){
   dtAccess.dogs.push({id:String(d.id),name:String(d.name).slice(0,40),friend:String(d.friend),
     owner:'',adult:'',child:'',profile:{profile:d.profile?.profile||'',posts:Array.isArray(d.profile?.posts)?d.profile.posts:[]},meta:{...d.meta,petName:d.name},importedFriend:true});
  }else{
   const found=dtAccess.dogs.find(x=>x.id===d.id);
   if(found.importedFriend){found.friend=String(d.friend);found.profile={profile:d.profile?.profile||'',posts:Array.isArray(d.profile?.posts)?d.profile.posts:[]};found.meta={...d.meta,petName:d.name};}
  }
  dtStore();
  // The imported packet only contains explicitly shared memories.
  dtSafeStorage.setItem('daily_tail_public_preferences_v1',JSON.stringify({memories:true,friends:false}));
  publicPrefs={memories:true,friends:false};
  $('dtGateError').style.color='#2b683c';
  $('dtGateError').textContent=`${d.name}'s Friend Invitation is ready. Enter the Friend code supplied by the owner and make your username and PIN.`;
 }catch(err){$('dtGateError').textContent='Could not import: '+err.message}
}

window.DailyTalesOpenInvitation=()=>dtInvitationGate();
function dtInvitationGate(){
 dtGateHtml(`<h2>Join an Existing Dog</h2><p>You do <strong>not</strong> need your own dog profile. Enter the invitation code from the dog owner, choose a username and PIN, then use Remember Me for easy return.</p><p class="dt-join-warning">On a different phone, the owner must also send you a small Friend Invitation file. Import it below before entering your code. Codes alone cannot connect two offline phones.</p><label class="dt-import-label">Joining from another phone?<input id="dtJoinFile" type="file" accept=".json,application/json"><small>Import the Friend Invitation file from the dog owner (not their private backup).</small></label><form id="dtInviteForm"><label>Your name<input name="person" maxlength="40" required placeholder="Your name"></label><label>Unique username<input name="username" maxlength="24" required placeholder="e.g. jacksdog" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,23}"></label><label>Choose a 4–6 digit PIN<input name="pin" type="password" inputmode="numeric" minlength="4" maxlength="6" pattern="[0-9]{4,6}" required placeholder="4–6 digits"></label><label>Invitation code<input name="code" required autocomplete="off" placeholder="XXXX-XXXX-XXXX"></label><label class="dt-remember-row"><input type="checkbox" name="remember" checked> Remember me on this device</label><button class="primary" type="submit">Join Daily Tail</button></form><div class="dt-other-options"><button id="dtBackInvite" type="button">Back to login</button></div><p class="dt-error" id="dtGateError"></p>`);
 $('dtBackInvite').onclick=()=>dtSignInGate();
 $('dtJoinFile').onchange=e=>dtImportFriendInvitation(e.target.files?.[0]);
 $('dtInviteForm').onsubmit=e=>{e.preventDefault();const f=e.target,person=f.elements.person.value.trim(),code=dtCleanCode(f.elements.code.value);let match;
  for(const d of dtAccess.dogs){for(const role of ['adult','child','friend']){if(dtCleanCode(d[role])===code){match={d,role};break}}if(match)break}
  if(!match){$('dtGateError').textContent='Invitation code not found. If this is a different phone, import the dog owner’s Friend Invitation file above first.';return}
  try{const u=dtRegisterUser(person,f.elements.username.value,f.elements.pin.value,match.role,match.d.id);dtEnterNamedUser(u,f.elements.remember.checked)}catch(err){$('dtGateError').textContent=err.message}
 };
}
function dtCreateDogGate(){
 dtGateHtml(`<h2>Create a Dog Profile</h2><p>New owners can create an account here. Already have a username? Sign in and use <strong>Add a Dog</strong> instead.</p><form id="dtNewDogForm" novalidate><label>Your name<input name="person" required maxlength="40" placeholder="Your name"></label><label>Username<input name="username" required maxlength="24" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,23}" placeholder="Unique username"></label><label>Choose a PIN<input name="pin" type="password" inputmode="numeric" required minlength="4" maxlength="6" pattern="[0-9]{4,6}" placeholder="4–6 digits"></label><label>Dog's name<input name="dog" required maxlength="40" placeholder="Dog's name"></label><label class="dt-remember-row"><input type="checkbox" name="remember" checked> Remember me</label><button class="primary" type="submit">Create dog profile &amp; codes</button></form><button type="button" id="dtBackGate">Back</button><p class="dt-error" id="dtGateError"></p>`);
 $('dtBackGate').onclick=()=>dtSignInGate();
 $('dtNewDogForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,person=f.elements.person.value.trim(),name=f.elements.dog.value.trim(),username=f.elements.username.value.trim(),pin=f.elements.pin.value;
  const fail=(message,field)=>{const box=$('dtGateError');box.textContent=message;box.classList.add('dt-form-error-visible');if(field){f.elements[field].classList.add('dt-invalid-field');f.elements[field].focus({preventScroll:true})}box.scrollIntoView({block:'nearest',behavior:'smooth'})};
  Array.from(f.querySelectorAll('input')).forEach(el=>el.classList.remove('dt-invalid-field'));
  if(!person)return fail('Please enter your name.','person');
  if(!dtValidUser(username))return fail('Use a username with 3–24 letters, numbers, dots, underscores, or hyphens.','username');
  if(!/^\d{4,6}$/.test(pin))return fail('Enter a 4–6 digit numeric PIN.','pin');
  if(!name)return fail('Please enter your dog’s name.','dog');
  const btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Creating your profile…';
  const oldId=dtAccess.activeId;const d=dtMakeDog(name,person);dtAccess.dogs.push(d);dtAccess.activeId=d.id;
  try{const u=dtRegisterUser(person,username,pin,'adult',d.id);dtCurrentUsername=u.username;dtEnter('adult',person,d.id);dtRememberUser(u.username,f.elements.remember.checked);dtShowNewCodes()}
  catch(err){dtAccess.dogs=dtAccess.dogs.filter(x=>x.id!==d.id);dtAccess.activeId=oldId;btn.disabled=false;btn.textContent='Create dog profile & codes';fail(err?.message||'Could not create profile. Please try again.');}
 };
}
function dtMakeDog(name,owner){return {id:dtId(),name,owner,adult:dtUniqueCode(),child:dtUniqueCode(),friend:dtUniqueCode(),profile:{profile:'',posts:[]},meta:{petName:name}};}
function dtDogPicker(note=''){
 const u=dtFindUser(dtCurrentUsername);
 if(!u){dtCurrentUsername='';dtSignInGate('Please sign in again.');return}
 // Save any owner changes before opening the dog list.
 if(window.dtRole==='adult'&&dtDog())dtSnapshotActive();
 window.dtRole='locked';document.body.classList.remove('dt-role-adult','dt-role-child','dt-role-friend');document.body.classList.add('dt-locked');
 $('dtGate').hidden=false;$('dtRoleStrip').hidden=true;
 const cards=dtLinks(u).map(link=>{
   const d=dtAccess.dogs.find(d=>d.id===link.dogId);if(!d)return '';
   const image=d.profile?.profile;
   return `<button class="dt-dog-tile" type="button" data-dog-open="${safe(d.id)}">${image?`<img src="${image}" alt="${safe(d.name)}">`:'<span class="dt-dog-paw">🐾</span>'}<strong>${safe(d.name)}</strong><small>${link.role==='adult'?'Adult Owner':link.role==='child'?'Child Owner':'Friend'}</small></button>`;
 }).join('');
 dtGateHtml(`<div class="dt-picker-brand"><div class="dt-picker-logo-wrap"><img src="./daily-tails-logo.webp" alt="Daily Tails"><span class="dt-picker-bone-name">My Dogs</span></div></div><div class="dt-picker-welcome"><p>Welcome back, <strong>${safe(u.name)}</strong>! Select a dog to continue.</p></div><div class="dt-dogs-grid">${cards||'<p class="dt-picker-empty">No dogs linked yet. Add a dog to get started.</p>'}</div><div class="dt-picker-actions"><button id="dtAddAnotherDog" type="button" class="primary">+ Add a Dog</button><button id="dtJoinAnotherDog" type="button" class="secondary">+ Join an Existing Dog</button></div><p class="dt-error" id="dtGateError">${safe(note)}</p><button type="button" id="dtPickerSignOut" class="dt-picker-signout">Switch User / Sign Out</button>`);
 document.querySelectorAll('[data-dog-open]').forEach(b=>b.onclick=()=>dtOpenLinkedDog(b.dataset.dogOpen));
 $('dtAddAnotherDog').onclick=dtCreateLinkedDog;
 $('dtJoinAnotherDog').onclick=dtJoinLinkedDog;
 $('dtPickerSignOut').onclick=dtSignOut;
 window.scrollTo(0,0);
}
function dtOpenLinkedDog(id){
 const u=dtFindUser(dtCurrentUsername),link=dtLinks(u).find(link=>link.dogId===id);
 if(!link){dtDogPicker('This dog is not connected to your username.');return}
 if(u.cloudManaged && window.dtRole==='locked' && sessionStorage.getItem('dtCloudPendingDog')!==id){
   if(window.dtRole==='adult')dtSnapshotActive();
   const chosen=dtAccess.dogs.find(d=>d.id===id);
   if(!chosen)return;
   dtAccess.activeId=id;
   for(const k of DT_PER_DOG_KEYS){
      if(chosen.extras&&Object.prototype.hasOwnProperty.call(chosen.extras,k))dtSafeStorage.setItem(k,chosen.extras[k]);
      else dtSafeStorage.removeItem(k);
   }
   dtStore();
   sessionStorage.setItem('dtCloudPendingDog',id);
   location.reload();return;
 }
 sessionStorage.removeItem('dtCloudPendingDog');
 dtEnter(link.role,u.name,id);
}
function dtCreateLinkedDog(){
 const u=dtFindUser(dtCurrentUsername);if(!u){dtSignInGate();return}
 dtGateHtml(`<h2>Add a Dog</h2><p>Creating another dog keeps your same username and PIN. Each dog will receive separate family invitation codes.</p><form id="dtLinkedDogForm"><label>Dog's name<input name="dog" required maxlength="40" placeholder="Your new dog's name"></label><button type="submit" class="primary">Create Dog and Codes</button></form><button type="button" id="dtPickerBack">Back to My Dogs</button><p class="dt-error" id="dtGateError"></p>`);
 $('dtPickerBack').onclick=()=>dtDogPicker();
 $('dtLinkedDogForm').onsubmit=e=>{e.preventDefault();const name=e.target.elements.dog.value.trim();if(!name)return;
  const d=dtMakeDog(name,u.name);dtAccess.dogs.push(d);dtLinkDog(u,d.id,'adult');dtEnter('adult',u.name,d.id);if(!u.cloudManaged)dtShowNewCodes();
 };
}
function dtJoinLinkedDog(){
 const u=dtFindUser(dtCurrentUsername);if(!u){dtSignInGate();return}
 dtGateHtml(`<h2>Join Another Dog</h2><p>Enter the invitation code for a dog you want to connect. You will keep your current username and PIN.</p><p class="dt-join-warning">If the dog is on another phone, first import the Friend Invitation file from its owner. Codes alone cannot synchronize offline devices.</p><label class="dt-import-label">Friend Invitation file (another device)<input id="dtLinkedInviteFile" type="file" accept=".json,application/json"></label><form id="dtLinkedJoinForm"><label>Invitation code<input name="code" required placeholder="XXXX-XXXX-XXXX" autocomplete="off"></label><button class="primary" type="submit">Link Dog to My Username</button></form><button id="dtPickerBack" type="button">Back to My Dogs</button><p class="dt-error" id="dtGateError"></p>`);
 $('dtLinkedInviteFile').onchange=e=>dtImportFriendInvitation(e.target.files?.[0]);
 $('dtPickerBack').onclick=()=>dtDogPicker();
 $('dtLinkedJoinForm').onsubmit=e=>{e.preventDefault();const code=dtCleanCode(e.target.elements.code.value);let match;
  for(const d of dtAccess.dogs){for(const role of ['adult','child','friend']){if(d[role]&&dtCleanCode(d[role])===code){match={d,role};break}}if(match)break}
  if(!match){$('dtGateError').textContent='Code not found. If this dog is on another phone, import its Friend Invitation first.';return}
  dtLinkDog(u,match.d.id,match.role);dtDogPicker(`${match.d.name} has been linked to your username.`);
 };
}
function dtUniqueCode(){let code;do{code=dtCode()}while(dtAccess.dogs.some(d=>['adult','child','friend'].some(r=>dtCleanCode(d[r])===dtCleanCode(code))));return code}
function dtShowNewCodes(){const d=dtDog();if(!d)return;
 show('Your access codes',`<div class="dt-manage-card"><p><strong>Daily Tail created these codes for ${safe(d.name)}.</strong> Save the Adult Owner code somewhere safe. Only give the Child and Friend codes to people who should use those views.</p><label>Adult Owner: full access<input id="dtNewAdultCode" readonly value="${safe(d.adult)}"></label><label>Child Owner: edits require approval<input readonly value="${safe(d.child)}"></label><label>Friend: read-only<input readonly value="${safe(d.friend)}"></label><button type="button" id="dtCopyAllCodes">Copy all three codes</button><button type="button" id="dtCodeManageNow">Codes & approvals</button><p class="muted">These codes work only on this browser's locally saved app data. They do not automatically connect separate phones.</p></div>`,'dt-new-codes');
 $('dtCopyAllCodes').onclick=()=>{const value=`Daily Tail: ${d.name}\nAdult Owner: ${d.adult}\nChild Owner: ${d.child}\nFriend: ${d.friend}`;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>alert('Codes copied')).catch(()=>{const input=$('dtNewAdultCode');input.focus();input.select()});else{const input=$('dtNewAdultCode');input.focus();input.select()}};
 $('dtCodeManageNow').onclick=()=>dtManageCodes();
}

const DT_PER_DOG_KEYS=['loubear_training_v1','loubear_schedule_v1','daily_tail_journal_v1','loubear_emergency_info_v1','loubear_birthday_v2','dailytail_appearance_v1','daily_tail_public_preferences_v1'];
function dtExtrasForActive(){
 const extras={};
 for(const k of DT_PER_DOG_KEYS){const v=dtSafeStorage.getItem(k);if(v!==null)extras[k]=v}
 return extras;
}
function dtSnapshotActive(){
 const d=dtDog();if(!d)return;
 d.profile=JSON.parse(JSON.stringify(state));d.meta=JSON.parse(JSON.stringify(appMeta));
 d.extras=dtExtrasForActive();dtStore()
}
window.DailyTalesShowOriginalLogin=()=>{
 // A one-time manual PIN check for importing old browser data. No dog records deleted.
 dtSafeStorage.removeItem(DT_REMEMBER_KEY);
 dtCurrentUsername='';
 window.dtRole='locked';
 document.body.classList.remove('dt-role-adult','dt-role-child','dt-role-friend');
 document.body.classList.add('dt-locked');
 const gate=$('dtGate');if(gate)gate.hidden=false;
 const strip=$('dtRoleStrip');if(strip)strip.hidden=true;
 dtSignInGate();
 window.scrollTo(0,0);
};
window.DailyTalesLocalDogs={
  verifyOriginalOwner(username,pin){
    const candidate=dtFindUser(username);
    if(!candidate||candidate.cloudManaged||!dtLinks(candidate).some(link=>link.role==='adult'))throw Error('Original Adult Owner account not found.');
    dtUnlockUser(username,pin,true);
    if(!this.migrationAuthorized())throw Error('This account does not have Adult Owner access.');
    return true;
  },
  migrationAuthorized(){
    const person=dtFindUser(dtCurrentUsername);
    return !!person && dtLinks(person).some(link=>link.role==='adult');
  },
  listOwned(){
    const person=dtFindUser(dtCurrentUsername);
    if(!person)return [];
    const ownerIds=new Set(dtLinks(person).filter(link=>link.role==='adult').map(link=>link.dogId));
    return this.list().filter(d=>ownerIds.has(d.id));
  },
  openCloudAccount(uid,cloudDogs,email){
    if(!uid||!Array.isArray(cloudDogs))return false;
    const linkKey='daily_tales_v2_linked_uid';
    if(dtAccess.dogs.length&&dtSafeStorage.getItem(linkKey)!==uid)return false;
    const cloudUsername=('cloud_'+uid).toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,24);
    let account=dtFindUser(cloudUsername);
    let changed=false;
    for(const item of cloudDogs){
      if(!item?.id||!item?.name)continue;
      let dog=dtAccess.dogs.find(d=>d.id===item.id);
      if(!dog){
        dog={id:item.id,name:item.name,owner:email||'Owner',ownerUid:item.ownerUid||uid,
          profile:item.profile||{profile:'',posts:[]},meta:item.meta||{petName:item.name},
          extras:item.extras||{},adult:'',child:'',friend:''};
        dtAccess.dogs.push(dog);changed=true;
      }
    }
    if(!account){
      account={username:cloudUsername,name:email?.split('@')[0]||'Owner',
        dogs:cloudDogs.map(d=>({dogId:d.id,role:d.role||'adult'})),
        role:'adult',dogId:cloudDogs[0]?.id||null,cloudManaged:true};
      dtAccess.users=dtAccess.users||[];dtAccess.users.push(account);changed=true;
    }else{
      for(const dog of cloudDogs)if(!dtLinks(account).some(l=>l.dogId===dog.id)){
        account.dogs.push({dogId:dog.id,role:dog.role||'adult'});changed=true;
      }
    }
    if(changed)dtStore();
    dtSafeStorage.setItem(linkKey,uid);
    if(window.dtRole==='locked'||dtCurrentUsername!==account.username){
      if(window.dtRole==='adult')dtSnapshotActive();
      dtCurrentUsername=account.username;
      dtRememberUser(account.username,true);
      dtDogPicker();
      const pending=sessionStorage.getItem('dtCloudPendingDog');
      if(pending&&dtLinks(account).some(link=>link.dogId===pending)){
        sessionStorage.removeItem('dtCloudPendingDog');
        const role=dtLinks(account).find(link=>link.dogId===pending)?.role||'friend';
        dtEnter(role,account.name,pending);
      }
    }
    return true;
  },
  openLinkedAccount(uid){
    if(!uid||dtSafeStorage.getItem('daily_tales_v2_linked_uid')!==uid)return false;
    if(window.dtRole!=='locked')return true;
    const remembered=dtSafeStorage.getItem(DT_REMEMBER_KEY);
    const user=(remembered&&dtFindUser(remembered))||(dtAccess.users||[]).find(u=>dtLinks(u).some(x=>x.role==='adult'));
    if(!user)return false;
    dtEnterNamedUser(user,true);
    return true;
  },
  list(){
    if(window.dtRole==='adult')dtSnapshotActive();
    return JSON.parse(JSON.stringify(dtAccess.dogs.map(d=>({id:d.id,name:d.name,owner:d.owner,profile:d.profile||{profile:'',posts:[]},meta:d.meta||{},extras:d.id===dtAccess.activeId?{...(d.extras||{}),...dtExtrasForActive()}:(d.extras||{})}))));
  },
  hasLocalDogs(){return dtAccess.dogs.length>0},
  applyCloudDogs(items){
    if(!Array.isArray(items))throw Error('Expected cloud dog records.');
    if(window.dtRole==='adult')dtSnapshotActive();
    let changed=false;
    for(const remote of items){
      if(!remote||!remote.id||!remote.name)continue;
      const local=dtAccess.dogs.find(d=>d.id===remote.id);
      if(local){
        if(JSON.stringify({name:local.name,profile:local.profile,meta:local.meta,extras:local.extras})===JSON.stringify({name:remote.name,profile:remote.profile,meta:remote.meta,extras:remote.extras}))continue;
        local.name=remote.name;local.ownerUid=remote.ownerUid||local.ownerUid;local.profile=JSON.parse(JSON.stringify(remote.profile||{}));local.meta=JSON.parse(JSON.stringify(remote.meta||{}));local.extras=JSON.parse(JSON.stringify(remote.extras||{}));changed=true;
      }else{
        // Cloud dogs have no legacy access code or local PIN credentials.
        // Never manufacture an owner authorization from cloud data.
        dtAccess.dogs.push({id:remote.id,name:remote.name,owner:remote.ownerDisplay||'',ownerUid:remote.ownerUid||'',profile:remote.profile||{},meta:remote.meta||{},extras:remote.extras||{},adult:'',child:'',friend:''});
        changed=true;
      }
    }
    if(changed){
      const active=dtAccess.dogs.find(d=>d.id===dtAccess.activeId);
      if(active?.extras){
        for(const key of DT_PER_DOG_KEYS){
          if(Object.prototype.hasOwnProperty.call(active.extras,key))dtSafeStorage.setItem(key,active.extras[key]);
          else dtSafeStorage.removeItem(key);
        }
      }
      dtStore();
      window.dispatchEvent(new CustomEvent('daily-tales-cloud-dogs-changed'));
    }
    return changed;
  }
};
function dtLoadDog(id){
 const d=dtAccess.dogs.find(x=>x.id===id);if(!d)return;
 if(dtAccess.activeId && dtAccess.activeId!==id && window.dtRole==='adult')dtSnapshotActive();
 dtAccess.activeId=id;dtStore();
 // Each dog owns its own photo/posts/meta. Never inherit the previous dog's data.
 if(!d.profile)d.profile={profile:'',posts:[]};
 if(!d.meta)d.meta={petName:d.name};
 state=JSON.parse(JSON.stringify(d.profile));
 appMeta={petName:d.name,...JSON.parse(JSON.stringify(d.meta))};
 appMeta.petName=d.name;
 window.LouProfile={dob:appMeta.dob||'',breed:appMeta.breed||''};
 dtStore();renderTagName();refresh();
}
const dtOriginalSave=save,dtOriginalSaveMeta=saveMeta;
save=function(){if(window.dtRole==='child'){
 const dog=dtDog();const baseline=dog?.profile||{posts:[],profile:''};
 if(state.profile!==baseline.profile){dtQueue({kind:'photo',image:state.profile,by:dtPerson});state.profile=baseline.profile;alert('Photo change submitted for adult approval.');}
 if(JSON.stringify(state.posts)!==JSON.stringify(baseline.posts)){dtQueue({kind:'posts',posts:JSON.parse(JSON.stringify(state.posts)),by:dtPerson});state.posts=JSON.parse(JSON.stringify(baseline.posts));alert('Post change submitted for adult approval.');}
 }
 dtOriginalSave();if(window.dtRole==='adult')dtSnapshotActive();
};
saveMeta=function(){dtOriginalSaveMeta();if(window.dtRole==='adult')dtSnapshotActive()};
function dtEnter(role,person,dogId){dtLoadDog(dogId);window.dtRole=role;window.dtPerson=person;document.body.classList.remove('dt-locked','dt-role-adult','dt-role-child','dt-role-friend');document.body.classList.add('dt-role-'+role);$('dtGate').hidden=true;$('dtRoleStrip').hidden=false;friendPreview=role==='friend';$('dtRoleLabel').textContent=person+' · '+safe(dtDog()?.name||'Dog')+' · '+({adult:'Adult Owner',child:'Child Owner',friend:'Friend View'}[role]);$('dtRoleManage').hidden=role==='friend';$('dtRoleManage').textContent=role==='adult'?(dtFindUser(dtCurrentUsername)?.cloudManaged?'Share & approvals':'Codes & approvals'):'My pending changes';$('ownerModeBtn').disabled=role==='friend';$('ownerModeBtn').hidden=role==='friend';$('friendModeBtn').hidden=role==='friend';syncFriendView();renderTagName();dtRefreshFriends();window.scrollTo(0,0)}
function dtSignOut(){if(window.DailyTalesCloudSignOut)window.DailyTalesCloudSignOut();dtSafeStorage.removeItem(DT_REMEMBER_KEY);if(window.dtRole==='adult')dtSnapshotActive();dtCurrentUsername='';window.dtRole='locked';window.dtPerson='';document.body.classList.add('dt-locked');$('dtRoleStrip').hidden=true;$('dtGate').hidden=false;dtSignInGate();window.scrollTo(0,0)}
$('dtRoleSignOut').onclick=dtSignOut;
$('dtSwitchDogs').onclick=()=>dtDogPicker();
$('dtBackupBtn').onclick=dtDownloadBackup;
$('dtRestoreGateBtn').onclick=()=>$('dtRestoreFile').click();
$('dtRestoreFile').onchange=e=>dtRestoreBackup(e.target.files?.[0]);
$('dtRoleManage').onclick=()=>{const u=dtFindUser(dtCurrentUsername);if(u?.cloudManaged&&window.DailyTalesOpenShare){window.DailyTalesOpenShare();return}window.dtRole==='adult'?dtManageCodes():dtManagePending()};
$('dtAskFriend').onclick=()=>{if(window.dtRole==='friend')dtRequestForm();else alert('This is how the Friend Request button appears to guests. Sign in with a Friend invitation to send a request.');};
 $('dtFindDogFriends').onclick=dtOpenFriendSearch;
// The preview switch is for people who have already authenticated as an owner.
$('ownerModeBtn').addEventListener('click',e=>{if(window.dtRole==='friend'){e.stopImmediatePropagation();e.preventDefault()}},true);
$('friendModeBtn').addEventListener('click',e=>{if(window.dtRole==='friend'){e.stopImmediatePropagation();e.preventDefault()}},true);
$('themeSettingsBtn').addEventListener('click',e=>{if(window.dtRole!=='adult'){e.stopImmediatePropagation();e.preventDefault();alert('Only Adult Owner can edit colors and backgrounds.')}},true);
function dtManageCodes(message=''){
 const d=dtDog();if(!d)return;
 const pending=dtPending.filter(x=>x.dogId===d.id);
 show('Owner access & approvals',`<div class="dt-manage-card"><h3>Three access codes</h3><p>Manage invitations and approvals for this dog.</p><button id="dtBackupManage" type="button">Back up all Daily Tail data</button><button id="dtExportFriendInvite" type="button">Download Friend Invitation for another phone</button><p>For another phone, send the invitation file and Friend code separately. These codes don't create secure online accounts.</p><label>Adult Owner · full access<input readonly value="${safe(d.adult)}"></label><label>Child Owner · requires approval for photos and posts<input readonly value="${safe(d.child)}"></label><label>Friend · read-only profile<input readonly value="${safe(d.friend)}"></label><button id="dtRotateChild">Generate new Child code</button><button id="dtRotateFriend">Generate new Friend code</button><p>${safe(message)}</p></div><div class="dt-manage-card"><h3>Approval inbox (${pending.length})</h3><div id="dtPendingList"></div><button id="dtImportRequest">Import friend request file</button><input id="dtImportRequestFile" type="file" accept=".json,application/json" hidden><p>Import a request received from another phone.</p></div>`,'dt-manage');
 $('dtBackupManage').onclick=dtDownloadBackup;
 $('dtExportFriendInvite').onclick=dtDownloadFriendInvitation;
 $('dtRotateChild').onclick=()=>{if(!confirm('Replace the Child Owner code? The old one will stop working on this device.'))return;d.child=dtUniqueCode();dtStore();dtManageCodes('New Child Owner code generated.')};
 $('dtRotateFriend').onclick=()=>{if(!confirm('Replace the Friend code? The old one will stop working on this device.'))return;d.friend=dtUniqueCode();dtStore();dtManageCodes('New Friend code generated.')};
 $('dtImportRequest').onclick=()=>$('dtImportRequestFile').click();
 $('dtImportRequestFile').onchange=async e=>{try{const f=e.target.files[0],json=JSON.parse(await f.text());if(json.format!=='daily-tail-friend-request-v1'||!json.dogName||!json.person||!json.id)throw Error('Not a Daily Tail friend request');if(dtPending.some(p=>p.id===json.id)){dtManageCodes('That request was already imported.');return}dtPending.push({id:json.id,dogId:d.id,kind:'friend',name:String(json.dogName).slice(0,50),breed:String(json.breed||'').slice(0,80),person:String(json.person).slice(0,50),image:/^data:image\/(png|jpeg|webp);base64,/.test(json.photo||'')?json.photo:'',by:String(json.person).slice(0,50),at:new Date().toISOString()});dtSaveQueue();dtManageCodes('Friend request imported.')}catch(ex){alert('Unable to import request: '+ex.message)}};
 const list=$('dtPendingList');list.innerHTML=pending.map(item=>`<div class="dt-request"><strong>${safe(item.kind==='friend'?`Friend request: ${item.name}`:item.kind==='photo'?'New profile photo':item.kind==='post'?`Post: ${item.post?.title||'Memory'}`:'Post edits')}</strong><small>From ${safe(item.by||item.person||'Family')} · ${safe(new Date(item.at).toLocaleDateString())}</small>${item.kind==='friend'&&item.image?`<img src="${item.image}" alt="Dog thumbnail">`:''}<div><button data-approve="${safe(item.id)}">Approve</button><button data-reject="${safe(item.id)}">Decline</button></div></div>`).join('')||'<p>No changes awaiting approval.</p>';
 list.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>dtResolve(b.dataset.approve,true));list.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>dtResolve(b.dataset.reject,false));
}
function dtResolve(id,approve){if(window.dtRole!=='adult')return;const item=dtPending.find(x=>x.id===id&&x.dogId===dtAccess.activeId);if(!item)return;
 if(approve){if(item.kind==='friend'){const key='dailytail_connected_dog_friends_v1';let list=getConnectedDogFriends();if(!list.some(x=>x.requestId===item.id))list.push({requestId:item.id,dogId:item.dogId,linkedDogId:item.sourceDogId||'',connected:true,name:item.name,breed:item.breed,photo:item.image});
 if(item.sourceDogId){const target=dtAccess.dogs.find(d=>d.id===item.dogId);if(target&&!list.some(x=>x.requestId===item.id+':back'))list.push({requestId:item.id+':back',dogId:item.sourceDogId,linkedDogId:item.dogId,connected:true,name:target.name,breed:String(target.meta?.breed||''),photo:String(target.profile?.profile||'')});}
 try{dtSafeStorage.setItem(key,JSON.stringify(list))}catch{alert('Storage full. The friend could not be saved.');return}publicPrefs.friends=true;$('shareFriends').checked=true;dtSafeStorage.setItem(PUBLIC_PREF_KEY,JSON.stringify(publicPrefs));}
 else if(item.kind==='photo')state.profile=item.image;
 else if(item.kind==='post')state.posts.unshift(item.post);
 else if(item.kind==='posts')state.posts=item.posts;
 save();refresh();renderDogFriends();}
 dtPending=dtPending.filter(x=>x.id!==id);dtSaveQueue();dtManageCodes(approve?'Approved.':'Declined.');}
function dtManagePending(){const items=dtPending.filter(x=>x.dogId===dtAccess.activeId&&x.by===window.dtPerson);show('My requests',`<p>Changes to posts and pictures are sent to the adult for approval.</p><div class="dt-manage-card"><h3>Pending (${items.length})</h3>${items.map(x=>`<p>${safe(x.kind==='post'?x.post.title:x.kind==='photo'?'Profile photo':'Post changes')} · Waiting for approval</p>`).join('')||'<p>No pending changes.</p>'}</div>`,'dt-child')}
function dtRequestForm(){if(window.dtRole!=='friend')return;
 show('Send a dog friend request',`<p>Introduce yourself and your dog. A request on this browser goes to the adult owner. For another phone, download a request file and send it to the owner.</p><form id="dtReqForm"><label class="field">Your name<input id="dtReqPerson" value="${safe(dtPerson)}" required maxlength="40"></label><label class="field">Dog's name<input id="dtReqDog" required maxlength="50" placeholder="Your dog's name"></label><label class="field">Breed (optional)<input id="dtReqBreed" maxlength="80" placeholder="Breed or mix"></label><label class="field">Dog's profile photo (optional)<input id="dtReqPhoto" type="file" accept="image/*"></label><button class="primary" type="submit">Send request / Download request file</button></form>`,'dt-ask');let photo='';$('dtReqPhoto').onchange=e=>readPhoto(e.target.files[0],data=>{photo=data});$('dtReqForm').onsubmit=e=>{e.preventDefault();const request={format:'daily-tail-friend-request-v1',id:dtId(),person:$('dtReqPerson').value.trim(),dogName:$('dtReqDog').value.trim(),breed:$('dtReqBreed').value.trim(),photo,date:new Date().toISOString()};dtPending.push({id:request.id,dogId:dtAccess.activeId,kind:'friend',name:request.dogName,person:request.person,by:request.person,breed:request.breed,image:photo,at:request.date});dtSaveQueue();const blob=new Blob([JSON.stringify(request)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Daily_Tail_Friend_Request.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);show('Friend request prepared',`<p>Your request has been added to the adult approval inbox on this device.</p><p>If you are using another phone, send the downloaded <strong>Daily_Tail_Friend_Request.json</strong> file to the dog owner. They can import and approve it from Codes & approvals.</p>`,'dt-sent')};}

/* Search is limited to dog profiles saved in the same browser; across phones use request files. */
function dtOpenFriendSearch(){
 if(window.dtRole!=='adult')return;
 show('Find Dog Friends',`<div class="dt-friend-search-modal">
   <p class="dt-search-hint"><strong>Search dogs on this device.</strong> For dogs on another phone, prepare a request file and send it to their adult owner. Daily Tail is not yet connected to an online directory.</p>
   <label class="field">Search by dog's name<input type="search" id="dtDogSearchInput" placeholder="Search saved dog profiles" autocomplete="off"></label>
   <div class="dt-find-results" id="dtDogSearchResults" aria-live="polite"></div>
   <button type="button" id="dtRemoteFriendRequest" class="primary" style="display:block;width:100%;background:#355a73;color:white">Request a friend on another phone</button>
 </div>`,'dt-search');
 $('dtDogSearchInput').addEventListener('input',dtRenderFriendSearch);
 $('dtRemoteFriendRequest').onclick=dtRemoteFriendRequest;
 dtRenderFriendSearch();
}
function dtRenderFriendSearch(){
 const el=$('dtDogSearchResults');if(!el)return;
 const term=String($('dtDogSearchInput')?.value||'').trim().toLowerCase();
 const current=dtDog();
 const matches=dtAccess.dogs.filter(d=>d.id!==current?.id && !d.importedFriend && d.name.toLowerCase().includes(term));
 if(!matches.length){el.innerHTML='<p>No matching dogs saved here yet. Try a different name, or use the request-file option below.</p>';return}
 el.innerHTML=matches.slice(0,25).map(d=>{
  const ph=String(d.profile?.profile||'');const image=/^data:image\/(png|jpeg|webp);base64,/.test(ph)?`<img src="${ph}" alt="">`:'<span class="dt-find-avatar" aria-hidden="true">🐶</span>';
  const pending=dtPending.some(x=>x.kind==='friend'&&x.dogId===d.id&&x.sourceDogId===current?.id);
  const isFriend=getConnectedDogFriends().some(f=>f.linkedDogId===d.id);
  return `<div class="dt-find-result">${image}<div class="dt-find-info"><strong>${safe(d.name)}</strong><small>${isFriend?'Already connected':pending?'Request awaiting approval':'Dog profile saved here'}</small></div><button type="button" data-friend-dog="${safe(d.id)}" ${pending||isFriend?'disabled':''}>${isFriend?'Friends':pending?'Pending':'Request'}</button></div>`;
 }).join('');
 el.querySelectorAll('[data-friend-dog]').forEach(btn=>btn.onclick=()=>dtRequestLocalDog(btn.dataset.friendDog));
}
function dtRequestLocalDog(targetId){
 if(window.dtRole!=='adult')return;
 const from=dtDog(),to=dtAccess.dogs.find(d=>d.id===targetId);
 if(!from||!to||from.id===to.id)return;
 if(dtPending.some(x=>x.kind==='friend'&&x.dogId===to.id&&x.sourceDogId===from.id)){alert('A request is already waiting for approval.');return}
 const request={id:dtId(),dogId:to.id,sourceDogId:from.id,kind:'friend',name:from.name,breed:String(from.meta?.breed||''),image:String(from.profile?.profile||''),person:dtPerson,by:dtPerson,at:new Date().toISOString()};
 dtPending.push(request);dtSaveQueue();
 dtOpenFriendSearch();
 alert(`Friend request sent to ${to.name}'s Adult Owner inbox on this device. They must approve it before the dogs appear as friends.`);
}
function dtRemoteFriendRequest(){
 if(window.dtRole!=='adult')return;
 const current=dtDog();if(!current)return;
 show('Friend Request for Another Phone',`<p>Enter the other dog's name to identify who you want to connect with. Download the request file and send it to their Adult Owner. They must import it under Codes & approvals and accept.</p>
 <form id="dtRemoteReqForm"><label class="field">Other dog's name<input id="dtRemoteTarget" maxlength="60" required placeholder="Who are you requesting?"></label><p>Your dog: <strong>${safe(current.name)}</strong></p><button type="submit" class="primary">Download Friend Request</button></form>`,'dt-remote');
 $('dtRemoteReqForm').onsubmit=e=>{e.preventDefault();const other=$('dtRemoteTarget').value.trim();if(!other)return;
 const packet={format:'daily-tail-friend-request-v1',id:dtId(),person:dtPerson,dogName:current.name,breed:String(current.meta?.breed||''),photo:String(current.profile?.profile||''),targetDog:other,date:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(packet)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Daily_Tail_Friend_Request_'+current.name.replace(/[^a-z0-9_-]/gi,'_')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 show('Friend Request Downloaded',`<p>Send the downloaded request file to <strong>${safe(other)}'s owner</strong>. Their Adult Owner can import it in <strong>Codes & approvals</strong>, then approve it.</p><p>This offline app cannot automatically notify another phone.</p>`,'dt-sent')};
}
function dtRefreshFriends(){const viewingFriends=friendPreview===true; $('dtFriendAction').hidden=!viewingFriends; $('dtOwnerFriendSearch').hidden=window.dtRole!=='adult'||viewingFriends; renderDogFriends()}
// Child can still edit private family schedule, but not themes, public sharing or content without approval.
// Keep global original default UI visible only after the gate is completed.
if(new URLSearchParams(location.search).get('view')==='friend')friendPreview=true;
$('dtRoleStrip').hidden=true;$('dtGate').hidden=false;document.body.classList.add('dt-locked');
try{dtSignInGate()}catch(err){
 console.error('Daily Tail entry issue',err);
 const el=document.getElementById('dtGateContent');if(el)el.innerHTML='<h2>Daily Tail Needs Recovery</h2><p>There was a problem reading the saved profiles. Your data has not been deleted. Try reopening in Chrome, or restore your most recent backup.</p><p class="dt-error"></p><button type="button" id="dtSafeRetry">Try Again</button>';
 const label=el?.querySelector('.dt-error');if(label)label.textContent=String(err.message||err);
 const retry=document.getElementById('dtSafeRetry');if(retry)retry.onclick=()=>location.reload();
}

