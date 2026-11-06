import {publicMemoryPosts} from './public-memory-posts.js';
import {dailyTalesCloudDogStore as dogStore} from './cloud-dog-store.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,writeBatch,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
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
 location.replace(target.href);
}
async function resumeMembership(i){
 if(i.ownerUid===user.uid){openJoinedDog();return true;}
 const member=await getDoc(doc(db,'users',i.ownerUid,'members',user.uid,'dogs',i.dogId));
 if(!member.exists()||!['adult','child'].includes(member.data().role))return false;
 await setDoc(doc(db,'users',user.uid,'joinedDogs',i.ownerUid+'_'+i.dogId),{ownerUid:i.ownerUid,dogId:i.dogId,role:member.data().role,name:i.name||'Dog',joinedAt:serverTimestamp()});
 openJoinedDog();return true;
}
const status=(s,bad=false)=>{const x=$('shareStatus');if(x){x.textContent=s;x.style.color=bad?'#a33':'#36586b'}};
const error=e=>String(e?.message||e).slice(0,290);
const dog=()=>{try{const a=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return a.dogs?.find(d=>d.id===a.activeId)}catch{return null}};
const isAdult=()=>window.dtRole==='adult'&&(!dog()?.ownerUid||dog().ownerUid===user?.uid);
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
  $('shareInvite').innerHTML='<h3>Join '+safe(invite.name||'this dog')+'!</h3><p>You have been invited as a <strong>'+safe(invite.role)+'</strong>.</p>'
   +(usable?'<button id="shareAccept">Accept invitation</button>':'<p>This invitation was already used, revoked, or expired. Ask the owner for a new link.</p>')
   +'<div id="shareDog"></div>';
  if(usable)$('shareAccept').onclick=acceptInvitation;

 }catch(e){status(error(e),true)}
}
async function acceptInvitation(){
 if(!user||!invite)return status('Sign in first.',true);
 const btn=$('shareAccept');if(btn){btn.disabled=true;btn.textContent='Connecting…'}
 try{
  const inviteRef=doc(db,'invites',inviteId);
  const snap=await getDoc(inviteRef);
  if(!snap.exists())throw Error('Invitation not found.');
  const i=snap.data();
  if(await resumeMembership(i))return;
  if(i.active!==true||i.usedBy||!i.expiresAt||i.expiresAt.toMillis()<=Date.now())throw Error('This link is no longer valid. Ask for another invitation.');
  if(!['adult','child'].includes(i.role))throw Error('This invitation is not a family invitation.');
  if(i.ownerUid===user.uid)throw Error('You already own this profile. Open My Dogs.');
  const member=doc(db,'users',i.ownerUid,'members',user.uid,'dogs',i.dogId);
  const joined=doc(db,'users',user.uid,'joinedDogs',i.ownerUid+'_'+i.dogId);
  const batch=writeBatch(db);
  batch.update(inviteRef,{active:false,usedBy:user.uid,acceptedAt:serverTimestamp()});
  batch.set(member,{role:i.role,inviteId,addedAt:serverTimestamp()});
  batch.set(joined,{ownerUid:i.ownerUid,dogId:i.dogId,role:i.role,name:i.name,joinedAt:serverTimestamp()});
  await batch.commit();
  status('You are connected to '+i.name+'! Opening your profile…');
  openJoinedDog();
 }catch(e){status('Could not accept invitation: '+error(e),true);if(btn){btn.disabled=false;btn.textContent='Accept invitation'}}
}
async function publish(d){
 if(!user||!d||!isAdult())throw Error('Sign in and open the Adult Owner view.');
 if(typeof window.dtSnapshotActive==='function')window.dtSnapshotActive();
 const refreshed=dog();if(refreshed?.id===d.id)d=refreshed;
 const m=d.meta||{},p=d.profile||{};
 const pref=(()=>{try{return JSON.parse(localStorage.getItem('daily_tail_public_preferences_v1')||'{}')}catch{return {}}})();
 const payload={name:String(d.name||'Dog'),breed:String(m.breed||''),dob:String(m.dob||''),personality:String(m.personality||''),favorites:String(m.favorites||''),cuteFact:String(m.cuteFact||''),photo:p.profile?.length<400000?p.profile||'':'',posts:pref.memories?await publicMemoryPosts(p.posts):[],updatedAt:serverTimestamp()};
 if(JSON.stringify({...payload,updatedAt:null}).length>850000)throw Error('Shared profile is too large for Firestore. Reduce photo size.');
 await setDoc(doc(db,'users',user.uid,'sharedProfiles',d.id),payload);
 return d;
}
async function createInvitation(){
 const d=dog();if(!d)return status('Open the dog’s profile first.',true);
 if(!user||!isAdult())return status('Sign in to Cloud Sync and open Adult Owner view first.',true);
 try{
  const current=await publish(d),role=$('shareRole').value;
  if(role==='friend'){
   const linkRef=doc(db,'users',user.uid,'publicShareLinks',current.id);
   const existing=await getDoc(linkRef);
   const shareId=existing.exists()&&typeof existing.data().shareId==='string'?existing.data().shareId:doc(collection(db,'publicProfiles')).id;
   const shared=await getDoc(doc(db,'users',user.uid,'sharedProfiles',current.id));
   if(!shared.exists())throw Error('Could not prepare the shared profile.');
   const p=shared.data();
   await setDoc(doc(db,'publicProfiles',shareId),{
    ownerUid:user.uid,dogId:current.id,active:true,name:p.name||current.name,
    breed:p.breed||'',dob:p.dob||'',personality:p.personality||'',
    favorites:p.favorites||'',cuteFact:p.cuteFact||'',photo:p.photo||'',
    posts:Array.isArray(p.posts)?p.posts:[],updatedAt:serverTimestamp()
   });
   await setDoc(linkRef,{shareId,createdAt:serverTimestamp()});
   $('shareLink').value=location.origin+location.pathname.replace(/[^/]*$/,'')+'friend.html?share='+encodeURIComponent(shareId);
   $('shareCopy').hidden=false;
   $('shareRevoke').hidden=false;
   status('Friend link is ready! Anyone with this link can view the shared details without signing in.');
  }else{
   const r=doc(collection(db,'invites'));
   await setDoc(r,{ownerUid:user.uid,dogId:current.id,name:current.name,role,active:true,createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+7*24*60*60*1000)});
   $('shareLink').value=location.origin+location.pathname+'?dtInvite='+encodeURIComponent(r.id);
   $('shareCopy').hidden=false;$('shareRevoke').hidden=true;
   status('Invitation ready! The recipient signs in and taps Accept. This single-use link expires after 7 days.');
  }
 }catch(e){status(error(e),true)}
}
async function revokeFriendLink(){
 if(!user||!isAdult()||!dog())return status('Open your Adult Owner profile first.',true);
 if(!confirm('Turn off this dog’s Friend View link? People with the link will no longer be able to open it.'))return;
 try{
  const r=await getDoc(doc(db,'users',user.uid,'publicShareLinks',dog().id));
  if(!r.exists())return status('No Friend View link is registered for this dog.');
  await updateDoc(doc(db,'publicProfiles',r.data().shareId),{active:false,updatedAt:serverTimestamp()});
  $('shareLink').value='';$('shareCopy').hidden=true;$('shareRevoke').hidden=true;
  status('Friend View link disabled. You can enable it again by creating a new Friend link.');
 }catch(e){status(error(e),true)}
}
async function decide(r,approve){
 const v=r.data();if(!confirm((approve?'Approve ':'Decline ')+v.requesterName+' for '+v.role+' access?'))return;
 try{
  if(approve)await setDoc(doc(db,'users',user.uid,'members',v.requesterUid,'dogs',v.dogId),{role:v.role,addedAt:serverTimestamp()});
  await updateDoc(r.ref,{status:approve?'approved':'declined'});
  await refresh();status(approve?'Approved. The guest can tap Check access using their invitation link.':'Declined.');
 }catch(e){status(error(e),true)}
}
async function decideChildProposal(record,approve){
 const proposal=record.data();
 const message=(approve?'Approve':'Decline')+' this '+proposal.kind+' change from a Child Owner?';
 if(!confirm(message))return;
 try{
   if(approve){
     const current=await dogStore.readDog(proposal.dogId,user.uid);
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
     await dogStore.saveDog(current,current.revision);
   }
   await updateDoc(record.ref,{status:approve?'approved':'declined',reviewedAt:serverTimestamp()});
   status(approve?'Child update approved and saved online.':'Child change declined.');
   await refresh();
 }catch(e){status('Could not review child change: '+error(e),true)}
}
async function refresh(){
 if(!user||!dog()||!isAdult())return status('Sign in and open the Adult Owner view.',true);
 try{
  const [joins,proposals]=await Promise.all([
    getDocs(collection(db,'users',user.uid,'joinRequests')),
    getDocs(collection(db,'users',user.uid,'proposedChanges'))
  ]);
  const rows=joins.docs.filter(r=>r.data().dogId===dog().id&&r.data().status==='pending');
  const edits=proposals.docs.filter(r=>r.data().dogId===dog().id&&r.data().status==='pending');
  const root=$('shareRequests');root.replaceChildren();
  if(!rows.length&&!edits.length){root.textContent='No pending requests or child changes.';return}
  for(const r of rows){
   const v=r.data(),item=document.createElement('div');item.className='share-request';
   item.innerHTML='<strong>'+safe(v.requesterName)+'</strong> · '+safe(v.role)+' access <button>Approve</button> <button>Decline</button>';
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
 const link=await getDoc(doc(db,'users',user.uid,'publicShareLinks',d.id));
 if(!link.exists()||!link.data().shareId)return;
 const shared=await publish(d);
 const source=await getDoc(doc(db,'users',user.uid,'sharedProfiles',d.id));
 if(!source.exists())return;
 const p=source.data(),ref=doc(db,'publicProfiles',link.data().shareId);
 const existing=await getDoc(ref);
 if(!existing.exists()||existing.data().active!==true)return;
 await updateDoc(ref,{name:p.name||shared.name,breed:p.breed||'',dob:p.dob||'',
   personality:p.personality||'',favorites:p.favorites||'',cuteFact:p.cuteFact||'',
   photo:p.photo||'',posts:p.posts||[],updatedAt:serverTimestamp()});
};
function init(){
 const btn=document.createElement('button');btn.id='shareLaunch';btn.textContent='🐾 Share';document.body.append(btn);
 const shade=document.createElement('div');shade.id='shareShade';shade.hidden=true;
 shade.innerHTML='<section class="share-box" role="dialog" aria-modal="true"><button type="button" id="shareClose">×</button><h2 id="shareTitle">Share a Dog Profile</h2><div id="shareOwner"><p>Friends open a read-only link without signing in. Adults and children accept a secure invitation link after signing in.</p><label>Access level<select id="shareRole"><option value="friend">Friend · View only, no login</option><option value="child">Child · Limited access</option><option value="adult">Adult Owner · Editing</option></select></label><button id="shareCreate">Create invitation link</button><div class="share-row"><input id="shareLink" readonly aria-label="Invitation link"><button id="shareCopy" hidden>Copy link</button></div><button id="shareRevoke" hidden type="button">Turn off Friend link</button><h3>Child updates awaiting approval</h3><button id="shareRefresh">Refresh requests</button><div id="shareRequests"></div></div><div id="shareInvite" hidden></div><p id="shareStatus" role="status"></p><small>Friend links share only the published profile. Anyone who has the link can view it. Family invitations connect directly after sign-in. Child posts and photos still require approval.</small></section>';
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
'#shareClose{float:right;border:0;background:transparent;font-size:30px;cursor:pointer}',
'.share-box button:not(#shareClose){border:1px solid #819caa;background:#d5e7f1;color:#2b4555;border-radius:9px;padding:9px 11px;margin:5px 2px;cursor:pointer;font-weight:700}',
'.share-box input,.share-box select{padding:9px;border:1px solid #9cb6c6;border-radius:8px;max-width:100%;box-sizing:border-box}',
'.share-box label{display:block}.share-box select{display:block;width:100%}.share-row{display:flex;gap:5px;margin:8px 0}.share-row input{min-width:0;flex:1}',
'.share-request{border-bottom:1px solid #bacbd5;padding:7px 0}.share-box small{color:#586d79}#shareStatus{font-weight:700;overflow-wrap:anywhere}',
'.share-dog{padding:12px;border:1px solid #c7d4d9;border-radius:10px;margin-top:12px}.share-dog img{width:110px;height:110px;border-radius:50%;object-fit:cover}',
'@media(max-width:480px){#shareLaunch{right:9px;bottom:58px}}'
].join('\n');document.head.append(style);
onAuthStateChanged(auth,u=>{user=u;if(inviteId&&u&&$('shareShade'))openShare()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
