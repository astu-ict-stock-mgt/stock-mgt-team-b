# Comprehensive Organizational Stock Management Workflow

> Detailed step-by-step workflow derived from the Stock Management System SRS.

**Purpose:** this document explains how stock moves through the organization according to the SRS, covering requisition, approval, receiving, inspection, storage, issuing, transfers, monitoring, stock taking, reconciliation, damaged/obsolete items, valuation, reporting, and audit activities.

## Workflow at a glance

1. Department identifies need
2. Requisition is prepared
3. Request is approved
4. Store checks stock
5. Goods are received & inspected
6. Stock is recorded & stored
7. Department requests issue
8. Request is validated/approved
9. Stock is issued
10. Records & quantity are updated
11. Stock is monitored
12. Transfers are recorded when required
13. Damaged/obsolete items are managed
14. Physical stock taking is performed
15. Reconciliation is completed
16. FIFO valuation & reports are produced
17. Audit trail is maintained

---

## 1. Department Identifies a Material Need

A department determines that it needs an item or material. The current system described in the SRS begins with departments requesting materials from the store.

- **Output:** Material requirement/request

## 2. Department Prepares a Requisition

The department prepares a requisition/request for the required material. The request is submitted for authorization before stock can be issued.

- **Record:** Requisition/request
- **Rule:** Inventory cannot be issued without an approved requisition.

## 3. Request Goes Through Approval

The request is reviewed by the responsible authority before the material can be issued.

- **Decision:** Approved or not approved

## 4. Store Checks Inventory Availability

After authorization, the store checks whether the requested item is available. The system provides real-time stock information and supports minimum, maximum, reorder and safety-stock monitoring.

- **Information checked:** Item, available quantity, stock level, reorder/safety level

## 5. Goods Enter the Organization Through Receiving

When goods are delivered, the store receives them. The SRS states that received goods must be inspected before storage. The proposed system records received goods and updates stock quantity.

- **Record:** Goods receiving note
- **Decision:** Goods pass inspection or require appropriate action

## 6. Inspect and Verify Received Goods

Received items are checked before storage. Item information is entered and validated. Once accepted, inventory quantity is updated and a goods receiving note is generated.

- Enter item details → validate → inspect/verify → accept → record

## 7. Store the Accepted Inventory

Accepted goods are stored in the organization's store or warehouse. The SRS includes warehouse information, inventory records, item categories, unique item codes, bin cards and stock records.

- **Records:** Inventory, warehouse/location, bin card/stock record

## 8. Maintain Stock Records

Every inventory item must have a unique item code. Corresponding bin-card and stock-record information is maintained and updated whenever goods are received or issued.

- **Controls:** Unique item code, stock record, bin card
- **Rule:** Every inventory transaction must be recorded

## 9. Department Requests Stock for Use

When a department needs materials, it submits a request. The request follows the approval process before the store can issue the material.

- **Record:** Requisition/request

## 10. Validate the Issue Request

The store verifies that the request is approved and valid. Stock cannot be issued without an approved requisition.

- **Precondition:** Approved requisition exists

## 11. Issue the Stock

The store issues the approved items to the requesting department. The system records the issued items, updates inventory and can generate an issue report.

- **Output:** Issue transaction/report
- **Effect:** Stock quantity decreases

## 12. Update Inventory and Transaction History

After issuing stock, the inventory quantity is reduced and stock movement is recorded. The system maintains stock history and transaction history.

- **Records:** Stock transaction, inventory quantity, stock history, audit/activity record

## 13. Monitor Stock Levels Continuously

The organization monitors current stock and control levels. The SRS requires minimum and maximum stock levels, reorder levels and safety stock to be maintained.

- **Controls:** Minimum level, maximum level, reorder level, safety stock

## 14. Transfer Stock When Required

The proposed system includes stock transfer. When stock is moved between storage locations or warehouses, the transfer is recorded so inventory quantities remain accurate.

- Source stock decreases → transfer recorded → destination stock increases

## 15. Manage Damaged and Obsolete Items

Damaged or obsolete items are identified and recorded/reported. The SRS models states including Available, Reserved, Issued, Damaged, Obsolete and Disposed.

- **Possible states:** Available → Damaged/Obsolete → Disposed

## 16. Conduct Physical Stock Taking

Physical stock counting is performed to determine the actual quantity held in the store. The SRS states that physical stock taking should be conducted at least once every fiscal year.

- **Activity:** Count physical stock

## 17. Compare Physical Stock With System Records

The physical count is compared with the quantities recorded by the system to identify discrepancies.

- **Comparison:** Physical quantity vs. system quantity
- **Decision:** Match or discrepancy

## 18. Investigate and Reconcile Discrepancies

If a discrepancy exists, it must be investigated and corrected. The system supports stock taking, reconciliation and reconciliation reports.

- Investigate → correct/adjust according to authorization → record reconciliation

## 19. Apply FIFO Inventory Valuation

The SRS specifies FIFO (First In, First Out) as the inventory valuation method. Inventory transactions preserve the information needed to determine the order in which stock was received and valued.

- **Method:** FIFO

## 20. Generate Operational and Management Reports

The system generates inventory reports, stock movement reports, supplier reports and audit reports, together with receiving, issuing and reconciliation information.

- **Outputs:** Inventory, movement, supplier, audit and reconciliation reports

## 21. Maintain Audit and Accountability Records

The system records user activities, transaction history and system changes, providing traceability for inventory operations and supporting transparency and accountability.

- **Records:** Audit logs, transaction history, user activity

---

## Complete End-to-End Flow

Department Need → Requisition → Approval → Stock Availability Check → Receiving → Inspection → Inventory Update → Storage → Stock Request → Approval/Validation → Issue Stock → Update Quantity → Track Transactions → Monitor Reorder/Safety Levels → Transfer When Required → Manage Damaged/Obsolete Stock → Physical Stock Taking → Reconciliation → FIFO Valuation → Reports → Audit Trail
