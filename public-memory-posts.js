/* Only explicitly shared memory fields are published. */
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(id);
function safeVideoRef(ref){
 if(!ref||![ref.ownerUid,ref.dogId,ref.id].every(validId))return null;
 return {ownerUid:ref.ownerUid,dogId:ref.dogId,id:ref.id};
}
export function sharedVideoIds(posts,ownerUid,dogId){
 return posts.map(post=>post.videoUpload).filter(ref=>ref?.ownerUid===ownerUid&&ref.dogId===dogId).map(ref=>ref.id);
}
export async function publicMemoryPosts(posts){
 async function photo(value){
  if(typeof value!=='string'||!/^data:image\/(png|jpeg|webp);base64,/i.test(value))return '';
  if(value.length<45000)return value;
  return new Promise(resolve=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');const scale=Math.min(1,480/image.width,480/image.height);canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.65))};image.onerror=()=>resolve('');image.src=value});
 }
 return Promise.all((Array.isArray(posts)?posts:[]).map(async p=>({id:String(p.id||''),authorName:String(p.authorName||'').trim().slice(0,100),likes:Math.max(0,Number(p.likes)||0),comments:(Array.isArray(p.comments)?p.comments:[]).filter(c=>typeof c==='string').map(c=>c.slice(0,280)),title:String(p.title||'').slice(0,180),story:String(p.story||p.text||p.caption||'').slice(0,2000),text:String(p.story||p.text||p.caption||'').slice(0,700),...(safeVideoRef(p.videoUpload)?{videoUpload:safeVideoRef(p.videoUpload)}:{}),photo:await photo(p.photo),video:window.DailyTalesMemoryVideo?.(p.video)?.url||'',date:String(p.date||'').slice(0,50)})));
}