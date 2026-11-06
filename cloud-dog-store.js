/**
 * Daily Tales cloud dog repository (v2).
 * Stores each dog independently. Never copies local PINs, owner access codes,
 * invitations, or another account's records into a shared dog document.
 * This is the persistence layer; UI must call migrateDogs explicitly after
 * the owner confirms which local profiles to claim.
 */
import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, onSnapshot,
  writeBatch, runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const config = {
  apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',
  authDomain:'daily-tail.firebaseapp.com',
  projectId:'daily-tail',
  storageBucket:'daily-tail.firebasestorage.app',
  messagingSenderId:'789609946634',
  appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'
};
const app=getApps().find(x=>x.name==='daily-tail-cloud')||initializeApp(config,'daily-tail-cloud');
const auth=getAuth(app),db=getFirestore(app);
const CHUNK=125000,MAX_CHUNKS=250;
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{3,128}$/.test(id);
const safeString=(v,n=300)=>String(v??'').slice(0,n);
const jsonClone=value=>JSON.parse(JSON.stringify(value??{}));
const dogPath=(uid,id)=>doc(db,'users',uid,'dogsV2',id);
const ownerDogs=uid=>collection(db,'users',uid,'dogsV2');
function assertAccount(){
 const u=auth.currentUser;
 if(!u)throw Error('Sign in to your Daily Tales account first.');
 return u.uid;
}
function validateDog(d){
 if(!d||!validId(d.id))throw Error('Invalid dog identifier.');
 if(!safeString(d.name,80).trim())throw Error('Every dog needs a name.');
}
function publicSafeDog(d){
 validateDog(d);
 // Do not put any invitation codes, PIN hashes, access users, or privileges
 // into the dog payload. They live in protected membership documents.
 const profile=jsonClone(d.profile);
 const meta=jsonClone(d.meta);
 return {
   id:d.id,name:safeString(d.name,80),profile,meta,
   ownerDisplay:safeString(d.owner,80)
 };
}
const chunkJson=value=>{
 const json=JSON.stringify(value);
 const parts=json.match(/[\s\S]{1,125000}/g)||['{}'];
 if(parts.length>MAX_CHUNKS)throw Error('This dog exceeds cloud document limits. Reduce large embedded photos before migrating.');
 return parts;
};
/** Read complete, versioned dog data. */
export async function readDog(id, uid=assertAccount()){
 if(!validId(id))throw Error('Invalid dog identifier.');
 const head=await getDoc(dogPath(uid,id));
 if(!head.exists())return null;
 const v=head.data(),parts=[];
 if(!Number.isInteger(v.parts)||v.parts<1||v.parts>MAX_CHUNKS||!validId(v.version))
   throw Error('Dog cloud record is incomplete.');
 for(let i=0;i<v.parts;i++){
   const part=await getDoc(doc(db,'users',uid,'dogsV2',id,'versions',v.version,'parts',String(i).padStart(4,'0')));
   if(!part.exists())throw Error('Missing dog data part '+i+'. The existing data was not changed.');
   parts.push(part.data().value);
 }
 const dog=JSON.parse(parts.join(''));
 validateDog(dog);
 if(dog.id!==id)throw Error('Dog record identity mismatch.');
 return {...dog,revision:v.revision,updatedAt:v.updatedAt};
}
/**
 * Atomic compare-and-set. A concurrent remote edit is never silently replaced.
 * The version changes only after all data chunks have been committed.
 */
export async function saveDog(input, expectedRevision=null){
 const uid=assertAccount(),dog=publicSafeDog(input),target=dogPath(uid,dog.id);
 const pieces=chunkJson(dog);
 const revision=await runTransaction(db,async tx=>{
   const current=await tx.get(target),old=current.exists()?current.data():null;
   if(expectedRevision===null&&old)throw Error('This dog already exists in the cloud. Open the saved profile instead of replacing it.');
   if(expectedRevision!==null&&(!old||old.revision!==expectedRevision))
     throw Error('Another device updated this dog. Reload and review the latest version before saving.');
   const version='v'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
   pieces.forEach((value,i)=>{
     const p=doc(db,'users',uid,'dogsV2',dog.id,'versions',version,'parts',String(i).padStart(4,'0'));
     tx.set(p,{value});
   });
   const next=(old?.revision||0)+1;
   tx.set(target,{
     id:dog.id,ownerUid:uid,name:dog.name,
     breed:safeString(dog.meta?.breed,80),
     revision:next,version,parts:pieces.length,
     createdAt:old?.createdAt||serverTimestamp(),
     updatedAt:serverTimestamp(),schema:2
   });
   return next;
 });
 return revision;
}
/** Only owners may claim local dogs. Existing cloud IDs cannot be overwritten. */
export async function migrateDogs(dogs,{onProgress}={}){
 const uid=assertAccount(),results=[];
 if(!Array.isArray(dogs))throw Error('Expected a dog list.');
 for(const raw of dogs){
   const dog=publicSafeDog(raw);
   const existing=await getDoc(dogPath(uid,dog.id));
   if(existing.exists()){
     results.push({id:dog.id,status:'already-in-cloud'});
   }else{
     await saveDog(dog,null);
     results.push({id:dog.id,status:'migrated'});
   }
   if(onProgress)onProgress(results[results.length-1]);
 }
 return results;
}
/** Subscribe to metadata, then separately load verified complete records. */
export function watchDogs(onChange,onError){
 const uid=assertAccount();
 let sequence=0,closed=false;
 const stop=onSnapshot(ownerDogs(uid),async snap=>{
   const mine=++sequence;
   try{
     const dogs=await Promise.all(snap.docs.map(d=>readDog(d.id,uid)));
     if(!closed&&mine===sequence)onChange(dogs.filter(Boolean));
   }catch(e){if(!closed&&onError)onError(e)}
 },e=>{if(!closed&&onError)onError(e)});
 return ()=>{closed=true;stop()};
}
export async function listDogHeaders(){
 const uid=assertAccount();
 const results=await getDocs(ownerDogs(uid));
 return results.docs.map(d=>({id:d.id,...d.data()}));
}
export const dailyTalesCloudDogStore={readDog,saveDog,migrateDogs,watchDogs,listDogHeaders};
