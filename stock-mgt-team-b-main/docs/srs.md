# Stock Management System — Software Requirements Specification

> This document is a markdown rendering of the extracted text of `docs/SRS.docx`. Refer to the original `.docx` for the authoritative version.

---

# Acknowledgements

First and foremost, we would like to express our sincere gratitude to Almighty God for granting us the strength, wisdom, and determination to prepare this project requirement document.We would also like to extend our heartfelt appreciation to our advisors and instructors for their valuable guidance, constructive comments, and continuous support throughout the analysis and design phases of this project.Our special thanks go to the Department of Computer Science and Engineering and our university for providing us with the knowledge, resources, and academic environment necessary for the preparation of this work.We are also grateful to the staff members and stakeholders who shared their knowledge and experiences in inventory management, which greatly contributed to the requirement gathering and system design activities.Finally, we would like to thank our families and friends for their encouragement, patience, and moral support during the preparation of this project proposal.Although the implementation and testing phases of the Stock Management System are still in progress, we believe that the guidance and support we have received will contribute significantly to the successful completion of the project.


# Abstract

The Stock Management System is a web-based application designed to automate and improve inventory management activities within an organization. The system aims to replace traditional manual procedures with a computerized solution that increases efficiency, accuracy, transparency, and accountability in stock administration.The existing inventory management process relies heavily on paper-based records, bin cards, stock record cards, and manual calculations. These methods are time-consuming and susceptible to human errors, data loss, stock shortages, overstocking, and delays in report generation. To address these challenges, the proposed system provides an integrated platform for managing inventory operations.The system includes modules for user management, supplier management, stock classification, stock receiving, stock issuing, stock transfer, stock tracking, stock valuation, stock taking, report generation, and audit logging. The system also supports inventory valuation using the First-In-First-Out (FIFO) method and implements role-based access control to ensure data security.The project follows the Agile software development methodology, which includes requirement gathering, system analysis, design, implementation, testing, deployment, and maintenance. Modern technologies such as React.js, Node.js, Express.js, and PostgreSQL will be used to develop the application.The proposed Stock Management System is expected to reduce paperwork, minimize operational costs, improve decision-making, and provide real-time inventory information. Ultimately, the system will enhance the effectiveness of inventory management and contribute to better organizational performance.


## 1.1 Background

Inventory management plays a vital role in the daily operations of organizations such as government institutions, universities, hospitals, warehouses, and private companies. Every organization depends on materials, equipment, and supplies to carry out its activities efficiently. Therefore, proper management of these resources is essential to ensure their availability whenever they are needed.Traditionally, many organizations manage their inventories using manual methods such as paper records, stock cards, bin cards, and handwritten reports. Although these methods have been used for many years, they are time-consuming, difficult to maintain, and highly vulnerable to human errors. Problems such as loss of records, inaccurate calculations, stock shortages, overstocking, and delayed reporting frequently occur in manual systems.With the advancement of information technology, computerized inventory management systems have become an effective solution for managing stock operations. A Stock Management System automates activities such as stock receiving, stock issuing, stock tracking, stock valuation, stock taking, report generation, and inventory control.The proposed Stock Management System is a web-based application designed to improve inventory management by providing accurate, secure, and real-time information about stock movement and availability. The system will reduce paperwork, improve operational efficiency, and support effective decision-making.


## 1.2 Statement of the Problem

Many organizations still use traditional methods to manage their inventory. These methods create several operational challenges that negatively affect organizational performance.The major problems of the existing system include:Difficulty in tracking stock movement.Human errors during data recording.Loss and duplication of inventory records.Delays in report generation.Overstocking and stock shortages.Inaccurate inventory valuation.Poor monitoring of damaged and obsolete items.Lack of transparency and accountability.Limited access to real-time inventory information.Difficulty in conducting stock taking and reconciliation.Because of these problems, organizations require a computerized solution that can automate inventory management activities and improve the efficiency and reliability of inventory operations.


## 1.3 Purpose of the Project

