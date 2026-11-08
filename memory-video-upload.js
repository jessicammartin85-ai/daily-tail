import {dailyTalesAuth as auth} from './cloud-dog-store.js';
import {
 Bytes, doc, getDocFromServer, getFirestore, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const db=getFirestore(auth.app);
const partSize=700*1024;
const maxSize=5*1024*1024;
const formats={mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',mov:'video/quicktime'};
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(id);
const videoRef=(ownerUid,dogId,id)=>doc(db,'users',ownerUid,'dogVideos',dogId,'uploads',id);
const partRef=(ref,index)=>doc(ref,'parts',String(index));

export function validateVideo(file){
 const type=formats[file.name.split('.').pop().toLowerCase()];
 if(!type||!file.size)throw Error('Choose an MP4, M4V, MOV, or WebM video.');
 if(file.size>maxSize)throw Error('Choose a video up to 5 MB. You can trim the clip or use a video link.');
 return type;
}

export async function uploadVideo(file,ownerUid,dogId){
 const type=validateVideo(file);
 await auth.authStateReady();
 const uploader=auth.currentUser?.uid;
 if(!uploader||!validId(ownerUid)||!validId(dogId))throw Error('Sign in and open your synced dog profile to upload a video.');
 const id=crypto.randomUUID(),ref=videoRef(ownerUid,dogId,id),batch=writeBatch(db);
 const count=Math.ceil(file.size/partSize);
 batch.set(ref,{uploader,type,count,size:file.size});
 for(let index=0;index<count;index++){
  const data=await file.slice(index*partSize,(index+1)*partSize).arrayBuffer();
  batch.set(partRef(ref,index),{data:Bytes.fromUint8Array(new Uint8Array(data))});
 }
 try{await batch.commit()}
 catch(error){
  if(error.code==='permission-denied')throw Error('Video uploads are unavailable for this account. Check your dog access or use a video link.');
  throw Error('The upload could not finish. Please try again.');
 }
 return {ownerUid,dogId,id};
}

export async function readVideo({ownerUid,dogId,id}){
 if(![ownerUid,dogId,id].every(validId))throw Error('Invalid video reference.');
 await auth.authStateReady();
 const ref=videoRef(ownerUid,dogId,id),record=(await getDocFromServer(ref)).data();
 if(!record||!Object.values(formats).includes(record.type)||!Number.isInteger(record.size)||
    record.size<1||record.size>maxSize||record.count!==Math.ceil(record.size/partSize)){
  throw Error('Video is unavailable.');
 }
 const parts=await Promise.all(Array.from({length:record.count},async(_,index)=>{
  const part=(await getDocFromServer(partRef(ref,index))).data()?.data;
  const expected=Math.min(partSize,record.size-index*partSize);
  if(!(part instanceof Bytes)||part.toUint8Array().length!==expected)throw Error('Video is incomplete.');
  return part.toUint8Array();
 }));
 return new Blob(parts,{type:record.type});
}
