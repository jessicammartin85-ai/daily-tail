/* Account-scoped hearts and moderated comments for shared dog memories. */
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInAnonymously,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,collection,query,where,onSnapshot,getDoc,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const config={apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'};
const app=(window.dtPublicShare?getApps().find(a=>a.name==='daily-tail-public-friend'):null)||getApps().find(a=>a.name==='daily-tail-cloud')||initializeApp(config,'daily-tail-cloud');
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
let user=auth.currentUser,stops=[],currentPosts=null,pendingAction=null;
const stop=()=>{for(const fn of stops)fn();stops=[]};
function context(){
 if(window.DailyTalesSocialContext)return window.DailyTalesSocialContext;
 try{const data=JSON.parse(localStorage.getItem('daily_tail_roles_v2')||'{}'),dog=data.dogs?.find(d=>d.id===data.activeId);return dog?{ownerUid:dog.ownerUid||user?.uid,dogId:dog.id,public:false}:null}catch{return null}
}
const popup=document.createElement('dialog');popup.id='postSocialAccount';
popup.innerHTML='<button type="button" id="socialAccountClose" aria-label="Close">×</button><h2>Sign in to join in</h2><p>Use your Daily Tales account to heart posts or submit a comment.</p><button type="button" id="socialGoogle">Continue with Google</button><p>or use your email</p><form id="socialEmailForm"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="6" autocomplete="current-password" required></label><button type="submit" value="login">Sign in</button><button type="submit" value="register">Create account</button></form><p id="socialAccountStatus" role="status"></p>';
document.body.append(popup);
$('socialAccountClose').onclick=()=>popup.close();
popup.addEventListener('close',()=>{pendingAction=null});
const authError=e=>{$('socialAccountStatus').textContent='Could not sign in: '+(e.code||e.message)};
$('socialGoogle').onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(authError);
$('socialEmailForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;try{const method=e.submitter?.value==='register'?createUserWithEmailAndPassword:signInWithEmailAndPassword;await method(auth,f.elements.email.value.trim(),f.elements.password.value)}catch(e){authError(e)}};
function signedAction(action){
 if(user&&!user.isAnonymous)return action();
 pendingAction=action;$('socialAccountStatus').textContent='';popup.showModal();
}
const styles=document.createElement('style');styles.textContent='.dt-post-social{margin-top:14px;padding-top:12px;border-top:1px solid #c8d4dc}.dt-post-social .dt-heart{border:1px solid #a1b6c4;border-radius:999px;padding:8px 14px;background:#edf3f7;color:#365c76;cursor:pointer}.dt-post-social .dt-heart[aria-pressed=true]{background:#fae4e3;color:#9c353e}.dt-post-social p,.dt-post-social small{white-space:pre-wrap;overflow-wrap:anywhere}.dt-social-comments p{margin:8px 0;padding:9px;background:#edf3f6;border-radius:10px}.dt-social-form{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.dt-social-form .dt-comment-signature{flex:1 0 100%;box-sizing:border-box}.dt-social-form input{min-width:0;flex:1;padding:10px;border:1px solid #9bb1c1;border-radius:10px}.dt-social-form button{border:0;border-radius:10px;padding:9px 12px;background:#365e75;color:white}.dt-social-status{font:13px/1.4 Arial!important;color:#526d7c}#postSocialAccount{width:min(90vw,430px);border:2px solid #9fb8c7;border-radius:22px;padding:24px;background:#fff9ee;color:#34495b}#postSocialAccount::backdrop{background:#152537bb}#postSocialAccount label{display:block;margin:12px 0}#postSocialAccount input{display:block;width:100%;box-sizing:border-box;padding:10px;border:1px solid #a5bac6;border-radius:10px}#postSocialAccount button{padding:10px;border:1px solid #8ca9ba;border-radius:10px;background:#dceaf2;cursor:pointer}#socialAccountClose{float:right}';document.head.append(styles);
function enhance(posts){
 currentPosts=posts;stop();
 const ctx=context();if(!ctx?.ownerUid||!ctx.dogId)return;
 const cards=[...document.querySelectorAll('#content .feed .post')];
 cards.forEach((card,index)=>{
  const post=posts[index];if(!post)return;
  card.querySelector('.dt-post-social')?.remove();
  if(!post.id)return;
  for(const legacy of card.querySelectorAll('.post-actions .like,.comments'))legacy.remove();
  if(window.dtRole==='child')card.querySelector('.post-actions .delete')?.remove();
  const box=document.createElement('section');box.className='dt-post-social';
  const heart=document.createElement('button');heart.type='button';heart.className='dt-heart';heart.setAttribute('aria-label','Heart this post');heart.setAttribute('aria-pressed','false');heart.textContent='♡ '+(Number(post.likes)||0);
  const comments=document.createElement('div');comments.className='dt-social-comments';
  const form=document.createElement('form');form.className='dt-social-form';
  const input=document.createElement('input');input.maxLength=280;input.placeholder='Write a comment…';input.required=true;input.setAttribute('aria-label','Write a comment');
  const guest=ctx.public&&window.dtPublicShare&&(!user||user.isAnonymous);
  const signature=document.createElement('input');signature.className='dt-comment-signature';signature.placeholder='Your name';signature.setAttribute('aria-label','Your name');signature.autocomplete='name';signature.maxLength=100;signature.required=true;
  if(guest)form.append(signature);
  const send=document.createElement('button');send.type='submit';send.textContent='Send';form.append(input,send);
  const help=document.createElement('small');help.textContent=ctx.public||window.dtRole==='child'?'Comments appear after Adult Owner approval.':'Comments from Child and Friend accounts need your approval.';
  const message=document.createElement('p');message.className='dt-social-status';message.setAttribute('role','status');
  box.append(heart,comments,form,help,message);(card.querySelector('.post-body')||card).append(box);
  let mine=false;
  const hearts=collection(db,'users',ctx.ownerUid,'dogSocial',ctx.dogId,'posts',String(post.id),'hearts');
  const requests=collection(db,'users',ctx.ownerUid,'commentRequests');
  const fail=e=>{message.textContent=e.code==='permission-denied'?'Hearts and comments are not available yet. Ask an Adult Owner to update sharing permissions.':'Could not update this post. Please try again.'};
  stops.push(onSnapshot(hearts,snap=>{
   mine=!!user&&snap.docs.some(d=>d.id===user.uid);
   heart.textContent=(mine?'♥ ':'♡ ')+((Number(post.likes)||0)+snap.size);
   heart.setAttribute('aria-pressed',String(mine));
  },fail));
  stops.push(onSnapshot(query(requests,where('dogId','==',ctx.dogId),where('postId','==',String(post.id)),where('status','==','approved')),snap=>{
   comments.replaceChildren();
   for(const text of post.comments||[]){if(typeof text!=='string')continue;const p=document.createElement('p');p.textContent=text;comments.append(p)}
   const rows=snap.docs.map(d=>d.data()).sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));
   for(const value of rows){const p=document.createElement('p'),name=document.createElement('small');name.className='dt-memory-byline';name.textContent='By '+(value.authorName||'Daily Tales member');p.append(document.createTextNode(value.text),name);comments.append(p)}
  },fail));
  if(user)stops.push(onSnapshot(query(requests,where('dogId','==',ctx.dogId),where('postId','==',String(post.id)),where('authorUid','==',user.uid),where('status','==','pending')),snap=>{
   if(snap.size)message.textContent=snap.size===1?'Your comment is waiting for approval.':'Your comments are waiting for approval.';
   else if(message.textContent.includes('waiting for approval'))message.textContent='';
  },fail));
  heart.onclick=()=>signedAction(async()=>{
   heart.disabled=true;try{
    const ref=doc(hearts,user.uid);
    const existing=await getDoc(ref);
    if(existing.exists())await deleteDoc(ref);else await setDoc(ref,{createdAt:serverTimestamp()});
   }catch(e){fail(e)}finally{heart.disabled=false}
  });
  form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;
   const name=signature.value.trim();
   if(guest&&!name){signature.focus();return;}
   const submit=async()=>{
    send.disabled=true;try{
     const commenter=guest?((auth.currentUser||(await signInAnonymously(auth)).user)):user;
     const approved=!ctx.public&&window.dtRole==='adult';
     await setDoc(doc(requests),{dogId:ctx.dogId,postId:String(post.id),postTitle:String(post.title||'Memory').slice(0,180),authorUid:commenter.uid,authorName:String((guest?name:commenter.displayName||(!ctx.public?window.dtPerson:''))||'Daily Tales member').slice(0,100),text,status:approved?'approved':'pending',createdAt:serverTimestamp()});
     input.value='';message.textContent=approved?'Comment posted.':'Comment sent for Adult Owner approval.';
    }catch(e){if(guest&&e.code==='auth/operation-not-allowed')message.textContent='Guest comments are not enabled yet. Use the heart button to sign in, then comment.';else fail(e)}finally{send.disabled=false}
   };
   if(guest)void submit();else signedAction(submit);
  };
 });
}
window.DailyTalesEnhancePostFeed=enhance;
onAuthStateChanged(auth,u=>{
 user=u;
 const action=pendingAction;
 if(u&&!u.isAnonymous&&action){pendingAction=null;popup.close();Promise.resolve(action()).catch(authError).finally(()=>{if(currentPosts&&$('overlay')?.classList.contains('open'))enhance(currentPosts)});}
 else if(currentPosts&&$('overlay')?.classList.contains('open'))enhance(currentPosts);
});
if(window.DailyTalesVisiblePosts&&$('overlay')?.classList.contains('open'))enhance(window.DailyTalesVisiblePosts);
const overlay=$('overlay');if(overlay)new MutationObserver(()=>{if(!overlay.classList.contains('open')){stop();currentPosts=null}}).observe(overlay,{attributes:true,attributeFilter:['class']});
