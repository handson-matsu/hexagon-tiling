// Pair members and pairs are unordered for classification; A/B/C order remains
// the explicitly specified order in PAIRING_TYPES.
export function matchingKey(pairs) {
 return pairs.map(pair=>[...pair].sort((a,b)=>a-b).join('-')).sort().join('/');
}
export function enumerateMatchings(edges=[0,1,2,3,4,5]) {
 if(!edges.length)return [[]];
 const [a,...rest]=edges;
 return rest.flatMap((b,i)=>enumerateMatchings(rest.filter((_,j)=>j!==i)).map(t=>[[a,b],...t]));
}
export const MATCHINGS=enumerateMatchings();
// The dihedral action on clockwise edge indices: i -> r+i or r-i (mod 6).
export function transformMatching(pairs,rotation=0,reflection=false) {
 return pairs.map(pair=>pair.map(edge=>((rotation+(reflection?-edge:edge))%6+6)%6));
}
export function matchingOrbit(pairs,includeReflections=true) {
 return new Set([false,...(includeReflections?[true]:[])].flatMap(reflection=>
  Array.from({length:6},(_,rotation)=>matchingKey(transformMatching(pairs,rotation,reflection)))));
}
export const equivalenceKey=(pairs,includeReflections=true)=>[...matchingOrbit(pairs,includeReflections)].sort()[0];
export function equivalenceClasses(matchings=MATCHINGS,includeReflections=true) {
 const classes=new Map();
 for(const pairs of matchings){const key=equivalenceKey(pairs,includeReflections);if(!classes.has(key))classes.set(key,[]);classes.get(key).push(pairs);}
 return [...classes.values()];
}
export const PAIRING_TYPES=[
 [[0,1],[2,3],[4,5]],
 [[0,1],[2,4],[3,5]],
 [[0,1],[2,5],[3,4]],
 [[0,2],[1,4],[3,5]],
 [[0,3],[1,4],[2,5]]
].map((pairs,index)=>({id:index+1,pairs,matching:MATCHINGS.findIndex(m=>matchingKey(m)===matchingKey(pairs))}));
