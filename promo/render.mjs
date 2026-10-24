// Export server for the promo: serves the page and its files, stores the PNG frames the page
// posts, then encodes them and mixes the voice-over with the sound-effect cues into an
// Instagram Reels MP4 (H.264 + AAC).
// Usage: node promo/render.mjs, then open http://localhost:5199/?export
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const frames = join(dir, 'frames');
const output = join(dir, 'okgym-promo-reels.mp4');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg' };

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const body = (req) => new Promise((resolve) => {
  const parts = [];
  req.on('data', (d) => parts.push(d));
  req.on('end', () => resolve(Buffer.concat(parts)));
});

const run = (args) => new Promise((resolve) => {
  const p = spawn(ffmpeg, args, { stdio: 'inherit' });
  p.on('close', resolve);
});

// One ffmpeg pass: frames as video, the voice delayed by voiceAt, every cue delayed to its time
function encode({ frames: n, voiceAt, cues }) {
  const args = ['-y', '-framerate', '30', '-i', join(frames, '%04d.png'), '-i', join(dir, 'voice.mp3')];
  cues.forEach((c) => args.push('-i', join(dir, 'sfx', `${c.name}.mp3`)));
  const ms = (s) => Math.round(s * 1000);
  const parts = [`[1:a]adelay=${ms(voiceAt)}:all=1,volume=1.0[v]`];
  cues.forEach((c, i) => parts.push(`[${i + 2}:a]adelay=${ms(c.t)}:all=1,volume=${(0.5 * c.gain).toFixed(2)}[s${i}]`));
  const inputs = ['[v]', ...cues.map((_, i) => `[s${i}]`)].join('');
  parts.push(`${inputs}amix=inputs=${cues.length + 1}:normalize=0:dropout_transition=0,alimiter=limit=0.9,apad[a]`);
  args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', `${n / 30}`, '-movflags', '+faststart', output);
  return run(args);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname.startsWith('/frame/')) {
    const n = String(+url.pathname.slice(7)).padStart(4, '0');
    writeFileSync(join(frames, `${n}.png`), await body(req));
    return res.end('ok');
  }
  if (req.method === 'POST' && url.pathname === '/done') {
    const plan = JSON.parse((await body(req)).toString());
    writeFileSync(join(dir, 'cues.json'), JSON.stringify(plan.cues, null, 1));
    const code = await encode(plan);
    console.log(code === 0 ? `wrote ${output}` : `ffmpeg failed (${code})`);
    return res.end(code === 0 ? `Hotovo: ${output}` : `ffmpeg selhal (${code})`);
  }
  const rel = normalize(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
  const file = join(dir, rel);
  if (!file.startsWith(dir) || !existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(5199, () => console.log('http://localhost:5199/'));
