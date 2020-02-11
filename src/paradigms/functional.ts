interface Reference {
  id: string;
  price: number;
}

interface InvoiceLine {
  reference: Reference;
  quantity: number;
}

export interface Invoice {
  lines: InvoiceLine[];
}

function computeInvoiceLinePrice({ reference: { price }, quantity }: InvoiceLine): number {
  return price * quantity;
}

function sum(a: number, b: number): number {
  return a + b;
}

export function computeInvoicePrice({ lines }: Invoice): number {
  return lines.map(computeInvoiceLinePrice).reduce(sum, 0);
}
