/* Daily Tail cloud-first release candidate.
 * Private account data lives under users/{Firebase UID} and is never shared automatically.
 * Existing browser-based Daily Tail data is neither read nor overwritten.
 */
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,addDoc,updateDoc,deleteDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const config={
 apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',
 authDomain:'daily-tail.firebaseapp.com',
 projectId:'daily-tail',
 storageBucket:'daily-tail.firebasestorage.app',
 messagingSenderId:'789609946634',
 appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'
};
const app=getApps().find(x=>x.name==='daily-tail-cloud-release')||initializeApp(config,'daily-tail-cloud-release');
const auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
let person=null,dogs=[],selectedId=null,activeTab='profile',activities=[],posts=[],showArchived=false;
let stopDogs=null,stopActivities=null,stopPosts=null,listenerVersion=0,busy=false;
let draftDirty=false,lastLoadedRevision=null,snapshotVersion=-1,noticeTimeout=null;
const day=()=>{const d=new Date(),year=d.getFullYear(),month=String(d.getMonth()+1).padStart(2,'0'),date=String(d.getDate()).padStart(2,'0');return year+'-'+month+'-'+date};
const ownerPath=()=>['users',person.uid];
const dogCollection=()=>collection(db,...ownerPath(),'dogs');
const dogRef=id=>doc(db,...ownerPath(),'dogs',id);
const taskCollection=id=>collection(db,...ownerPath(),'dogs',id,'activities');
const postCollection=id=>collection(db,...ownerPath(),'dogs',id,'posts');
const activeDog=()=>dogs.find(d=>d.id===selectedId)||null;
function notice(text,bad=false){
 const el=$('notice');el.textContent=text;el.className='notice '+(bad?'error':'success');
}
function show(id){['authScreen','workspace','loading'].forEach(k=>$(k).hidden=k!==id)}
function page(name){
 ['dogsPage','dogPage','newDogPage'].forEach(k=>$(k).hidden=k!==name);
 $('allDogsBtn').setAttribute('aria-pressed',String(name==='dogsPage'));
}
function setTab(tab){
 activeTab=tab;
 ['profile','plan','posts'].forEach(name=>{
  $(name+'Tab').hidden=name!==tab;
  const button=document.querySelector('[data-tab="'+name+'"]');
  button.setAttribute('aria-pressed',String(name===tab));
  button.classList.toggle('secondary',name!==tab);
 });
}
function clearListeners(){
 if(stopDogs){stopDogs();stopDogs=null}
 stopSubcollections();
}
function stopSubcollections(){
 listenerVersion++;
 if(stopActivities){stopActivities();stopActivities=null}
 if(stopPosts){stopPosts();stopPosts=null}
 activities=[];posts=[];
}
function setBusy(state){busy=state;const controls=['saveProfile','archiveDog','newDogBtn','taskTitle','taskTime','postText','dogName'];controls.forEach(id=>{const el=$(id);if(el)el.disabled=state})}
function isValidDate(s){if(!s)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !Number.isNaN(d.getTime())&&d.getFullYear()===+s.slice(0,4)&&d.getMonth()+1===+s.slice(5,7)&&d.getDate()===+s.slice(8,10)}
function renderCards(){
 const target=$('dogCards');target.replaceChildren();
 const visible=dogs.filter(d=>showArchived||!d.archived).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
 $('emptyDogs').hidden=visible.length!==0;
 visible.forEach(d=>{
  const btn=document.createElement('button');btn.className='dog-card'+(selectedId===d.id?' selected':'');btn.type='button';
  const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent='🐶';
  const strong=document.createElement('strong');strong.textContent=d.name||'Unnamed dog';
  const label=document.createElement('small');label.textContent=(d.breed||'Breed not entered')+(d.archived?' • Archived':'');
  btn.append(symbol,strong,label);
  btn.onclick=()=>openDog(d.id);
  target.append(btn);
 });
 const toggle=document.createElement('button');toggle.className='secondary';toggle.type='button';
 toggle.textContent=showArchived?'Hide archived dogs':'Show archived dogs';
 toggle.style.marginTop='10px';toggle.onclick=()=>{showArchived=!showArchived;renderCards()};
 const duplicates=$('dogsPage').querySelectorAll('button[data-archive-toggle]');
 duplicates.forEach(b=>b.remove());
 toggle.dataset.archiveToggle='true';
 target.after(toggle);
}
function fillProfile(d){
 if(!d)return;
 $('dogHeading').textContent=d.name||'Dog profile';
 $('dogName').value=d.name||'';
 $('dogBreed').value=d.breed||'';
 $('dogDob').value=d.dob||'';
 $('dogPersonality').value=d.personality||'';
 $('dogFact').value=d.fact||'';
 $('archiveDog').textContent=d.archived?'Restore archived dog':'Archive dog';
 lastLoadedRevision=Number.isInteger(d.revision)?d.revision:0;
 draftDirty=false;
 snapshotVersion=lastLoadedRevision;
}
function renderActivities(){
 const root=$('activities');root.replaceChildren();
 if(!activities.length){const p=document.createElement('p');p.className='muted';p.textContent='No activities yet. Add the first one below.';root.append(p);return}
 const today=day(),dogId=selectedId;
 activities.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).forEach(item=>{
  const row=document.createElement('div');row.className='activity'+(item.completedOn===today?' completed':'');
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=item.completedOn===today;
  checkbox.setAttribute('aria-label','Mark '+item.title+' complete for today');
  const name=document.createElement('div');name.className='activity-title';
  const strong=document.createElement('strong');strong.textContent=item.title||'Activity';
  const time=document.createElement('small');time.textContent=item.time||'No time';
  name.append(strong,time);
  const remove=document.createElement('button');remove.className='secondary';remove.type='button';remove.textContent='Remove';
  checkbox.onchange=async()=>{
   const wanted=checkbox.checked;checkbox.disabled=true;
   try{await updateDoc(doc(taskCollection(dogId),item.id),{completedOn:wanted?day():null,updatedAt:serverTimestamp()});notice(wanted?'Activity completed.':'Activity marked incomplete.')}
   catch(e){checkbox.checked=!wanted;notice('Could not save completion: '+e.message,true)}
   finally{checkbox.disabled=false}
  };
  remove.onclick=async()=>{
   if(!confirm('Remove the activity "'+item.title+'"?'))return;
   try{await deleteDoc(doc(taskCollection(dogId),item.id));notice('Activity removed.')}
   catch(e){notice('Could not remove activity: '+e.message,true)}
  };
  row.append(checkbox,name,remove);root.append(row);
 });
}
function renderPosts(){
 const root=$('postCards');root.replaceChildren();
 if(!posts.length){const p=document.createElement('p');p.className='muted';p.textContent='No memories yet.';root.append(p);return}
 const dogId=selectedId;
 posts.slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).forEach(post=>{
  const card=document.createElement('article');card.className='data';
  const text=document.createElement('p');text.textContent=post.text||'';
  const small=document.createElement('small');small.textContent=post.createdAt?.toDate?.().toLocaleString()||'Saved online';
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Remove';remove.style.marginTop='7px';
  remove.onclick=async()=>{if(!confirm('Remove this private memory?'))return;try{await deleteDoc(doc(postCollection(dogId),post.id))}catch(e){notice('Unable to remove memory: '+e.message,true)}};
  card.append(text,small,remove);root.append(card);
 });
}
function watchSelected(id){
 stopSubcollections();
 const currentVersion=listenerVersion;
 stopActivities=onSnapshot(taskCollection(id),snap=>{
  if(currentVersion!==listenerVersion||id!==selectedId)return;
  activities=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderActivities();
 },e=>notice('Daily Plan could not load: '+e.message,true));
 stopPosts=onSnapshot(postCollection(id),snap=>{
  if(currentVersion!==listenerVersion||id!==selectedId)return;
  posts=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderPosts();
 },e=>notice('Recent Posts could not load: '+e.message,true));
}
function openDog(id){
 const d=dogs.find(x=>x.id===id);if(!d)return;
 const changed=selectedId!==id;
 selectedId=id;
 if(changed){draftDirty=false;fillProfile(d);watchSelected(id);setTab('profile')}
 page('dogPage');renderCards();
}
function updateCurrentView(){
 renderCards();
 if(!selectedId)return;
 const d=activeDog();
 if(!d){selectedId=null;stopSubcollections();page('dogsPage');notice('The selected dog is no longer available.');return}
 $('dogHeading').textContent=d.name||'Dog profile';
 $('archiveDog').textContent=d.archived?'Restore archived dog':'Archive dog';
 if(!draftDirty)fillProfile(d);
 else if(Number.isInteger(d.revision)&&d.revision!==lastLoadedRevision)notice('This profile changed on another device. Save will check for a conflict.',true);
}
function startDogs(){
 if(!person)return;
 if(stopDogs)stopDogs();
 stopDogs=onSnapshot(dogCollection(),snapshot=>{
  dogs=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.type==='daily-tail-dog-v1');
  updateCurrentView();
 },e=>notice('Unable to load your dogs: '+e.message,true));
}
function loginHandler(){
 $('google').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){notice('Google sign-in failed: '+e.message,true)}};
 $('emailForm').onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value)}catch(err){notice('Sign-in failed: '+err.message,true)}};
 $('register').onclick=async()=>{const email=$('email').value.trim(),password=$('password').value;if(!email||password.length<6){notice('Enter an email and password of at least 6 characters.',true);return}try{await createUserWithEmailAndPassword(auth,email,password)}catch(err){notice('Account creation failed: '+err.message,true)}};
 $('resetPassword').onclick=async()=>{const email=$('email').value.trim();if(!email){notice('Enter your email first.',true);return}try{await sendPasswordResetEmail(auth,email);notice('If this email has an account, check the inbox for reset instructions.')}catch(err){notice('Unable to send reset email: '+err.message,true)}};
 $('logout').onclick=()=>signOut(auth).catch(err=>notice(err.message,true));
}
function appHandler(){
 $('allDogsBtn').onclick=()=>{selectedId=null;draftDirty=false;stopSubcollections();page('dogsPage');renderCards()};
 $('backToDogs').onclick=$('allDogsBtn').onclick;
 $('newDogBtn').onclick=()=>{if(busy)return;page('newDogPage')};
 $('cancelNew').onclick=()=>page('dogsPage');
 $('oldSite').onclick=()=>{window.location.assign('./legacy.html')};
 document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>setTab(btn.dataset.tab));
 ['dogName','dogBreed','dogDob','dogPersonality','dogFact'].forEach(id=>$(id).addEventListener('input',()=>{draftDirty=true}));
 $('newDogForm').onsubmit=async e=>{
  e.preventDefault();if(busy||!person)return;
  const name=$('newName').value.trim().slice(0,40),breed=$('newBreed').value.trim().slice(0,60);
  if(!name)return;
  if(dogs.filter(d=>!d.archived).length>=25){notice('This version supports up to 25 active dogs per account.',true);return}
  setBusy(true);
  try{
   const created=await addDoc(dogCollection(),{type:'daily-tail-dog-v1',ownerUid:person.uid,name,breed,dob:'',personality:'',fact:'',archived:false,revision:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   $('newDogForm').reset();
   notice(name+' saved online.');
   // onSnapshot may arrive slightly after creation; show the list until it does
   selectedId=null;page('dogsPage');
  }catch(err){notice('Could not create dog: '+err.message,true)}
  finally{setBusy(false)}
 };
 $('profileForm').onsubmit=async e=>{
  e.preventDefault();if(busy||!person||!selectedId)return;
  const uid=person.uid,id=selectedId,revision=lastLoadedRevision;
  const data={name:$('dogName').value.trim().slice(0,40),breed:$('dogBreed').value.trim().slice(0,60),dob:$('dogDob').value,personality:$('dogPersonality').value.trim().slice(0,300),fact:$('dogFact').value.trim().slice(0,180)};
  if(!data.name||!isValidDate(data.dob)){notice('Enter a name and a valid birthday.',true);return}
  setBusy(true);
  try{
   await runTransaction(db,async tx=>{
    const ref=doc(db,'users',uid,'dogs',id);
    const current=await tx.get(ref);
    if(!current.exists()||current.data().type!=='daily-tail-dog-v1')throw Error('This dog was not found.');
    const currentRev=current.data().revision||0;
    if(currentRev!==revision)throw Error('Someone updated this profile. Copy your edits if needed, then reopen the dog to review the latest version.');
    tx.update(ref,{...data,revision:currentRev+1,updatedAt:serverTimestamp()});
   });
   draftDirty=false;lastLoadedRevision=revision+1;
   notice('Profile saved to your cloud account.');
  }catch(err){notice('Profile not saved: '+err.message,true)}
  finally{setBusy(false)}
 };
 $('archiveDog').onclick=async()=>{
  const d=activeDog();if(!d)return;
  if(!confirm((d.archived?'Restore':'Archive')+' '+d.name+'? Archiving hides the profile without deleting its information.'))return;
  try{await updateDoc(dogRef(d.id),{archived:!d.archived,updatedAt:serverTimestamp()});notice(d.archived?'Dog restored.':'Dog archived.');if(!d.archived){selectedId=null;stopSubcollections();page('dogsPage')}}
  catch(err){notice('Unable to update archive status: '+err.message,true)}
 };
 $('activityForm').onsubmit=async e=>{
  e.preventDefault();if(!selectedId||!person)return;
  if(activities.length>=60){notice('Maximum 60 activities per dog.',true);return}
  const title=$('taskTitle').value.trim().slice(0,90),time=$('taskTime').value;
  if(!title||!/^\d\d:\d\d$/.test(time)){notice('Enter an activity and time.',true);return}
  try{await addDoc(taskCollection(selectedId),{title,time,completedOn:null,type:'daily-tail-activity-v1',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});$('activityForm').reset();notice('Daily Plan activity saved.')}
  catch(err){notice('Could not save activity: '+err.message,true)}
 };
 $('postForm').onsubmit=async e=>{
  e.preventDefault();if(!selectedId||!person)return;
  if(posts.length>=100){notice('Maximum 100 text posts per dog in this version.',true);return}
  const text=$('postText').value.trim().slice(0,1000);
  if(!text)return;
  try{await addDoc(postCollection(selectedId),{text,type:'daily-tail-post-v1',createdAt:serverTimestamp()});$('postForm').reset();notice('Private memory saved online.')}
  catch(err){notice('Could not save memory: '+err.message,true)}
 };
}
function main(){
 loginHandler();appHandler();
 onAuthStateChanged(auth,next=>{
  clearListeners();
  person=next;dogs=[];selectedId=null;draftDirty=false;lastLoadedRevision=null;activities=[];posts=[];
  $('dogCards').replaceChildren();renderActivities();renderPosts();
  notice('');
  if(!next){show('authScreen');return}
  $('accountLabel').textContent=next.email||'Signed in with Firebase';
  show('workspace');page('dogsPage');startDogs();
 },err=>{show('authScreen');notice('Unable to verify your account: '+err.message,true)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});else main();
