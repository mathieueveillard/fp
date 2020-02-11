import { Invoice, computeTotalPrice } from "./functional";

describe("Invoice (functional)", function() {
  it("should initialize the total price when there is no item", function() {
    const invoice: Invoice = {
      items: []
    };
    expect(computeTotalPrice(invoice)).toEqual(0);
  });

  it("should allow to add one single item of a Reference and compute price accordingly", function() {
    const invoice: Invoice = {
      items: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 1
        }
      ]
    };
    expect(computeTotalPrice(invoice)).toEqual(50);
  });

  it("should allow to add two items of the same reference and compute price accordingly", function() {
    const invoice: Invoice = {
      items: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 2
        }
      ]
    };
    expect(computeTotalPrice(invoice)).toEqual(100);
  });

  it("should allow to add many items of the various references and compute price accordingly", function() {
    const invoice: Invoice = {
      items: [
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 50
          },
          quantity: 2
        },
        {
          reference: {
            id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
            price: 30
          },
          quantity: 1
        }
      ]
    };
    expect(computeTotalPrice(invoice)).toEqual(130);
  });
});
