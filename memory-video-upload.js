import {dailyTalesAuth as auth} from './cloud-dog-store.js';
import {
 Bytes, deleteDoc, doc, getDocFromServer, getFirestore, setDoc, updateDoc, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const db=getFirestore(auth.app);
const partSize=700*1024;
const maxSize=100*1024*1024;
const partsPerBatch=6;
const formats={mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',mov:'video/quicktime'};
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(id);
const videoRef=(ownerUid,dogId,id)=>doc(db,'users',ownerUid,'dogVideos',dogId,'uploads',id);
const partRef=(ref,index)=>doc(ref,'parts',String(index));

export function validateVideo(file){
 const extension=file.name.split('.').pop().toLowerCase();
 const type=Object.hasOwn(formats,extension)?formats[extension]:'';
 if(!type||!file.size)throw Error('Choose an MP4, M4V, MOV, or WebM video.');
 return type;
}

export async function uploadVideo(file,ownerUid,dogId,onStatus){
 const type=validateVideo(file);
 if(file.size>maxSize)throw Error('Choose a video up to 100 MB.');
 await auth.authStateReady();
 const uploader=auth.currentUser?.uid;
 if(!uploader||!validId(ownerUid)||!validId(dogId))throw Error('Sign in and open your synced dog profile to upload a video.');
 const id=crypto.randomUUID(),ref=videoRef(ownerUid,dogId,id);
 const count=Math.ceil(file.size/partSize);
 let staged=false,attemptedParts=0;
 onStatus?.('Uploading video…');
 try{
  await setDoc(ref,{uploader,type,count,size:file.size,ready:false});
  staged=true;
  for(let start=0;start<count;start+=partsPerBatch){
   const batch=writeBatch(db),end=Math.min(start+partsPerBatch,count);
   for(let index=start;index<end;index++){
    const data=await file.slice(index*partSize,(index+1)*partSize).arrayBuffer();
    batch.set(partRef(ref,index),{data:Bytes.fromUint8Array(new Uint8Array(data))});
   }
   attemptedParts=end;
   await batch.commit();
   onStatus?.(`Uploading video… ${Math.round(end/count*100)}%`);
  }
  await updateDoc(ref,{ready:true});
 }catch(error){
  if(staged){
   try{
    const record=(await getDocFromServer(ref)).data();
    if(record?.ready===true)return {ownerUid,dogId,id};
    for(let start=0;start<attemptedParts;start+=partsPerBatch){
     const batch=writeBatch(db),end=Math.min(start+partsPerBatch,attemptedParts);
     for(let index=start;index<end;index++)batch.delete(partRef(ref,index));
     await batch.commit();
    }
    await deleteDoc(ref);
   }catch(cleanupError){console.warn('Could not clear unfinished video upload.',cleanupError);}
  }
  if(error.code==='permission-denied')throw Error('Video uploads are unavailable for this account. Check your dog access or use a video link.');
  throw Error('The upload could not finish. Please try again.');
 }
 return {ownerUid,dogId,id};
}

export async function readVideo({ownerUid,dogId,id}){
 if(![ownerUid,dogId,id].every(validId))throw Error('Invalid video reference.');
 await auth.authStateReady();
 const ref=videoRef(ownerUid,dogId,id),record=(await getDocFromServer(ref)).data();
 if(!record||record.ready===false||!Object.values(formats).includes(record.type)||!Number.isInteger(record.size)||
    record.size<1||record.size>maxSize||record.count!==Math.ceil(record.size/partSize)){
  throw Error('Video is unavailable.');
 }
 const parts=[];
 for(let start=0;start<record.count;start+=partsPerBatch){
  const length=Math.min(partsPerBatch,record.count-start);
  const group=await Promise.all(Array.from({length},async(_,offset)=>{
   const index=start+offset;
   const part=(await getDocFromServer(partRef(ref,index))).data()?.data;
   const expected=Math.min(partSize,record.size-index*partSize);
   if(!(part instanceof Bytes)||part.toUint8Array().length!==expected)throw Error('Video is incomplete.');
   return part.toUint8Array();
  }));
  parts.push(...group);
 }
 return new Blob(parts,{type:record.type});
}
