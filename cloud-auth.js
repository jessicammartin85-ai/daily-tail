/* Daily Tales: a single Firebase account sign-in for the original app.
 * The welcome screen is displayed before local UI; no second PIN login.
 * Existing browser data is read only for an explicitly confirmed migration.
 */
import {onAuthStateChanged,GoogleAuthProvider,signInWithPopup,
 signInWithEmailAndPassword,createUserWithEmailAndPassword,
 sendPasswordResetEmail,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {dailyTalesAuth as auth} from './cloud-dog-store.js';
const $=id=>document.getElementById(id);
let ready=false,user=null,accountReady=false;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setStatus=(text,bad=false)=>{const el=$('cloudStatus');if(el){el.textContent=text;el.style.color=bad?'#a42824':'#2c654c'}};
function init(){
 const shade=$('cloudShade')||document.createElement('div');
 shade.id='cloudShade';shade.hidden=false;
 shade.innerHTML=`<section class="dt-cloud-card" role="dialog" aria-modal="true" aria-labelledby="dtCloudTitle">
  <img src="./daily-tails-logo.webp" alt="Daily Tales" class="dt-cloud-logo">
  <h1 id="dtCloudTitle">Welcome to Daily Tales</h1>
  <p>Every dog has a story. Sign in to keep yours together on every device.</p>
  <div id="cloudAccount"><p>Connecting securely…</p></div>
  <p id="cloudStatus" role="status" aria-live="polite"></p>
  <details class="dt-cloud-help"><summary>Already have a dog saved on this phone?</summary>
  <p>Sign in first, then choose <strong>Connect my existing dogs</strong>.
  Your existing profiles will not be replaced or deleted.</p></details>
  </section>`;
 if(!shade.isConnected)document.body.prepend(shade);
 const style=document.createElement('style');style.textContent=`
 #cloudShade{position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;background:#663c24ee;padding:14px;box-sizing:border-box;overflow:auto}
 #cloudShade[hidden]{display:none!important}
 .dt-cloud-card{width:min(100%,430px);max-height:95dvh;overflow:auto;box-sizing:border-box;background:#fff9f0;border:3px solid #56738a;border-radius:28px;padding:20px 23px 26px;text-align:center;color:#354d5e;box-shadow:0 8px 30px #24140c55;font:15px/1.48 Arial,sans-serif}
 .dt-cloud-logo{display:block;width:min(77%,265px);height:auto;margin:0 auto 5px}
 .dt-cloud-card h1{font:700 25px/1.2 Georgia,serif;margin:12px 0;color:#603f2b}
 .dt-cloud-card p{line-height:1.5}
 .dt-cloud-card label{display:block;text-align:left;margin:12px 0;font-weight:700}
 .dt-cloud-card input{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid #879fac;border-radius:12px;padding:12px;font:16px Arial,sans-serif}
 .dt-cloud-card button{padding:12px 14px;border-radius:12px;font:700 15px Arial,sans-serif;cursor:pointer}
 .dt-cloud-card .dt-primary{width:100%;color:#fff;background:#365c76;border:1px solid #365c76}
 .dt-cloud-card .dt-secondary{color:#365c76;background:#e8eff3;border:1px solid #a6bdca}
 .dt-cloud-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:10px}
 .dt-cloud-row button{flex:1}
 .dt-cloud-helper{border-top:1px solid #d0d4d8;margin-top:17px;padding-top:12px}
 .dt-cloud-help{text-align:left;color:#4b5e6b;font-size:13px;margin-top:16px}
 #cloudStatus{font-size:13px;min-height:20px;overflow-wrap:anywhere}
 `;document.head.append(style);
 render();
}
function render(){
 const root=$('cloudAccount');if(!root)return;
 if(!ready){root.textContent='Verifying your account…';return}
 if(user){root.innerHTML='<p>Signed in as <strong id="dtCloudEmail"></strong></p><button id="dtCloudContinue" class="dt-primary">Continue to My Dogs</button><div class="dt-cloud-row"><button id="dtCloudSignout" class="dt-secondary">Use a different account</button></div>';
   $('dtCloudEmail').textContent=user.email||user.displayName||'Daily Tales account';
   $('dtCloudContinue').disabled=!accountReady;
   $('dtCloudContinue').textContent=accountReady?'Continue to My Dogs':'Loading your dogs…';
   $('dtCloudContinue').onclick=()=>{if(accountReady&&$('cloudShade'))$('cloudShade').hidden=true};
   $('dtCloudSignout').onclick=()=>signOut(auth).catch(e=>setStatus(e.message,true));
   return;
 }
 root.innerHTML=`<button type="button" id="dtGoogle" class="dt-primary">Continue with Google</button>
 <p>or use your email</p><form id="dtCloudEmailForm">
 <label>Email<input type="email" name="email" autocomplete="email" placeholder="you@example.com" required></label>
 <label>Password<input type="password" name="password" autocomplete="current-password" minlength="6" required></label>
 <div class="dt-cloud-row"><button class="dt-primary" type="submit" name="mode" value="login">Sign in</button>
 <button class="dt-secondary" type="submit" name="mode" value="register">Create account</button></div></form>
 <div class="dt-cloud-row"><button id="dtForgot" class="dt-secondary" type="button">Forgot password?</button></div>
 <div class="dt-cloud-helper"><button type="button" id="dtInviteOpen" class="dt-secondary">Access a dog with a code</button>
 <div id="dtInviteCodePanel" hidden><label>Invitation code<input id="dtInviteCode" autocomplete="off" placeholder="Paste an invitation code"></label>
 <div class="dt-cloud-row"><button type="button" id="dtOpenFriend" class="dt-secondary">Friend View (no account)</button>
 <button type="button" id="dtOpenFamily" class="dt-secondary">Family access</button></div></div>
 <p style="font-size:12px">Friends can view without signing in. Adult and Child access requires an account and owner approval.</p></div>`;
 $('dtGoogle').onclick=async()=>{try{setStatus('Opening Google sign-in…');await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setStatus('Google sign-in: '+(e.code||e.message),true)}};
 $('dtCloudEmailForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;try{
  setStatus('Signing in…');
  if(e.submitter?.value==='register')await createUserWithEmailAndPassword(auth,f.elements.email.value.trim(),f.elements.password.value);
  else await signInWithEmailAndPassword(auth,f.elements.email.value.trim(),f.elements.password.value);
 }catch(err){setStatus('Account error: '+(err.code||err.message),true)}};
 $('dtForgot').onclick=async()=>{const email=$('dtCloudEmailForm').elements.email.value.trim();if(!email)return setStatus('Enter your email above first.',true);try{await sendPasswordResetEmail(auth,email);setStatus('If the account exists, check your email for a reset link.')}catch(e){setStatus(e.message,true)}};
 $('dtInviteOpen').onclick=()=>{$('dtInviteCodePanel').hidden=!$('dtInviteCodePanel').hidden};
 $('dtOpenFriend').onclick=()=>{
   const code=$('dtInviteCode').value.trim().replace(/[^a-zA-Z0-9]/g,'');
   if(!/^[a-zA-Z0-9]{16,40}$/.test(code))return setStatus('Enter the Friend View code from the owner.',true);
   location.assign('./friend.html?share='+encodeURIComponent(code));
 };
 $('dtOpenFamily').onclick=()=>{
   const code=$('dtInviteCode').value.trim().replace(/[^a-zA-Z0-9]/g,'');
   if(!/^[a-zA-Z0-9]{16,80}$/.test(code))return setStatus('Enter the family invitation code from the owner.',true);
   sessionStorage.setItem('dtPendingCloudInvite',code);
   setStatus('Sign in with Google or email above to request access to this dog.');
 };
}
onAuthStateChanged(auth,u=>{
 user=u;ready=true;accountReady=false;render();
 const shade=$('cloudShade');
 if(!shade)return;
 shade.hidden=false;
 if(!u)return;
 const pending=sessionStorage.getItem('dtPendingCloudInvite');
 if(pending){
   sessionStorage.removeItem('dtPendingCloudInvite');
   location.assign('./legacy.html?dtInvite='+encodeURIComponent(pending));
   return;
 }
 setStatus('Loading your secure dog profiles…');
},e=>{ready=true;render();setStatus('Account connection failed: '+e.message,true)});
window.DailyTalesCloudResolved=()=>{accountReady=true;render();const el=$('cloudShade');if(el)el.hidden=true};
window.DailyTalesOpenAccount=()=>{if($('cloudShade')){$('cloudShade').hidden=false;render()}};
window.DailyTalesCloudSignOut=()=>signOut(auth);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
