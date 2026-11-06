/* Cloud persistence controller for the original Daily Tales UI.
 * Firebase user identity controls access. Browser data is an offline working
 * cache, never a separate login authority. Migration is opt-in and non-destructive.
 */
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {dailyTalesCloudDogStore as store,dailyTalesAuth as auth} from './cloud-dog-store.js';

let user=null,stopWatch=null,cloudDogs=[],connected=false,paused=false,saving=false,initialized=false;
const revisions=new Map(),baseline=new Map();
const LINK_KEY='daily_tales_v2_linked_uid';
const $=id=>document.getElementById(id), local=()=>window.DailyTalesLocalDogs;
const signature=d=>JSON.stringify({name:d.name,profile:d.profile||{},meta:d.meta||{},extras:d.extras||{}});
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
   pane.innerHTML='<section style="width:min(100%,425px);max-height:90dvh;overflow:auto;border:3px solid #64819a;border-radius:24px;background:#fff9f0;padding:22px;text-align:center;font:15px/1.5 Arial,sans-serif;color:#365369"><h2 style="font:700 26px Georgia,serif;color:#653f29">Connect your dogs</h2><p id="dtCloudSetupInfo"></p><p id="dtCloudSetupStatus" role="status"></p><button type="button" id="dtCloudUseLocal" style="width:100%;margin:5px 0;background:#365c76;color:#fff;padding:12px;border:0;border-radius:12px;font-weight:700">Save my dogs to this account</button><button type="button" id="dtCloudUseRemote" style="width:100%;margin:5px 0;background:#e2eaf0;color:#365c76;padding:12px;border:1px solid #8ba7b7;border-radius:12px;font-weight:700">Use dogs already saved online</button><button type="button" id="dtCloudBack" style="width:100%;margin:5px 0;background:transparent;color:#365c76;padding:10px;border:0">Use a different account</button></section>';
   document.body.append(pane);
   $('dtCloudUseLocal').onclick=uploadLocal;
   $('dtCloudUseRemote').onclick=useRemote;
   $('dtCloudBack').onclick=()=>window.DailyTalesOpenAccount?.();
 }
 pane.hidden=false;
 const localDogs=getLocal();
 $('dtCloudSetupInfo').textContent=mode==='conflict'?'This device and your account both have saved dog profiles. Choose which copy should be used. Nothing will be erased automatically.':
   'We found '+localDogs.length+' existing dog profile'+(localDogs.length===1?'':'s')+' on this device. Link them to your signed-in account to use Daily Tales on other devices.';
 $('dtCloudUseLocal').disabled=localDogs.length===0||cloudDogs.length>0;
 $('dtCloudUseRemote').hidden=cloudDogs.length===0;
 status(cloudDogs.length?'Cloud account contains '+cloudDogs.map(d=>d.name).join(', ')+'.':'Your existing browser profiles will be kept as a backup.');
}
function hideSetup(){const el=$('dtCloudSetup');if(el)el.hidden=true}
function connectCloud(dogs){
 if(!user||!local())return false;
 if(getLocal().length===0||localStorage.getItem(LINK_KEY)===user.uid){
   const accepted=local().openCloudAccount(user.uid,dogs,user.email);
   if(accepted){connected=true;localStorage.setItem(LINK_KEY,user.uid);hideSetup();return true}
 }
 return false;
}
async function uploadLocal(){
 if(saving||!user)return;
 const dogs=getLocal();
 if(!dogs.length||cloudDogs.length)return status('Please choose your saved cloud dogs instead.',true);
 if(!confirm('Save '+dogs.map(d=>d.name).join(', ')+' under '+(user.email||'this account')+'? Your browser originals will be preserved.'))return;
 saving=true;
 try{
   const results=await store.migrateDogs(dogs);
   if(results.some(x=>x.status!=='migrated'))throw Error('Some dogs already exist online. Please review them first.');
   cloudDogs=await Promise.all(dogs.map(d=>store.readDog(d.id)));
   for(const d of cloudDogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}
   localStorage.setItem(LINK_KEY,user.uid);
   connected=true;paused=false;hideSetup();
   local()?.openCloudAccount(user.uid,cloudDogs,user.email);
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
   if(changed)location.reload();
 }else connectCloud(cloudDogs);
 for(const d of cloudDogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}
}
function incoming(dogs){
 if(!user)return;
 cloudDogs=dogs;
 if(!initialized){initialized=true;
   const existing=getLocal();
   if(existing.length===0){connectCloud(dogs);for(const d of dogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}return}
   if(localStorage.getItem(LINK_KEY)!==user.uid){showSetup(dogs.length?'conflict':'new');return}
   connected=true;local()?.openCloudAccount(user.uid,dogs,user.email);
   for(const d of dogs){revisions.set(d.id,d.revision);baseline.set(d.id,signature(d))}
   hideSetup();return;
 }
 if(!connected||paused)return;
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
   if(local()?.applyCloudDogs(changed)){
      if(window.dtRole==='adult')location.reload();
      else local()?.openCloudAccount(user.uid,dogs,user.email);
   }
 }
}
async function flush(){
 if(!connected||!user||paused||saving||document.hidden||!local()||window.dtRole!=='adult')return;
 const original=getLocal();
 const dirty=original.filter(d=>baseline.has(d.id)&&signature(d)!==baseline.get(d.id));
 const newDogs=original.filter(d=>!baseline.has(d.id));
 if(!dirty.length&&!newDogs.length)return;
 saving=true;
 try{
   for(const dog of newDogs){
     const revision=await store.saveDog(dog,null);
     revisions.set(dog.id,revision);baseline.set(dog.id,signature(dog));
   }
   for(const dog of dirty){
     const revision=await store.saveDog(dog,revisions.get(dog.id));
     revisions.set(dog.id,revision);baseline.set(dog.id,signature(dog));
   }
 }catch(e){
   paused=true;status('Cloud saving paused to protect your information: '+e.message,true);
   showSetup('conflict');
 }finally{saving=false}
}
let lastChange=0;
setInterval(()=>{
 if(!connected||paused||saving||!user||window.dtRole!=='adult')return;
 const current=getLocal(),dirty=current.some(d=>!baseline.has(d.id)||signature(d)!==baseline.get(d.id));
 if(!dirty){lastChange=0;return}
 if(!lastChange){lastChange=Date.now();return}
 if(Date.now()-lastChange>1500){lastChange=0;void flush()}
},1000);
onAuthStateChanged(auth,u=>{
 if(stopWatch){stopWatch();stopWatch=null}
 user=u;connected=false;paused=false;initialized=false;saving=false;
 cloudDogs=[];revisions.clear();baseline.clear();lastChange=0;hideSetup();
 if(!u)return;
 stopWatch=store.watchDogs(incoming,e=>{status('Your cloud dogs could not load: '+e.message,true);showSetup('conflict')});
});
