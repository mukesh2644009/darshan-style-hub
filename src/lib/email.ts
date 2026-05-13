// Email service - supports both Resend and Gmail SMTP
// Priority: Resend (custom domain) > Gmail SMTP > Skip

import nodemailer from 'nodemailer';
import { PUBLIC_SITE_URL } from '@/lib/site-url';

// Shop details
const SHOP_NAME = 'Darshan Style Hub™';
/** Links in emails — same canonical rules as WhatsApp (no *.vercel.app). */
const SHOP_WEBSITE = PUBLIC_SITE_URL;
const ADMIN_EMAILS = [process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub.business@gmail.com'];

// Check which email service is available
// Resend is prioritized for custom domain emails (info@darshanstylehub.com)
// Set FORCE_GMAIL=true to use Gmail while Resend domain is being verified
function getEmailService(): 'gmail' | 'resend' | null {
  // Temporary: Use Gmail while Resend domain verification is pending
  if (process.env.FORCE_GMAIL === 'true' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return 'gmail';
  }
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return 'gmail';
  }
  return null;
}

// Create Gmail transporter
function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

interface WelcomeEmailProps {
  to: string;
  customerName: string;
}

export async function sendWelcomeEmail({ to, customerName }: WelcomeEmailProps) {
  const service = getEmailService();
  
  if (!service) {
    console.log('No email service configured, skipping welcome email');
    return { success: false, error: 'Email not configured' };
  }

  const htmlContent = getWelcomeEmailTemplate(customerName);

  // Try Resend first (for custom domain: info@darshanstylehub.com)
  if (service === 'resend') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: `${SHOP_NAME} <info@darshanstylehub.com>`,
        to: [to],
        subject: `Welcome to ${SHOP_NAME}! 🎉`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend welcome email error, falling through to Gmail:', error);
      } else {
        console.log('Welcome email sent via Resend:', data);
        return { success: true, data, via: 'resend' };
      }
    } catch (resendError) {
      console.error('Resend failed, trying Gmail...', resendError);
    }
  }

  // Try Gmail as fallback (always attempted when Resend fails)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = createGmailTransporter();
      const info = await transporter.sendMail({
        from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: `Welcome to ${SHOP_NAME}! 🎉`,
        html: htmlContent,
      });
      console.log('Welcome email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId, via: 'gmail' };
    } catch (gmailError) {
      console.error('Gmail failed:', gmailError);
      return { success: false, error: gmailError };
    }
  }

  return { success: false, error: 'All email services failed' };
}

// Password reset email
interface PasswordResetEmailProps {
  to: string;
  customerName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, customerName, resetUrl }: PasswordResetEmailProps) {
  const service = getEmailService();
  
  if (!service) {
    console.log('No email service configured, skipping password reset email');
    return { success: false, error: 'Email not configured' };
  }

  const htmlContent = getPasswordResetEmailTemplate(customerName, resetUrl);

  if (service === 'resend') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: `${SHOP_NAME} <info@darshanstylehub.com>`,
        to: [to],
        subject: `Reset Your Password - ${SHOP_NAME}`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend password reset error, falling through to Gmail:', error);
      } else {
        console.log('Password reset email sent via Resend:', data);
        return { success: true, data, via: 'resend' };
      }
    } catch (resendError) {
      console.error('Resend failed, trying Gmail...', resendError);
    }
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = createGmailTransporter();
      const info = await transporter.sendMail({
        from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: `Reset Your Password - ${SHOP_NAME}`,
        html: htmlContent,
      });
      console.log('Password reset email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId, via: 'gmail' };
    } catch (gmailError) {
      console.error('Gmail failed:', gmailError);
      return { success: false, error: gmailError };
    }
  }

  return { success: false, error: 'All email services failed' };
}

