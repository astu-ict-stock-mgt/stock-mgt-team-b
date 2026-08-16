import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReorderAlerts = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Fetch real-time active items from the physical database table
    const liveProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    // 2. Filter down to items tracking under low stock limits dynamically
    const lowStockItems = liveProducts.filter(
      (product: any) => product.quantity <= product.reorderLevel
    );

    // 3. Return the real live database items to the client
    return res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message || 'Internal Server Error',
    });
  }
};