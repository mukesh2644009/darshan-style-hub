import jsPDF from 'jspdf';

interface ReceiptItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  paymentMethod: string;
  paymentStatus: string;
  items: ReceiptItem[];
  subtotal: number;
  shipping: number;
  codCharge?: number;
  total: number;
}

export function generateReceipt(data: ReceiptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const primaryColor: [number, number, number] = [159, 88, 10];
  const darkColor: [number, number, number] = [31, 41, 55];
  const grayColor: [number, number, number] = [107, 114, 128];
  const lightBg: [number, number, number] = [249, 250, 251];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Store name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Darshan Style Hub™', 15, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sitapura Industrial Area, Jaipur, Rajasthan 302022 | +91 90190 76335', 15, y);
  y += 5;
  doc.text('www.darshanstylehub.com | darshanstylehub@gmail.com', 15, y);

  // "ORDER RECEIPT" badge
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER RECEIPT', pageWidth - 15, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.orderId.slice(0, 8).toUpperCase()}`, pageWidth - 15, 30, { align: 'right' });

  y = 50;

  // Order info and customer info side by side
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 15, y);
  doc.text('Ship To', pageWidth / 2 + 10, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);

  // Left column - order details
  doc.text(`Order Date: ${data.orderDate}`, 15, y);
  doc.text(data.customerName, pageWidth / 2 + 10, y);
  y += 5;
  doc.text(`Payment: ${data.paymentMethod}`, 15, y);
  doc.text(data.shippingAddress, pageWidth / 2 + 10, y);
  y += 5;
  doc.text(`Status: ${data.paymentStatus}`, 15, y);
  doc.text(`${data.shippingCity}, ${data.shippingState} ${data.shippingPincode}`, pageWidth / 2 + 10, y);
  y += 5;
  doc.text(`Email: ${data.customerEmail}`, 15, y);
  doc.text(`Phone: ${data.customerPhone}`, pageWidth / 2 + 10, y);

  y += 12;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  // Table header
  doc.setFillColor(...lightBg);
  doc.rect(15, y - 4, pageWidth - 30, 10, 'F');
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Product', 18, y + 2);
  doc.text('Size', 110, y + 2);
  doc.text('Qty', 135, y + 2);
  doc.text('Price', pageWidth - 18, y + 2, { align: 'right' });
  y += 12;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  data.items.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const name = item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name;
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.text(name, 18, y);
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    if (item.color) {
      doc.text(item.color, 18, y + 4);
    }
    doc.setFontSize(9);
    doc.text(item.size, 110, y);
    doc.text(String(item.quantity), 135, y);
    doc.text(`Rs.${(item.price * item.quantity).toLocaleString('en-IN')}`, pageWidth - 18, y, { align: 'right' });

    y += item.color ? 10 : 7;

    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(18, y - 2, pageWidth - 18, y - 2);
  });

  y += 5;

  // Totals
  const totalsX = pageWidth - 80;
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text('Subtotal', totalsX, y);
  doc.text(`Rs.${data.subtotal.toLocaleString('en-IN')}`, pageWidth - 18, y, { align: 'right' });
  y += 6;

  doc.text('Shipping', totalsX, y);
  doc.text(data.shipping === 0 ? 'Free' : `Rs.${data.shipping}`, pageWidth - 18, y, { align: 'right' });
  y += 6;

  if (data.codCharge && data.codCharge > 0) {
    doc.text('COD Charge', totalsX, y);
    doc.text(`Rs.${data.codCharge}`, pageWidth - 18, y, { align: 'right' });
    y += 6;
  }

  // Total line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - 15, y);
  y += 7;

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', totalsX, y);
  doc.text(`Rs.${data.total.toLocaleString('en-IN')}`, pageWidth - 18, y, { align: 'right' });

  y += 20;

  // Footer
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for shopping with Darshan Style Hub™!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('For any queries, contact us at darshanstylehub@gmail.com or +91 90190 76335', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('Follow us: instagram.com/stylehubjaipur | facebook.com/darshanstylehub', pageWidth / 2, y, { align: 'center' });

  return doc;
}

export function downloadReceipt(data: ReceiptData) {
  const doc = generateReceipt(data);
  const orderShort = data.orderId.slice(0, 8).toUpperCase();
  doc.save(`Darshan-Style-Hub-Receipt-${orderShort}.pdf`);
}
