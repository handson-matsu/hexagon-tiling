import test from 'node:test';
import assert from 'node:assert/strict';
import {profile,MARKS} from '../src/marks.js';
import {PAIRING_TYPES,hexagonStructure,pieces,pieceEnds,piecePolygon,pieceMark,pieceMarkPoints,checkTiling,H} from '../src/geometry.js';
import {createPairs} from '../src/pairing.js';
const makeState=(matching,mask)=>{const halves=[0,1,2].map(i=>!!(mask&(1<<i)));const raw=hexagonStructure(matching,halves);return {matching,halves,pairs:createPairs(raw.groups),backs:raw.raw.map(()=>false)};};
const near=(a,b)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
test('marks are exactly 1.4 times the previous size about the edge/interval midpoint, with fixed cut axis',()=>{
 for(const type of PAIRING_TYPES)for(let mask=0;mask<8;mask++)for(const mark of Object.keys(MARKS)){
 const s=makeState(type.matching,mask);s.pairs.forEach(p=>p.mark=mark);
 for(const back of [false,true]){
 s.backs.fill(back);
 for(const p of pieces(s)){
 const [a,b]=pieceEnds(p),mid=a.map((v,i)=>(v+b[i])/2),m=pieceMark(s,p),points=pieceMarkPoints(s,p);
 profile(mark).forEach(([x,y],i)=>{
 const span=['circle','star'].includes(mark)?.42:.55;
 const t=(1-span)/2+span*(m.half==='right'?1-y:y),depth=.23*x;
 const old=[a[0]+(b[0]-a[0])*t-(b[1]-a[1])*depth,a[1]+(b[1]-a[1])*t+(b[0]-a[0])*depth];
 near(points[i],old.map((v,j)=>mid[j]+1.4*(v-mid[j])));
 if(x===0)assert.ok(Math.abs(cross(a,b,points[i]))<1e-7,'cut axis moved off boundary');
 });
 }
 }
 }
});
test('enlarged marks stay in their physical pieces with clearance from adjacent pieces and edges, including stroke',()=>{
 for(const type of PAIRING_TYPES)for(let mask=0;mask<8;mask++)for(const mark of Object.keys(MARKS)){
 const s=makeState(type.matching,mask);s.pairs.forEach(p=>p.mark=mark);
 for(const back of [false,true]){
 s.backs.fill(back);
 for(const p of pieces(s)){
 const polygon=piecePolygon(p),points=pieceMarkPoints(s,p);
 for(const q of points)for(let i=0;i<3;i++){
 const a=polygon[i],b=polygon[(i+1)%3];const distance=cross(a,b,q)/Math.hypot(b[0]-a[0],b[1]-a[1]);
 assert.ok(distance>=-1e-7,`outside piece: ${mark}`);
 // The supporting paper edge is the intentional seam. Other two sides
 // need at least half the unchanged 1.5px outline width as clearance.
 if(i!==1)assert.ok(distance>.75,`adjacent piece overlap: ${mark}`);
 }
 }
 }
 }
});
test('enlarged half-mode profiles still combine on both matching intervals',()=>{
 for(const mark of Object.keys(MARKS)){
 const s=makeState(7,7);s.pairs.forEach(p=>p.mark=mark);
 for(const back of [false,true]){
 s.backs.fill(back);
 const results=checkTiling(s,[{}, {x:0,y:H}]);assert.equal(results.length,1);assert.equal(results[0].match,true);
 assert.equal(results[0].a.segments.length,2);
 }
 }
});
