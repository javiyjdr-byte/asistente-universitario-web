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