function getPasswordResetEmailTemplate(customerName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f4f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9f1239 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
              <p style="font-size: 48px; margin: 0 0 10px;">🔐</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                Hi ${customerName},
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">
                We received a request to reset your password for your ${SHOP_NAME} account. Click the button below to create a new password:
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #9f1239 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 15px 20px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 10px 0 0; color: #9f1239; font-size: 12px; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
                Need help? Contact us anytime!
              </p>
              <p style="color: #9f1239; margin: 0 0 20px; font-size: 16px; font-weight: 600;">
                📞 +91 90190 76335
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                ${SHOP_NAME} | Sitapura, Jaipur, Rajasthan 302022
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getWelcomeEmailTemplate(customerName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${SHOP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f4f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9f1239 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                ${SHOP_NAME}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Sitapura, Jaipur
              </p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                Welcome, ${customerName}! 🎉
              </h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                Thank you for joining the ${SHOP_NAME} family! We're thrilled to have you with us.
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">
                Get ready to explore our exquisite collection of traditional Indian wear - elegant suits and trendy co ord sets.
              </p>
              
              <!-- Shop Categories -->
              <p style="color: #1f2937; font-weight: 600; margin: 0 0 15px; font-size: 16px;">
                Explore Our Collections:
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px; text-align: center;">
                    <a href="${SHOP_WEBSITE}/products?category=Suits" style="text-decoration: none;">
                      <div style="background-color: #ede9fe; padding: 20px; border-radius: 12px;">
                        <p style="font-size: 32px; margin: 0 0 5px;">👗</p>
                        <p style="color: #7c3aed; font-weight: 600; margin: 0;">Suits</p>
                      </div>
                    </a>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <a href="${SHOP_WEBSITE}/products?category=Co Ord Sets" style="text-decoration: none;">
                      <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px;">
                        <p style="font-size: 32px; margin: 0 0 5px;">👚</p>
                        <p style="color: #d97706; font-weight: 600; margin: 0;">Co Ord Sets</p>
                      </div>
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${SHOP_WEBSITE}/products" style="display: inline-block; background: linear-gradient(135deg, #9f1239 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Start Shopping Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
                Need help? Contact us anytime!
              </p>
              <p style="color: #9f1239; margin: 0 0 20px; font-size: 16px; font-weight: 600;">
                📞 +91 90190 76335
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                ${SHOP_NAME} | Sitapura, Jaipur, Rajasthan 302022
              </p>
              <p style="color: #9ca3af; margin: 10px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} ${SHOP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// New signup notification to owner
interface SignupNotificationProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}

export async function sendNewSignupNotification({ customerName, customerEmail, customerPhone }: SignupNotificationProps) {
  const service = getEmailService();
  
  if (!service) {
    console.log('No email service configured, skipping signup notification');
    return { success: false, error: 'Email not configured' };
  }

  const ownerEmails = ADMIN_EMAILS;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Customer Signup</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
              <p style="font-size: 40px; margin: 0 0 8px;">🎉</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">New Customer Signup!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #4b5563; margin: 0 0 20px; font-size: 15px;">A new customer just signed up on your store:</p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; font-size: 14px;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Email</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; font-size: 14px;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Phone</td>
                  <td style="padding: 12px 16px; color: #1f2937; font-weight: 600; font-size: 14px;">${customerPhone || 'Not provided'}</td>
                </tr>
              </table>
              ${customerPhone ? `
              <p style="color: #059669; font-weight: 600; margin: 20px 0 10px; font-size: 14px; text-align: center;">👇 Send Welcome Message on WhatsApp</p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/91${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${customerName}! 👋\n\nWelcome to Darshan Style Hub! 🎉\n\nThank you for signing up. We're excited to have you!\n\n✨ Explore our latest collection of designer suits and co-ord sets at www.darshanstylehub.com\n\nFeel free to message us anytime for:\n• Product recommendations\n• Size guidance\n• Custom orders\n• Any questions\n\nHappy Shopping! 🛍️`)}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      💬 Send Welcome on WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${customerEmail}" style="display: inline-block; background-color: #9f1239; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      ✉️ Email Customer
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">${SHOP_NAME} | Signup Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (service === 'resend') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: `${SHOP_NAME} <info@darshanstylehub.com>`,
        to: ownerEmails,
        subject: `🎉 New Signup: ${customerName} just joined!`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend signup notification error, falling through to Gmail:', error);
      } else {
        return { success: true, data, via: 'resend' };
      }
    } catch (resendError) {
      console.error('Resend failed for signup notification:', resendError);
    }
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = createGmailTransporter();
      const info = await transporter.sendMail({
        from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`,
        to: ownerEmails.join(', '),
        subject: `🎉 New Signup: ${customerName} just joined!`,
        html: htmlContent,
      });
      return { success: true, messageId: info.messageId, via: 'gmail' };
    } catch (gmailError) {
      console.error('Gmail failed for signup notification:', gmailError);
      return { success: false, error: gmailError };
    }
  }

  return { success: false, error: 'All email services failed' };
}

// Order confirmation email
interface OrderEmailProps {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
    color?: string | null;
  }>;
  shippingAddress?: string;
  shippingPhone?: string;
  shippingEmail?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  isAdminCopy?: boolean;
  orderDate?: Date;
}

export async function sendOrderConfirmationEmail(props: OrderEmailProps) {
  const { 
    to, customerName, orderId, total, subtotal, shipping, discount,
    items, shippingAddress, shippingPhone, shippingEmail, paymentMethod, 
    paymentStatus = 'PENDING', isAdminCopy, orderDate 
  } = props;
  const service = getEmailService();
  
  if (!service) {
    console.log('No email service configured, skipping order email');
    return { success: false, error: 'Email not configured' };
  }

  const htmlContent = getOrderConfirmationTemplate(customerName, orderId, total, items, shippingAddress, shippingPhone, shippingEmail, paymentMethod, paymentStatus, isAdminCopy);
  const subjectPrefix = isAdminCopy ? '[NEW ORDER] ' : 'Order Confirmed! ';

  // Generate PDF invoice
  let pdfBuffer: Buffer | null = null;
  try {
    const { generateOrderInvoicePDF } = await import('./invoice-pdf');
    pdfBuffer = await generateOrderInvoicePDF({
      orderId,
      orderDate: orderDate || new Date(),
      customerName,
      customerEmail: shippingEmail,
      customerPhone: shippingPhone || '',
      shippingAddress: shippingAddress || '',
      items,
      subtotal: subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      shipping: shipping || 0,
      discount: discount || 0,
      total,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'PENDING',
    });
  } catch (pdfError) {
    console.error('Failed to generate PDF invoice:', pdfError);
  }

  // Prepare attachments
  const attachments = pdfBuffer ? [{
    filename: `Invoice-${orderId.slice(0, 8).toUpperCase()}.pdf`,
    content: pdfBuffer,
  }] : [];

  // Try Resend first (for custom domain: info@darshanstylehub.com)
  if (service === 'resend') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailOptions: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        attachments?: Array<{ filename: string; content: Buffer }>;
      } = {
        from: `${SHOP_NAME} <info@darshanstylehub.com>`,
        to: [to],
        subject: `${subjectPrefix}DSH${orderId.slice(0, 8).toUpperCase()}`,
        html: htmlContent,
      };

      if (attachments.length > 0) {
        emailOptions.attachments = attachments;
      }

      const { data, error } = await resend.emails.send(emailOptions);

      if (error) {
        console.error('Resend order email error, falling through to Gmail:', error);
      } else {
        console.log('Order email sent via Resend with PDF:', data);
        return { success: true, data, via: 'resend' };
      }
    } catch (resendError) {
      console.error('Resend failed, trying Gmail...', resendError);
    }
  }

  // Try Gmail as fallback (always attempted when Resend fails for any reason)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = createGmailTransporter();
      const gmailAttachments = pdfBuffer ? [{
        filename: `Invoice-${orderId.slice(0, 8).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : [];

      const info = await transporter.sendMail({
        from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: `${subjectPrefix}DSH${orderId.slice(0, 8).toUpperCase()}`,
        html: htmlContent,
        attachments: gmailAttachments,
      });
      console.log('Order email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId, via: 'gmail' };
    } catch (gmailError) {
      console.error('Gmail failed:', gmailError);
      return { success: false, error: gmailError };
    }
  }

  return { success: false, error: 'All email services failed' };
}

function getOrderConfirmationTemplate(
  customerName: string,
  orderId: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number; size?: string | null; color?: string | null }>,
  shippingAddress?: string,
  shippingPhone?: string,
  shippingEmail?: string,
  paymentMethod?: string,
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED',
  isAdminCopy?: boolean,
): string {
  const itemsHtml = items.map(item => {
    const details = [
      item.size ? `Size: ${item.size}` : '',
      item.color ? `Color: ${item.color}` : '',
      `Qty: ${item.quantity}`,
    ].filter(Boolean).join(' | ');

    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #1f2937; font-weight: 500;">${item.name}</p>
        <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">${details}</p>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
      </td>
    </tr>`;
  }).join('');

  // Payment status - must be declared before use
  const isOnlinePayment = paymentMethod && (paymentMethod.includes('UPI') || paymentMethod.includes('Razorpay'));
  const isPending = paymentStatus === 'PENDING' && isOnlinePayment;

  const headerBg = isAdminCopy 
    ? 'background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);'
    : isPending
      ? 'background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);'
      : 'background: linear-gradient(135deg, #059669 0%, #10b981 100%);';
  
  const headerTitle = isAdminCopy 
    ? (isPending ? 'New Order - Payment Pending!' : 'New Order Received!')
    : (isPending ? 'Order Received!' : 'Order Confirmed!');
  const headerIcon = isAdminCopy ? '🔔' : (isPending ? '📦' : '✅');
  const greeting = isAdminCopy 
    ? `New order from <strong>${customerName}</strong>`
    : `Hi ${customerName},`;
  const subtext = isAdminCopy
    ? (isPending ? 'A new order has been placed but payment is pending. Details below:' : 'A new order has been placed on your store. Details below:')
    : (isPending ? 'Thank you for your order! Please complete the payment to confirm.' : 'Thank you for your order! We\'re preparing your items with care.');
  const paymentStatusBadge = isPending 
    ? `<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">⏳ PAYMENT PENDING</span>`
    : paymentStatus === 'PAID' 
      ? `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">✅ PAID</span>`
      : '';

  const pendingPaymentNote = isPending ? `
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">⏳ Payment Pending</p>
                <p style="margin: 8px 0 0; color: #a16207; font-size: 13px;">Your order has been received but payment is not yet completed. Please complete the payment to confirm your order.</p>
              </div>` : '';

  const shippingSection = (shippingAddress || shippingPhone || shippingEmail || paymentMethod) ? `
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 12px; color: #1f2937; font-weight: 600; font-size: 16px;">Shipping Details</p>
                ${shippingAddress ? `<p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">📍 ${shippingAddress}</p>` : ''}
                ${shippingPhone ? `<p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">📞 ${shippingPhone}</p>` : ''}
                ${shippingEmail ? `<p style="margin: 0 0 6px; color: #4b5563; font-size: 14px;">✉️ ${shippingEmail}</p>` : ''}
                ${paymentMethod ? `<p style="margin: 0; color: #4b5563; font-size: 14px;">💳 Payment: <strong>${paymentMethod}</strong>${paymentStatusBadge}</p>` : ''}
              </div>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f4f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="${headerBg} padding: 40px 30px; text-align: center;">
              <p style="font-size: 48px; margin: 0 0 10px;">${headerIcon}</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                ${greeting}
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">
                ${subtext}
              </p>
              
              <div style="background-color: #f3f4f6; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
                <p style="margin: 5px 0 0; color: #1f2937; font-size: 20px; font-weight: bold;">DSH${orderId.slice(0, 8).toUpperCase()}</p>
              </div>

              ${pendingPaymentNote}
              ${shippingSection}
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; background-color: #f9fafb; text-align: left; color: #6b7280; font-size: 14px;">Item</th>
                    <th style="padding: 12px; background-color: #f9fafb; text-align: right; color: #6b7280; font-size: 14px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="background-color: #fef3c7; padding: 15px 20px; border-radius: 8px; text-align: right;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">Total Amount</p>
                <p style="margin: 5px 0 0; color: #78350f; font-size: 24px; font-weight: bold;">₹${total.toLocaleString('en-IN')}</p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
                ${isAdminCopy ? 'Manage orders in your admin panel' : 'Questions about your order?'}
              </p>
              ${isAdminCopy 
                ? `<a href="https://www.darshanstylehub.com/admin/orders" style="color: #9f1239; font-weight: 600; font-size: 16px; text-decoration: none;">View All Orders →</a>`
                : `<p style="color: #9f1239; margin: 0 0 20px; font-size: 16px; font-weight: 600;">📞 +91 90190 76335</p>`
              }
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                ${SHOP_NAME} | Sitapura, Jaipur
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Admin: Return / Exchange request notification ───────────────────────────
interface ReturnNotificationProps {
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  requestType: 'RETURN' | 'EXCHANGE';
  reason: string;
  details?: string | null;
  pickupFee: number;
}

export async function sendAdminReturnNotification(props: ReturnNotificationProps) {
  const service = getEmailService();
  if (!service) return { success: false };

  const { orderId, customerName, customerPhone, requestType, reason, details, pickupFee } = props;
  const typeLabel = requestType === 'EXCHANGE' ? '🔄 Exchange' : '↩️ Return';
  const feeNote = requestType === 'RETURN' ? `₹${pickupFee} pickup fee` : 'Free exchange';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;">
  <table style="width:100%;"><tr><td align="center" style="padding:40px 0;">
  <table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);">
    <tr><td style="background:linear-gradient(135deg,#ea580c,#f97316);padding:32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">${requestType === 'EXCHANGE' ? '🔄' : '↩️'}</p>
      <h1 style="color:#fff;margin:0;font-size:22px;">${typeLabel} Request Received</h1>
    </td></tr>
    <tr><td style="padding:30px;">
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Order</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${orderId.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Customer</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${customerName}${customerPhone ? ` · ${customerPhone}` : ''}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Type</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${typeLabel}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Reason</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${reason}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Fee</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${feeNote}</td></tr>
        ${details ? `<tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Notes</td>
            <td style="padding:10px 14px;color:#111;">${details}</td></tr>` : ''}
      </table>
      <table style="width:100%;margin-top:20px;"><tr><td align="center">
        <a href="${SHOP_WEBSITE}/admin/returns" style="display:inline-block;background:#9f1239;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
          Review in Returns Dashboard →
        </a>
      </td></tr></table>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} | Returns Dashboard</p>
    </td></tr>
  </table></td></tr></table>
</body></html>`;

  const subject = `${typeLabel} Request — Order DSH${orderId.slice(0,8).toUpperCase()} from ${customerName}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: ADMIN_EMAILS, subject, html });
    } else {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to: ADMIN_EMAILS.join(', '), subject, html });
    }
    return { success: true };
  } catch (e) {
    console.error('Admin return notification email failed:', e);
    return { success: false };
  }
}

