import {exportPNG} from './export.js';
import {appendMismatchLayer} from './mismatch.js';
import {HAND_PARTS,handAppearance,tileTransform} from './hand.js';
import {recordAccessOnce} from './access-counter.js';
import {pieceAppearance} from './appearance.js';
import {pairLabel,createPairs} from './pairing.js';
import {MARKS,COLORS,pieces,sourcePieces,assembly,piecePolygon,splitLines,hexagonStructure,configureHexagon,MATCHINGS,PAIRING_TYPES,relation,vertices,transform,pieceMarkPoints,path,checkTiling,initialTiles} from './geometry.js?v=marks-1.4';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const defaults=()=>({matching:0,halves:[false,false,false],pairs:createPairs(hexagonStructure().groups),backs:Array(6).fill(false),backColor:true,showHand:true});
let state=defaults(),tiles=initialTiles(),selected=null;
let showMismatches=true;
const names=Array.from({length:6},(_,i)=>`辺${i}`);
function el(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
function drawTile(parent,tile,{interactive=false,index=0}={}){const outer=el('g',{transform:tileTransform(tile)});parent.append(outer);if(interactive){outer.setAttribute('role','button');outer.setAttribute('tabindex','0');outer.setAttribute('data-tile',index);outer.setAttribute('aria-pressed',selected===index);outer.setAttribute('aria-label',`タイル${index+1}、${selected===index?'選択中、押すと60度回転':'押すと選択'}`);const click=()=>{if(selected===index){tiles[index].rotation=(tiles[index].rotation+1)%6;}else{selected=index;}render();};outer.addEventListener('click',event=>{event.stopPropagation();click();});outer.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click();}});}
// White triangular paper, with colored marks entirely inside its boundary.
outer.append(el('path',{d:path(vertices),fill:'#fff'}));
// All piece backgrounds are painted before marks and cutting lines.
const active=pieces(state);
for(const piece of active){
  const background=el('path',{d:path(piecePolygon(piece)),fill:pieceAppearance(state,piece.index,tile).background,'data-piece-background':piece.index});
  outer.append(background);
}
for(const piece of active){
  const pair=state.pairs[piece.pair];
  if(!pair)continue;
  const appearance=pieceAppearance(state,piece.index,tile,pair.color);
  outer.append(el('path',{d:path(pieceMarkPoints(state,piece)),fill:appearance.markColor,stroke:'#263238','stroke-width':1.5,'stroke-linejoin':'round','data-piece-mark':piece.index,'pointer-events':interactive?'auto':'none'}));

}
for(const [a,b] of splitLines(state)){
  outer.append(el('path',{d:`M${a} L${b}`,stroke:'#5c666b','stroke-width':1,'stroke-dasharray':'4 4','data-cut-line':'true','pointer-events':'none'}));
}
if(state.showHand){
 const hand=el('g',{'data-hand':'true','pointer-events':'none',...handAppearance(tile),'stroke-width':1.6,'stroke-linejoin':'round','stroke-linecap':'round','aria-hidden':'true'});
 for(const part of HAND_PARTS)hand.append(el(part.tag,part.attrs));
 outer.append(hand);
}
if(!interactive){for(const edge of vertices.keys()){const a=vertices[edge],b=vertices[(edge+1)%6];const labels=active.filter(p=>p.edge===edge).map(p=>pairLabel(p.pair)).join(' / ');outer.append(el('text',{x:(a[0]+b[0])*.59,y:(a[1]+b[1])*.59,'text-anchor':'middle','font-size':8,'data-editor-selection':'true'},`${edge}: ${labels}`));}}
outer.append(el('path',{d:path(vertices),fill:'none' ,stroke:'#263238','stroke-width':1.5,'pointer-events':'none'}));
return outer;}
function svg(box){return el('svg',{xmlns:NS,viewBox:box,'aria-label':'白い正六角形と色付きの半分のマーク'});}
function render(){
const physical=assembly(state),count=sourcePieces(state).length;
$('#assembly-status').textContent=physical.message;
$('#assembly-status').className=physical.valid?'hint':'assembly-error';
$('#save-tile').disabled=$('#save-board').disabled=$('#flip').disabled=$('#one-reset').disabled=!physical.valid;
if(!physical.valid){
 $('#preview').replaceChildren();$('#board').replaceChildren();
 $('#status').textContent='実物の紙で組み立てられる表裏の組み合わせを選んでください。';
 $('#selection').textContent='組立不可の設定ではタイル操作・PNG保存を停止します。';
 return;
}
const moved=physical.pieces.filter(p=>p.sourceId!==p.id);
$('#assembly-status').textContent=moved.length?'実物で組立可能。移動：'+moved.map(p=>`${pieceName(sourcePieces(state).find(q=>q.id===p.sourceId))} → ${pieceName(p)}`).join(' ／ '):'実物で組立可能。各ピースは元の位置にあります。';$('.badge').textContent=`正六角形 · ${count}ピース`;$('#piece-description').textContent=`点線に沿って切り分ける${count}枚のパーツ`;const p=svg('-120 -110 240 220');drawTile(p,{rotation:0,flip:false});$('#preview').replaceChildren(p);const b=svg('-110 -100 820 820');tiles.forEach((t,i)=>drawTile(b,t,{interactive:true,index:i}));const results=checkTiling(state,tiles);const t=selected===null?null:tiles[selected];if(t)b.append(el('path',{d:path(vertices.map(p=>transform(p.map(v=>v*.92),t))),fill:'none',stroke:'#233f49','stroke-width':3,'stroke-dasharray':'12 7','pointer-events':'none','data-selection':'true'}));appendMismatchLayer(b,results,showMismatches,el);$('#show-mismatches').checked=showMismatches;$('#board').replaceChildren(b);const good=results.filter(r=>r.match).length;$('#status').textContent=`隣接する${results.length}辺中 ${good}辺が一致 ／ ${results.length-good}辺が不一致`;$('#flip').disabled=!t;$('#one-reset').disabled=!t;$('#selection').textContent=t?`選択：${Math.floor(selected/5)+1}行 ${selected%5+1}列 · ${t.rotation*60}° · ${t.flip?'裏返し':'通常'}`:'タイルを選択してください。選択中のタイルを再度押すと60°回転します。';}
function pieceName(piece){return names[piece.edge]+(piece.end-piece.start<1?`・区間${piece.segment+1}`:'');}
function controls(){
 const active=sourcePieces(state),host=$('#pairs');host.replaceChildren();
 state.pairs.forEach((pair,i)=>{
  const f=document.createElement('fieldset'),l=document.createElement('legend');l.textContent=`ペア${pairLabel(i)}`;f.append(l);
  const members=document.createElement('p');members.className='hint';members.textContent=pair.members.map(id=>pieceName(active.find(p=>p.id===id))).join(' ＋ ');f.append(members);
  const label=document.createElement('label');label.textContent='マーク';
  const select=document.createElement('select');select.id=`pair-mark-${i}`;
  for(const [key,m]of Object.entries(MARKS)){const option=document.createElement('option');option.value=key;option.textContent=m.name;select.append(option);}
  select.value=pair.mark;select.onchange=()=>{pair.mark=select.value;render();};label.append(select);f.append(label);
  const colors=document.createElement('div');colors.className='swatches';colors.setAttribute('role','group');colors.setAttribute('aria-label',`ペア${pairLabel(i)}の色`);
  COLORS.forEach((color,n)=>{const btn=document.createElement('button');btn.className='swatch';btn.style.background=color;btn.setAttribute('aria-label',['ローズ','ブルー','グリーン','イエロー','パープル','ターコイズ','オレンジ','ブラウン'][n]);btn.setAttribute('aria-pressed',pair.color===color);btn.onclick=()=>{pair.color=color;controls();render();};colors.append(btn);});f.append(colors);host.append(f);
 });
 const matching=$('#matching');matching.replaceChildren();PAIRING_TYPES.forEach(type=>{const o=document.createElement('option');o.value=type.matching;o.textContent=`タイプ${type.id}：`+type.pairs.map(([a,b])=>relation(a,b)).join('・');matching.append(o);});matching.value=state.matching;
 const type=PAIRING_TYPES.find(type=>type.matching===state.matching);
 $('#matching-description').textContent=`タイプ${type.id}：`+type.pairs.map(([a,b],i)=>`${pairLabel(i)} = ${a}–${b}`).join(' / ');
 const halfHost=$('#halves');halfHost.replaceChildren();MATCHINGS[state.matching].forEach(([a,b],i)=>{const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.id=`half-${i}`;input.checked=state.halves[i];input.onchange=()=>{const halves=[...state.halves];halves[i]=input.checked;reconfigure({halves});};label.append(input,`辺${a}・${b}を半分にする`);halfHost.append(label);});
 $('#backs').replaceChildren();
 active.forEach(piece=>{
  const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.checked=state.backs[piece.index];input.id=`piece-back-${piece.index}`;
  input.onchange=()=>{state.backs[piece.index]=input.checked;render();};label.append(input,`${pieceName(piece)}（${piece.pair<0?'マークなし':pairLabel(piece.pair)}）を裏返す`);$('#backs').append(label);
 });
 $('#back-color').checked=state.backColor;$('#show-hand').checked=state.showHand;
}
function reconfigure(options){configureHexagon(state,options);controls();render();}
$('#show-mismatches').onchange=e=>{showMismatches=e.target.checked;render();};
$('#show-hand').onchange=e=>{state.showHand=e.target.checked;render();};
$('#matching').onchange=e=>reconfigure({matching:Number(e.target.value),halves:[false,false,false]});
$('#back-color').onchange=e=>{state.backColor=e.target.checked;render();};$('#settings-reset').onclick=()=>{state=defaults();controls();render();};$('#flip').onclick=()=>{if(selected===null||!assembly(state).valid)return;tiles[selected].flip=!tiles[selected].flip;render();};$('#one-reset').onclick=()=>{if(selected===null||!assembly(state).valid)return;Object.assign(tiles[selected],{rotation:0,flip:false});render();};$('#all-reset').onclick=()=>{tiles=initialTiles();selected=null;render();};
// Keep action/settings controls usable without clearing the selected tile.
document.addEventListener('click',event=>{
  if(event.target.closest('#board [data-tile],button,input,select,label,aside'))return;
  if(selected!==null){selected=null;render();}
});

for(const [id,target,name,size]of [['save-tile','preview','tile.png',1800],['save-board','board','tiling.png',3200]])$("#"+id).onclick=async()=>{try{if(!assembly(state).valid)return;await exportPNG($("#"+target+' svg'),name.replace('.png',`-${pieces(state).length}pieces.png`),size);$('#export-status').textContent='PNG画像を保存しました。';}catch(error){$('#export-status').textContent='保存できませんでした。もう一度お試しください。';console.error(error);}};
controls();render();
recordAccessOnce();
