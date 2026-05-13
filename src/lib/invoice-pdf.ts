import PDFDocument from 'pdfkit';
import { LOGO_BUFFER } from './logo-data';

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
      const pageWidth = 595.28; // A4
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // --- Logo + Brand Header ---
      const headerStartY = 40;
      let hasLogo = false;

      try {
        doc.image(LOGO_BUFFER, margin, headerStartY, { width: 70, height: 70 });
        hasLogo = true;
      } catch {
        hasLogo = false;
      }

      const textLeftX = hasLogo ? margin + 80 : margin;

      doc.fontSize(20)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('Darshan Style Hub', textLeftX, headerStartY + 5);

      doc.fontSize(9)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Sitapura, Jaipur, Rajasthan 302022', textLeftX, headerStartY + 30)
         .text('Phone: +91 90190 76335  |  Email: darshanstylehub.business@gmail.com', textLeftX, headerStartY + 43)
         .text('www.darshanstylehub.com', textLeftX, headerStartY + 56);

      // --- Invoice Title (right side, below top margin) ---
      const invoiceTitleY = headerStartY + 80;

      doc.fontSize(16)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('ORDER INVOICE', margin, invoiceTitleY, { width: contentWidth, align: 'right' });

      // Order info — right aligned below title
      const infoY = invoiceTitleY + 25;
      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text(`Order ID: DSH${data.orderId.slice(0, 8).toUpperCase()}`, margin, infoY, { width: contentWidth, align: 'right' })
         .text(`Date: ${data.orderDate.toLocaleDateString('en-IN', {
           day: '2-digit',
           month: 'short',
           year: 'numeric',
         })}`, margin, infoY + 15, { width: contentWidth, align: 'right' });

      // Payment status badge
      const statusColor = data.paymentStatus === 'PAID' ? '#059669' : '#d97706';
      const statusText = data.paymentStatus === 'PAID' ? 'PAID' : 'PENDING';
      doc.fontSize(10)
         .fillColor(statusColor)
         .font('Helvetica-Bold')
         .text(`Payment: ${statusText}`, margin, infoY + 35, { width: contentWidth, align: 'right' });

      // --- Divider ---
      const divider1Y = infoY + 58;
      doc.moveTo(margin, divider1Y)
         .lineTo(margin + contentWidth, divider1Y)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // --- Bill To + Payment Method ---
      const sectionY = divider1Y + 15;

      doc.fontSize(11)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('BILL TO:', margin, sectionY);

      doc.fontSize(11)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text(data.customerName, margin, sectionY + 18);

      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text(data.shippingAddress, margin, sectionY + 35, { width: 260 });

      const addressLines = Math.ceil(data.shippingAddress.length / 45);
      let billEndY = sectionY + 35 + addressLines * 14;

      doc.text(`Phone: ${data.customerPhone}`, margin, billEndY);
      if (data.customerEmail) {
        billEndY += 14;
        doc.text(`Email: ${data.customerEmail}`, margin, billEndY);
      }

      // Payment method — right column
      doc.fontSize(11)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('PAYMENT METHOD:', 360, sectionY);

      doc.fontSize(10)
         .fillColor(darkColor)
         .font('Helvetica')
         .text(data.paymentMethod, 360, sectionY + 18);

      // --- Items Table ---
      const tableTop = Math.max(billEndY + 30, sectionY + 90);

      // Table header background
      doc.fillColor('#f3f4f6')
         .rect(margin, tableTop, contentWidth, 25)
         .fill();

      doc.fontSize(9)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('ITEM', margin + 10, tableTop + 8, { width: 200 })
         .text('SIZE', 280, tableTop + 8)
         .text('QTY', 330, tableTop + 8)
         .text('PRICE', 380, tableTop + 8)
         .text('TOTAL', 460, tableTop + 8, { width: 75, align: 'right' });

      // Table rows
      let itemY = tableTop + 35;

      data.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;

        if (index % 2 === 1) {
          doc.fillColor('#fafafa')
             .rect(margin, itemY - 5, contentWidth, 25)
             .fill();
        }

        doc.fontSize(9)
           .fillColor(darkColor)
           .font('Helvetica')
           .text(item.name.substring(0, 38), margin + 10, itemY, { width: 210 })
           .text(item.size || '-', 280, itemY)
           .text(item.quantity.toString(), 330, itemY)
           .text(`Rs.${item.price.toLocaleString('en-IN')}`, 380, itemY)
           .font('Helvetica-Bold')
           .text(`Rs.${itemTotal.toLocaleString('en-IN')}`, 460, itemY, { width: 75, align: 'right' });

        itemY += 25;
      });

      // Divider before totals
      doc.moveTo(margin, itemY + 10)
         .lineTo(margin + contentWidth, itemY + 10)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // --- Totals ---
      const totalsLabelX = 370;
      const totalsValueX = 460;
      const totalsValueWidth = 75;
      let totalsY = itemY + 25;

      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Subtotal:', totalsLabelX, totalsY)
         .fillColor(darkColor)
         .text(`Rs.${data.subtotal.toLocaleString('en-IN')}`, totalsValueX, totalsY, { width: totalsValueWidth, align: 'right' });

      totalsY += 18;
      doc.fillColor(grayColor)
         .text('Shipping:', totalsLabelX, totalsY)
         .fillColor(darkColor)
         .text(data.shipping === 0 ? 'FREE' : `Rs.${data.shipping}`, totalsValueX, totalsY, { width: totalsValueWidth, align: 'right' });

      // COD charge — derive from payment method
      const isCod = data.paymentMethod === 'COD';
      if (isCod) {
        totalsY += 18;
        doc.fillColor(grayColor)
           .text('COD Charge:', totalsLabelX, totalsY)
           .fillColor(darkColor)
           .text('Rs.50', totalsValueX, totalsY, { width: totalsValueWidth, align: 'right' });
      }

      if (data.discount && data.discount > 0) {
        totalsY += 18;
        doc.fillColor('#059669')
           .text('Discount:', totalsLabelX, totalsY)
           .text(`-Rs.${data.discount.toLocaleString('en-IN')}`, totalsValueX, totalsY, { width: totalsValueWidth, align: 'right' });
      }

      // Grand total box
      totalsY += 25;
      doc.fillColor('#f3f4f6')
         .rect(totalsLabelX - 10, totalsY - 5, 185, 28)
         .fill();

      doc.fontSize(12)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TOTAL:', totalsLabelX, totalsY + 3)
         .text(`Rs.${data.total.toLocaleString('en-IN')}`, totalsValueX, totalsY + 3, { width: totalsValueWidth, align: 'right' });

      // --- Footer ---
      const footerY = 730;

      doc.moveTo(margin, footerY)
         .lineTo(margin + contentWidth, footerY)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      doc.fontSize(9)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('Thank you for shopping with Darshan Style Hub!', margin, footerY + 15, { align: 'center', width: contentWidth })
         .text('For any queries, contact us at +91 90190 76335 or darshanstylehub.business@gmail.com', margin, footerY + 30, { align: 'center', width: contentWidth });

      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('This is a computer-generated invoice and does not require a signature.', margin, footerY + 50, { align: 'center', width: contentWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
