/* Cloud persistence controller for the original Daily Tales UI.
 * Firebase user identity controls access. Browser data is an offline working
 * cache, never a separate login authority. Migration is opt-in and non-destructive.
 */
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {dailyTalesCloudDogStore as store,dailyTalesAuth as auth} from './cloud-dog-store.js';

let user=null,stopWatch=null,stopJoined=null,cloudDogs=[],ownDogs=[],memberDogs=[],connected=false,paused=false,saving=false,initialized=false;
const revisions=new Map(),baseline=new Map();
const LINK_KEY='daily_tales_v2_linked_uid';
const baselineKey=uid=>'daily_tales_v2_baselines_'+uid;
function rememberBaseline(){if(user)try{localStorage.setItem(baselineKey(user.uid),JSON.stringify(Object.fromEntries(baseline)))}catch{}}
function restoreBaseline(uid){try{return new Map(Object.entries(JSON.parse(localStorage.getItem(baselineKey(uid))||'{}')))}catch{return new Map()}}
const $=id=>document.getElementById(id), local=()=>window.DailyTalesLocalDogs;
const signature=d=>JSON.stringify({name:d.name,profile:d.profile||{},meta:d.meta||{},extras:d.extras||{}});
window.DailyTalesSubmitProposal=async item=>{
 const d=cloudDogs.find(d=>d.id===item.dogId);
 if(!user||!d||d.role!=='child')return;
 try{await store.submitChildProposal(d.ownerUid,item)}
 catch(err){status('Could not submit child approval request: '+err.message,true);showSetup('conflict')}
};

