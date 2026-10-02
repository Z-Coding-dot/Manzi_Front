import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manzil.af';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error('Set a valid SEED_ADMIN_EMAIL');
  if (!seedPassword || seedPassword.length < 12) throw new Error('Set SEED_ADMIN_PASSWORD to a unique password of at least 12 characters');
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.amenity.createMany({
    data: [
      { name: 'Wi-Fi', icon: 'wifi' },
      { name: 'Air conditioning', icon: 'snowflake' },
      { name: 'Heating', icon: 'thermometer' },
      { name: 'Breakfast', icon: 'coffee' },
      { name: 'Restaurant', icon: 'utensils' },
      { name: 'Parking', icon: 'car' },
      { name: 'Kitchen', icon: 'cooking-pot' },
      { name: 'Laundry', icon: 'shirt' },
      { name: 'Hot water', icon: 'droplets' },
      { name: 'Private bathroom', icon: 'bath' },
      { name: 'Shared bathroom', icon: 'bath' },
      { name: 'Security', icon: 'shield-check' },
      { name: 'Generator backup', icon: 'zap' },
      { name: 'Elevator', icon: 'move-vertical' },
      { name: 'Airport transfer', icon: 'plane' },
    ],
    skipDuplicates: true,
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Manzil Admin',
      email: adminEmail,
      passwordHash,
      role: 'super_admin',
      language: 'en',
    },
  });

  if (process.env.SEED_DEMO_OWNER === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo owner seeding is forbidden in production');
    const ownerPassword = process.env.SEED_OWNER_PASSWORD;
    if (!ownerPassword || ownerPassword.length < 12 || ownerPassword === seedPassword) throw new Error('Set a distinct SEED_OWNER_PASSWORD of at least 12 characters');
    await prisma.user.upsert({
    where: { email: 'owner@manzil.af' },
    update: {},
    create: {
      name: 'Parsa',
      email: 'owner@manzil.af',
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      role: 'property_owner',
      language: 'en',
    },
  });
  }

  console.log('Seeded users:');
  console.log(`  Admin: ${admin.email}`);
  console.log('Existing account passwords are not modified by this command.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
