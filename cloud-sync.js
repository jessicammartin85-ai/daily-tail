import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,onSnapshot,writeBatch,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=initializeApp({apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',storageBucket:'daily-tail.firebasestorage.app',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'},'daily-tail-cloud');
const auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
const SETTINGS='daily_tail_cloud_sync_settings_v1',skip=new Set([SETTINGS,'daily_tail_remembered_identity_v1','daily_tail_last_cloud_recovery_v1']),prefix=/^(daily.tail|dailytail|loubear|lou_bear|dt_)/i;
const el=id=>document.getElementById(id);let user=null,remote=null,unsubscribe=null,active=false,busy=false,baseline='',changed=0,watch=null,error='';
let settings={};try{settings=JSON.parse(localStorage.getItem(SETTINGS)||'{}')}catch{}
let applyingRemote=false, lastRemoteApplied='', nextUploadAt=0;
function remember(v){settings={...settings,...v};localStorage.setItem(SETTINGS,JSON.stringify(settings))}
function collect(){const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(prefix.test(k)&&!skip.has(k))data[k]=localStorage.getItem(k)}return data}
function serialize(){return JSON.stringify(collect())}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i+=Math.max(1,Math.floor(str.length/20000))){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return str.length.toString(36)+'-'+(h>>>0).toString(36)}
const ref=()=>doc(db,'users',user.uid,'sync','current');
function status(t,bad=false){error=bad?t:'';if(el('cloudStatus')){el('cloudStatus').textContent=t;el('cloudStatus').style.color=bad?'#a3352e':'#37576b'}if(el('cloudLaunch'))el('cloudLaunch').textContent=user?'Account & Sync':'Sign In'}
function message(e){const code=e?.code||'';if(code.includes('unauthorized-domain'))return 'Add jessicammartin85-ai.github.io in Firebase Authentication → Settings → Authorized domains.';if(code.includes('permission-denied'))return 'Firestore denied access. Check the published Rules.';return (e?.message||String(e)).slice(0,280)}
function lock(on){busy=on;document.querySelectorAll('.cloud-action').forEach(b=>b.disabled=on)}
function updateAccountIndicator(){
 const gate=el('dtGateContent');if(!gate)return;
 let indicator=el('dtCloudAccountIndicator');
 if(!indicator){
   indicator=document.createElement('div');indicator.id='dtCloudAccountIndicator';
   indicator.style.cssText='margin:9px 0 15px;padding:10px;border:1px solid #adc6d4;border-radius:12px;background:#eaf4f8;color:#29485d;font:600 13px/1.5 Arial,sans-serif;text-align:center';
   gate.parentElement.insertBefore(indicator,gate);
 }
 if(!user){indicator.hidden=true;return}
 indicator.hidden=false;
 indicator.textContent='☁ '+(user.email||'Google account')+(active?' · Sync connected':' · Cloud setup needed');
 if(!active){
   const button=document.createElement('button');button.type='button';button.textContent='Finish cloud setup';
   button.style.cssText='display:block;margin:8px auto 0;background:#365c76;color:#fff;border:0;border-radius:9px;padding:8px 12px;font-weight:bold';
   button.onclick=()=>{el('cloudShade').hidden=false;ui()};
   indicator.append(button);
 }
}
function ui(){
 const a=el('cloudAccount'),b=el('cloudOptions');if(!a)return;
 if(!user){
 a.innerHTML='<button class="cloud-action primary" id="cloudGoogle">Continue with Google</button><p class="cloud-divider">or sign in with email</p><form id="cloudEmail"><label>Email address<input required type="email" name="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input required minlength="6" type="password" name="password" autocomplete="current-password" placeholder="Password"></label><div class="cloud-row"><button class="cloud-action primary" type="submit" name="mode" value="in">Sign in</button><button class="cloud-action" type="submit" name="mode" value="up">Create account</button></div></form><button class="cloud-action" type="button" id="cloudReset">Forgot password?</button><div class="cloud-code-entry"><button class="cloud-action" type="button" id="cloudCode">Have a dog invitation code?</button><small>Friend invitations can be opened without an account. Live sharing by code alone is not enabled yet.</small></div>';b.innerHTML='';
 el('cloudGoogle').onclick=async()=>{try{lock(true);await signInWithPopup(auth,provider)}catch(e){status(message(e),true)}finally{lock(false)}};
 el('cloudReset').onclick=async()=>{const email=el('cloudEmail').elements.email.value.trim();if(!email)return status('Enter your email address first.',true);try{await sendPasswordResetEmail(auth,email);status('If this email has an account, check for a password reset message.')}catch(e){status(message(e),true)}};
 el('cloudCode').onclick=()=>{const box=el('cloudShade');if(box)box.hidden=true;window.DailyTalesOpenInvitation?.();};
 el('cloudEmail').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;try{lock(true);if(e.submitter?.value==='up')await createUserWithEmailAndPassword(auth,f.elements.email.value,f.elements.password.value);else await signInWithEmailAndPassword(auth,f.elements.email.value,f.elements.password.value)}catch(e){status(message(e),true)}finally{lock(false)}};
 }else{
 a.innerHTML='<p>Signed in as <strong id="cloudEmailLabel"></strong> <button class="cloud-action" id="cloudSignOut">Sign out</button></p>';el('cloudEmailLabel').textContent=user.email||'Google account';el('cloudSignOut').onclick=()=>signOut(auth);
 if(active){
 b.innerHTML='<p class="cloud-good">✓ Your dogs are syncing automatically across devices.</p><details class="cloud-advanced"><summary>Recovery options</summary><p>Use only if you need to recover an older copy or troubleshoot a conflict.</p><div class="cloud-row"><button class="cloud-action" id="cloudSave">Save this copy</button><button class="cloud-action" id="cloudRestore">Restore cloud copy</button></div></details>';
 el('cloudSave').onclick=()=>upload(true);el('cloudRestore').onclick=restore;
 }else{
 b.innerHTML='<p class="cloud-warning">Choose which copy has the correct information. On the original phone, upload its data. On other devices, restore your cloud copy.</p><div class="cloud-row"><button class="cloud-action" id="cloudUpload">Use this device’s data</button><button class="cloud-action" id="cloudDownload">Use saved cloud data</button></div><small>Nothing is replaced without your approval.</small>';
 el('cloudUpload').disabled=!collect()['daily_tail_roles_v2'];el('cloudDownload').disabled=!remote;
 el('cloudUpload').onclick=()=>upload(false);el('cloudDownload').onclick=restore;
 }}
 if(error)status(error,true);else status(user?(active?'Live syncing is active.':'Choose a copy to begin syncing.'):'Sign in using the same account on each device.');
 updateAccountIndicator();
}
function downloadBackup(){
 const blob=new Blob([JSON.stringify({format:'daily-tail-complete-backup-v1',createdAt:new Date().toISOString(),data:collect()})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Daily_Tail_Before_Cloud_Restore_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
async function restore(automatic=false){
 if(!remote)return status('No cloud copy yet. Upload from the original device first.',true);
 if(automatic){
   if(applyingRemote||!active||!user||!remote||remote.generation===lastRemoteApplied)return;
   // Never overwrite edits that have not yet been uploaded.
   if(hash(serialize())!==baseline){active=false;remember({enabled:false});ui();return status('Cloud changed while you had unsynced edits. Choose a copy in Cloud Sync to resolve the conflict.',true)}
 }else if(!confirm('Replace this device’s saved Daily Tail information with the cloud copy? A local backup will download first.'))return;
 applyingRemote=automatic;lock(true);try{
 const parts=[];for(let i=0;i<remote.parts;i++){const r=await getDoc(doc(db,'users',user.uid,'cloudSnapshots',remote.generation,'parts',String(i).padStart(4,'0')));if(!r.exists())throw Error('Missing cloud data. No changes made.');parts.push(r.data().value)}
 const data=JSON.parse(parts.join(''));if(!data||!data['daily_tail_roles_v2'])throw Error('Cloud profile not found. No changes made.');
 if(!automatic)downloadBackup();
 else {try{localStorage.setItem('daily_tail_last_cloud_recovery_v1',JSON.stringify({at:new Date().toISOString(),data:collect()}))}catch{}}
 for(const k of Object.keys(collect()))if(!(k in data))localStorage.removeItem(k);
 for(const [k,v] of Object.entries(data))if(prefix.test(k)&&!skip.has(k)&&typeof v==='string')localStorage.setItem(k,v);
 lastRemoteApplied=remote.generation;
 remember({uid:user.uid,enabled:true,generation:remote.generation,hash:hash(serialize())});location.reload();
 }catch(e){status(message(e),true)}finally{applyingRemote=false;lock(false)}
}
async function upload(force){
 if(!user||applyingRemote)return;if(!force&&!confirm('Use this device’s saved profiles as the cloud copy? Choose this on the original device where Lou’s information is complete.'))return;
 lock(true);try{
 const latest=await getDoc(ref());
 if(force&&latest.exists()&&latest.data().generation!==settings.generation){active=false;remember({enabled:false});throw Error('Another device changed the cloud copy. Your local edits are preserved; open Cloud Sync to resolve the conflict.');}
 if(!force&&latest.exists()&&!confirm('Cloud data already exists. Replace it with this device’s version?'))return;
 const json=serialize();if(json.length>12000000)throw Error('Your saved photos are too large for this sync version. Do not delete your local copy.');
 const parts=json.match(/[\s\S]{1,150000}/g)||['{}'];if(parts.length>300)throw Error('Too much data for one cloud update.');
 const generation='v'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),batch=writeBatch(db);
 parts.forEach((value,i)=>batch.set(doc(db,'users',user.uid,'cloudSnapshots',generation,'parts',String(i).padStart(4,'0')),{value}));
 batch.set(ref(),{generation,parts:parts.length,updatedAt:serverTimestamp(),schema:1});await batch.commit();
 remote={generation,parts:parts.length};active=true;baseline=hash(json);changed=0;nextUploadAt=Date.now()+1200;remember({uid:user.uid,enabled:true,generation,hash:baseline});ui();status('All dog profiles synced to your account.');
 }catch(e){status(message(e),true)}finally{lock(false)}
}
function listen(s){
 if(!user)return;
 if(!s.exists()){remote=null;active=false;ui();if(collect()['daily_tail_roles_v2']&&el('cloudShade'))el('cloudShade').hidden=false;return}
 const next=s.data();if(!next.generation||!next.parts)return;
 // A new, empty device can safely retrieve an existing account automatically.
 // Never do this when local dog profiles exist because they may belong to another account.
 if(!collect()['daily_tail_roles_v2']&&!settings.enabled&&!applyingRemote){
   remote=next;active=true;baseline=hash(serialize());
   status('Loading your saved dogs from your account…');
   void restore(true);
   return;
 }
 const previousGeneration=remote?.generation;
 remote=next;
 const sameAccount=settings.uid===user.uid&&settings.enabled;
 const localHash=hash(serialize());
 if(sameAccount&&settings.generation===next.generation){
   active=true;baseline=settings.hash||localHash;
   if(localHash===baseline)changed=0;
   ui();return;
 }
 // A second device may update the cloud while this tab is closed.
 // When the tab reopens, apply that newer data only if this copy had no unsynced edits.
 if(!active&&sameAccount&&settings.generation!==next.generation&&localHash===settings.hash){
   active=true;baseline=localHash;
   status('Updating your dogs from another device…');
   void restore(true);
   return;
 }
 if(active&&previousGeneration!==next.generation){
   // Snapshot listeners push the newest cloud version to signed-in devices.
   // Only apply automatically when local storage matches the last synced state.
   if(hash(serialize())===baseline&&!busy&&!applyingRemote){
     status('New changes received. Updating this device…');
     void restore(true);
   }else{
     active=false;remember({enabled:false});ui();
     status('Another device updated Daily Tales while this one has unsynced edits. Your changes are safe. Open Cloud Sync to choose which copy to keep.',true);
   }
 }else{
   ui();
   if(!active&&collect()['daily_tail_roles_v2']&&el('cloudShade'))el('cloudShade').hidden=false;
 }
}

onAuthStateChanged(auth,u=>{
 if(unsubscribe){unsubscribe();unsubscribe=null}
 user=u;active=false;remote=null;changed=0;error='';
 if(u)unsubscribe=onSnapshot(ref(),listen,e=>status(message(e),true));
 const shade=el('cloudShade'),close=el('cloudClose');
 if(shade)shade.hidden=!!u;
 if(close)close.hidden=!u;
 if(el('cloudLaunch'))el('cloudLaunch').hidden=!u;
 ui();
});
function start(){
 const btn=document.createElement('button');btn.id='cloudLaunch';btn.textContent='☁ Cloud Sync';btn.type='button';document.body.append(btn);
 const shade=document.createElement('div');shade.id='cloudShade';shade.hidden=true;shade.innerHTML='<section class="cloudBox" role="dialog" aria-modal="true" aria-labelledby="cloudTitle"><button type="button" id="cloudClose" aria-label="Close" hidden>×</button><img class="cloud-logo" src="./daily-tails-logo.webp" alt="Daily Tales"><h2 id="cloudTitle">Welcome to Daily Tales</h2><p>Every dog has a story. Keep yours together on any device.</p><div id="cloudAccount"></div><div id="cloudOptions"></div><p id="cloudStatus" role="status"></p><details><summary>How account saving works</summary><p>Once you connect your existing information to the account, data is synchronized automatically. Select the correct original copy once. Simultaneous edits are paused rather than overwritten.</p></details></section>';document.body.append(shade);
 btn.onclick=()=>{shade.hidden=false;ui()};el('cloudClose').onclick=()=>shade.hidden=true;shade.onclick=e=>{if(e.target===shade&&user)shade.hidden=true};
 watch=setInterval(async()=>{if(!active||!user||busy||applyingRemote||document.hidden)return;const h=hash(serialize());if(h===baseline){changed=0;return}if(!changed){changed=Date.now();return}if(Date.now()-changed>1800&&Date.now()>nextUploadAt)await upload(true)},1000);
 ui();
}
const style=document.createElement('style');style.textContent=`
#cloudShade{z-index:30000!important;align-items:center!important}
.cloudBox{max-width:420px!important;border-radius:22px!important;text-align:center!important}
.cloudBox .cloud-logo{width:min(75%,220px);display:block;margin:0 auto 5px}
.cloudBox h2{text-align:center!important;margin:6px 0!important}
.cloudBox label{display:block;text-align:left;font-weight:700;margin:10px 0}
.cloudBox input{display:block;width:100%;box-sizing:border-box;margin-top:5px;font:16px Arial,sans-serif;padding:11px;border:1px solid #91a8b8;border-radius:9px}
.cloudBox .cloud-divider{margin:16px 0 10px;color:#5f6b76}
.cloudBox .cloud-row{display:flex;gap:8px}
.cloudBox .cloud-row button{flex:1}
.cloudBox .cloud-code-entry{margin-top:15px;padding-top:12px;border-top:1px solid #c5d5de}
.cloudBox .cloud-code-entry small{display:block;color:#576677;line-height:1.45}
#cloudLaunch[hidden]{display:none!important}
`;document.head.append(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
