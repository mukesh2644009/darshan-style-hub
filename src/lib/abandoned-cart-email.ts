interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
  };
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export function abandonedCartEmail({
  name,
  items,
  total,
  isSecondReminder = false,
}: {
  name?: string | null;
  items: CartItem[];
  total: number;
  isSecondReminder?: boolean;
}): { subject: string; html: string } {
  const firstName = name?.split(' ')[0] || 'there';
  const checkoutUrl = 'https://www.darshanstylehub.com/checkout';

  const subject = isSecondReminder
    ? `⏰ Last chance! Your Darshan Style Hub cart is expiring`
    : `🛍️ You left something beautiful behind, ${firstName}!`;

  const itemsHtml = items
    .map((item) => {
      const image = item.product.images?.[0] || '';
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3e8d0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${image ? `<td width="80" style="padding-right: 16px; vertical-align: top;">
                  <img src="${image}" width="80" height="96" style="border-radius: 8px; object-fit: cover; display: block;" alt="${item.product.name}" />
                </td>` : ''}
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #1a1a1a;">${item.product.name}</p>
                  ${item.selectedSize && item.selectedSize !== 'Free Size' ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">Size: ${item.selectedSize}</p>` : ''}
                  ${item.selectedColor ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">Color: ${item.selectedColor}</p>` : ''}
                  <p style="margin: 0 0 4px; font-size: 13px; color: #666;">Qty: ${item.quantity}</p>
                  <p style="margin: 0; font-size: 15px; font-weight: 700; color: #b45309;">₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  const urgencyBanner = isSecondReminder
    ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">⚠️ Some items in your cart have limited stock. Don't miss out!</p>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #FFF8E6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8E6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #b45309 0%, #d97706 100%); padding: 32px 32px 24px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 22px; font-weight: 800; color: white; letter-spacing: 0.5px;">Darshan Style Hub</p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 2px; text-transform: uppercase;">Art In Every Thread</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${urgencyBanner}

              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1a1a;">
                ${isSecondReminder ? `Still thinking, ${firstName}? 🤔` : `Hey ${firstName}, your cart misses you! 🛍️`}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">
                ${isSecondReminder
                  ? 'This is your final reminder — your beautiful selection is still waiting. Complete your order before someone else grabs it!'
                  : 'You left some gorgeous pieces in your cart. They\'re still saved for you — complete your order before they run out!'}
              </p>

              <!-- Cart Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                ${itemsHtml}
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border-radius: 8px; padding: 0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size: 15px; color: #555;">Subtotal</td>
                        <td align="right" style="font-size: 18px; font-weight: 800; color: #b45309;">₹${total.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 4px; font-size: 12px; color: #888;">+ shipping calculated at checkout</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #b45309, #d97706); color: white; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 48px; border-radius: 50px; letter-spacing: 0.5px;">
                      Complete My Order →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #888; text-align: center; line-height: 1.6;">
                Free shipping on orders above ₹999 · Easy returns · Cash on Delivery available
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #fafafa; border-top: 1px solid #f0e6d0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #888;">
                Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/919019076335" style="color: #b45309;">+91 90190 76335</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #aaa;">
                © 2025 Darshan Style Hub · Jaipur, Rajasthan<br/>
                You received this because you added items to your cart. <a href="${checkoutUrl}" style="color: #b45309;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
