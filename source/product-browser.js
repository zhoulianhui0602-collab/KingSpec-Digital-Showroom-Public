import {catalogTree,industryTree,groupOf,sectionOf,familyId,familyOf} from './categories.js';
import {createComparison} from './comparison.js';
import {frameArtwork} from './product-artwork.js';

// DOM product browsing shares the existing scene and the verified product data.
export function createProductBrowser({products,state,zones,setPanel,updateState,focusZone,captureView,restoreView,resetScene,finishEntry,announce}){
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const variants=new Map(),contexts=new Map();
 let categoryFamily='',categoryBrand='',currentCategory='',catalogZone='all',catalogSection='all',catalogFamily='',origin='category',catalogPrevious=null,overviewView=null,returnId=null,lastHash=location.hash;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const variant=p=>p.variants?.find(v=>v.capacity===variants.get(p.id));
 const comparison=createComparison({products,getVariant:variant,onProduct:id=>openProduct(id,{origin:state.panel==='product'?origin:state.panel==='catalog'?'catalog':'category'}),announce});
 function familyRoute(k){return '#zone='+k+(categoryFamily?'&family='+categoryFamily:'')}
 function snapshot(){
  if(state.panel==='category')contexts.set(currentCategory,{family:categoryFamily,brand:categoryBrand,scroll:$('#category-panel').scrollTop,expanded:document.body.classList.contains('sheet-expanded'),view:captureView()});
  return{catalogZone,catalogSection,currentCategory,catalogFamily,search:$('#search-input').value,brand:$('#brand-filter').value,usage:$('#scene-filter').value,catalogScroll:$('#catalog').scrollTop,categories:Object.fromEntries(contexts),overviewView,variants:Object.fromEntries(variants)};
 }
 function saveCurrent(){try{history.replaceState({...history.state,context:snapshot()},'',location.href)}catch{}}
 function writeRoute(route,replace=false){
  try{if(location.hash===route)return;const parent=replace&&history.state?.ks?history.state.parent:location.hash;history[replace?'replaceState':'pushState']({ks:true,parent,origin,context:snapshot()},'',location.pathname+location.search+route);lastHash=route}catch{}
 }
 function restoreContext(c){
  if(!c)return;catalogZone=c.catalogZone||'all';catalogSection=c.catalogSection||'all';currentCategory=c.currentCategory||currentCategory;catalogFamily=c.catalogFamily||'';$('#search-input').value=c.search||'';$('#brand-filter').value=c.brand||'';$('#scene-filter').value=c.usage||'';overviewView=c.overviewView||null;
  contexts.clear();Object.entries(c.categories||{}).forEach(([k,v])=>contexts.set(k,v));Object.entries(c.variants||{}).forEach(([k,v])=>{if(!variants.has(k))variants.set(k,v)});
 }
 function title(t){document.title=t+' · KingSpec 数字展厅'}
 function fillStats(el,arr){
  el.replaceChildren(...arr.filter(([,v])=>v).map(([k,v])=>{const row=document.createElement('div');row.className='stat';const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;row.append(dt,dd);return row}));
 }
 function productCard(p,from){
  const card=document.createElement('article');card.className='product-tile';
  const value=p.performance.frequency||p.performance.read,metric=p.performance.frequency?'数据速率':'顺序读取 · 标称最高';
  card.innerHTML=`<button class="tile-open" data-open="${p.id}" aria-label="查看 ${esc(p.name)}"><span class="tile-image"><img src="${p.image}" alt="${esc(p.short)} 官方产品图" loading="lazy" decoding="async"></span><span class="tile-copy"><small class="product-brand-tag">${esc(p.brand)} · ${esc(p.brandName)}</small><strong>${esc(p.short)}</strong><span class="tile-family">${esc(familyOf(p)?.title||p.category)}</span><span class="tile-metric"><b>${esc(value||p.capacity)}</b><small>${esc(value?metric:'系列容量')}</small></span><span class="tile-action">查看产品 <i>↗</i></span></span></button><button class="tile-compare" data-compare="${p.id}" aria-pressed="false">加入对比 ＋</button>`;
  card.querySelector('[data-open]').onclick=()=>openProduct(p.id,{origin:from});card.querySelector('[data-compare]').onclick=()=>comparison.toggle(p.id);frameArtwork(card.querySelector('.tile-image'),p.id);return card;
 }
 function emptyState(family,zone,filtered){
  const box=document.createElement('div');box.className='empty-products';
  box.innerHTML=`<span class="empty-symbol">↗</span><h3>${filtered?'没有匹配的展示产品':'这个分类，继续去官网探索。'}</h3><p>${filtered?'尝试其他品牌或分类。':'展厅正在逐步收录代表产品，官网提供这个分类的完整目录。'}</p><a href="${family?.url||catalogTree[zone]?.url||'https://www.kingspec.com/'}" target="_blank" rel="noopener">浏览${esc(family?.title||'完整产品目录')} ↗</a>`;
  return box;
 }
 function renderCategory(k){
  const c=catalogTree[k],z=zones[k]||c,all=products.filter(p=>groupOf(p)===k),f=c.families.find(f=>f.id===categoryFamily);
  $('#category-number').textContent=z.no;$('#category-title').textContent=z.title;$('#category-en').textContent=z.en;$('#category-copy').textContent=z.copy;
  $('#category-connection').textContent=(industryTree[k]?'官网工业 / 企业产品分类':'官网消费产品分类')+' / '+c.en;$('#category-count').textContent=(f?f.title+' · ':'')+all.filter(p=>(!categoryFamily||familyId(p)===categoryFamily)&&(!categoryBrand||p.brand===categoryBrand)).length+' 款展示产品';
  $('#category-brands').textContent='代表产品 · '+[...new Set(all.map(p=>p.brand))].join(' / ');
  $('#category-switch').value=k;
  $('#category-brand-filter').replaceChildren(new Option('全部品牌',''),...[...new Set(all.map(p=>p.brand))].map(b=>new Option(b,b)));$('#category-brand-filter').value=categoryBrand;
  $('#category-families').replaceChildren(...[{id:'',title:'全部'},...c.families].map(item=>{const b=document.createElement('button');b.type='button';const count=all.filter(p=>!item.id||familyId(p)===item.id).length;b.innerHTML=`${esc(item.title)} <small>${count||'↗'}</small>`;b.classList.toggle('selected',item.id===categoryFamily);b.setAttribute('aria-pressed',String(item.id===categoryFamily));b.onclick=()=>{saveCurrent();categoryFamily=item.id;renderCategory(k);writeRoute(familyRoute(k));announce('已选择 '+item.title)};return b}));
  const list=all.filter(p=>(!categoryFamily||familyId(p)===categoryFamily)&&(!categoryBrand||p.brand===categoryBrand));
  $('#category-products').replaceChildren(...(list.length?list.map(p=>productCard(p,'category')):[emptyState(f,k,!!categoryBrand)]));
  $('#category-official').href=f?.url||c.url;$('#category-official').textContent='浏览官网'+(f?.title||c.title)+'完整目录 ↗';comparison.sync();
 }
 function openCategory(k,{route=true,move=true,focus=true,restore=false,family}={}){
  if(!catalogTree[k])return;if(route)saveCurrent();if(!state.zone&&!state.panel)overviewView=captureView();finishEntry();
  const context=contexts.get(k),requestedFamily=family??context?.family??'';categoryFamily=catalogTree[k].families.some(f=>f.id===requestedFamily)?requestedFamily:'';categoryBrand=context?.brand||'';currentCategory=k;
  state.zone=zones[k]?k:null;state.product=state.hover=null;origin='category';renderCategory(k);setPanel('category');updateState();
  document.body.classList.toggle('sheet-expanded',!!context?.expanded);syncSheet();
  if(restore&&context?.view)restoreView(context.view);else if(move&&zones[k])focusZone(k);
  $('#category-panel').scrollTop=restore?context?.scroll||0:0;if(route)writeRoute(familyRoute(k));title(catalogTree[k].title);
  if(focus){const b=restore&&returnId?$('#category-products').querySelector('[data-open="'+returnId+'"]'):null;(b||$('#category-title')).focus({preventScroll:true})}
  announce('已进入'+catalogTree[k].title+'，按分类选择产品。');
 }
 function renderProductStats(p){
  const v=variant(p),hasVariantPerformance=!!(v?.read||v?.write||v?.frequency),perf=hasVariantPerformance?v:p.performance;
  fillStats($('#product-stats'),[['接口',p.interface],['容量',v?.capacity||p.capacity],['顺序读取 · 标称最高',perf?.read],['顺序写入 · 标称最高',perf?.write],['数据速率',perf?.frequency]]);
  fillStats($('#all-stats'),[['官网分类',familyOf(p)?.title],...p.full,...(v?[['总写入量（TBW）',v.tbw]]:[]),['适用方向',p.application]]);
  $('#parameter-scope').textContent=v?(hasVariantPerformance?v.capacity+' 对应官网参数 · 读写为标称最高值':'已选择 '+v.capacity+'；读写仍为官网系列范围，未提供此容量独立性能。'):'当前为系列规格范围；具体容量与配置请核对对应规格。';
 }
 function openProduct(id,{route=true,origin:requestedOrigin}={}){
  const p=products.find(p=>p.id===id);if(!p)return;const switching=state.panel==='product';if(route)saveCurrent();
  if(!switching)origin=requestedOrigin||(state.panel==='catalog'?'catalog':'category');else if(requestedOrigin)origin=requestedOrigin;
  finishEntry();const changed=state.zone!==p.zone;state.zone=p.zone;state.product=id;state.hover=null;
  const productGroup=groupOf(p),z=catalogTree[productGroup],f=familyOf(p);$('#product-crumb').replaceChildren();currentCategory=productGroup;
  const breadcrumb=document.createElement('button');breadcrumb.textContent=z.title+' / '+(f?.title||p.category);breadcrumb.onclick=()=>openCategory(productGroup,{family:familyId(p)});$('#product-crumb').append(breadcrumb);
  $('#product-image').src=p.image;$('#product-image').alt=p.name+' 官方产品图';$('#product-brand').textContent=p.brand+' · '+p.brandName;$('#product-name').textContent=p.short;$('#product-description').textContent=p.lead;
  $('#product-options').replaceChildren(...products.filter(q=>groupOf(q)===productGroup&&familyId(q)===familyId(p)).map(q=>{const b=document.createElement('button');b.textContent=q.short;b.classList.toggle('selected',q.id===id);b.setAttribute('aria-pressed',String(q.id===id));b.onclick=()=>openProduct(q.id,{origin});return b}));
  $$('#detail-tabs button').forEach((b,i)=>b.classList.toggle('selected',i===0));
  $('#variant-field').hidden=!p.variants?.length;$('#variant-select').replaceChildren(new Option('系列概览',''),...(p.variants||[]).map(v=>new Option(v.capacity,v.capacity)));$('#variant-select').value=variants.get(id)||'';$('#variant-select').onchange=e=>{variants.set(id,e.target.value);renderProductStats(p);writeRoute('#product='+id+(e.target.value?'&capacity='+encodeURIComponent(e.target.value):''),true);announce(e.target.value?'已显示 '+e.target.value+' 对应参数':'已显示系列概览')};
  renderProductStats(p);$('#spec-details').open=false;$('#source-details').open=false;
  $('#spec-source').href=p.sourceUrl||p.link;$('#official-link').href=p.officialUrl||p.link;$('#official-link').textContent='官网产品与规格 ↗';$('#cn-reference').href=p.cnUrl||p.officialUrl||p.link;$('#cn-reference').hidden=!p.cnUrl||p.cnUrl===p.officialUrl;$('#source-note').textContent=p.sourceNote||'官网系列标称值；具体容量与设备平台可能影响性能。';$('#source-date').textContent='参数核对：'+p.verifiedAt;
  $('#close-product').textContent=origin==='catalog'?'← 返回产品目录':'← 返回'+z.title;$('#close-product').setAttribute('aria-label',$('#close-product').textContent);
  $('#product-compare').dataset.compare=id;$('#product-compare').onclick=()=>comparison.toggle(id);
  setPanel('product');updateState();$('#inspector').scrollTop=0;$('#inspector .product-copy').scrollTop=0;
  frameArtwork($('#product-image').parentElement,p.id,{pad:40});
  if(changed&&zones[p.zone])focusZone(p.zone);if(route)writeRoute('#product='+id+(variant(p)?'&capacity='+encodeURIComponent(variant(p).capacity):''),switching);comparison.sync();title(p.short);$('#product-name').focus({preventScroll:true});announce('已打开 '+p.name+' 产品详情');
 }
 function catalogFamilies(){
  const select=$('#catalog-family');select.replaceChildren(new Option('全部子分类',''));
  for(const [k,c]of Object.entries(catalogTree)){if(catalogZone!=='all'&&catalogZone!==k||catalogSection==='consumer'&&industryTree[k]||catalogSection==='industry'&&!industryTree[k])continue;const group=document.createElement('optgroup');group.label=c.title;for(const f of c.families)group.append(new Option(f.title,k+':'+f.id));select.append(group)}
  select.value=catalogFamily;if(select.value!==catalogFamily)catalogFamily='';
 }
 function renderResults(){
  const q=$('#search-input').value.trim().toLowerCase(),brand=$('#brand-filter').value,usage=$('#scene-filter').value;
  const list=products.filter(p=>(catalogSection==='all'||sectionOf(p)===catalogSection)&&(catalogZone==='all'||groupOf(p)===catalogZone)&&(!catalogFamily||groupOf(p)+':'+familyId(p)===catalogFamily)&&(!brand||p.brand===brand)&&(!usage||p.scenes.includes(usage))&&q.split(/\s+/).every(term=>[p.name,p.short,p.category,catalogTree[groupOf(p)].title,familyOf(p)?.title,p.brand,p.brandName,p.interface,p.capacity,...p.chips,...p.traits,...p.scenes].join(' ').toLowerCase().includes(term)));
  $('#result-count').textContent=list.length+' 款匹配 / '+products.length+' 款代表产品 · 26 个官网子类';$('#clear-filters').hidden=!q&&!brand&&!usage&&!catalogFamily&&catalogZone==='all'&&catalogSection==='all';
  const selected=catalogFamily.split(':'),f=catalogTree[selected[0]]?.families.find(f=>f.id===selected[1]);
  $('#results').replaceChildren(...(list.length?list.map(p=>productCard(p,'catalog')):[emptyState(f,catalogZone,q||brand||usage)]));comparison.sync();
 }
 function updateFilters(){$$('#catalog-filters button').forEach(b=>{b.hidden=b.dataset.zone!=='all'&&(catalogSection==='consumer'&&industryTree[b.dataset.zone]||catalogSection==='industry'&&!industryTree[b.dataset.zone]);b.classList.toggle('selected',b.dataset.zone===catalogZone);b.setAttribute('aria-pressed',String(b.dataset.zone===catalogZone))});$$('#catalog-sections button').forEach(b=>{b.classList.toggle('selected',b.dataset.section===catalogSection);b.setAttribute('aria-pressed',String(b.dataset.section===catalogSection))})}
 function clearCatalogFilters(){catalogZone='all';catalogSection='all';catalogFamily='';$('#search-input').value='';$('#brand-filter').value='';$('#scene-filter').value='';catalogFamilies();updateFilters();renderResults();announce('已清除筛选')}
 function openCatalog({route=true,restore=false}={}){
  if(route)saveCurrent();if(!restore)catalogPrevious={zone:state.zone,category:currentCategory,product:state.product};finishEntry();state.hover=state.product=null;setPanel('catalog');updateState();catalogFamilies();updateFilters();renderResults();
  $('#close-catalog').textContent=catalogPrevious?.product?'返回产品 ×':catalogPrevious?.category?'返回'+catalogTree[catalogPrevious.category].title+' ×':catalogPrevious?.zone?'返回展区 ×':'返回展厅 ×';$('#close-catalog').setAttribute('aria-label',$('#close-catalog').textContent);
  if(route)writeRoute('#index');title('产品目录');$('#search-input').focus({preventScroll:true});
 }
 function reset({route=true,restore=false}={}){
  if(route)saveCurrent();finishEntry();currentCategory='';state.zone=state.hover=state.product=null;setPanel(null);updateState();document.body.classList.remove('sheet-expanded');resetScene(restore?overviewView:null);if(route)writeRoute('');title('存储，各得其所');$('#overview').focus({preventScroll:true});
 }
 function backOne(){
  if(state.panel==='product'){
   returnId=state.product;
   if(history.state?.ks&&Object.hasOwn(history.state,'parent')&&(/^#zone=|^#index$/.test(history.state.parent))){history.back();return}
   if(origin==='catalog'){openCatalog({route:false,restore:true});writeRoute('#index',true)}else{openCategory(currentCategory,{route:false,restore:true});writeRoute(familyRoute(currentCategory),true)}return;
  }
  if(state.panel==='catalog'){
   if(history.state?.ks&&Object.hasOwn(history.state,'parent')){history.back();return}
   if(catalogPrevious?.category||catalogPrevious?.zone){openCategory(catalogPrevious.category||catalogPrevious.zone,{restore:true});return}
  }
  reset({restore:true});
 }
 function restoreRoute(){
  const h=location.hash,c=history.state?.context;restoreContext(c);
  if(h.startsWith('#zone=')){const params=new URLSearchParams(h.slice(1)),k=params.get('zone');if(catalogTree[k]){openCategory(k,{route:false,restore:true,family:params.get('family')||''});return}}
  if(h.startsWith('#product=')){const params=new URLSearchParams(h.slice(1)),id=params.get('product'),p=products.find(p=>p.id===id),capacity=params.get('capacity');if(p){if(capacity&&p.variants?.some(v=>v.capacity===capacity))variants.set(id,capacity);openProduct(id,{route:false,origin:history.state?.origin||'category'});return}}
  if(h==='#index'){openCatalog({route:false,restore:true});$('#catalog').scrollTop=c?.catalogScroll||0;return}
  reset({route:false,restore:true});
 }
 function syncSheet(){const expanded=document.body.classList.contains('sheet-expanded');$('#category-expand').setAttribute('aria-expanded',String(expanded));$('#category-expand').textContent=expanded?'收起，查看展台 ↓':'展开产品列表 ↑'}
 $('#category-expand').onclick=()=>{document.body.classList.toggle('sheet-expanded');syncSheet()};
 $('#category-brand-filter').onchange=e=>{categoryBrand=e.target.value;renderCategory(currentCategory)};
 $('#category-switch').replaceChildren(...Object.entries(catalogTree).map(([k,c])=>new Option(c.title,k)));$('#category-switch').onchange=e=>openCategory(e.target.value);
 const sectionBar=document.createElement('div');sectionBar.id='catalog-sections';sectionBar.className='catalog-sections';sectionBar.setAttribute('aria-label','官网产品体系');$('#catalog-filters').before(sectionBar);
 sectionBar.replaceChildren(...[{id:'all',title:'全部品类 · 26'},{id:'consumer',title:'消费存储 · 16'},{id:'industry',title:'工业与企业 · 10'}].map(c=>{const b=document.createElement('button');b.type='button';b.textContent=c.title;b.dataset.section=c.id;b.onclick=()=>{catalogSection=c.id;catalogZone='all';catalogFamily='';$('#brand-filter').value='';$('#scene-filter').value='';catalogFamilies();updateFilters();renderResults()};return b}));
 $('#catalog-filters').replaceChildren(...[{id:'all',title:'全部产品'},...Object.entries(catalogTree).map(([id,c])=>({id,title:c.title}))].map(c=>{const b=document.createElement('button');b.textContent=c.title;b.dataset.zone=c.id;b.onclick=()=>{catalogZone=c.id;catalogFamily='';catalogFamilies();updateFilters();renderResults()};return b}));
 $('#brand-filter').replaceChildren(new Option('全部品牌',''),...[...new Set(products.map(p=>p.brand))].map(b=>new Option(b+' '+products.find(p=>p.brand===b).brandName,b)));
 $('#scene-filter').replaceChildren(new Option('全部用途',''),...[...new Set(products.flatMap(p=>p.scenes))].map(s=>new Option(s,s)));
 $('#catalog-family').onchange=e=>{catalogFamily=e.target.value;renderResults()};$('#brand-filter').onchange=$('#scene-filter').onchange=renderResults;$('#clear-filters').onclick=clearCatalogFilters;$('#search-input').addEventListener('input',renderResults);$('#product-total').textContent=String(products.length);
 $('.skip').onclick=e=>{e.preventDefault();openCatalog()};$('#catalog-button').onclick=()=>openCatalog();$('#close-catalog').onclick=backOne;$('#close-product').onclick=backOne;$('#close-category').onclick=()=>reset({restore:true});$('#fallback-index').onclick=()=>openCatalog();
 $('#explore').onclick=()=>openCategory('ssd');$('#browse-all').textContent='浏览全部品类 →';$('#browse-all').onclick=()=>openCatalog();$('#back-view').onclick=()=>reset({restore:true});for(const id of ['home','overview','reset-button'])$('#'+id).onclick=()=>reset();
 const industryLink=$('.industry-link');if(industryLink){industryLink.textContent='工业与企业存储 · 在展厅浏览 →';industryLink.href='#index';industryLink.removeAttribute('target');industryLink.onclick=e=>{e.preventDefault();catalogSection='industry';catalogZone='all';catalogFamily='';$('#brand-filter').value='';$('#scene-filter').value='';openCatalog()}};
 $('#copy-product-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#copy-product-link').textContent='链接已复制 ✓';announce('产品链接已复制');setTimeout(()=>$('#copy-product-link').textContent='分享产品 ↗',2200)}catch{announce('当前浏览器无法复制，可复制地址栏中的产品链接。')}};
 $$('#detail-tabs button').forEach(b=>b.onclick=()=>{const target=$('#'+b.dataset.target);if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});$$('#detail-tabs button').forEach(x=>x.classList.toggle('selected',x===b))});
 window.addEventListener('popstate',()=>{lastHash=location.hash;restoreRoute()});window.addEventListener('hashchange',()=>{if(location.hash!==lastHash){lastHash=location.hash;restoreRoute()}});
 return{openCategory,openProduct,openCatalog,backOne,reset,restoreRoute,comparison};
}
