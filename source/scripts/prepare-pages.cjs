// Publish only the self-contained website and its rights notices.
// Repository source, authoring files, and local configuration stay out of the site.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const destination = path.join(root, '_site');
if (path.dirname(destination) !== root || path.basename(destination) !== '_site') {
  throw new Error('The generated website must stay inside the repository _site directory.');
}
// _site is disposable generated output; start clean so stale files cannot be published.
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
for (const name of ['index.html', 'desktop.html', 'mobile.html', 'LICENSE', 'ASSET_NOTICE.md']) {
  fs.copyFileSync(path.join(root, name), path.join(destination, name));
}
fs.cpSync(path.join(root, 'licenses'), path.join(destination, 'licenses'), { recursive: true });
fs.writeFileSync(path.join(destination, '.nojekyll'), '');
console.log('Pages artifact:', destination);
