# Stock Management Backend

Node.js / Express server for the Stock Management System.

## Setup
1. `npm install`
2. `cp .env.example .env`
3. `npx prisma db push`
4. Set the bootstrap administrator variables and run `npm run admin:create`:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "change-this-password"
$env:BOOTSTRAP_ADMIN_FIRST_NAME = "System"
$env:BOOTSTRAP_ADMIN_LAST_NAME = "Administrator"
npm run admin:create
```

5. `npm run dev`

Use the bootstrap email and password on the client login page. Once signed in, an administrator can create the remaining accounts from User Management.
