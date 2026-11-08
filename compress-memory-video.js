const outputTypes=['video/mp4;codecs=avc1.42001f,mp4a.40.2','video/webm;codecs=vp8,opus','video/mp4','video/webm'];

export async function compressMemoryVideo(file,maxSize){
 const mimeType=outputTypes.find(type=>globalThis.MediaRecorder?.isTypeSupported(type));
 const canvas=document.createElement('canvas');
 const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!mimeType||!canvas.captureStream||!AudioContextClass){
  throw Error('This browser can’t compress video. Try Chrome or use a video link.');
 }
 if(document.hidden)throw Error('Keep Daily Tales open while preparing your video.');
 const video=document.createElement('video');
 video.playsInline=true;
 video.preload='auto';
 // Silence the local playback through Web Audio while routing its sound into the recording.
 video.muted=true;
 const audio=new AudioContextClass();
 const url=URL.createObjectURL(file);
 let stream,recorder,frame;
 const controller=new AbortController();
 const {signal}=controller;
 const checkVisibility=()=>{
  if(document.hidden)controller.abort(Error('Keep Daily Tales open while preparing your video, then try again.'));
 };
 document.addEventListener('visibilitychange',checkVisibility);
 let timeout=setTimeout(()=>controller.abort(Error('This video could not be opened. Try a different clip or a video link.')),15000);
 try{
  const audioOutput=audio.createMediaStreamDestination();
  audio.createMediaElementSource(video).connect(audioOutput);
  const ready=new Promise((resolve,reject)=>{
   video.addEventListener('loadeddata',resolve,{once:true,signal});
   video.addEventListener('error',()=>reject(Error('This browser can’t open the original video. Try recording in standard HD or use a video link.')),{once:true,signal});
   signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
  video.src=url;
  await Promise.all([ready,Promise.race([
   audio.resume(),
   new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))
  ])]);
  const duration=video.duration;
  if(!Number.isFinite(duration)||duration<=0||!video.videoWidth||!video.videoHeight){
   throw Error('This video could not be opened. Try a different clip.');
  }
  if(duration>60)throw Error('Choose a clip up to 60 seconds or add a video link.');
  clearTimeout(timeout);
  timeout=setTimeout(()=>controller.abort(Error('Video preparation timed out. Try again with Daily Tales open.')),(duration+15)*1000);
  const audioRate=64000;
  const videoRate=Math.min(1800000,Math.floor(maxSize*8*.75/duration)-audioRate);
  const maxEdge=videoRate<900000?480:720;
  const scale=Math.min(1,maxEdge/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(2,2*Math.round(video.videoWidth*scale/2));
  canvas.height=Math.max(2,2*Math.round(video.videoHeight*scale/2));
  const context=canvas.getContext('2d',{alpha:false});
  const draw=()=>{
   context.drawImage(video,0,0,canvas.width,canvas.height);
   frame=requestAnimationFrame(draw);
  };
  draw();
  stream=canvas.captureStream(24);
  for(const track of audioOutput.stream.getAudioTracks())stream.addTrack(track);
  recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:videoRate,audioBitsPerSecond:audioRate});
  const result=new Promise((resolve,reject)=>{
   const chunks=[];
   let size=0;
   recorder.ondataavailable=event=>{
    size+=event.data.size;
    if(size>maxSize)controller.abort(Error('The compressed video is still too large. Try a shorter clip or add a video link.'));
    else if(event.data.size)chunks.push(event.data);
   };
   recorder.onstop=()=>resolve(new Blob(chunks,{type:mimeType.split(';')[0]}));
   recorder.onerror=()=>reject(Error('The browser could not compress this video. Try a different clip or a video link.'));
   video.addEventListener('ended',()=>recorder.stop(),{once:true,signal});
   video.addEventListener('error',()=>reject(Error('Video playback failed during compression. Try another clip.')),{once:true,signal});
   signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
  const playback=video.play().then(()=>{
   signal.throwIfAborted();
   recorder.start(500);
  });
  const [,compressed]=await Promise.all([playback,result]);
  if(!compressed.size)throw Error('No video data was produced. Try a different clip.');
  return compressed;
 }finally{
  clearTimeout(timeout);
  document.removeEventListener('visibilitychange',checkVisibility);
  controller.abort();
  video.pause();
  if(recorder&&recorder.state!=='inactive')recorder.stop();
  if(frame!==undefined)cancelAnimationFrame(frame);
  for(const track of stream?.getTracks()||[])track.stop();
  void audio.close().catch(()=>{});
  video.removeAttribute('src');
  video.load();
  URL.revokeObjectURL(url);
 }
}
