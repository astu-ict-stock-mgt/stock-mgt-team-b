import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import 'dotenv/config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET must be configured', 500);
  }
  return secret;
};

export const login = async ({ email, password }: LoginCredentials) => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  // 🧠 Fetch the user along with their active status safely
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  // 🔒 SECURITY CHECK: Prevent inactive users from logging in
  if (user.isActive === false) {
    throw new AppError('Your account has been deactivated. Please contact your administrator.', 403);
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
    },
  };
};
