const fs = require('fs');
const path = require('path');

// Fix mailer.ts
const mailerPath = path.join(__dirname, 'server', 'src', 'utils', 'mailer.ts');
let mailerCode = fs.readFileSync(mailerPath, 'utf8');
mailerCode = mailerCode.replace('{ jsonTransport: true }', '{ jsonTransport: true } as any');
fs.writeFileSync(mailerPath, mailerCode);
console.log('Fixed mailer.ts');

// Fix service.ts
const servicePath = path.join(__dirname, 'server', 'src', 'modules', 'stock-issuing', 'service.ts');
let serviceCode = fs.readFileSync(servicePath, 'utf8');
serviceCode = serviceCode.replace(
  "sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'REJECTED', reason)",
  "sendRequisitionStatusEmail(updated.requester.email, updated.requisitionNumber, 'REJECTED', updated.rejectionReason || 'No reason provided')"
);
fs.writeFileSync(servicePath, serviceCode);
console.log('Fixed service.ts');