The purpose of this project is to design and develop a web-based Stock Management System that automates inventory management processes and improves the overall efficiency of stock administration.The system aims to provide a centralized platform for managing inventory operations, including stock receiving, stock issuing, stock classification, stock tracking, stock valuation, stock taking, and report generation.The project also aims to minimize manual work, reduce human errors, improve transparency, and provide accurate and real-time inventory information.


### 1.4.1 General Objective

To design and develop a computerized Stock Management System that automates inventory management activities and improves operational efficiency.


### 1.4.2 Specific Objectives

The specific objectives of the project are:To develop a secure authentication and authorization system.To manage inventory categories and item codes.To register suppliers and manage supplier information.To record stock receipts and stock issues.To maintain bin cards and stock records.To implement FIFO inventory valuation.To monitor reorder levels and safety stock.To automate stock taking and reconciliation.To generate inventory reports and analytics.To manage damaged and obsolete stock.To maintain audit logs and activity records.To provide real-time inventory information.


## 1.5 Feasibility Study

A feasibility study was conducted to determine whether the proposed Stock Management System is technically, economically, operationally, and schedule-wise feasible.


### 1.5.1 Technical Feasibility

The proposed system can be developed using modern technologies such as:Frontend: React.js or Next.jsBackend: Node.js and Express.jsDatabase: PostgreSQL or MySQLAPI: REST APIVersion Control: Git and GitHubThe development tools and technologies are widely available and suitable for the implementation of the project.


### 1.5.2 Economic Feasibility

The project is economically feasible. The estimated development cost is 12,000 ETB (as detailed in the cost schedule). This cost is relatively low compared to the long-term benefits. The system is expected to reduce paperwork, minimize inventory losses caused by errors and poor tracking, decrease time spent on stock taking and report generation, and improve overall operational efficiency. The cost of continuing with the current manual system (including losses from stock shortages, overstocking, and delayed decision-making) is significantly higher than the investment required for the computerized system.


### 1.5.3 Operational Feasibility

The system is operationally feasible. It is designed to be user-friendly so that storekeepers, stock clerks, the Property Administration Officer, accountants, and department heads can use it with minimal training. The system supports the existing organizational workflow rather than completely changing it. Management support and the clear need to solve current inventory problems increase the likelihood of successful adoption. Resistance to change will be managed through training and gradual transition from the paper-based system.


### 1.5.4 Schedule Feasibility

The project is schedule-feasible. According to the planned task schedule, the total development period is approximately 13 weeks (requirement gathering – 1 week, analysis – 1 week, design – 2 weeks, database design – 1 week, implementation – 4 weeks, testing – 2 weeks, deployment – 1 week, and documentation – 1 week). This timeline is realistic given the scope of the system and the available team resources. Potential delays (such as late feedback from stakeholders) will be managed through regular communication and prioritization of core features.


### 1.6.1 Scope

The system will provide the following functionalities:

- User management
- Supplier management
- Inventory classification
- Stock receiving
- Stock issuing
- Stock transfer
- Inventory tracking
- Stock valuation using FIFO
- Bin card management
- Stock record management
- Stock taking and reconciliation
- Report generation
- Audit logging


### 1.6.2 Limitation

The first version of the system will not support:

- Mobile application integration
- AI-based demand forecasting
- Barcode and RFID integration
- Offline synchronization
- Integration with banking systems
- Multi-organization support


## 1.7 Significance of the Project

The Stock Management System provides several benefits to organizations.

The significance of the project includes:

- Reducing paperwork and manual calculations.
- Improving inventory accuracy.
- Increasing operational efficiency.
- Improving transparency and accountability.
- Supporting better decision-making.
- Providing real-time inventory information.
- Reducing inventory losses.
- Speeding up report generation.
- Simplifying stock taking procedures.
- Improving inventory control.


## 1.8 Methodology

The project will follow the Agile software development methodology.

The development process includes:

- Requirement gathering.
- System analysis.
- System design.
- System implementation.
- System testing.
- Deployment.
- Maintenance.


### 1.8.1 Requirement Gathering

Requirements were collected through interviews with key stakeholders, direct observation of existing inventory processes, review of inventory management manuals, and analysis of paper-based records such as bin cards, stock record cards, and requisition forms.Interviews were conducted with the Property Administration Officer (PAO), storekeepers, stock clerks, department heads, and the accountant. The interviews focused on current stock receiving and issuing procedures, problems faced with the manual system, reporting needs, user roles and responsibilities, and existing business rules.

