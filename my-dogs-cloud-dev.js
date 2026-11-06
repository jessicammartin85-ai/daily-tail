/* Development-only bridge. No local Daily Tail data is read, migrated, overwritten, or uploaded.
 * Only the fictional test-dog document under the Firebase UID is accessed.
 * Do not ship to the live app without reviewed security rules and an opt-in migration flow.
 */
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut,signInWithEmailAndPassword,createUserWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,onSnapshot,getDoc,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig={
 apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',
 authDomain:'daily-tail.firebaseapp.com',
 projectId:'daily-tail',
 storageBucket:'daily-tail.firebasestorage.app',
 messagingSenderId:'789609946634',
 appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'
};
const app=getApps().find(a=>a.name==='daily-tail-dev-picker')||initializeApp(firebaseConfig,'daily-tail-dev-picker');
const auth=getAuth(app),db=getFirestore(app);
let account=null,testDog=null,unsubscribeDog=null,loading=false,statusMessage='',statusError=false;
const $=id=>document.getElementById(id);
const testRef=()=>doc(db,'users',account.uid,'testDogs','connection-lab-dog');
const safe=text=>String(text??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function setStatus(message,error=false){statusMessage=message;statusError=error;const node=$('dtCloudDevStatus');if(node){node.textContent=message;node.style.color=error?'#9b2929':'#315a49'}}
function panelMarkup(){return `<section id="dtCloudDevPanel" aria-label="Firebase cloud test dogs" style="border:2px solid #8cadbd;background:#eaf3f7;border-radius:16px;padding:12px;margin:0 0 16px;color:#2a4250;font:14px/1.45 Arial,sans-serif">
<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong style="font:700 17px Georgia,serif">☁ Cloud Test Dogs</strong><small style="font-weight:700;color:#526a75">DEVELOPMENT ONLY</small></div>
<p style="margin:6px 0 10px">Use your Firebase account to view the fictional test dog online. Your local dogs and PINs are not connected or changed.</p>
<div id="dtCloudDevContents"><p>Checking Firebase account…</p></div>
<p id="dtCloudDevStatus" role="status" aria-live="polite" style="font-size:12px;margin:9px 0 0"></p></section>`}
function render(){
 const container=$('dtGateContent');
 if(!container)return;
 let dock=$('dtCloudDevPanel');
 if(!dock||!container.contains(dock)){
   const template=document.createElement('template');template.innerHTML=panelMarkup();
   dock=template.content.firstElementChild;container.insertBefore(dock,container.firstChild);
 }
 const content=$('dtCloudDevContents');
 if(!content)return;
 if(!account){
   content.innerHTML=`<button id="dtDevGoogle" type="button" style="background:#365b73;color:white;padding:9px 12px;border-radius:8px;border:0;font-weight:700">Continue with Google</button>
<details style="margin-top:8px"><summary>Use email and password instead</summary>
<form id="dtDevEmail" style="margin-top:8px">
<label style="display:block">Email<input name="email" type="email" autocomplete="email" required style="width:100%;box-sizing:border-box"></label>
<label style="display:block">Password<input name="password" type="password" minlength="6" autocomplete="current-password" required style="width:100%;box-sizing:border-box"></label>
<button type="submit" name="mode" value="sign-in">Sign in</button><button type="submit" name="mode" value="create">Create account</button>
</form></details>`;
   $('dtDevGoogle').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(err){setStatus(err.message,true)}};
   $('dtDevEmail').onsubmit=async e=>{
     e.preventDefault();const form=e.currentTarget,email=form.elements.email.value.trim(),password=form.elements.password.value;
     try{if(e.submitter?.value==='create')await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password)}
     catch(err){setStatus(err.message,true)}
   };
 }else{
   const dogText=testDog?'<strong>Cloud test dog:</strong> '+safe(testDog.name)+'<br><small>'+safe(testDog.note||'No note')+'</small>':'No fictional test dog saved to this account yet.';
   content.innerHTML=`<div style="margin:6px 0 8px">Signed in as <strong id="dtCloudDevEmail"></strong> <button type="button" id="dtDevSignOut">Sign out</button></div>
<div style="background:white;border:1px solid #c6d7df;border-radius:10px;padding:9px;margin-bottom:8px">${dogText}</div>
<form id="dtDevDogForm">
<label style="display:block;font-weight:700">Fictional dog's name <input id="dtDevDogName" maxlength="40" required style="width:100%;box-sizing:border-box"></label>
<label style="display:block;font-weight:700">Test note <input id="dtDevDogNote" maxlength="160" style="width:100%;box-sizing:border-box"></label>
<button id="dtDevDogSave" type="submit">Save cloud test dog</button><button id="dtDevDogLoad" type="button">Reload</button><button id="dtDevDogDelete" type="button">Delete test dog</button>
</form>`;
   $('dtCloudDevEmail').textContent=account.email||'Firebase account';
   $('dtDevDogName').value=testDog?.name||'';
   $('dtDevDogNote').value=testDog?.note||'';
   $('dtDevSignOut').onclick=()=>signOut(auth).catch(err=>setStatus(err.message,true));
   $('dtDevDogForm').onsubmit=async e=>{
     e.preventDefault();if(loading)return;
     const name=$('dtDevDogName').value.trim(),note=$('dtDevDogNote').value.trim();
     if(!name){setStatus('Enter a fictional dog name.',true);return}
     loading=true;$('dtDevDogSave').disabled=true;setStatus('Saving the test dog to Firestore…');
     try{await setDoc(testRef(),{name:name.slice(0,40),note:note.slice(0,160),type:'development-test-only',updatedAt:serverTimestamp()});setStatus('Saved to the cloud. Sign in on a second device to test synchronization.')}
     catch(err){setStatus(err.message,true)}finally{loading=false;if($('dtDevDogSave'))$('dtDevDogSave').disabled=false}
   };
   $('dtDevDogLoad').onclick=async()=>{
     try{const snap=await getDoc(testRef());testDog=snap.exists()?snap.data():null;render();setStatus(testDog?'Loaded from Firestore.':'No test dog found.')}
     catch(err){setStatus(err.message,true)}
   };
   $('dtDevDogDelete').onclick=async()=>{
     if(!window.confirm('Delete the fictional Firebase test dog? This does not delete any local dogs.'))return;
     try{await deleteDoc(testRef());testDog=null;render();setStatus('Fictional test dog deleted.')}
     catch(err){setStatus(err.message,true)}
   };
 }
 setStatus(statusMessage,statusError);
 renderDogTile();
}
function renderDogTile(){
 const grid=document.querySelector('#dtGate.dt-picker-screen .dt-dogs-grid');
 if(!grid)return;
 let tile=grid.querySelector('#dtCloudDevDogTile');
 if(!account||!testDog){if(tile)tile.remove();return}
 if(!tile){
   tile=document.createElement('button');tile.type='button';tile.id='dtCloudDevDogTile';tile.className='dt-dog-tile';
   tile.style.borderStyle='dashed';tile.style.background='#fff5df';
   tile.onclick=()=>{const panel=$('dtCloudDevPanel');panel?.scrollIntoView({behavior:'smooth',block:'center'});$('dtDevDogName')?.focus()};
   grid.appendChild(tile);
 }
 tile.replaceChildren();
 const cloud=document.createElement('span');cloud.textContent='☁';cloud.style.fontSize='42px';
 const title=document.createElement('strong');title.textContent=testDog.name;
 const small=document.createElement('small');small.textContent='Firebase test only';
 tile.append(cloud,title,small);
}
function start(){
 const root=$('dtGateContent');if(!root)return;
 // Watch only top-level gate changes, so editing fields does not cause unnecessary rerenders.
 const observer=new MutationObserver(mutations=>{
   if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.id!=='dtCloudDevPanel'))){
     render();
   }
 });
 observer.observe(root,{childList:true});
 onAuthStateChanged(auth,user=>{
   if(unsubscribeDog){unsubscribeDog();unsubscribeDog=null}
   account=user;testDog=null;statusMessage='';statusError=false;
   if(user){
     unsubscribeDog=onSnapshot(testRef(),snap=>{
       testDog=snap.exists()?snap.data():null;render();setStatus(testDog?'Test dog loaded from cloud.':'No test dog saved yet.');
     },err=>setStatus('Firestore access failed: '+err.message,true));
   }
   render();
 });
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
