// Export the exact rendered geometry, excluding editor-only annotations.
export function prepareExportSVG(source,size){
 const copy=source.cloneNode(true);
 copy.querySelectorAll('[data-selection],[data-editor-selection]').forEach(e=>e.remove());
 copy.setAttribute('width',size);
 copy.setAttribute('height',size*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
 return copy;
}
export async function exportPNG(source,filename,size){const copy=prepareExportSVG(source,size);const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size*source.viewBox.baseVal.height/source.viewBox.baseVal.width;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('PNGを作成できませんでした');const link=document.createElement('a'),download=URL.createObjectURL(png);link.href=download;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(download),10000);return png;}finally{URL.revokeObjectURL(url);}}
