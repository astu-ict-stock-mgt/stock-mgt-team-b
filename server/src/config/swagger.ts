export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ASTU Stock Management System (ASMS) API',
    version: '1.0.0',
    description: `
Interactive Swagger API documentation and testing console for **ASMS (ASTU Stock Management System)**.

### Testing Instructions:
1. First, call the **\`POST /api/auth/login\`** endpoint using your credentials (e.g. \`admin@stockmgt.com\` / \`password123\`).
2. Copy the returned \`token\` value.
3. Click the **Authorize 🔓** button in the top right.
4. Paste the token into the **BearerAuth** input field and click **Authorize**.
5. You can now execute any protected API request directly in this console!
    `,
    contact: {
      name: 'ASTU ICT Development Team B',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current API Server (/api)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT bearer token. Example: "Bearer eyJhbGciOi..." or simply "eyJhbGciOi..."',
      },
    },
    schemas: {
      StandardError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Error description' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: {
            type: 'string',
            enum: [
              'ADMINISTRATOR',
              'PAO',
              'STOREKEEPER',
              'STOCK_CLERK',
              'ACCOUNTANT',
              'DEPARTMENT_HEAD',
              'SECURITY_OFFICER',
            ],
          },
          department: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health & System'],
        summary: 'System health check probe',
        security: [],
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    message: { type: 'string', example: 'API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user and obtain JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@stockmgt.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/UserResponse' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all system users (ADMINISTRATOR)',
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string' }, description: 'Filter by role' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name/email' },
        ],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UserResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user account (ADMINISTRATOR)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'role'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'pao@stockmgt.com' },
                  password: { type: 'string', example: 'password123' },
                  firstName: { type: 'string', example: 'Tigist' },
                  lastName: { type: 'string', example: 'Mengistu' },
                  role: {
                    type: 'string',
                    enum: [
                      'ADMINISTRATOR',
                      'PAO',
                      'STOREKEEPER',
                      'STOCK_CLERK',
                      'ACCOUNTANT',
                      'DEPARTMENT_HEAD',
                      'SECURITY_OFFICER',
                    ],
                    example: 'PAO',
                  },
                  department: { type: 'string', example: 'Property Administration' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
          },
        },
      },
    },
    '/inventory': {
      get: {
        tags: ['Inventory & Stock'],
        summary: 'List all inventory items with stock levels',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Items catalog' },
        },
      },
      post: {
        tags: ['Inventory & Stock'],
        summary: 'Create a new inventory item catalog entry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemCode', 'name', 'unitOfMeasure'],
                properties: {
                  itemCode: { type: 'string', example: 'IT-LAPTOP-01' },
                  name: { type: 'string', example: 'Dell Latitude 5420' },
                  description: { type: 'string', example: 'Core i7, 16GB RAM' },
                  category: { type: 'string', example: 'Electronics' },
                  unitOfMeasure: { type: 'string', example: 'pcs' },
                  minLevel: { type: 'number', example: 5 },
                  maxLevel: { type: 'number', example: 50 },
                  reorderPoint: { type: 'number', example: 10 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item created' },
        },
      },
    },
    '/inventory/{itemId}': {
      get: {
        tags: ['Inventory & Stock'],
        summary: 'Get item details by ID',
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Item details' },
        },
      },
      put: {
        tags: ['Inventory & Stock'],
        summary: 'Update item catalog attributes',
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  minLevel: { type: 'number' },
                  maxLevel: { type: 'number' },
                  reorderPoint: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Item updated' },
        },
      },
    },
    '/warehouses': {
      get: {
        tags: ['Inventory & Stock'],
        summary: 'List system warehouses',
        responses: {
          200: { description: 'List of warehouses' },
        },
      },
    },
    '/stock-receiving': {
      get: {
        tags: ['Stock Receiving (GRN)'],
        summary: 'List Goods Receiving Notes (GRNs)',
        responses: {
          200: { description: 'List of receiving notes' },
        },
      },
      post: {
        tags: ['Stock Receiving (GRN)'],
        summary: 'Create a new Goods Receiving Note (GRN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['supplierId', 'warehouseId', 'items'],
                properties: {
                  supplierId: { type: 'string', format: 'uuid' },
                  warehouseId: { type: 'string', format: 'uuid' },
                  purchaseOrderNo: { type: 'string', example: 'PO-2026-001' },
                  deliveryNoteNo: { type: 'string', example: 'DN-9942' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['itemId', 'quantityReceived', 'unitCost'],
                      properties: {
                        itemId: { type: 'string', format: 'uuid' },
                        quantityReceived: { type: 'number', example: 20 },
                        quantityAccepted: { type: 'number', example: 20 },
                        unitCost: { type: 'number', example: 450.0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'GRN created and stock lot booked' },
        },
      },
    },
    '/stock-issuing/requisitions': {
      get: {
        tags: ['Stock Issuing & Requisitions'],
        summary: 'List requisitions',
        responses: {
          200: { description: 'List of requisitions' },
        },
      },
      post: {
        tags: ['Stock Issuing & Requisitions'],
        summary: 'Submit a new department stock requisition',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  purpose: { type: 'string', example: 'Lab equipment upgrade' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['itemId', 'quantityRequested'],
                      properties: {
                        itemId: { type: 'string', format: 'uuid' },
                        quantityRequested: { type: 'number', example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Requisition submitted' },
        },
      },
    },
    '/stock-issuing/requisitions/{id}/approve': {
      patch: {
        tags: ['Stock Issuing & Requisitions'],
        summary: 'Approve a department requisition (PAO / Dept Head)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Requisition approved' },
        },
      },
    },
    '/stock-issuing/requisitions/{id}/reject': {
      patch: {
        tags: ['Stock Issuing & Requisitions'],
        summary: 'Reject a department requisition',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Insufficient budget quota' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Requisition rejected' },
        },
      },
    },
    '/stock-issuing/requisitions/{id}/issue': {
      post: {
        tags: ['Stock Issuing & Requisitions'],
        summary: 'Issue approved stock with FIFO valuation & generate SIV (Storekeeper)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Requisition issued with FIFO cost layers deducted' },
        },
      },
    },
    '/stock-transfer': {
      get: {
        tags: ['Stock Transfer'],
        summary: 'List warehouse stock transfers',
        responses: {
          200: { description: 'List of transfers' },
        },
      },
      post: {
        tags: ['Stock Transfer'],
        summary: 'Initiate an inter-warehouse stock transfer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceWarehouseId', 'destinationWarehouseId', 'itemId', 'quantity'],
                properties: {
                  sourceWarehouseId: { type: 'string', format: 'uuid' },
                  destinationWarehouseId: { type: 'string', format: 'uuid' },
                  itemId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'number', example: 10 },
                  reason: { type: 'string', example: 'Stock rebalancing' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Stock transfer initiated' },
        },
      },
    },
    '/gate-pass/pending-outbound': {
      get: {
        tags: ['Gate Clearance'],
        summary: 'List pending outbound items awaiting gate clearance (Security Officer)',
        responses: {
          200: { description: 'Pending outbound passes' },
        },
      },
    },
    '/gate-pass/pending-inbound': {
      get: {
        tags: ['Gate Clearance'],
        summary: 'List pending inbound deliveries awaiting gate clearance (Security Officer)',
        responses: {
          200: { description: 'Pending inbound deliveries' },
        },
      },
    },
    '/gate-pass/verify/{reference}': {
      get: {
        tags: ['Gate Clearance'],
        summary: 'Verify reference barcode/number (SIV, GRN, or Transfer)',
        parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Verification match result' },
        },
      },
    },
    '/stock-taking': {
      get: {
        tags: ['Stock Taking & Reconciliation'],
        summary: 'List periodic stock taking sessions',
        responses: {
          200: { description: 'Stock take sessions' },
        },
      },
      post: {
        tags: ['Stock Taking & Reconciliation'],
        summary: 'Initiate a physical inventory count session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['warehouseId'],
                properties: {
                  warehouseId: { type: 'string', format: 'uuid' },
                  notes: { type: 'string', example: 'Q3 Physical Inventory Count' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Stock take session initialized' },
        },
      },
    },
    '/damaged-obsolete': {
      get: {
        tags: ['Damaged & Obsolete (Write-Off)'],
        summary: 'List write-off items and disposal requests',
        responses: {
          200: { description: 'Write-off records' },
        },
      },
      post: {
        tags: ['Damaged & Obsolete (Write-Off)'],
        summary: 'Log damaged or obsolete stock for review',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId', 'warehouseId', 'quantity', 'reason'],
                properties: {
                  itemId: { type: 'string', format: 'uuid' },
                  warehouseId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'number', example: 2 },
                  reason: { type: 'string', example: 'Water damage during transport' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Damaged stock recorded' },
        },
      },
    },
    '/suppliers': {
      get: {
        tags: ['Suppliers'],
        summary: 'List verified vendors and suppliers',
        responses: {
          200: { description: 'Suppliers list' },
        },
      },
      post: {
        tags: ['Suppliers'],
        summary: 'Register a new supplier',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Dell Technologies' },
                  contactPerson: { type: 'string', example: 'Abebe Kebede' },
                  email: { type: 'string', format: 'email', example: 'sales@dell.com' },
                  phone: { type: 'string', example: '+251911223344' },
                  address: { type: 'string', example: 'Addis Ababa, Ethiopia' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Supplier registered' },
        },
      },
    },
    '/stock-monitoring': {
      get: {
        tags: ['Stock Monitoring'],
        summary: 'Retrieve live threshold alerts (Low stock, Safety level breach)',
        responses: {
          200: { description: 'Monitored stock status' },
        },
      },
    },
    '/reports/summary': {
      get: {
        tags: ['Reports & Valuation'],
        summary: 'Executive dashboard report summary',
        responses: {
          200: { description: 'Report summary statistics' },
        },
      },
    },
    '/reports/valuation': {
      get: {
        tags: ['Reports & Valuation'],
        summary: 'Financial inventory valuation statement (Accountant / PAO)',
        responses: {
          200: { description: 'Valuation report' },
        },
      },
    },
    '/reports/stock-movement': {
      get: {
        tags: ['Reports & Valuation'],
        summary: 'Comprehensive stock ledger and transaction movement report',
        responses: {
          200: { description: 'Stock movements' },
        },
      },
    },
    '/audit-log': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Audit trail of system events (ADMINISTRATOR, PAO, ACCOUNTANT)',
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Audit log entries' },
        },
      },
    },
  },
};
