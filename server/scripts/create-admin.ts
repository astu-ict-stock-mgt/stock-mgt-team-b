import bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
};

const databaseUrl = required('DATABASE_URL');
const email = required('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
const password = required('BOOTSTRAP_ADMIN_PASSWORD');
const firstName = required('BOOTSTRAP_ADMIN_FIRST_NAME');
const lastName = required('BOOTSTRAP_ADMIN_LAST_NAME');

if (password.length < 6) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 6 characters');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      firstName,
      lastName,
      role: 'ADMINISTRATOR',
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'ADMINISTRATOR',
      isActive: true,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  console.log(`Administrator ready: ${user.email} (${user.role})`);
} finally {
  await prisma.$disconnect();
}
