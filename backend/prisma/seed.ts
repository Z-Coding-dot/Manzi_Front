import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

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
    where: { email: 'admin@manzil.af' },
    update: {},
    create: {
      name: 'Manzil Admin',
      email: 'admin@manzil.af',
      passwordHash,
      role: 'super_admin',
      language: 'en',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@manzil.af' },
    update: {},
    create: {
      name: 'Parsa',
      email: 'owner@manzil.af',
      passwordHash,
      role: 'property_owner',
      language: 'en',
    },
  });

  console.log('Seeded users:');
  console.log(`  Admin: ${admin.email} / ChangeMe123!`);
  console.log(`  Property owner: ${owner.email} / ChangeMe123!`);
  console.log(
    'Change these passwords before using anything beyond local development.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
