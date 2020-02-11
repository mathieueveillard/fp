export class Reference {
  constructor(private id: string, private price: number) {}

  public getId(): string {
    return this.id;
  }

  public getPrice(): number {
    return this.price;
  }
}

class InvoiceLine {
  constructor(private reference: Reference, private quantity: number) {}

  public computePrice(): number {
    return this.reference.getPrice() * this.quantity;
  }
}

export class Invoice {
  private lines: InvoiceLine[] = [];

  public addReference(reference: Reference, quantity: number): void {
    this.lines.push(new InvoiceLine(reference, quantity));
  }

  public computePrice(): number {
    let totalPrice: number = 0;
    this.lines.forEach(line => {
      totalPrice += line.computePrice();
    });
    return totalPrice;
  }
}
