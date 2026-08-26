
### 🏢 Supplier Directory Module (Issue #11)

#### 1. Create New Supplier Profile
- **URL Path**: `/api/suppliers`
- **HTTP Method**: `POST`
- **Request Headers**: `Content-Type: application/json`
- **JSON Request Body Parameters Payload Structure**:
  ```json
  {
    "name": "Global Logistical Materials Ltd",
    "contactName": "Abebe Kebede",
    "email": "contact@globallogistics.com",
    "phone": "+251911223344",
    "address": "Bole Road, Addis Ababa, Ethiopia"
  }
  ```
- **Successful Status Code Response**: `201 Created`

#### 2. Retrieve Full Supplier Catalog List
- **URL Path**: `/api/suppliers`
- **HTTP Method**: `GET`
- **Successful Status Code Response**: `200 OK`
