import {catalogTree,groupOf,familyOf,comparisonGroup} from './categories.js';
import {frameArtwork} from './product-artwork.js';

export function createComparison({products,getVariant,onProduct,announce}){
 const $=s=>document.querySelector(s),selected=[],tray=$('#compare-tray'),dialog=$('#compare-dialog');
 let priorFocus=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function sync(){
  document.querySelectorAll('[data-compare]').forEach(b=>{const active=selected.includes(b.dataset.compare);b.setAttribute('aria-pressed',String(active));b.classList.toggle('selected',active);b.textContent=active?'已加入对比 ✓':'加入对比 ＋'});
  tray.hidden=!selected.length;
  document.body.classList.toggle('has-comparison',!!selected.length);
  $('#compare-items').replaceChildren(...selected.map(id=>{const p=products.find(p=>p.id===id),b=document.createElement('button');b.innerHTML=`<img src="${p.image}" alt=""><span>${esc(p.short)}</span><i>×</i>`;b.setAttribute('aria-label','移除 '+p.short);b.onclick=()=>toggle(id);return b}));
  $('#compare-open').disabled=selected.length<2;$('#compare-open').textContent=selected.length<2?'再选一款同类产品':'对比 '+selected.length+' 款产品 →';
  $('#compare-tray-note').textContent=selected.length?familyOf(products.find(p=>p.id===selected[0]))?.title+' · 最多 3 款':'';
 }
 function toggle(id){
  const p=products.find(p=>p.id===id);if(!p)return;
  const i=selected.indexOf(id);
  if(i>=0)selected.splice(i,1);
  else{
   if(selected.length&&comparisonGroup(products.find(p=>p.id===selected[0]))!==comparisonGroup(p)){announce('请对比同一子分类的产品；清空当前选择后可切换品类。');$('#compare-tray-note').textContent='请先清空，再切换产品子分类';return}
   if(selected.length===3){announce('最多对比 3 款产品，可先移除一款。');$('#compare-tray-note').textContent='已选 3 款，可先移除一款';return}
   selected.push(id);
  }
  sync();announce(selected.includes(id)?p.short+' 已加入对比':p.short+' 已移出对比');
 }
 function open(){
  if(selected.length<2)return;priorFocus=document.activeElement;
  const list=selected.map(id=>products.find(p=>p.id===id)),zone=groupOf(list[0]);
  $('#compare-heading').textContent=(familyOf(list[0])?.title||catalogTree[zone].title)+' · 产品对比';
  const data=(p,key)=>{const v=getVariant(p);if(key==='capacity')return v?.capacity||p.capacity;if(key==='tbw')return v?.tbw;return v?.[key]||p.performance?.[key]};
  const rows=[['品牌',p=>p.brand+' · '+p.brandName],['官网分类',p=>familyOf(p)?.title],['容量 / 当前范围',p=>data(p,'capacity')],['接口',p=>p.interface],['顺序读取 · 标称最高',p=>data(p,'read')],['顺序写入 · 标称最高',p=>data(p,'write')],['数据速率',p=>data(p,'frequency')],['TBW · 已选容量',p=>data(p,'tbw')],['规格口径',p=>getVariant(p)?'已选 '+getVariant(p).capacity+(getVariant(p).read||getVariant(p).frequency?'；参见容量对应参数':'；性能仍为系列范围'):'系列范围；各容量可能不同']].filter(([,get])=>list.some(p=>get(p)));
  const fullKeys=[...new Set(list.flatMap(p=>p.full.map(([key])=>key)))];
  fullKeys.forEach(key=>rows.push([key,p=>p.full.find(([k])=>k===key)?.[1]]));
  $('#compare-table').innerHTML=`<table><caption class="sr-only">${esc(catalogTree[zone].title)}同类产品规格对比</caption><thead><tr><th scope="col">规格</th>${list.map(p=>`<th scope="col"><span class="compare-artwork" data-artwork="${p.id}"><img src="${p.image}" alt="${esc(p.short)} 官方产品图"></span><strong>${esc(p.short)}</strong><button data-open="${p.id}">查看详情 ↗</button></th>`).join('')}</tr></thead><tbody>${rows.map(([name,get])=>`<tr><th scope="row">${esc(name)}</th>${list.map(p=>`<td>${esc(get(p)||'未提供')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('#compare-table').style.setProperty('--columns',String(list.length));
  $('#compare-table').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{close();onProduct(b.dataset.open)});
  dialog.showModal();$('#compare-close').focus();announce('产品对比已打开');
  $('#compare-table').querySelectorAll('[data-artwork]').forEach(el=>frameArtwork(el,el.dataset.artwork,{pad:16}));
 }
 function close(){dialog.close();if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true})}
 $('#compare-open').onclick=open;$('#compare-clear').onclick=()=>{selected.length=0;sync();announce('已清空对比选择')};$('#compare-close').onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
 return{toggle,sync,open,get ids(){return[...selected]},get isOpen(){return dialog.open}};
}