From these activities, the following key information was obtained:

- Detailed description of the existing manual workflow
- Major operational problems (tracking difficulty, human errors, delayed reports, stock shortages and overstocking)
- User roles and access needs
- Required inventory reports and valuation method (FIFO)
- Business rules currently applied in the organization


### 1.8.2 System Analysis and Design

System requirements, system architecture, database design, and user interfaces will be analyzed and designed.


### 1.8.3 Development Tools

| Category | Tool |
| --- | --- |
| Frontend | React.js / Next.js |
| Backend | Node.js / Express.js |
| Database | PostgreSQL / MySQL |
| API Testing | Postman |
| Design Tool | Figma |
| IDE | Visual Studio Code |
| Version Control | Git and GitHub |
| Documentation | Microsoft Word |


## 1.9 Testing Procedure



The following testing methods will be used to verify the system:

- Unit testingIntegration testingSystem testingUser acceptance testingPerformance testingSecurity testing

The testing process ensures that the system satisfies all functional and non-functional requirements.


## 1.10 Team Composition

| Role | Responsibility |
| --- | --- |
| Project Manager | Manages the project |
| System Analyst | Analyzes requirements |
| UI/UX Designer | Designs interfaces |
| Frontend Developer | Develops the user interface |
| Backend Developer | Develops APIs and business logic |
| Database Administrator | Designs and manages the database |
| Tester | Tests the system |
| Documentation Specialist | Prepares project documents |


## 1.11 Task and Schedule

| Task | Duration |
| --- | --- |
| Requirement gathering | 1 week |
| System analysis | 1 week |
| System design | 2 weeks |
| Database design | 1 week |
| Implementation | 4 weeks |
| Testing | 2 weeks |
| Deployment | 1 week |
| Documentation | 1 week |


## 1.12 Cost Schedule

| Item | Estimated Cost (ETB) |
| --- | --- |
| Internet and communication | 2,000 |
| Transportation | 1,500 |
| Documentation and printing | 2,500 |
| Software tools | 1,000 |
| Hosting and deployment | 3,000 |
| Miscellaneous expenses | 2,000 |
| **Total** | **12,000** |


## 2.1 Description of the Existing System

The existing inventory management system is primarily based on manual procedures and paper-based documentation. Different departments request materials from the store by filling out requisition forms, while storekeepers record stock movements using bin cards, stock record cards, and other physical documents.The system involves several activities, including stock receiving, inspection, storage, issuing, dispatching, stock taking, and report preparation. Most of these activities are performed manually, which requires significant time and effort.When goods arrive at the warehouse, they are inspected and recorded in stock registers. Likewise, when a department requests materials, the request must be approved by the responsible authority before the items are issued. All transactions are documented using paper forms.Although the current system provides basic inventory management functions, it lacks automation, real-time monitoring, and efficient reporting mechanisms.


## 2.2 Major Functions of the Existing System



The existing system performs the following major functions:

- Registration of inventory items.
- Classification and coding of stock items.
- Receiving and inspection of goods.
- Storage and arrangement of inventory.
- Issuing materials to departments.
- Dispatching materials outside the organization.
- Recording stock movement using bin cards.
- Maintaining stock record cards.
- Conducting stock taking and reconciliation.
- Preparing inventory reports.
- Managing damaged and obsolete items.
- Monitoring minimum and maximum stock levels.


## 2.3 Users of the Current System

The current inventory system involves different actors who perform different responsibilities.Property Administration Officer (PAO)The Property Administration Officer supervises all inventory activities and approves stock requests, stock transfers, and inventory reports.StorekeeperThe storekeeper receives, stores, issues, and safeguards inventory items. The storekeeper also updates bin cards and maintains warehouse records.Stock ClerkThe stock clerk maintains stock records, updates inventory transactions, and prepares reports.Department HeadDepartment heads approve requests from their departments and ensure that materials are used appropriately.AccountantThe accountant records the financial value of inventory and prepares financial reports.Security OfficerThe security officer controls the movement of materials entering or leaving the organization's premises.


