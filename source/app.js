import { finish, makeGlassFinish, makeMetalFinish, makeDesignedFinish, setSurfaceTransparency } from './surface-finish.js';
import { applyStudioEnvironment } from './studio-environment.js';
import { createCoreBaseLight } from './core-base-light.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import kingSpecMark from './assets/brands/kingspec.png';
import oneBoomMark from './assets/brands/oneboom.png';
import memoStoneMark from './assets/brands/memostone.png';
import mixageMark from './assets/brands/mixage.png';
import { categoryTree } from './categories.js';
import { createProductBrowser } from './product-browser.js';

// V2 retains the V1 GLB, orbit controls, index, and product inspector.
const products=__PRODUCT_DATA__, architecture=__ARCHITECTURE__;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const BRAND=new THREE.Color('#e8380d'), NEUTRAL=new THREE.Color('#758086');
const ease=t=>t*t*(3-2*t), clamp=THREE.MathUtils.clamp, damp=THREE.MathUtils.damp;
const zones={
 ssd:{title:'内置固态硬盘',en:'INTERNAL SSD',no:'01',sub:'NVMe / SATA',point:[-4.75,1.45,2.8],copy:'从系统启动，到大型项目的持续读写。'},
 ram:{title:'内存',en:'MEMORY',no:'02',sub:'DESKTOP MEMORY',point:[4.75,1.45,2.8],copy:'连接工作中的数据，让每一次响应有序发生。'},
 portable:{title:'移动存储',en:'PORTABLE STORAGE',no:'03',sub:'USB / PSSD',point:[-4.75,1.45,-2.8],copy:'让内容随行，在设备之间连接创作。'},
 card:{title:'存储卡',en:'MEMORY CARD',no:'04',sub:'MICROSD / UHS-I',point:[4.75,1.45,-2.8],copy:'从捕捉瞬间开始，将灵感留存在每一帧。'}
};
Object.keys(zones).forEach(k=>{Object.assign(zones[k],categoryTree[k]);zones[k].ids=products.filter(p=>p.zone===k).map(p=>p.id)});
const layerNames=['内置存储节点','内存节点','移动存储节点','影像存储节点','数据连接层','架构组织层'];
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionQuery.matches,motionPaused=false,mobile=innerWidth<=800;
const state={mode:'IDLE',zone:null,hover:null,product:null,panel:null};
let scene,camera,renderer,controls,composer,bloom,bloomComposer,bloomMix,model,lid,raf,lastTime=0,sceneTime=8,isLoaded=false;
let transition=null,explodeTarget=0,wireMode=false,entryStart=null,entryDone=false,dragging=false;
let currentPanel=null,catalogFilter='全部',lastFocus=null,returnFromProduct='category',catalogPrevious=null,catalogScroll=0;
const selectedVariants=new Map();
let exhibitions,exhibitReturn=null;
let quality=mobile?1:2,frames=[],perfLast=0,lowFrames=0,stats={},pendingQuality=null,pendingResize=false;
const meshes=[],layers=[],hotspots=[],flows=[],pickTargets=[],labelItems=[],errors=[];
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster(),matrix=new THREE.Matrix4(),scratch=new THREE.Vector3();
let pointerDown=null,hasUserView=false;
// V2.1 drives the existing explode target; user actions own the scene immediately.
const autoExpand={clock:0,running:false,locked:false,eligibleAt:Infinity,source:'auto',reason:'等待入场'};
let wireBlend=0,modeTransition=null,lastExpand=0;
const layerScan=new Float32Array(6),scanArmed=Array(6).fill(true),contactShadows=[];
const layerFocus={hover:0,tap:0,until:0};
const SILVER_LOW=new THREE.Color('#9fa8ac'),SILVER_HIGH=new THREE.Color('#c3cbce'),EDGE_COLOR=new THREE.Color('#aab2b5');
// V2.1.1: local emission, independent of scene lighting and the white engineering edges.
const CORE_COLOR=new THREE.Color('#aeb9bd'),coreOverlays=[],coreGlowMeshes=[],glowSources=new Set();
const glowConfig={base:.29,breath:.09,period:6,scan:.33,scanDecay:.65,stagger:.065,arrival:.56,arrivalDuration:.18,wire:.29,threshold:.88,strength:.14,radius:.10};
const scanDue=Array(6).fill(Infinity),scanEvents=[];let autoScanArmed=true;
const bloomBlack=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide}),savedBloom=[];
const podiumMarks=[];
let studioEnvironment=null,coreBaseLight=null;
function lightingStatus(){return {
 environment:studioEnvironment,
 pcb:meshes.filter(o=>o.material.userData.pcbAnimation).map(o=>({name:o.name,role:o.userData.surfaceRole,color:o.material.emissive.getHexString(),period:finish.lighting.pcb.period,time:o.material.userData.pcbAnimation.time.value,still:o.material.userData.pcbAnimation.still.value,emission:o.material.emissiveIntensity,bloom:glowSources.has(o),solidGeometry:true,vertices:o.geometry.getAttribute('position').count,flowAttribute:o.geometry.getAttribute('_ks_flow')?.count??0,flowDimensions:o.geometry.getAttribute('_ks_flow')?.itemSize??0,texture:!!(o.material.map||o.material.emissiveMap)})),
 podiumFrames:meshes.filter(o=>o.userData.surfaceRole==='podiumFrame').map(o=>({name:o.name,zone:o.userData.zone,visible:o.visible,layer:o.userData.layer??null,vertices:o.geometry.getAttribute('position').count,rodWidth:o.userData.rodWidth??o.userData.frameRodWidth??null,emissive:o.material.emissive?.getHexString(),emission:o.material.emissiveIntensity,edgeOverlay:!!o.userData.edge,bloom:glowSources.has(o)})),
 dragon:meshes.filter(o=>o.userData.brandDecal).map(o=>({name:o.name,parent:o.parent?.name,texture:!!o.material.map,textureSize:o.material.map?.image?{width:o.material.map.image.width,height:o.material.map.image.height}:null,opacity:o.material.opacity,depthWrite:o.material.depthWrite,worldPosition:o.getWorldPosition(new THREE.Vector3()).toArray(),color:o.material.color.getHexString(),bloom:glowSources.has(o)})),
 logos:{count:podiumMarks.length,backingPlanes:scene?.children.filter(o=>o.name.startsWith('BrandPlaque_')).length??0,blackPlaque:!!model?.getObjectByName('PCB_deck_silicon')?.isMesh,positions:podiumMarks.map(o=>({name:o.name,position:o.position.toArray()}))},
 coreBase:coreBaseLight?.getStatus(),
 invalidMaterials:meshes.filter(o=>![o.material.opacity,...o.material.color.toArray(),o.material.emissiveIntensity??0].every(Number.isFinite)).map(o=>o.name)
}}
const podiumBrands={ssd:{name:'KingSpec',image:kingSpecMark},ram:{name:'ONEBOOM',image:oneBoomMark},portable:{name:'MemoStone',image:memoStoneMark},card:{name:'MIXAGE',image:mixageMark}};
function makePodiumMarks(){
 const loader=new THREE.TextureLoader();
 for(const [zone,brand] of Object.entries(podiumBrands)){
  const [x,,z]=zones[zone].point;
  // Fixed to the front face (+Z) of each existing podium, never camera-facing.
  loader.load(brand.image,texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
   const aspect=texture.image.width/texture.image.height,width=Math.min(finish.design.logo.width,finish.design.logo.maxHeight*aspect),height=width/aspect;
   const material=new THREE.MeshBasicMaterial({map:texture,color:BRAND,transparent:true,opacity:.45,depthWrite:false,toneMapped:false});
   // Align original artwork to the same left/top inset; preserve its aspect ratio.
   const mark=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mark.name='PodiumLogo_'+brand.name;mark.position.set(x+finish.design.logo.leftInset+width/2,finish.design.logo.top-height/2,z+finish.design.logo.front);mark.renderOrder=4;scene.add(mark);podiumMarks.push(mark);glowSources.add(mark);
  },undefined,()=>announce(brand.name+' 展台标识加载失败。'));
 }
}
function animatePodiumMarks(t){
 const breath=noMotion()?.5:(1-Math.cos(t*Math.PI/3))*.5;
 for(const mark of podiumMarks)mark.material.opacity=(.52+breath*.08)*THREE.MathUtils.lerp(1,.82,wireBlend);
}
function pauseAuto(reason,lock=false){autoExpand.running=false;autoExpand.reason=reason;autoExpand.eligibleAt=performance.now()+4000;if(lock)autoExpand.locked=true}
function syncExpand(value){explodeTarget=Math.round(clamp(value,0,1)*10000)/10000;$('#explode').value=(explodeTarget*100).toFixed(2);$('#explode-value').textContent=Math.round(explodeTarget*100)+'%';document.body.classList.toggle('exploded',explodeTarget>.05)}
function syncAutoClock(){const inverse=Math.acos(1-2*explodeTarget)/Math.PI*4.5;autoExpand.clock=autoExpand.clock>=5?9.5-inverse:inverse}
function resumeAuto(delay=4000){autoExpand.locked=false;autoExpand.source='auto';autoExpand.eligibleAt=performance.now()+delay;autoExpand.reason='总览静候';syncAutoClock()}
function driveAutoExpand(time,dt){
 // Merely showing the controls is not user input; opening the page must still
 // run the existing automatic sequence. Actual controls retain pause/takeover.
 const available=entryDone&&isLoaded&&state.mode==='IDLE'&&!currentPanel&&!$('#guide').open&&!dragging&&!controls.autoRotate&&!autoExpand.locked&&!noMotion();
 autoExpand.running=available&&time>=autoExpand.eligibleAt;
 if(autoExpand.running){autoExpand.source='auto';autoExpand.clock=(autoExpand.clock+dt)%10.3;const c=autoExpand.clock;syncExpand(c<4.5?(1-Math.cos(Math.PI*c/4.5))/2:c<5?1:c<9.5?(1+Math.cos(Math.PI*(c-5)/4.5))/2:0)}
 const label=reduced?'减少动态 · 自动解析已关闭':autoExpand.running?'自动解析 · 操作即暂停':autoExpand.locked?'手动控制 · 返回总览后恢复':motionPaused?'动态已暂停':'自动解析已暂停';
 if($('#auto-status').textContent!==label)$('#auto-status').textContent=label;
}
const audit=new URLSearchParams(location.search).has('audit');
const auditSamples=[];let auditLast=0;
const lightingAudit=audit?document.createElement('script'):null;
if(lightingAudit){lightingAudit.type='application/json';lightingAudit.id='ks-lighting-audit';document.body.append(lightingAudit)}
$('#brand-logo').src=__LOGO_BASE64__;
function announce(t){$('#announcement').textContent=t}
function effectiveZone(){return state.hover||state.zone}
function noMotion(){return reduced||motionPaused}
function updateState(){
 state.mode=state.product?'PRODUCT_DETAIL':state.zone?'FOCUS':state.hover?'HOVER':'IDLE';document.body.dataset.state=state.mode;
 const k=effectiveZone(),z=zones[k];
 $$('.zone-nav button').forEach(b=>{b.classList.toggle('active',b.dataset.zone===state.zone);b.classList.toggle('hovered',b.dataset.zone===state.hover);b.setAttribute('aria-pressed',String(b.dataset.zone===state.zone))});
 hotspots.forEach(h=>h.el.classList.toggle('active',h.zone===k));
 $('#zone-label').textContent=state.zone&&zones[state.zone]?zones[state.zone].no+' / '+zones[state.zone].title:'选择一个展区，开始探索';
 $('#connection-caption').textContent=z?z.title+' · '+z.ids.length+' 款代表产品':'四种存储形态，各得其所。';
 $('#connection-caption').classList.toggle('connected',!!k);$('#back-view').hidden=!state.zone||!!currentPanel;
}
function setHover(k){if(state.hover===k)return;state.hover=k;pauseAuto(k?'产品悬停':'悬停结束');updateState()}
function bindZoneHover(el,k){el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')setHover(k)});el.addEventListener('pointerleave',()=>setHover(null));el.addEventListener('focus',()=>setHover(k));el.addEventListener('blur',()=>setHover(null))}
function setPanel(type){
 if(type)pauseAuto('浏览产品');currentPanel=state.panel=type;
 for(const[id,key]of[['inspector','product'],['catalog','catalog'],['category-panel','category']])$('#'+id).hidden=key!==type;
 document.body.dataset.panel=type||'overview';document.body.classList.toggle('has-panel',!!type);document.body.classList.toggle('detail-open',type==='product'||type==='catalog');
 $('#intro').inert=!!type;$('#catalog-button').classList.toggle('active',type==='catalog');$('#overview').classList.toggle('active',!type);
 $('#view-controls').inert=!!type||!document.body.classList.contains('controls-open');
}
const productBrowser=createProductBrowser({products,state,zones,setPanel,updateState,announce,finishEntry,
 captureView:()=>camera&&controls?{position:camera.position.toArray(),target:controls.target.toArray()}:null,
 restoreView:view=>{if(camera&&controls){controls.autoRotate=false;updateOrbit();hasUserView=true;flyTo(new THREE.Vector3(...view.position),new THREE.Vector3(...view.target),650)}},
 focusZone:k=>{if(camera&&controls)focusZone(k)},
 resetScene:view=>{hasUserView=!!view;if(controls){controls.autoRotate=false;updateOrbit();flyTo(view?new THREE.Vector3(...view.position):homePosition(),view?new THREE.Vector3(...view.target):homeTarget())}resumeAuto()}
});
function openCategory(k,options={}){productBrowser.openCategory(k,options)}
function openProduct(id,options={}){productBrowser.openProduct(id,options)}
function openCatalog(options={}){productBrowser.openCatalog(options)}
function backOne(){productBrowser.backOne()}
function resetView(options={}){productBrowser.reset(options)}
function restoreRoute(){productBrowser.restoreRoute()}
function writeRoute(route,replace=false){try{if(location.hash!==route)history[replace?'replaceState':'pushState']({ks:true},'',location.pathname+location.search+route)}catch{}}
for(const b of $$('.zone-nav button')){b.onclick=()=>openCategory(b.dataset.zone);bindZoneHover(b,b.dataset.zone)}
$('#help-button').onclick=()=>{pauseAuto('打开指南');$('#guide').showModal();setHover(null)};for(const id of ['close-guide','start-guide'])$('#'+id).onclick=()=>$('#guide').close();$('#guide').addEventListener('close',()=>pauseAuto('关闭指南'));
$('#guide').addEventListener('click',e=>{if(e.target===$('#guide')){const r=$('#guide').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#guide').close()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#guide').open&&!productBrowser.comparison.isOpen){if(!entryDone)finishEntry();else if(currentPanel||state.zone)backOne();else if(document.body.classList.contains('controls-open'))$('#controls-toggle').click()}});
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{announce('当前浏览器不支持全屏，可放大窗口浏览。')}};document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'退出全屏 ↙':'全屏体验 ↗'});
$('#explode').step='.01';$('#explode').onpointerdown=()=>{pauseAuto('手动展开',true);autoExpand.source='manual'};$('#explode').oninput=e=>{finishEntry();pauseAuto('手动展开',true);autoExpand.source='manual';syncExpand(Number(e.target.value)/100);syncAutoClock()};
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,summary,dialog'))pauseAuto('用户操作')},true);
document.addEventListener('keydown',e=>{if(e.key!=='Escape')pauseAuto('键盘操作')},true);
function setControlsOpen(open){document.body.classList.toggle('controls-open',open);$('#controls-toggle').setAttribute('aria-expanded',String(open));$('#controls-toggle').setAttribute('aria-label',open?'收起结构与视图控制':'展开结构与视图控制');$('#view-controls').inert=!open||!!currentPanel}
setControlsOpen(true);
$('#controls-toggle').onclick=()=>{pauseAuto('视图面板');setControlsOpen(!document.body.classList.contains('controls-open'))};
function updateOrbit(){$('#orbit-button').setAttribute('aria-pressed',String(controls?.autoRotate||false));$('#orbit-button').textContent=controls?.autoRotate?'暂停环绕':'环绕观察'}
$('#orbit-button').onclick=()=>{if(!controls)return;pauseAuto('环绕观察',true);controls.autoRotate=!controls.autoRotate;transition=null;hasUserView=true;updateOrbit()};
$('#motion-button').onclick=()=>{motionPaused=!motionPaused;pauseAuto('动态开关');$('#motion-button').setAttribute('aria-pressed',String(motionPaused));$('#motion-button').textContent=motionPaused?'继续动态':'暂停动态';if(motionPaused&&controls){controls.autoRotate=false;updateOrbit()}};
motionQuery.addEventListener('change',e=>{reduced=e.matches;if(controls)controls.enableDamping=!reduced;if(reduced){finishEntry();if(controls){controls.autoRotate=false;updateOrbit()}}});
function setMode(wire){pauseAuto('材质切换');wireMode=wire;modeTransition={start:performance.now(),from:wireBlend,to:wire?1:0};$('#wire-mode').classList.toggle('selected',wire);$('#glass-mode').classList.toggle('selected',!wire);$('#wire-mode').setAttribute('aria-pressed',String(wire));$('#glass-mode').setAttribute('aria-pressed',String(!wire));announce(wire?'正在渐变为工程线框':'正在渐变为透明结构')}
$('#wire-mode').onclick=()=>setMode(true);$('#glass-mode').onclick=()=>setMode(false);

function homePosition(){const p=mobile?new THREE.Vector3(28.0,25.4,31.8):new THREE.Vector3(17.8,14.8,18.9),target=homeTarget(),scale=mobile&&innerWidth<=390?1.09:1;return p.sub(target).divideScalar(scale).add(target)}
function homeTarget(){return mobile?new THREE.Vector3(0,1.55,0):new THREE.Vector3(-1.1,2.05,0)}
function flyTo(pos,target,duration=900){if(!camera)return;if(camera.position.distanceToSquared(pos)<1e-8&&controls.target.distanceToSquared(target)<1e-8){transition=null;return}if(reduced){camera.position.copy(pos);controls.target.copy(target);controls.update();return}transition={start:performance.now(),duration,from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target}}
function focusZone(k){
 if(!zones[k])return;
 const anchor=model?.getObjectByName('anchor_'+k),p=anchor?anchor.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(...zones[k].point);
 controls.autoRotate=false;updateOrbit();hasUserView=false;
 const sx=Math.sign(p.x),sz=Math.sign(p.z),vec=mobile?new THREE.Vector3(sx*9.2,9.2,sz*13.3):new THREE.Vector3(sx*10.8,8.8,sz*13.0);
 const right=new THREE.Vector3(vec.z,0,-vec.x).normalize(),target=p.clone().addScaledVector(right,mobile?0:3.7);target.y+=mobile?-4.1:.10;
 flyTo(target.clone().add(vec),target,750);
}
function qualitySettings(){const pixel=Math.min(devicePixelRatio,mobile?(quality===0?1:1.25):(quality===0?1:quality===1?1.25:1.5));if(renderer.getPixelRatio()!==pixel)renderer.setPixelRatio(pixel);const size=renderer.getSize(new THREE.Vector2());if(size.x!==innerWidth||size.y!==innerHeight)renderer.setSize(innerWidth,innerHeight);if(!mobile&&quality===2)ensurePost();if(composer){const enabled=!mobile&&quality===2;composer.setPixelRatio(pixel);composer.setSize(enabled?innerWidth:1,enabled?innerHeight:1);bloomComposer.setPixelRatio(Math.min(pixel,1));bloomComposer.setSize(enabled?Math.round(innerWidth*.65):1,enabled?Math.round(innerHeight*.65):1);bloom.materialHighPassFilter.uniforms.sourceTexel.value.set(1/bloomComposer.readBuffer.width,1/bloomComposer.readBuffer.height)}for(const o of meshes)if(o.userData.zone==='background')o.visible=!mobile&&quality>0}
function ensurePost(){
 if(composer)return;
 bloomComposer=new EffectComposer(renderer);bloomComposer.renderToScreen=false;bloomComposer.addPass(new RenderPass(scene,camera));bloom=new UnrealBloomPass(new THREE.Vector2(1,1),glowConfig.strength,glowConfig.radius,glowConfig.threshold);bloomComposer.addPass(bloom);bloom.compositeMaterial.uniforms.bloomFactors.value=[1,.4,.12,.02,0];
 // Preserve thin emissive traces when the bright pass downsamples the isolated mask.
 // A four-tap maximum avoids averaging a subpixel line below the luminance threshold.
 bloom.materialHighPassFilter.uniforms.sourceTexel={value:new THREE.Vector2(1,1)};
 bloom.materialHighPassFilter.fragmentShader=bloom.materialHighPassFilter.fragmentShader.replace('uniform sampler2D tDiffuse;','uniform sampler2D tDiffuse; uniform vec2 sourceTexel;').replace('vec4 texel = texture2D( tDiffuse, vUv );','vec2 d=sourceTexel*.5; vec4 texel=max(max(texture2D(tDiffuse,vUv+vec2(d.x,d.y)),texture2D(tDiffuse,vUv+vec2(-d.x,d.y))),max(texture2D(tDiffuse,vUv+vec2(d.x,-d.y)),texture2D(tDiffuse,vUv-d)));');
 composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 // Pinned Three r180: horizontal[0] is the pure bloom composite, without the source image.
 // Adding this texture avoids drawing the bright source a second time over the normal render.
 bloomMix=new ShaderPass({uniforms:{tDiffuse:{value:null},tGlow:{value:null},amount:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform sampler2D tGlow;uniform float amount;varying vec2 vUv;void main(){vec4 base=texture2D(tDiffuse,vUv);gl_FragColor=vec4(base.rgb+texture2D(tGlow,vUv).rgb*amount,base.a);}'});bloomMix.uniforms.tGlow.value=bloom.renderTargetsHorizontal[0].texture;composer.addPass(bloomMix);composer.addPass(new OutputPass());
}
function renderSelectiveBloom(){
 // Mask non-emissive opaque geometry; skip transparent shells and ordinary lines.
 // Only the allowlist is bright. No white edge, UI, floor or glass enters bloom.
 const bg=scene.background;scene.background=new THREE.Color(0);savedBloom.length=0;
 scene.traverse(o=>{if(!o.material||!o.visible)return;const m=o.material;if(glowSources.has(o)){
  if(m.emissive){savedBloom.push({o,m,intensity:m.emissiveIntensity});m.emissiveIntensity*=4.5}
  else{savedBloom.push({o,m,color:m.color.clone()});m.color.multiplyScalar(4.5)}
 }else{savedBloom.push({o,m,visible:o.visible});if(o.isMesh&&m.depthWrite)o.material=bloomBlack;else o.visible=false}});
 try{bloomComposer.render()}finally{for(const s of savedBloom){s.o.material=s.m;if(s.intensity!==undefined)s.m.emissiveIntensity=s.intensity;else if(s.color)s.m.color.copy(s.color);else s.o.visible=s.visible}scene.background=bg}
 // The gain is confined to the bloom mask: the actual emissive material stays at .34 + .12.
 bloomMix.uniforms.amount.value=1-wireBlend;composer.render();
}
function handleResize(){if(!renderer)return;const changed=(innerWidth<=800)!==mobile;mobile=innerWidth<=800;if(changed)quality=mobile?1:2;camera.fov=mobile?43:38;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();qualitySettings();frames=[];if(exhibitions?.active){exhibitions.focus()}else if(!hasUserView){if(state.zone)focusZone(state.zone);else flyTo(homePosition(),homeTarget(),600)}}
function fallback(err){errors.push(String(err));isLoaded=false;finishEntry();$('#load-status').hidden=true;$('#fallback').hidden=false;$('#intro').hidden=true;$('#view-hint').textContent='产品图片和规格仍可正常浏览';for(const id of ['explode','orbit-button','wire-mode','glass-mode'])$('#'+id).disabled=true;announce('三维视图不可用，已保留产品索引。')}
function setup(){try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.outputColorSpace=THREE.SRGBColorSpace;$('#canvas-host').append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');renderer.info.autoReset=false;
 scene=new THREE.Scene();scene.background=new THREE.Color('#08090a');scene.fog=new THREE.FogExp2('#08090a',.013);camera=new THREE.PerspectiveCamera(mobile?43:38,innerWidth/innerHeight,.1,140);camera.position.copy(homePosition());
 controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(homeTarget());controls.enableDamping=!reduced;controls.dampingFactor=.075;controls.minDistance=7;controls.maxDistance=65;controls.minPolarAngle=.30;controls.maxPolarAngle=Math.PI*.465;controls.autoRotateSpeed=.30;controls.update();
 controls.addEventListener('start',()=>{finishEntry();pauseAuto('手动镜头',true);transition=null;hasUserView=true;controls.autoRotate=false;dragging=true;updateOrbit();setHover(null)});controls.addEventListener('end',()=>dragging=false);
 studioEnvironment=applyStudioEnvironment(renderer,scene,finish.environmentIntensity,finish.lighting.environmentRotation);
 scene.add(new THREE.HemisphereLight('#e2e5e6','#202529',finish.lighting.hemisphere));const key=new THREE.DirectionalLight('#fafafa',finish.lighting.key);key.position.set(-4,12,7);scene.add(key);const rim=new THREE.DirectionalLight('#ffffff',finish.lighting.rim);rim.position.set(3,5,-9);scene.add(rim);
 qualitySettings();
 const bytes=Uint8Array.from(atob(__MODEL_BASE64__),c=>c.charCodeAt(0));new GLTFLoader().parse(bytes.buffer,'',g=>{
  model=g.scene;scene.add(model);lid=model.getObjectByName('core_lid');
  model.traverse(o=>{if(o.name.startsWith('core_layer_')){const index=Number(o.name.split('_').at(-1));if(index>0)layers.push({o,index,base:o.position.y,value:0,velocity:0,baseScale:o.scale.clone(),focusScale:1})}if(!o.isMesh)return;
   const name=o.material.name,zone=o.userData.zone||null;let m,kind;
   const isPCB=/^Layer_[0-6]_Architectural_Glass/.test(o.name)||name.includes('Storage_PCB');
   if(o.userData.brandDecal){m=new THREE.MeshBasicMaterial({map:o.material.map,color:'#ffffff',transparent:true,opacity:.94,alphaTest:.01,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});o.renderOrder=4;if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());kind='decal'}
   else if(o.userData.surfaceRole && finish.design.materials[o.userData.surfaceRole]){m=makeDesignedFinish(o.userData.surfaceRole,o);kind='solid';o.userData.pcbDesign=true}
   else if(isPCB){m=makeMetalFinish('pcb');kind='pcb'}
   else if(name.includes('Architectural_Glass')||o.userData.finishRole in finish.glass){m=makeGlassFinish(o);o.renderOrder=2;kind='glass'}
   else if(name.includes('KingSpec')){m=new THREE.MeshBasicMaterial({color:NEUTRAL,transparent:true,opacity:.65,depthWrite:false,toneMapped:false});kind='accent'}
   else if(name.includes('Etched_Light')){m=new THREE.MeshBasicMaterial({color:'#9fa8ac',transparent:true,opacity:.60,depthWrite:false,toneMapped:false});kind='etched'}
   else if(name.includes('Circuit_Trace')){m=new THREE.MeshBasicMaterial({color:'#576167',transparent:true,opacity:zone==='background'?.055:.32,depthWrite:false});kind='trace'}
   else if(name.includes('Silver')){m=makeMetalFinish('silver');kind='wire'}
   else{m=makeMetalFinish(o.userData.finishRole==='gasket'?'gasket':name.includes('Graphite')?'graphite':'basalt');kind='solid'}
   m.transparent=['glass','accent','etched','trace','decal'].includes(kind);o.material.dispose();o.material=m;o.userData.surface=m;o.userData.kind=kind;o.userData.baseColor=m.color.clone();o.userData.baseOpacity=m.opacity;o.userData.zone=zone;
   let parent=o.parent;while(parent){if(parent.name.startsWith('core_layer_')){o.userData.layer=Number(parent.name.split('_').at(-1));break}parent=parent.parent}meshes.push(o);
   if(['solid','glass','pcb','wire'].includes(kind)&&o.userData.surfaceRole!=='podiumFrame'){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,32),new THREE.LineBasicMaterial({color:EDGE_COLOR,transparent:true,opacity:.12,depthWrite:false,toneMapped:false}));o.add(edge);o.userData.edge=edge}
  });layers.sort((a,b)=>a.index-b.index);makeCoreGlow();coreBaseLight=createCoreBaseLight({model,scene,color:finish.lighting.coreBase.color,config:finish.lighting.coreBase});makePodiumMarks();makeSpatialUI();makeFlows();makeLayerConnections();makeContactShadows();makePicking();qualitySettings();isLoaded=true;$('#load-status').hidden=true;const deep=location.hash;startEntry();if(deep){finishEntry();restoreRoute()}announce('存储架构已准备好，可探索四个产品节点或展开中央结构。');
 },e=>fallback(e));
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);fallback('WebGL context lost')});window.addEventListener('resize',()=>{pendingResize=true});document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&!renderer.getContext().isContextLost()){lastTime=0;raf=requestAnimationFrame(tick)}});raf=requestAnimationFrame(tick);
}catch(e){fallback(e)}}

