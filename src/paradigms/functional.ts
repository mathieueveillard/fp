interface Reference {
  id: string;
  price: number;
}

interface Item {
  reference: Reference;
  quantity: number;
}

export interface Invoice {
  items: Item[];
}

function computeItemPrice({ reference: { price }, quantity }: Item): number {
  return price * quantity;
}

function sum(a: number, b: number): number {
  return a + b;
}

export function computeTotalPrice({ items }: Invoice): number {
  return items.map(computeItemPrice).reduce(sum, 0);
}
