import { Request, Response } from 'express';
import { createStockTransfer } from './service.js';

export async function createTransfer(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      userId,
      referenceNumber,
    } = req.body;

    if (
      !itemId ||
      !fromWarehouseId ||
      !toWarehouseId ||
      quantity === undefined ||
      quantity === null ||
      !userId
    ) {
      res.status(400).json({
        message:
          'itemId, fromWarehouseId, toWarehouseId, quantity and userId are required',
      });
      return;
    }

    const transfer = await createStockTransfer({
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(quantity),
      userId,
      referenceNumber,
    });

    res.status(201).json({
      message: 'Stock transferred successfully',
      data: transfer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to transfer stock';

    res.status(400).json({
      message,
    });
  }
}