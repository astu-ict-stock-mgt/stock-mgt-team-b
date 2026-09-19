import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../../config/db.ts';
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
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
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
