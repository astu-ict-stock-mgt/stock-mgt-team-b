# Stock Management System (Team B, Draft)

A web-based Stock Management System that automates and streamlines inventory operations — replacing manual, paper-based tracking (bin cards, stock record cards, requisition forms) with a centralized, secure, and real-time platform.

Developed as an internship project by a 5-member team at the **ASTU ICT Center**.

## 📋 Overview

Organizations that still rely on manual inventory processes face slow reporting, human error, lost or duplicated records, stock shortages, overstocking, and poor visibility into stock movement. This project addresses those problems by digitizing the full stock lifecycle — from supplier registration and stock receiving through issuing, transfers, tracking, valuation, stock taking, and reporting — with role-based access control and full audit logging.

## ✨ Key Features

- **User & Role Management** — account administration with role-based access control (RBAC)
- **Authentication & Authorization** — secure login, session management, password handling
- **Supplier Management** — register, update, and search suppliers
- **Inventory Management** — item registration, categorization, and unique item codes
- **Stock Receiving** — record and verify incoming goods, auto-update quantities, generate goods receiving notes
- **Stock Issuing** — validate requests, update stock levels, generate issue reports
- **Stock Transfer & Tracking** — monitor stock movement and history across warehouses
- **Stock Control** — minimum/maximum stock levels, reorder points, safety stock monitoring
- **Inventory Valuation** — FIFO (First-In-First-Out) costing method
- **Stock Taking & Reconciliation** — physical count vs. system records, discrepancy reporting
- **Reporting** — inventory, stock movement, supplier, and audit reports
- **Audit Logging** — full traceability of user actions and system changes

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Administrator | Full system access |
| Property Administration Officer (PAO) | Approves requests, monitors inventory activity |
| Storekeeper | Receives/issues stock, updates inventory records |
| Stock Clerk | Maintains stock records and transactions |
| Accountant | Views financial reports, manages inventory valuation |
| Department Head | Approves departmental requisitions |
| Security Officer | Monitors goods entering/leaving the premises |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js / Next.js |
| Backend | Node.js, Express.js |
| Database | PostgreSQL / MySQL |
| API | REST |
| API Testing | Postman |
| Design | Figma |
| Version Control | Git & GitHub |

## 🏗️ Architecture

The system follows a layered architecture:

- **User Interface Layer** — client-facing web application
- **Business Logic Layer** — REST API handling core operations
- **Database Layer** — persistent storage with relational integrity
- **Supporting Modules** — Authentication, Inventory, Reporting, Notification

**Core entities:** `User`, `Role`, `Inventory`, `Category`, `Supplier`, `Warehouse`, `StockTransaction`, `Report`, `AuditLog`

## 🚧 Project Status

This project is under active development. The Software Requirements Specification (SRS), system analysis, and design phases are complete; implementation and testing are in progress, following an Agile development methodology.

## 🔮 Scope & Limitations

**In scope (v1):** user management, supplier management, inventory classification, stock receiving/issuing/transfer, tracking, FIFO valuation, bin card & stock record management, stock taking, reporting, audit logging.

**Out of scope (v1):** mobile app, AI-based demand forecasting, barcode/RFID integration, offline sync, banking system integration, multi-organization support.

## 🚀 Getting Started

> Setup instructions will be finalized as implementation progresses. Planned steps:

```bash
# Clone the repository
git clone <repository-url>
cd stock-management-system

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Configure environment variables (database credentials, JWT secret, etc.)
cp .env.example .env

# Run the backend
npm run dev

# Run the frontend
npm run dev
```

##

## 📄 Documentation

Full requirements, use cases, and design details are documented in the project's Software Requirements Specification (SRS).

## 📜 License

This project is developed for academic and internship purposes at the ASTU ICT Center.
