import bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL must be configured in environment');
  }
  return url;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function main() {
  console.log('🌱 Starting Stock Management System database seeding...');

  // 1. Seed Roles & Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      email: 'admin@stockmgt.com',
      firstName: 'Alemayehu',
      lastName: 'Tadesse',
      role: 'ADMINISTRATOR' as const,
      department: 'Management Information Systems',
    },
    {
      email: 'storekeeper@stockmgt.com',
      firstName: 'Kassahun',
      lastName: 'Worku',
      role: 'STOREKEEPER' as const,
      department: 'Central Warehouse Operations',
    },
    {
      email: 'pao@stockmgt.com',
      firstName: 'Tigist',
      lastName: 'Mengistu',
      role: 'PAO' as const,
      department: 'Property Administration',
    },
    {
      email: 'stockclerk@stockmgt.com',
      firstName: 'Dawit',
      lastName: 'Bekele',
      role: 'STOCK_CLERK' as const,
      department: 'Inventory Records & Audits',
    },
    {
      email: 'depthead@stockmgt.com',
      firstName: 'Solomon',
      lastName: 'Girma',
      role: 'DEPARTMENT_HEAD' as const,
      department: 'Information Technology',
    },
    {
      email: 'accountant@stockmgt.com',
      firstName: 'Bethlehem',
      lastName: 'Fikru',
      role: 'ACCOUNTANT' as const,
      department: 'Finance & Accounts',
    },
    {
      email: 'security@stockmgt.com',
      firstName: 'Mulugeta',
      lastName: 'Chala',
      role: 'SECURITY_OFFICER' as const,
      department: 'Premises & Asset Security',
    },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.department,
        isActive: true,
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.department,
        isActive: true,
      },
    });
    users[u.role] = user;
    console.log(`  ✓ User created/verified: ${user.email} [${user.role}]`);
  }

  // 2. Seed Warehouses
  const warehousesData = [
    { name: 'Main Central Warehouse', location: 'Building A, Ground Floor' },
    { name: 'Secondary Store', location: 'Building B, Room 102' },
    { name: 'IT Equipment Storage', location: 'ICT Center, 2nd Floor' },
  ];

  const warehouses: Record<string, any> = {};
  for (const w of warehousesData) {
    const warehouse = await prisma.warehouse.upsert({
      where: { name: w.name },
      update: { location: w.location },
      create: { name: w.name, location: w.location },
    });
    warehouses[w.name] = warehouse;
    console.log(`  ✓ Warehouse created/verified: ${warehouse.name}`);
  }

  // 3. Seed Categories
  const categoriesData = [
    { name: 'Electronics & Computers', description: 'Computing equipment, laptops, screens, peripherals' },
    { name: 'Office Supplies', description: 'Paper, writing materials, stationery, desktop items' },
    { name: 'Printer Consumables', description: 'Toners, cartridges, printheads, ribbons' },
    { name: 'Office Furniture', description: 'Desks, ergonomic chairs, cabinets, conference tables' },
  ];

  const categories: Record<string, any> = {};
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: { name: c.name, description: c.description },
    });
    categories[c.name] = category;
    console.log(`  ✓ Category created/verified: ${category.name}`);
  }

  // 4. Seed Suppliers
  const suppliersData = [
    {
      name: 'Dell Technologies Global Ltd',
      contactName: 'Abebe Kebede',
      email: 'enterprise@dell.com',
      phone: '+251-11-551-0001',
      address: 'Bole Medhanialem Commercial Center, Addis Ababa',
    },
    {
      name: 'Universal Stationery PLC',
      contactName: 'Sara Hailu',
      email: 'sales@universal-stationery.com',
      phone: '+251-11-442-9988',
      address: 'Piazza Mall, Addis Ababa',
    },
  ];

  const suppliers: Record<string, any> = {};
  for (const s of suppliersData) {
    let supplier = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: s });
    }
    suppliers[s.name] = supplier;
    console.log(`  ✓ Supplier created/verified: ${supplier.name}`);
  }

  // 5. Seed Inventory Items with multi-layered FIFO lots
  const itemsData = [
    {
      itemCode: 'LAP-DELL-5520',
      name: 'Dell Latitude 5520 Laptop (16GB, 512GB SSD)',
      description: 'Business laptop for software engineers and executives',
      category: 'Electronics & Computers',
      warehouse: 'Main Central Warehouse',
      minLevel: 5,
      maxLevel: 50,
      reorderLevel: 10,
      safetyStock: 5,
      lots: [
        { daysAgo: 30, qty: 10, unitCost: 1200.0 }, // Old lot (FIFO first)
        { daysAgo: 10, qty: 15, unitCost: 1250.0 }, // New lot (higher cost)
      ],
    },
    {
      itemCode: 'MON-DELL-P24',
      name: 'Dell 24-inch Monitor P2419H',
      description: 'FHD IPS LED monitor with HDMI and DisplayPort',
      category: 'Electronics & Computers',
      warehouse: 'Main Central Warehouse',
      minLevel: 10,
      maxLevel: 100,
      reorderLevel: 20,
      safetyStock: 10,
      lots: [
        { daysAgo: 20, qty: 30, unitCost: 280.0 },
      ],
    },
    {
      itemCode: 'PPR-A4-80G',
      name: 'Double A Copy Paper A4 80gsm (Ream)',
      description: 'Premium multi-purpose copy paper 500 sheets',
      category: 'Office Supplies',
      warehouse: 'Secondary Store',
      minLevel: 50,
      maxLevel: 500,
      reorderLevel: 100,
      safetyStock: 50,
      lots: [
        { daysAgo: 45, qty: 150, unitCost: 8.5 },
      ],
    },
    {
      itemCode: 'TON-HP-85A',
      name: 'HP LaserJet 85A Toner Cartridge',
      description: 'Black LaserJet toner cartridge CE285A',
      category: 'Printer Consumables',
      warehouse: 'IT Equipment Storage',
      minLevel: 5,
      maxLevel: 30,
      reorderLevel: 8,
      safetyStock: 4,
      lots: [
        { daysAgo: 15, qty: 12, unitCost: 65.0 },
      ],
    },
  ];

  for (const itemDef of itemsData) {
    const category = categories[itemDef.category];
    const warehouse = warehouses[itemDef.warehouse];

    const item = await prisma.inventoryItem.upsert({
      where: { itemCode: itemDef.itemCode },
      update: {
        name: itemDef.name,
        description: itemDef.description,
        categoryId: category.id,
        warehouseId: warehouse.id,
        minLevel: itemDef.minLevel,
        maxLevel: itemDef.maxLevel,
        reorderLevel: itemDef.reorderLevel,
        safetyStock: itemDef.safetyStock,
        state: 'AVAILABLE',
      },
      create: {
        itemCode: itemDef.itemCode,
        name: itemDef.name,
        description: itemDef.description,
        categoryId: category.id,
        warehouseId: warehouse.id,
        minLevel: itemDef.minLevel,
        maxLevel: itemDef.maxLevel,
        reorderLevel: itemDef.reorderLevel,
        safetyStock: itemDef.safetyStock,
        state: 'AVAILABLE',
      },
    });

    let totalQuantity = 0;
    for (const lotDef of itemDef.lots) {
      totalQuantity += lotDef.qty;
      const receivedDate = new Date();
      receivedDate.setDate(receivedDate.getDate() - lotDef.daysAgo);

      // Check if lot exists
      const existingLot = await prisma.stockLot.findFirst({
        where: {
          inventoryItemId: item.id,
          unitCost: lotDef.unitCost,
          quantityReceived: lotDef.qty,
        },
      });

      if (!existingLot) {
        await prisma.stockLot.create({
          data: {
            inventoryItemId: item.id,
            quantityReceived: lotDef.qty,
            quantityRemaining: lotDef.qty,
            unitCost: lotDef.unitCost,
            receivedDate,
            isDepleted: false,
          },
        });
      }
    }

    // Upsert BinCard
    await prisma.binCard.upsert({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: item.id,
          warehouseId: warehouse.id,
        },
      },
      update: {
        balance: totalQuantity,
        lastUpdated: new Date(),
      },
      create: {
        inventoryItemId: item.id,
        warehouseId: warehouse.id,
        balance: totalQuantity,
      },
    });

    console.log(`  ✓ Inventory item & FIFO lots seeded: ${item.itemCode} (Balance: ${totalQuantity})`);
  }

  // 6. Seed Sample Requisition
  const dellLaptop = await prisma.inventoryItem.findUnique({ where: { itemCode: 'LAP-DELL-5520' } });
  if (dellLaptop) {
    const existingReq = await prisma.requisition.findUnique({ where: { requisitionNumber: 'REQ-2026-0001' } });
    if (!existingReq) {
      await prisma.requisition.create({
        data: {
          requisitionNumber: 'REQ-2026-0001',
          requesterId: users.DEPARTMENT_HEAD.id,
          department: 'Information Technology',
          justification: 'Procuring workstations for 3 incoming software engineering specialists',
          status: 'PENDING',
          items: {
            create: [
              {
                inventoryItemId: dellLaptop.id,
                quantityRequested: 3,
              },
            ],
          },
        },
      });
      console.log('  ✓ Sample Requisition REQ-2026-0001 created');
    }
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('Demo Login Credentials (password: password123):');
  console.log('  - Administrator:     admin@stockmgt.com');
  console.log('  - Storekeeper:       storekeeper@stockmgt.com');
  console.log('  - Property Admin:    pao@stockmgt.com');
  console.log('  - Stock Clerk:       stockclerk@stockmgt.com');
  console.log('  - Department Head:   depthead@stockmgt.com');
  console.log('  - Accountant:        accountant@stockmgt.com');
  console.log('  - Security Officer:  security@stockmgt.com');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

