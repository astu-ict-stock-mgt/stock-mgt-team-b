import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '../../generated/prisma/index.js';

const { PrismaClient } = pkg;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class SupplierService {
  // Create a new supplier record matching schema requirements
  public async createSupplier(data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    return await prisma.supplier.create({
      data,
    });
  }

  // Retrieve alphabetical directory catalog
  public async getAllSuppliers() {
    return await prisma.supplier.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}