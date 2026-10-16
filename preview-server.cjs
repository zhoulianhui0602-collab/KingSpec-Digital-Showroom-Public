// Local-only preview. No dependencies. Run: node preview-server.cjs
const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname,port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end('Bad request')}
 const dest=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
 if(dest!==root&&!dest.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(dest,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data)})});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Preview already running: http://127.0.0.1:'+port:e.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>{const url='http://127.0.0.1:'+port;console.log('KingSpec V2.1.3: '+url+'\nPress Ctrl+C to stop.');if(process.argv.includes('--open')&&process.platform==='win32')require('child_process').spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'}).unref()});
