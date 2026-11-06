/* Shared read-only Memories sheet used by preview and public Friend View. */
(function(){
 const style=document.createElement('style');style.textContent='.feed .post.dt-shared-post{display:block!important;overflow:hidden;border-radius:16px;background:#fff9ee;margin:12px 0;border:1px solid #c5d3dd}.feed .dt-shared-post>img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;border-radius:0!important}.feed .dt-shared-post .post-body{padding:16px}.feed .dt-shared-post p{display:block!important;white-space:pre-wrap!important;overflow:visible!important;-webkit-line-clamp:unset!important;font:16px/1.5 Arial,sans-serif}';document.head.append(style);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.DailyTalesSharedMemories=(posts,name,show)=>{
 const image=v=>typeof v==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(v)?v:'';
 const cards=posts.map(post=>`<article class="post dt-shared-post">${image(post.photo)?`<img src="${safe(image(post.photo))}" alt="Memory photo">`:''}<div class="post-body"><time>${safe(post.date&&!isNaN(new Date(post.date))?new Date(post.date).toLocaleDateString():'')}</time><h3>${safe(post.title||'Memory')}</h3>${post.story||post.text?`<p>${safe(post.story||post.text)}</p>`:''}</div></article>`).join('');
 show('Shared memories',`<p class="intro">Moments ${safe(name||'this dog')}'s family has chosen to share.</p><div class="feed">${cards||'<div class="empty"><strong>No shared memories yet.</strong><p>Check back for new moments.</p></div>'}</div>`, 'friend-feed');
 window.DailyTalesVisiblePosts=posts;
 queueMicrotask(()=>window.DailyTalesEnhancePostFeed?.(posts));
 };
})();