// Screen-space labels terminate at real GLB anchors. Category IDs and layer
// indices encode actual exhibition relationships, not decorative telemetry.
function svgEl(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el}
function setLayerFocus(i){if(mobile){if(i){layerFocus.tap=i;layerFocus.until=performance.now()+800}}else layerFocus.hover=i;for(const item of labelItems)item.el.classList.toggle('focused',item.index===i)}
function makeSpatialUI(){
 for(const[k,z]of Object.entries(zones)){
  const el=document.createElement('button');el.className='hotspot';el.setAttribute('aria-label','进入'+z.title+'展区');el.innerHTML=`<span class="node">${z.no}</span><span class="hottext">${z.title}<small>${z.en}</small><em>${z.ids.length} 款代表产品 <b>→</b></em></span>`;el.onclick=()=>openCategory(k);bindZoneHover(el,k);$('#hotspots').append(el);
  const leader=svgEl('polyline',{class:'leader',fill:'none'}),dot=svgEl('circle',{r:2.6,class:'anchor-dot'});$('#spatial-lines').append(leader,dot);hotspots.push({el,zone:k,anchor:model.getObjectByName('anchor_'+k),position:new THREE.Vector3(...z.point),leader,dot});
 }
 for(let i=1;i<=6;i++){const el=document.createElement('button');el.type='button';el.className='layer-label';el.setAttribute('aria-label',`高亮 Layer ${String(i).padStart(2,'0')}：${layerNames[i-1]}`);el.setAttribute('aria-pressed','false');el.innerHTML=`<b>LAYER ${String(i).padStart(2,'0')}</b><span>${layerNames[i-1]}</span>`;$('#layer-labels').append(el);const line=svgEl('polyline',{class:'layer-leader',fill:'none'});$('#spatial-lines').append(line);labelItems.push({el,line,index:i});el.addEventListener('pointerenter',e=>{if(!mobile&&e.pointerType!=='touch')setLayerFocus(i)});el.addEventListener('pointerleave',()=>{if(!mobile)setLayerFocus(0)});el.addEventListener('focus',()=>{if(!mobile)setLayerFocus(i)});el.addEventListener('blur',()=>{if(!mobile)setLayerFocus(0)});el.addEventListener('click',()=>{if(mobile){layerFocus.tap=i;layerFocus.until=performance.now()+800;setLayerFocus(i)}})}
}
function projectUI(){
 const W=innerWidth,H=innerHeight;
 scratch.set(0,3.8+(lid?.position.y||0),0).project(camera);const coreX=(scratch.x*.5+.5)*W,coreY=(-scratch.y*.5+.5)*H-26;
 const projected=labelItems.map(item=>{const l=layers[item.index-1];scratch.set(1.7,.84+item.index*.33+l.o.position.y,1.38).project(camera);return{item,x:(scratch.x*.5+.5)*W,y:(-scratch.y*.5+.5)*H,z:scratch.z}});
 let prev=mobile?245:158;const ordered=[...projected].sort((a,b)=>a.y-b.y),controlEdge=mobile&&document.body.classList.contains('controls-open')?$('#view-controls').getBoundingClientRect().right+15:W*.6;
 for(const p of ordered){p.layoutY=Math.max(p.y,prev+(mobile?23:29));prev=p.layoutY;p.layoutX=clamp(p.x+(mobile?32:92),mobile?controlEdge:W*.53,W-(mobile?105:185));p.visible=explodeTarget>(autoExpand.source==='auto'?.60:.12)&&!currentPanel&&p.z<1&&p.layoutY<H-225&&p.y>100}
 const overlaps=(a,b,pad=8)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.y-b.y)<(a.h+b.h)/2+pad;
 const rectBox=el=>{const r=el.getBoundingClientRect();return r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}:null};
 const core=$('#core-label'),lift=12*ease(clamp((explodeTarget-.55)/.3,0,1)),introBottom=mobile&&!currentPanel?$('#intro').getBoundingClientRect().bottom:0;
 const coreBottom=mobile?Math.max(coreY-lift,introBottom+10+(core.offsetHeight||42)):coreY-lift;
 const blocked=[{x:coreX,y:coreBottom-(core.offsetHeight||56)/2,w:core.offsetWidth||178,h:core.offsetHeight||56},...ordered.filter(p=>p.visible).map(p=>({x:p.layoutX+(p.item.el.offsetWidth||176)/2,y:p.layoutY+(p.item.el.offsetHeight||22)/2,w:p.item.el.offsetWidth||176,h:p.item.el.offsetHeight||22}))];
 if(!currentPanel){for(const el of [$('#intro'),$('#controls-toggle'),...(document.body.classList.contains('controls-open')?[$('#view-controls')]:[])]){const box=rectBox(el);if(box)blocked.push(box)}}
 // Keep all four category names present throughout the automatic and manual
 // expansion. Collision placement moves a label, never removes its text.
 const offsets=[[0,0],[0,-20],[0,20],[0,-28],[0,28],[0,-36],[0,36],[40,0],[-40,0],[55,0],[-55,0],[70,0],[-70,0],[40,-28],[-40,-28],[40,28],[-40,28],[70,-36],[-70,-36],[70,36],[-70,36],[0,-64],[0,64],[80,-64],[-80,-64],[80,64],[-80,64]];
 if(mobile){for(const dy of [-88,88,-112,112,-144,144,-180,180,-220,220])for(const dx of [0,60,-60,100,-100,140,-140])offsets.push([dx,dy])}
 else{for(const dy of [-96,96,-128,128])for(const dx of [0,40,-40,80,-80])offsets.push([dx,dy])}
 for(const h of hotspots){
  if(h.anchor)h.anchor.getWorldPosition(h.position);scratch.copy(h.position).project(camera);const ax=(scratch.x*.5+.5)*W,ay=(-scratch.y*.5+.5)*H;
  let visible=scratch.z<1&&scratch.z>-1&&ax>12&&ax<W-12&&ay>90&&ay<H-155;
  if(currentPanel)visible=false;
  const side=ax>W*.60?1:-1,width=mobile?122:157,offset=mobile?{ssd:-18,ram:58,portable:-78,card:38}[h.zone]:side*44;
  let x=clamp(ax+offset,16+width/2,W-16-width/2),y=clamp(ay-(mobile?{ssd:26,ram:14,portable:42,card:28}[h.zone]:52),mobile?248:168,H-190);
  const w=h.el.offsetWidth||width,height=h.el.offsetHeight||44;
  // The intro is a hard vertical exclusion on phones: the nearest fallback
  // may never place a category name over the headline or supporting text.
  const minBottom=mobile?Math.max(220,introBottom+8+height):168;
  const candidates=offsets.map(([dx,dy])=>{const cx=clamp(x+dx,16+w/2,W-16-w/2),cy=clamp(y+dy,minBottom,H-190),box={x:cx,y:cy-height/2,w,h:height},hits=blocked.map(b=>overlaps(box,b,mobile?6:8));return{x:cx,y:cy,box,coreHit:hits[0],hits:hits.filter(Boolean).length,distance:Math.abs(cx-x)*1.5+Math.abs(cy-y)}});
  const best=candidates.find(c=>!c.hits)||candidates.sort((a,b)=>Number(a.coreHit)-Number(b.coreHit)||a.hits-b.hits||a.distance-b.distance)[0];x=best.x;y=best.y;if(visible)blocked.push(best.box);
  const active=h.zone===effectiveZone(),opacity=active?1:mobile?.94:.90;
  h.el.style.opacity=opacity;h.leader.style.opacity=active?.9:mobile?.6:.65;h.dot.style.opacity=active?1:.8;
  h.el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;h.el.hidden=!visible;h.el.tabIndex=visible?0:-1;
  h.leader.style.display=h.dot.style.display=visible?'':'none';h.leader.setAttribute('points',`${ax},${ay} ${ax+side*16},${ay-16} ${x},${y}`);h.dot.setAttribute('cx',ax);h.dot.setAttribute('cy',ay);h.leader.classList.toggle('active',h.zone===effectiveZone());h.dot.classList.toggle('active',h.zone===effectiveZone());
 }
 for(const p of ordered){const {item}=p,x=p.layoutX,y=p.layoutY,visible=p.visible,focused=layerFocus.hover===item.index||(mobile&&layerFocus.tap===item.index&&performance.now()<layerFocus.until);p.item.el.hidden=!visible;p.item.el.style.opacity=focused?1:(mobile?.68:1)*((layerFocus.hover||(mobile&&layerFocus.tap&&performance.now()<layerFocus.until))?.84:1);p.item.el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;p.item.el.setAttribute('aria-pressed',String(focused));p.item.el.classList.toggle('focused',focused);p.item.line.style.display=visible?'':'none';p.item.line.style.opacity=focused?.90:mobile?.36:.5;p.item.line.setAttribute('points',`${p.x},${p.y} ${x-10},${y+7} ${x-3},${y+7}`)}
 // Preserve a quiet clearance between the highest-priority label and the
 // raised lid as the stack opens; the lift follows expansion rather than a
 // viewport-specific coordinate.
 $('#core-label').style.transform=`translate(${coreX}px,${coreBottom}px) translate(-50%,-100%)`;$('#core-label').hidden=!!currentPanel;
}