// ─── Customer: Return/Exchange confirmation ─────────────────────────────────
interface CustomerReturnEmailProps {
  to: string;
  customerName: string;
  orderId: string;
  requestType: 'RETURN' | 'EXCHANGE';
  reason: string;
  pickupFee: number;
}

export async function sendCustomerReturnNotification(props: CustomerReturnEmailProps) {
  const service = getEmailService();
  if (!service) return { success: false };

  const { to, customerName, orderId, requestType, reason, pickupFee } = props;
  const typeLabel = requestType === 'EXCHANGE' ? 'Exchange' : 'Return';
  const emoji = requestType === 'EXCHANGE' ? '🔄' : '↩️';
  const feeNote = requestType === 'RETURN'
    ? `A pickup fee of <strong>₹${pickupFee}</strong> will be deducted from your refund.`
    : 'Exchange shipping is <strong>free</strong>!';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;">
  <table style="width:100%;"><tr><td align="center" style="padding:40px 0;">
  <table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);">
    <tr><td style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">${emoji}</p>
      <h1 style="color:#fff;margin:0;font-size:22px;">${typeLabel} Request Received</h1>
    </td></tr>
    <tr><td style="padding:30px;">
      <p style="color:#4b5563;font-size:15px;margin:0 0 20px;">Hi ${customerName},</p>
      <p style="color:#4b5563;font-size:15px;margin:0 0 24px;">
        Your <strong>${typeLabel.toLowerCase()}</strong> request for Order <strong>DSH${orderId.slice(0,8).toUpperCase()}</strong> has been submitted successfully. Our team will review it shortly.
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;margin-bottom:20px;">
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Order ID</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${orderId.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Request Type</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${typeLabel}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Reason</td>
            <td style="padding:10px 14px;color:#111;font-weight:600;">${reason}</td></tr>
      </table>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:20px;">
        <p style="margin:0;color:#1e40af;font-size:14px;">${feeNote}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;margin:0;">We'll notify you once your request is approved. For any questions, reach us on WhatsApp at <strong>+91 90190 76335</strong>.</p>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} | ${SHOP_WEBSITE}</p>
    </td></tr>
  </table></td></tr></table>
</body></html>`;

  const subject = `${emoji} ${typeLabel} Request Received — Order DSH${orderId.slice(0,8).toUpperCase()}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: [to], subject, html });
      if (error) {
        console.error('Resend customer return email error, falling through to Gmail:', error);
      } else {
        return { success: true, via: 'resend' };
      }
    }
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to, subject, html });
      return { success: true, via: 'gmail' };
    }
  } catch (e) {
    console.error('Customer return notification email failed:', e);
  }
  return { success: false };
}

