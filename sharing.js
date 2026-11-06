import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const config={apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',storageBucket:'daily-tail.firebasestorage.app',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'};
const app=getApps().find(a=>a.name==='daily-tail-cloud')||initializeApp(config,'daily-tail-cloud'),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inviteId=new URLSearchParams(location.search).get('dtInvite');
let user=null,invite=null;
const status=(s,bad=false)=>{const x=$('shareStatus');if(x){x.textContent=s;x.style.color=bad?'#a33':'#36586b'}};
const error=e=>String(e?.message||e).slice(0,290);
const dog=()=>{try{const a=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return a.dogs?.find(d=>d.id===a.activeId)}catch{return null}};
const isAdult=()=>window.dtRole==='adult';
async function signIn(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){status(error(e),true)}}
async function loadInvitation(){
 if(!inviteId)return;
 if(!user){$('shareInvite').innerHTML='<p>Sign in to request access.</p><button id="shareSignIn">Sign in with Google</button>';$('shareSignIn').onclick=signIn;return}
 try{
  const r=await getDoc(doc(db,'invites',inviteId));if(!r.exists()||!r.data().active)throw Error('This invitation is unavailable.');
  invite=r.data();
  $('shareInvite').innerHTML='<h3>'+safe(invite.name)+'</h3><p>Access: '+safe(invite.role)+'</p><button id="shareRequest">Request access</button> <button id="shareCheck">Check access</button><div id="shareDog"></div>';
  $('shareRequest').onclick=requestAccess;$('shareCheck').onclick=checkAccess;
  await checkAccess(false);
 }catch(e){status(error(e),true)}
}
async function requestAccess(){
 try{
  const id=user.uid+'_'+inviteId,r=doc(db,'users',invite.ownerUid,'joinRequests',id);
  const existing=await getDoc(r);
  if(existing.exists())return status('Request already sent. Ask the owner to approve it.');
  await setDoc(r,{ownerUid:invite.ownerUid,dogId:invite.dogId,requesterUid:user.uid,requesterName:user.displayName||user.email||'Guest',inviteId,role:invite.role,status:'pending',createdAt:serverTimestamp()});
  status('Request sent. Ask the owner to open Share → Refresh requests.');
 }catch(e){status(error(e),true)}
}
async function checkAccess(notice=true){
 if(!user||!invite)return;
 try{
  const m=await getDoc(doc(db,'users',invite.ownerUid,'members',user.uid,'dogs',invite.dogId));
  if(!m.exists()){if(notice)status('Awaiting owner approval.');return}
  const d=await getDoc(doc(db,'users',invite.ownerUid,'sharedProfiles',invite.dogId));
  if(!d.exists())return status('Approved. The owner needs to publish the shared profile.');
  const p=d.data();
  $('shareDog').innerHTML='<article class="share-dog"><h3>'+safe(p.name)+'</h3>'+(p.photo?'<img alt="Dog photo" src="'+safe(p.photo)+'">':'')+'<p><strong>Breed:</strong> '+safe(p.breed||'Not shared')+'</p><p><strong>Birthday:</strong> '+safe(p.dob||'Not shared')+'</p><p>'+safe(p.personality||'')+'</p><p>'+safe(p.cuteFact||'')+'</p></article>';
  status('Approved: '+m.data().role+' access.');
 }catch(e){status(error(e),true)}
}
async function publish(d){
 if(!user||!d||!isAdult())throw Error('Sign in and open the Adult Owner view.');
 if(typeof window.dtSnapshotActive==='function')window.dtSnapshotActive();
 d=dog()||d;const m=d.meta||{},p=d.profile||{};
 const pref=(()=>{try{return JSON.parse(localStorage.getItem('daily_tail_public_preferences_v1')||'{}')}catch{return {}}})();
 const payload={name:String(d.name||'Dog'),breed:String(m.breed||''),dob:String(m.dob||''),personality:String(m.personality||''),favorites:String(m.favorites||''),cuteFact:String(m.cuteFact||''),photo:p.profile?.length<400000?p.profile||'':'',posts:pref.memories?(p.posts||[]).slice(0,3).map(x=>({title:String(x.title||'').slice(0,120),text:String(x.text||x.caption||'').slice(0,700)})):[],updatedAt:serverTimestamp()};
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
   await setDoc(r,{ownerUid:user.uid,dogId:current.id,name:current.name,role,active:true,createdAt:serverTimestamp()});
   $('shareLink').value=location.origin+location.pathname+'?dtInvite='+encodeURIComponent(r.id);
   $('shareCopy').hidden=false;$('shareRevoke').hidden=true;
   status('Invitation ready. The person signs in and requests your approval.');
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
async function refresh(){
 if(!user||!dog()||!isAdult())return status('Sign in and open the Adult Owner view.',true);
 try{
  const q=await getDocs(collection(db,'users',user.uid,'joinRequests')),rows=q.docs.filter(r=>r.data().dogId===dog().id&&r.data().status==='pending');
  $('shareRequests').innerHTML='';
  if(!rows.length){$('shareRequests').textContent='No pending requests.';return}
  for(const r of rows){
   const v=r.data(),item=document.createElement('div');item.className='share-request';
   item.innerHTML='<strong>'+safe(v.requesterName)+'</strong> · '+safe(v.role)+' <button>Approve</button> <button>Decline</button>';
   const bs=item.querySelectorAll('button');bs[0].onclick=()=>decide(r,true);bs[1].onclick=()=>decide(r,false);$('shareRequests').append(item);
  }
 }catch(e){status(error(e),true)}
}
function openShare(){
 $('shareShade').hidden=false;
 $('shareOwner').hidden=!!inviteId;$('shareInvite').hidden=!inviteId;
 $('shareTitle').textContent=inviteId?'Join a Dog Profile':'Share a Dog Profile';
 if(inviteId)loadInvitation();
 else status(!user?'Sign into your Daily Tales account first.':!isAdult()?'Open your Adult Owner profile first.':'Friends do not need an account. Adult and Child invitations require approval.');
}
window.DailyTalesOpenShare=()=>openShare();
window.DailyTalesRefreshPublic=async dogId=>{
 if(!user||window.dtRole!=='adult')return;
 const d=dog();if(!d||d.id!==dogId)return;
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
 shade.innerHTML='<section class="share-box" role="dialog" aria-modal="true"><button type="button" id="shareClose">×</button><h2 id="shareTitle">Share a Dog Profile</h2><div id="shareOwner"><p>Friends open a read-only link without signing in. Adults and children sign in and request approval.</p><label>Access level<select id="shareRole"><option value="friend">Friend · View only, no login</option><option value="child">Child · Approval required</option><option value="adult">Adult Owner · Editing</option></select></label><button id="shareCreate">Create invitation link</button><div class="share-row"><input id="shareLink" readonly aria-label="Invitation link"><button id="shareCopy" hidden>Copy link</button></div><button id="shareRevoke" hidden type="button">Turn off Friend link</button><h3>Approval requests</h3><button id="shareRefresh">Refresh requests</button><div id="shareRequests"></div></div><div id="shareInvite" hidden></div><p id="shareStatus" role="status"></p><small>Friend links share only the published profile. Anyone who has the link can view it. Adult and Child accounts still require approval; collaborative editing is being developed.</small></section>';
 document.body.append(shade);
 btn.onclick=openShare;$('shareClose').onclick=()=>shade.hidden=true;shade.onclick=e=>{if(e.target===shade)shade.hidden=true};
 $('shareCreate').onclick=createInvitation;$('shareRefresh').onclick=refresh;$('shareRevoke').onclick=revokeFriendLink;
 $('shareCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('shareLink').value);status('Link copied.')}catch{status('Select and copy the link manually.')}};
 if(inviteId)openShare();
}
const style=document.createElement('style');style.textContent=[
'#shareLaunch{position:fixed;right:12px;bottom:64px;z-index:18000;padding:10px 14px;border-radius:999px;background:#845936;color:white;border:2px solid #d7e8ef;font:700 13px Arial;cursor:pointer}',
'#shareShade[hidden],#shareOwner[hidden],#shareInvite[hidden]{display:none!important}',
'#shareShade{position:fixed;inset:0;z-index:22001;display:flex;align-items:center;justify-content:center;padding:15px;background:#152537bb;box-sizing:border-box}',
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
onAuthStateChanged(auth,u=>{user=u;if(inviteId&&$('shareShade')&&!$('shareShade').hidden)loadInvitation()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