## 2.4 Drawbacks of the Current System

Although the current system supports inventory management activities, it has several limitations.

The major drawbacks include:

- Heavy dependence on paper documents.
- Time-consuming inventory operations.
- Difficulty in tracking stock movements.
- High possibility of human error.
- Duplicate or missing records.
- Delayed report generation.
- Difficulty in conducting stock reconciliation.
- Inaccurate inventory valuation.
- Limited access to inventory information.
- Lack of data security.
- Poor monitoring of damaged and obsolete items.
- Difficulty in monitoring reorder levels.
- Poor communication between departments.
- Lack of real-time updates.

Because of these limitations, organizations face operational inefficiencies and inventory management challenges.


## 2.5 Business Rules

Business rules define the policies and constraints that govern inventory operations.

The following business rules apply to the existing system:

- Every inventory item must have a unique item code.
- All received goods must be inspected before being stored.
- Only authorized personnel can approve inventory transactions.
- Inventory cannot be issued without an approved requisition form.
- Every inventory transaction must be recorded.
- Every stock item must have a corresponding bin card and stock record card.
- Stock records must be updated whenever goods are received or issued.
- Inventory valuation must follow the FIFO (First In, First Out) principle.
- Physical stock taking must be conducted at least once every fiscal year.
- Damaged and obsolete items must be identified and reported.
- Materials leaving the organization must be accompanied by an authorized gate pass.
- Stock discrepancies must be investigated and corrected.
- Users are responsible for materials issued to their departments.
- Reorder levels and safety stock must be maintained to avoid stock shortages.
- Only authorized users can access inventory information.


## 3.1 Functional Requirements

Functional requirements describe the services and operations that the proposed Stock Management System must perform.

The system shall provide the following functionalities:

**User Management:**
- Register users.
- Update user information.
- Delete users.
- Assign user roles and permissions.
- Manage user accounts.

**Authentication and Authorization:**
- User login and logout.
- Password management.
- Role-based access control.
- Session management.

**Inventory Management:**
- Add new inventory items.
- Update inventory information.
- Delete inventory records.
- Categorize inventory items.
- Generate unique item codes.

**Supplier Management:**
- Register suppliers.
- Update supplier information.
- Delete supplier records.
- Search suppliers.

**Stock Receiving Management:**
- Record received goods.
- Verify and inspect received items.
- Update stock quantity automatically.
- Generate goods receiving notes.

**Stock Issuing Management:**
- Record issued items.
- Validate requests.
- Generate issue reports.
- Update stock levels.

**Inventory Tracking:**
- Monitor stock movement.
- View stock history.
- Check stock availability.

**Stock Control:**
- Define minimum stock level.
- Define maximum stock level.
- Monitor reorder levels.
- Manage safety stock.

**Stock Taking and Reconciliation:**
- Conduct physical stock counting.
- Compare physical stock with system records.
- Generate reconciliation reports.

**Report Management:**
- Generate inventory reports.
- Generate stock movement reports.
- Generate supplier reports.
- Generate audit reports.

**Audit Management:**
- Record all user activities.
- Maintain transaction history.
- Monitor system changes.


## 3.2 Non-Functional Requirements

Non-functional requirements define the quality attributes of the system.

**Performance:**
- The system shall respond within three seconds.
- The system shall support multiple users simultaneously.
- The system shall process inventory transactions efficiently.

**Security:**
- All users must authenticate before accessing the system.
- Passwords must be encrypted.
- Unauthorized users shall not access restricted resources.
- The system shall maintain audit logs.

**Reliability:**
- The system shall operate continuously with minimum downtime.
- Data consistency must be maintained.

**Availability:**
- The system shall be available twenty-four hours a day.
- Backup and recovery mechanisms shall be provided.

**Usability:**
- The system interface shall be simple and user-friendly.
- The system shall support easy navigation.

**Scalability:**
- The system shall support future expansion.
- Additional modules can be integrated.

**Maintainability:**
- The source code shall be modular.
- The system shall support future updates and maintenance.


## 3.3 System Model

