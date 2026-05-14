// Thermal printer integration stub
// Replace with actual printer SDK (escpos, node-thermal-printer, etc.)

import { logger } from '../../config/logger';

export interface PrintConfig {
  type: 'thermal' | 'a4' | 'none';
  width?: number;
  name?: string;
}

export interface PrintInvoiceData {
  invoiceNumber: string;
  shopName: string;
  branchName: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMode: string;
  cashierName: string;
  date: Date;
}

/**
 * Print invoice to thermal printer. Currently a stub.
 */
export async function printInvoice(config: PrintConfig, data: PrintInvoiceData): Promise<boolean> {
  if (config.type === 'none') {
    logger.info('[PRINTER] Printing disabled');
    return false;
  }

  logger.info(`[PRINTER] Print stub (${config.type}): Invoice ${data.invoiceNumber}`);

  // TODO: Implement with node-thermal-printer or escpos
  // const printer = new ThermalPrinter({ type: config.type, width: config.width });
  // printer.println(data.shopName);
  // ...

  return true;
}
