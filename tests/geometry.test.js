import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/geometry.js';
import {createPairs} from '../src/pairing.js';
import {pieceAppearance} from '../src/appearance.js';
import {tileTransform,handAppearance} from '../src/hand.js';
const state=(matching=0,mask=0)=>{const halves=[0,1,2].map(i=>!!(mask&(1<<i)));const raw=g.hexagonStructure(matching,halves);return {matching,halves,pairs:createPairs(raw.groups),backs:raw.raw.map(()=>false),backColor:true};};
const near=(a,b)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7);
test('15 unique perfect matchings × 8 split configurations: pieces, pairs, area and assembly',()=>{
 assert.equal(g.MATCHINGS.length,15);assert.equal(new Set(g.MATCHINGS.map(JSON.stringify)).size,15);
 for(let m=0;m<15;m++)for(let mask=0;mask<8;mask++){
 const s=state(m,mask),n=s.halves.filter(Boolean).length,p=g.pieces(s);
 assert.equal(p.length,6+n*2);assert.equal(s.pairs.length,3+n);assert.equal(new Set(s.pairs.flatMap(p=>p.members)).size,p.length);assert.equal(new Set(s.pairs.map(p=>p.mark)).size,s.pairs.length);
 assert.equal(g.assembly(s).valid,true);
 const area=p.reduce((sum,p)=>{const [a,b]=g.pieceEnds(p);return sum+Math.abs(a[0]*b[1]-a[1]*b[0])/2;},0);assert.ok(Math.abs(area-15000*Math.sqrt(3))<1e-6);
 for(const [i,pair] of g.MATCHINGS[m].entries())if(s.halves[i])for(const edge of pair)assert.ok(s.pairs.some(pair=>pair.members.every(id=>id.startsWith(edge+':'))));
 }
});
test('D6: six rotations, two flips, rotation-reflection composition',()=>{
 const p=[34,-27];near(g.transform(p,{rotation:6}),p);near(g.transform(g.transform(p,{flip:true}),{flip:true}),p);
 for(let k=0;k<6;k++)near(g.transform(g.transform(p,{rotation:k}),{flip:true}),g.transform(p,{rotation:-k,flip:true}));
 assert.match(tileTransform({rotation:1,flip:true}),/rotate\(60\).*scale\(-1/);assert.notEqual(handAppearance({flip:true}).fill,handAppearance({}).fill);
});
test('independent physical faces and half-piece relocation preserve shapes',()=>{
 const s=state(0,7);s.backs[0]=true;assert.equal(g.assembly(s).valid,false);s.backs[1]=true;assert.equal(g.assembly(s).valid,true);
 for(const p of g.pieces(s))assert.equal(p.segment,p.sourceSegment^Number(s.backs[p.index]));
 assert.equal(pieceAppearance(s,0,{}).background,'#DCE2E6');assert.equal(pieceAppearance(s,0,{flip:true}).background,'#FFFFFF');
});
test('honeycomb shared boundaries and geometrically matching complementary marks',()=>{
 const s=state();const results=g.checkTiling(s,g.initialTiles());assert.equal(results.length,43);
 const t={x:0,y:g.H,rotation:0,flip:false};
 // Bottom edge 3 and top edge 0 are opposite; explicitly give complementary halves the same mark.
 const sources=g.sourcePieces(s),a=sources.find(p=>p.edge===3),b=sources.find(p=>p.edge===0);s.pairs[a.pair].mark=s.pairs[b.pair].mark='heart';
 const r=g.checkTiling(s,[{},t]);assert.equal(r.length,1);
 const edge=r[0];assert.equal(g.sameBoundary(edge.a,edge.b),true);
 assert.equal(edge.match,true);
 assert.ok(g.checkTiling(state(7),g.initialTiles()).every(r=>r.match));
 for(let mask=0;mask<8;mask++)assert.equal(g.checkTiling(state(0,mask),g.initialTiles()).length,43);
});
test('all six marks: opposite edges match; type, handedness, direction and shape errors fail',()=>{
 for(const mark of ['heart','spade','club','diamond','star','circle']){
 const s=state(7);s.pairs.forEach(p=>p.mark=mark);
 for(let rotation=0;rotation<6;rotation++)for(const flip of [false,true]){
 const center=g.transform([0,g.H],{rotation,flip});
 const results=g.checkTiling(s,[{rotation,flip},{rotation,flip,x:center[0],y:center[1]}]);assert.equal(results.length,1);assert.equal(results[0].match,true);
 const {a,b}=results[0];const mutate=fn=>{const copy=structuredClone(b);fn(copy.segments[0]);assert.equal(g.marksMatch(a,copy),false);};
 mutate(m=>m.mark=mark==='heart'?'spade':'heart');mutate(m=>m.half=a.segments[0].half);mutate(m=>m.axis=m.axis.map(v=>-v));mutate(m=>m.points[1][0]+=1);
 }
 }
});
test('split interval matching follows actual world intervals and piece reflection',()=>{
 const s=state(7,7);s.pairs.forEach(p=>p.mark='heart');
 const t={x:0,y:g.H};let [r]=g.checkTiling(s,[{},t]);assert.equal(r.match,true);
 const changed=structuredClone(r.b);changed.segments[0].mark='spade';assert.equal(g.marksMatch(r.a,changed),false);
 const wrong=structuredClone(r.b);wrong.segments[0].ends=wrong.segments[1].ends;assert.equal(g.marksMatch(r.a,wrong),false);
 const full=state(7);const edge=g.worldEdges(full,t).find(e=>g.sameBoundary(e,r.a));assert.equal(g.marksMatch(r.a,edge),false);
 s.backs[0]=s.backs[1]=true;[r]=g.checkTiling(s,[{},t]);assert.equal(r.match,true); // Turning both half pieces exchanges them and restores the same complementary profiles.
});
