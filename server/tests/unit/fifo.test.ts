import { describe, expect, it } from '@jest/globals';
import {
  applyFifoConsumption,
  calculateLotValuation,
  InsufficientStockError,
} from '../../src/modules/inventory/fifo.ts';
import type { FifoLot } from '../../src/modules/inventory/fifo.ts';

const makeLot = (
  id: string,
  quantityRemaining: number,
  unitCost: number,
  receivedDate: Date,
  overrides: Partial<FifoLot> = {}
): FifoLot => ({
  id,
  quantityRemaining,
  unitCost,
  receivedDate,
  createdAt: receivedDate,
  isDepleted: false,
  ...overrides,
});

describe('applyFifoConsumption', () => {
  it('consumes a single lot at its own unit cost', () => {
    const lot = makeLot('lot-1', 10, 5, new Date('2026-01-01T00:00:00Z'));

    const result = applyFifoConsumption([lot], 4);

    expect(result).toEqual({
      consumptions: [{ stockLotId: 'lot-1', quantityConsumed: 4, unitCost: 5 }],
      updatedLots: [{ id: 'lot-1', quantityRemaining: 6, isDepleted: false }],
      totalQuantity: 4,
      totalValue: 20,
    });
  });

  it('depletes a single lot when consumption equals remaining quantity', () => {
    const lot = makeLot('lot-1', 10, 5, new Date('2026-01-01T00:00:00Z'));

    const result = applyFifoConsumption([lot], 10);

    expect(result.updatedLots).toEqual([{ id: 'lot-1', quantityRemaining: 0, isDepleted: true }]);
    expect(result.totalValue).toBe(50);
  });

  it('consumes multiple lots oldest-first', () => {
    const older = makeLot('lot-1', 10, 4, new Date('2026-01-01T00:00:00Z'));
    const newer = makeLot('lot-2', 10, 6, new Date('2026-02-01T00:00:00Z'));

    const result = applyFifoConsumption([newer, older], 15);

    expect(result.consumptions).toEqual([
      { stockLotId: 'lot-1', quantityConsumed: 10, unitCost: 4 },
      { stockLotId: 'lot-2', quantityConsumed: 5, unitCost: 6 },
    ]);
    expect(result.totalValue).toBe(10 * 4 + 5 * 6);
    expect(result.updatedLots).toEqual([
      { id: 'lot-1', quantityRemaining: 0, isDepleted: true },
      { id: 'lot-2', quantityRemaining: 5, isDepleted: false },
    ]);
  });

  it('consumes only part of the oldest lot when quantity fits', () => {
    const lot = makeLot('lot-1', 10, 3, new Date('2026-01-01T00:00:00Z'));

    const result = applyFifoConsumption([lot], 3);

    expect(result.consumptions).toEqual([{ stockLotId: 'lot-1', quantityConsumed: 3, unitCost: 3 }]);
    expect(result.updatedLots).toEqual([{ id: 'lot-1', quantityRemaining: 7, isDepleted: false }]);
  });

  it('skips depleted lots and continues to the next usable lot', () => {
    const depleted = makeLot('lot-1', 10, 2, new Date('2026-01-01T00:00:00Z'), { isDepleted: true });
    const active = makeLot('lot-2', 10, 8, new Date('2026-02-01T00:00:00Z'));

    const result = applyFifoConsumption([depleted, active], 5);

    expect(result.consumptions).toEqual([{ stockLotId: 'lot-2', quantityConsumed: 5, unitCost: 8 }]);
  });

  it('throws InsufficientStockError when stock is insufficient', () => {
    const lot = makeLot('lot-1', 5, 2, new Date('2026-01-01T00:00:00Z'));

    expect(() => applyFifoConsumption([lot], 6)).toThrow(InsufficientStockError);
  });

  it('rejects non-positive quantities', () => {
    const lot = makeLot('lot-1', 5, 2, new Date('2026-01-01T00:00:00Z'));

    expect(() => applyFifoConsumption([lot], 0)).toThrow('Quantity must be a positive integer');
    expect(() => applyFifoConsumption([lot], -3)).toThrow('Quantity must be a positive integer');
  });
});

describe('calculateLotValuation', () => {
  it('computes total quantity and FIFO value across usable lots', () => {
    const lots = [
      makeLot('lot-1', 10, 5, new Date('2026-01-01T00:00:00Z')),
      makeLot('lot-2', 4, 8, new Date('2026-02-01T00:00:00Z')),
      makeLot('lot-3', 6, 3, new Date('2026-03-01T00:00:00Z')),
    ];

    expect(calculateLotValuation(lots)).toEqual({ totalQuantity: 20, totalValue: 10 * 5 + 4 * 8 + 6 * 3 });
  });

  it('ignores depleted lots when valuing inventory', () => {
    const lots = [
      makeLot('lot-1', 0, 5, new Date('2026-01-01T00:00:00Z'), { isDepleted: true }),
      makeLot('lot-2', 7, 4, new Date('2026-02-01T00:00:00Z')),
    ];

    expect(calculateLotValuation(lots)).toEqual({ totalQuantity: 7, totalValue: 28 });
  });
});
