import test from "node:test";
import assert from "node:assert/strict";
import {angleAt,posePoints,displayedAngles} from "../goniometro/geometry.mjs";
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
test("recto, extendido, cerrado y obtuso",()=>{
 close(angleAt({x:1,y:0},{x:0,y:0},{x:0,y:1}),90);
 close(angleAt({x:-1,y:0},{x:0,y:0},{x:1,y:0}),180);
 close(angleAt({x:1,y:0},{x:0,y:0},{x:2,y:0}),0);
 close(angleAt({x:1,y:0},{x:0,y:0},{x:-1,y:1}),135);
});
test("puntos degenerados y no finitos no producen resultado",()=>{
 assert.equal(angleAt({x:0,y:0},{x:0,y:0},{x:1,y:1}),null);
 assert.equal(angleAt({x:NaN,y:0},{x:0,y:0},{x:1,y:1}),null);
 assert.equal(displayedAngles([]),null);
});
test("corrige proporción no cuadrada antes de medir",()=>{
 const lm=Array.from({length:33},()=>({x:.5,y:.5,visibility:.95}));
 lm[11]={x:1,y:.5,visibility:.9};lm[13]={x:.5,y:.5,visibility:.9};lm[15]={x:1,y:1,visibility:.9};
 const p=posePoints(lm,"elbow_left",1000,500);
 close(angleAt(...p),Math.atan(.5)*180/Math.PI);
});
test("ocultación, fuera de cuadro o articulación desconocida no conservan puntos",()=>{
 const lm=Array.from({length:33},()=>({x:.5,y:.5,visibility:.5}));
 assert.equal(posePoints(lm,"knee_left",100,100),null);
 assert.equal(posePoints(lm,"unknown",100,100),null);
 lm[23]={x:1.1,y:.5,visibility:1};
 assert.equal(posePoints(lm,"knee_left",100,100),null);
});
test("suplemento distinguido de ángulo geométrico",()=>{
 const r=displayedAngles([{x:-1,y:0},{x:0,y:0},{x:1,y:1}]);
 close(r.geometric,135);close(r.supplement,45);
});
test("invariancia ante traslación y escala uniforme",()=>{
 const p=[{x:0,y:1},{x:0,y:0},{x:1,y:0}];
 close(angleAt(...p.map(q=>({x:q.x*7+10,y:q.y*7-4}))),90);
});