// Four deterministic circuit polylines. Every packet has a category origin
// and a core destination. The endpoint follows its associated storage layer.
function makeFlows(){
 for(const[k,route]of Object.entries(architecture.routes)){
  const points=route.points.map(p=>new THREE.Vector3(...p)),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:BRAND,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));scene.add(line);
  const particles=new THREE.InstancedMesh(new THREE.SphereGeometry(.033,6,4),new THREE.MeshBasicMaterial({color:BRAND.clone().multiplyScalar(1.35),toneMapped:false}),3);particles.frustumCulled=false;scene.add(particles);
  const nodes=new THREE.InstancedMesh(new THREE.SphereGeometry(.048,8,5),new THREE.MeshBasicMaterial({color:BRAND.clone().multiplyScalar(1.16),toneMapped:false}),4);nodes.frustumCulled=false;scene.add(nodes);
  glowSources.add(particles);glowSources.add(nodes);
  flows.push({zone:k,layer:route.layer,points,baseEnd:points.at(-1).y,line,particles,nodes,nodeIndices:route.nodeIndices,amount:0,started:0,selected:false,arrival:0,arrivedAt:-100,cycles:[0,0,0],lengths:[],total:0});
 }
}
function measurePath(f){f.lengths=[0];f.total=0;for(let i=1;i<f.points.length;i++){f.total+=f.points[i].distanceTo(f.points[i-1]);f.lengths.push(f.total)}}
function pointAlong(f,t,out){const d=clamp(t,0,1)*f.total;let i=1;while(i<f.lengths.length-1&&f.lengths[i]<d)i++;return out.lerpVectors(f.points[i-1],f.points[i],(d-f.lengths[i-1])/(f.lengths[i]-f.lengths[i-1]||1))}
let connector;
function makeLayerConnections(){connector=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:'#a5adaf',dashSize:.09,gapSize:.09,transparent:true,opacity:0,depthWrite:false}));connector.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(36),3));scene.add(connector)}
function animateLayers(dt){
 const rising=explodeTarget>lastExpand;if(explodeTarget<.015){scanArmed.fill(true);autoScanArmed=true;scanDue.fill(Infinity)}
 if(autoExpand.running&&rising&&autoScanArmed&&explodeTarget>=.07&&!noMotion()){for(let i=0;i<6;i++)scanDue[i]=sceneTime+i*glowConfig.stagger;autoScanArmed=false}
 for(let i=0;i<6;i++){
  const manual=autoExpand.source==='manual'&&rising&&scanArmed[i]&&explodeTarget>=.07+i*.12;
  if(!noMotion()&&(sceneTime>=scanDue[i]||manual)){layerScan[i]=1;scanArmed[i]=false;scanDue[i]=Infinity;if(audit){scanEvents.push({t:sceneTime,layer:i+1,auto:autoExpand.running});if(scanEvents.length>120)scanEvents.shift()}}
  if(!noMotion())layerScan[i]*=Math.exp(-dt/glowConfig.scanDecay);
 }lastExpand=explodeTarget;
  const focusIndex=!mobile?layerFocus.hover:performance.now()<layerFocus.until?layerFocus.tap:0;
  for(const l of layers){const phase=ease(clamp((explodeTarget-(l.index-1)*.023)/(1-(l.index-1)*.023),0,1)),goal=phase*l.index*.42,targetWeight=focusIndex&&focusIndex!==l.index?.84:1,targetEdge=focusIndex===l.index?1.10:1;
  // Sequenced targets plus damped spring settling (no linear jump).
   if(reduced){l.value=goal;l.velocity=0}else{l.velocity+=((goal-l.value)*56-l.velocity*14)*dt;l.value+=l.velocity*dt}l.o.position.y=l.base+l.value;l.focusScale=1;l.focusWeight=damp(l.focusWeight??1,targetWeight,18,dt);l.edgeFocus=damp(l.edgeFocus??1,targetEdge,18,dt);
 }
 if(lid)lid.position.y=(layers.at(-1)?.value||0)*1.06;
 if(connector){const a=connector.geometry.attributes.position;layers.forEach((l,i)=>{const y=.84+l.index*.33;a.setXYZ(i*2,-1.49,y,-1.17);a.setXYZ(i*2+1,-1.49,y+l.value,-1.17)});a.needsUpdate=true;connector.computeLineDistances();connector.material.opacity=damp(connector.material.opacity,explodeTarget>.08?.32:0,6,dt)}
}
function animateFlows(dt,t,entryProgress){
 const active=effectiveZone();
 for(const f of flows){
  const idleCycle=t%32,idleIndex=Math.floor(t/32)%4,occasional=!active&&state.mode==='IDLE'&&idleCycle<2.5&&Object.keys(zones)[idleIndex]===f.zone,entering=entryProgress<1&&f.zone==='ssd';
  const selected=active===f.zone||(!noMotion()&&occasional)||entering;
  if(selected&&!f.selected){f.started=t;f.arrival=0;f.arrivedAt=-100;f.cycles.fill(0)}f.selected=selected;f.amount=damp(f.amount,selected?1:0,selected?5:4,dt);const age=t-f.started;
  f.points.at(-1).y=f.baseEnd+(layers[f.layer-1]?.value||0);measurePath(f);f.points.forEach((p,i)=>f.line.geometry.attributes.position.setXYZ(i,p.x,p.y,p.z));f.line.geometry.attributes.position.needsUpdate=true;
  f.line.material.opacity=f.amount*(occasional?.23:.88)*(noMotion()?1:clamp((age-.10)/.5,0,1))*THREE.MathUtils.lerp(1,.76,wireBlend);f.line.visible=f.amount>.005;f.particles.visible=!noMotion()&&f.amount>.02;f.nodes.visible=f.amount>.02;f.particles.material.opacity=THREE.MathUtils.lerp(1,.76,wireBlend);f.particles.material.transparent=wireBlend>.01;f.nodes.material.opacity=THREE.MathUtils.lerp(1,.76,wireBlend);f.nodes.material.transparent=wireBlend>.01;
  const fractions=[];
  for(let i=0;i<3;i++){
   let progress=(age-.18-i*.55)*(entering?1.65:[.42,.36,.47][i]);const hidden=progress<0||(mobile&&i===2)||noMotion();const cycle=Math.floor(progress);if(!hidden&&cycle>f.cycles[i]){f.arrivedAt=t;f.cycles[i]=cycle}progress=((progress%1)+1)%1;
   pointAlong(f,progress,scratch);matrix.makeScale(hidden?0:f.amount,hidden?0:f.amount,hidden?0:f.amount);matrix.setPosition(scratch);f.particles.setMatrixAt(i,matrix);if(!hidden)fractions.push(progress);
  }
  f.particles.instanceMatrix.needsUpdate=true;const arrivalAge=t-f.arrivedAt;f.arrival=selected&&!noMotion()&&arrivalAge<glowConfig.arrivalDuration?Math.sin(Math.PI*arrivalAge/glowConfig.arrivalDuration):0;
  f.nodes.material.color.copy(BRAND).multiplyScalar(1.16+(noMotion()?0:Math.sin(t*Math.PI/3)*.06)+f.arrival*.12);
  f.nodeIndices.forEach((index,i)=>{const fraction=f.lengths[index]/f.total,near=fractions.reduce((v,p)=>Math.max(v,Math.max(0,1-Math.abs(p-fraction)/.09)),0),on=i===f.nodeIndices.length-1?f.arrival:i===0?clamp(age/.2,0,1):noMotion()?1:near,scale=f.amount*(.48+on*.8);matrix.makeScale(scale,scale,scale);matrix.setPosition(f.points[index]);f.nodes.setMatrixAt(i,matrix)});f.nodes.instanceMatrix.needsUpdate=true;
 }
 const entryLayer=entryProgress<1?Math.floor(clamp((entryProgress-.46)/.46,0,1)*6):0;
 updateMaterials(t,entryLayer,entryProgress);
}
function makeContactShadows(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,20,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.8)');gradient.addColorStop(.65,'rgba(0,0,0,.55)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const texture=new THREE.CanvasTexture(canvas),geometry=new THREE.PlaneGeometry(1,1);
 for(const p of [[0,0,4.95,4.25],...Object.values(zones).map(z=>[z.point[0],z.point[2],3.6,2.8])]){const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.28,depthWrite:false,toneMapped:false}),o=new THREE.Mesh(geometry,m);o.rotation.x=-Math.PI/2;o.position.set(p[0],.045,p[1]);o.scale.set(p[2],p[3],1);scene.add(o);contactShadows.push(o)}
}
function updateMaterials(t,entryLayer,entryProgress){
 const active=effectiveZone(),ambient=state.mode==='IDLE'&&!noMotion()?(Math.sin(t*Math.PI/3)+1)/2:0;
 const layerWeight=[.90,.94,.98,1,.96,.90],focusIndex=!mobile?layerFocus.hover:performance.now()<layerFocus.until?layerFocus.tap:0,hasFocus=!!focusIndex;
 for(const o of meshes){const u=o.userData,{kind,zone,layer,baseColor,baseOpacity}=u,flow=flows.find(f=>f.zone===zone||(layer&&f.layer===layer)),arrival=flow?.arrival||0,scan=layer?layerScan[layer-1]||0:0,dim=active&&zones[zone]&&zone!==active?.82:1,depthWeight=layer?layerWeight[layer-1]:1,focusWeight=layer?(layers[layer-1]?.focusWeight??1):1,structureWeight=layer?1:((zone==='architecture'||zone==='foreground')?.88:zone==='lid'?.95:1);
  const m=u.physicalGlass&&!mobile&&quality===2&&wireBlend<.005?u.physicalGlass:u.surface;if(o.material!==m)o.material=m;
  const high=m===u.physicalGlass,surfaceOpacity=kind==='glass'?(high?u.opticalOpacity:u.glassOpacity):baseOpacity;
  m.opacity=high?1:THREE.MathUtils.lerp(surfaceOpacity,kind==='glass'?.004:kind==='solid'||kind==='pcb'||kind==='wire'?.025:kind==='trace'?.66:kind==='etched'?.78:baseOpacity,wireBlend);
  if(u.surfaceRole==='podiumFrame'){m.opacity=THREE.MathUtils.lerp(1,.48,wireBlend);m.emissiveIntensity=finish.design.materials.podiumFrame.emissiveIntensity*dim*THREE.MathUtils.lerp(1,.7,wireBlend)}
  const capWeight=1-.18*ease(clamp((explodeTarget-.6)/.25,0,1));if(o.parent===lid&&!high&&kind!=='decal')m.opacity*=capWeight;
  const optical=kind==='glass'&&high;
  setSurfaceTransparency(m,optical?false:['glass','trace','accent','etched','decal'].includes(kind)||m.opacity<.999);
  m.depthWrite=(optical||!['glass','trace','accent','etched','decal'].includes(kind))&&wireBlend<.01;
  if(kind==='accent'){const a=flow?(layer?arrival*.55:flow.amount):0,e=layer&&entryLayer>=layer&&entryProgress<1?.60:0;m.color.copy(NEUTRAL).lerp(BRAND,Math.max(a,e));m.opacity=(.36+Math.max(a,e)*.54)*(1-wireBlend*.30)}
  else if(u.coreGlow){const intensity=coreEmission(layer,t,arrival,scan);m.emissiveIntensity=intensity*1.08*depthWeight*focusWeight;m.color.copy(baseColor).multiplyScalar(depthWeight*focusWeight);m.opacity=THREE.MathUtils.lerp(kind==='etched'?.88:.75,kind==='etched'?.61:.49,wireBlend)}
  else if(kind==='glass'||kind==='decal'){m.color.copy(baseColor);}
  else if(kind==='etched'){m.color.copy(SILVER_LOW).multiplyScalar(dim*depthWeight*focusWeight*structureWeight)}
  else{m.color.copy(baseColor).multiplyScalar(dim*depthWeight*focusWeight*structureWeight*(1+(layer?(scan*.09+arrival*.10):0)));if(kind==='trace'&&layer)m.color.lerp(SILVER_LOW,wireBlend*.65+ambient*.12)}
  if(kind==='etched'&&!u.coreGlow)m.color.copy(SILVER_LOW).multiplyScalar(dim*depthWeight*focusWeight*structureWeight);
  if(u.surfaceRole==='signal')m.emissiveIntensity=(.08+.02*ambient)*(1-wireBlend*.6);
  if(m.userData.pcbAnimation){m.userData.pcbAnimation.time.value=t;m.userData.pcbAnimation.still.value=noMotion()?1:0;m.emissiveIntensity=finish.design.materials[u.surfaceRole].emissiveIntensity*(1-wireBlend*.7);}
  const stageWeight=zone&&zones[zone]?.50:zone==='background'?.24:zone==='architecture'||zone==='foreground'||zone==='lid'?.27:.74,frameWeight=layer&&o.name.endsWith('.001')?.88:1;
  if(u.edge){const edge=u.edge;edge.visible=wireBlend>.005||quality>0;const edgeWeight=layer?depthWeight*frameWeight*.94:stageWeight;edge.material.opacity=capWeight*THREE.MathUtils.lerp(kind==='glass'?finish.edges.glass:u.edgeRole==='primary'?finish.edges.primary:u.pcbDesign?finish.edges.detail:finish.edges.structure,finish.edges.wire*edgeWeight,wireBlend);edge.material.color.copy(EDGE_COLOR).multiplyScalar(dim*depthWeight*focusWeight*structureWeight*(layer?(layers[layer-1]?.edgeFocus??1):1)*(1+scan*.10+arrival*.12));if(layer&&active&&flow?.zone===active)edge.material.color.lerp(BRAND,wireBlend*(.65+arrival*.35))}
 }
  for(const o of meshes){const {kind,zone,layer}=o.userData;if(kind==='trace'&&zone==='background')o.material.opacity=THREE.MathUtils.lerp(.055,.12,wireBlend);else if(wireBlend>.99&&kind==='trace'&&zone&&zones[zone])o.material.opacity=.28;else if(kind==='trace'&&layer&&!o.userData.coreGlow)o.material.opacity=THREE.MathUtils.lerp(o.userData.baseOpacity,o.userData.baseOpacity*1.10,wireBlend)}
 // The fixed Layer 0 base also has overlays; only moving layers 1–6 have weights.
 // An undefined base weight produces NaN alpha and contaminates the bloom buffers.
 for(const item of coreOverlays){const arrival=flows.find(f=>f.layer===item.layer)?.arrival||0,scan=layerScan[item.layer-1]||0,focus=(layers[item.layer-1]?.focusWeight??1)*(item.edge?(layers[item.layer-1]?.edgeFocus??1):1),emission=coreEmission(item.layer,t,arrival,scan),modeFactor=THREE.MathUtils.lerp(1,glowConfig.wire,wireBlend);item.o.visible=item.edge||mobile||quality<2;item.o.material.opacity=clamp(.08+(emission/modeFactor-glowConfig.base)*.50,.08,.14)*modeFactor*(item.edge?1:.85)*(layerWeight[item.layer-1]??1)*focus}
 // Only a faint seating shadow belongs on the glass deck; a dark floor-sized
 // contact patch would make the inset PCB appear trapped inside an opaque slab.
 for(const shadow of contactShadows)shadow.material.opacity=.07*(1-wireBlend);
 coreBaseLight?.update({time:t,still:noMotion(),wireBlend,entryProgress});
}
function coreEmission(layer,t,arrival,scan){const breath=!noMotion()&&state.mode==='IDLE'?(1+Math.sin(t*Math.PI*2/glowConfig.period))*.5:0,middle=layer>=2&&layer<=5?1+.10*ease(clamp((explodeTarget-.6)/.25,0,1)):1;return (glowConfig.base+glowConfig.breath*breath+glowConfig.scan*scan+glowConfig.arrival*arrival)*THREE.MathUtils.lerp(1,glowConfig.wire,wireBlend)*middle}
function makeCoreGlow(){
 // Sharing original geometries keeps 103 model meshes / 10,252 polygons intact.
 for(const o of meshes){const u=o.userData;if(u.layer===undefined)continue;
  if(['trace','etched'].includes(u.kind)){
   const m=new THREE.MeshStandardMaterial({color:'#677275',emissive:CORE_COLOR,emissiveIntensity:glowConfig.base,metalness:.15,roughness:.52,transparent:true,opacity:u.kind==='etched'?.80:.68,depthWrite:false,envMapIntensity:.12});u.surface.dispose();o.material=u.surface=m;u.coreGlow=true;u.baseColor=m.color.clone();u.baseOpacity=m.opacity;coreGlowMeshes.push(o);glowSources.add(o);
   if(u.kind==='etched'){const overlay=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:CORE_COLOR,blending:THREE.AdditiveBlending,transparent:true,opacity:.10,depthWrite:false,toneMapped:false}));overlay.name='CoreMobile_'+o.name;overlay.renderOrder=3;o.add(overlay);coreOverlays.push({o:overlay,layer:u.layer,edge:false})}
  }
  if(u.kind==='pcb'&&u.edge){const edge=new THREE.LineSegments(u.edge.geometry,new THREE.LineBasicMaterial({color:CORE_COLOR,transparent:true,opacity:.10,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));edge.name='CoreGlowEdge_'+u.layer;o.add(edge);coreOverlays.push({o:edge,layer:u.layer,edge:true});glowSources.add(edge)}
 }
}
function makePicking(){
 for(const[k,z]of Object.entries(zones)){const o=new THREE.Mesh(new THREE.BoxGeometry(3.05,2.15,2.2),new THREE.MeshBasicMaterial({visible:false}));o.position.set(z.point[0],1.10,z.point[2]);o.userData.zone=k;scene.add(o);pickTargets.push(o)}
 function pick(e){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickTargets,false)[0]?.object.userData.zone||null}
 renderer.domElement.addEventListener('pointermove',e=>{if(!dragging&&e.pointerType!=='touch'){const k=pick(e);setHover(k);renderer.domElement.style.cursor=k?'pointer':'grab'}});renderer.domElement.addEventListener('pointerleave',()=>setHover(null));renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY}});renderer.domElement.addEventListener('pointerup',e=>{if(pointerDown&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)<6){const k=pick(e);if(k)openCategory(k)}pointerDown=null});
}

