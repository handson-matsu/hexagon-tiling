import test from 'node:test';
import assert from 'node:assert/strict';
import {MATCHINGS,PAIRING_TYPES,matchingKey,transformMatching,matchingOrbit,equivalenceKey,equivalenceClasses} from '../src/pairing-types.js';
test('complete matchings enumerate exactly 15 distinct partitions of six edges',()=>{
 assert.equal(MATCHINGS.length,15);
 assert.equal(new Set(MATCHINGS.map(matchingKey)).size,15);
 for(const m of MATCHINGS)assert.deepEqual(m.flat().sort((a,b)=>a-b),[0,1,2,3,4,5]);
});
test('six rotations partition the 15 matchings into five classes',()=>{
 const classes=equivalenceClasses(MATCHINGS,false);assert.equal(classes.length,5);
 assert.deepEqual(classes.map(c=>c.length).sort((a,b)=>a-b),[1,2,3,3,6]);
 for(const c of classes)assert.deepEqual(new Set(c.map(matchingKey)),matchingOrbit(c[0],false));
});
test('six rotations plus six reflections still give five classes',()=>{
 assert.equal(equivalenceClasses().length,5);
 for(const m of MATCHINGS){assert.deepEqual(matchingOrbit(m),matchingOrbit(m,false));
 for(let r=0;r<6;r++)for(const reflection of [false,true])assert.equal(equivalenceKey(transformMatching(m,r,reflection)),equivalenceKey(m));}
});
test('the five fixed representatives are pairwise inequivalent',()=>{
 assert.deepEqual(PAIRING_TYPES.map(t=>t.id),[1,2,3,4,5]);
 assert.deepEqual(PAIRING_TYPES.map(t=>t.pairs),[
 [[0,1],[2,3],[4,5]],[[0,1],[2,4],[3,5]],[[0,1],[2,5],[3,4]],[[0,2],[1,4],[3,5]],[[0,3],[1,4],[2,5]]]);
 for(const reflections of [false,true])assert.equal(new Set(PAIRING_TYPES.map(t=>equivalenceKey(t.pairs,reflections))).size,5);
 for(const type of PAIRING_TYPES)assert.equal(matchingKey(MATCHINGS[type.matching]),matchingKey(type.pairs));
});
test('every matching belongs to exactly one of the specified representatives',()=>{
 for(const reflections of [false,true])for(const m of MATCHINGS)assert.equal(PAIRING_TYPES.filter(t=>equivalenceKey(t.pairs,reflections)===equivalenceKey(m,reflections)).length,1);
});
