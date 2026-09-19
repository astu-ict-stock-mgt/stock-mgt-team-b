import 'dotenv/config';
import app from './app.ts';
import { getPrisma } from './config/db.ts';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected and ready.');
  } catch (err: unknown) {
    console.warn(
      '⚠️  Database warmup notice (will connect on demand):',
      (err as Error).message || ''
    );
  }
});
