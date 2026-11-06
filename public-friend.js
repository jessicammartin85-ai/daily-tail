const el=x=>document.getElementById(x);

document.body.classList.remove('dt-locked');document.body.classList.add('friend-view','visitor-entry');
for(const id of ['cloudShade','dtGate','dtRoleStrip','dtOwnerFriendSearch']){if(el(id))el(id).hidden=true;}
el('dtFriendAction').hidden=false;
const style=document.createElement('style');style.textContent='#cloudShade,#dtGate,#dtRoleStrip,.art,.toolbar,.view-switch,.public-share-panel,.public-welcome,.dt-roles-strip{display:none!important}.shell{max-width:760px}#publicStatus{padding:20px;text-align:center}#publicFriendNav{display:flex;position:sticky;bottom:0;background:#fff9ee;border:2px solid #adc5d3;border-radius:20px;padding:8px;margin:12px;gap:8px;z-index:10}#publicFriendNav button{flex:1;padding:14px;border:0;border-radius:12px;background:#365e75;color:white;font-weight:bold}.post p{white-space:pre-wrap}';document.head.append(style);
const anchor=document.createElement('div');anchor.id='dtConceptHome';document.querySelector('.shell').prepend(anchor);
document.body.insertAdjacentHTML('beforeend',"<dialog id=\"friendAccount\" style=\"width:min(90vw,430px);border:2px solid #9bb5c4;border-radius:22px;background:#fff9ee;color:#34495b;padding:24px\"><button id=\"closeFriendAccount\" type=\"button\" style=\"float:right\" aria-label=\"Close\">×</button><h2>Send a friend request</h2><p id=\"friendAccountIntro\">Sign in or create an account to continue.</p><div id=\"friendAccountFields\"><button id=\"friendGoogle\" type=\"button\">Continue with Google</button><p>or use your email</p><form id=\"friendEmailForm\"><label>Email<input name=\"email\" type=\"email\" autocomplete=\"email\" required style=\"display:block;width:100%;padding:12px;margin:8px 0\"></label><label>Password<input name=\"password\" type=\"password\" autocomplete=\"current-password\" minlength=\"6\" required style=\"display:block;width:100%;padding:12px;margin:8px 0\"></label><button type=\"submit\" value=\"login\">Sign in</button> <button type=\"submit\" value=\"register\">Create account</button></form></div><button id=\"sendPublicRequest\" type=\"button\" hidden>Send friend request</button><p id=\"friendRequestStatus\" role=\"status\"></p></dialog>");
const notice=document.createElement('p');notice.id='publicStatus';notice.textContent='Loading shared profile…';anchor.before(notice);
const nav=document.createElement('nav');nav.id='publicFriendNav';nav.innerHTML='<button id="publicHome">Home</button><button id="publicMemories">Memories</button><button id="publicFriends">Friends</button>';document.querySelector('.shell').append(nav);
let panel='';
const $=el;
function show(title,body,type){
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
}function close(){panel='';$('overlay').classList.remove('open')}
el('close').onclick=close;
el('overlay').onclick=e=>{if(e.target===el('overlay'))close()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,onSnapshot,collection,getDocs,query,where,limit,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const firebase=initializeApp({apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'},'daily-tail-public-friend');
const db=getFirestore(firebase),id=new URLSearchParams(location.search).get('share');
const friendAuth=getAuth(firebase);
let friendUser=null,publicDog=null;
const requestStatus=t=>el('friendRequestStatus').textContent=t;
function renderFriendAccount(){
 el('friendAccountFields').hidden=!!friendUser;
 el('sendPublicRequest').hidden=!friendUser;
 el('friendAccountIntro').textContent=friendUser?'Signed in as '+(friendUser.email||friendUser.displayName||'Daily Tales member')+'. Send a request to connect with '+(publicDog?.name||'this dog')+'?':'Sign in or create an account to send a friend request.';
}
onAuthStateChanged(friendAuth,u=>{friendUser=u;renderFriendAccount()});
el('dtAskFriend').onclick=()=>{requestStatus('');renderFriendAccount();el('friendAccount').showModal()};
el('closeFriendAccount').onclick=()=>el('friendAccount').close();
el('friendGoogle').onclick=async()=>{try{await signInWithPopup(friendAuth,new GoogleAuthProvider())}catch(e){requestStatus('Could not sign in: '+(e.code||e.message))}};
el('friendEmailForm').onsubmit=async e=>{
 e.preventDefault();const f=e.currentTarget;requestStatus('Signing in…');
 try{
  const action=e.submitter?.value==='register'?createUserWithEmailAndPassword:signInWithEmailAndPassword;
  await action(friendAuth,f.elements.email.value.trim(),f.elements.password.value);
  requestStatus('');
 }catch(e){requestStatus('Could not sign in: '+(e.code||e.message))}
};
el('sendPublicRequest').onclick=async()=>{
 if(!friendUser)return renderFriendAccount();
 const button=el('sendPublicRequest');button.disabled=true;
 try{
  if(!publicDog)throw Error('The profile is not available. Please refresh.');
  if(friendUser.uid===publicDog.ownerUid)throw Error('This is your own dog profile.');
  const listings=await getDocs(query(collection(db,'directory'),where('discoverable','==',true),where('shareId','==',id),limit(1)));
  if(listings.empty)throw Error('The owner needs to enable Find Friends for this dog before receiving friend requests.');
  const listing=listings.docs[0],data=listing.data();
  const previous=await getDocs(query(collection(db,'friendRequests'),where('requesterUid','==',friendUser.uid),limit(100)));
  if(previous.docs.some(r=>r.data().listingId===listing.id&&['pending','approved'].includes(r.data().status))){
    requestStatus('You already have a pending request or an approved connection with this dog.');return;
  }
  await setDoc(doc(collection(db,'friendRequests')),{requesterUid:friendUser.uid,requesterName:friendUser.displayName||'Daily Tales member',targetOwnerUid:data.ownerUid,dogId:data.dogId,listingId:listing.id,status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  requestStatus('Friend request sent! The owner can review it in Find Friends.');
  el('dtAskFriend').textContent='Friend request pending';
 }catch(e){requestStatus(e.message||'Unable to send the request. Please try again.')}
 finally{button.disabled=false}
};


const openMemories=()=>window.DailyTalesSharedMemories(publicDog?.posts||[],publicDog?.name,show);
el('recent').onclick=openMemories;
el('publicMemories').onclick=openMemories;
el('publicHome').onclick=()=>{close();window.scrollTo({top:0,behavior:'smooth'})};
el('publicFriends').onclick=()=>document.querySelector('.dog-friends-section').scrollIntoView({behavior:'smooth'});
const design=document.createElement('script');design.src='./friend-design.js?v=public-connected-20261106';document.body.append(design);
if(!id||!/^[a-zA-Z0-9]{16,40}$/.test(id)){notice.textContent='This sharing link is incomplete.';}
else onSnapshot(doc(db,'publicProfiles',id),snap=>{
 if(!snap.exists()||!snap.data().active){notice.hidden=false;notice.textContent='This Friend link is no longer available.';document.getElementById('dtFriendDesignHome')?.setAttribute('hidden','');document.querySelector('.dog-friends-section').hidden=true;close();return;}
 publicDog=snap.data();const d=publicDog;notice.hidden=true;
 el('dtFactsDogName').textContent=d.name||'My Dog';el('publicDogName').textContent=d.name||'My Dog';
 const breeds={cocker:'Cocker Spaniel'};el('dtFactsBreed').textContent=breeds[d.breed]||d.breed||'Not added yet';
 let birth=d.dob||'Not added yet';if(d.dob){const date=new Date(d.dob+'T12:00:00');if(!isNaN(date)){const now=new Date();let months=(now.getFullYear()-date.getFullYear())*12+now.getMonth()-date.getMonth()-(now.getDate()<date.getDate()?1:0);months=Math.max(0,months);birth=date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' · '+(months<12?months+' months old':Math.floor(months/12)+' years old');}}
 el('dtFactsBirthday').textContent=birth;el('dtFactsQuote').textContent=d.cuteFact||d.personality||'';
 if(typeof d.photo==='string'&&d.photo.startsWith('data:image/'))el('profileThumb').src=d.photo;else el('profileThumb').removeAttribute('src');
 const latest=d.posts?.[0];el('recentPostTitle').textContent=latest?.title||'Memories coming soon';el('recentPostSummary').textContent=latest?.story||latest?.text||'See our shared moments';
 const thumb=el('recentPostThumb');if(latest?.photo){thumb.src=latest.photo;thumb.hidden=false}else{thumb.hidden=true;thumb.removeAttribute('src')}
 if(panel==='friend-feed')openMemories();
},()=>{notice.hidden=false;notice.textContent='Unable to load the shared profile. Please try again.';document.getElementById('dtFriendDesignHome')?.setAttribute('hidden','');document.querySelector('.dog-friends-section').hidden=true;close()});
