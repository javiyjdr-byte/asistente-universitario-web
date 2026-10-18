// Angles use source-image pixels: normalized x/y must be scaled separately.
export function angleAt(a,b,c){
  if(![a,b,c].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
  const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};
  const n=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);
  if(n<1e-8)return null;
  return Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/n)))*180/Math.PI;
}
export const JOINTS=Object.freeze({
  elbow_left:{label:"Codo izquierdo",ids:[11,13,15]},
  elbow_right:{label:"Codo derecho",ids:[12,14,16]},
  knee_left:{label:"Rodilla izquierda",ids:[23,25,27]},
  knee_right:{label:"Rodilla derecha",ids:[24,26,28]}
});
export function posePoints(landmarks,joint,width,height,minVisibility=.7){
  const ids=JOINTS[joint]?.ids;
  if(!ids||!landmarks||!(width>0&&height>0))return null;
  const pts=ids.map(i=>landmarks[i]);
  if(pts.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1||!(p.visibility>=minVisibility)))return null;
  return pts.map(p=>({x:p.x*width,y:p.y*height}));
}
export function displayedAngles(points){
  const geometric=points?.length===3?angleAt(...points):null;
  return geometric===null?null:{geometric,supplement:180-geometric};
}

/** Geometric explanation, not a clinical ROM classification. */
export function describeAngle(value){
  if(!Number.isFinite(value)||value<0||value>180)return null;
  const angle=Math.round(value*10)/10;
  const supplement=Math.round((180-value)*10)/10;
  let kind,meaning;
  if(angle===0){kind="nulo";meaning="Los dos segmentos apuntan aproximadamente en la misma dirección.";}
  else if(angle<90){kind="agudo";meaning="La abertura entre los segmentos es menor que un ángulo recto.";}
  else if(angle===90){kind="recto";meaning="Los segmentos forman aproximadamente una esquina de 90°.";}
  else if(angle<180){kind="obtuso";meaning="La abertura entre los segmentos supera 90° y es menor que una línea recta.";}
  else{kind="llano";meaning="Los segmentos están aproximadamente alineados en sentidos opuestos.";}
  return {angle,supplement,kind,text:
    "Se estima un ángulo "+kind+" de "+angle.toFixed(1)+"° en esta imagen. "+meaning+
    " Para llegar a la alineación de 180°, la diferencia geométrica es "+supplement.toFixed(1)+"°. "+
    "Esa diferencia es el suplemento; no identifica por sí sola flexión, extensión ni hiperextensión."};
}
