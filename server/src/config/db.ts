import net from 'net';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import 'dotenv/config';

// Disable Node's Happy Eyeballs autoSelectFamily algorithm when connecting to dual-stack IPv4/IPv6 AWS Neon endpoints.
// Node's default 250ms race aborts connections before AWS completes TCP handshake on systems without IPv6 routes.
if (
  typeof (net as unknown as { setDefaultAutoSelectFamily?: (val: boolean) => void })
    .setDefaultAutoSelectFamily === 'function'
) {
  (
    net as unknown as { setDefaultAutoSelectFamily: (val: boolean) => void }
  ).setDefaultAutoSelectFamily(false);
}

let pool: pg.Pool | null = null;
let prismaInstance: PrismaClient | null = null;

export const isTransientDbError = (err: unknown): boolean => {
  if (!err) return false;
  const anyErr = err as { code?: string; message?: string };
  const msg = String(anyErr.message || '').toLowerCase();
  const code = String(anyErr.code || '').toUpperCase();

  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EAI_AGAIN' ||
    code === 'ENETUNREACH' ||
    code === '57P01' || // PostgreSQL admin shutdown / compute restart
    code === 'P1001' || // Can't reach database server
    code === 'P1002' || // Database server was reached but timed out
    code === 'P1008' || // Operations timed out
    code === 'P1017' || // Server has closed the connection
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('eai_again') ||
    msg.includes('enetunreach') ||
    msg.includes('connection terminated') ||
    msg.includes('connection closed') ||
    msg.includes('reach database') ||
    msg.includes('closed the connection') ||
    msg.includes('getaddrinfo') ||
    msg.includes('timeout')
  );
};

export const getPool = (): pg.Pool => {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be configured');
    }

    const isRemote =
      databaseUrl.includes('neon.tech') ||
      databaseUrl.includes('sslmode=') ||
      (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1'));

    try {
      const parsed = new URL(databaseUrl);
      pool = new pg.Pool({
        host: parsed.hostname,
        port: parseInt(parsed.port || '5432', 10),
        database: parsed.pathname.replace(/^\//, ''),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 20000,
        idleTimeoutMillis: 30000,
        max: 10,
      });
    } catch {
      // Fallback if URL parsing fails
      const cleanUrl = databaseUrl
        .replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1')
        .replace(/([?&])sslmode=[^&]*(&|$)/g, '$1')
        .replace(/[?&]$/, '');

      pool = new pg.Pool({
        connectionString: cleanUrl,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 20000,
        idleTimeoutMillis: 30000,
        max: 10,
      });
    }

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
    const base = new PrismaClient({ adapter });

    if (typeof (base as unknown as { $extends?: unknown }).$extends === 'function') {
      prismaInstance = (base.$extends({
        query: {
          $allModels: {
            async $allOperations({ args, query }) {
              let retries = 3;
              let delay = 500;
              while (true) {
                try {
                  return await query(args);
                } catch (err: unknown) {
                  retries--;
                  if (retries <= 0 || !isTransientDbError(err)) {
                    throw err;
                  }
                  console.warn(
                    `[DB Retry] Transient database error. Retrying in ${delay}ms...`
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  delay *= 2;
                }
              }
            },
          },
        },
      }) as unknown) as PrismaClient;
    } else {
      prismaInstance = base;
    }
  }
  return prismaInstance;
};

export const resetPrisma = (): void => {
  prismaInstance = null;
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
};

