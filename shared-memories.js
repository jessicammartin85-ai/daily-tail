/* Shared read-only Memories sheet used by preview and public Friend View. */
(function(){
 const style=document.createElement('style');style.textContent='.dt-memory-video{display:block;width:100%;max-height:65vh;background:#152537;border-radius:10px;margin:10px 0}.feed .post.dt-shared-post{display:block!important;overflow:hidden;border-radius:16px;background:#fff9ee;margin:12px 0;border:1px solid #c5d3dd}.feed .dt-shared-post>img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;border-radius:0!important}.feed .dt-shared-post .post-body{padding:16px}.dt-memory-byline{display:block;font:12px/1.4 Arial,sans-serif;color:#556875;margin:3px 0 6px}.feed .dt-shared-post p{display:block!important;white-space:pre-wrap!important;overflow:visible!important;-webkit-line-clamp:unset!important;font:16px/1.5 Arial,sans-serif}';style.textContent += '.dt-video-preview{display:grid;position:relative;place-items:center;width:100%;max-width:360px;aspect-ratio:16/9;margin:10px 0;border:0;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#253b53,#142334);color:white;cursor:pointer;text-decoration:none}.dt-video-preview:focus-visible{outline:3px solid #1875ba;outline-offset:3px}.dt-video-preview img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.dt-video-preview span{position:relative;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#152537df;color:white;font-size:22px}';
 document.head.append(style);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const thumbnail=value=>typeof value==='string'&&value.length<=5000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';
 window.DailyTalesVideoThumbnail=thumbnail;
 window.DailyTalesCaptureVideoThumbnail=file=>new Promise(resolve=>{
  const video=document.createElement('video'),url=URL.createObjectURL(file);
  video.muted=true;video.playsInline=true;video.preload='auto';
  const finish=value=>{
   clearTimeout(timeout);video.onloadeddata=video.onerror=null;
   video.removeAttribute('src');video.load();URL.revokeObjectURL(url);resolve(value);
  };
  const timeout=setTimeout(()=>finish(''),2000);
  video.onerror=()=>finish('');
  video.onloadeddata=()=>{
   let preview='';
   try{
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,224/video.videoWidth,126/video.videoHeight);
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
    canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
    preview=thumbnail(canvas.toDataURL('image/jpeg',.55))||thumbnail(canvas.toDataURL('image/jpeg',.3));
   }catch{}
   finish(preview);
  };
  video.src=url;
 });
 const memoryImage=value=>typeof value==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(value)?value:'';
 const previewContent=src=>`${src?`<img src="${safe(src)}" alt="" loading="lazy" onerror="this.hidden=true">`:''}<span aria-hidden="true">▶</span>`;
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
   if(/^[\w-]{11}$/.test(id||''))return {url:'https://www.youtube.com/watch?v='+id,inline:false,id};
   if(/\.(mp4|webm|m4v)$/i.test(url.pathname))return {url:url.href,inline:true};
  }catch{}
  return null;
 };
 customElements.define('dt-uploaded-video',class extends HTMLElement{
  connectedCallback(){
   const button=document.createElement('button');
   button.type='button';button.className='dt-video-preview';
   button.setAttribute('aria-label','Play memory video');
   button.innerHTML=previewContent(this.dataset.poster);
   const status=document.createElement('p');status.setAttribute('role','status');
   status.hidden=true;
   this.replaceChildren(button,status);
   button.onclick=async()=>{
    button.disabled=true;status.hidden=false;status.textContent='Loading video…';
    try{
     let src=this.dataset.src;
     if(!src){
      const {readVideo}=await import('./memory-video-upload.js?v=2');
      const blob=await readVideo(this.dataset);
      if(!this.isConnected||!this.contains(button))return;
      src=this.url=URL.createObjectURL(blob);
     }
     const video=document.createElement('video');
     video.className='dt-memory-video';video.controls=true;video.playsInline=true;
     video.setAttribute('aria-label','Memory video');
     video.onerror=()=>{status.hidden=false;status.textContent='This video format cannot play in this browser.';};
     video.src=src;
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
 window.DailyTalesRenderMemoryVideo=(value,upload,photo)=>{
  const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(value);
  const fallback=memoryImage(photo);
  const attached=upload&&[upload.ownerUid,upload.dogId,upload.id].every(id)
   ?`<dt-uploaded-video data-owner-uid="${upload.ownerUid}" data-dog-id="${upload.dogId}" data-id="${upload.id}" data-poster="${safe(thumbnail(upload.thumbnail)||fallback)}"></dt-uploaded-video>`:'';
  const video=window.DailyTalesMemoryVideo(value);
  if(!video)return attached;
  return attached+(video.inline
   ?`<dt-uploaded-video data-src="${safe(video.url)}" data-poster="${safe(fallback)}"></dt-uploaded-video>`
   :`<a class="dt-video-preview" href="${safe(video.url)}" aria-label="Watch video on YouTube" target="_blank" rel="noopener noreferrer">${previewContent('https://i.ytimg.com/vi/'+video.id+'/hqdefault.jpg')}</a>`);
 };
 window.DailyTalesSharedMemories=(posts,name,show)=>{
 const image=memoryImage;
 const cards=posts.map(post=>`<article class="post dt-shared-post">${image(post.photo)?`<img src="${safe(image(post.photo))}" alt="Memory photo">`:''}<div class="post-body"><time>${safe(post.date&&!isNaN(new Date(post.date))?new Date(post.date).toLocaleDateString():'')}</time><h3>${safe(post.title||'Memory')}</h3>${post.authorName?`<small class="dt-memory-byline">By ${safe(post.authorName)}</small>`:''}${post.story||post.text?`<p>${safe(post.story||post.text)}</p>`:''}${window.DailyTalesRenderMemoryVideo(post.video,post.videoUpload,post.photo)}</div></article>`).join('');
 show('Shared memories',`<p class="intro">Moments ${safe(name||'this dog')}'s family has chosen to share.</p><div class="feed">${cards||'<div class="empty"><strong>No shared memories yet.</strong><p>Check back for new moments.</p></div>'}</div>`, 'friend-feed');
 window.DailyTalesVisiblePosts=posts;
 queueMicrotask(()=>window.DailyTalesEnhancePostFeed?.(posts));
 };
})();