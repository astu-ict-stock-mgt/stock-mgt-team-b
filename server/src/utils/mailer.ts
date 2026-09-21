import nodemailer from 'nodemailer';

// If in test environment, use JSON transport to avoid real network requests
const isTest = process.env.NODE_ENV === 'test';

const transporter = nodemailer.createTransport(
  isTest
    ? { jsonTransport: true }
    : {
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525', 10),
        auth: {
          user: process.env.SMTP_USER || 'dummy_user',
          pass: process.env.SMTP_PASS || 'dummy_pass',
        },
      }
);

const defaultFrom = process.env.FROM_EMAIL || '"Stock Management System" <no-reply@stockmgt.com>';
const defaultFrom = process.env.FROM_EMAIL || '"ASTU Stock Management System -- ASMS" <no-reply@stockmgt.com>';

export const sendRequisitionStatusEmail = async (
  to: string,
  reqNumber: string,
  status: 'APPROVED' | 'REJECTED' | 'ISSUED',
  reason?: string
) => {
  try {
    const subjectMap = {
      APPROVED: `Requisition ${reqNumber} Approved`,
      REJECTED: `Requisition ${reqNumber} Rejected`,
      ISSUED: `Requisition ${reqNumber} Issued`,
    };

    const subject = subjectMap[status];

    let html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Requisition Update</h2>
        <p>Your requisition <strong>${reqNumber}</strong> has been <strong>${status}</strong>.</p>
    `;

    if (reason) {
      html += `<p><strong>Reason/Note:</strong> ${reason}</p>`;
    }

    html += `<p>Please log in to the Stock Management System to view details.</p></div>`;
    html += `<p>Please log in to ASTU Stock Management System -- ASMS to view details.</p></div>`;

    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
    
    if (!isTest) {
      console.log(`[Mailer] Status email sent to ${to} for req ${reqNumber}`);
    }
  } catch (err) {
    if (!isTest) {
      console.error(`[Mailer] Failed to send status email to ${to}:`, err);
    }
  }
};

export const sendLowStockAlertEmail = async (
  to: string | string[],
  itemCode: string,
  itemName: string,
  currentStock: number,
  minLevel: number
) => {
  try {
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #d97706;">Low Stock Alert</h2>
        <p>The following item has dropped below its minimum threshold.</p>
        <ul>
          <li><strong>Item:</strong> ${itemName} (${itemCode})</li>
          <li><strong>Current Stock:</strong> ${currentStock}</li>
          <li><strong>Minimum Level:</strong> ${minLevel}</li>
        </ul>
        <p>Please initiate a purchase requisition or supplier order to replenish stock.</p>
      </div>
    `;

    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject: `Low Stock Alert: ${itemCode}`,
      html,
    });
    
    if (!isTest) {
      console.log(`[Mailer] Low stock alert sent for ${itemCode} to ${Array.isArray(to) ? to.join(', ') : to}`);
    }
  } catch (err) {
    if (!isTest) {
      console.error(`[Mailer] Failed to send low stock alert for ${itemCode}:`, err);
    }
  }
};
