import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(process.env.JOB_BOARD_BACKEND_DIR || join(root, 'logs/backend-ai2'));
const main = ['dist/src/main.js', 'dist/main.js'].map(path => join(backend, path)).find(existsSync);
if (!main) {
  console.error(`Chưa có backend đã build tại ${backend}. Xem docs/local-fullstack.md.`);
  process.exit(1);
}
// Keep runtime configuration and secrets in the backend's ignored .env.
if (existsSync(join(backend, '.env'))) process.loadEnvFile(join(backend, '.env'));
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
function start(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}
console.log(`Backend nguyên gốc: ${backend}`);
start([main], backend, process.env);
try {
  const deadline = Date.now() + 60000;
  let ready = false;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch('http://localhost:3000/api/jobs?limit=1', { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Startup may still be connecting to PostgreSQL and RabbitMQ. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Backend chưa sẵn sàng. Kiểm tra PostgreSQL, RabbitMQ và log phía trên.');
  if (!stopping) {
    console.log('Frontend: http://localhost:5173 | Swagger: http://localhost:3000/api-docs');
    start([join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], root, process.env);
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
