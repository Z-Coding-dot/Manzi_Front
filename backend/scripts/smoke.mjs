import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { JwtService } from '@nestjs/jwt';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const base = process.env.SMOKE_API_URL ?? 'http://localhost:3092/api/v1';
const jwt = new JwtService();
async function check(path, status, token) {
  const response = await fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (response.status !== status) throw new Error(`${path}: expected ${status}, received ${response.status}`);
  if (status === 200) await response.json();
  console.log(`PASS ${path} (${status})`);
}
try {
  await check('/health/ready', 200);
  await check('/admin/stats', 401);
  const admin = await prisma.user.findFirst({ where: { role: { in: ['admin', 'super_admin'] }, status: 'active' } });
  const owner = await prisma.user.findFirst({ where: { role: 'property_owner', status: 'active' } });
  if (!admin || !owner) throw new Error('Smoke test requires existing active administrator and owner accounts');
  const token = id => jwt.signAsync({ sub: id }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '1m' });
  const adminToken = await token(admin.id), ownerToken = await token(owner.id);
  for (const path of ['/admin/stats','/admin/users','/admin/audit-logs','/admin/cms/pages','/admin/cms/banners','/admin/cms/posts','/admin/cms/settings','/admin/reviews','/support-tickets','/payouts','/reservations']) await check(path, 200, adminToken);
  for (const path of ['/admin/stats','/admin/users','/admin/audit-logs','/admin/cms/pages','/admin/reviews']) await check(path, 403, ownerToken);
  await check('/cms/pages?locale=en', 200);
  await check('/cms/banners?locale=en', 200);
  await check('/cms/pages?locale=invalid', 400);
} finally { await prisma.$disconnect(); }
