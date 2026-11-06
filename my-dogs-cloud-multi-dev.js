/* Development-only multi-dog prototype.
   Uses private users/{uid}/cloudTestDogs documents only.
   Does not read or modify local dog records, PINs, invitation codes, photos or schedules.
   The earlier users/{uid}/testDogs/connection-lab-dog is read-only for optional manual copying.
*/
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,getDoc,addDoc,updateDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const config={
 apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',
 authDomain:'daily-tail.firebaseapp.com',
 projectId:'daily-tail',
 storageBucket:'daily-tail.firebasestorage.app',
 messagingSenderId:'789609946634',
 appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'
};
const app=getApps().find(a=>a.name==='daily-tail-multi-dev')||initializeApp(config,'daily-tail-multi-dev');
const auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
let user=null,dogs=[],legacy=null,selected=null,unsubscribe=null,authEpoch=0,busy=false,notice='',noticeBad=false;
const safe=t=>String(t??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const col=()=>collection(db,'users',user.uid,'cloudTestDogs');
const oldRef=()=>doc(db,'users',user.uid,'testDogs','connection-lab-dog');
function notify(text,bad=false){notice=text;noticeBad=bad;const target=$('dtMultiNotice');if(target){target.textContent=text;target.style.color=bad?'#a42e2b':'#315947'}}
function refreshSelection(){if(selected&&!dogs.some(d=>d.id===selected))selected=null}
function ensurePanel(){
 const root=$('dtGateContent');if(!root)return false;
 const existing=$('dtMultiPanel');if(existing&&root.contains(existing))return true;
 const box=document.createElement('section');box.id='dtMultiPanel';
 box.setAttribute('aria-label','Development cloud dog profiles');
 box.style.cssText='background:#eaf3f7;border:2px solid #8cadbd;border-radius:16px;padding:14px;margin:0 0 16px;color:#29475a;font:14px/1.45 Arial,sans-serif';
 box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><strong style="font:700 18px Georgia,serif">☁ Cloud My Dogs</strong><small style="font-weight:bold">DEVELOPMENT ONLY</small></div><p style="margin:7px 0">Test multiple fictional cloud profiles. Local dogs, PINs, memories, and schedules remain separate and unchanged.</p><div id="dtMultiContent"></div><p id="dtMultiNotice" role="status" aria-live="polite"></p>';
 root.insertBefore(box,root.firstChild);
 return true;
}
function paintTiles(){
 const grid=document.querySelector('#dtGate.dt-picker-screen .dt-dogs-grid');
 if(!grid)return;
 grid.querySelectorAll('[data-cloud-test-tile]').forEach(node=>node.remove());
 if(!user)return;
 dogs.forEach(dog=>{
   const tile=document.createElement('button');tile.type='button';tile.className='dt-dog-tile';
   tile.dataset.cloudTestTile=dog.id;
   tile.style.cssText='border-style:dashed;background:#fff4da';
   const symbol=document.createElement('span');symbol.textContent='☁';symbol.style.fontSize='34px';
   const name=document.createElement('strong');name.textContent=dog.name;
   const desc=document.createElement('small');desc.textContent='Cloud test · '+(dog.note||'No note').slice(0,30);
   tile.append(symbol,name,desc);
   tile.onclick=()=>{selected=dog.id;render();$('dtMultiPanel')?.scrollIntoView({block:'center',behavior:'smooth'})};
   grid.appendChild(tile);
 });
}
function render(){
 if(!ensurePanel())return;
 const outlet=$('dtMultiContent');if(!outlet)return;
 if(!user){
   outlet.innerHTML='<button type="button" id="dtMultiGoogle">Continue with Google</button><details style="margin-top:10px"><summary>Email/password account</summary><form id="dtMultiAuthForm"><label style="display:block">Email<input type="email" name="email" required autocomplete="email" style="width:100%;box-sizing:border-box"></label><label style="display:block">Password<input type="password" name="password" minlength="6" required autocomplete="current-password" style="width:100%;box-sizing:border-box"></label><button type="submit" value="signIn">Sign in</button><button type="submit" value="create">Create account</button></form></details>';
   $('dtMultiGoogle').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(err){notify(err.message,true)}};
   $('dtMultiAuthForm').onsubmit=async event=>{
     event.preventDefault();const fields=event.currentTarget.elements;
     try{
       if(event.submitter?.value==='create')await createUserWithEmailAndPassword(auth,fields.email.value,fields.password.value);
       else await signInWithEmailAndPassword(auth,fields.email.value,fields.password.value);
     }catch(err){notify(err.message,true)}
   };
 }else{
   refreshSelection();
   const current=dogs.find(d=>d.id===selected);
   const list=dogs.map(d=>'<button type="button" data-pick-dog="'+safe(d.id)+'" aria-pressed="'+String(d.id===selected)+'" style="display:block;width:100%;text-align:left;margin:5px 0;padding:10px;border:1px solid #9cb9c7;background:'+(d.id===selected?'#d8e9f3':'white')+';border-radius:10px"><strong>'+safe(d.name)+'</strong><small style="display:block;color:#516677"> '+safe(d.note||'No test note')+'</small></button>').join('');
   outlet.innerHTML='<div>Signed in as <strong id="dtMultiEmail"></strong> <button type="button" id="dtMultiSignOut">Sign out</button></div>'+
    '<h3 style="margin:13px 0 5px">Cloud test dogs ('+dogs.length+')</h3>'+
    '<div id="dtMultiList">'+(list||'<p>No cloud test dogs yet.</p>')+'</div>'+
    '<div style="border-top:1px solid #b9d1dc;margin-top:12px;padding-top:9px"><h3 id="dtMultiFormHeading" style="margin:0 0 5px">'+(current?'Edit test dog':'Add a fictional dog')+'</h3>'+
    '<form id="dtMultiDogForm"><label style="display:block;font-weight:700">Dog name<input id="dtMultiName" required maxlength="40" style="width:100%;box-sizing:border-box"></label>'+
    '<label style="display:block;font-weight:700">Test note<input id="dtMultiNote" maxlength="160" style="width:100%;box-sizing:border-box"></label>'+
    '<button type="submit" id="dtMultiSave">'+(current?'Save changes':'Add cloud test dog')+'</button> '+
    '<button type="button" id="dtMultiNew">New test dog</button> '+
    (current?'<button type="button" id="dtMultiDelete">Delete selected test dog</button>':'')+'</form></div>'+
    (legacy?'<div style="margin-top:10px;padding:10px;background:#fff9e8;border-radius:10px"><strong>Earlier account-lab record:</strong> '+safe(legacy.name)+' <small>'+safe(legacy.note||'')+'</small><p style="margin:5px 0">This older record is unchanged.</p><button type="button" id="dtMultiCopyOld">Copy as another cloud test dog</button></div>':'');
   $('dtMultiEmail').textContent=user.email||'Firebase account';
   $('dtMultiSignOut').onclick=()=>signOut(auth).catch(err=>notify(err.message,true));
   $('dtMultiName').value=current?.name||'';
   $('dtMultiNote').value=current?.note||'';
   outlet.querySelectorAll('[data-pick-dog]').forEach(btn=>btn.onclick=()=>{selected=btn.dataset.pickDog;render()});
   $('dtMultiNew').onclick=()=>{selected=null;render();$('dtMultiName')?.focus()};
   $('dtMultiDogForm').onsubmit=async event=>{
     event.preventDefault();if(busy)return;
     const name=$('dtMultiName').value.trim().slice(0,40),note=$('dtMultiNote').value.trim().slice(0,160);
     if(!name){notify('Enter a fictional dog name.',true);return}
     if(!selected&&dogs.length>=20){notify('Maximum of 20 fictional test dogs in this prototype.',true);return}
     busy=true;$('dtMultiSave').disabled=true;
     try{
       if(selected){await updateDoc(doc(col(),selected),{name,note,updatedAt:serverTimestamp()});notify('Updated the selected cloud test dog.')}
       else{const result=await addDoc(col(),{name,note,type:'development-test-only',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});selected=result.id;notify('Added another cloud test dog.')}
     }catch(err){notify(err.message,true)}finally{busy=false;if($('dtMultiSave'))$('dtMultiSave').disabled=false}
   };
   if(current)$('dtMultiDelete').onclick=async()=>{
     if(!confirm('Delete only this fictional cloud test dog, '+current.name+'? Your local dogs are not affected.'))return;
     try{await deleteDoc(doc(col(),current.id));selected=null;notify('Deleted fictional cloud test dog.')}catch(err){notify(err.message,true)}
   };
   if(legacy)$('dtMultiCopyOld').onclick=async()=>{
     if(dogs.length>=20){notify('Test dog limit reached.',true);return}
     try{
       const result=await addDoc(col(),{name:String(legacy.name||'Test Puppy').slice(0,40),note:String(legacy.note||'').slice(0,160),type:'development-test-only',origin:'copied-from-account-lab',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
       selected=result.id;notify('Copied the earlier test record. Original remains unchanged.');
     }catch(err){notify(err.message,true)}
   };
 }
 notify(notice,noticeBad);paintTiles();
 // A separate development-only details module handles profile fields and test schedules.
 // No local Daily Tail records are passed or uploaded.
 const choice={uid:user?.uid||null,dogId:selected||null};
 window.DailyTailDevSelection=choice;
 window.dispatchEvent(new CustomEvent('daily-tail-dev-selection',{detail:choice}));
}
function start(){
 const root=$('dtGateContent');if(!root)return;
 const observer=new MutationObserver(changes=>{
   if(changes.some(change=>[...change.addedNodes].some(n=>n.nodeType===1&&n.id!=='dtMultiPanel')))render();
 });
 observer.observe(root,{childList:true});
 onAuthStateChanged(auth,async nextUser=>{
   authEpoch++;const epoch=authEpoch;
   if(unsubscribe){unsubscribe();unsubscribe=null}
   user=nextUser;dogs=[];legacy=null;selected=null;notice='';noticeBad=false;render();
   if(!user)return;
   try{
     const older=await getDoc(oldRef());
     if(epoch!==authEpoch)return;
     if(older.exists())legacy=older.data();
     render();
   }catch(err){if(epoch===authEpoch)notify('Earlier test record could not be read: '+err.message,true)}
   if(epoch!==authEpoch)return;
   unsubscribe=onSnapshot(col(),snapshot=>{
     dogs=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.type==='development-test-only').sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
     render();
   },err=>notify('Cloud test dogs could not be loaded: '+err.message,true));
 });
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
