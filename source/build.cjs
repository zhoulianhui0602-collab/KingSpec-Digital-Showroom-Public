const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const dir=__dirname,out=path.resolve(dir,'..');
async function build(){
 const data=JSON.parse(fs.readFileSync(path.join(dir,'products.json'),'utf8'));
 data.forEach(p=>{p.image='data:image/jpeg;base64,'+fs.readFileSync(path.join(dir,p.image)).toString('base64')});
 const result=await esbuild.build({entryPoints:[path.join(dir,'app.js')],bundle:true,loader:{'.png':'dataurl','.hdr':'base64'},write:false,minify:true,format:'iife',target:['chrome110','safari16'],legalComments:'inline',nodePaths:(process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean),define:{__PRODUCT_DATA__:JSON.stringify(data),__ARCHITECTURE__:fs.readFileSync(path.join(dir,'storage-architecture.json'),'utf8'),__MODEL_BASE64__:JSON.stringify(fs.readFileSync(path.join(out,'models/kingspec-showroom.glb')).toString('base64')),__LOGO_BASE64__:JSON.stringify('data:image/png;base64,'+fs.readFileSync(path.join(dir,'assets/official-logo.png')).toString('base64'))}});
 const html=fs.readFileSync(path.join(dir,'template.html'),'utf8').replace('/*__STYLE__*/',()=>fs.readFileSync(path.join(dir,'style.css'),'utf8')).replace('/*__APP__*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
 fs.writeFileSync(path.join(out,'index.html'),html);console.log('Demo ready:',path.join(out,'index.html'),'Bytes:',Buffer.byteLength(html));
}
build().catch(e=>{console.error(e);process.exit(1)});
