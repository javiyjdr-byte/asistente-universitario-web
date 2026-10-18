import {JOINTS,posePoints,displayedAngles,describeAngle} from "./geometry.mjs";
const $=id=>document.getElementById(id),canvas=$("canvas"),ctx=canvas.getContext("2d"),video=$("video");
let source=null,stream=null,points=[],drag=-1,frame=0,lastFrame=-1,lastDetection=0,detector=null,loading=null,mode="",generation=0,working=false,analyzeAgain=false;
const status=text=>$("status").textContent=text;
const manual=()=>$("method").value==="manual";
function blank(){ $("interpretation").textContent="Completá tres puntos visibles para obtener una interpretación."; $("angle").textContent="—";$("supplement").textContent="—";$("download").disabled=true; }
function coordinates(){
  $("coordinates").replaceChildren();
  ["A","B","C"].forEach((label,i)=>{
    const row=document.createElement("div");row.className="point-row";
    const title=document.createElement("strong");title.textContent=label;row.append(title);
    ["x","y"].forEach(axis=>{
      const holder=document.createElement("label");holder.textContent=axis.toUpperCase();
      const input=document.createElement("input");input.type="number";input.step="1";input.min="0";
      input.max=String(axis==="x"?canvas.width:canvas.height);
      input.value=points[i]?String(Math.round(points[i][axis])):"";
      input.disabled=!manual()||!source||!!stream;input.setAttribute("aria-label",label+" "+axis);
      input.addEventListener("change",()=>{
        if(input.value.trim()==="")return;
        const n=Number(input.value),max=axis==="x"?canvas.width:canvas.height;
        if(!Number.isFinite(n)||n<0||n>max){status("Coordenada fuera de la imagen.");return;}
        while(points.length<=i)points.push({x:canvas.width/2,y:canvas.height/2});
        points[i][axis]=n;draw();coordinates();
      });
      holder.append(input);row.append(holder);
    });$("coordinates").append(row);
  });
}
function fit(width,height){
  const scale=Math.min(1,1600/Math.max(width,height));
  canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#171426";ctx.fillRect(0,0,canvas.width,canvas.height);
  if(source)ctx.drawImage(source,0,0,canvas.width,canvas.height);
  $("empty").hidden=!!source;
  const scale=canvas.width/800;
  if(points.length){
    ctx.strokeStyle="#00e5ca";ctx.lineWidth=Math.max(3,4*scale);
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
    points.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,Math.max(8,9*scale),0,2*Math.PI);
      ctx.fillStyle="#fff";ctx.fill();ctx.stroke();
      ctx.font="bold "+Math.max(18,22*scale)+"px Arial";ctx.fillStyle="#fff";
      ctx.strokeStyle="#171426";ctx.lineWidth=4;
      ctx.strokeText("ABC"[i],p.x+14,p.y-14);ctx.fillText("ABC"[i],p.x+14,p.y-14);
      ctx.strokeStyle="#00e5ca";
    });
  }
  const angles=displayedAngles(points);
  if(!angles){blank();return;}
  $("angle").textContent=angles.geometric.toFixed(1)+"°";
  $("supplement").textContent=angles.supplement.toFixed(1)+"°";
  $("interpretation").textContent=describeAngle(angles.geometric).text;
  $("download").disabled=false;
  const b=points[1],a=points[0],c=points[2];
  let start=Math.atan2(a.y-b.y,a.x-b.x),delta=Math.atan2(c.y-b.y,c.x-b.x)-start;
  while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
  ctx.beginPath();ctx.arc(b.x,b.y,Math.max(22,34*scale),start,start+delta,delta<0);ctx.stroke();
  ctx.fillStyle="#171426";ctx.fillRect(8,8,Math.max(240,330*scale),Math.max(64,70*scale));
  ctx.fillStyle="#fff";ctx.font="bold "+Math.max(16,22*scale)+"px Arial";
  ctx.fillText("Ángulo 2D: "+angles.geometric.toFixed(1)+"°",20,34);
  ctx.font=Math.max(13,15*scale)+"px Arial";ctx.fillText("Experimental · sin validación clínica",20,58);
}
function stopCamera(){
  generation++;cancelAnimationFrame(frame);
  if(stream)stream.getTracks().forEach(t=>t.stop());
  stream=null;video.srcObject=null;lastFrame=-1;
  $("stop").disabled=true;$("freeze").disabled=true;
}
function clear(){
  stopCamera();source=null;points=[];$("photo").value="";draw();coordinates();status("Imagen borrada y cámara apagada.");
}
async function getDetector(runningMode){
  if(!detector){
    if(!loading)loading=(async()=>{
      status("Descargando detector. La primera carga necesita conexión.");
      const {FilesetResolver,PoseLandmarker}=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs");
      const files=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm");
      detector=await PoseLandmarker.createFromOptions(files,{
        baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",delegate:"CPU"},
        runningMode,numPoses:1,minPoseDetectionConfidence:.7,minPosePresenceConfidence:.7,minTrackingConfidence:.7
      });mode=runningMode;
    })().finally(()=>loading=null);
    await loading;
  }
  if(mode!==runningMode){await detector.setOptions({runningMode});mode=runningMode;}
  return detector;
}
function accept(result){
  points=posePoints(result.landmarks?.[0],$("joint").value,canvas.width,canvas.height)||[];
  status(points.length?JOINTS[$("joint").value].label+" · estimación 2D. Revisá la colocación de los puntos.":"Sin puntos suficientemente visibles. Cambiá el encuadre; no se conserva una medición anterior.");
}
async function analyze(){
  if(!source||manual()||stream)return;
  const ticket=generation;if(working){analyzeAgain=true;return;}working=true;
  try{
    const d=await getDetector("IMAGE");
    if(ticket!==generation||manual()||stream)return;
    accept(d.detect(source));draw();coordinates();
  }catch(e){if(ticket===generation){points=[];draw();status("No se pudo cargar o ejecutar el detector. Podés medir con tres puntos manuales.");}}
  finally{working=false;if(analyzeAgain){analyzeAgain=false;queueMicrotask(analyze);}}
}
function loop(now,ticket){
  if(!stream||ticket!==generation)return;
  if(video.readyState>=2){
    if(!manual()&&detector&&mode==="VIDEO"&&video.currentTime!==lastFrame&&now-lastDetection>=120){
      lastFrame=video.currentTime;lastDetection=now;
      try{accept(detector.detectForVideo(video,now));}catch(e){points=[];status("Falló el seguimiento. Apagá la cámara y volvé a intentarlo.");}
    }
    draw();
  }
  frame=requestAnimationFrame(t=>loop(t,ticket));
}
async function startCamera(){
  stopCamera();source=null;points=[];draw();coordinates();
  const ticket=generation;$("camera").disabled=true;
  try{
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error("unsupported");
    const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:$("facing").value},width:{ideal:1280},height:{ideal:720}},audio:false});
    if(ticket!==generation){next.getTracks().forEach(t=>t.stop());return;}
    stream=next;video.srcObject=stream;await video.play();
    if(ticket!==generation)return;
    fit(video.videoWidth,video.videoHeight);source=video;
    $("stop").disabled=false;$("freeze").disabled=false;
    status(manual()?"Cámara activa. Congelá una imagen para ubicar los tres puntos.":"Preparando seguimiento automático.");
    if(!manual())await getDetector("VIDEO");
    if(ticket!==generation)return;
    coordinates();frame=requestAnimationFrame(t=>loop(t,ticket));
  }catch(e){
    if(ticket===generation){stopCamera();source=null;points=[];draw();coordinates();
    status(e.name==="NotAllowedError"?"Permiso de cámara rechazado. Podés cargar una foto.":"No se pudo iniciar la cámara o el detector. Usá HTTPS/localhost, revisá el permiso o cargá una foto.");}
  }finally{$("camera").disabled=false;}
}
$("photo").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>15*1024*1024){status("Elegí JPG, PNG o WebP de hasta 15 MB.");return;}
  stopCamera();source=null;points=[];draw();coordinates();
  const ticket=generation,url=URL.createObjectURL(file),image=new Image();
  try{image.src=url;await image.decode();
    if(ticket!==generation)return;
    if(image.naturalWidth*image.naturalHeight>40000000)throw new Error("large");
    fit(image.naturalWidth,image.naturalHeight);source=image;draw();coordinates();
    status("Foto lista. Ubicá A, el vértice B y C.");await analyze();
  }catch(e){if(ticket===generation)status("No se pudo leer esta imagen. Probá con una foto de menor tamaño.");}
  finally{URL.revokeObjectURL(url);}
});
$("camera").addEventListener("click",startCamera);
$("stop").addEventListener("click",()=>{
  if(stream&&source){const still=document.createElement("canvas");still.width=canvas.width;still.height=canvas.height;still.getContext("2d").drawImage(video,0,0,still.width,still.height);source=still;}
  stopCamera();draw();coordinates();status("Cámara apagada. La última imagen queda disponible para medir.");
});
$("freeze").addEventListener("click",()=>{
  const still=document.createElement("canvas");still.width=canvas.width;still.height=canvas.height;still.getContext("2d").drawImage(video,0,0,still.width,still.height);
  stopCamera();source=still;$("method").value="manual";draw();coordinates();status("Imagen congelada. Podés ajustar los puntos o empezar con A, B y C.");
});
$("method").addEventListener("change",async()=>{
  points=[];draw();coordinates();
  if(stream){await startCamera();}else if(!manual()){await analyze();}else status("Modo manual. Ubicá A, B y C en la foto.");
});
$("joint").addEventListener("change",()=>{points=[];draw();if(!stream)analyze();});
$("facing").addEventListener("change",()=>{if(stream)startCamera();});
$("clear").addEventListener("click",clear);
$("reset").addEventListener("click",()=>{points=[];draw();coordinates();status("Puntos reiniciados.");if(!manual()&&!stream)analyze();});
$("example").addEventListener("click",()=>{
  clear();$("method").value="manual";const demo=document.createElement("canvas");demo.width=800;demo.height=500;
  const dc=demo.getContext("2d");dc.fillStyle="#242136";dc.fillRect(0,0,800,500);source=demo;fit(800,500);
  points=[{x:150,y:250},{x:400,y:250},{x:400,y:80}];draw();coordinates();status("Ejemplo geométrico: 90°. Arrastrá un punto para explorar.");
});
function at(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))};}
canvas.addEventListener("pointerdown",e=>{
  if(!manual()||!source||stream)return;
  const p=at(e),r=canvas.getBoundingClientRect(),hit=24*canvas.width/r.width;
  drag=points.findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<hit);
  if(drag<0&&points.length<3){points.push(p);drag=points.length-1;}
  if(drag>=0)canvas.setPointerCapture(e.pointerId);
  draw();coordinates();
});
canvas.addEventListener("pointermove",e=>{if(drag>=0){points[drag]=at(e);draw();}});
function finish(){if(drag>=0){drag=-1;coordinates();status(points.length===3?"Medición actualizada. Revisá el vértice B y los segmentos.":"Continuá con el siguiente punto.");}}
canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",finish);
$("download").addEventListener("click",()=>{
  // Freeze the exported frame and overlays together; no upload or persistence.
  canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="goniometro-educativo.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&stream){stopCamera();source=null;points=[];draw();coordinates();status("Cámara apagada al salir de la pantalla.");}});
window.addEventListener("pagehide",()=>{stopCamera();detector?.close();detector=null;});
draw();coordinates();
