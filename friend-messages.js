import {collection,doc,getDoc,getDocs,setDoc,addDoc,query,where,limit,orderBy,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

export function registerMessaging(db,account,dog){
 return setDoc(doc(db,'messageAccounts',account.uid),{ownerUid:dog.ownerUid||account.uid,dogId:dog.id});
}

export async function approvedConnections(db,uid){
 const requests=collection(db,'friendRequests');
 const results=await Promise.all(['requesterUid','targetOwnerUid'].map(field=>
  getDocs(query(requests,where(field,'==',uid),limit(100)))));
 return results.flatMap(result=>result.docs).filter(entry=>entry.data().status==='approved');
}

export function messageInbox(db,account,connections,preferred,profileName){
 let dialog=document.getElementById('dtMessages');
 if(dialog?.open)dialog.close();
 dialog?.remove();
 dialog=document.createElement('dialog');
 dialog.id='dtMessages';
 dialog.setAttribute('aria-labelledby','dtMessagesTitle');
 dialog.style.cssText='width:min(90vw,450px);max-height:80vh;box-sizing:border-box;padding:20px;border:2px solid #9bb5c4;border-radius:18px;background:#fff9ee;color:#273c4c';
 dialog.innerHTML='<form method="dialog"><button type="submit" style="float:right">Close</button></form><h2 id="dtMessagesTitle">Messages</h2><label>Conversation <select></select></label><div style="max-height:240px;overflow:auto" aria-live="polite"></div><form class="dt-message-compose"><label>Message<textarea rows="3" maxlength="2000" required style="display:block;width:100%;box-sizing:border-box;font-size:16px"></textarea></label><button type="submit">Send</button></form><p role="status"></p>';
 document.body.append(dialog);
 const select=dialog.querySelector('select'),history=dialog.querySelector('div'),form=dialog.querySelector('.dt-message-compose'),input=form.querySelector('textarea'),send=form.querySelector('button'),status=dialog.querySelector('[role=status]');
 for(const entry of connections){
  const data=entry.data(),option=document.createElement('option');
  option.value=entry.id;
  option.textContent=profileName||(data.requesterUid===account.uid?'Friend connection':data.requesterName||'Friend connection');
  select.append(option);
  if(!profileName&&data.requesterUid===account.uid){
   getDoc(doc(db,'directory',data.listingId)).then(listing=>{
    if(listing.exists())option.textContent=listing.data().dogName||option.textContent;
   }).catch(()=>{});
  }
 }
 if(preferred)select.value=preferred;
 let stop=()=>{},thread=null,generation=0;
 function load(){
  const request=++generation;
  stop();
  thread=null;
  form.hidden=true;
  status.textContent='';
  history.textContent='Loading messages…';
  const entry=connections.find(item=>item.id===select.value);
  if(!entry){history.textContent='No approved friend connections yet.';return;}
  const messages=collection(entry.ref,'messages');
  stop=onSnapshot(query(messages,orderBy('createdAt','desc'),limit(50)),snapshot=>{
   if(request!==generation)return;
   history.replaceChildren();
   for(const item of [...snapshot.docs].reverse()){
    const data=item.data(),row=document.createElement('p');
    row.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
    row.textContent=(data.senderUid===account.uid?'You: ':'Friend: ')+data.body;
    history.append(row);
   }
   if(!snapshot.size)history.textContent='No messages yet.';
   history.scrollTop=history.scrollHeight;
   thread=messages;
   form.hidden=false;
  },()=>{
   if(request!==generation)return;
   thread=null;
   form.hidden=true;
   history.textContent='Messaging is unavailable for this connection.';
  });
 }
 select.onchange=()=>{input.value='';load();};
 form.onsubmit=async event=>{
  event.preventDefault();
  const body=input.value.trim(),destination=thread,request=generation;
  if(!destination||!body||send.disabled)return;
  send.disabled=true;
  try{
   await addDoc(destination,{senderUid:account.uid,body,createdAt:serverTimestamp()});
   if(request===generation){input.value='';status.textContent='Message sent.';}
  }catch{
   if(request===generation)status.textContent='Could not send. Your draft is still here.';
  }finally{send.disabled=false;}
 };
 dialog.addEventListener('close',()=>{generation++;stop();dialog.remove();},{once:true});
 load();
 dialog.showModal();
 return dialog;
}