function startEntry(){let seen=false;try{seen=sessionStorage.getItem('ks-v2-entered')==='1'}catch{}if(reduced||seen){finishEntry();return}entryStart=performance.now();entryDone=false;$('#entry').hidden=false;document.body.classList.add('entering')}
function finishEntry(){const newly=!entryDone;entryDone=true;$('#entry').hidden=true;document.body.classList.remove('entering');if(newly){autoExpand.eligibleAt=performance.now()+400;autoExpand.reason='入场完成'}try{sessionStorage.setItem('ks-v2-entered','1')}catch{}}
$('#skip-entry').onclick=finishEntry;
$('#replay-entry').onclick=()=>{$('#guide').close();state.zone=state.hover=state.product=null;setPanel(null);updateState();writeRoute('');autoExpand.locked=false;autoExpand.source='auto';autoExpand.clock=0;syncExpand(0);if(controls){controls.autoRotate=false;updateOrbit()}if(camera){flyTo(homePosition(),homeTarget())}if(reduced){announce('减少动态效果已开启，入场动画已跳过。');return}entryStart=performance.now();entryDone=false;$('#entry').hidden=false;document.body.classList.add('entering')};
function updateEntry(time){if(entryDone||entryStart===null)return 1;const p=clamp((time-entryStart)/1800,0,1);$('#entry').style.setProperty('--entry',p);$('#entry-phase').textContent=p<.35?'CONNECTING STORAGE':p<.75?'ORGANIZING LAYERS':'KINGSPEC DIGITAL SHOWROOM';if(p>=1)finishEntry();return p}
function recordPerformance(time,delta){
 if(!isLoaded||!entryDone||delta<=0)return;frames.push(delta);if(frames.length>900)frames.shift();
 if(time-perfLast>1500){const recent=frames.slice(-90),avg=recent.reduce((a,b)=>a+b,0)/recent.length,fps=1000/avg;if(fps<(mobile?29:44))lowFrames++;else lowFrames=0;if(lowFrames>=4&&quality>0){pendingQuality=quality-1;lowFrames=0}
  const sorted=[...frames].sort((a,b)=>a-b),avgAll=frames.reduce((a,b)=>a+b,0)/frames.length;stats={viewport:`${innerWidth}×${innerHeight}`,fps:Number((1000/avgAll).toFixed(1)),recentFPS:Number(fps.toFixed(1)),p95FrameMs:Number((sorted[Math.floor(sorted.length*.95)]||0).toFixed(2)),frames:frames.length,dpr:renderer.getPixelRatio(),bloom:!mobile&&quality===2&&wireBlend<.995,quality,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,mode:state.mode,zone:state.zone,product:state.product,activeFlow:effectiveZone(),layers:layers.length,expand:explodeTarget,autoExpand:autoExpand.running,layerFocus:layerFocus.hover||((performance.now()<layerFocus.until)?layerFocus.tap:0),layerScale:layers.map(l=>l.focusScale),wireBlend,physicalGlass:meshes.some(o=>o.material.transmission>0),errors:[...errors]};if(audit&&new URLSearchParams(location.search).get('audit')!=='lighting'){$('#audit').hidden=false;$('#audit').textContent=JSON.stringify(stats)}perfLast=time;
 }
}
function tick(time){
 raf=requestAnimationFrame(tick);if(document.hidden)return;const elapsed=lastTime?time-lastTime:16.67,dt=Math.min(.035,elapsed/1000);lastTime=time;if(!noMotion())sceneTime+=dt;
 // Resizing the drawing buffer clears it. Apply changes before material updates
 // and render in this same frame, never after presenting the completed scene.
 if(pendingResize){pendingResize=false;pendingQuality=null;handleResize()}
 else if(pendingQuality!==null){quality=pendingQuality;pendingQuality=null;qualitySettings()}
 if(transition){const p=clamp((time-transition.start)/transition.duration,0,1),e=ease(p),a=new THREE.Spherical().setFromVector3(transition.from.clone().sub(transition.fromTarget)),b=new THREE.Spherical().setFromVector3(transition.to.clone().sub(transition.toTarget));let angle=b.theta-a.theta;angle=THREE.MathUtils.euclideanModulo(angle+Math.PI,Math.PI*2)-Math.PI;const s=new THREE.Spherical(THREE.MathUtils.lerp(a.radius,b.radius,e),THREE.MathUtils.lerp(a.phi,b.phi,e),a.theta+angle*e+Math.sin(p*Math.PI)*.025);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,e);camera.position.copy(controls.target).add(scratch.setFromSpherical(s));if(p===1)transition=null}controls.update();const ep=updateEntry(time);
 if(modeTransition){const p=reduced?1:clamp((time-modeTransition.start)/450,0,1);wireBlend=THREE.MathUtils.lerp(modeTransition.from,modeTransition.to,ease(p));if(p===1)modeTransition=null}
 if(isLoaded&&!exhibitions?.active){driveAutoExpand(time,dt);animateLayers(dt);animateFlows(dt,sceneTime,ep);animatePodiumMarks(sceneTime);projectUI()}exhibitions?.tick();renderer.info.reset();if(!exhibitions?.active&&!mobile&&quality===2&&wireBlend<.995)renderSelectiveBloom();else renderer.render(scene,camera);recordPerformance(time,elapsed);
 if(audit&&isLoaded&&time-auditLast>=90){auditLast=time;auditSamples.push({t:time,entryDone,auto:autoExpand.running,reason:autoExpand.reason,clock:autoExpand.clock,e:explodeTarget,slider:Number($('#explode').value)/100,percent:$('#explode-value').textContent,state:state.mode,wireBlend,geometries:renderer.info.memory.geometries,camera:camera.position.toArray(),layerValues:layers.map(l=>l.value),arrival:flows.map(f=>f.arrival),coreEmission:coreGlowMeshes.filter(o=>o.userData.kind==='etched').map(o=>o.material.emissiveIntensity)});if(auditSamples.length>2400)auditSamples.shift();lightingAudit.textContent=JSON.stringify({lighting:lightingStatus(),stats,ready:isLoaded,motion:{paused:motionPaused,reduced,wireBlend,explodeTarget,autoRunning:autoExpand.running},view:{position:camera.position.toArray(),target:controls.target.toArray()},modelMeshes:meshes.length,glError:renderer.getContext().getError()})}
}
window.__KS_DEMO__={getStatus:()=>({...stats,view:camera&&controls?{position:camera.position.toArray(),target:controls.target.toArray()}:null,version:'2.1.3',lighting:lightingStatus(),surfaceFinish:{date:finish.date,deckGlass:meshes.filter(o=>['deckTop','deckShell'].includes(o.userData.finishRole)).map(o=>({name:o.name,role:o.userData.finishRole,opacity:o.material.opacity,transmission:o.material.transmission,ior:o.material.ior})),pcbSignals:meshes.filter(o=>o.material.userData.pcbAnimation).map(o=>({name:o.name,time:o.material.userData.pcbAnimation.time.value,still:o.material.userData.pcbAnimation.still.value,emission:o.material.emissiveIntensity,bloom:glowSources.has(o)})),environmentIntensity:scene?.environmentIntensity,opticalGlass:meshes.filter(o=>o.userData.physicalGlass).length,glassRoles:meshes.filter(o=>o.userData.kind==='glass').map(o=>({name:o.name,role:o.userData.finishRole,optical:o.material.transmission>0,ior:o.material.ior,roughness:o.material.roughness,thickness:o.material.thickness,transmission:o.material.transmission})),invalidMaterials:meshes.filter(o=>![o.material.opacity,...o.material.color.toArray(),o.material.emissiveIntensity??0,o.material.ior??1.5,o.material.thickness??0,o.material.transmission??0,o.material.roughness??0].every(Number.isFinite)).map(o=>o.name)},ready:isLoaded,state:{...state,exhibition:exhibitions?.active,exhibitionStep:exhibitions?.step},modelMeshes:meshes.length,errors,motion:{...autoExpand,wireBlend,explodeTarget,layerValues:layers.map(l=>l.value),layerFocus:{...layerFocus}},glow:{config:glowConfig,selectiveSources:glowSources.size,coreMeshes:coreGlowMeshes.length,mobileOverlay:mobile||quality<2,emission:coreGlowMeshes.map(o=>({name:o.name,layer:o.userData.layer,value:o.material.emissiveIntensity})),scanEvents},samples:auditSamples}),openProduct,openCategory,resetView,openExhibition};
if(audit)window.__KS_DEMO__.measureBloom=()=>{if(!bloom||mobile||quality!==2||wireBlend>=.995)return {enabled:false};function measure(rt){const pixels=new Uint16Array(rt.width*rt.height*4);renderer.readRenderTargetPixels(rt,0,0,rt.width,rt.height,pixels);let max=0,lit=0;for(let i=0;i<pixels.length;i+=4){const v=Math.max(...[0,1,2].map(k=>THREE.DataUtils.fromHalfFloat(pixels[i+k])));if(v>.0001)lit++;max=Math.max(max,v)}return {width:rt.width,height:rt.height,maxLinear:max,nonzeroPixels:lit,glError:renderer.getContext().getError()}}return {enabled:true,...measure(bloom.renderTargetsHorizontal[0]),mask:measure(bloomComposer.readBuffer),sources:[...glowSources].map(o=>o.name||o.type)}};
setup();

// Auxiliary room assets are retained. Product edition routes return to the main showroom.
function openExhibition(){resetView({route:false})}
