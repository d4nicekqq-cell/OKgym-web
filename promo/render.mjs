// Export server for the promo: serves index.html, stores the PNG frames the page posts,
// then encodes them to an Instagram Reels MP4 with ffmpeg.
// Usage: node promo/render.mjs, then open http://localhost:5199/?export
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const frames = join(dir, 'frames');
const output = join(dir, 'okgym-promo-reels.mp4');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const body = (req) => new Promise((resolve) => {
  const parts = [];
  req.on('data', (d) => parts.push(d));
  req.on('end', () => resolve(Buffer.concat(parts)));
});

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname.startsWith('/frame/')) {
    const n = String(+url.pathname.slice(7)).padStart(4, '0');
    writeFileSync(join(frames, `${n}.png`), await body(req));
    return res.end('ok');
  }
  if (req.method === 'POST' && url.pathname === '/done') {
    const args = ['-y', '-framerate', '30', '-i', join(frames, '%04d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
      '-profile:v', 'high', '-movflags', '+faststart', output];
    const p = spawn(ffmpeg, args, { stdio: 'inherit' });
    p.on('close', (code) => {
      console.log(code === 0 ? `wrote ${output}` : `ffmpeg failed (${code})`);
      res.end(code === 0 ? `Hotovo: ${output}` : `ffmpeg selhal (${code})`);
    });
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(readFileSync(join(dir, 'index.html')));
}).listen(5199, () => console.log('http://localhost:5199/'));
