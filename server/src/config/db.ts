import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import 'dotenv/config';

let pool: pg.Pool | null = null;
let prismaInstance: PrismaClient | null = null;

export const getPool = (): pg.Pool => {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be configured');
    }
    const isRemote =
      databaseUrl.includes('neon.tech') ||
      databaseUrl.includes('sslmode=require') ||
      (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1'));

    // Strip channel_binding if present: Neon poolers do not support SCRAM channel binding in node-pg
    const cleanUrl = databaseUrl.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');

    pool = new pg.Pool({
      connectionString: cleanUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
    pool.on('error', (err) => {
      console.error('[pg.Pool] background connection error:', err.message);
    });
  }
  return pool;
};

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    const p = getPool();
    const adapter = new PrismaPg(p);
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
};

export const resetPrisma = (): void => {
  prismaInstance = null;
};

