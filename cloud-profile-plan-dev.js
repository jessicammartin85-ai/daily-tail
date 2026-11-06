/* DEVELOPMENT ONLY: additional profile, schedule and local migration inventory for fictional dogs.
   No migration/upload of local data. Only writes to users/{uid}/cloudTestDogs/{dogId}
   and users/{uid}/cloudTestDogs/{dogId}/plan/{taskId}.
*/
import {getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,query,onSnapshot,addDoc,updateDoc,deleteDoc,serverTimestamp,runTransaction} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app=getApps().find(a=>a.name==='daily-tail-multi-dev');
if(!app)throw Error('Development cloud account module is missing');
const auth=getAuth(app),db=getFirestore(app);
let uid=null,chosenId=null,dog=null,plan=[],stopDog=null,stopPlan=null,session=0,working=false,inventoryOpen=false;
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dogRef=()=>doc(db,'users',uid,'cloudTestDogs',chosenId);
const planCol=()=>collection(db,'users',uid,'cloudTestDogs',chosenId,'plan');
const err=error=>String(error?.message||error).slice(0,240);
function status(text,bad=false){const el=$('dtCloudDetailStatus');if(el){el.textContent=text;el.style.color=bad?'#9e302b':'#315947'}}
function getPanel(){
 const host=$('dtMultiPanel');if(!host)return null;
 let section=$('dtCloudDetailPanel');
 if(!section||!host.contains(section)){
   section=document.createElement('section');section.id='dtCloudDetailPanel';
   section.style.cssText='border-top:2px solid #aac3ce;margin-top:16px;padding-top:12px;font:14px/1.45 Arial,sans-serif';
   host.append(section);
 }
 return section;
}
function showInventory(){
 const box=$('dtCloudInventoryResult');if(!box)return;
 if(!inventoryOpen){box.textContent='';return}
 try{
   const raw=localStorage.getItem('daily_tail_roles_v2');
   const data=raw?JSON.parse(raw):null;
   const dogs=Array.isArray(data?.dogs)?data.dogs:[];
   const names=dogs.map(d=>String(d.name||'Unnamed local dog').slice(0,50));
   const postCount=dogs.reduce((n,d)=>n+(Array.isArray(d.profile?.posts)?d.profile.posts.length:0),0);
   box.replaceChildren();
   const summary=document.createElement('p');
   summary.textContent='Local-only preview: '+dogs.length+' dog profile(s), '+postCount+' stored memory post(s).';
   const detail=document.createElement('p');detail.textContent=names.length?'Local dog names: '+names.join(', '):'No local dog profiles detected in this browser.';
   const warning=document.createElement('small');
   warning.textContent='This is only an inventory. Nothing is uploaded, transferred, erased, or linked to Firebase. Daily Plan records and photos still require separate verification before migration.';
   box.append(summary,detail,warning);
 }catch(e){box.textContent='Could not safely inspect local data in this browser. No changes were made.'}
}
function redraw(){
 const root=getPanel();if(!root)return;
 if(!uid){
   root.innerHTML='<h3 style="margin:0">Profile & Daily Plan test</h3><p>Sign into Cloud My Dogs above to work with fictional test dogs.</p>';
   return;
 }
 const current=dog&&chosenId;
 const tasks=plan.map(p=>'<div style="border:1px solid #c4d7e1;border-radius:9px;background:white;padding:9px;margin:5px 0;display:flex;gap:8px;align-items:center"><label style="flex:1;display:flex;gap:8px;align-items:center"><input type="checkbox" data-complete="'+safe(p.id)+'" '+(p.done?'checked':'')+'><span>'+safe(p.time)+' · '+safe(p.title)+'</span></label><button type="button" data-delete-task="'+safe(p.id)+'" style="padding:6px">Remove</button></div>').join('');
 root.innerHTML='<h3 style="margin:0 0 6px">Cloud profile + Daily Plan <small style="font-size:11px">TEST ONLY</small></h3>'+
 (current?
 '<p>Selected fictional dog: <strong>'+safe(dog.name||'Test dog')+'</strong>. Changes are saved to this Firebase account only.</p>'+
 '<form id="dtCloudProfileForm">'+
 '<label style="display:block;font-weight:700">Breed<input id="dtCloudBreed" maxlength="60" placeholder="Example breed" style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Birthday<input id="dtCloudDob" type="date" style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Personality<input id="dtCloudPersonality" maxlength="180" placeholder="Example: playful and curious" style="width:100%;box-sizing:border-box"></label>'+
 '<button type="submit">Save cloud profile details</button></form>'+
 '<h4 style="margin:15px 0 4px">Cloud Daily Plan ('+plan.length+')</h4>'+ (tasks||'<p>No test activities added yet.</p>')+
 '<form id="dtCloudTaskForm" style="margin-top:8px"><label style="display:block;font-weight:700">Activity title<input id="dtCloudTaskTitle" maxlength="90" placeholder="Example: Practice sit" required style="width:100%;box-sizing:border-box"></label>'+
 '<label style="display:block;font-weight:700">Time<input id="dtCloudTaskTime" type="time" required style="width:100%;box-sizing:border-box"></label>'+
 '<button type="submit">Add activity</button></form>'+
 '<small>Changes appear on other signed-in devices. This test uses individual activity records, but simultaneous edits to the same item still need conflict testing.</small>'
 :'<p>Select a fictional dog from the cloud list above to edit its profile and activities.</p>')+
 '<div style="border-top:1px solid #b1c5ce;margin-top:15px;padding-top:10px"><button type="button" id="dtCloudInventoryBtn" style="background:#f9f5ee;color:#385269;border:1px solid #9fb6c0">Preview existing local data (no upload)</button><div id="dtCloudInventoryResult"></div></div>'+
 '<p id="dtCloudDetailStatus" role="status" aria-live="polite" style="font-weight:700"></p>';
 if(!current)return;
 $('dtCloudBreed').value=String(dog.breed||'');
 $('dtCloudDob').value=/^\d{4}-\d{2}-\d{2}$/.test(dog.dob||'')?dog.dob:'';
 $('dtCloudPersonality').value=String(dog.personality||'');
 $('dtCloudProfileForm').onsubmit=async e=>{
   e.preventDefault();if(working)return;
   const breed=$('dtCloudBreed').value.trim().slice(0,60),dob=$('dtCloudDob').value,personality=$('dtCloudPersonality').value.trim().slice(0,180);
   working=true;status('Saving test profile…');
   try{
     await updateDoc(dogRef(),{breed,dob,personality,profileUpdatedAt:serverTimestamp()});
     status('Profile details saved.');
   }catch(e){status(err(e),true)}finally{working=false}
 };
 $('dtCloudTaskForm').onsubmit=async e=>{
   e.preventDefault();if(working)return;
   if(plan.length>=30){status('Maximum 30 test plan activities per dog.',true);return}
   const title=$('dtCloudTaskTitle').value.trim().slice(0,90),time=$('dtCloudTaskTime').value;
   if(!title||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){status('Enter an activity and a valid time.',true);return}
   working=true;
   try{
     await addDoc(planCol(),{title,time,done:false,type:'development-test-activity',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
     status('Activity added to the cloud Daily Plan.');
   }catch(e){status(err(e),true)}finally{working=false}
 };
 root.querySelectorAll('[data-complete]').forEach(check=>check.onchange=async()=>{
   const id=check.dataset.complete,done=check.checked;check.disabled=true;
   try{await updateDoc(doc(planCol(),id),{done,updatedAt:serverTimestamp()});status('Activity completion synchronized.')}
   catch(e){check.checked=!done;status(err(e),true)}finally{check.disabled=false}
 });
 root.querySelectorAll('[data-delete-task]').forEach(btn=>btn.onclick=async()=>{
   const id=btn.dataset.deleteTask;if(!confirm('Remove this fictional test activity?'))return;
   try{await deleteDoc(doc(planCol(),id));status('Test activity removed.')}catch(e){status(err(e),true)}
 });
}
function changeSelection(event){
 const choice=event?.detail||window.DailyTailDevSelection;
 const newId=choice?.uid===uid?choice?.dogId:null;
 if(newId===chosenId)return;
 session++;const version=session;
 if(stopDog){stopDog();stopDog=null}if(stopPlan){stopPlan();stopPlan=null}
 chosenId=newId;dog=null;plan=[];redraw();
 if(!uid||!chosenId)return;
 stopDog=onSnapshot(dogRef(),snap=>{
   if(version!==session)return;
   if(!snap.exists()||snap.data().type!=='development-test-only'){dog=null;redraw();return}
   dog={id:snap.id,...snap.data()};redraw();
 },e=>status('Profile read failed: '+err(e),true));
 stopPlan=onSnapshot(planCol(),snapshot=>{
   if(version!==session)return;
   plan=snapshot.docs.map(p=>({id:p.id,...p.data()})).filter(p=>p.type==='development-test-activity')
     .sort((a,b)=>(a.time||'').localeCompare(b.time||'')||(a.title||'').localeCompare(b.title||''));
   redraw();
 },e=>status('Daily Plan read failed: '+err(e),true));
}
window.addEventListener('daily-tail-dev-selection',changeSelection);
onAuthStateChanged(auth,newUser=>{
 uid=newUser?.uid||null;chosenId=null;session++;
 if(stopDog){stopDog();stopDog=null}if(stopPlan){stopPlan();stopPlan=null}
 dog=null;plan=[];inventoryOpen=false;
 redraw();changeSelection({detail:window.DailyTailDevSelection});
});
