// client/src/features/stock-issuing/api.ts

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  quantity: number; // Available stock
  category: string;
  unit: string;
}

export interface RequisitionItem {
  itemId: string;
  itemName: string;
  quantityRequested: number;
}

export interface Requisition {
  id: string;
  requisitionNumber: string;
  requesterId: string;
  requesterName: string;
  department: string;
  items: RequisitionItem[];
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedAt?: string;
  sivNumber?: string;
}

// ============================================================
// INITIAL MOCK DATA
// ============================================================

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-1001',
    itemCode: 'ITM-001',
    name: 'A4 Paper Reams (Box of 5)',
    quantity: 120,
    category: 'Office Supplies',
    unit: 'Boxes',
  },
  {
    id: 'INV-1002',
    itemCode: 'ITM-002',
    name: 'Office Chairs (Ergonomic)',
    quantity: 15,
    category: 'Furniture',
    unit: 'Units',
  },
  {
    id: 'INV-1003',
    itemCode: 'ITM-003',
    name: 'Black Ballpoint Pens (Box of 50)',
    quantity: 200,
    category: 'Office Supplies',
    unit: 'Boxes',
  },
  {
    id: 'INV-1004',
    itemCode: 'ITM-004',
    name: 'Desktop Computers',
    quantity: 8,
    category: 'IT Equipment',
    unit: 'Units',
  },
  {
    id: 'INV-1005',
    itemCode: 'ITM-005',
    name: 'Fire Extinguishers',
    quantity: 4,
    category: 'Safety Equipment',
    unit: 'Units',
  },
];

const DEFAULT_REQUISITIONS: Requisition[] = [
  {
    id: 'req-1',
    requisitionNumber: 'REQ-2026-0001',
    requesterId: 'dept-head-1',
    requesterName: 'Feven Korso',
    department: 'IT Department',
    items: [
      { itemId: 'INV-1001', itemName: 'A4 Paper Reams (Box of 5)', quantityRequested: 10 },
      { itemId: 'INV-1003', itemName: 'Black Ballpoint Pens (Box of 50)', quantityRequested: 5 },
    ],
    justification: 'Quarterly supplies for office staff.',
    status: 'ISSUED',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-15T11:30:00.000Z',
    approvedBy: 'Property Administration Officer',
    approvedAt: '2026-08-15T10:15:00.000Z',
    issuedBy: 'Storekeeper John',
    issuedAt: '2026-08-15T11:30:00.000Z',
    sivNumber: 'SIV-2026-0001',
  },
  {
    id: 'req-2',
    requisitionNumber: 'REQ-2026-0002',
    requesterId: 'dept-head-1',
    requesterName: 'Feven Korso',
    department: 'IT Department',
    items: [
      { itemId: 'INV-1004', itemName: 'Desktop Computers', quantityRequested: 3 },
    ],
    justification: 'New workstation setup for developers.',
    status: 'APPROVED',
    createdAt: '2026-08-20T14:20:00.000Z',
    updatedAt: '2026-08-21T09:10:00.000Z',
    approvedBy: 'Property Administration Officer',
    approvedAt: '2026-08-21T09:10:00.000Z',
  },
  {
    id: 'req-3',
    requisitionNumber: 'REQ-2026-0003',
    requesterId: 'dept-head-2',
    requesterName: 'Alex Mercer',
    department: 'Finance Upgrade Office',
    items: [
      { itemId: 'INV-1002', itemName: 'Office Chairs (Ergonomic)', quantityRequested: 20 },
    ],
    justification: 'Replacement seats for accountant desks.',
    status: 'PENDING',
    createdAt: '2026-08-22T10:00:00.000Z',
    updatedAt: '2026-08-22T10:00:00.000Z',
  },
];

// ============================================================
// HELPER FUNCTIONS (LOCAL STORAGE SYNC)
// ============================================================

function getStoredInventory(): InventoryItem[] {
  const data = localStorage.getItem('mock_issuing_inventory');
  if (!data) {
    localStorage.setItem('mock_issuing_inventory', JSON.stringify(DEFAULT_INVENTORY));
    return DEFAULT_INVENTORY;
  }
  return JSON.parse(data);
}

function saveStoredInventory(items: InventoryItem[]) {
  localStorage.setItem('mock_issuing_inventory', JSON.stringify(items));
}

