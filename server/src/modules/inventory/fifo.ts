export interface FifoLot {
  id: string;
  quantityRemaining: number;
  unitCost: number;
  receivedDate: Date;
  createdAt: Date;
  isDepleted: boolean;
}

export interface ConsumptionRecord {
  stockLotId: string;
  quantityConsumed: number;
  unitCost: number;
}

export interface UpdatedLotState {
  id: string;
  quantityRemaining: number;
  isDepleted: boolean;
}

export interface FifoConsumptionResult {
  consumptions: ConsumptionRecord[];
  updatedLots: UpdatedLotState[];
  totalQuantity: number;
  totalValue: number;
}

export interface ValuationSummary {
  totalQuantity: number;
  totalValue: number;
}

// Custom specialized error requested by the team structure
export class InsufficientStockError extends Error {
  constructor(message: string = 'Insufficient stock available to complete FIFO consumption') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

/**
 * Core FIFO Consumption Logic Engine
 * SRS Section 2.5: "Inventory valuation must follow the FIFO principle"
 */
export const applyFifoConsumption = (lots: FifoLot[], quantityToConsume: number): FifoConsumptionResult => {
  if (quantityToConsume <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  // Filter out depleted batches and sort explicitly by oldest receivedDate first
  const activeSortedLots = lots
    .filter(lot => !lot.isDepleted && lot.quantityRemaining > 0)
    .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

  const totalAvailable = activeSortedLots.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
  if (quantityToConsume > totalAvailable) {
    throw new InsufficientStockError();
  }

  let remainingToConsume = quantityToConsume;
  let totalValue = 0;
  
  const consumptions: ConsumptionRecord[] = [];
  const updatedLots: UpdatedLotState[] = [];

  // Map out unmodified active lots initially to retain their signatures
  const fullLotMap = new Map<string, UpdatedLotState>(
    lots.map(l => [l.id, { id: l.id, quantityRemaining: l.quantityRemaining, isDepleted: l.isDepleted }])
  );

  for (const lot of activeSortedLots) {
    if (remainingToConsume <= 0) break;

    const consumeAmount = Math.min(lot.quantityRemaining, remainingToConsume);
    remainingToConsume -= consumeAmount;
    totalValue += consumeAmount * lot.unitCost;

    consumptions.push({
      stockLotId: lot.id,
      quantityConsumed: consumeAmount,
      unitCost: lot.unitCost
    });

    const newQuantity = lot.quantityRemaining - consumeAmount;
    fullLotMap.set(lot.id, {
      id: lot.id,
      quantityRemaining: newQuantity,
      isDepleted: newQuantity === 0
    });
  }

  // Ensure output matches original order or active changes for the testing assertions
  const resultUpdatedLots = lots.map(l => fullLotMap.get(l.id)!);

  return {
    consumptions,
    updatedLots: resultUpdatedLots,
    totalQuantity: quantityToConsume,
    totalValue
  };
};

/**
 * Dynamic Lot Valuation Summary Calculator
 */
export const calculateLotValuation = (lots: FifoLot[]): ValuationSummary => {
  return lots.reduce(
    (summary, lot) => {
      if (!lot.isDepleted && lot.quantityRemaining > 0) {
        summary.totalQuantity += lot.quantityRemaining;
        summary.totalValue += lot.quantityRemaining * lot.unitCost;
      }
      return summary;
    },
    { totalQuantity: 0, totalValue: 0 }
  );
};
