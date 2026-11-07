import {registerMessaging,approvedConnections,messageInbox} from './friend-messages.js?v=20261107';
import {publicMemoryPosts} from './public-memory-posts.js?v=memory-bylines-20261107';
/* Daily Tail opt-in Find Friends directory. No private local profile data is published. */
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,deleteDoc,query,where,limit,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const cfg={apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'};
const app=getApps().find(a=>a.name==='daily-tail-cloud')||initializeApp(cfg,'daily-tail-cloud'),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=null,results=[],myRequests=[],inbox=[],loading=false,displayed=false;
const dog=()=>{try{const a=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}');return a.dogs?.find(d=>d.id===a.activeId)}catch{return null}};
const owner=()=>window.dtRole==='adult'&&!!dog()&&(!dog().ownerUid||dog().ownerUid===current?.uid);
const listingId=d=>current.uid+'_'+d.id;
const low=v=>String(v||'').trim().toLowerCase();
const status=(t,bad=false)=>{if(!$('findStatus'))return;$('findStatus').textContent=t;$('findStatus').style.color=bad?'#a2352c':'#36596c'};
const err=e=>(e?.code==='permission-denied'?'Friend discovery is unavailable. Please try again later.':String(e?.message||e)).slice(0,280);
const friendUrl=shareId=>location.origin+location.pathname.replace(/[^/]*$/,'')+'friend.html?share='+encodeURIComponent(shareId);
function renderCards(){
 const search=low($('findSearch')?.value),area=$('findResults');if(!area)return;
 const filtered=results.filter(x=>!search||x.dogNameLower?.includes(search)||x.usernameLower?.includes(search));
 area.innerHTML='';
 if(!filtered.length){area.textContent=search?'No discoverable dogs matched that search.':'No dogs have opted into discovery yet.';return}
 for(const item of filtered){
  const card=document.createElement('article');card.className='find-card';
  const name=document.createElement('h3');name.textContent=item.dogName||'Daily Tail dog';
  card.append(name);
  if(item.photo?.startsWith('data:image/')&&item.photo.length<150000){const image=document.createElement('img');image.src=item.photo;image.alt='Dog photo';image.loading='lazy';card.prepend(image)}
  const summary=document.createElement('p');summary.textContent=[item.breed||'',item.username?'@'+item.username:''].filter(Boolean).join(' · ');card.append(summary);
  const view=document.createElement('a');view.textContent='View profile';view.href=friendUrl(item.shareId);view.target='_blank';view.rel='noopener noreferrer';card.append(view);
  if(current&&item.ownerUid!==current.uid){
   const request=document.createElement('button');request.textContent='Add Friend';request.onclick=()=>sendRequest(item,request);
   const old=myRequests.find(r=>r.data().listingId===item.id&&r.data().status==='pending');
   if(old){request.disabled=true;request.textContent='Request pending'}
   card.append(request);
  }
  area.append(card);
 }
}
async function loadDirectory(){
 if(loading)return;loading=true;
 try{
  const list=await getDocs(query(collection(db,'directory'),where('discoverable','==',true),limit(100)));
  results=list.docs.map(x=>({id:x.id,...x.data()}));
  if(current){
   const reqs=await getDocs(query(collection(db,'friendRequests'),where('requesterUid','==',current.uid),limit(100)));
   myRequests=reqs.docs;
  }else myRequests=[];
  renderCards();
  status(results.length===100?'Showing the first 100 discoverable dogs. Search currently filters these results.':'Found '+results.length+' discoverable dog'+(results.length===1?'':'s')+'.');
 }catch(e){status(err(e),true)}finally{loading=false}
}
async function sendRequest(item,button){
 if(!current){status('Sign in to send a friend request.');return}
 if(!confirm('Send a friend request for '+item.dogName+'? The owner must approve it.'))return;
 button.disabled=true;
 try{
  const r=doc(collection(db,'friendRequests'));
  await setDoc(r,{requesterUid:current.uid,requesterName:current.displayName||'Daily Tail member',targetOwnerUid:item.ownerUid,dogId:item.dogId,listingId:item.id,status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  button.textContent='Request pending';status('Friend request sent. The owner can approve it in Find Friends → Requests.');
 }catch(e){button.disabled=false;status(err(e),true)}
}
async function makePublic(d){
 const publicSettings=doc(db,'users',current.uid,'publicShareLinks',d.id);
 const existing=await getDoc(publicSettings);
 const shareId=existing.exists()&&existing.data().shareId?existing.data().shareId:doc(collection(db,'publicProfiles')).id;
 const prefs=(()=>{try{return JSON.parse(localStorage.getItem('daily_tail_public_preferences_v1')||'{}')}catch{return {}}})();
 const meta=d.meta||{},p=d.profile||{};
 const sections=window.DailyTailsFriendSections?.build(d.extras)||{};
 const publicData={...(Object.keys(sections).length?{sharedSections:sections}:{}),ownerUid:current.uid,dogId:d.id,active:true,name:String(d.name||'Dog').slice(0,70),
 breed:String(meta.breed||''),dob:String(meta.dob||''),personality:String(meta.personality||''),
 favorites:String(meta.favorites||''),cuteFact:String(meta.cuteFact||''),
 photo:p.profile?.length<140000?p.profile||'':'',
 posts:prefs.memories?await publicMemoryPosts(p.posts):[],updatedAt:serverTimestamp()};
 publicData.postIds=publicData.posts.map(post=>post.id).filter(Boolean);
 if(JSON.stringify({...publicData,updatedAt:null}).length>800000)throw Error('Public profile is too large. Try a smaller photo.');
 await setDoc(doc(db,'publicProfiles',shareId),publicData);
 await setDoc(publicSettings,{shareId,createdAt:serverTimestamp()});
 return {shareId,p:publicData};
}
async function publishListing(){
 if(!current||!owner())return status('Sign in and open Adult Owner view to publish.',true);
 const d=dog(),username=$('findUsername').value.trim().replace(/^@/,'');
 if(username&&!/^[a-zA-Z0-9._-]{3,24}$/.test(username))return status('Public username must be 3–24 letters, numbers, dots, underscores or dashes, or leave it blank.',true);
 if(!confirm('Make '+d.name+' discoverable to anyone using Daily Tail? Only the public card and chosen Friend View details will be visible. Anyone with the Friend link can view those details.'))return;
 try{
  if(typeof window.dtSnapshotActive==='function')window.dtSnapshotActive();
  const fresh=dog()||d,publicCopy=await makePublic(fresh);
  const entry={ownerUid:current.uid,dogId:fresh.id,discoverable:true,dogName:String(fresh.name||'Dog').slice(0,70),
    dogNameLower:low(fresh.name),username,usernameLower:low(username),breed:String(fresh.meta?.breed||'').slice(0,80),
    photo:publicCopy.p.photo||'',shareId:publicCopy.shareId,updatedAt:serverTimestamp()};
  await setDoc(doc(db,'directory',listingId(fresh)),entry);
  $('findDiscover').checked=true;
  status(fresh.name+' is now discoverable. Only the public card and Friend View details are visible.');
  await loadDirectory();
 }catch(e){status(err(e),true)}
}
async function hideListing(){
 if(!current||!owner())return;
 const d=dog();if(!confirm('Remove '+d.name+' from Find Friends? Existing direct Friend View links remain accessible until turned off separately in Share.')){$('findDiscover').checked=true;return}
 try{await deleteDoc(doc(db,'directory',listingId(d)));$('findDiscover').checked=false;status(d.name+' is no longer listed in Find Friends.');await loadDirectory()}catch(e){status(err(e),true);$('findDiscover').checked=true}
}
async function refreshMine(){
 const panel=$('findOwnerSettings');if(!panel)return;
 panel.hidden=!owner()||!current;
 if(panel.hidden)return;
 try{
  const d=dog(),r=await getDoc(doc(db,'directory',listingId(d)));
  $('findDiscover').checked=r.exists()&&r.data().discoverable===true;
  $('findUsername').value=r.exists()?r.data().username||'':'';
  $('findActiveDog').textContent=d.name;
 }catch(e){status(err(e),true)}
}
async function loadInbox(){
 if(!current)return status('Sign in to review friend requests.',true);
 const area=$('findInbox');area.textContent='';
 try{
  const reqs=await getDocs(query(collection(db,'friendRequests'),where('targetOwnerUid','==',current.uid),limit(100)));
  inbox=reqs.docs.filter(r=>r.data().status==='pending');
  if(!inbox.length){area.textContent='No pending friend requests.';return}
  for(const r of inbox){
   const d=r.data(),row=document.createElement('div');row.className='find-request';
   row.append(document.createTextNode((d.requesterName||'Someone')+' wants to connect with your dog. '));
   const accept=document.createElement('button'),decline=document.createElement('button');accept.textContent='Approve';decline.textContent='Decline';
   accept.onclick=()=>decide(r,true);decline.onclick=()=>decide(r,false);row.append(accept,decline);area.append(row);
  }
 }catch(e){status(err(e),true)}
}
async function decide(r,yes){
 if(!confirm((yes?'Approve':'Decline')+' this friend request?'))return;
 try{await updateDoc(r.ref,{status:yes?'approved':'declined',updatedAt:serverTimestamp()});status(yes?'Friend request approved. The member can view the public profile.':'Friend request declined.');await loadInbox()}catch(e){status(err(e),true)}
}
async function loadConnections(){
 const panel=$('findConnections');if(!current){panel.textContent='Sign in to view friend requests.';return}
 try{
  const q=await getDocs(query(collection(db,'friendRequests'),where('requesterUid','==',current.uid),limit(100)));
  panel.textContent='';
  const rows=q.docs.filter(r=>r.data().status==='approved');
  if(!rows.length){panel.textContent='No approved connections yet.';return}
  for(const r of rows){
   const d=r.data(),card=document.createElement('div');card.className='find-request';
   const pub=await getDoc(doc(db,'directory',d.listingId));
   if(pub.exists()){const data=pub.data(),a=document.createElement('a');a.href=friendUrl(data.shareId);a.target='_blank';a.rel='noopener';a.textContent=data.dogName||'View dog';card.append(a)}
   else card.textContent='An approved friend is no longer listed in the directory.';
   panel.append(card);
  }
 }catch(e){status(err(e),true)}
}
function open(){
 displayed=true;$('findShade').hidden=false;
 $('findSignedIn').textContent=current?'Signed in as '+(current.displayName||current.email||'Daily Tail member'):'Browse dogs, or sign in to send a friend request.';
 $('findGoogle').hidden=!!current;$('findOwnerSettings').hidden=true;
 refreshMine();loadDirectory();if(current)loadInbox();loadConnections();
}
function initMessaging(){
 const section=document.querySelector('.dog-friends-section');
 if(!section)return;
 const button=document.createElement('button');
 button.type='button';
 button.className='dt-find-btn';
 button.textContent='Messages';
 const status=document.createElement('p');
 status.setAttribute('role','status');
 status.hidden=true;
 section.append(button,status);
 let registered='';
 function refresh(){
  const account=current,active=dog();
  const allowed=window.dtRole==='adult'&&account&&!account.isAnonymous&&active&&!document.body.classList.contains('friend-view');
  button.hidden=!allowed;
  if(!allowed){
   status.hidden=true;
   const dialog=document.getElementById('dtMessages');
   if(dialog?.open)dialog.close();
   return;
  }
  const key=[account.uid,active.ownerUid,active.id].join('/');
  if(key===registered)return;
  registered=key;
  registerMessaging(db,account,active).catch(()=>{if(registered===key)registered='';});
 }
 button.onclick=async()=>{
  const account=current,active=dog();
  if(window.dtRole!=='adult'||!account||account.isAnonymous||!active)return;
  button.disabled=true;
  status.hidden=false;
  status.textContent='Loading conversations…';
  try{
   await registerMessaging(db,account,active);
   const connections=await approvedConnections(db,account.uid);
   if(current?.uid===account.uid&&window.dtRole==='adult'&&!button.hidden)messageInbox(db,account,connections);
   status.hidden=true;
  }catch{status.textContent='Messages are unavailable right now. Try again in a moment.';}
  finally{button.disabled=false;}
 };
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('daily-tales-cloud-dogs-changed',refresh);
 onAuthStateChanged(auth,account=>{current=account;refresh();});
 refresh();
}
function initFriendsFeed(){
 const section=document.querySelector('.dog-friends-section');
 if(!section)return;
 const feed=document.createElement('details');
 feed.id='dtDogFriendsFeed';
 feed.innerHTML='<summary>Friends feed</summary><button class="dt-find-btn" type="button">Refresh feed</button><div aria-live="polite"></div>';
 section.append(feed);
 const panel=feed.querySelector('div');
 let generation=0;
 async function refresh(){
  const request=++generation, uid=current?.uid;
  panel.textContent=uid?'Loading shared posts…':'Sign in to see posts from approved connections.';
  if(!uid)return;
  try{
   const requests=await getDocs(query(collection(db,'friendRequests'),where('requesterUid','==',uid),limit(100)));
   const approved=requests.docs.map(row=>row.data()).filter(row=>row.status==='approved'&&row.listingId);
   const listings=[...new Set(approved.map(row=>row.listingId))];
   const results=await Promise.allSettled(listings.map(async id=>{
    const listing=await getDoc(doc(db,'directory',id));
    const share=listing.data();
    if(!share?.discoverable||!share.shareId)return null;
    const publicProfile=(await getDoc(doc(db,'publicProfiles',share.shareId))).data();
    if(!publicProfile?.active||publicProfile.ownerUid!==share.ownerUid||publicProfile.dogId!==share.dogId)return null;
    const posts=Array.isArray(publicProfile.posts)?publicProfile.posts.filter(post=>post&&typeof post==='object'):[];
    const post=[...posts].sort((a,b)=>postTime(b)-postTime(a))[0];
    return post?{post,name:publicProfile.name||share.dogName||'Dog friend',shareId:share.shareId}:null;
   }));
   if(request!==generation||current?.uid!==uid)return;
   const entries=results.filter(result=>result.status==='fulfilled'&&result.value).map(result=>result.value);
   const failed=results.some(result=>result.status==='rejected');
   entries.sort((a,b)=>postTime(b.post)-postTime(a.post));
   panel.replaceChildren();
   if(!entries.length||failed){
    const message=document.createElement('p');
    message.textContent=failed?'Some shared posts couldn’t be loaded. Try refreshing.':'No shared posts from approved connections yet.';
    panel.append(message);
   }
   for(const {post,name,shareId} of entries){
    const card=document.createElement('article');card.className='dt-friend-feed-post';
    const heading=document.createElement('strong');heading.textContent=name;
    const title=document.createElement('h3');title.textContent=post.title||'Shared memory';
    const summary=document.createElement('p');summary.textContent=String(post.story||post.text||'').slice(0,240);
    if(typeof post.photo==='string'&&/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(post.photo)){
     const photo=document.createElement('img');photo.src=post.photo;photo.alt='Shared memory photo';photo.loading='lazy';card.append(photo);
    }
    const link=document.createElement('a');link.href=friendUrl(shareId);link.textContent='View shared profile ›';
    card.append(heading,title);
    if(post.authorName){const byline=document.createElement('small');byline.className='dt-memory-byline';byline.textContent='By '+post.authorName;card.append(byline);}
    card.append(summary,link);panel.append(card);
   }
  }catch(error){
   if(request===generation&&current?.uid===uid)panel.textContent='Couldn’t load the friends feed. Try refreshing.';
  }
 }
 feed.ontoggle=()=>{if(feed.open)refresh();else{generation++;panel.replaceChildren();}};
 feed.querySelector('button').onclick=refresh;
 onAuthStateChanged(auth,()=>{if(feed.open)refresh();});
}
function postTime(post){return Date.parse(post.date)||0;}
function init(){
 initFriendsFeed();
 initMessaging();
 const button=$('dtFindDogFriends');
 if(button){
  button.textContent='🔎 Find Dog Friends';
  button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true);
 }
 const shade=document.createElement('div');shade.id='findShade';shade.hidden=true;
 shade.innerHTML='<section class="find-box" role="dialog" aria-modal="true" aria-labelledby="findTitle">'+
 '<button id="findClose" type="button" aria-label="Close">×</button><h2 id="findTitle">Find Dog Friends</h2>'+
 '<p>Explore dogs whose owners have chosen to appear in search.</p><p id="findSignedIn"></p><button id="findGoogle" type="button">Sign in with Google</button>'+
 '<label for="findSearch">Search dog name or public username</label><input id="findSearch" type="search" autocomplete="off" placeholder="Search discoverable dogs">'+
 '<button id="findRefresh" type="button">Refresh dogs</button><div id="findResults" class="find-results"></div>'+
 '<details class="find-settings"><summary>Make my dog discoverable</summary><div id="findOwnerSettings" hidden>'+
 '<p id="findActiveDog"></p><label for="findUsername">Public username (optional)</label>'+
 '<input id="findUsername" maxlength="24" placeholder="e.g. louandfriends" autocomplete="off">'+
 '<label class="find-toggle"><input id="findDiscover" type="checkbox"> Show this dog in Find Friends</label>'+
 '<p class="find-help">Opt-in only. Your dog’s name, breed, optional username, small photo, and selected Friend View details become discoverable. Private schedules, notes, contacts, and family information are never included.</p>'+
 '<button type="button" id="findSaveListing">Save discovery settings</button></div></details>'+
 '<details class="find-settings"><summary>Friend requests and connections</summary><button id="findLoadInbox" type="button">Refresh requests</button><div id="findInbox"></div><h3>My connections</h3><div id="findConnections"></div></details>'+
 '<p id="findStatus" role="status"></p><p class="find-help">Only public profiles appear here. Friends can view a public profile without logging in; sending a request requires an account.</p>'+
 '</section>';document.body.append(shade);
 $('findClose').onclick=()=>{displayed=false;shade.hidden=true};
 shade.onclick=e=>{if(e.target===shade){displayed=false;shade.hidden=true}};
 $('findSearch').oninput=renderCards;$('findRefresh').onclick=loadDirectory;
 $('findGoogle').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){status(err(e),true)}};
 $('findSaveListing').onclick=()=>$('findDiscover').checked?publishListing():hideListing();
 $('findLoadInbox').onclick=()=>{loadInbox();loadConnections()};
 $('findDiscover').onchange=()=>status('Press Save discovery settings to apply this change.');
 onAuthStateChanged(auth,u=>{current=u;if(displayed)open()});
}
const style=document.createElement('style');style.textContent=[
 '#findLaunch{position:fixed;bottom:116px;right:12px;z-index:18000;padding:9px 13px;border:2px solid #d7e8f0;border-radius:999px;background:#517c8e;color:#fff;font:700 13px Arial,sans-serif;box-shadow:0 3px 12px #0004;cursor:pointer}',
 '#findShade[hidden],#findOwnerSettings[hidden]{display:none!important}',
 '#findShade{position:fixed;inset:0;z-index:22002;background:#152537bb;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box}',
 '.find-box{width:min(97vw,570px);max-height:92vh;overflow:auto;border:3px solid #adc7d6;border-radius:20px;padding:20px;background:#fff9ee;color:#273c4c;font:14px/1.5 Arial,sans-serif;box-sizing:border-box}',
 '.find-box h2{font:700 26px Georgia,serif;color:#754a30;margin:0 28px 8px 0}.find-box h3{font:700 18px Georgia,serif;margin:8px 0}',
 '#findClose{float:right;background:transparent;border:0;font-size:29px;cursor:pointer}',
 '.find-box label{display:block;margin:8px 0 4px;font-weight:700}',
 '.find-box input[type=search],.find-box input:not([type]){width:100%;padding:11px;border:1px solid #aabdc7;border-radius:9px;box-sizing:border-box;font-size:15px}',
 '.find-box button:not(#findClose){padding:8px 11px;background:#d8e8f0;color:#2e4b5e;border:1px solid #89a6b7;border-radius:9px;font-weight:700;cursor:pointer;margin:6px 5px 6px 0}',
 '.find-box button:disabled{opacity:.55;cursor:default}',
 '.find-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin:9px 0;max-height:240px;overflow:auto}',
 '.find-card{border:1px solid #c1d3dc;padding:11px;border-radius:12px;background:#eaf1f4;min-width:0}.find-card h3{font:700 17px Georgia,serif;margin:3px 0}',
 '.find-card p{font-size:12px;color:#556a7a}.find-card img{width:64px;height:64px;border-radius:50%;object-fit:cover;float:right;margin:0 0 7px 8px}',
 '.find-card a{color:#2e607b;text-decoration:underline;font-weight:700;display:inline-block;margin:7px 6px 4px 0}',
 '.find-settings{border-top:1px solid #c4ced4;margin-top:12px;padding-top:11px}.find-settings summary{cursor:pointer;font-weight:700;font-size:15px}',
 '.find-toggle{display:flex!important;gap:9px;align-items:center}.find-help{font-size:12px;color:#566b79;line-height:1.5}',
 'body.friend-view #dtDogFriendsFeed,body.dt-locked #dtDogFriendsFeed{display:none!important}#dtDogFriendsFeed{margin-top:12px}#dtDogFriendsFeed summary{font-weight:700;cursor:pointer;padding:8px 0}.dt-friend-feed-post{background:#fff9ee;border-radius:12px;padding:12px;margin-top:10px;overflow-wrap:anywhere}.dt-friend-feed-post img{width:100%;max-height:220px;object-fit:contain;border-radius:8px}.dt-friend-feed-post h3,.dt-friend-feed-post p{margin:6px 0}',
 '.find-request{border-bottom:1px solid #c5d2d8;padding:8px 0}#findStatus{font-weight:700;overflow-wrap:anywhere}',
 '@media(max-width:480px){#findLaunch{right:9px;bottom:107px;padding:9px 12px}}'
].join('\n');document.head.append(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
