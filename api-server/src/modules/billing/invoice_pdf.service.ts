import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InvoicePdfData {
  invoiceNumber: string;
  date: Date;
  shopName: string;
  shopAddress?: string;
  shopGst?: string;
  shopPhone?: string;
  branchName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gstPercentage: number;
    gstAmount: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMode: string;
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──
      doc.fontSize(20).font('Helvetica-Bold').text(data.shopName, { align: 'center' });
      if (data.shopAddress) {
        doc.fontSize(9).font('Helvetica').text(data.shopAddress, { align: 'center' });
      }
      if (data.shopGst) {
        doc.fontSize(9).text(`GSTIN: ${data.shopGst}`, { align: 'center' });
      }
      if (data.shopPhone) {
        doc.fontSize(9).text(`Phone: ${data.shopPhone}`, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // ── Invoice Info ──
      doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
      doc.moveDown(0.3);

      const infoY = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice No: ${data.invoiceNumber}`, 40, infoY);
      doc.text(`Date: ${data.date.toLocaleDateString('en-IN')}`, 40, infoY + 14);
      doc.text(`Branch: ${data.branchName}`, 40, infoY + 28);

      if (data.customerName) {
        doc.text(`Customer: ${data.customerName}`, 300, infoY);
      }
      if (data.customerPhone) {
        doc.text(`Phone: ${data.customerPhone}`, 300, infoY + 14);
      }

      doc.y = infoY + 48;
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // ── Items Table Header ──
      const tableTop = doc.y;
      const colX = { item: 40, qty: 250, price: 300, gst: 370, disc: 420, total: 480 };

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Item', colX.item, tableTop);
      doc.text('Qty', colX.qty, tableTop);
      doc.text('Price', colX.price, tableTop);
      doc.text('GST%', colX.gst, tableTop);
      doc.text('Disc', colX.disc, tableTop);
      doc.text('Total', colX.total, tableTop);

      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // ── Items ──
      doc.font('Helvetica').fontSize(9);
      for (const item of data.items) {
        const y = doc.y;
        doc.text(item.productName.substring(0, 30), colX.item, y, { width: 200 });
        doc.text(String(item.quantity), colX.qty, y);
        doc.text(`₹${item.unitPrice.toFixed(2)}`, colX.price, y);
        doc.text(`${item.gstPercentage}%`, colX.gst, y);
        doc.text(`₹${item.discount.toFixed(2)}`, colX.disc, y);
        doc.text(`₹${item.totalPrice.toFixed(2)}`, colX.total, y);
        doc.moveDown(0.5);
      }

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // ── Totals ──
      const totalsX = 400;
      doc.fontSize(9).font('Helvetica');
      doc.text(`Subtotal:`, totalsX, doc.y);
      doc.text(`₹${data.subtotal.toFixed(2)}`, colX.total, doc.y - 11);

      if (data.discountAmount > 0) {
        doc.text(`Discount:`, totalsX);
        doc.text(`-₹${data.discountAmount.toFixed(2)}`, colX.total, doc.y - 11);
      }

      if (data.cgst > 0) {
        doc.text(`CGST:`, totalsX);
        doc.text(`₹${data.cgst.toFixed(2)}`, colX.total, doc.y - 11);
      }
      if (data.sgst > 0) {
        doc.text(`SGST:`, totalsX);
        doc.text(`₹${data.sgst.toFixed(2)}`, colX.total, doc.y - 11);
      }
      if (data.igst > 0) {
        doc.text(`IGST:`, totalsX);
        doc.text(`₹${data.igst.toFixed(2)}`, colX.total, doc.y - 11);
      }

      doc.moveDown(0.3);
      doc.moveTo(totalsX, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`TOTAL:`, totalsX);
      doc.text(`₹${data.totalAmount.toFixed(2)}`, colX.total, doc.y - 14);
      doc.moveDown(0.3);

      // Payment method + status block
      const methodLabel: Record<string, string> = {
        CASH: 'Cash',
        UPI: 'UPI / QR Code',
        CARD: 'Card (POS)',
        CREDIT: 'Credit (Due)',
      };
      const paid = data.paidAmount >= data.totalAmount;

      doc.fontSize(9).font('Helvetica');
      doc.text(
        `Payment Method: ${methodLabel[data.paymentMode] ?? data.paymentMode}`,
        totalsX
      );
      doc.text(`Paid: ₹${data.paidAmount.toFixed(2)}`, totalsX);

      if (data.paymentMode === 'UPI') {
        doc.fillColor('#6D28D9').text('Status: PAID via UPI', totalsX);
        doc.fillColor('#000000');
      } else if (paid) {
        doc.fillColor('#059669').text('Status: PAID', totalsX);
        doc.fillColor('#000000');
      } else {
        doc.font('Helvetica-Bold').fillColor('#DC2626');
        doc.text(`Due: ₹${(data.totalAmount - data.paidAmount).toFixed(2)}`, totalsX);
        doc.fillColor('#000000').font('Helvetica');
        doc.text('Status: CREDIT PENDING', totalsX);
      }

      // ── Footer ──
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#888888');
      doc.text('Thank you for your business!', { align: 'center' });
      doc.text('Powered by RetailFlow AI', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
