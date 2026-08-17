// @ts-nocheck

export const STORAGE_KEYS = {
  BALANCES: 'stock_transfer_balances',
  TRANSFERS: 'stock_transfer_history',
};

const INITIAL_ITEMS = [
  { id: 'item-1', name: 'Keyboard', itemCode: 'IT-KB-001', category: 'Peripherals' },
  { id: 'item-2', name: 'Mouse', itemCode: 'IT-MS-002', category: 'Peripherals' },
  { id: 'item-3', name: 'Monitor', itemCode: 'IT-MN-003', category: 'Displays' },
  { id: 'item-4', name: 'Laptop', itemCode: 'IT-LP-004', category: 'Computers' },
  { id: 'item-5', name: 'Printer', itemCode: 'IT-PR-005', category: 'Office Equipment' },
  { id: 'item-6', name: 'Desk Chair', itemCode: 'FUR-DC-006', category: 'Furniture' },
];

const INITIAL_LOCATIONS = [
  { id: 'loc-1', name: 'Main Warehouse' },
  { id: 'loc-2', name: 'Computer Lab' },
  { id: 'loc-3', name: 'Office' },
  { id: 'loc-4', name: 'Branch Warehouse' },
  { id: 'loc-5', name: 'Shop' },
];

const INITIAL_STOCK_BALANCES = {
  'item-1': { 'loc-1': 50, 'loc-2': 10, 'loc-3': 0, 'loc-4': 0, 'loc-5': 0 },
  'item-2': { 'loc-1': 40, 'loc-2': 0, 'loc-3': 15, 'loc-4': 10, 'loc-5': 0 },
  'item-3': { 'loc-1': 20, 'loc-2': 5, 'loc-3': 0, 'loc-4': 15, 'loc-5': 0 },
  'item-4': { 'loc-1': 25, 'loc-2': 12, 'loc-3': 8, 'loc-4': 0, 'loc-5': 0 },
  'item-5': { 'loc-1': 8, 'loc-2': 0, 'loc-3': 2, 'loc-4': 4, 'loc-5': 0 },
  'item-6': { 'loc-1': 30, 'loc-2': 0, 'loc-3': 10, 'loc-4': 0, 'loc-5': 0 },
};

const INITIAL_TRANSFERS = [
  {
    id: 'tr-1',
    itemId: 'item-1',
    itemName: 'Keyboard',
    fromLocationId: 'loc-1',
    fromLocationName: 'Main Warehouse',
    toLocationId: 'loc-2',
    toLocationName: 'Computer Lab',
    quantity: 10,
    date: 'May 15, 2025 10:30 AM',
    transferredBy: 'Admin User',
  },
  {
    id: 'tr-2',
    itemId: 'item-2',
    itemName: 'Mouse',
    fromLocationId: 'loc-1',
    fromLocationName: 'Main Warehouse',
    toLocationId: 'loc-3',
    toLocationName: 'Office',
    quantity: 5,
    date: 'May 14, 2025 03:20 PM',
    transferredBy: 'Admin User',
  },
  {
    id: 'tr-3',
    itemId: 'item-4',
    itemName: 'Laptop',
    fromLocationId: 'loc-1',
    fromLocationName: 'Main Warehouse',
    toLocationId: 'loc-2',
    toLocationName: 'Computer Lab',
    quantity: 2,
    date: 'May 13, 2025 09:15 AM',
    transferredBy: 'Admin User',
  },
];

function getStoredBalances() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BALANCES);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return INITIAL_STOCK_BALANCES;
}

function saveBalances(balances) {
  try {
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
  } catch {
    // fallback
  }
}

function getStoredTransfers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return INITIAL_TRANSFERS;
}

function saveTransfers(transfers) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  } catch {
    // fallback
  }
}

function formatCurrentDateTime() {
  const now = new Date();
  return (
    now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
}

export const stockTransferApi = {
  async getItems() {
    return Promise.resolve(INITIAL_ITEMS);
  },

  async getLocations() {
    return Promise.resolve(INITIAL_LOCATIONS);
  },

  async getItemStockLocations(itemId) {
    const balances = getStoredBalances();
    const itemBalances = balances[itemId] || {};
    return Promise.resolve(
      INITIAL_LOCATIONS.map((loc) => ({
        locationId: loc.id,
        locationName: loc.name,
        availableQuantity: itemBalances[loc.id] ?? 0,
      }))
    );
  },

  async getTransferHistory(search) {
    let transfers = getStoredTransfers();
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      transfers = transfers.filter(
        (t) =>
          t.itemName.toLowerCase().includes(q) ||
          t.fromLocationName.toLowerCase().includes(q) ||
          t.toLocationName.toLowerCase().includes(q) ||
          t.transferredBy.toLowerCase().includes(q) ||
          t.date.toLowerCase().includes(q)
      );
    }
    return Promise.resolve(transfers);
  },

  async createTransfer(payload) {
    const balances = getStoredBalances();
    const itemBalances = { ...(balances[payload.itemId] || {}) };
    const currentFromQty = itemBalances[payload.fromLocationId] ?? 0;

    if (currentFromQty < payload.quantity) {
      throw new Error(`Not enough stock! Only ${currentFromQty} units available at this location.`);
    }

    itemBalances[payload.fromLocationId] = currentFromQty - payload.quantity;
    itemBalances[payload.toLocationId] = (itemBalances[payload.toLocationId] ?? 0) + payload.quantity;
    balances[payload.itemId] = itemBalances;
    saveBalances(balances);

    const item = INITIAL_ITEMS.find((i) => i.id === payload.itemId);
    const fromLoc = INITIAL_LOCATIONS.find((l) => l.id === payload.fromLocationId);
    const toLoc = INITIAL_LOCATIONS.find((l) => l.id === payload.toLocationId);

    const newRecord = {
      id: `tr-${Date.now()}`,
      itemId: payload.itemId,
      itemName: item?.name || 'Unknown Item',
      fromLocationId: payload.fromLocationId,
      fromLocationName: fromLoc?.name || 'Unknown Location',
      toLocationId: payload.toLocationId,
      toLocationName: toLoc?.name || 'Unknown Location',
      quantity: payload.quantity,
      date: formatCurrentDateTime(),
      transferredBy: payload.transferredBy || 'Admin User',
    };

    saveTransfers([newRecord, ...getStoredTransfers()]);
    return Promise.resolve(newRecord);
  },
};
