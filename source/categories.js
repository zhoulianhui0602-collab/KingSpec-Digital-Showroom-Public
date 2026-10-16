// Official consumer and industrial taxonomy checked on 2026-10-14.
// The physical scene retains four consumer zones. Industry uses the shared directory.
const url=slug=>'https://www.kingspec.com/products-category/'+slug+'.html';
export const categoryTree={
 ssd:{title:'内置存储',en:'INTERNAL STORAGE',no:'01',sub:'M.2 / SATA / mSATA',url:url('internal-storage'),copy:'从系统盘到项目盘，按接口与形态找到合适的 SSD。',families:[
  {id:'nvme',title:'M.2 PCIe (NVMe)',url:url('m2-pcie-nvme')},
  {id:'sata25',title:'2.5 英寸 SSD',url:url('2-5-inch-ssd')},
  {id:'m2sata',title:'M.2 SATA',url:url('m2-sata')},
  {id:'msata',title:'mSATA',url:url('msata-ssd')}
 ]},
 ram:{title:'内存',en:'MEMORY (DRAM)',no:'02',sub:'DDR3 / DDR4 / DDR5',url:url('memory-dram'),copy:'先确认内存代际与平台，再选择容量和数据速率。',families:[
  {id:'ddr3',title:'DDR3',url:url('ddr3')},{id:'ddr4',title:'DDR4',url:url('ddr4')},{id:'ddr5',title:'DDR5',url:url('ddr5')}
 ]},
 portable:{title:'外置与移动存储',en:'EXTERNAL & PORTABLE STORAGE',no:'03',sub:'Portable SSD / USB / Enclosure',url:url('external-storage'),copy:'便携 SSD、USB 存储与硬盘盒，让数据在设备之间随行。',families:[
  {id:'pssd',title:'便携式 SSD',url:url('portable-ssd')},{id:'usbssd',title:'USB SSD',url:url('usb-ssd')},{id:'usb',title:'USB 闪存',url:url('usb')},{id:'enclosure',title:'硬盘盒',url:url('enclosure')}
 ]},
 card:{title:'存储卡',en:'MEMORY CARD',no:'04',sub:'CF / CFast / CFexpress / SD / microSD',url:url('memory-card'),copy:'按设备卡型与录制要求，找到对应的存储介质。',families:[
  {id:'cfexpress',title:'CFexpress',url:url('cfexpress')},{id:'sd',title:'SD / SDXC',url:url('sdxc')},{id:'microsd',title:'microSD / TF',url:url('microsd-card')},{id:'cf',title:'CF Card',url:url('cf')},{id:'cfast',title:'CFast',url:url('cfast')}
 ]}
};
export const industryTree={
 industrial:{title:'工业存储',en:'INDUSTRIAL STORAGE',no:'I',section:'industry',url:url('industrial-products'),copy:'按设备接口与安装形态浏览工业存储，温度等级和选型条件以具体型号为准。',families:[
  {id:'i-sata25',title:'2.5 英寸 SATA',url:url('25-inch')},
  {id:'i-msata',title:'mSATA',url:url('msata-62')},
  {id:'i-m2sata',title:'M.2 SATA 2242',url:url('m-2-sata-ssd')},
  {id:'i-nvme',title:'M.2 PCIe',url:url('m-2-nvme-ssd')},
  {id:'i-pata',title:'PATA',url:url('pata')},
  {id:'i-satadom',title:'SATA DOM',url:url('dom-60')},
  {id:'i-usbdom',title:'USB DOM',url:url('18-inch')},
  {id:'i-cfast',title:'CFast',url:url('cfcfast')}
 ]},
 enterprise:{title:'企业级存储',en:'ENTERPRISE STORAGE',no:'E',section:'industry',url:url('enterprise-ssd'),copy:'保留官网企业级分类，按形态查看代表型号及官方规格。',families:[
  {id:'e-halfslim',title:'Half Slim',url:url('haif-slim')},
  {id:'e-u2',title:'U.2 PCIe',url:url('cf-card')}
 ]}
};
export const catalogTree={...categoryTree,...industryTree};
const assignments={xg7000:'nvme',p3:'sata25',xf2280:'nvme',x500:'nvme',ram:'ddr4',templar:'ddr5',zs301:'pssd',micro:'microsd',sdv90:'sd',cfb:'cfexpress'};
export const groupOf=p=>p.catalogGroup||p.zone;
export const sectionOf=p=>industryTree[groupOf(p)]?'industry':'consumer';
export const familyId=p=>p.family||assignments[p.id]||'';
export const familyOf=p=>catalogTree[groupOf(p)]?.families.find(f=>f.id===familyId(p));
export const comparisonGroup=p=>sectionOf(p)+':'+familyId(p);
