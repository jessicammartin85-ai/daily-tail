import {dailyTalesAuth as auth} from './cloud-dog-store.js';
import {GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {addDoc, collection, doc, getDocFromServer, getDocsFromServer, getFirestore, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const db=getFirestore(auth.app);
const emergencyFields={
 vetName:'Vet',vetPhone:'Vet phone',erName:'Emergency clinic',erPhone:'Emergency clinic phone',
 erAddress:'Emergency clinic address',contactName:'Emergency contact',contactPhone:'Emergency contact phone',
 microchip:'Microchip',medications:'Medications',allergies:'Allergies',notes:'Emergency instructions'
};
const validId=value=>typeof value==='string'&&/^[\w-]{3,128}$/.test(value);
const visits=(ownerUid,dogId)=>collection(db,'users',ownerUid,'caregiverDogs',dogId,'visits');
const care=ref=>doc(ref,'care','details');
const requests=ref=>collection(ref,'requests');
const activity=ref=>collection(ref,'activity');
const text=(value,max)=>String(value??'').trim().slice(0,max);
const format=stamp=>stamp.toDate().toLocaleString();
const dateKey=()=>new Intl.DateTimeFormat('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

function element(tag,value){
 const node=document.createElement(tag);
 if(value)node.textContent=value;
 return node;
}
function action(label,callback,status){
 const button=element('button',label);
 button.type='button';
 button.onclick=async()=>{
  button.disabled=true;
  try{await callback();}
  catch(error){status.textContent=error.code==='permission-denied'?'Access was denied. Check the visit status and try again.':error.message;}
  finally{button.disabled=false;}
 };
 return button;
}
function visitStatus(visit){
 if(visit.revoked)return 'Revoked';
 if(Date.now()>=visit.endsAt.toMillis())return 'Expired';
 if(!visit.approvedUid)return 'Awaiting approval';
 if(Date.now()<visit.startsAt.toMillis())return 'Approved · scheduled';
 return 'Active';
}
function snapshot(getDetails){
 const details=getDetails();
 return {
  name:text(details.name,80),
  plan:details.plan.slice(0,100).map(item=>({time:text(item.time,30),title:text(item.title,180)})),
  emergency:Object.fromEntries(Object.keys(emergencyFields).flatMap(key=>{
   const value=text(details.emergency[key],1000);
   return value?[[key,value]]:[];
  }))
 };
}

export async function openCaregiverOwner(root,ownerUid,dogId,getDetails){
 await auth.authStateReady();
 if(!auth.currentUser)throw Error('Sign in as an Adult Owner first.');
 ownerUid=ownerUid||auth.currentUser.uid;
 if(!validId(ownerUid)||!validId(dogId))throw Error('Open a synced dog profile first.');
 const list=visits(ownerUid,dogId);
 root.innerHTML=`
 <p>Invite a walker or sitter to view a copy of your dog’s current Daily Plan and Emergency Info. They can check off activities and leave care notes during the visit. Approve their account after they request access.</p>
 <form><label class="field">Starts<input name="starts" type="datetime-local" required></label>
 <label class="field">Ends<input name="ends" type="datetime-local" required></label>
 <button class="primary" type="submit">Create temporary invite</button></form>
 <p role="status" data-care-status></p><div data-care-list></div>`;
 const form=root.querySelector('form'),status=root.querySelector('[data-care-status]'),cards=root.querySelector('[data-care-list]');
 const refresh=async()=>{
  const result=await getDocsFromServer(query(list,orderBy('startsAt','desc')));
  if(!root.isConnected)return;
  const next=document.createDocumentFragment();
  if(result.empty)next.append(element('p','No caregiver visits yet.'));
  for(const row of result.docs){
   const visit=row.data(),state=visitStatus(visit),ref=row.ref;
   const card=element('section');
   card.className='dt-manage-card';
   card.append(element('h3',state),element('p',format(visit.startsAt)+' to '+format(visit.endsAt)));
   if(!visit.revoked&&state!=='Expired'){
    const url=new URL('./caregiver.html',location.href);
    url.search=new URLSearchParams({owner:ownerUid,dog:dogId,visit:row.id});
    const link=element('input');
    link.type='url';link.readOnly=true;link.value=url.href;link.setAttribute('aria-label','Caregiver invitation link');
    card.append(link,action('Copy invite link',async()=>{
     link.select();
     await navigator.clipboard.writeText(url.href);
     status.textContent='Invite link copied.';
    },status),action('Revoke access',async()=>{
     await updateDoc(ref,{revoked:true});
     status.textContent='Caregiver access revoked.';
     await refresh();
    },status));
   }
   const review=element('div');
   card.append(action(visit.approvedUid?'View care activity':'Review requests',async()=>{
    if(visit.approvedUid){
     const [logs,details]=await Promise.all([getDocsFromServer(query(activity(ref),orderBy('createdAt','desc'))),getDocFromServer(care(ref))]);
     const plan=details.data()?.plan||[];
     review.replaceChildren();
     if(logs.empty)review.append(element('p','No care activity yet.'));
     for(const entry of logs.docs){
      const item=entry.data();
      const summary=item.kind==='note'?item.text:`${item.done?'Checked off':'Unchecked'} ${plan[item.index]?.title||'activity'} for ${item.day}`;
      review.append(element('p',format(item.createdAt)+' · '+summary));
     }
    }else{
     const result=await getDocsFromServer(requests(ref));
     review.replaceChildren();
     if(result.empty)review.append(element('p','No access requests yet.'));
     for(const request of result.docs){
      const row=element('p',request.data().email||request.id);
      if(!visit.revoked&&state!=='Expired')row.append(document.createTextNode(' '),action('Approve',async()=>{
       await updateDoc(ref,{approvedUid:request.id});
       status.textContent='Caregiver approved.';
       await refresh();
      },status));
      review.append(row);
     }
    }
   },status),review);
   next.append(card);
  }
  cards.replaceChildren(next);
 };
 root.append(action('Refresh visits',refresh,status));
 form.onsubmit=async event=>{
  event.preventDefault();
  const submit=form.querySelector('button');
  const start=new Date(form.elements.starts.value),end=new Date(form.elements.ends.value);
  if(!(end>start&&end>new Date())||end-start>30*86400000){
   status.textContent='Choose a future end time after the start. A visit can last up to 30 days.';
   return;
  }
  submit.disabled=true;
  try{
   const ref=doc(list),batch=writeBatch(db);
   batch.set(ref,{startsAt:Timestamp.fromDate(start),endsAt:Timestamp.fromDate(end),approvedUid:'',revoked:false});
   batch.set(care(ref),snapshot(getDetails));
   await batch.commit();
   form.reset();
   status.textContent='Invite created. Copy its link to share it.';
   await refresh();
  }catch(error){status.textContent=error.code==='permission-denied'?'Could not create the invite. Check your Adult Owner access and that the caregiver rules are published.':error.message;}
  finally{submit.disabled=false;}
 };
 await refresh();
}

const portal=document.getElementById('caregiverPortal');
if(portal)startPortal(portal);

function startPortal(root){
 const params=new URLSearchParams(location.search);
 const owner=params.get('owner'),dog=params.get('dog'),id=params.get('visit');
 if(![owner,dog,id].every(validId)){root.textContent='Open the full invitation link from the Adult Owner.';return;}
 const ref=doc(visits(owner,dog),id);
 const status=document.getElementById('caregiverStatus'),signOutButton=document.getElementById('caregiverSignOut');
 let unsubscribe=()=>{},visit,loading=false,generation=0,shownDay='';
 function clear(){
  generation++;
  shownDay='';
  root.replaceChildren();
 }
 function signIn(){
  root.innerHTML=`
  <p>Sign in to your own account to request access.</p>
  <form><label>Email<input name="email" type="email" autocomplete="email" required></label>
  <label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required></label>
  <button type="submit" value="signin">Sign in</button> <button type="submit" value="register">Create account</button></form>`;
  root.prepend(action('Continue with Google',()=>signInWithPopup(auth,new GoogleAuthProvider()),status));
  const form=root.querySelector('form');
  form.onsubmit=async event=>{
   event.preventDefault();
   const button=event.submitter;
   if(button)button.disabled=true;
   try{
    const email=form.elements.email.value.trim(),password=form.elements.password.value;
    if(button?.value==='register')await createUserWithEmailAndPassword(auth,email,password);
    else await signInWithEmailAndPassword(auth,email,password);
   }catch{status.textContent='Could not sign in. Check your email and password or continue with Google.';}
   finally{if(button)button.disabled=false;}
  };
 }
 async function render(){
  const user=auth.currentUser;
  if(!user||!visit)return;
  const state=visitStatus(visit);
  if(state==='Revoked'||state==='Expired'){
   clear();status.textContent='This visit’s access has ended.';return;
  }
  if(!visit.approvedUid){
   if(root.dataset.view==='request')return;
   clear();root.dataset.view='request';
   const version=generation;
   status.textContent='An Adult Owner must approve your account.';
   try{
    const own=doc(requests(ref),user.uid);
    const existing=await getDocFromServer(own);
    if(version!==generation)return;
    if(existing.exists()){status.textContent='Request sent. Waiting for Adult Owner approval.';return;}
    root.append(action('Request access',async()=>{
     await setDoc(own,{email:user.email||'',createdAt:serverTimestamp()});
     if(version===generation){root.replaceChildren();status.textContent='Request sent. Waiting for Adult Owner approval.';}
    },status));
   }catch{if(version===generation){delete root.dataset.view;status.textContent='Could not check your request. Reconnect and try again.';}}
   return;
  }
  if(visit.approvedUid!==user.uid||state!=='Active'){
   clear();delete root.dataset.view;
   status.textContent=visit.approvedUid!==user.uid?'This invitation was approved for another account.':'Your access opens '+format(visit.startsAt)+'.';
   return;
  }
  const day=dateKey();
  if(loading||shownDay===day)return;
  loading=true;
  clear();delete root.dataset.view;
  const version=generation;
  try{
   const [sheet,logs]=await Promise.all([getDocFromServer(care(ref)),getDocsFromServer(query(activity(ref),orderBy('createdAt','desc')))]);
   if(version!==generation||auth.currentUser?.uid!==user.uid||visitStatus(visit)!=='Active')return;
   if(!sheet.exists())throw Error('The Adult Owner has not shared care details.');
   shownDay=day;
   showCare(root,status,ref,sheet.data(),logs.docs.map(row=>row.data()),day);
   status.textContent='Access ends '+format(visit.endsAt)+'.';
  }catch{if(version===generation)status.textContent='Care details are unavailable. Check your connection and visit window.';}
  finally{loading=false;}
 }
 signOutButton.onclick=()=>signOut(auth);
 onAuthStateChanged(auth,user=>{
  unsubscribe();clear();visit=null;delete root.dataset.view;status.textContent='';
  signOutButton.hidden=!user;
  if(!user){signIn();return;}
  unsubscribe=onSnapshot(ref,{includeMetadataChanges:true},snap=>{
   if(snap.metadata.fromCache){visit=null;clear();delete root.dataset.view;status.textContent='Connecting to verify access…';return;}
   if(!snap.exists()){visit=null;clear();status.textContent='This invitation could not be found.';return;}
   visit=snap.data();
   void render();
  },()=>{visit=null;clear();status.textContent='This invitation is unavailable.';});
 });
 setInterval(()=>void render(),2000);
}

function showCare(root,status,ref,details,logs,day){
 root.append(element('h2',details.name),element('h3','Daily Plan'));
 const checks=new Map();
 for(const item of logs)if(item.kind==='check'&&item.day===day&&!checks.has(item.index))checks.set(item.index,item.done);
 const plan=element('div');
 for(const [index,item] of details.plan.entries()){
  const label=element('label'),box=element('input');
  box.type='checkbox';box.checked=checks.get(index)===true;
  box.onchange=async()=>{
   const done=box.checked;
   box.disabled=true;
   try{
    await addDoc(activity(ref),{kind:'check',day,index,done,createdAt:serverTimestamp()});
    status.textContent=done?'Activity checked off.':'Activity marked incomplete.';
   }catch{box.checked=!done;status.textContent='Could not save this check-off. Check your access and connection.';}
   finally{box.disabled=false;}
  };
  label.append(box,document.createTextNode(' '+item.time+' '+item.title));
  plan.append(label);
 }
 if(!details.plan.length)plan.append(element('p','No plan activities were shared.'));
 root.append(plan,element('h3','Care notes'));
 const notes=element('div');
 for(const item of logs)if(item.kind==='note')notes.append(element('p',format(item.createdAt)+' · '+item.text));
 const input=element('textarea');
 input.maxLength=1000;input.placeholder='How did the visit go?';input.setAttribute('aria-label','Care note');
 root.append(input,action('Save care note',async()=>{
  const note=input.value.trim();
  if(!note){status.textContent='Enter a care note first.';return;}
  await addDoc(activity(ref),{kind:'note',text:note,createdAt:serverTimestamp()});
  notes.prepend(element('p',note));
  input.value='';
  status.textContent='Care note saved.';
 },status),notes,element('h3','Emergency Info'));
 const emergency=element('dl');
 for(const [key,label] of Object.entries(emergencyFields)){
  const value=details.emergency[key];
  if(!value)continue;
  const field=element('dd',value);
  const number=key.endsWith('Phone')?value.replace(/[^+0-9]/g,''):'';
  if(/^\+?\d{7,16}$/.test(number)){
   const link=element('a',value);link.href='tel:'+number;field.replaceChildren(link);
  }
  emergency.append(element('dt',label),field);
 }
 root.append(emergency.childElementCount?emergency:element('p','No emergency details were shared.'));
}
