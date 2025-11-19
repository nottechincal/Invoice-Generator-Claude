import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  companyName: string;
  pdfBuffer?: Buffer;
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  customerName,
  amount,
  dueDate,
  companyName,
  pdfBuffer,
}: SendInvoiceEmailParams) {
  try {
    const attachments = pdfBuffer
      ? [
          {
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ]
      : [];

    const { data, error } = await resend.emails.send({
      from: `${companyName} <invoices@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${companyName}`,
      html: generateInvoiceEmailHTML({
        customerName,
        invoiceNumber,
        amount,
        dueDate,
        companyName,
      }),
      attachments,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

interface EmailTemplateParams {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  companyName: string;
}

function generateInvoiceEmailHTML({
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  companyName,
}: EmailTemplateParams): string {
  const formattedAmount = `$${Number(amount).toFixed(2)}`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${companyName}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                New Invoice
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937; line-height: 1.6;">
                Hello ${customerName},
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; color: #1f2937; line-height: 1.6;">
                You have received a new invoice from <strong>${companyName}</strong>. Please find the details below:
              </p>

              <!-- Invoice Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0;">
                          Invoice Number:
                        </td>
                        <td align="right" style="font-size: 16px; color: #1f2937; font-weight: 600; padding: 8px 0;">
                          ${invoiceNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          Amount Due:
                        </td>
                        <td align="right" style="font-size: 18px; color: #667eea; font-weight: bold; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          ${formattedAmount}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          Due Date:
                        </td>
                        <td align="right" style="font-size: 16px; color: #1f2937; font-weight: 600; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          ${formattedDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                The invoice is attached to this email as a PDF. Please review it and arrange payment before the due date to avoid any late fees.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="#" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
                      View Invoice Online
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                If you have any questions about this invoice, please don't hesitate to contact us.
              </p>

              <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                Best regards,<br>
                <strong>${companyName}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                This is an automated email from ${companyName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Please do not reply directly to this email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface SendPaymentReminderParams {
  to: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  companyName: string;
  daysOverdue?: number;
}

export async function sendPaymentReminderEmail({
  to,
  invoiceNumber,
  customerName,
  amount,
  dueDate,
  companyName,
  daysOverdue,
}: SendPaymentReminderParams) {
  try {
    const isOverdue = daysOverdue && daysOverdue > 0;
    const subject = isOverdue
      ? `Reminder: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`
      : `Payment Reminder: Invoice ${invoiceNumber}`;

    const { data, error } = await resend.emails.send({
      from: `${companyName} <invoices@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
      to: [to],
      subject,
      html: generateReminderEmailHTML({
        customerName,
        invoiceNumber,
        amount,
        dueDate,
        companyName,
        isOverdue,
        daysOverdue,
      }),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Reminder email sending error:', error);
    throw error;
  }
}

interface ReminderTemplateParams {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  companyName: string;
  isOverdue: boolean;
  daysOverdue?: number;
}

function generateReminderEmailHTML({
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  companyName,
  isOverdue,
  daysOverdue,
}: ReminderTemplateParams): string {
  const formattedAmount = `$${Number(amount).toFixed(2)}`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const urgencyColor = isOverdue ? '#dc2626' : '#f59e0b';
  const urgencyBg = isOverdue ? '#fee2e2' : '#fef3c7';
  const urgencyBorder = isOverdue ? '#fca5a5' : '#fde68a';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${urgencyColor}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${isOverdue ? '⚠️ Payment Overdue' : '🔔 Payment Reminder'}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937; line-height: 1.6;">
                Hello ${customerName},
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; color: #1f2937; line-height: 1.6;">
                ${
                  isOverdue
                    ? `This is a friendly reminder that Invoice ${invoiceNumber} is now <strong>${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue</strong>. We kindly request your immediate attention to this matter.`
                    : `This is a friendly reminder that payment for Invoice ${invoiceNumber} is due soon.`
                }
              </p>

              <!-- Alert Box -->
              ${
                isOverdue
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${urgencyBg}; border-radius: 8px; border: 1px solid ${urgencyBorder}; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: ${urgencyColor}; font-weight: 600;">
                      ⚠️ This invoice is ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Please arrange payment immediately to avoid late fees.
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Invoice Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0;">
                          Invoice Number:
                        </td>
                        <td align="right" style="font-size: 16px; color: #1f2937; font-weight: 600; padding: 8px 0;">
                          ${invoiceNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          Amount Due:
                        </td>
                        <td align="right" style="font-size: 18px; color: ${urgencyColor}; font-weight: bold; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          ${formattedAmount}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          Due Date:
                        </td>
                        <td align="right" style="font-size: 16px; color: #1f2937; font-weight: 600; padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          ${formattedDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="#" style="display: inline-block; padding: 14px 32px; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Make Payment Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                If you have already made this payment, please disregard this reminder. If you have any questions or need to discuss payment arrangements, please contact us.
              </p>

              <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                Thank you for your prompt attention,<br>
                <strong>${companyName}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                This is an automated reminder from ${companyName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Please do not reply directly to this email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
