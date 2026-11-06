/**
 * Migration adapter for the original Daily Tales interface.
 * Per-dog records are never automatically claimed by an arbitrary login.
 * A user must expressly select migration on the device holding their dogs.
 * Browsers remain a compatibility cache until all legacy features are ported.
 */
import {onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {dailyTalesCloudDogStore as store,dailyTalesAuth as auth} from './cloud-dog-store.js';
let user=null,unwatch=null,linked=false,pending=false,paused=false;
let cloudDogs=[],knownRevisions=new Map(),baseline=new Map(),lastError='',lastLocalChange=0;
const LINK_KEY='daily_tales_v2_linked_uid';
const local=()=>window.DailyTalesLocalDogs;
const digest=v=>JSON.stringify({name:v.name,profile:v.profile||{},meta:v.meta||{}});
function status(message,bad=false){
 const el=document.getElementById('dtV2Status');
 if(el){el.textContent=message;el.style.color=bad?'#a62a24':'#2b5f45'}
 lastError=bad?message:'';
}
function controls(){
 let box=document.getElementById('dtV2Box');
 if(!box){
  box=document.createElement('aside');box.id='dtV2Box';box.style.cssText='position:fixed;bottom:72px;right:10px;z-index:19000;max-width:min(355px,calc(100vw - 20px));padding:12px 14px;border:2px solid #aac3d0;border-radius:14px;background:#fffaf3;color:#344b5b;box-shadow:0 3px 18px #0003;font:13px/1.5 Arial,sans-serif';
  box.innerHTML='<strong>Cloud dog profiles</strong><p id="dtV2Status" role="status"></p><button id="dtV2Migrate" type="button" style="background:#365c76;color:#fff;border:0;border-radius:9px;padding:9px 12px;font-weight:700">Connect my existing dogs</button><button id="dtV2Hide" type="button" style="background:transparent;color:#365c76;border:0;margin-left:8px">Later</button>';
  document.body.append(box);
  box.querySelector('#dtV2Migrate').onclick=connect;
  box.querySelector('#dtV2Hide').onclick=()=>box.hidden=true;
 }
 box.hidden=!user||linked;
 if(!box.hidden)status('Keep your original dog profiles on this device until they are safely linked.');
}
async function connect(){
 if(!user||pending||!local())return;
 const dogs=local().list();
 if(!dogs.length)return status('No local dog profiles were found on this device.',true);
 const cloud=await store.listDogHeaders();
 if(cloud.length){
   const ids=new Set(cloud.map(d=>d.id));
   if(dogs.some(d=>ids.has(d.id))){
      return status('One or more dogs already exist in your cloud account. Automatic overwrite is blocked; review those profiles first.',true);
   }
 }
 if(!confirm('Connect '+dogs.map(d=>d.name).join(', ')+' to '+(user.email||'your signed-in account')+'? Your original browser data will remain untouched.'))return;
 pending=true;
 try{
   const results=await store.migrateDogs(dogs);
   linked=true;paused=false;
   localStorage.setItem(LINK_KEY,user.uid);
   for(const d of dogs)baseline.set(d.id,digest(d));
   status(results.length+' dogs saved to your account.');
   document.getElementById('dtV2Box').hidden=true;
 }catch(e){status('Cloud migration did not finish: '+e.message+'. Your browser data is unchanged.',true)}
 finally{pending=false}
}
function receive(items){
 cloudDogs=items;
 if(!user||!local())return;
 const myLocal=new Map(local().list().map(d=>[d.id,d]));
 const incoming=[];
 for(const d of items){
   const oldRev=knownRevisions.get(d.id);
   knownRevisions.set(d.id,d.revision);
   const localDog=myLocal.get(d.id);
   if(!localDog){incoming.push(d);continue}
   if(oldRev===d.revision)continue;
   const previous=baseline.get(d.id);
   if(previous!==undefined&&digest(localDog)!==previous){
     paused=true;
     status('A cloud update arrived while this device has unsaved changes. Sync paused; no data was replaced.',true);
     return;
   }
   if(previous===undefined&&digest(localDog)!==digest(d)){
     // A device with pre-existing data must not be linked automatically.
     continue;
   }
   incoming.push(d);
 }
 if(incoming.length&&linked){
   const changed=local().applyCloudDogs(incoming);
   for(const d of incoming)baseline.set(d.id,digest(d));
   if(changed&&window.dtRole==='adult'){
      // UI is heavily stateful; reloading is safer than leaving stale editor data.
      location.reload();
   }
 }
 if(linked&&!paused)status('Your dog profiles are connected and receiving cloud updates.');
}
window.DailyTalesCloudSignOut=()=>{if(auth.currentUser)void signOut(auth)};
function watchUser(u){
 if(unwatch){unwatch();unwatch=null}
 user=u;linked=false;paused=false;knownRevisions.clear();baseline.clear();cloudDogs=[];
 if(u&&local()?.openLinkedAccount)queueMicrotask(()=>local()?.openLinkedAccount(u.uid));
 if(!u){controls();return}
 unwatch=store.watchDogs(items=>{
   cloudDogs=items;
   if(local()){
     const current=local().list();
     linked=localStorage.getItem(LINK_KEY)===u.uid&&items.length>0&&current.length>0&&current.every(d=>items.some(x=>x.id===d.id));
     if(linked){
       for(const dog of current)if(!baseline.has(dog.id))baseline.set(dog.id,digest(dog));
     }
   }
   controls();receive(items);
 },e=>status('Cloud dog data could not load: '+e.message,true));
}
onAuthStateChanged(auth,watchUser);
setInterval(async()=>{
 if(!user||!linked||paused||pending||document.hidden||!local()||window.dtRole!=='adult')return;
 const all=local().list();
 const dirty=all.filter(d=>baseline.has(d.id)&&digest(d)!==baseline.get(d.id));
 if(!dirty.length){lastLocalChange=0;return}
 if(!lastLocalChange){lastLocalChange=Date.now();return}
 if(Date.now()-lastLocalChange<1800)return;
 pending=true;
 try{
   for(const dog of dirty){
     const revision=knownRevisions.get(dog.id);
     if(!Number.isInteger(revision))throw Error('Missing cloud revision for '+dog.name);
     const next=await store.saveDog(dog,revision);
     knownRevisions.set(dog.id,next);baseline.set(dog.id,digest(dog));
   }
   lastLocalChange=0;
 }catch(e){paused=true;status('Sync paused to protect your changes: '+e.message,true)}
 finally{pending=false}
},1000);
