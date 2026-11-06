/* Shared read-only Memories sheet used by preview and public Friend View. */
(function(){
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.DailyTalesSharedMemories=(posts,name,show)=>{
 const image=v=>typeof v==='string'&&/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(v)?v:'';
 const cards=posts.map(post=>`<article class="post">${image(post.photo)?`<img src="${safe(image(post.photo))}" alt="Memory photo">`:''}<div class="post-body"><time>${safe(post.date&&!isNaN(new Date(post.date))?new Date(post.date).toLocaleDateString():'')}</time><h3>${safe(post.title||'Memory')}</h3>${post.story||post.text?`<p>${safe(post.story||post.text)}</p>`:''}</div></article>`).join('');
 show('Shared memories',`<p class="intro">Moments ${safe(name||'this dog')}'s family has chosen to share.</p><div class="feed">${cards||'<div class="empty"><strong>No shared memories yet.</strong><p>Check back for new moments.</p></div>'}</div>`,'friend-feed');
 };
})();