import { consumeStockFIFO, InputStockLot } from '../../src/modules/inventory/fifo.ts';
import { describe, expect, it } from '@jest/globals';

describe('FIFO Business Logic Unit Testing Suite', () => {
  const sampleLots: InputStockLot[] = [
    { id: 'batch-old-01', quantityRemaining: 10, unitCost: 4.0, receivedDate: new Date('2026-01-01') },
    { id: 'batch-new-02', quantityRemaining: 20, unitCost: 8.0, receivedDate: new Date('2026-02-01') }
  ];

  it('should pass Rule 1: Consume from the oldest batch first (Partial consumption)', () => {
    const response = consumeStockFIFO(sampleLots, 5);
    expect(response.totalCost).toBe(20.0); // 5 * $4.0
    expect(response.updatedLots[0].quantityRemaining).toBe(5);
    expect(response.updatedLots[0].isDepleted).toBe(false);
  });

  it('should pass Rule 2: Exhaust oldest batch and roll directly over into next oldest', () => {
    const response = consumeStockFIFO(sampleLots, 15);
    expect(response.totalCost).toBe(80.0); // (10 * $4.0) + (5 * $8.0)
    expect(response.updatedLots[0].quantityRemaining).toBe(0);
    expect(response.updatedLots[0].isDepleted).toBe(true);
    expect(response.updatedLots[1].quantityRemaining).toBe(15);
  });

  it('should throw explicit error code when requesting more inventory than available total', () => {
    expect(() => {
      consumeStockFIFO(sampleLots, 50);
    }).toThrow('Insufficient stock available to complete FIFO consumption');
  });
});