function getStoredRequisitions(): Requisition[] {
  const data = localStorage.getItem('mock_requisitions');
  if (!data) {
    localStorage.setItem('mock_requisitions', JSON.stringify(DEFAULT_REQUISITIONS));
    return DEFAULT_REQUISITIONS;
  }
  return JSON.parse(data);
}

function saveStoredRequisitions(reqs: Requisition[]) {
  localStorage.setItem('mock_requisitions', JSON.stringify(reqs));
}

// ============================================================
// API SERVICE LAYER
// ============================================================

export const stockIssuingApi = {
  // Get inventory items
  getInventoryItems: async (): Promise<InventoryItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getStoredInventory();
  },

  // Get requisitions
  getRequisitions: async (): Promise<Requisition[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getStoredRequisitions();
  },

  // Create requisition (Department Head view)
  createRequisition: async (data: {
    requesterId: string;
    requesterName: string;
    department: string;
    items: { itemId: string; quantityRequested: number }[];
    justification: string;
  }): Promise<Requisition> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const inventory = getStoredInventory();
    const requisitions = getStoredRequisitions();

    // Map item names
    const mappedItems: RequisitionItem[] = data.items.map((i) => {
      const invItem = inventory.find((inv) => inv.id === i.itemId);
      return {
        itemId: i.itemId,
        itemName: invItem ? invItem.name : 'Unknown Item',
        quantityRequested: i.quantityRequested,
      };
    });

    const nextNum = requisitions.length + 1;
    const requisitionNumber = `REQ-2026-${String(nextNum).padStart(4, '0')}`;

    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      requisitionNumber,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      department: data.department,
      items: mappedItems,
      justification: data.justification,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requisitions.push(newReq);
    saveStoredRequisitions(requisitions);
    return newReq;
  },

  // Approve requisition (PAO view)
  approveRequisition: async (id: string, approvedBy: string): Promise<Requisition> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const requisitions = getStoredRequisitions();
    const index = requisitions.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Requisition not found');
    }

    requisitions[index] = {
      ...requisitions[index],
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStoredRequisitions(requisitions);
    return requisitions[index];
  },

  // Reject requisition (PAO view)
  rejectRequisition: async (
    id: string,
    params: { rejectedBy: string; reason: string }
  ): Promise<Requisition> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const requisitions = getStoredRequisitions();
    const index = requisitions.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Requisition not found');
    }

    requisitions[index] = {
      ...requisitions[index],
      status: 'REJECTED',
      rejectionReason: params.reason,
      updatedAt: new Date().toISOString(),
    };

    saveStoredRequisitions(requisitions);
    return requisitions[index];
  },

  // Issue stock (Storekeeper view)
  issueRequisition: async (id: string, issuedBy: string): Promise<Requisition> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const requisitions = getStoredRequisitions();
    const inventory = getStoredInventory();
    const index = requisitions.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Requisition not found');
    }

    const req = requisitions[index];

    if (req.status !== 'APPROVED') {
      throw new Error('Only approved requisitions can be issued');
    }

    // Verify stock and update quantities
    const updatedInventory = [...inventory];
    for (const item of req.items) {
      const invIndex = updatedInventory.findIndex((inv) => inv.id === item.itemId);
      if (invIndex === -1) {
        throw new Error(`Inventory item ${item.itemName} not found`);
      }
      
      const invItem = updatedInventory[invIndex];
      if (invItem.quantity < item.quantityRequested) {
        throw new Error(
          `Insufficient stock for ${item.itemName}. Available: ${invItem.quantity}, Requested: ${item.quantityRequested}`
        );
      }
      
      // Deduct quantity
      updatedInventory[invIndex] = {
        ...invItem,
        quantity: invItem.quantity - item.quantityRequested,
      };
    }

    // Generate SIV Number
    const issuedReqs = requisitions.filter((r) => r.status === 'ISSUED');
    const nextSivNum = issuedReqs.length + 1;
    const sivNumber = `SIV-2026-${String(nextSivNum).padStart(4, '0')}`;

    // Update Requisition
    requisitions[index] = {
      ...req,
      status: 'ISSUED',
      issuedBy,
      issuedAt: new Date().toISOString(),
      sivNumber,
      updatedAt: new Date().toISOString(),
    };

    // Save changes
    saveStoredInventory(updatedInventory);
    saveStoredRequisitions(requisitions);

    // Trigger local events to update any other UI listening to inventory changes
    window.dispatchEvent(
      new CustomEvent('inventory-update', {
        detail: { type: 'stock-issued', requisitionId: id, sivNumber },
      })
    );

    return requisitions[index];
  },
};
