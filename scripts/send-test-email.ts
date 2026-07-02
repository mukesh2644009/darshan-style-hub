import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

(async () => {
  const { generateOrderInvoicePDF } = await import('../src/lib/invoice-pdf');
  const { sendOrderConfirmationEmail } = await import('../src/lib/email');

  const orderId = 'test1234abcd5678';
  const orderDate = new Date();

  const sampleItems = [
    { name: 'Floral Anarkali Suit', quantity: 1, price: 1299, size: 'M', color: 'Blue' },
    { name: 'Cotton Palazzo Set', quantity: 1, price: 899, size: 'L', color: null },
  ];

  console.log('📄 Generating PDF invoice...');
  try {
    const pdf = await generateOrderInvoicePDF({
      orderId,
      orderDate,
      customerName: 'Priya Sharma (Test)',
      customerEmail: 'darshanstylehub.business@gmail.com',
      customerPhone: '+91 90190 76335',
      shippingAddress: '45, Vaishali Nagar, Jaipur, Rajasthan - 302021',
      items: sampleItems,
      subtotal: 2198,
      shipping: 0,
      discount: 0,
      total: 2248,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    });
    console.log(`✅ PDF generated — ${(pdf.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error('❌ PDF generation failed (continuing without PDF):', err);
  }

  console.log('\n📧 Sending sample email to darshanstylehub.business@gmail.com ...');
  const result = await sendOrderConfirmationEmail({
    to: 'darshanstylehub.business@gmail.com',
    customerName: 'Priya Sharma (Test)',
    orderId,
    total: 2248,
    subtotal: 2198,
    shipping: 0,
    discount: 0,
    items: sampleItems,
    shippingAddress: '45, Vaishali Nagar, Jaipur, Rajasthan - 302021',
    shippingPhone: '+91 90190 76335',
    shippingEmail: 'darshanstylehub.business@gmail.com',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    isAdminCopy: false,
    orderDate,
  });

  if (result.success) {
    console.log(`\n✅ Email sent via ${(result as Record<string, unknown>).via}!`);
    console.log('   Check darshanstylehub.business@gmail.com inbox.');
  } else {
    console.error('\n❌ Email failed:', (result as Record<string, unknown>).error);
  }
})().catch(console.error);