The system model describes how different components interact to achieve the required functionality.The Stock Management System consists of the following components:User Interface LayerBusiness Logic LayerDatabase LayerAuthentication ModuleInventory ModuleReporting ModuleNotification Module


### 3.3.1 Scenario

The following scenario illustrates how the proposed system works.

1. The user logs into the system.
2. The system verifies the user's credentials.
3. The user selects an operation.
4. The system processes the request.
5. The database is updated.
6. The system generates confirmation.
7. Reports are generated when required.

**Example Scenario — Stock Receiving:**

- The storekeeper receives goods.
- The storekeeper logs into the system.
- The storekeeper enters the item details.
- The system verifies the information.
- The system updates the inventory.
- The system generates a receiving note.


## 3.4 Use Case Model

The use case model describes the interactions between users and the system.


### 3.4.1 Actor Identification

The following actors interact with the system:

- Administrator
- Property Administration Officer (PAO)
- Storekeeper
- Stock Clerk
- Accountant
- Department Head
- Supplier
- Security Officer


### 3.4.2 Use Case Identification

The major use cases are:

- Login
- Logout
- Manage users
- Manage suppliers
- Register inventory items
- Receive stock
- Issue stock
- Transfer stock
- Track inventory
- Perform stock taking
- Generate reports
- Manage damaged items
- Approve requests
- View audit logs


### 3.4.3 Use Case Diagram and Description

**Use Case: Login**

- **Actor:** User
- **Precondition:** User account exists.
- **Main flow:**
1. User enters username and password.
2. System validates credentials.
3. System grants access.

- **Postcondition:** nActor: UserPrecondition: User account exists.Main Flow:User enters username and password.System validates credentials.System grants access.Postcondition:User enters the system successfully.

**Use Case: Receive Stock**

- **Actor:** Storekeeper
- **Precondition:** Supplier delivers goods.
- **Main flow:**
1. Storekeeper enters item information.
2. System validates the information.
3. Inventory quantity is updated.
4. Goods receiving note is generated.

- **Postcondition:** ive StockActor: StorekeeperPrecondition: Supplier delivers goods.Main Flow:Storekeeper enters item information.System validates the information.Inventory quantity is updated.Goods receiving note is generated.Postcondition:Stock records are updated.

**Use Case: Issue Stock**

- **Actor:** Storekeeper
- **Precondition:** Approved requisition exists.
- **Main flow:**
1. User submits a request.
2. Storekeeper verifies the request.
3. System updates inventory.
4. Issue report is generated.

- **Postcondition:** e StockActor: StorekeeperPrecondition: Approved requisition exists.Main Flow:User submits a request.Storekeeper verifies the request.System updates inventory.Issue report is generated.Postcondition:Stock quantity decreases.


## 3.5 Object Model

The object model describes the structure of the system.


### 3.5.1 Data Dictionary

| Entity | Description |
| --- | --- |
| User | Stores user information |
| Role | Stores user roles |
| Supplier | Stores supplier details |
| Category | Stores item categories |
| Inventory | Stores inventory data |
| StockTransaction | Stores inventory movement |
| Warehouse | Stores warehouse information |
| Report | Stores reports |
| AuditLog | Stores system activities |


### 3.5.2 Class Diagram

The class diagram represents the classes, attributes, methods, and relationships of the system.

Main classes:

- User
- Role
- Supplier
- Inventory
- Category
- Warehouse
- StockTransaction
- Report
- AuditLog


## 3.6 Dynamic Model

The dynamic model shows how the system behaves over time.


### 3.6.1 Sequence Diagram

As the name indicates, the sequence diagram shows the sequence of activities and how processes interact with one another.

**Login Sequence:**
1. User sends login request.
2. System validates credentials.
3. Database verifies information.
4. System grants access.

**Stock Receiving Sequence:**
1. Storekeeper submits stock information.
2. System validates data.
3. Database updates records.
4. System confirms success.


### 3.6.2 Activity Diagram

An activity diagram is used to understand the workflow performed by the system.

Activities include:

- Login
- Receive stock
- Issue stock
- Update inventory
- Generate report
- Logout


### 3.6.3 State Chart Diagram

