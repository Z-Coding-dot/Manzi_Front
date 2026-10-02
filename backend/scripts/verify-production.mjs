import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
process.env.NODE_ENV = 'production';
process.env.JWT_ACCESS_SECRET = randomBytes(48).toString('base64url');
process.env.JWT_REFRESH_SECRET = randomBytes(48).toString('base64url');
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
process.env.PORT = '3093';
process.env.SMOKE_API_URL = 'http://localhost:3093/api/v1';
const child = spawn(process.execPath, ['dist/main.js'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
child.stdout.on('data', bytes => { output += bytes.toString(); });
child.stderr.on('data', bytes => { output += bytes.toString(); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (child.exitCode !== null) throw new Error('Compiled production server failed to start');
    try { ready = (await fetch(`${process.env.SMOKE_API_URL}/health/ready`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('Production server did not become ready');
  await import('./smoke.mjs');
  const response = await fetch(`${process.env.SMOKE_API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Validation check', email: 'validation@manzil.test', password: randomBytes(16).toString('hex'), role: 'super_admin' }) });
  if (response.status !== 400) throw new Error('Public registration did not reject privilege escalation');
  console.log('PASS public registration rejects elevated roles (400)');
  console.log('Compiled server verified with NODE_ENV=production');
} catch (error) { console.error(output); throw error; }
finally { child.kill(); }
