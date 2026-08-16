// Pure FIFO (First-In-First-Out) inventory valuation utilities.
// This is the single shared implementation of FIFO consumption/valuation for the
// whole system. It must remain side-effect free and independent of Express, Prisma,
// and the database so that stock-issuing, stock-taking, and damaged-obsolete modules
// can all reuse it without duplicating the logic.

export interface InputStockLot {
  id: string;
  quantityRemaining: number;
  unitCost: number;
  receivedDate: Date;
}

export interface FifoUpdate {
  id: string;
  quantityRemaining: number;
  isDepleted: boolean;
}

export interface FifoCalculationResult {
  totalCost: number;
  updatedLots: FifoUpdate[];
}

/**
 * Pure FIFO stock consumption utility.
 * SRS Section 2.5: "Inventory valuation must follow the FIFO principle"
 */
export const consumeStockFIFO = (lots: InputStockLot[], quantityToConsume: number): FifoCalculationResult => {
  if (quantityToConsume <= 0) {
    return { totalCost: 0, updatedLots: [] };
  }

  // Sort batches explicitly by oldest receivedDate first to satisfy FIFO rule
  const sortedLots = [...lots].sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());
  
  const totalAvailable = sortedLots.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
  if (quantityToConsume > totalAvailable) {
    throw new Error('Insufficient stock available to complete FIFO consumption');
  }

  let remainingToConsume = quantityToConsume;
  let totalCost = 0;
  const updatedLots: FifoUpdate[] = [];

  for (const lot of sortedLots) {
    if (remainingToConsume <= 0) {
      // No more items need to be deducted from this batch
      updatedLots.push({
        id: lot.id,
        quantityRemaining: lot.quantityRemaining,
        isDepleted: lot.quantityRemaining === 0
      });
      continue;
    }

    if (lot.quantityRemaining <= remainingToConsume) {
      // This entire lot batch is consumed completely
      totalCost += lot.quantityRemaining * lot.unitCost;
      remainingToConsume -= lot.quantityRemaining;
      updatedLots.push({
        id: lot.id,
        quantityRemaining: 0,
        isDepleted: true
      });
    } else {
      // This lot has enough to cover the rest of what we need partially
      totalCost += remainingToConsume * lot.unitCost;
      const leftOver = lot.quantityRemaining - remainingToConsume;
      remainingToConsume = 0;
      updatedLots.push({
        id: lot.id,
        quantityRemaining: leftOver,
        isDepleted: leftOver === 0
      });
    }
  }

  return { totalCost, updatedLots };
};

export const calculateFifoValuation = (lots: InputStockLot[]): { totalQuantity: number; totalValue: number } => {
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
  const totalValue = lots.reduce((sum, lot) => sum + (lot.quantityRemaining * lot.unitCost), 0);
  return { totalQuantity, totalValue };
};