/* Shared read-only Memories sheet used by preview and public Friend View. */
(function(){
 const style=document.createElement('style');style.textContent='.dt-memory-video{display:block;width:100%;max-height:65vh;background:#152537;border-radius:10px;margin:10px 0}.feed .post.dt-shared-post{display:block!important;overflow:hidden;border-radius:16px;background:#fff9ee;margin:12px 0;border:1px solid #c5d3dd}.feed .dt-shared-post>img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;border-radius:0!important}.feed .dt-shared-post .post-body{padding:16px}.dt-memory-byline{display:block;font:12px/1.4 Arial,sans-serif;color:#556875;margin:3px 0 6px}.feed .dt-shared-post p{display:block!important;white-space:pre-wrap!important;overflow:visible!important;-webkit-line-clamp:unset!important;font:16px/1.5 Arial,sans-serif}';document.head.append(style);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.DailyTalesMemoryVideo=value=>{
  const input=String(value??'').trim();
  if(!input||input.length>2048)return null;
  try{
   const url=new URL(input);
   if(url.protocol!=='https:'||url.username||url.password)return null;
   const host=url.hostname;
   const id=host==='youtu.be'?url.pathname.split('/')[1]:
    ['youtube.com','www.youtube.com','m.youtube.com'].includes(host)?
    (url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:shorts|live)\/([^/]+)\/?$/)?.[1]):'';
   if(/^[\w-]{11}$/.test(id||''))return {url:'https://www.youtube.com/watch?v='+id,inline:false};
   if(/\.(mp4|webm|m4v)$/i.test(url.pathname))return {url:url.href,inline:true};
  }catch{}
  return null;
 };
 customElements.define('dt-uploaded-video',class extends HTMLElement{
  connectedCallback(){
   const button=document.createElement('button');
   button.type='button';button.className='small';button.textContent='▶ Play uploaded video';
   const status=document.createElement('p');status.setAttribute('role','status');
   status.hidden=true;
   this.replaceChildren(button,status);
   button.onclick=async()=>{
    button.disabled=true;status.hidden=false;status.textContent='Loading video…';
    try{
     const {readVideo}=await import('./memory-video-upload.js?v=2');
     const blob=await readVideo(this.dataset);
     if(!this.isConnected||!this.contains(button))return;
     this.url=URL.createObjectURL(blob);
     const video=document.createElement('video');
     video.className='dt-memory-video';video.controls=true;video.playsInline=true;
     video.setAttribute('aria-label','Uploaded memory video');
     video.onerror=()=>{status.hidden=false;status.textContent='This video format cannot play in this browser.';};
     video.src=this.url;
     button.replaceWith(video);status.hidden=true;
     void video.play().catch(()=>{});
    }catch{
     status.textContent='This video could not be loaded. Try again.';
     button.disabled=false;
    }
   };
  }
  disconnectedCallback(){
   this.querySelector('video')?.pause();
   if(this.url)URL.revokeObjectURL(this.url);
   this.url=null;
  }
 });
 window.DailyTalesRenderMemoryVideo=(value,upload)=>{
  const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(value);
  const attached=upload&&[upload.ownerUid,upload.dogId,upload.id].every(id)
   ?`<dt-uploaded-video data-owner-uid="${upload.ownerUid}" data-dog-id="${upload.dogId}" data-id="${upload.id}"></dt-uploaded-video>`:'';

  const video=window.DailyTalesMemoryVideo(value);
  if(!video)return attached;
  return attached+(video.inline
   ?`<video class="dt-memory-video" controls playsinline preload="none" src="${safe(video.url)}" aria-label="Memory video"></video>`
   :`<p><a href="${safe(video.url)}" target="_blank" rel="noopener noreferrer">▶ Watch video on YouTube</a></p>`);
 };
 window.DailyTalesSharedMemories=(posts,name,show)=>{
 const image=v=>typeof v==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(v)?v:'';
 const cards=posts.map(post=>`<article class="post dt-shared-post">${image(post.photo)?`<img src="${safe(image(post.photo))}" alt="Memory photo">`:''}<div class="post-body"><time>${safe(post.date&&!isNaN(new Date(post.date))?new Date(post.date).toLocaleDateString():'')}</time><h3>${safe(post.title||'Memory')}</h3>${post.authorName?`<small class="dt-memory-byline">By ${safe(post.authorName)}</small>`:''}${post.story||post.text?`<p>${safe(post.story||post.text)}</p>`:''}${window.DailyTalesRenderMemoryVideo(post.video,post.videoUpload)}</div></article>`).join('');
 show('Shared memories',`<p class="intro">Moments ${safe(name||'this dog')}'s family has chosen to share.</p><div class="feed">${cards||'<div class="empty"><strong>No shared memories yet.</strong><p>Check back for new moments.</p></div>'}</div>`, 'friend-feed');
 window.DailyTalesVisiblePosts=posts;
 queueMicrotask(()=>window.DailyTalesEnhancePostFeed?.(posts));
 };
})();