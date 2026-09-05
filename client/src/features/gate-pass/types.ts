export interface GatePassItemSummary {
  itemCode: string;
  name: string;
  quantity: number;
  unit?: string;
  warehouse?: string;
}

export interface PendingOutboundDispatch {
  id: string;
  referenceType: 'SIV' | 'TRANSFER';
  referenceNumber: string;
  issuedAt: string;
  issuedBy: string;
  departmentOrDestination: string;
  warehouseName: string;
  itemsCount: number;
  items: GatePassItemSummary[];
  status: 'READY_FOR_EXIT' | 'CLEARED' | 'FLAGGED';
  gatePassNumber: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  clearedAt: string | null;
}

export interface PendingInboundDelivery {
  id: string;
  grnNumber: string;
  supplierName: string;
  warehouseName: string;
  receivedDate: string;
  receivedBy: string;
  itemsCount: number;
  items: GatePassItemSummary[];
  status: 'READY_FOR_ENTRY' | 'CLEARED' | 'FLAGGED';
  gatePassNumber: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  clearedAt: string | null;
}

export interface GatePassRecord {
  id: string;
  passNumber: string;
  direction: 'OUTBOUND' | 'INBOUND';
  referenceType: 'SIV' | 'TRANSFER' | 'GRN';
  referenceNumber: string;
  vehiclePlate: string;
  driverName: string;
  destination?: string | null;
  origin?: string | null;
  status: 'CLEARED' | 'FLAGGED';
  remarks?: string | null;
  reason?: string | null;
  itemsCount: number;
  items: GatePassItemSummary[];
  officer: {
    id: string;
    name: string;
    email: string;
  };
  clearedAt: string;
}

export interface ClearOutboundPayload {
  referenceNumber: string;
  referenceType?: 'SIV' | 'TRANSFER';
  vehiclePlate: string;
  driverName: string;
  destination: string;
  remarks?: string;
  sealIntact?: boolean;
}

export interface ClearInboundPayload {
  referenceNumber: string;
  supplierName?: string;
  vehiclePlate: string;
  driverName: string;
  remarks?: string;
  sealIntact?: boolean;
}

export interface FlagDiscrepancyPayload {
  referenceNumber: string;
  referenceType: 'SIV' | 'TRANSFER' | 'GRN';
  reason: string;
  vehiclePlate?: string;
  driverName?: string;
  remarks?: string;
}

export interface VerificationResult {
  found: boolean;
  verificationType: 'GATE_PASS_MATCH' | 'SIV_REQUISITION' | 'GOODS_RECEIVING_NOTE' | 'NOT_FOUND';
  status: string;
  authorized: boolean;
  message?: string;
  gatePass?: {
    id: string;
    passNumber: string;
    direction: string;
    referenceType: string;
    referenceNumber: string;
    vehiclePlate: string;
    driverName: string;
    destination?: string;
    remarks?: string;
    items: GatePassItemSummary[];
    officer: string;
    timestamp: string;
  };
  document?: {
    id: string;
    sivNumber?: string;
    requisitionNumber?: string;
    grnNumber?: string;
    supplier?: string;
    warehouse?: string;
    department?: string;
    status: string;
    requester?: string;
    approver?: string | null;
    issuer?: string | null;
    receivedBy?: string;
    issuedAt?: string;
    receivedDate?: string;
    items: GatePassItemSummary[];
  };
}
