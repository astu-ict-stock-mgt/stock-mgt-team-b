import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL =
    'postgresql://test:test@localhost:5432/test';

type AnyMock = jest.Mock<(...args: any[]) => any>;

interface MockPrisma {
    $transaction: AnyMock;
    $disconnect: AnyMock;

    inventoryItem: {
        findUnique: AnyMock;
    };

    warehouse: {
        findUnique: AnyMock;
    };

    binCard: {
        findUnique: AnyMock;
        updateMany: AnyMock;
        upsert: AnyMock;
    };

    stockTransaction: {
        findFirst: AnyMock;
        create: AnyMock;
    };
}

const mockInventoryFindUnique =
    jest.fn<(...args: any[]) => any>();

const mockWarehouseFindUnique =
    jest.fn<(...args: any[]) => any>();

const mockBinCardFindUnique =
    jest.fn<(...args: any[]) => any>();

const mockBinCardUpdateMany =
    jest.fn<(...args: any[]) => any>();

const mockBinCardUpsert =
    jest.fn<(...args: any[]) => any>();

const mockStockTransactionFindFirst =
    jest.fn<(...args: any[]) => any>();

const mockStockTransactionCreate =
    jest.fn<(...args: any[]) => any>();

const mockDisconnect =
    jest.fn<(...args: any[]) => any>();

const mockTransaction =
    jest.fn<(...args: any[]) => any>();

const mockPrisma: MockPrisma = {
    $transaction: mockTransaction,
    $disconnect: mockDisconnect,

    inventoryItem: {
        findUnique: mockInventoryFindUnique,
    },

    warehouse: {
        findUnique: mockWarehouseFindUnique,
    },

    binCard: {
        findUnique: mockBinCardFindUnique,
        updateMany: mockBinCardUpdateMany,
        upsert: mockBinCardUpsert,
    },

    stockTransaction: {
        findFirst: mockStockTransactionFindFirst,
        create: mockStockTransactionCreate,
    },
};

jest.unstable_mockModule(
    '../../src/generated/prisma/client.js',
    () => ({
        PrismaClient: jest.fn(() => mockPrisma),
    }),
);

const { default: stockTransferRoutes } = await import(
    '../../src/modules/stock-transfer/routes.ts'
);

const { errorHandler, notFoundHandler } = await import(
    '../../src/middlewares/errorHandler.ts'
);

const app = express();

