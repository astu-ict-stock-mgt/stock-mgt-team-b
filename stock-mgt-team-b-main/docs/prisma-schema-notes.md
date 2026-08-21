# Prisma Schema Notes

Placeholder — this file documents how the Prisma schema (`server/prisma/schema.prisma`) must model the core entities defined in the SRS. The schema is not yet populated; define it against the SRS data dictionary (section 3.5.1) and database design (section 4.4.7) before building the modules.

## Core entities (per SRS)

The schema must model at minimum:

- **User** — system users (auth, roles, department)
- **Role** — the 7 RBAC roles: Administrator, PAO, Storekeeper, Stock Clerk, Accountant, Department Head, Security Officer
- **Supplier** — registered suppliers
- **Category** — item categories
- **InventoryItem** — inventory items with a **unique item code** (SRS business rule)
- **Warehouse** — storage locations/warehouses
- **StockTransaction** — stock movement for receiving, issuing, and transfer
- **BinCard / StockRecord** — per-item bin card and stock record (SRS business rule: every stock item must have one)
- **Report** — generated reports
- **AuditLog** — user activity / system changes

## FIFO-relevant fields (critical)

The SRS mandates **First-In-First-Out (FIFO) inventory valuation**. To support it:

- **StockTransaction** records must retain the fields needed to layer costs and value issues against the oldest lots first:
  - `receivedDate` (when the lot entered stock)
  - `unitCost` (per-unit cost of the lot)
  - `quantity` (lot quantity)
- Issue transactions must reference / consume the oldest received lots so valuation is traceable (cost layering, partial consumption).
- Add a negative-balance prevention constraint so issues cannot exceed available quantity.

## Additional SRS rules to model

- Inventory states: `Created`, `Available`, `Reserved`, `Issued`, `Damaged`, `Obsolete`, `Disposed`.
- Min/max stock level, reorder level, and safety stock (stock-monitoring module).
- Reconciliation between physical count and system quantity (stock-taking module).
- Every transaction must be recorded (no silent quantity changes).

Flag in a PR/issue if the SRS is ambiguous on any of these before guessing.