The state chart diagram describes the states of an object and the transitions between those states.Inventory StatesCreatedAvailableReservedIssuedDamagedObsoleteDisposed


## 4.1 Overview

System design is the process of transforming the requirements gathered during the analysis phase into a complete blueprint for the implementation of the Stock Management System. It defines the architecture, components, interfaces, database structure, and interactions among different modules of the system.The proposed Stock Management System follows a three-tier architecture consisting of the presentation layer, business logic layer, and database layer. The system is designed to ensure security, scalability, maintainability, and reliability.The design phase provides detailed specifications for developers and ensures that all functional and non-functional requirements are satisfied.


## 4.2 Purpose of the System Design

The purpose of the system design is to provide a detailed structure for implementing the Stock Management System.

The objectives of system design are:

- To transform system requirements into technical specifications.
- To define the architecture of the system.
- To identify system components and their interactions.
- To design the database structure.
- To improve system performance and security.
- To simplify future maintenance and upgrades.
- To ensure data consistency and integrity.
- To support scalability and flexibility.


## 4.3 Design Goals



The proposed system is designed based on the following goals:

- **Security:** The system must protect user information and inventory data through authentication, authorization, and encryption mechanisms.
- **Reliability:** The system must provide accurate and dependable inventory information.
- **Scalability:** The system should support future expansion and additional functionalities.
- **Maintainability:** The system architecture should support future updates and modifications.
- **Availability:** The system should be available whenever users need access.
- **Performance:** The system should process inventory operations efficiently.
- **Usability:** The system interface should be simple and user-friendly.


## 4.4 Proposed System Architecture

The proposed Stock Management System follows a three-tier architecture.The architecture consists of:Presentation layer (Frontend)Application layer (Backend)Data layer (Database)


### 4.4.1 System Process

The system process describes how users interact with the Stock Management System.

The process consists of the following steps:

1. User logs into the system.
2. System verifies user credentials.
3. User selects a function.
4. System processes the request.
5. Database stores or retrieves information.
6. System generates a response.
7. User receives feedback.

**Stock Receiving Process:**
1. Storekeeper receives goods.
2. Goods are inspected.
3. Item information is entered.
4. Database is updated.
5. Stock quantity increases.
6. Goods receiving note is generated.

**Stock Issuing Process:**
1. Department submits a request.
2. Request is approved.
3. Storekeeper issues items.
4. Inventory is updated.
5. Issue report is generated.


### 4.4.2 Subsystem Decomposition and Description

The system is divided into several subsystems.

**Authentication Subsystem** — responsible for:
- Login
- Logout
- Password management
- Session management

**User Management Subsystem** — responsible for:
- User registration
- User update
- Role assignment
- Permission management

**Inventory Management Subsystem** — responsible for:
- Inventory registration
- Inventory update
- Inventory deletion
- Inventory tracking

**Supplier Management Subsystem** — responsible for:
- Supplier registration
- Supplier update
- Supplier search

**Stock Receiving Subsystem** — responsible for:
- Goods receiving
- Inspection
- Quantity update

**Stock Issuing Subsystem** — responsible for:
- Stock issuing
- Stock transfer
- Inventory reduction

**Reporting Subsystem** — responsible for:
- Report generation
- Analytics
- Exporting reports

**Audit Subsystem** — responsible for:
- Activity tracking
- Audit logs
- Security monitoring


### 4.4.3 Hardware–Software Mapping

Hardware–software mapping defines the relationship between software components and hardware resources.

**Hardware Requirements**

| Component | Specification |
| --- | --- |
| Processor | Intel Core i5 or above |
| RAM | 8 GB minimum |
| Storage | 256 GB SSD |
| Network | Ethernet or Wi-Fi |
| Display | 1366 × 768 or higher |

**Software Requirements**

| Component | Technology |
| --- | --- |
| Operating System | Windows / Linux |
| Frontend | React.js / Next.js |
| Backend | Node.js / Express.js |
| Database | PostgreSQL / MySQL |
| API Testing | Postman |
| IDE | Visual Studio Code |
| Version Control | Git and GitHub |


### 4.4.4 Persistence Data Management

