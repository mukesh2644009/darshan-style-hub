import nodemailer from 'nodemailer';

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER || '919019076335';

interface OrderNotification {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
    color?: string | null;
  }>;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
}

function formatOrderMessage(order: OrderNotification): string {
  const itemLines = order.items.map(item => {
    const details = [
      item.size ? `Size: ${item.size}` : '',
      item.color ? `Color: ${item.color}` : '',
    ].filter(Boolean).join(', ');

    return `  • ${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}${details ? ` (${details})` : ''}`;
  }).join('\n');

  return `🛍️ *NEW ORDER RECEIVED!*

*Order ID:* #${order.orderId.slice(0, 8).toUpperCase()}

*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
${order.customerEmail ? `*Email:* ${order.customerEmail}` : ''}

*Items:*
${itemLines}

*Total:* ₹${order.total.toLocaleString('en-IN')}
*Payment:* ${order.paymentMethod}

*Shipping:* ${order.shippingAddress}

---
View all orders: https://www.darshanstylehub.com/admin/orders`;
}

/**
 * Send WhatsApp notification via CallMeBot API (free service).
 *
 * Setup (one-time):
 * 1. Save +34 644 52 18 29 in your phone contacts
 * 2. Send "I allow callmebot to send me messages" to that number on WhatsApp
 * 3. You'll receive an API key
 * 4. Set CALLMEBOT_API_KEY in your env vars
 */
async function sendViaCallMeBot(message: string): Promise<boolean> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!apiKey) return false;

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      console.log('WhatsApp sent via CallMeBot');
      return true;
    }
    console.error('CallMeBot error:', response.status, await response.text());
    return false;
  } catch (error) {
    console.error('CallMeBot failed:', error);
    return false;
  }
}

/**
 * Send WhatsApp notification via WhatsApp Business Cloud API (Meta).
 *
 * Setup:
 * 1. Create a Meta Business account
 * 2. Set up WhatsApp Business API
 * 3. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in env vars
 */
async function sendViaCloudAPI(message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return false;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: ADMIN_WHATSAPP,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (response.ok) {
      console.log('WhatsApp sent via Cloud API');
      return true;
    }
    console.error('WhatsApp Cloud API error:', await response.text());
    return false;
  } catch (error) {
    console.error('WhatsApp Cloud API failed:', error);
    return false;
  }
}

/**
 * Fallback: send WhatsApp notification content via email.
 * The admin gets an email formatted like a WhatsApp message,
 * with a direct "Reply on WhatsApp" link to the customer.
 */
async function sendViaEmailFallback(order: OrderNotification, message: string): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || gmailUser;

  if (!gmailUser || !gmailPass || !adminEmail) return false;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const whatsappLink = `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`;

    await transporter.sendMail({
      from: `"Darshan Style Hub" <${gmailUser}>`,
      to: adminEmail,
      subject: `🛍️ New Order #${order.orderId.slice(0, 8).toUpperCase()} from ${order.customerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: #25D366; color: white; padding: 15px 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">🛍️ New Order Received!</h2>
          </div>
          <div style="background: #ECE5DD; padding: 20px; border-radius: 0 0 12px 12px;">
            <div style="background: white; padding: 15px; border-radius: 8px; white-space: pre-line; font-size: 14px; line-height: 1.6;">
${message.replace(/\*/g, '').replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 15px; text-align: center;">
              <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                📱 Chat with ${order.customerName} on WhatsApp
              </a>
            </div>
          </div>
        </div>
      `,
    });

    console.log('WhatsApp-style notification sent via email');
    return true;
  } catch (error) {
    console.error('Email fallback failed:', error);
    return false;
  }
}

export async function sendOrderWhatsAppNotification(order: OrderNotification): Promise<{ success: boolean; via: string }> {
  const message = formatOrderMessage(order);

  // Try WhatsApp Cloud API first (most professional)
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    const sent = await sendViaCloudAPI(message);
    if (sent) return { success: true, via: 'whatsapp-cloud-api' };
  }

  // Try CallMeBot (free, simple)
  if (process.env.CALLMEBOT_API_KEY) {
    const sent = await sendViaCallMeBot(message);
    if (sent) return { success: true, via: 'callmebot' };
  }

  // Fallback: send WhatsApp-style email with customer chat link
  const sent = await sendViaEmailFallback(order, message);
  if (sent) return { success: true, via: 'email-fallback' };

  console.log('No WhatsApp notification method available');
  return { success: false, via: 'none' };
}