app.use(express.json());
app.use('/api/stock-transfers', stockTransferRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const createToken = (
    role = 'STOREKEEPER',
    userId = 'user-storekeeper-1',
) =>
    jwt.sign(
        {
            sub: userId,
            email: 'storekeeper@example.com',
            role,
        },
        process.env.JWT_SECRET as string,
    );

const validPayload = {
    itemId: 'item-1',
    fromWarehouseId: 'warehouse-a',
    toWarehouseId: 'warehouse-b',
    quantity: 30,
    referenceNumber: 'TR-2026-001',
};

const setupSuccessfulTransaction = () => {
    mockTransaction.mockImplementation(
        async (callback) => callback(mockPrisma),
    );

    mockInventoryFindUnique.mockResolvedValue({
        id: validPayload.itemId,
        itemCode: 'ITEM-001',
        name: 'Test Laptop',
    });

    mockWarehouseFindUnique
        .mockResolvedValueOnce({
            id: validPayload.fromWarehouseId,
            name: 'Main Warehouse',
        })
        .mockResolvedValueOnce({
            id: validPayload.toWarehouseId,
            name: 'ICT Store',
        });

    mockBinCardFindUnique.mockResolvedValue({
        id: 'bin-source-1',
        inventoryItemId: validPayload.itemId,
        warehouseId: validPayload.fromWarehouseId,
        balance: 100,
    });

    mockBinCardUpdateMany.mockResolvedValue({
        count: 1,
    });

    mockBinCardUpsert.mockResolvedValue({
        id: 'bin-destination-1',
        inventoryItemId: validPayload.itemId,
        warehouseId: validPayload.toWarehouseId,
        balance: 50,
    });

    mockStockTransactionFindFirst.mockResolvedValue({
        id: 'previous-tx-1',
        type: 'RECEIVE',
        inventoryItemId: validPayload.itemId,
        warehouseId: validPayload.fromWarehouseId,
        quantity: 100,
        unitCost: 100,
        totalValue: 10000,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    mockStockTransactionCreate.mockResolvedValue({
        id: 'transfer-tx-1',
        type: 'TRANSFER',
        inventoryItemId: validPayload.itemId,
        warehouseId: validPayload.fromWarehouseId,
        quantity: validPayload.quantity,
        unitCost: 100,
        totalValue: 3000,
        referenceNumber: validPayload.referenceNumber,
        userId: 'user-storekeeper-1',
    });
};

describe('Stock Transfer API', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockTransaction.mockReset();
        mockDisconnect.mockReset();

        mockInventoryFindUnique.mockReset();
        mockWarehouseFindUnique.mockReset();

        mockBinCardFindUnique.mockReset();
        mockBinCardUpdateMany.mockReset();
        mockBinCardUpsert.mockReset();

        mockStockTransactionFindFirst.mockReset();
        mockStockTransactionCreate.mockReset();
    });

    it('rejects unauthenticated requests', async () => {
        const response = await request(app)
            .post('/api/stock-transfers')
            .send(validPayload)
            .expect(401);

        expect(response.body).toMatchObject({
            status: 'error',
            message: 'Authentication required',
        });

        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects users without permission to transfer stock', async () => {
        const token = createToken('ACCOUNTANT');

        await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(403);

        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects invalid quantity', async () => {
        const token = createToken();

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validPayload,
                quantity: 0,
            })
            .expect(400);

        expect(response.body).toMatchObject({
            status: 'error',
            message: 'quantity must be a positive integer',
        });

        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects negative quantity', async () => {
        const token = createToken();

        await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validPayload,
                quantity: -10,
            })
            .expect(400);

        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects transfer to the same warehouse', async () => {
        const token = createToken();

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validPayload,
                toWarehouseId: validPayload.fromWarehouseId,
            })
            .expect(400);

        expect(response.body.message).toBe(
            'Source and destination warehouses must be different',
        );

        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('successfully transfers stock between warehouses', async () => {
        setupSuccessfulTransaction();

        const token = createToken();

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(201);

        expect(response.body).toMatchObject({
            status: 'success',
            message: 'Stock transferred successfully',
            data: {
                transaction: {
                    id: 'transfer-tx-1',
                    type: 'TRANSFER',
                    inventoryItemId: validPayload.itemId,
                    warehouseId: validPayload.fromWarehouseId,
                    quantity: 30,
                },
                sourceWarehouseId: validPayload.fromWarehouseId,
                destinationWarehouseId: validPayload.toWarehouseId,
                quantity: 30,
                sourceBalance: 70,
                destinationBalance: 50,
            },
        });

        expect(mockTransaction).toHaveBeenCalledTimes(1);

        expect(mockBinCardUpdateMany).toHaveBeenCalledWith({
            where: {
                id: 'bin-source-1',
                balance: {
                    gte: 30,
                },
            },
            data: {
                balance: {
                    decrement: 30,
                },
                lastUpdated: expect.any(Date),
            },
        });

        expect(mockBinCardUpsert).toHaveBeenCalledWith({
            where: {
                inventoryItemId_warehouseId: {
                    inventoryItemId: validPayload.itemId,
                    warehouseId: validPayload.toWarehouseId,
                },
            },
            update: {
                balance: {
                    increment: 30,
                },
                lastUpdated: expect.any(Date),
            },
            create: {
                inventoryItemId: validPayload.itemId,
                warehouseId: validPayload.toWarehouseId,
                balance: 30,
                lastUpdated: expect.any(Date),
            },
        });

        expect(mockStockTransactionCreate).toHaveBeenCalledWith({
            data: {
                type: 'TRANSFER',
                inventoryItemId: validPayload.itemId,
                warehouseId: validPayload.fromWarehouseId,
                quantity: 30,
                unitCost: 100,
                totalValue: 3000,
                referenceNumber: validPayload.referenceNumber,
                userId: 'user-storekeeper-1',
            },
        });
    });

    it('allows ADMINISTRATOR role to transfer stock', async () => {
        setupSuccessfulTransaction();

        const token = createToken('ADMINISTRATOR', 'user-admin-1');

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(201);

        expect(response.body).toMatchObject({
            status: 'success',
            message: 'Stock transferred successfully',
            data: expect.objectContaining({
                transaction: expect.objectContaining({
                    type: 'TRANSFER',
                }),
            }),
        });

        expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('rejects a transfer when source stock is insufficient', async () => {
        const token = createToken();

        mockTransaction.mockImplementation(
            async (callback) => callback(mockPrisma),
        );

        mockInventoryFindUnique.mockResolvedValue({
            id: validPayload.itemId,
        });

        mockWarehouseFindUnique
            .mockResolvedValueOnce({
                id: validPayload.fromWarehouseId,
            })
            .mockResolvedValueOnce({
                id: validPayload.toWarehouseId,
            });

        mockBinCardFindUnique.mockResolvedValue({
            id: 'bin-source-1',
            inventoryItemId: validPayload.itemId,
            warehouseId: validPayload.fromWarehouseId,
            balance: 10,
        });

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...validPayload,
                quantity: 20,
            })
            .expect(400);

        expect(response.body.message).toContain(
            'Insufficient stock',
        );

        expect(mockBinCardUpdateMany).not.toHaveBeenCalled();
        expect(mockBinCardUpsert).not.toHaveBeenCalled();
        expect(mockStockTransactionCreate).not.toHaveBeenCalled();
    });

    it('records the stock movement as TRANSFER, not ISSUE or RECEIVE', async () => {
        setupSuccessfulTransaction();

        const token = createToken();

        await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(201);

        expect(mockStockTransactionCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'TRANSFER',
                }),
            }),
        );

        expect(mockStockTransactionCreate).not.toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'ISSUE',
                }),
            }),
        );

        expect(mockStockTransactionCreate).not.toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'RECEIVE',
                }),
            }),
        );
    });

    it('propagates a failure inside the transaction so Prisma can roll it back', async () => {
        const token = createToken();

        const transactionError = new Error(
            'Destination update failed',
        );

        mockTransaction.mockImplementation(
            async (callback) => callback(mockPrisma),
        );

        mockInventoryFindUnique.mockResolvedValue({
            id: validPayload.itemId,
        });

        mockWarehouseFindUnique
            .mockResolvedValueOnce({
                id: validPayload.fromWarehouseId,
            })
            .mockResolvedValueOnce({
                id: validPayload.toWarehouseId,
            });

        mockBinCardFindUnique.mockResolvedValue({
            id: 'bin-source-1',
            inventoryItemId: validPayload.itemId,
            warehouseId: validPayload.fromWarehouseId,
            balance: 100,
        });

        mockBinCardUpdateMany.mockResolvedValue({
            count: 1,
        });

        mockBinCardUpsert.mockRejectedValue(
            transactionError,
        );

        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(500);

        expect(response.body).toMatchObject({
            status: 'error',
            message: 'Destination update failed',
        });

        expect(mockStockTransactionCreate).not.toHaveBeenCalled();
    });
});