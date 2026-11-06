/* DEVELOPMENT ONLY: reviewed, explicit, minimal import of private dog profile fields.
 * Reads a locally selected Daily Tail backup file entirely in memory.
 * Writes ONLY selected name/breed/dob/personality to users/{uid}/stagedDogs/{stableHash}.
 * No PINs, family invitation codes, images, posts, schedules, owner names or backups are uploaded.
 * Does not alter local records or sync ongoing changes.
 */
import {getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,collection,onSnapshot,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app=getApps().find(a=>a.name==='daily-tail-multi-dev');
if(!app)throw Error('My Dogs Firebase development account adapter is not available.');
const auth=getAuth(app),db=getFirestore(app), $=id=>document.getElementById(id);
let account=null,backup=null,selection=-1,cloud=[],stopCloud=null,busy=false;
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function say(message,bad=false){const label=$('dtStageStatus');if(label){label.textContent=message;label.style.color=bad?'#a12929':'#275f43'}}
function ensure(){
 const host=$('dtMultiPanel');if(!host)return null;
 let panel=$('dtStagePanel');
 if(!panel||!host.contains(panel)){
   panel=document.createElement('section');panel.id='dtStagePanel';
   panel.style.cssText='border-top:2px solid #aac3ce;padding-top:13px;margin-top:18px;font:14px/1.5 Arial,sans-serif';
   host.append(panel);
 }
 return panel;
}
function safeDate(value){const s=String(value||'');return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function extract(fileData){
 if(!fileData||fileData.format!=='daily-tail-complete-backup-v1'||!fileData.data||typeof fileData.data!=='object')throw Error('This is not a complete Daily Tail backup file.');
 const raw=fileData.data.daily_tail_roles_v2;
 if(typeof raw!=='string')throw Error('The backup does not contain dog profiles.');
 const parsed=JSON.parse(raw);
 if(!parsed||!Array.isArray(parsed.dogs))throw Error('No valid dog profiles were found.');
 const pets=parsed.dogs.filter(d=>d&&typeof d.id==='string'&&typeof d.name==='string').map(d=>{
   const meta=d.meta&&typeof d.meta==='object'?d.meta:{};
   const personal=d.profile&&typeof d.profile==='object'?d.profile:{};
   return {sourceId:d.id,name:String(d.name).slice(0,40),breed:String(meta.breed||'').slice(0,60),dob:safeDate(meta.dob),personality:String(meta.personality||'').slice(0,180),
     postCount:Array.isArray(personal.posts)?personal.posts.length:0,hasPhoto:!!personal.profile};
 });
 if(pets.length===0)throw Error('No dog profiles were found in this backup.');
 return pets;
}
async function stableId(sourceId){
 const data=new TextEncoder().encode(account.uid+':daily-tail-backup-dog:'+sourceId);
 const digest=await crypto.subtle.digest('SHA-256',data);
 return 'import-'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,40);
}
function renderCloudList(){
 const list=$('dtStageCloudList');if(!list)return;
 list.replaceChildren();
 const heading=document.createElement('strong');heading.textContent='Private staged cloud profiles ('+cloud.length+')';
 list.append(heading);
 if(!cloud.length){const empty=document.createElement('p');empty.textContent='No staged profiles yet.';list.append(empty);return}
 cloud.forEach(d=>{
   const item=document.createElement('div');item.style.cssText='padding:8px;margin:5px 0;background:white;border:1px solid #bdd0d9;border-radius:8px';
   const title=document.createElement('strong');title.textContent=String(d.name||'Unnamed');
   const extra=document.createElement('small');extra.textContent='  '+String(d.breed||'')+' · Staged only, not shared';
   item.append(title,extra);list.append(item);
 });
}
function paint(){
 const panel=ensure();if(!panel)return;
 if(!account){
   panel.innerHTML='<h3 style="margin:0">Private profile migration preview</h3><p>Sign into Firebase above to view the private cloud staging area.</p>';
   return;
 }
 const options=backup?.pets||[];
 panel.innerHTML='<h3 style="margin:0 0 7px">Private profile migration preview <small style="font-size:11px">DEVELOPMENT ONLY</small></h3>'+
 '<p>Select a <strong>private Daily Tail backup file</strong> to inspect profiles before an optional, limited upload. Your backup stays on this device. No uploads occur when you select a file.</p>'+
 '<label style="display:block;font-weight:700">Choose a backup (.json)<input type="file" id="dtStageFile" accept=".json,application/json" style="display:block;width:100%;margin:6px 0"></label>'+
 '<div id="dtStagePreview">'+(options.length?'<label style="display:block;font-weight:700">Choose dog to preview<select id="dtStageSelect" style="width:100%;padding:10px;margin:6px 0">'+options.map((d,i)=>'<option value="'+i+'" '+(i===selection?'selected':'')+'>'+safe(d.name)+'</option>').join('')+'</select></label><div id="dtStageFields"></div>':'<p>No backup loaded. Please keep an original backup somewhere safe.</p>')+'</div>'+
 '<div style="background:#fff9e8;border:1px solid #d4bf91;padding:10px;border-radius:10px;margin-top:12px"><strong>Will NOT upload:</strong> Photos, memories, daily plans, PINs, usernames, access codes, emergency contacts, other browser records, or the backup file itself. Uploading is an explicit separate step.</div>'+
 '<div id="dtStageCloudList" style="margin-top:12px"></div>'+
 '<p id="dtStageStatus" role="status" aria-live="polite"></p>';
 renderCloudList();
 const file=$('dtStageFile'); file.onchange=async()=>{
   backup=null;selection=-1;
   if(!file.files?.[0]){paint();return}
   const item=file.files[0];
   if(item.size>35*1024*1024){paint();say('This backup is too large for the preview. No data was uploaded.',true);return}
   try{const obj=JSON.parse(await item.text()),pets=extract(obj);backup={pets};selection=0;paint();say('Backup parsed locally. Choose a dog and review the fields. Nothing has been uploaded.')}
   catch(e){paint();say('Unable to preview backup: '+String(e.message||e),true)}
 };
 if(options.length){
   $('dtStageSelect').onchange=e=>{selection=Number(e.target.value);renderFields()};
   renderFields();
 }
}
function renderFields(){
 const dog=backup?.pets[selection];const target=$('dtStageFields');if(!dog||!target)return;
 target.innerHTML='<p><strong>Selected local dog:</strong> '+safe(dog.name)+
 ' | '+dog.postCount+' memory post(s) | '+(dog.hasPhoto?'Has a profile picture':'No profile picture')+'</p>'+
 '<p>You can review or correct the four fields below before uploading them.</p>'+
 '<form id="dtStageForm"><label style="display:block;font-weight:700">Name<input id="dtStageName" maxlength="40" required style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Breed<input id="dtStageBreed" maxlength="60" style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Birthday<input id="dtStageDob" type="date" style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Personality<input id="dtStagePersonality" maxlength="180" style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:flex;gap:8px;align-items:start;margin:10px 0"><input id="dtStageApproval" type="checkbox" style="margin-top:4px"> <span>I confirm I have kept my original backup, I reviewed these fields, and I want to save only these details in my private Firebase account.</span></label>'+
 '<button type="submit" id="dtStageUpload" style="background:#365b73;color:white">Stage this dog profile in cloud</button></form>';
 $('dtStageName').value=dog.name;$('dtStageBreed').value=dog.breed;$('dtStageDob').value=dog.dob;$('dtStagePersonality').value=dog.personality;
 $('dtStageForm').onsubmit=async e=>{
   e.preventDefault();if(busy)return;
   if(!$('dtStageApproval').checked){say('Confirm that your original backup is safe before proceeding.',true);return}
   const name=$('dtStageName').value.trim().slice(0,40),breed=$('dtStageBreed').value.trim().slice(0,60),dob=$('dtStageDob').value,personality=$('dtStagePersonality').value.trim().slice(0,180);
   if(!name|| (dob&&!safeDate(dob))){say('Check the name and birthday.',true);return}
   if(!confirm('Save ONLY '+name+', breed, birthday, and personality to your private Firebase account? This will not modify your existing Daily Tail data or publish a friend profile.'))return;
   const owner=account.uid,before=selection,sourceId=dog.sourceId;
   busy=true;$('dtStageUpload').disabled=true;
   try{
     const id=await stableId(sourceId);
     if(owner!==account?.uid||before!==selection)throw Error('Account or selection changed. Please try again.');
     const ref=doc(db,'users',owner,'stagedDogs',id);
     await runTransaction(db,async tx=>{
       const previous=await tx.get(ref);
       if(previous.exists())throw Error('This local dog has already been staged. Nothing was overwritten.');
       tx.set(ref,{name,breed,dob,personality,type:'private-staged-profile-v1',createdAt:serverTimestamp(),status:'staged',shared:false});
     });
     say('Staged profile saved privately. Your original local profile and backup were not changed.');
   }catch(e){say(String(e.message||e),true)}
   finally{busy=false;if($('dtStageUpload'))$('dtStageUpload').disabled=false}
 };
}
function init(){
 const poll=()=>{if(ensure())paint()};
 const observer=new MutationObserver(mutations=>{
   // Only repaint if the main cloud panel has itself been replaced.
   if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&n.id==='dtMultiPanel')))poll();
 });
 observer.observe($('dtGateContent'),{childList:true});
 onAuthStateChanged(auth,user=>{
   if(stopCloud){stopCloud();stopCloud=null}
   account=user;backup=null;selection=-1;cloud=[];paint();
   if(!user)return;
   stopCloud=onSnapshot(collection(db,'users',user.uid,'stagedDogs'),snapshot=>{
     if(account?.uid!==user.uid)return;
     cloud=snapshot.docs.map(d=>d.data()).filter(d=>d.type==='private-staged-profile-v1');
     // Keep the locally parsed backup and the user's unsaved field edits intact.
     renderCloudList();
   },e=>say('Private staging list could not load: '+String(e.message||e),true));
 });
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
