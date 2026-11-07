import {publicMemoryPosts} from './public-memory-posts.js?v=memory-bylines-20261107';
import {dailyTalesCloudDogStore as dogStore} from './cloud-dog-store.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,writeBatch,deleteDoc,runTransaction,onSnapshot,query,where,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const config={apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',storageBucket:'daily-tail.firebasestorage.app',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'};
const app=getApps().find(a=>a.name==='daily-tail-cloud')||initializeApp(config,'daily-tail-cloud'),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inviteId=new URLSearchParams(location.search).get('dtInvite');
let user=null,invite=null,openingJoinedDog=false;
function openJoinedDog(){
 if(openingJoinedDog)return;
 openingJoinedDog=true;
 if($('shareShade'))$('shareShade').hidden=true;
 window.dispatchEvent(new Event('daily-tales-membership-updated'));
 const target=new URL('./legacy.html',location.href);
 target.searchParams.set('joined',Date.now().toString());
 location.replace(target.href);
}
async function resumeMembership(i){
 if(i.ownerUid===user.uid){openJoinedDog();return true;}
 const member=await getDoc(doc(db,'users',i.ownerUid,'members',user.uid,'dogs',i.dogId));
 if(!member.exists()||!['adult','child'].includes(member.data().role))return false;
 if(user.email)await updateDoc(doc(db,'users',i.ownerUid,'members',user.uid,'dogs',i.dogId),{accountName:user.displayName||'',accountEmail:user.email}).catch(e=>console.warn('Account label update',e));
 status('Access confirmed. Opening your dog profile…');
 await setDoc(doc(db,'users',user.uid,'joinedDogs',i.ownerUid+'_'+i.dogId),{ownerUid:i.ownerUid,dogId:i.dogId,role:member.data().role,name:i.name||'Dog',joinedAt:serverTimestamp()});
 openJoinedDog();return true;
}
const status=(s,bad=false)=>{const x=$('shareShade')?.querySelector('#shareStatus');if(x){x.textContent=s;x.style.color=bad?'#a33':'#36586b'}};
const error=e=>String(e?.message||e).slice(0,290);
const dog=()=>{try{const a=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return a.dogs?.find(d=>d.id===a.activeId)}catch{return null}};
const isAdult=()=>window.dtRole==='adult'&&!!user&&!!dog();
const profileOwner=()=>dog()?.ownerUid||user?.uid;
let stopJoinRequest=null;
function watchJoinRequest(ref,i){
 if(stopJoinRequest)stopJoinRequest();
 stopJoinRequest=onSnapshot(ref,async snap=>{
  if(!snap.exists())return;
  const v=snap.data(),button=$('shareAccept');
  if(v.status==='approved'){try{await resumeMembership(i)}catch(e){status('Approved, but could not open the profile: '+error(e),true)}return;}
  if(button){button.disabled=true;button.textContent=v.status==='declined'?'Request declined':'Waiting for owner approval';}
  status(v.status==='declined'?'The owner declined this request. Ask them for a new invitation.':'Your request was sent. A connected Adult Owner must approve it before you can join.',v.status==='declined');
 },e=>status('Could not check your request: '+error(e),true));
}
async function signIn(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){status(error(e),true)}}
async function loadInvitation(){
 if(!inviteId)return;
 if(!user){
   $('shareShade').hidden=true;
   return;
 }
 try{
  const r=await getDoc(doc(db,'invites',inviteId));
  if(!r.exists())throw Error('This invitation is unavailable.');
  invite=r.data();
  if(await resumeMembership(invite))return;
  const expired=invite.expiresAt?.toMillis?.()<=Date.now();
  const alreadyUsed=!!invite.usedBy;
  const usable=invite.active===true&&!alreadyUsed&&!expired;
  $('shareInvite').innerHTML='<h3>Join '+safe(invite.name||'this dog')+'!</h3><p>You have been invited to request <strong>'+safe(invite.role)+'</strong> access. A connected Adult Owner must approve your request.</p>'
   +(usable?'<button id="shareAccept">Request to join</button>':'<p>This invitation was already used, revoked, or expired. Ask the owner for a new link.</p>')
   +'<div id="shareDog"></div>';
  if(usable)$('shareAccept').onclick=acceptInvitation;
  watchJoinRequest(doc(db,'users',invite.ownerUid,'joinRequests',inviteId+'_'+user.uid),invite);

 }catch(e){status(error(e),true)}
}
async function acceptInvitation(){
 if(!user||!invite)return status('Sign in first.',true);
 const btn=$('shareAccept');if(btn){btn.disabled=true;btn.textContent='Sending request…'}
 try{
  const inviteRef=doc(db,'invites',inviteId);
  const snap=await getDoc(inviteRef);
  if(!snap.exists())throw Error('Invitation not found.');
  const i=snap.data();
  if(await resumeMembership(i))return;
  if(i.active!==true||i.usedBy||!i.expiresAt||i.expiresAt.toMillis()<=Date.now())throw Error('This link is no longer valid. Ask for another invitation.');
  if(!['adult','child'].includes(i.role))throw Error('This invitation is not a family invitation.');
  if(i.ownerUid===user.uid)throw Error('You already own this profile. Open My Dogs.');
  const requestRef=doc(db,'users',i.ownerUid,'joinRequests',inviteId+'_'+user.uid);
  const existing=await getDoc(requestRef);
  if(!existing.exists()){
   await setDoc(requestRef,{ownerUid:i.ownerUid,dogId:i.dogId,requesterUid:user.uid,requesterName:user.displayName||'',requesterEmail:user.email||'',inviteId,role:i.role,status:'pending',createdAt:serverTimestamp()});
  }
  watchJoinRequest(requestRef,i);
  if(btn){btn.disabled=true;btn.textContent='Waiting for owner approval';}
  status('Request sent. A connected Adult Owner must approve before you can join.');
 }catch(e){status('Could not request access: '+error(e),true);if(btn){btn.disabled=false;btn.textContent='Request to join'}}
}
async function publish(d){
 if(!user||!d||!isAdult())throw Error('Sign in and open the Adult Owner view.');
 if(typeof window.dtSnapshotActive==='function')window.dtSnapshotActive();
 const refreshed=dog();if(refreshed?.id===d.id)d=refreshed;
 const m=d.meta||{},p=d.profile||{};
 const pref=(()=>{try{return JSON.parse(localStorage.getItem('daily_tail_public_preferences_v1')||'{}')}catch{return {}}})();
 const payload={name:String(d.name||'Dog'),breed:String(m.breed||''),dob:String(m.dob||''),personality:String(m.personality||''),favorites:String(m.favorites||''),cuteFact:String(m.cuteFact||''),photo:p.profile?.length<400000?p.profile||'':'',posts:pref.memories?await publicMemoryPosts(p.posts):[],updatedAt:serverTimestamp()};
 payload.postIds=payload.posts.map(p=>p.id).filter(Boolean);
 if(JSON.stringify({...payload,updatedAt:null}).length>850000)throw Error('Shared profile is too large for Firestore. Reduce photo size.');
 await setDoc(doc(db,'users',profileOwner(),'sharedProfiles',d.id),payload);
 if(profileOwner()===user.uid)await setDoc(doc(db,'users',user.uid,'dogAccounts',d.id),{accountName:user.displayName||'',accountEmail:user.email||''});
 return d;
}
function sharedSectionFields(dog,previous){
 const saved=window.DailyTailsFriendSections?.build(dog?.extras)||{};
 return Object.keys(saved).length||previous?.sharedSections?{sharedSections:saved}:{};
}
async function createInvitation(){
 const d=dog();if(!d)return status('Open the dog’s profile first.',true);
 if(!user||!isAdult())return status('Sign in to Cloud Sync and open Adult Owner view first.',true);
 try{
  const current=await publish(d),role=$('shareRole').value;
  if(role==='friend'&&profileOwner()!==user.uid)throw Error('The original profile owner manages the public Friend View link. You can invite and approve Adult and Child accounts.');
  if(role==='friend'){
   const linkRef=doc(db,'users',profileOwner(),'publicShareLinks',current.id);
   const existing=await getDoc(linkRef);
   const shareId=existing.exists()&&typeof existing.data().shareId==='string'?existing.data().shareId:doc(collection(db,'publicProfiles')).id;
   const shared=await getDoc(doc(db,'users',profileOwner(),'sharedProfiles',current.id));
   if(!shared.exists())throw Error('Could not prepare the shared profile.');
   const p=shared.data();
   await setDoc(doc(db,'publicProfiles',shareId),{
    ...sharedSectionFields(dog()?.id===current.id?dog():current),
    ownerUid:profileOwner(),dogId:current.id,active:true,name:p.name||current.name,
    breed:p.breed||'',dob:p.dob||'',personality:p.personality||'',
    favorites:p.favorites||'',cuteFact:p.cuteFact||'',photo:p.photo||'',
    posts:Array.isArray(p.posts)?p.posts:[],postIds:(p.posts||[]).map(post=>post.id).filter(Boolean),updatedAt:serverTimestamp()
   });
   await setDoc(linkRef,{shareId,createdAt:serverTimestamp()});
   $('shareLink').value=location.origin+location.pathname.replace(/[^/]*$/,'')+'friend.html?share='+encodeURIComponent(shareId);
   $('shareCopy').hidden=false;
   $('shareRevoke').hidden=false;
   status('Friend link is ready! Anyone with this link can view the shared details without signing in.');
  }else{
   const r=doc(collection(db,'invites'));
   await setDoc(r,{ownerUid:profileOwner(),dogId:current.id,name:current.name,role,active:true,createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+7*24*60*60*1000)});
   $('shareLink').value=location.origin+location.pathname+'?dtInvite='+encodeURIComponent(r.id);
   $('shareCopy').hidden=false;$('shareRevoke').hidden=true;
   status('Invitation ready! The recipient signs in and requests access. A connected Adult Owner must approve. This single-use link expires after 7 days.');
  }
 }catch(e){status(error(e),true)}
}
async function revokeFriendLink(){
 if(!user||!isAdult()||!dog())return status('Open your Adult Owner profile first.',true);
 if(!confirm('Turn off this dog’s Friend View link? People with the link will no longer be able to open it.'))return;
 try{
  const r=await getDoc(doc(db,'users',profileOwner(),'publicShareLinks',dog().id));
  if(!r.exists())return status('No Friend View link is registered for this dog.');
  await updateDoc(doc(db,'publicProfiles',r.data().shareId),{active:false,updatedAt:serverTimestamp()});
  $('shareLink').value='';$('shareCopy').hidden=true;$('shareRevoke').hidden=true;
  status('Friend View link disabled. You can enable it again by creating a new Friend link.');
 }catch(e){status(error(e),true)}
}
async function decide(r,approve){
 const v=r.data();if(!isAdult())return status('Only a connected Adult Owner can approve requests.',true);
 if(!confirm((approve?'Approve ':'Decline ')+v.requesterName+' for '+v.role+' access?'))return;
 try{
  await runTransaction(db,async tx=>{
   const fresh=await tx.get(r.ref);if(!fresh.exists()||fresh.data().status!=='pending')throw Error('This request has already been reviewed.');
   const value=fresh.data();
   if(value.dogId!==dog().id)throw Error('Open the dog named in this request.');
   if(approve){
    const inviteRef=doc(db,'invites',value.inviteId),inv=await tx.get(inviteRef);
    if(!inv.exists()||!inv.data().active||inv.data().usedBy||inv.data().expiresAt.toMillis()<=Date.now())throw Error('This invitation expired or was used. Create a new invitation.');
    if(inv.data().ownerUid!==profileOwner()||inv.data().dogId!==value.dogId||inv.data().role!==value.role)throw Error('Invitation does not match the request.');
    tx.set(doc(db,'users',profileOwner(),'members',value.requesterUid,'dogs',value.dogId),{role:value.role,inviteId:value.inviteId,addedAt:serverTimestamp(),accountName:value.requesterName||'',accountEmail:value.requesterEmail||''});
    tx.update(inviteRef,{active:false,usedBy:value.requesterUid,acceptedAt:serverTimestamp()});
   }
   tx.update(r.ref,{status:approve?'approved':'declined'});
  });
  await refresh();status(approve?'Approved. The requester can now open the connected profile.':'Request declined. No access was granted.');
 }catch(e){status(error(e),true)}
}
async function decideChildProposal(record,approve){
 const proposal=record.data();
 const message=(approve?'Approve':'Decline')+' this '+proposal.kind+' change from a Child Owner?';
 if(!confirm(message))return;
 try{
   if(approve){
     const current=await dogStore.readDog(proposal.dogId,profileOwner());
     if(!current)throw Error('Dog not found online.');
     const changes=proposal.payload||{};
     if(proposal.kind==='photo'){
       if(typeof changes.image!=='string')throw Error('Invalid submitted photo.');
       current.profile={...(current.profile||{}),profile:changes.image};
     }else if(proposal.kind==='post'){
       if(!Array.isArray(changes.posts))throw Error('Invalid submitted posts.');
       current.profile={...(current.profile||{}),posts:changes.posts};
     }else if(proposal.kind==='profile'){
       current.meta={...(current.meta||{}),...(changes.changes||{})};
     }
     await dogStore.saveDog(current,current.revision,profileOwner());
   }
   await updateDoc(record.ref,{status:approve?'approved':'declined',reviewedAt:serverTimestamp()});
   status(approve?'Child update approved and saved online.':'Child change declined.');
   await refresh();
 }catch(e){status('Could not review child change: '+error(e),true)}
}
async function syncAccountLabels(){
 if(!user?.email)return;
 const links=await getDocs(collection(db,'users',user.uid,'joinedDogs'));
 for(const record of links.docs){
  const link=record.data();if(link.ownerUid===user.uid)continue;
  const ref=doc(db,'users',link.ownerUid,'members',user.uid,'dogs',link.dogId);
  const member=await getDoc(ref);
  if(member.exists())await updateDoc(ref,{accountName:user.displayName||'',accountEmail:user.email});
 }
}
async function removeProfileAccess(uid,name){
 if(!isAdult()||uid===profileOwner()||uid===user.uid)return;
 if(!confirm('Remove '+name+' from '+dog().name+'? They will lose access to this profile.'))return;
 try{
  await deleteDoc(doc(db,'users',profileOwner(),'members',uid,'dogs',dog().id));
  await refresh();status('Access removed. This account can no longer open the private profile.');
 }catch(e){status('Could not remove access: '+error(e),true)}
}
async function refreshAccessList(requests){
 const area=$('shareAccessList');if(!area)return;
 area.replaceChildren();
 const addRow=(uid,name,email,role,original=false)=>{
  const row=document.createElement('div');row.className='share-access-row';
  const identity=document.createElement('div');identity.className='share-account-identity';
  const label=document.createElement('strong');label.textContent=name||'Name unavailable';
  const address=document.createElement('small');address.textContent=email||'Email unavailable · account must sign in again';
  identity.append(label,address);
  if(!email&&!original){const reference=document.createElement('small');reference.textContent='Account ID: '+uid;identity.append(reference);}
  const actions=document.createElement('div');actions.className='share-access-actions';
  const level=document.createElement('span');level.textContent=role;actions.append(level);
  if(!original&&uid!==user.uid){
   const remove=document.createElement('button');remove.type='button';remove.textContent='Remove access';
   remove.onclick=()=>removeProfileAccess(uid,email||name||'this unnamed account');actions.append(remove);
  }
  row.append(identity,actions);area.append(row);
 };
 try{
  let original={accountName:dog()?.owner||'Profile owner',accountEmail:''};
  if(profileOwner()===user.uid)original={accountName:user.displayName||'Profile owner',accountEmail:user.email||''};
  else{const record=await getDoc(doc(db,'users',profileOwner(),'dogAccounts',dog().id));if(record.exists())original=record.data();}
  addRow(profileOwner(),original.accountName,original.accountEmail,'Adult Owner · Original owner',true);
  const invitations=await getDocs(query(collection(db,'invites'),where('ownerUid','==',profileOwner()),where('dogId','==',dog().id)));
  const candidates=new Map();
  for(const request of requests){const value=request.data();candidates.set(value.requesterUid,{name:value.requesterName||'',email:value.requesterEmail||''});}
  for(const record of invitations.docs){const value=record.data();if(value.usedBy&&!candidates.has(value.usedBy))candidates.set(value.usedBy,{name:'',email:''});}
  for(const [uid,identity] of candidates){
   if(uid===profileOwner())continue;
   const member=await getDoc(doc(db,'users',profileOwner(),'members',uid,'dogs',dog().id));
   if(!member.exists())continue;
   const value=member.data(),self=uid===user.uid;
   const name=value.accountName||identity.name||(self?user.displayName:'')||'';
   const email=value.accountEmail||identity.email||(self?user.email:'')||'';
   addRow(uid,name,email,value.role==='adult'?'Adult Owner':value.role==='child'?'Child Owner':'Friend · View only');
  }
 }catch(e){
  const message=document.createElement('p');message.textContent='Unable to load all connected accounts: '+error(e);area.append(message);
 }
}
async function decideComment(record,approve){
 const comment=record.data();
 if(!isAdult()||!confirm((approve?'Approve':'Decline')+' this comment from '+(comment.authorName||'Daily Tales member')+'?'))return;
 try{
  await updateDoc(record.ref,{status:approve?'approved':'declined',reviewedBy:user.uid,reviewedAt:serverTimestamp()});
  await refresh();status(approve?'Comment approved and published.':'Comment declined.');
 }catch(e){status('Could not review comment: '+error(e),true)}
}
async function refreshEventDetails(){
 const root=$('shareEventDetails'),selected=dog(),ownerUid=profileOwner();
 if(!root||!selected||!isAdult())return;
 root.textContent='Checking event requests…';
 try{
  const records=await getDocs(query(collection(db,'users',ownerUid,'eventDetailRequests',selected.id,'requests'),where('status','==','pending')));
  if(dog()?.id!==selected.id)return;
  root.replaceChildren();
  if(records.empty){root.textContent='No pending event detail requests.';return;}
  for(const record of records.docs){
   const request=record.data(),item=document.createElement('div');
   item.className='share-request';
   item.innerHTML='<strong>'+safe(request.requesterName)+' requested details</strong><p>'+safe(request.eventTitle)+'</p>'+
    '<label>Private reply<textarea maxlength="1200" placeholder="Enter only the details you want this account to see"></textarea></label>'+
    '<button type="button">Share details</button> <button type="button">Decline</button><p role="status"></p>';
   const [share,decline]=item.querySelectorAll('button'),message=item.querySelector('[role=status]');
   async function decideEvent(approved){
    if(!isAdult()||dog()?.id!==selected.id)return;
    const response=item.querySelector('textarea').value.trim();
    if(approved&&!response){message.textContent='Enter the details you want to share.';return;}
    share.disabled=decline.disabled=true;
    try{
     await updateDoc(record.ref,{status:approved?'shared':'declined',response:approved?response:'',reviewedAt:serverTimestamp(),reviewedBy:user.uid});
     await refreshEventDetails();
    }catch(error){message.textContent='Could not save your decision. '+(error.code||'');share.disabled=decline.disabled=false;}
   }
   share.onclick=()=>decideEvent(true);decline.onclick=()=>decideEvent(false);
   root.append(item);
  }
 }catch(error){if(dog()?.id===selected.id)root.textContent='Could not load event requests. Check that the latest Firestore rules are published.';}
}
async function refresh(){
 if(!user||!dog()||!isAdult())return status('Sign in and open the Adult Owner view.',true);
 void refreshEventDetails();
 try{
  const [joins,proposals,comments]=await Promise.all([
    getDocs(query(collection(db,'users',profileOwner(),'joinRequests'),where('dogId','==',dog().id))),
    getDocs(query(collection(db,'users',profileOwner(),'proposedChanges'),where('dogId','==',dog().id))),
    getDocs(query(collection(db,'users',profileOwner(),'commentRequests'),where('dogId','==',dog().id),where('status','==','pending')))
  ]);
  const rows=joins.docs.filter(r=>r.data().dogId===dog().id&&r.data().status==='pending');
  const edits=proposals.docs.filter(r=>r.data().dogId===dog().id&&r.data().status==='pending');
  await refreshAccessList(joins.docs);
  const root=$('shareRequests');root.replaceChildren();
  const message=$('shareShade')?.querySelector('#shareStatus');
  if(message?.textContent.startsWith('Checking'))status('');
  if(!rows.length&&!edits.length&&!comments.docs.length){root.textContent='No pending requests, updates, or comments.';return}
  for(const record of comments.docs){
   const value=record.data(),item=document.createElement('div');item.className='share-request';
   item.innerHTML='<strong>Comment from '+safe(value.authorName||'Daily Tales member')+'</strong><p>On '+safe(value.postTitle||'a memory')+'</p><blockquote>'+safe(value.text)+'</blockquote><button>Approve</button> <button>Decline</button>';
   const buttons=item.querySelectorAll('button');buttons[0].onclick=()=>decideComment(record,true);buttons[1].onclick=()=>decideComment(record,false);root.append(item);
  }
  for(const r of rows){
   const v=r.data(),item=document.createElement('div');item.className='share-request';
   item.innerHTML='<strong>'+safe(v.requesterName||'Name unavailable')+'</strong><br><small>'+safe(v.requesterEmail||'Email unavailable')+'</small> · '+safe(v.role)+' access <button>Approve</button> <button>Decline</button>';
   const bs=item.querySelectorAll('button');bs[0].onclick=()=>decide(r,true);bs[1].onclick=()=>decide(r,false);root.append(item);
  }
  for(const r of edits){
   const v=r.data(),item=document.createElement('div');item.className='share-request';
   item.innerHTML='<strong>Child Owner '+safe(v.kind)+' change</strong><p>Review this proposed update before publishing it.</p><button>Approve</button> <button>Decline</button>';
   const bs=item.querySelectorAll('button');bs[0].onclick=()=>decideChildProposal(r,true);bs[1].onclick=()=>decideChildProposal(r,false);root.append(item);
  }
 }catch(e){
  const root=$('shareRequests');
  if(root)root.textContent='Unable to load approval requests. Please try Refresh requests.';
  status('Unable to load approval requests: '+error(e),true);
 }
}
function openShare(){
 $('shareShade').hidden=false;
 $('shareOwner').hidden=!!inviteId;$('shareInvite').hidden=!inviteId;
 $('shareTitle').textContent=inviteId?'Join a Dog Profile':'Share a Dog Profile';
 if(inviteId){if(!user){window.DailyTalesOpenAccount?.();$('shareShade').hidden=true;return}loadInvitation()}
 else {
  status(!user?'Sign into your Daily Tales account first.':!isAdult()?'Open your Adult Owner profile first.':'Checking for pending invitations and child approvals…');
  if(user&&isAdult()){
   $('shareRequests').textContent='Checking for pending requests…';
   refresh();
   window.DailyTalesRefreshPublic?.(dog().id).catch(e=>status('Could not update shared profile: '+error(e),true));
  }
 }
}
window.DailyTalesOpenShare=()=>openShare();
window.DailyTalesRefreshPublic=async dogId=>{
 if(!user||window.dtRole!=='adult')return;
 let d;
 try{const info=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');d=info.dogs?.find(x=>x.id===dogId)}catch{}
 if(!d)return;
 const link=await getDoc(doc(db,'users',profileOwner(),'publicShareLinks',d.id));
 if(!link.exists()||!link.data().shareId)return;
 const shared=await publish(d);
 const source=await getDoc(doc(db,'users',profileOwner(),'sharedProfiles',d.id));
 if(!source.exists())return;
 const p=source.data(),ref=doc(db,'publicProfiles',link.data().shareId);
 const existing=await getDoc(ref);
 if(!existing.exists()||existing.data().active!==true)return;
 const latest=dog()?.id===dogId?dog():shared;
 await updateDoc(ref,{...sharedSectionFields(latest,existing.data()),name:p.name||shared.name,breed:p.breed||'',dob:p.dob||'',
   personality:p.personality||'',favorites:p.favorites||'',cuteFact:p.cuteFact||'',
   photo:p.photo||'',posts:p.posts||[],postIds:(p.posts||[]).map(post=>post.id).filter(Boolean),updatedAt:serverTimestamp()});
};
function init(){
 const btn=document.createElement('button');btn.id='shareLaunch';btn.textContent='🐾 Share';document.body.append(btn);
 const shade=document.createElement('div');shade.id='shareShade';shade.hidden=true;
 shade.innerHTML='<section class="share-box" role="dialog" aria-modal="true"><button type="button" id="shareClose">×</button><h2 id="shareTitle">Share a Dog Profile</h2><div id="shareOwner"><p>Friends open a read-only link without signing in. Adults and children sign in, then request access. A connected Adult Owner must approve.</p><label>Access level<select id="shareRole"><option value="friend">Friend · View only, no login</option><option value="child">Child · Limited access</option><option value="adult">Adult Owner · Editing</option></select></label><button id="shareCreate">Create invitation link</button><div class="share-row"><input id="shareLink" readonly aria-label="Invitation link"><button id="shareCopy" hidden>Copy link</button></div><button id="shareRevoke" hidden type="button">Turn off Friend link</button><h3>Current access</h3><div id="shareAccessList" aria-live="polite">Loading connected accounts…</div><h3>Requests, updates, and comments</h3><button id="shareRefresh">Refresh requests</button><h3>Event detail requests</h3><div id="shareEventDetails" aria-live="polite"></div><div id="shareRequests"></div></div><div id="shareInvite" hidden></div><p id="shareStatus" role="status"></p></section>';
 document.body.append(shade);
 btn.onclick=openShare;$('shareClose').onclick=()=>shade.hidden=true;shade.onclick=e=>{if(e.target===shade)shade.hidden=true};
 $('shareCreate').onclick=createInvitation;$('shareRefresh').onclick=refresh;$('shareRevoke').onclick=revokeFriendLink;
 $('shareCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('shareLink').value);status('Link copied.')}catch{status('Select and copy the link manually.')}};
 if(inviteId&&user)openShare();
}
const style=document.createElement('style');style.textContent=[
'#shareLaunch{position:fixed;right:12px;bottom:64px;z-index:18000;padding:10px 14px;border-radius:999px;background:#845936;color:white;border:2px solid #d7e8ef;font:700 13px Arial;cursor:pointer}',
'#shareShade[hidden],#shareOwner[hidden],#shareInvite[hidden]{display:none!important}',
'#shareShade{position:fixed;inset:0;z-index:32001;display:flex;align-items:center;justify-content:center;padding:15px;background:#152537bb;box-sizing:border-box}',
'.share-box{max-height:90vh;overflow:auto;width:min(95vw,480px);padding:22px;box-sizing:border-box;border:3px solid #adc5d3;border-radius:19px;background:#fff9ee;color:#283d4c;font:14px/1.5 Arial}',
'.share-box h2{font:700 26px Georgia,serif;margin:0 30px 12px 0}.share-box h3{font:700 19px Georgia,serif;margin:16px 0 5px}',
'#shareShade #shareStatus{position:sticky;bottom:0;background:#fff9ee;padding:10px 0;margin-top:12px;z-index:2}#shareClose{float:right;border:0;background:transparent;font-size:30px;cursor:pointer}',
'.share-box button:not(#shareClose){border:1px solid #819caa;background:#d5e7f1;color:#2b4555;border-radius:9px;padding:9px 11px;margin:5px 2px;cursor:pointer;font-weight:700}',
'.share-box input,.share-box select{padding:9px;border:1px solid #9cb6c6;border-radius:8px;max-width:100%;box-sizing:border-box}',
'.share-box label{display:block}.share-box select{display:block;width:100%}.share-row{display:flex;gap:5px;margin:8px 0}.share-row input{min-width:0;flex:1}',
'.share-access-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #c7d4d9;overflow-wrap:anywhere}.share-access-row span{flex-shrink:0;font-size:12px;color:#526b7b}.share-access-row strong{min-width:0}.share-account-identity{min-width:0;flex:1}.share-account-identity strong,.share-account-identity small{display:block;overflow-wrap:anywhere}.share-access-actions{display:flex;align-items:flex-end;flex-direction:column;gap:5px}.share-access-actions button{font-size:12px!important;padding:6px 8px!important}',
'.share-request{border-bottom:1px solid #bacbd5;padding:7px 0}.share-box small{color:#586d79}#shareStatus{font-weight:700;overflow-wrap:anywhere}',
'.share-dog{padding:12px;border:1px solid #c7d4d9;border-radius:10px;margin-top:12px}.share-dog img{width:110px;height:110px;border-radius:50%;object-fit:cover}',
'@media(max-width:480px){#shareLaunch{right:9px;bottom:58px}}'
].join('\n');document.head.append(style);
onAuthStateChanged(auth,u=>{if(stopJoinRequest){stopJoinRequest();stopJoinRequest=null}user=u;if(u)void syncAccountLabels().catch(e=>console.warn('Account label update',e));if(inviteId&&u&&$('shareShade'))openShare()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

setInterval(()=>{if(user&&isAdult()&&$('shareShade')&&!$('shareShade').hidden&&!inviteId)void refresh()},10000);
