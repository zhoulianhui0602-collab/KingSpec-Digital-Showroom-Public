// Measured bounds of the existing 1000x1000 official JPGs. Only CSS framing
// changes; source pixels, product markings and aspect ratios are retained.
const bounds={cfb:[315,244,680,759],micro:[174,262,825,738],p3:[197,294,807,721],ram:[98,337,897,609],sdv90:[242,160,748,831],templar:[115,367,886,631],x500:[78,384,922,616],xf2280:[142,401,860,595],xg7000:[144,400,857,598],zs301:[53,158,646,821]};
const tracked=new Map();
function fit(el){
 const record=tracked.get(el),img=el.querySelector('img');if(!record||!img||!el.clientWidth||!el.clientHeight)return;
 const [x0,y0,x1,y1]=record.bounds,scale=Math.min(Math.max(1,el.clientWidth-record.pad*2)/(x1-x0),Math.max(1,el.clientHeight-record.pad*2)/(y1-y0));
 img.style.width=1000*scale+'px';img.style.height=1000*scale+'px';img.style.left=el.clientWidth/2-(x0+x1)/2*scale+'px';img.style.top=el.clientHeight/2-(y0+y1)/2*scale+'px';
}
const observer=new ResizeObserver(entries=>entries.forEach(({target})=>fit(target)));
export function frameArtwork(el,id,{pad=20}={}){
 if(!bounds[id])return;
 el.classList.add('artwork-framed');
 // Cards are built in a DocumentFragment. Observe only after they are mounted.
 queueMicrotask(()=>{
  if(!el.isConnected)return;
  for(const node of tracked.keys())if(!node.isConnected){observer.unobserve(node);tracked.delete(node)}
  tracked.set(el,{bounds:bounds[id],pad});observer.observe(el);fit(el);
 });
}
