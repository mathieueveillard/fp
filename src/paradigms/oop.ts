export class Reference {
  constructor(private id: string, private price: number) {}

  public getId(): string {
    return this.id;
  }

  public getPrice(): number {
    return this.price;
  }
}

class Item {
  constructor(private reference: Reference, private quantity: number) {}

  public computeTotalPrice(): number {
    return this.reference.getPrice() * this.quantity;
  }
}

export class Invoice {
  private items: Item[] = [];

  public addReference(reference: Reference, quantity: number): void {
    this.items.push(new Item(reference, quantity));
  }

  public computeTotalPrice(): number {
    let totalPrice: number = 0;
    this.items.forEach(item => {
      totalPrice += item.computeTotalPrice();
    });
    return totalPrice;
  }
}
