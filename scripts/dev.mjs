// Local stand-in for the Vercel function: serves /api/lead on :8787 (astro.config.mjs proxies /api here) and starts astro dev.
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { POST } from '../api/lead.ts';

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost:8787');
  if (url.pathname !== '/api/lead') { res.writeHead(404).end(); return; }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const out = await POST(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }));
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.writeHead(500).end();
  }
});
server.listen(8787, 'localhost', () => console.log('api on http://127.0.0.1:8787'));

const astro = spawn('npx astro dev', { stdio: 'inherit', shell: true });
// shell:true makes astro.pid the shell, so on Windows kill the whole tree.
const stop = () => { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(astro.pid), '/T', '/F']); else astro.kill(); server.close(); };
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('exit', stop);
astro.on('exit', (code) => process.exit(code ?? 0));
