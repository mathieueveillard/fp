import { Invoice, Reference } from "./oop";

describe("Invoice (OOP)", function() {
  it("should initialize the total price when there is no item", function() {
    const invoice = new Invoice();
    expect(invoice.computeTotalPrice()).toEqual(0);
  });

  it("should allow to add one single item of a Reference and compute price accordingly", function() {
    const invoice = new Invoice();
    const reference = new Reference("5f8e5092-22fe-4e4f-897f-2948e3b4d507", 50);
    invoice.addReference(reference, 1);
    expect(invoice.computeTotalPrice()).toEqual(50);
  });

  it("should allow to add two items of the same reference and compute price accordingly", function() {
    const invoice = new Invoice();
    const reference = new Reference("5f8e5092-22fe-4e4f-897f-2948e3b4d507", 50);
    invoice.addReference(reference, 2);
    expect(invoice.computeTotalPrice()).toEqual(100);
  });

  it("should allow to add many items of the various references and compute price accordingly", function() {
    const invoice = new Invoice();
    const reference0 = new Reference("5f8e5092-22fe-4e4f-897f-2948e3b4d507", 50);
    const reference1 = new Reference("b2cb27dc-339f-4eeb-aa94-31b4ddaa8e92", 30);
    invoice.addReference(reference0, 2);
    invoice.addReference(reference1, 1);
    expect(invoice.computeTotalPrice()).toEqual(130);
  });
});
