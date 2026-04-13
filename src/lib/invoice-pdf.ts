import PDFDocument from 'pdfkit';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

interface InvoiceData {
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export async function generateOrderInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#9f1239';
      const grayColor = '#6b7280';
      const darkColor = '#1f2937';

      // Header
      doc.fontSize(24)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('Darshan Style Hub', 50, 50);
      
      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Sitapura, Jaipur, Rajasthan 302022', 50, 80)
         .text('Phone: +91 90190 76335', 50, 95)
         .text('Email: info@darshanstylehub.com', 50, 110)
         .text('Website: www.darshanstylehub.com', 50, 125);

      // Invoice Title
      doc.fontSize(20)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('ORDER INVOICE', 400, 50, { align: 'right' });

      // Order Info Box
      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text(`Order ID: #${data.orderId.slice(0, 8).toUpperCase()}`, 400, 80, { align: 'right' })
         .text(`Date: ${data.orderDate.toLocaleDateString('en-IN', { 
           day: '2-digit', 
           month: 'short', 
           year: 'numeric' 
         })}`, 400, 95, { align: 'right' });

      // Payment Status Badge
      const statusColor = data.paymentStatus === 'PAID' ? '#059669' : '#d97706';
      const statusText = data.paymentStatus === 'PAID' ? 'PAID' : 'PENDING';
      doc.fontSize(10)
         .fillColor(statusColor)
         .font('Helvetica-Bold')
         .text(`Payment: ${statusText}`, 400, 115, { align: 'right' });

      // Divider
      doc.moveTo(50, 150)
         .lineTo(545, 150)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // Bill To Section
      doc.fontSize(12)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, 170);

      doc.fontSize(11)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text(data.customerName, 50, 190);

      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text(data.shippingAddress, 50, 208, { width: 250 });

      const addressLines = Math.ceil(data.shippingAddress.length / 40);
      let yPos = 208 + (addressLines * 15);

      doc.text(`Phone: ${data.customerPhone}`, 50, yPos);
      if (data.customerEmail) {
        yPos += 15;
        doc.text(`Email: ${data.customerEmail}`, 50, yPos);
      }

      // Payment Method Section
      doc.fontSize(12)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('PAYMENT METHOD:', 350, 170);

      doc.fontSize(10)
         .fillColor(darkColor)
         .font('Helvetica')
         .text(data.paymentMethod, 350, 190);

      // Items Table Header
      const tableTop = Math.max(yPos + 40, 280);
      
      doc.fillColor('#f3f4f6')
         .rect(50, tableTop, 495, 25)
         .fill();

      doc.fontSize(10)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('ITEM', 60, tableTop + 8)
         .text('SIZE', 280, tableTop + 8)
         .text('QTY', 340, tableTop + 8)
         .text('PRICE', 390, tableTop + 8)
         .text('TOTAL', 470, tableTop + 8);

      // Items
      let itemY = tableTop + 35;
      
      data.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        // Alternate row background
        if (index % 2 === 1) {
          doc.fillColor('#fafafa')
             .rect(50, itemY - 5, 495, 25)
             .fill();
        }

        doc.fontSize(10)
           .fillColor(darkColor)
           .font('Helvetica')
           .text(item.name.substring(0, 35), 60, itemY, { width: 210 })
           .text(item.size || '-', 280, itemY)
           .text(item.quantity.toString(), 340, itemY)
           .text(`₹${item.price.toLocaleString('en-IN')}`, 390, itemY)
           .font('Helvetica-Bold')
           .text(`₹${itemTotal.toLocaleString('en-IN')}`, 470, itemY);

        itemY += 25;
      });

      // Divider before totals
      doc.moveTo(50, itemY + 10)
         .lineTo(545, itemY + 10)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // Totals Section
      const totalsX = 380;
      let totalsY = itemY + 25;

      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Subtotal:', totalsX, totalsY)
         .fillColor(darkColor)
         .text(`₹${data.subtotal.toLocaleString('en-IN')}`, 470, totalsY);

      totalsY += 20;
      doc.fillColor(grayColor)
         .text('Shipping:', totalsX, totalsY)
         .fillColor(darkColor)
         .text(data.shipping === 0 ? 'FREE' : `₹${data.shipping}`, 470, totalsY);

      if (data.discount && data.discount > 0) {
        totalsY += 20;
        doc.fillColor('#059669')
           .text('Discount:', totalsX, totalsY)
           .text(`-₹${data.discount.toLocaleString('en-IN')}`, 470, totalsY);
      }

      // Total
      totalsY += 25;
      doc.fillColor('#f3f4f6')
         .rect(totalsX - 10, totalsY - 5, 175, 30)
         .fill();

      doc.fontSize(12)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TOTAL:', totalsX, totalsY + 3)
         .text(`₹${data.total.toLocaleString('en-IN')}`, 470, totalsY + 3);

      // Footer
      const footerY = 750;
      
      doc.moveTo(50, footerY)
         .lineTo(545, footerY)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      doc.fontSize(9)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Thank you for shopping with Darshan Style Hub!', 50, footerY + 15, { align: 'center', width: 495 })
         .text('For any queries, contact us at +91 90190 76335 or info@darshanstylehub.com', 50, footerY + 30, { align: 'center', width: 495 });

      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 50, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