function getLocal(){return local()?.list()||[]}
function status(t,bad=false){
 const el=$('dtCloudSetupStatus');
 if(el){el.textContent=t;el.style.color=bad?'#a32d28':'#365a47'}
}
function showSetup(mode){
 let pane=$('dtCloudSetup');
 if(!pane){
   pane=document.createElement('div');pane.id='dtCloudSetup';
   pane.style.cssText='position:fixed;inset:0;background:#1e2734c9;z-index:29000;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
   pane.innerHTML='<section style="width:min(100%,425px);max-height:90dvh;overflow:auto;border:3px solid #64819a;border-radius:24px;background:#fff9f0;padding:22px;text-align:center;font:15px/1.5 Arial,sans-serif;color:#365369"><h2 style="font:700 26px Georgia,serif;color:#653f29">Connect your dogs</h2><p id="dtCloudSetupInfo"></p><p id="dtCloudSetupStatus" role="status"></p><button type="button" id="dtCloudUseLocal" style="width:100%;margin:5px 0;background:#365c76;color:#fff;padding:12px;border:0;border-radius:12px;font-weight:700">Save my dogs to this account</button><button type="button" id="dtCloudUseRemote" style="width:100%;margin:5px 0;background:#e2eaf0;color:#365c76;padding:12px;border:1px solid #8ba7b7;border-radius:12px;font-weight:700">Use dogs already saved online</button><form id="dtOriginalOwnerForm" style="display:block;background:#edf3f5;padding:12px;border-radius:12px;text-align:left"><p style="margin:0 0 10px;font-weight:700">Verify your original owner profile once</p><label style="display:block">Original username<input name="username" autocomplete="username" required style="width:100%;font-size:16px;padding:10px;box-sizing:border-box"></label><label style="display:block;margin-top:10px">Original PIN<input name="pin" type="password" autocomplete="current-password" inputmode="numeric" minlength="4" maxlength="6" required style="width:100%;font-size:16px;padding:10px;box-sizing:border-box"></label><button type="submit" style="width:100%;margin-top:12px;background:#365c76;color:white;border:0;border-radius:10px;padding:12px;font-weight:bold">Verify and connect Lou</button><p id="dtOriginalOwnerError" role="alert"></p></form><button type="button" id="dtCloudBack" style="width:100%;margin:5px 0;background:transparent;color:#365c76;padding:10px;border:0">Use a different account</button></section>';
   document.body.append(pane);
   $('dtCloudUseLocal').onclick=uploadLocal;
   $('dtCloudUseRemote').onclick=useRemote;
   $('dtCloudBack').onclick=()=>window.DailyTalesOpenAccount?.();
   $('dtOriginalOwnerForm').onsubmit=async event=>{
     event.preventDefault();
     const form=event.currentTarget;
     const error=$('dtOriginalOwnerError');
     error.textContent='';
     try{
       if(cloudDogs.length){showSetup('conflict');return}
       if(!local()?.verifyOriginalOwner(form.elements.username.value,form.elements.pin.value))
         throw Error('Original Adult Owner verification failed.');
       form.elements.pin.value='';
       await uploadLocal();
     }catch(e){error.textContent=e.message||'Unable to verify the original owner.'}
   };
 }
 pane.hidden=false;pane.style.display='flex';
 let launcher=$('dtCloudResume');
 if(!launcher){
   launcher=document.createElement('button');launcher.id='dtCloudResume';launcher.type='button';
   launcher.textContent='Finish cloud account linking';
   launcher.style.cssText='position:fixed;z-index:18010;bottom:14px;left:12px;background:#365c76;color:#fff;border:2px solid #fff;border-radius:14px;padding:12px;font-weight:700;box-shadow:0 3px 12px #0005';
   launcher.onclick=()=>showSetup('new');document.body.append(launcher);
 }
 launcher.hidden=true;launcher.style.display='none';
 window.DailyTalesCloudResolved?.();
 const localDogs=getLocal();
 $('dtCloudSetupInfo').textContent=mode==='conflict'?'This device and your account both have saved dog profiles. Choose which copy should be used. Nothing will be erased automatically.':
   'We found '+localDogs.length+' existing dog profile'+(localDogs.length===1?'':'s')+' on this device. Link them to your signed-in account to use Daily Tales on other devices.';
 const hasCloud=cloudDogs.length>0;
 $('dtCloudUseLocal').hidden=hasCloud;
 $('dtCloudUseLocal').disabled=localDogs.length===0||hasCloud;
 const savedButton=$('dtCloudUseRemote');
 savedButton.hidden=!hasCloud;
 savedButton.style.display=hasCloud?'block':'none';
 $('dtOriginalOwnerForm').hidden=hasCloud;
 $('dtOriginalOwnerForm').style.display=hasCloud?'none':'block';
 $('dtCloudSetupInfo').textContent=hasCloud
  ?'Your signed-in account already has '+cloudDogs.map(d=>d.name).join(', ')+'. Open the saved cloud profile instead of creating another one. Your existing computer data will be retained as a recovery copy.'
  :$('dtCloudSetupInfo').textContent;
 status(hasCloud?'Cloud profile found. Choose “Use dogs already saved online.”':'Your existing browser profiles will be kept as a backup.');
}
function hideSetup(){
 const el=$('dtCloudSetup');if(el){el.hidden=true;el.style.display='none'}
 const launcher=$('dtCloudResume');if(launcher){launcher.hidden=true;launcher.style.display='none'}
}
function connectCloud(dogs){
 if(!user||!local())return false;
 if(getLocal().length===0||localStorage.getItem(LINK_KEY)===user.uid){
   const accepted=local().openCloudAccount(user.uid,dogs,user.email);
   if(accepted){connected=true;localStorage.setItem(LINK_KEY,user.uid);hideSetup();window.DailyTalesCloudResolved?.();return true}
 }
 return false;
}
async function uploadLocal(){
 if(saving||!user)return;
 if(!local()?.migrationAuthorized()){
   return status('For this one-time migration, open your original saved Adult Owner profile in recovery mode first. This prevents copying another person’s dog into your account.',true);
 }
 const dogs=local().listOwned();
 if(!dogs.length||cloudDogs.length)return status('Please choose your saved cloud dogs instead.',true);
 if(!confirm('Save '+dogs.map(d=>d.name).join(', ')+' under '+(user.email||'this account')+'? Your browser originals will be preserved.'))return;
 saving=true;
 try{
   const results=await store.migrateDogs(dogs);
   if(results.some(x=>x.status!=='migrated'))throw Error('Some dogs already exist online. Please review them first.');
   cloudDogs=await Promise.all(dogs.map(d=>store.readDog(d.id)));
   for(const d of cloudDogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}
   rememberBaseline();
   localStorage.setItem(LINK_KEY,user.uid);
   connected=true;paused=false;hideSetup();
   local()?.openCloudAccount(user.uid,cloudDogs,user.email);
   window.DailyTalesCloudResolved?.();
 }catch(e){status('Could not finish migration: '+e.message+'. Your local dogs have not been deleted.',true)}
 finally{saving=false}
}
function useRemote(){
 if(!user||!cloudDogs.length)return;
 const localDogs=getLocal();
 if(localDogs.length){
   if(!confirm('Use the cloud copies for this account? The original browser data will be retained for recovery. Unsaved changes in this browser will not be uploaded.'))return;
   try{localStorage.setItem('daily_tales_v2_migration_recovery_'+user.uid,JSON.stringify({at:new Date().toISOString(),dogs:localDogs}))}catch(e){return status('A recovery copy could not be stored. Export a backup before continuing.',true)}
   // Only replace matching dog IDs after the explicit user confirmation.
   const existingIds=new Set(cloudDogs.map(d=>d.id));
   if(localDogs.some(d=>!existingIds.has(d.id)))return status('Some local dogs are missing online. Export a backup and review before proceeding.',true);
   localStorage.setItem(LINK_KEY,user.uid);
   const changed=local().applyCloudDogs(cloudDogs);
   connected=true;paused=false;hideSetup();
   local().openCloudAccount(user.uid,cloudDogs,user.email);
   window.DailyTalesCloudResolved?.();
   if(changed)location.reload();
 }else connectCloud(cloudDogs);
 for(const d of cloudDogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}
 rememberBaseline();
}
function incoming(dogs){
 if(!user)return;
 const revoked=cloudDogs.filter(d=>d.ownerUid&&d.ownerUid!==user.uid&&!dogs.some(current=>current.id===d.id));
 cloudDogs=dogs;
 if(revoked.length&&local()?.removeCloudAccess?.(user.uid,revoked.map(d=>d.id))){location.reload();return;}
 if(saving)return; // Avoid treating our own pending write as a concurrent edit.
 if(!initialized){initialized=true;
   const existing=getLocal();
   if(existing.length===0){connectCloud(dogs);for(const d of dogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}return}
   if(localStorage.getItem(LINK_KEY)!==user.uid){showSetup(dogs.length?'conflict':'new');return}
   connected=true;local()?.openCloudAccount(user.uid,dogs,user.email);
   const previous=restoreBaseline(user.uid),current=new Map(getLocal().map(d=>[d.id,d]));
   const refresh=[];
   for(const d of dogs){
     revisions.set(d.id,d.revision);
     const old=current.get(d.id),last=previous.get(d.id);
     if(old&&signature(old)!==signature(d)){
       if(last===undefined||last!==signature(old)){
         paused=true;showSetup('conflict');
         status('This device has changes that may not be online. Choose which copy to keep.',true);
         return;
       }
       refresh.push(d);
     }
     baseline.set(d.id,signature(d));
   }
   rememberBaseline();hideSetup();window.DailyTalesCloudResolved?.();
   if(refresh.length&&local()?.applyCloudDogs(refresh))location.reload();
   return;
 }
 if(!connected||paused){
   // Firestore often returns an empty owner-list snapshot before the saved
   // dog records have finished loading. Refresh the setup options whenever
   // the cloud list becomes available rather than leaving a stale PIN form.
   if($('dtCloudSetup')&&!$('dtCloudSetup').hidden)showSetup('conflict');
   return;
 }
 const current=new Map(getLocal().map(d=>[d.id,d]));
 const changed=[];
 for(const d of dogs){
   const oldRevision=revisions.get(d.id);
   if(oldRevision===d.revision)continue;
   const mine=current.get(d.id),prior=baseline.get(d.id);
   if(mine&&prior!==undefined&&signature(mine)!==prior){
     paused=true;status('Another device changed '+d.name+' while this device has unsaved edits. Edits were not overwritten.',true);showSetup('conflict');return;
   }
   revisions.set(d.id,d.revision);baseline.set(d.id,signature(d));changed.push(d);
 }
 if(changed.length){
   rememberBaseline();
   if(local()?.applyCloudDogs(changed)){
      local()?.openCloudAccount(user.uid,dogs,user.email);
      for(const d of changed)if(d.ownerUid===user.uid&&window.DailyTalesRefreshPublic)void window.DailyTalesRefreshPublic(d.id).catch(console.warn);
      if(window.dtRole==='adult')location.reload();
   }
 }
}
async function flush(){
 if(!connected||!user||paused||saving||document.hidden||!local()||window.dtRole!=='adult')return;
 const original=getLocal();
 const dirty=original.filter(d=>baseline.has(d.id)&&signature(d)!==baseline.get(d.id)&&cloudDogs.find(c=>c.id===d.id)?.role==='adult');
 const newDogs=original.filter(d=>!baseline.has(d.id)&&!cloudDogs.some(c=>c.id===d.id));
 if(!dirty.length&&!newDogs.length)return;
 saving=true;
 try{
   for(const dog of newDogs){
     const revision=await store.saveDog(dog,null);
     revisions.set(dog.id,revision);baseline.set(dog.id,signature(dog));rememberBaseline();
     if(window.DailyTalesRefreshPublic)void window.DailyTalesRefreshPublic(dog.id).catch(console.warn);
   }
   for(const dog of dirty){
     const ownerUid=cloudDogs.find(c=>c.id===dog.id)?.ownerUid||user.uid;
     const revision=await store.saveDog(dog,revisions.get(dog.id),ownerUid);
     revisions.set(dog.id,revision);baseline.set(dog.id,signature(dog));rememberBaseline();
     if(window.DailyTalesRefreshPublic&&ownerUid===user.uid)void window.DailyTalesRefreshPublic(dog.id).catch(console.warn);
   }
 }catch(e){
   paused=true;status('Cloud saving paused to protect your information: '+e.message,true);
   showSetup('conflict');
 }finally{saving=false}
}
let lastChange=0;
setInterval(()=>{
 if(!connected||paused||saving||!user||window.dtRole!=='adult')return;
 const current=getLocal(),dirty=current.some(d=>(!baseline.has(d.id)&&!cloudDogs.some(c=>c.id===d.id))||(signature(d)!==baseline.get(d.id)&&cloudDogs.find(c=>c.id===d.id)?.role==='adult'));
 if(!dirty){lastChange=0;return}
 if(!lastChange){lastChange=Date.now();return}
 if(Date.now()-lastChange>1500){lastChange=0;void flush()}
},1000);
onAuthStateChanged(auth,u=>{
 if(stopWatch){stopWatch();stopWatch=null}
 if(stopJoined){stopJoined();stopJoined=null}
 user=u;connected=false;paused=false;initialized=false;saving=false;
 cloudDogs=[];ownDogs=[];memberDogs=[];revisions.clear();baseline.clear();lastChange=0;hideSetup();
 if(!u)return;
 const update=()=>incoming([
   ...ownDogs.map(d=>({...d,ownerUid:u.uid,role:'adult'})),
   ...memberDogs.filter(d=>!ownDogs.some(o=>o.id===d.id))
 ]);
 const error=e=>{status('Your cloud dogs could not load: '+e.message,true);showSetup('conflict')};
 stopWatch=store.watchDogs(dogs=>{ownDogs=dogs;update()},error);
 stopJoined=store.watchJoinedDogs(dogs=>{memberDogs=dogs;update()},error);
});