// ─── Admin: Order cancelled notification ─────────────────────────────────────
interface CancelNotificationProps {
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export async function sendAdminCancelNotification(props: CancelNotificationProps) {
  const service = getEmailService();
  if (!service) return { success: false };

  const { orderId, customerName, customerPhone, total, items } = props;
  const itemsHtml = items.map(i => `<tr>
    <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;color:#111;">${i.name} × ${i.quantity}</td>
    <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;color:#111;text-align:right;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;">
  <table style="width:100%;"><tr><td align="center" style="padding:40px 0;">
  <table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);">
    <tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">❌</p>
      <h1 style="color:#fff;margin:0;font-size:22px;">Order Cancelled</h1>
    </td></tr>
    <tr><td style="padding:30px;">
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Order</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${orderId.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Customer</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${customerName}${customerPhone ? ` · ${customerPhone}` : ''}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Total</td>
            <td style="padding:10px 14px;color:#111;font-weight:600;">₹${total.toLocaleString('en-IN')}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead><tr>
          <th style="padding:8px 14px;background:#f3f4f6;text-align:left;color:#6b7280;font-size:13px;">Item</th>
          <th style="padding:8px 14px;background:#f3f4f6;text-align:right;color:#6b7280;font-size:13px;">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <table style="width:100%;margin-top:20px;"><tr><td align="center">
        <a href="${SHOP_WEBSITE}/admin/orders" style="display:inline-block;background:#9f1239;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
          View Orders →
        </a>
      </td></tr></table>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} | Order Cancellation Alert</p>
    </td></tr>
  </table></td></tr></table>
</body></html>`;

  const subject = `❌ Order Cancelled — DSH${orderId.slice(0,8).toUpperCase()} by ${customerName}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: ADMIN_EMAILS, subject, html });
    } else {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to: ADMIN_EMAILS.join(', '), subject, html });
    }
    return { success: true };
  } catch (e) {
    console.error('Admin cancel notification email failed:', e);
    return { success: false };
  }
}

// Payment confirmation email - sent after successful online payment
interface PaymentConfirmationProps {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  paymentId?: string;
  isAdminCopy?: boolean;
}

export async function sendPaymentConfirmationEmail(props: PaymentConfirmationProps) {
  const { to, customerName, orderId, total, paymentId, isAdminCopy } = props;
  const service = getEmailService();
  
  if (!service) {
    console.log('No email service configured, skipping payment confirmation email');
    return { success: false, error: 'Email not configured' };
  }

  const htmlContent = getPaymentConfirmationTemplate(customerName, orderId, total, paymentId, isAdminCopy);
  const subjectPrefix = isAdminCopy ? '[PAYMENT RECEIVED] ' : 'Payment Confirmed! ';

  if (service === 'resend') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: `${SHOP_NAME} <info@darshanstylehub.com>`,
        to: [to],
        subject: `${subjectPrefix}DSH${orderId.slice(0, 8).toUpperCase()}`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend payment email error, falling through to Gmail:', error);
      } else {
        console.log('Payment confirmation email sent via Resend:', data);
        return { success: true, data, via: 'resend' };
      }
    } catch (resendError) {
      console.error('Resend failed, trying Gmail...', resendError);
    }
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = createGmailTransporter();
      const info = await transporter.sendMail({
        from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: `${subjectPrefix}DSH${orderId.slice(0, 8).toUpperCase()}`,
        html: htmlContent,
      });
      console.log('Payment confirmation email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId, via: 'gmail' };
    } catch (gmailError) {
      console.error('Gmail failed:', gmailError);
      return { success: false, error: gmailError };
    }
  }

  return { success: false, error: 'All email services failed' };
}

function getPaymentConfirmationTemplate(
  customerName: string,
  orderId: string,
  total: number,
  paymentId?: string,
  isAdminCopy?: boolean,
): string {
  const headerBg = isAdminCopy 
    ? 'background: linear-gradient(135deg, #059669 0%, #10b981 100%);'
    : 'background: linear-gradient(135deg, #059669 0%, #10b981 100%);';
  
  const headerTitle = isAdminCopy ? 'Payment Received!' : 'Payment Successful!';
  const headerIcon = '💰';
  const greeting = isAdminCopy 
    ? `Payment received from <strong>${customerName}</strong>`
    : `Hi ${customerName},`;
  const subtext = isAdminCopy
    ? 'Payment has been successfully received for this order.'
    : 'Great news! Your payment has been confirmed. We\'re now preparing your order for shipping.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="${headerBg} padding: 40px 30px; text-align: center;">
              <p style="font-size: 48px; margin: 0 0 10px;">${headerIcon}</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                ${greeting}
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">
                ${subtext}
              </p>
              
              <div style="background-color: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 5px; color: #065f46; font-size: 14px;">Payment Status</p>
                <p style="margin: 0; color: #047857; font-size: 24px; font-weight: bold;">✅ PAID</p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
                <p style="margin: 5px 0 0; color: #1f2937; font-size: 20px; font-weight: bold;">DSH${orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              ${paymentId ? `
              <div style="background-color: #f3f4f6; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Payment ID</p>
                <p style="margin: 5px 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${paymentId}</p>
              </div>` : ''}
              
              <div style="background-color: #fef3c7; padding: 15px 20px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">Amount Paid</p>
                <p style="margin: 5px 0 0; color: #78350f; font-size: 24px; font-weight: bold;">₹${total.toLocaleString('en-IN')}</p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
                ${isAdminCopy ? 'Manage orders in your admin panel' : 'Your order will be shipped soon!'}
              </p>
              ${isAdminCopy 
                ? `<a href="https://www.darshanstylehub.com/admin/orders" style="color: #9f1239; font-weight: 600; font-size: 16px; text-decoration: none;">View All Orders →</a>`
                : `<p style="color: #9f1239; margin: 0 0 20px; font-size: 16px; font-weight: 600;">📞 +91 90190 76335</p>`
              }
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                ${SHOP_NAME} | Sitapura, Jaipur
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Customer: Return / Exchange status update ────────────────────────────────
interface CustomerReturnStatusProps {
  to: string;
  customerName: string;
  orderId: string;
  requestType: 'RETURN' | 'EXCHANGE';
  newStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNotes?: string;
}

export async function sendCustomerReturnStatusEmail(props: CustomerReturnStatusProps) {
  const service = getEmailService();
  if (!service || !props.to) return { success: false };

  const { to, customerName, orderId, requestType, newStatus, adminNotes } = props;
  const typeLabel = requestType === 'RETURN' ? 'Return' : 'Exchange';
  const shortId = orderId.slice(0, 8).toUpperCase();

  const configs: Record<string, { emoji: string; title: string; color: string; bg: string; msg: string }> = {
    APPROVED:  { emoji: '✅', title: `${typeLabel} Approved!`,   color: '#16a34a', bg: 'linear-gradient(135deg,#16a34a,#22c55e)', msg: `Great news! Your ${typeLabel.toLowerCase()} request for order DSH${shortId} has been approved. Our team will be in touch shortly with next steps.` },
    REJECTED:  { emoji: '❌', title: `${typeLabel} Not Approved`, color: '#dc2626', bg: 'linear-gradient(135deg,#dc2626,#ef4444)', msg: `Unfortunately your ${typeLabel.toLowerCase()} request for order DSH${shortId} could not be approved at this time.${adminNotes ? '' : ' Please contact us if you have any questions.'}` },
    COMPLETED: { emoji: '🎉', title: `${typeLabel} Completed!`,  color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#a855f7)', msg: requestType === 'RETURN' ? `Your return for order DSH${shortId} is complete and your refund has been processed. It may take 5-7 business days to reflect in your account.` : `Your exchange for order DSH${shortId} is complete. Your new item will be dispatched soon!` },
  };
  const cfg = configs[newStatus] ?? configs['COMPLETED'];

  const notesHtml = adminNotes
    ? `<div style="background:#f9fafb;border-left:4px solid ${cfg.color};border-radius:4px;padding:14px 16px;margin-bottom:20px;"><p style="color:#6b7280;font-size:13px;margin:0 0 4px;font-weight:600;">Note from our team</p><p style="color:#111;font-size:14px;margin:0;">${adminNotes}</p></div>`
    : '';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;"><table style="width:100%;"><tr><td align="center" style="padding:40px 0;"><table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);"><tr><td style="background:${cfg.bg};padding:32px;text-align:center;"><p style="font-size:40px;margin:0 0 8px;">${cfg.emoji}</p><h1 style="color:#fff;margin:0;font-size:22px;">${cfg.title}</h1></td></tr><tr><td style="padding:30px;"><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${customerName},</p><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${cfg.msg}</p>${notesHtml}<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;"><tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Order</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${shortId}</td></tr><tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Type</td><td style="padding:10px 14px;color:#111;font-weight:600;">${typeLabel}</td></tr></table><table style="width:100%;margin-top:24px;"><tr><td align="center"><a href="${SHOP_WEBSITE}/my-orders" style="display:inline-block;background:#9f1239;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">View My Orders</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} · Questions? Call +91 90190 76335</p></td></tr></table></td></tr></table></body></html>`;

  const statusLabel = newStatus === 'APPROVED' ? 'Approved' : newStatus === 'REJECTED' ? 'Update' : 'Completed';
  const subject = `${cfg.emoji} Your ${typeLabel} Request DSH${shortId} — ${statusLabel}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: [to], subject, html });
    } else {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to, subject, html });
    }
    return { success: true };
  } catch (e) {
    console.error('Customer return status email failed:', e);
    return { success: false };
  }
}

// ─── Customer: Order Shipped notification ─────────────────────────────────────
interface OrderShippedProps {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  trackingInfo?: string;
}

export async function sendOrderShippedEmail(props: OrderShippedProps) {
  const service = getEmailService();
  if (!service || !props.to) return { success: false };

  const { to, customerName, orderId, total, trackingInfo } = props;
  const shortId = orderId.slice(0, 8).toUpperCase();

  const trackingRow = trackingInfo
    ? `<tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Tracking</td><td style="padding:10px 14px;color:#111;font-weight:600;">${trackingInfo}</td></tr>`
    : '';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;"><table style="width:100%;"><tr><td align="center" style="padding:40px 0;"><table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);"><tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center;"><p style="font-size:40px;margin:0 0 8px;">🚚</p><h1 style="color:#fff;margin:0;font-size:22px;">Your Order is on its way!</h1></td></tr><tr><td style="padding:30px;"><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${customerName},</p><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Exciting news! Your order <strong>DSH${shortId}</strong> has been shipped and is on its way to you!</p><table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;"><tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Order</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${shortId}</td></tr><tr><td style="padding:10px 14px;${trackingInfo ? 'border-bottom:1px solid #e5e7eb;' : ''}color:#6b7280;font-size:14px;">Total</td><td style="padding:10px 14px;${trackingInfo ? 'border-bottom:1px solid #e5e7eb;' : ''}color:#111;font-weight:600;">&#8377;${total.toLocaleString('en-IN')}</td></tr>${trackingRow}</table><p style="color:#6b7280;font-size:14px;margin:20px 0;">For any queries, reach us at <a href="tel:+919019076335" style="color:#9f1239;">+91 90190 76335</a> or WhatsApp us.</p><table style="width:100%;margin-top:8px;"><tr><td align="center"><a href="${SHOP_WEBSITE}/my-orders" style="display:inline-block;background:#9f1239;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Track Order</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} · ${SHOP_WEBSITE}</p></td></tr></table></td></tr></table></body></html>`;

  const subject = `🚚 Your Order DSH${shortId} Has Been Shipped — ${SHOP_NAME}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: [to], subject, html });
    } else {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to, subject, html });
    }
    return { success: true };
  } catch (e) {
    console.error('Order shipped email failed:', e);
    return { success: false };
  }
}

// ─── Customer: Replacement order created (free exchange) ──────────────────────
interface ReplacementOrderProps {
  to: string;
  customerName: string;
  originalOrderId: string;
  replacementOrderId: string;
  productName: string;
  size?: string;
  color?: string;
}

export async function sendReplacementOrderEmail(props: ReplacementOrderProps) {
  const service = getEmailService();
  if (!service || !props.to) return { success: false };

  const { to, customerName, originalOrderId, replacementOrderId, productName, size, color } = props;
  const shortOriginal = originalOrderId.slice(0, 8).toUpperCase();
  const shortReplacement = replacementOrderId.slice(0, 8).toUpperCase();

  const variantLine = [size ? `Size: ${size}` : null, color ? `Colour: ${color}` : null]
    .filter(Boolean)
    .join(' · ');

  const variantRow = variantLine
    ? `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Replacement</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">${variantLine}</td></tr>`
    : '';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f4f0;margin:0;padding:0;"><table style="width:100%;"><tr><td align="center" style="padding:40px 0;"><table style="width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);"><tr><td style="background:linear-gradient(135deg,#0ea5e9,#22d3ee);padding:32px;text-align:center;"><p style="font-size:40px;margin:0 0 8px;">🔄</p><h1 style="color:#fff;margin:0;font-size:22px;">Your Replacement is on the way!</h1></td></tr><tr><td style="padding:30px;"><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${customerName},</p><p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">We've received your original item and a replacement order for <strong>${productName}</strong> has been created. We'll dispatch it shortly — no extra charge.</p><table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;"><tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Replacement Order</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${shortReplacement}</td></tr><tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Original Order</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111;font-weight:600;">DSH${shortOriginal}</td></tr>${variantRow}<tr><td style="padding:10px 14px;color:#6b7280;font-size:14px;">Amount</td><td style="padding:10px 14px;color:#16a34a;font-weight:700;">FREE — &#8377;0</td></tr></table><p style="color:#6b7280;font-size:13px;margin:20px 0 0;">You'll get another email the moment we ship the replacement.</p><table style="width:100%;margin-top:24px;"><tr><td align="center"><a href="${SHOP_WEBSITE}/my-orders" style="display:inline-block;background:#9f1239;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">View My Orders</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;margin:0;font-size:12px;">${SHOP_NAME} · ${SHOP_WEBSITE}</p></td></tr></table></td></tr></table></body></html>`;

  const subject = `🔄 Replacement Order DSH${shortReplacement} Created — ${SHOP_NAME}`;

  try {
    if (service === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: `${SHOP_NAME} <info@darshanstylehub.com>`, to: [to], subject, html });
    } else {
      const transporter = createGmailTransporter();
      await transporter.sendMail({ from: `"${SHOP_NAME}" <${process.env.GMAIL_USER}>`, to, subject, html });
    }
    return { success: true };
  } catch (e) {
    console.error('Replacement order email failed:', e);
    return { success: false };
  }
}