Persistence data management describes how system objects are mapped into database tables.

The main database entities are: User, Role, Inventory, Category, Supplier, Warehouse, StockTransaction, Report, AuditLog.

**Database Mapping**

| Object/Class | Database Table |
| --- | --- |
| User | users |
| Role | roles |
| Inventory | inventories |
| Category | categories |
| Supplier | suppliers |
| Warehouse | warehouses |
| StockTransaction | stock_transactions |
| Report | reports |
| AuditLog | audit_logs |

The system will use foreign keys and constraints to maintain data integrity.


### 4.4.5 Component Diagram

The component diagram illustrates the software modules and their relationships.

Main components include:

- User Interface Component
- Authentication Component
- User Management Component
- Inventory Component
- Supplier Component
- Reporting Component
- Database Component


### 4.4.6 Deployment Diagram

The deployment diagram describes how the application is deployed.

The deployment environment includes:

- Client browser
- Web server
- Application server
- Database server

**Deployment Flow:**
1. User accesses the system through a web browser.
2. Requests are sent to the web server.
3. The application server processes the request.
4. The database server stores and retrieves data.
5. Results are returned to the user.


### 4.4.7 Database Design

The database design defines entities, relationships, and constraints.

Main tables: users, roles, suppliers, warehouses, categories, inventories, stock_transactions, reports, audit_logs.

Relationships:

- One role can have many users.
- One supplier can supply many products.
- One category can contain many items.
- One warehouse can store many products.
- One inventory item can have many transactions.


### 4.4.8 Access Control

The system uses Role-Based Access Control (RBAC).

| Role | Access |
| --- | --- |
| Administrator | Full access to the system |
| Property Administration Officer | Approves requests; monitors inventory activities |
| Storekeeper | Receives and issues stock; updates inventory records |
| Accountant | Views financial reports; manages inventory valuation |
| Department Head | Approves requisitions |
| Security Officer | Monitors goods entering and leaving the organization |

> Note: the SRS section 4.4.8 does not enumerate the Stock Clerk role, although Stock Clerk is listed as a user role elsewhere in the SRS (section 2.3).


### 4.4.9 User Interface

The user interface provides interaction between users and the system.

**Login Page** — features:
- Username field
- Password field
- Login button

**Dashboard** — features:
- Total inventory count
- Low-stock alerts
- Recent transactions
- Reports summary

**Inventory Management Page** — features:
- Add inventory
- Update inventory
- Delete inventory
- Search inventory

**Stock Receiving Page** — features:
- Register goods
- Verify items
- Generate receiving notes

**Stock Issuing Page** — features:
- Issue items
- Approve requests
- Generate issue reports

**Reports Page** — features:
- Generate reports
- Export reports
- Print reports


## References

- Ministry of Finance and Economic Development (MoFED). *Stock Management Manual*, Addis Ababa, Ethiopia, 2010.
- IEEE Computer Society. IEEE Recommended Practice for Software Requirements Specifications (IEEE 830-1998).
- Ian Sommerville, *Software Engineering*, 10th Edition, Pearson Education, 2015.
- Roger S. Pressman, *Software Engineering: A Practitioner's Approach*, 8th Edition, McGraw-Hill, 2014.
- Abraham Silberschatz, Henry F. Korth, and S. Sudarshan, *Database System Concepts*, 7th Edition.
- Official documentation for React.js, Node.js, Express.js, and PostgreSQL.


## Appendix A: Glossary

| Term | Meaning |
| --- | --- |
| FIFO | First In, First Out |
| SRS | Software Requirements Specification |
| RBAC | Role-Based Access Control |
| PAO | Property Administration Officer |
| API | Application Programming Interface |
| DBMS | Database Management System |


## Appendix B: Sample Forms

Sample requisition form.

Sample goods receiving note.

Sample issue voucher.

Sample stock report.


## Appendix C: Abbreviations and Acronyms

| Abbreviation | Meaning |
| --- | --- |
| SMS | Stock Management System |
| ERD | Entity Relationship Diagram |
| UML | Unified Modeling Language |
| UI | User Interface |
| SQL | Structured Query Language |
| CRUD | Create, Read, Update, Delete |
